import { onMounted, ref, watch } from 'vue'
import { useFileManagerStore } from '../stores/fileManager'
import { useAuthStore } from '../../stores/authStore'
import { filesystem } from '../../utils/filesystem'
import { config } from '../../config'
import type { FileItem } from '../types'

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
  'tsx',
  'jsx',
  'css',
  'scss',
  'html',
  'vue',
  'py',
  'sh',
  'bash',
  'desktop',
  'sql',
  'csv',
  'tsv',
  'ini',
  'toml',
  'env',
  'rs',
  'go',
  'java',
  'c',
  'cpp',
  'h',
  'hpp',
]

export interface LocalUploadResult {
  localSuccess: number
  localFail: number
  files: Array<{ file: File; path: string }>
}

function getExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() || ''
}

/** Public alias — consumers historically called this `getFileExtension`. */
export function getFileExtension(name: string): string {
  return getExtension(name)
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\.\.+/g, '_')
}

export function isImageFile(name: string): boolean {
  return IMAGE_EXTS.includes(getExtension(name))
}

export function isAudioFile(name: string): boolean {
  return AUDIO_EXTS.includes(getExtension(name))
}

export function isVideoFile(name: string): boolean {
  return VIDEO_EXTS.includes(getExtension(name))
}

export function isTextFile(name: string): boolean {
  return TEXT_EXTS.includes(getExtension(name))
}

export function ensureDirectory(path: string): boolean {
  const parts = path.split('/').filter(Boolean)
  let current = ''
  for (const part of parts) {
    current += '/' + part
    const node = filesystem.getNodeByPath(current)
    if (!node) {
      const ok = filesystem.createDirectory(current)
      if (!ok) return false
    } else if (node.type !== 'directory') {
      return false
    }
  }
  return true
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

export interface CloudSyncResult {
  success: number
  fail: number
  networkError: boolean
}

export function useFileManagerOps() {
  const fmStore = useFileManagerStore()
  const authStore = useAuthStore()
  const searchText = ref(fmStore.searchQuery)

  watch(searchText, (val) => {
    fmStore.setSearch(val)
  })

  onMounted(() => {
    fmStore.loadDirectory(fmStore.currentPath)
  })

  function currentPathForName(name: string): string {
    return fmStore.currentPath === '/' ? '/' + name : fmStore.currentPath + '/' + name
  }

  function loadFiles(path = fmStore.currentPath): void {
    fmStore.loadDirectory(path)
  }

  function createFile(name: string, content = ''): boolean {
    const ok = filesystem.createFile(currentPathForName(name), content)
    if (ok) loadFiles()
    return ok
  }

  function createFolder(name: string): boolean {
    const ok = filesystem.createDirectory(currentPathForName(name))
    if (ok) loadFiles()
    return ok
  }

  function deleteFile(name: string): boolean {
    const ok = filesystem.deleteNode(currentPathForName(name))
    if (ok) loadFiles()
    return ok
  }

  function renameFile(oldName: string, newName: string): boolean {
    if (oldName === newName) return true
    const ok = filesystem.moveNode(currentPathForName(oldName), currentPathForName(newName))
    if (ok) loadFiles()
    return ok
  }

  function moveFile(oldPath: string, newPath: string): boolean {
    const ok = filesystem.moveNode(oldPath, newPath)
    if (ok) loadFiles()
    return ok
  }

  function writeFile(path: string, content: string): boolean {
    const ok = filesystem.writeFile(path, content)
    if (ok) loadFiles()
    return ok
  }

  async function uploadLocalFiles(
    files: FileList | File[],
    sanitize = false
  ): Promise<LocalUploadResult> {
    const result: LocalUploadResult = { localSuccess: 0, localFail: 0, files: [] }
    for (const file of Array.from(files)) {
      const name = sanitize ? sanitizeFileName(file.name) : file.name
      const path = currentPathForName(name)
      try {
        const content = await readFileAsLocal(file)
        const existingNode = filesystem.getNodeByPath(path)
        if (existingNode && existingNode.type === 'file') {
          filesystem.writeFile(path, content)
        } else {
          filesystem.createFile(path, content)
        }
        result.localSuccess++
        result.files.push({ file, path })
      } catch (error) {
        console.error('[FileManager] Failed to store file locally:', error)
        result.localFail++
      }
    }
    loadFiles()
    return result
  }

  function openDirectory(file: FileItem): boolean {
    if (!file.isDirectory) return false
    fmStore.navigateTo(file.path)
    return true
  }

  async function uploadToCloud(
    localFiles: LocalUploadResult['files'],
  ): Promise<{ cloudSuccess: number; cloudFail: number }> {
    if (!authStore.userId) return { cloudSuccess: 0, cloudFail: 0 }
    let cloudSuccess = 0
    let cloudFail = 0
    for (const { file, path } of localFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('path', path)
        const response = await authStore.authFetch(`${config.api.workerUrl}/files/upload`, {
          method: 'POST',
          body: formData,
        })
        if (response.ok) {
          cloudSuccess++
        } else {
          const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
          console.error('[FileManager] Cloud upload failed:', data['error'] || response.statusText)
          cloudFail++
        }
      } catch (err) {
        console.error('[FileManager] Cloud upload error:', err)
        cloudFail++
      }
    }
    return { cloudSuccess, cloudFail }
  }

  async function syncCloudFiles(): Promise<CloudSyncResult> {
    if (!authStore.userId || fmStore.cloudSyncing) return { success: 0, fail: 0, networkError: false }
    fmStore.cloudSyncing = true
    let success = 0
    let fail = 0
    try {
      const response = await authStore.authFetch(`${config.api.workerUrl}/files`)
      if (!response.ok) return { success: 0, fail: 0, networkError: true }
      const result = (await response.json()) as { data?: Array<{ key: string; contentType?: string }> }
      const cloudFiles = result.data || []
      for (const file of cloudFiles) {
        try {
          const downloadRes = await authStore.authFetch(
            `${config.api.workerUrl}/files/${encodeURIComponent(file.key)}`,
          )
          if (!downloadRes.ok) {
            fail++
            continue
          }
          const blob = await downloadRes.blob()
          const isText =
            (file.contentType || '').startsWith('text/') ||
            /\.(txt|md|json|js|ts|css|html|vue|xml|yaml|csv)$/i.test(file.key)
          const content = isText
            ? await blob.text()
            : await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })
          const path = `/home/scp/downloads/${file.key}`
          const dirPath = path.substring(0, path.lastIndexOf('/'))
          if (dirPath && !ensureDirectory(dirPath)) {
            fail++
            continue
          }
          const existingNode = filesystem.getNodeByPath(path)
          const ok =
            existingNode?.type === 'file'
              ? filesystem.writeFile(path, content)
              : filesystem.createFile(path, content)
          if (ok) {
            success++
          } else {
            fail++
          }
        } catch {
          fail++
        }
      }
      fmStore.loadDirectory(fmStore.currentPath)
    } finally {
      fmStore.cloudSyncing = false
    }
    return { success, fail, networkError: false }
  }

  return {
    fmStore,
    searchText,
    loadFiles,
    createFile,
    createFolder,
    deleteFile,
    renameFile,
    moveFile,
    writeFile,
    uploadLocalFiles,
    currentPathForName,
    openDirectory,
    uploadToCloud,
    syncCloudFiles,
    formatSize,
    formatDate,
    sanitizeFileName,
    ensureDirectory,
    readFileAsLocal,
    isImageFile,
    isAudioFile,
    isVideoFile,
    isTextFile,
    IMAGE_EXTS,
    AUDIO_EXTS,
    VIDEO_EXTS,
    TEXT_EXTS,
  }
}
