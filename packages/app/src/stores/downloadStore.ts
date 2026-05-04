import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import axios from 'axios'
import { config } from '../config'
import type { DownloadProgress, DownloadHistoryItem, DownloadInitResponse } from './downloadTypes'

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
  const downloadProgress = shallowRef<DownloadProgress | null>(null)
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
    let completed = 0,
      failed = 0,
      cancelled = 0
    let totalBytes = 0,
      totalDuration = 0,
      completedBytes = 0

    for (const item of items) {
      const bytes = item.totalBytes || item.downloadedBytes
      if (item.status === 'completed') {
        completed++
        totalBytes += bytes
        completedBytes += bytes
        if (item.completedAt && item.createdAt) {
          totalDuration += new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime()
        }
      } else if (item.status === 'failed') {
        failed++
        totalBytes += bytes
      } else if (item.status === 'cancelled') {
        cancelled++
        totalBytes += bytes
      } else {
        totalBytes += bytes
      }
    }

    const avgSpeed = totalDuration > 0 ? completedBytes / (totalDuration / 1000) : 0

    return {
      totalDownloads: items.length,
      completedDownloads: completed,
      failedDownloads: failed,
      cancelledDownloads: cancelled,
      totalBytesDownloaded: totalBytes,
      averageSpeed: Math.round(avgSpeed),
      peakSpeed: 0,
      successRate: items.length > 0 ? Math.round((completed / items.length) * 100) : 0,
    }
  })

  const recentSpeedHistory = computed(() => {
    const now = Date.now()
    const thirtySecAgo = now - 30000
    return speedHistory.value.filter((s) => s.timestamp >= thirtySecAgo)
  })

  const peakSpeed = computed(() => {
    if (speedHistory.value.length === 0) return 0
    return Math.max(...speedHistory.value.map((s) => s.speed))
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

  function updateProgress(patch: Partial<DownloadProgress>) {
    const current = downloadProgress.value
    if (!current) return
    downloadProgress.value = Object.assign({}, current, patch)
  }

  async function initDownload(
    url: string,
    filename?: string,
    rateLimit?: number
  ): Promise<DownloadInitResponse | null> {
    clearError()
    try {
      const response = await axios.post<DownloadInitResponse>(
        `${config.api.workerUrl}/download/init`,
        { url, filename, rateLimit },
        { timeout: 20000 }
      )
      return response.data
    } catch (e: any) {
      const msg =
        e?.response?.data?.error?.message ||
        e?.message ||
        '\u521d\u59cb\u5316\u4e0b\u8f7d\u5931\u8d25'
      error.value = msg
      return null
    }
  }

  async function startStreamDownload(
    downloadId: string,
    downloadUrl: string,
    filename: string,
    contentType: string,
    rateLimit?: number,
    totalBytes?: number
  ) {
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

      if (!response.body) {
        const arrayBuffer = await response.arrayBuffer()
        const blob = new Blob([arrayBuffer], { type: contentType })
        triggerDownload(blob, filename)
        updateProgress({
          status: 'completed',
          downloadedBytes: arrayBuffer.byteLength,
          progress: 100,
          speed: 0,
          endTime: Date.now(),
        })
        isDownloading.value = false
        stopSpeedTracking()
        await fetchHistory(20, 0)
        return
      }

      const reader = response.body.getReader()
      const chunks: Uint8Array[] = []
      let totalChunkBytes = 0
      let lastProgressTime = Date.now()
      let lastBytesCount = 0

      const PROGRESS_INTERVAL = 300

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          const endTime = Date.now()
          const blob = new Blob(chunks as unknown as BlobPart[], { type: contentType })
          triggerDownload(blob, filename)

          updateProgress({
            status: 'completed',
            downloadedBytes: totalChunkBytes,
            progress: 100,
            speed: 0,
            endTime,
          })
          isDownloading.value = false
          stopSpeedTracking()
          await fetchHistory(20, 0)
          return
        }

        chunks.push(value)
        totalChunkBytes += value.length

        const now = Date.now()
        if (now - lastProgressTime >= PROGRESS_INTERVAL) {
          const elapsed = now - lastProgressTime
          const chunkBytes = totalChunkBytes - lastBytesCount
          const speed = elapsed > 0 ? (chunkBytes / elapsed) * 1000 : 0

          const currentTotal = downloadProgress.value?.totalBytes ?? 0
          updateProgress({
            status: 'downloading',
            downloadedBytes: totalChunkBytes,
            speed: Math.round(speed),
            progress:
              currentTotal > 0
                ? Math.min(99, Math.round((totalChunkBytes / currentTotal) * 100))
                : Math.min(99, Math.round(totalChunkBytes / 1024)),
          })
          lastProgressTime = now
          lastBytesCount = totalChunkBytes
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        updateProgress({
          status: 'cancelled',
          endTime: Date.now(),
        })
      } else {
        updateProgress({
          status: 'failed',
          error: e.message || '\u4e0b\u8f7d\u5931\u8d25',
          endTime: Date.now(),
        })
        error.value = e.message || '\u4e0b\u8f7d\u5931\u8d25'
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
      }>(`${config.api.workerUrl}/download/history`, { params: { limit, offset }, timeout: 10000 })
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
      history.value = history.value.filter((item) => item.id !== downloadId)
      historyTotal.value = Math.max(0, historyTotal.value - 1)
    } catch (e: any) {
      error.value = e?.response?.data?.error?.message || '\u5220\u9664\u5931\u8d25'
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
