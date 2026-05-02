import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { config } from '../config'
import type {
  DownloadProgress,
  DownloadHistoryItem,
  DownloadInitResponse,
} from './downloadTypes'

interface SpeedSample {
  timestamp: number
  speed: number
  bytes: number
}

interface DownloadStats {
  totalDownloads: number
  completedDownloads: number
  failedDownloads: number
  cancelledDownloads: number
  totalBytesDownloaded: number
  averageSpeed: number
  peakSpeed: number
  successRate: number
}

export const useDownloadStore = defineStore('download', () => {
  const downloadProgress = ref<DownloadProgress | null>(null)
  const history = ref<DownloadHistoryItem[]>([])
  const historyTotal = ref(0)
  const isLoadingHistory = ref(false)
  const error = ref<string | null>(null)
  const isDownloading = ref(false)
  const abortController = ref<AbortController | null>(null)

  const speedHistory = ref<SpeedSample[]>([])
  let speedHistoryInterval: ReturnType<typeof setInterval> | null = null

  const currentProgress = computed(() => downloadProgress.value?.progress ?? 0)
  const currentSpeed = computed(() => downloadProgress.value?.speed ?? 0)
  const currentStatus = computed(() => downloadProgress.value?.status ?? 'pending')

  const downloadStats = computed<DownloadStats>(() => {
    const items = history.value
    const completed = items.filter(i => i.status === 'completed')
    const failed = items.filter(i => i.status === 'failed')
    const cancelled = items.filter(i => i.status === 'cancelled')
    const totalBytes = items.reduce((sum, i) => sum + (i.totalBytes || i.downloadedBytes), 0)

    const completedWithDuration = completed.filter(i => i.completedAt && i.createdAt)
    const totalDuration = completedWithDuration.reduce((sum, i) => {
      const dur = new Date(i.completedAt!).getTime() - new Date(i.createdAt).getTime()
      return sum + dur
    }, 0)
    const avgSpeed = totalDuration > 0
      ? completed.reduce((sum, i) => sum + (i.totalBytes || i.downloadedBytes), 0) / (totalDuration / 1000)
      : 0

    const peakFromHistory = completed.reduce((peak, _i) => {
      return peak
    }, 0)

    return {
      totalDownloads: items.length,
      completedDownloads: completed.length,
      failedDownloads: failed.length,
      cancelledDownloads: cancelled.length,
      totalBytesDownloaded: totalBytes,
      averageSpeed: Math.round(avgSpeed),
      peakSpeed: peakFromHistory,
      successRate: items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0,
    }
  })

  const recentSpeedHistory = computed(() => {
    const now = Date.now()
    const thirtySecAgo = now - 30000
    return speedHistory.value.filter(s => s.timestamp >= thirtySecAgo)
  })

  const peakSpeed = computed(() => {
    if (speedHistory.value.length === 0) return 0
    return Math.max(...speedHistory.value.map(s => s.speed))
  })

  function clearError() {
    error.value = null
  }

  function startSpeedTracking() {
    speedHistory.value = []
    speedHistoryInterval = setInterval(() => {
      if (downloadProgress.value && downloadProgress.value.speed > 0) {
        speedHistory.value.push({
          timestamp: Date.now(),
          speed: downloadProgress.value.speed,
          bytes: downloadProgress.value.downloadedBytes,
        })
        if (speedHistory.value.length > 120) {
          speedHistory.value.shift()
        }
      }
    }, 500)
  }

  function stopSpeedTracking() {
    if (speedHistoryInterval) {
      clearInterval(speedHistoryInterval)
      speedHistoryInterval = null
    }
  }

  async function initDownload(url: string, filename?: string, rateLimit?: number): Promise<DownloadInitResponse | null> {
    clearError()
    try {
      const response = await axios.post<DownloadInitResponse>(
        `${config.api.workerUrl}/download/init`,
        { url, filename, rateLimit },
        { timeout: 20000 },
      )
      return response.data
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.message || '初始化下载失败'
      error.value = msg
      return null
    }
  }

  async function startStreamDownload(downloadId: string, downloadUrl: string, filename: string, contentType: string, rateLimit?: number, totalBytes?: number) {
    clearError()
    isDownloading.value = true
    downloadProgress.value = {
      downloadId,
      url: downloadUrl,
      filename,
      status: 'downloading',
      totalBytes: totalBytes || 0,
      downloadedBytes: 0,
      progress: 0,
      speed: 0,
      startTime: Date.now(),
      contentType,
    }

    startSpeedTracking()

    const controller = new AbortController()
    abortController.value = controller

    const streamUrl = `${config.api.workerUrl}/download/stream?id=${downloadId}&url=${encodeURIComponent(downloadUrl)}${rateLimit ? `&rateLimit=${rateLimit}` : ''}`

    try {
      const response = await fetch(streamUrl, {
        signal: controller.signal,
      })

      if (!response.ok) {
        const errText = await response.text()
        let errMsg = `HTTP ${response.status}`
        try {
          const errJson = JSON.parse(errText)
          errMsg = errJson.error?.message || errMsg
        } catch {}
        throw new Error(errMsg)
      }

      const contentDisposition = response.headers.get('Content-Disposition')
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i)
        if (match?.[1]) {
          filename = decodeURIComponent(match[1])
        }
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('浏览器不支持流式读取')
      }

      const chunks: Uint8Array[] = []
      let downloadedBytes = 0
      let lastProgressTime = Date.now()
      let lastBytesCount = 0
      let avgSpeedSum = 0
      let avgSpeedCount = 0

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          const endTime = Date.now()
          const blob = new Blob(chunks as unknown as BlobPart[], { type: contentType })
          triggerDownload(blob, filename)

          downloadProgress.value = {
            ...downloadProgress.value!,
            status: 'completed',
            downloadedBytes,
            progress: 100,
            speed: 0,
            endTime,
          }
          isDownloading.value = false
          stopSpeedTracking()
          await fetchHistory(20, 0)
          return
        }

        chunks.push(value)
        downloadedBytes += value.length

        const now = Date.now()
        if (now - lastProgressTime >= 200) {
          const elapsed = now - lastProgressTime
          const chunkBytes = downloadedBytes - lastBytesCount
          const speed = elapsed > 0 ? (chunkBytes / elapsed) * 1000 : 0
          avgSpeedSum += speed
          avgSpeedCount++

          downloadProgress.value = {
            ...downloadProgress.value!,
            status: 'downloading',
            downloadedBytes,
            speed: Math.round(speed),
            progress: downloadProgress.value!.totalBytes > 0
              ? Math.min(99, Math.round((downloadedBytes / downloadProgress.value!.totalBytes) * 100))
              : Math.min(99, Math.round(downloadedBytes / 1024)),
          }
          lastProgressTime = now
          lastBytesCount = downloadedBytes
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        downloadProgress.value = {
          ...downloadProgress.value!,
          status: 'cancelled',
          endTime: Date.now(),
        }
      } else {
        downloadProgress.value = {
          ...downloadProgress.value!,
          status: 'failed',
          error: e.message || '下载失败',
          endTime: Date.now(),
        }
        error.value = e.message || '下载失败'
      }
      isDownloading.value = false
      stopSpeedTracking()
      await fetchHistory(20, 0)
    }
  }

  function cancelDownload() {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function fetchHistory(limit: number = 20, offset: number = 0) {
    isLoadingHistory.value = true
    try {
      const response = await axios.get<{
        success: boolean
        data: DownloadHistoryItem[]
        total: number
      }>(
        `${config.api.workerUrl}/download/history`,
        { params: { limit, offset }, timeout: 10000 },
      )
      if (response.data.success) {
        if (offset === 0) {
          history.value = response.data.data
        } else {
          history.value = [...history.value, ...response.data.data]
        }
        historyTotal.value = response.data.total
      }
    } catch {
    } finally {
      isLoadingHistory.value = false
    }
  }

  async function deleteHistoryItem(downloadId: string) {
    try {
      await axios.delete(`${config.api.workerUrl}/download/history`, {
        params: { id: downloadId },
        timeout: 10000,
      })
      history.value = history.value.filter(item => item.id !== downloadId)
      historyTotal.value = Math.max(0, historyTotal.value - 1)
    } catch (e: any) {
      error.value = e?.response?.data?.error?.message || '删除失败'
    }
  }

  function resetDownload() {
    downloadProgress.value = null
    error.value = null
    isDownloading.value = false
    abortController.value = null
    speedHistory.value = []
    stopSpeedTracking()
  }

  return {
    downloadProgress,
    history,
    historyTotal,
    isLoadingHistory,
    error,
    isDownloading,
    currentProgress,
    currentSpeed,
    currentStatus,
    speedHistory,
    recentSpeedHistory,
    peakSpeed,
    downloadStats,
    clearError,
    initDownload,
    startStreamDownload,
    cancelDownload,
    triggerDownload,
    fetchHistory,
    deleteHistoryItem,
    resetDownload,
  }
})
