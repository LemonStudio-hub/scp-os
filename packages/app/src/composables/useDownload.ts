import { ref } from 'vue'
import { useDownloadStore } from '../stores/downloadStore'

export function useDownload() {
  const store = useDownloadStore()
  const downloadUrl = ref('')
  const customFilename = ref('')
  const rateLimitKBps = ref(0)
  const showAdvanced = ref(false)

  const VALID_URL_REGEX = /^https?:\/\/.+/i

  function validateInput(): string | null {
    const url = downloadUrl.value.trim()
    if (!url) {
      return '请输入下载链接'
    }
    if (!VALID_URL_REGEX.test(url)) {
      return '请输入有效的 HTTP/HTTPS 链接'
    }
    return null
  }

  async function startDownload() {
    store.clearError()
    const validationError = validateInput()
    if (validationError) {
      store.error = validationError
      return
    }

    const url = downloadUrl.value.trim()
    const filename = customFilename.value.trim() || undefined
    const rateLimit = rateLimitKBps.value > 0 ? rateLimitKBps.value * 1024 : undefined

    const initResult = await store.initDownload(url, filename, rateLimit)
    if (!initResult || !initResult.success) {
      return
    }

    await store.startStreamDownload(
      initResult.downloadId,
      url,
      initResult.filename,
      initResult.contentType,
      rateLimit,
    )
  }

  function cancel() {
    store.cancelDownload()
  }

  function reset() {
    store.resetDownload()
    downloadUrl.value = ''
    customFilename.value = ''
    rateLimitKBps.value = 0
    showAdvanced.value = false
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const value = bytes / Math.pow(1024, i)
    return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
  }

  function formatSpeed(bytesPerSec: number): string {
    return `${formatBytes(bytesPerSec)}/s`
  }

  function formatTimeAgo(dateStr: string): string {
    const now = Date.now()
    const date = new Date(dateStr).getTime()
    const diff = now - date
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return `${Math.floor(diff / 86400000)} 天前`
  }

  function formatDuration(ms: number): string {
    if (ms < 1000) return '< 1s'
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  function formatETA(seconds: number): string {
    if (seconds <= 0 || !isFinite(seconds)) return '--'
    if (seconds < 60) return `${Math.ceil(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.ceil(seconds % 60)
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  function calcETA(downloadedBytes: number, totalBytes: number, speed: number): number {
    if (speed <= 0 || totalBytes <= 0 || downloadedBytes >= totalBytes) return 0
    return (totalBytes - downloadedBytes) / speed
  }

  function calcProgressPercent(downloadedBytes: number, totalBytes: number): number {
    if (totalBytes <= 0) return 0
    return Math.min(100, Math.round((downloadedBytes / totalBytes) * 100))
  }

  return {
    downloadUrl,
    customFilename,
    rateLimitKBps,
    showAdvanced,
    store,
    validateInput,
    startDownload,
    cancel,
    reset,
    formatBytes,
    formatSpeed,
    formatTimeAgo,
    formatDuration,
    formatETA,
    calcETA,
    calcProgressPercent,
  }
}
