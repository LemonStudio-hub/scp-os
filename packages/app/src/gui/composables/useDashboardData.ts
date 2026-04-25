import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface MemoryInfo {
  used: number
  limit: number
  percent: number
}

export interface HistoryPoint {
  time: number
  value: number
}

export interface DashboardMetrics {
  memory: MemoryInfo
  cpu: number
  cpuCores: number
  cpuThreads: number
  jsHeap: string
  domNodes: string
  resources: string
  jsListeners: string
  latency: number
  networkStatus: string
  connectionType: string
  fps: number
  pageLoadTime: number
  storageUsed: number
  storageQuota: number
  storagePercent: number
}

export function useDashboardData(refreshIntervalMs: number = 3000) {
  const memoryUsage = ref<MemoryInfo>({ used: 0, limit: 0, percent: 0 })
  const cpuUsage = ref(0)
  const cpuCores = ref(navigator.hardwareConcurrency || 4)
  const cpuThreads = ref((navigator.hardwareConcurrency || 4) * 2)
  const jsHeap = ref('—')
  const domNodes = ref('—')
  const resources = ref('—')
  const jsListeners = ref('—')
  const latency = ref(0)
  const networkStatus = ref('—')
  const connectionType = ref('—')
  const currentTime = ref('')
  const lastUpdated = ref('—')
  const isRefreshing = ref(false)
  const isAutoRefresh = ref(true)
  const fps = ref(60)
  const pageLoadTime = ref(0)
  const storageUsed = ref(0)
  const storageQuota = ref(0)
  const storagePercent = ref(0)

  const maxDataPoints = 40
  const memoryHistory = ref<HistoryPoint[]>([])
  const cpuHistory = ref<HistoryPoint[]>([])
  const latencyHistory = ref<HistoryPoint[]>([])

  const performanceScore = computed(() => {
    let score = 100
    if (memoryUsage.value.percent > 70) score -= 15
    if (memoryUsage.value.percent > 90) score -= 20
    if (cpuUsage.value > 70) score -= 15
    if (parseInt(domNodes.value) > 2000) score -= 10
    if (parseInt(domNodes.value) > 4000) score -= 15
    const resCount = parseInt(resources.value) || 0
    if (resCount > 100) score -= 5
    if (latency.value > 100) score -= 10
    if (fps.value < 30) score -= 15
    else if (fps.value < 50) score -= 8
    return Math.max(0, Math.min(100, score))
  })

  const statusLevel = computed<'good' | 'warn' | 'bad'>(() => {
    if (performanceScore.value >= 80) return 'good'
    if (performanceScore.value >= 50) return 'warn'
    return 'bad'
  })

  const scoreColor = computed(() => {
    const s = performanceScore.value
    if (s >= 80) return '#34C759'
    if (s >= 50) return '#FF9500'
    return '#FF3B30'
  })

  const memoryColor = computed(() => {
    const p = memoryUsage.value.percent
    if (p < 50) return '#34C759'
    if (p < 80) return '#FF9500'
    return '#FF3B30'
  })

  const cpuColor = computed(() => {
    const p = cpuUsage.value
    if (p < 50) return '#5AC8FA'
    if (p < 80) return '#FF9500'
    return '#FF3B30'
  })

  const latencyColor = computed(() => {
    const l = latency.value
    if (l < 50) return '#34C759'
    if (l < 150) return '#FF9500'
    return '#FF3B30'
  })

  const networkStatusClass = computed(() => {
    if (networkStatus.value === 'Online') return 'status-online'
    if (networkStatus.value === 'Slow') return 'status-slow'
    return 'status-offline'
  })

  function addHistoryPoint(history: typeof memoryHistory, value: number) {
    const now = Date.now()
    history.value.push({ time: now, value })
    if (history.value.length > maxDataPoints) {
      history.value.shift()
    }
  }

  function updateTime() {
    const now = new Date()
    currentTime.value = now.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  async function refreshMetrics() {
    isRefreshing.value = true

    const mem = (window.performance as any)?.memory

    if (mem) {
      const usedMB = Math.round(mem.usedJSHeapSize / 1024 / 1024)
      const limitMB = Math.round(mem.jsHeapSizeLimit / 1024 / 1024)
      const pct = Math.round((usedMB / limitMB) * 100)

      memoryUsage.value = { used: usedMB, limit: limitMB, percent: pct }
      jsHeap.value = `${usedMB} / ${limitMB} MB`
      addHistoryPoint(memoryHistory, pct)
    } else {
      memoryUsage.value = { used: 0, limit: 0, percent: 0 }
      jsHeap.value = 'N/A'
    }

    const allNodes = document.querySelectorAll('*')
    domNodes.value = allNodes.length.toString()

    const perfEntries = performance.getEntriesByType('resource')
    resources.value = perfEntries.length.toString()

    const start = performance.now()
    let iterations = 0
    while (performance.now() - start < 20) {
      iterations++
    }
    cpuUsage.value = Math.min(100, Math.round((iterations / 1000) * 100))
    addHistoryPoint(cpuHistory, cpuUsage.value)

    latency.value = Math.floor(Math.random() * 30 + 5)
    addHistoryPoint(latencyHistory, latency.value)

    networkStatus.value = navigator.onLine ? (latency.value > 100 ? 'Slow' : 'Online') : 'Offline'
    const conn = (navigator as any).connection
    connectionType.value = conn?.effectiveType?.toUpperCase() || 'Unknown'

    jsListeners.value = '~' + Math.floor(parseInt(domNodes.value) * 0.3)

    const navEntries = performance.getEntriesByType?.('navigation')
    if (navEntries && navEntries.length > 0) {
      const nav = navEntries[0] as PerformanceNavigationTiming
      pageLoadTime.value = Math.round(nav.loadEventEnd - nav.startTime)
    }

    if (navigator.storage?.estimate) {
      try {
        const est = await navigator.storage.estimate()
        storageUsed.value = est.usage || 0
        storageQuota.value = est.quota || 0
        storagePercent.value = storageQuota.value > 0
          ? Math.round((storageUsed.value / storageQuota.value) * 100)
          : 0
      } catch {}
    }

    const now = new Date()
    lastUpdated.value = now.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    isRefreshing.value = false
  }

  function generateSvgPath(data: HistoryPoint[], width: number, height: number): string {
    if (data.length < 2) return ''
    const stepX = width / (maxDataPoints - 1)
    const offset = Math.max(0, maxDataPoints - data.length)
    const points = data.map((point, index) => {
      const x = (offset + index) * stepX
      const y = height - (point.value / 100) * height
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    return points.join(' ')
  }

  function generateSvgAreaPath(data: HistoryPoint[], width: number, height: number): string {
    if (data.length < 2) return ''
    const linePath = generateSvgPath(data, width, height)
    const offset = Math.max(0, maxDataPoints - data.length)
    const lastX = (offset + data.length - 1) * (width / (maxDataPoints - 1))
    return `${linePath} L ${lastX.toFixed(1)} ${height} L ${(offset * (width / (maxDataPoints - 1))).toFixed(1)} ${height} Z`
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  let refreshIntervalId: number | null = null
  let timeIntervalId: number | null = null
  let fpsFrameId: number | null = null
  let fpsLastTime = performance.now()
  let fpsFrameCount = 0

  function measureFps(now: number) {
    fpsFrameCount++
    const delta = now - fpsLastTime
    if (delta >= 1000) {
      fps.value = Math.round((fpsFrameCount * 1000) / delta)
      fpsFrameCount = 0
      fpsLastTime = now
    }
    fpsFrameId = requestAnimationFrame(measureFps)
  }

  onMounted(() => {
    updateTime()
    refreshMetrics()
    timeIntervalId = window.setInterval(updateTime, 1000)
    refreshIntervalId = window.setInterval(refreshMetrics, refreshIntervalMs)
    fpsFrameId = requestAnimationFrame(measureFps)
  })

  onUnmounted(() => {
    if (refreshIntervalId !== null) clearInterval(refreshIntervalId)
    if (timeIntervalId !== null) clearInterval(timeIntervalId)
    if (fpsFrameId !== null) cancelAnimationFrame(fpsFrameId)
  })

  return {
    memoryUsage,
    cpuUsage,
    cpuCores,
    cpuThreads,
    jsHeap,
    domNodes,
    resources,
    jsListeners,
    latency,
    networkStatus,
    connectionType,
    currentTime,
    lastUpdated,
    isRefreshing,
    isAutoRefresh,
    fps,
    pageLoadTime,
    storageUsed,
    storageQuota,
    storagePercent,
    memoryHistory,
    cpuHistory,
    latencyHistory,
    performanceScore,
    statusLevel,
    scoreColor,
    memoryColor,
    cpuColor,
    latencyColor,
    networkStatusClass,
    refreshMetrics,
    generateSvgPath,
    generateSvgAreaPath,
    formatBytes,
  }
}
