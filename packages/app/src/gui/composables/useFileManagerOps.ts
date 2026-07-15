import { ref } from 'vue'
import { useI18n } from './useI18n'
import { useFileManagerStore } from '../stores/fileManager'
import { useAuthStore } from '../../stores/authStore'
import { config } from '../../config'
import { filesystem } from '../../utils/filesystem'
import logger from '../../utils/logger'

export const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico']
export const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a']
export const VIDEO_EXTS = ['mp4', 'webm', 'avi', 'mov', 'mkv']
export const TEXT_EXTS = [
  'txt',
  'md',
  'log',
  'json',
  'xml',
  'yml',
  'yaml',
  'js',
  'ts',
  'css',
  'html',
  'vue',
  'py',
  'sh',
  'desktop',
]

export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function isImageFile(filename: string): boolean {
  return IMAGE_EXTS.includes(getFileExtension(filename))
}

export function isAudioFile(filename: string): boolean {
  return AUDIO_EXTS.includes(getFileExtension(filename))
}

export function isVideoFile(filename: string): boolean {
  return VIDEO_EXTS.includes(getFileExtension(filename))
}

export function isTextFile(filename: string): boolean {
  return TEXT_EXTS.includes(getFileExtension(filename))
}

export function readFileAsLocal(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (
      file.type.startsWith('text/') ||
      /\.(txt|md|json|js|ts|css|html|vue|py|sh|xml|yaml|yml|sql|log|csv|tsv)$/i.test(file.name)
    ) {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    } else {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    }
  })
}

export function useFileManagerOps() {
  const { t } = useI18n()
  const fmStore = useFileManagerStore()
  const authStore = useAuthStore()

  const fileInputRef = ref<HTMLInputElement | null>(null)
  const cloudSyncing = ref(false)

  function triggerUpload() {
    fileInputRef.value?.click()
  }

  /** Dual-write: local VFS always; R2 when registered user is logged in. */
  async function onFileUpload(
    event: Event
  ): Promise<{ success: number; fail: number; cloudSuccess: number; cloudFail: number }> {
    const input = event.target as HTMLInputElement
    const files = input.files
    if (!files || files.length === 0) return { success: 0, fail: 0, cloudSuccess: 0, cloudFail: 0 }

    let successCount = 0
    let failCount = 0
    let cloudSuccess = 0
    let cloudFail = 0
    const canCloud = authStore.canUseCloudSync

    for (const file of files) {
      const path =
        fmStore.currentPath === '/' ? '/' + file.name : fmStore.currentPath + '/' + file.name

      try {
        const content = await readFileAsLocal(file)
        const existingNode = filesystem.getNodeByPath(path)
        if (existingNode && existingNode.type === 'file') {
          filesystem.writeFile(path, content)
        } else {
          filesystem.createFile(path, content)
        }
        successCount++

        if (canCloud) {
          try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('path', path.replace(/^\//, ''))
            const response = await authStore.authFetch(`${config.api.workerUrl}/files/upload`, {
              method: 'POST',
              body: formData,
            })
            if (response.ok) {
              cloudSuccess++
            } else {
              const data = (await response.json().catch(() => ({}))) as { error?: string }
              logger.error('[FileManager] Cloud upload failed:', data.error || response.statusText)
              cloudFail++
            }
          } catch (err) {
            logger.error('[FileManager] Cloud upload error:', err)
            cloudFail++
          }
        }
      } catch (error) {
        logger.error('[FileManager] Failed to store file locally:', error)
        failCount++
      }
    }

    fmStore.loadDirectory(fmStore.currentPath)
    input.value = ''

    return { success: successCount, fail: failCount, cloudSuccess, cloudFail }
  }

  /** Download all cloud files for the registered user into the local VFS. */
  async function syncFromCloud(): Promise<{ success: number; fail: number; error?: string }> {
    if (!authStore.canUseCloudSync) {
      return { success: 0, fail: 0, error: 'Registered account required' }
    }
    if (cloudSyncing.value) return { success: 0, fail: 0, error: 'Sync already in progress' }

    cloudSyncing.value = true
    let success = 0
    let fail = 0
    try {
      const listRes = await authStore.authFetch(`${config.api.workerUrl}/files`)
      if (!listRes.ok) {
        return { success: 0, fail: 0, error: `List failed: HTTP ${listRes.status}` }
      }
      const listBody = (await listRes.json()) as {
        success: boolean
        data?: Array<{ key: string; name: string }>
      }
      const cloudFiles = listBody.data || []

      for (const file of cloudFiles) {
        try {
          const downloadRes = await authStore.authFetch(
            `${config.api.workerUrl}/files/${encodeURIComponent(file.key)}`
          )
          if (!downloadRes.ok) {
            fail++
            continue
          }
          const contentType = downloadRes.headers.get('Content-Type') || ''
          const path = file.key.startsWith('/') ? file.key : `/${file.key}`
          let content: string
          if (contentType.startsWith('text/') || contentType.includes('json')) {
            content = await downloadRes.text()
          } else {
            const buf = await downloadRes.arrayBuffer()
            const bytes = new Uint8Array(buf)
            let binary = ''
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
            const b64 = btoa(binary)
            content = `data:${contentType || 'application/octet-stream'};base64,${b64}`
          }
          // Ensure parent dirs exist
          const parts = path.split('/').filter(Boolean)
          let walk = ''
          for (let i = 0; i < parts.length - 1; i++) {
            walk += `/${parts[i]}`
            if (!filesystem.getNodeByPath(walk)) {
              filesystem.createDirectory(walk)
            }
          }
          const existing = filesystem.getNodeByPath(path)
          if (existing && existing.type === 'file') {
            filesystem.writeFile(path, content)
          } else if (!existing) {
            filesystem.createFile(path, content)
          }
          success++
        } catch (err) {
          logger.error('[FileManager] Cloud download failed:', file.key, err)
          fail++
        }
      }
      fmStore.loadDirectory(fmStore.currentPath)
      return { success, fail }
    } catch (err) {
      logger.error('[FileManager] syncFromCloud error:', err)
      return { success, fail, error: (err as Error).message }
    } finally {
      cloudSyncing.value = false
    }
  }

  function createFile(name: string): void {
    const path = fmStore.currentPath === '/' ? '/' + name : fmStore.currentPath + '/' + name
    try {
      filesystem.createFile(path, '')
      fmStore.loadDirectory(fmStore.currentPath)
    } catch (error) {
      console.error('[FileManager] Failed to create file:', error)
    }
  }

  function createFolder(name: string): void {
    const path = fmStore.currentPath === '/' ? '/' + name : fmStore.currentPath + '/' + name
    try {
      filesystem.createDirectory(path)
      fmStore.loadDirectory(fmStore.currentPath)
    } catch (error) {
      console.error('[FileManager] Failed to create folder:', error)
    }
  }

  function renameFile(oldName: string, newName: string): void {
    const oldPath =
      fmStore.currentPath === '/' ? '/' + oldName : fmStore.currentPath + '/' + oldName
    const newPath =
      fmStore.currentPath === '/' ? '/' + newName : fmStore.currentPath + '/' + newName
    try {
      filesystem.rename(oldPath, newPath)
      fmStore.loadDirectory(fmStore.currentPath)
    } catch (error) {
      console.error('[FileManager] Failed to rename:', error)
    }
  }

  function deleteFile(name: string): void {
    const path = fmStore.currentPath === '/' ? '/' + name : fmStore.currentPath + '/' + name
    try {
      filesystem.remove(path)
      fmStore.loadDirectory(fmStore.currentPath)
    } catch (error) {
      console.error('[FileManager] Failed to delete:', error)
    }
  }

  return {
    t,
    fmStore,
    fileInputRef,
    cloudSyncing,
    formatSize,
    triggerUpload,
    onFileUpload,
    syncFromCloud,
    createFile,
    createFolder,
    renameFile,
    deleteFile,
  }
}
