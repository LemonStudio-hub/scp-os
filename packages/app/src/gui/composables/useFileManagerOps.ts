import { ref } from 'vue'
import { useI18n } from './useI18n'
import { useFileManagerStore } from '../stores/fileManager'
import { filesystem } from '../../utils/filesystem'

export const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico']
export const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a']
export const VIDEO_EXTS = ['mp4', 'webm', 'avi', 'mov', 'mkv']
export const TEXT_EXTS = [
  'txt', 'md', 'log', 'json', 'xml', 'yml', 'yaml',
  'js', 'ts', 'css', 'html', 'vue', 'py', 'sh', 'desktop',
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

  const fileInputRef = ref<HTMLInputElement | null>(null)

  function triggerUpload() {
    fileInputRef.value?.click()
  }

  async function onFileUpload(event: Event): Promise<{ success: number; fail: number }> {
    const input = event.target as HTMLInputElement
    const files = input.files
    if (!files || files.length === 0) return { success: 0, fail: 0 }

    let successCount = 0
    let failCount = 0

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
      } catch (error) {
        console.error('[FileManager] Failed to store file locally:', error)
        failCount++
      }
    }

    fmStore.loadDirectory(fmStore.currentPath)
    input.value = ''

    return { success: successCount, fail: failCount }
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
    formatSize,
    triggerUpload,
    onFileUpload,
    createFile,
    createFolder,
    renameFile,
    deleteFile,
  }
}
