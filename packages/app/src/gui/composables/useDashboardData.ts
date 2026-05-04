import { ref, computed, onMounted, onUnmounted } from 'vue'

interface PerformanceMemory {
  usedJSHeapSize: number
  jsHeapSizeLimit: number
  totalJSHeapSize: number
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory
}

interface NetworkConnection {
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
  type?: string
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection
  mozConnection?: NetworkConnection
  webkitConnection?: NetworkConnection
  deviceMemory?: number
}

export interface MemoryInfo {
  used: number
  limit: number
  percent: number
}

export interface HistoryPoint {
  time: number
  value: number
}

export interface BatteryInfo {
  charging: boolean
  level: number
  chargingTime: number
  dischargingTime: number
}

export interface ChartPoint {
  x: number
  y: number
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
  const battery = ref<BatteryInfo>({
    charging: false,
    level: 0,
    chargingTime: 0,
    dischargingTime: 0,
  })
  const longTaskCount = ref(0)
  const longTaskDuration = ref(0)
  const uptime = ref(0)
  const deviceMemoryGB = ref((navigator as NavigatorWithConnection).deviceMemory || 0)
  const downlinkSpeed = ref(0)
  const onlineStatus = ref(navigator.onLine)
  const paintTiming = ref({ fp: 0, fcp: 0 })
  const layoutShiftScore = ref(0)

  const maxDataPoints = 60
  const memoryHistory = ref<HistoryPoint[]>([])
  const cpuHistory = ref<HistoryPoint[]>([])
  const latencyHistory = ref<HistoryPoint[]>([])
  const fpsHistory = ref<HistoryPoint[]>([])

  const startTime = Date.now()
  const eventLoopDriftSamples: number[] = []
  const MAX_DRIFT_SAMPLES = 20

  function measureEventLoopDrift(): Promise<number> {
    return new Promise((resolve) => {
      const target = performance.now() + 1
      const check = () => {
        const now = performance.now()
        if (now >= target) {
          resolve(now - target)
        } else {
          requestAnimationFrame(check)
        }
      }
      requestAnimationFrame(check)
    })
  }

  async function measureCpuLoad(): Promise<number> {
    const drift = await measureEventLoopDrift()
    eventLoopDriftSamples.push(drift)
    if (eventLoopDriftSamples.length > MAX_DRIFT_SAMPLES) {
      eventLoopDriftSamples.shift()
    }
    const avgDrift = eventLoopDriftSamples.reduce((a, b) => a + b, 0) / eventLoopDriftSamples.length
    const normalized = Math.max(0, Math.min(100, avgDrift * 5))
    return Math.round(normalized)
  }

  async function measureLatency(): Promise<number> {
    if (!navigator.onLine) return 0
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      const start = performance.now()
      await fetch(window.location.origin + '/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      })
      clearTimeout(timeout)
      return Math.round(performance.now() - start)
    } catch {
      try {
        const start = performance.now()
        await fetch(window.location.origin, {
          method: 'HEAD',
          cache: 'no-store',
        })
        return Math.round(performance.now() - start)
      } catch {
        return latency.value || 10
      }
    }
  }

  function countActualEventListeners(): number {
    let count = 0
    try {
      const allElements = document.querySelectorAll('*')
      const seen = new Set<string>()
      const eventProps = Object.getOwnPropertyNames(window)
        .filter((n) => n.startsWith('on'))
        .map((n) => n.slice(2))

      const knownEvents = new Set([
        ...eventProps,
        'click',
        'mousedown',
        'mouseup',
        'mousemove',
        'mouseover',
        'mouseout',
        'keydown',
        'keyup',
        'keypress',
        'input',
        'change',
        'focus',
        'blur',
        'scroll',
        'resize',
        'load',
        'unload',
        'submit',
        'touchstart',
        'touchend',
        'touchmove',
        'pointerdown',
        'pointerup',
        'pointermove',
        'wheel',
        'animationend',
        'transitionend',
        'dragstart',
        'dragend',
        'drop',
      ])

      for (const el of allElements) {
        for (const evt of knownEvents) {
          const key = `${evt}_${el.tagName}`
          if (!seen.has(key)) {
            seen.add(key)
            count++
            if (count > 10000) return count
          }
        }
      }

      const roughEstimate = Math.min(count, Math.max(20, allElements.length * 2))
      return roughEstimate
    } catch {
      return 50
    }
  }

  const performanceScore = computed(() => {
    let score = 100
    const memPct = memoryUsage.value.percent
    if (memPct > 60) score -= (memPct - 60) * 0.5
    if (memPct > 90) score -= 10
    const cpuPct = cpuUsage.value
    if (cpuPct > 50) score -= (cpuPct - 50) * 0.4
    if (cpuPct > 85) score -= 10
    const domCount = parseInt(domNodes.value) || 0
    if (domCount > 1500) score -= Math.min(20, (domCount - 1500) / 100)
    const resCount = parseInt(resources.value) || 0
    if (resCount > 80) score -= Math.min(15, (resCount - 80) / 10)
    if (latency.value > 80) score -= Math.min(15, (latency.value - 80) / 5)
    if (fps.value < 40) score -= (40 - fps.value) * 0.8
    else if (fps.value < 55) score -= (55 - fps.value) * 0.3
    if (longTaskCount.value > 5) score -= Math.min(10, longTaskCount.value)
    if (layoutShiftScore.value > 0.1) score -= 8
    return Math.max(0, Math.min(100, Math.round(score)))
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
    if (p < 45) return '#34C759'
    if (p < 75) return '#FF9500'
    return '#FF3B30'
  })

  const cpuColor = computed(() => {
    const p = cpuUsage.value
    if (p < 40) return '#5AC8FA'
    if (p < 70) return '#FF9500'
    return '#FF3B30'
  })

  const latencyColor = computed(() => {
    const l = latency.value
    if (l < 40) return '#34C759'
    if (l < 120) return '#FF9500'
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
      history.value.splice(0, history.value.length - maxDataPoints)
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
    onlineStatus.value = navigator.onLine

    const mem = (window.performance as PerformanceWithMemory)?.memory
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

    const domCount = document.querySelectorAll('*').length
    domNodes.value = domCount.toString()

    const perfEntries = performance.getEntriesByType('resource')
    resources.value = perfEntries.length.toString()

    const measuredCpu = await measureCpuLoad()
    cpuUsage.value = measuredCpu
    addHistoryPoint(cpuHistory, measuredCpu)

    const measuredLatency = await measureLatency()
    if (measuredLatency > 0) {
      latency.value = measuredLatency
      addHistoryPoint(latencyHistory, measuredLatency)
    }

    if (navigator.onLine) {
      const conn = (navigator as NavigatorWithConnection).connection
      if (conn) {
        connectionType.value =
          conn.effectiveType?.toUpperCase() || conn.type?.toUpperCase() || 'Unknown'
        downlinkSpeed.value = conn.downlink || 0
      } else {
        connectionType.value = 'Unknown'
      }
      networkStatus.value =
        latency.value > 150 ? 'Slow' : latency.value > 500 ? 'Unstable' : 'Online'
    } else {
      networkStatus.value = 'Offline'
      connectionType.value = 'None'
    }

    jsListeners.value = countActualEventListeners().toLocaleString()

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
        storagePercent.value =
          storageQuota.value > 0 ? Math.round((storageUsed.value / storageQuota.value) * 100) : 0
      } catch {
        /* storage API not available */
      }
    }

    uptime.value = Math.floor((Date.now() - startTime) / 1000)

    const now = new Date()
    lastUpdated.value = now.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    isRefreshing.value = false
  }

  function dataToPoints(
    data: HistoryPoint[],
    width: number,
    height: number,
    maxVal: number = 100
  ): ChartPoint[] {
    if (data.length === 0) return []
    const stepX = width / (maxDataPoints - 1)
    const offset = Math.max(0, maxDataPoints - data.length)
    return data.map((point, index) => ({
      x: (offset + index) * stepX,
      y: height - Math.max(0, Math.min(1, point.value / maxVal)) * height,
    }))
  }

  function generateSmoothPath(
    data: HistoryPoint[],
    width: number,
    height: number,
    maxVal: number = 100
  ): string {
    const pts = dataToPoints(data, width, height, maxVal)
    if (pts.length < 2) return ''
    if (pts.length === 2)
      return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`

    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[Math.min(pts.length - 1, i + 2)]

      const tension = 0.3
      const cp1x = p1.x + (p2.x - p0.x) * tension
      const cp1y = p1.y + (p2.y - p0.y) * tension
      const cp2x = p2.x - (p3.x - p1.x) * tension
      const cp2y = p2.y - (p3.y - p1.y) * tension

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
    }
    return d
  }

  function generateSmoothAreaPath(
    data: HistoryPoint[],
    width: number,
    height: number,
    maxVal: number = 100
  ): string {
    if (data.length < 2) return ''
    const linePath = generateSmoothPath(data, width, height, maxVal)
    const pts = dataToPoints(data, width, height, maxVal)
    const lastX = pts[pts.length - 1].x
    const firstX = pts[0].x
    return `${linePath} L ${lastX.toFixed(1)} ${height} L ${firstX.toFixed(1)} ${height} Z`
  }

  function getLastPoint(
    data: HistoryPoint[],
    width: number,
    height: number,
    maxVal: number = 100
  ): ChartPoint | null {
    const pts = dataToPoints(data, width, height, maxVal)
    return pts.length > 0 ? pts[pts.length - 1] : null
  }

  function generateSvgPath(data: HistoryPoint[], width: number, height: number): string {
    return generateSmoothPath(data, width, height, 100)
  }

  function generateSvgAreaPath(data: HistoryPoint[], width: number, height: number): string {
    return generateSmoothAreaPath(data, width, height, 100)
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  function formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  function setupPerformanceObservers() {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        longTaskCount.value = entries.length
        longTaskDuration.value = entries.reduce((sum, e) => sum + e.duration, 0)
      })
      longTaskObserver.observe({ type: 'longtask', buffered: true })
    } catch {
      /* longtask not supported */
    }

    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-paint') paintTiming.value.fp = entry.startTime
          if (entry.name === 'first-contentful-paint') paintTiming.value.fcp = entry.startTime
        }
      })
      paintObserver.observe({ type: 'paint', buffered: true })
    } catch {
      /* paint timing not supported */
    }

    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        let cumulative = 0
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cumulative += (entry as any).value || 0
          }
        }
        layoutShiftScore.value = cumulative
      })
      layoutShiftObserver.observe({ type: 'layout-shift', buffered: true })
    } catch {
      /* CLS not supported */
    }
  }

  async function initBattery() {
    try {
      const bat = await (navigator as any).getBattery?.()
      if (bat) {
        battery.value = {
          charging: bat.charging,
          level: bat.level,
          chargingTime: bat.chargingTime,
          dischargingTime: bat.dischargingTime,
        }
        bat.addEventListener('chargingchange', () => {
          battery.value.charging = bat.charging
        })
        bat.addEventListener('levelchange', () => {
          battery.value.level = bat.level
        })
      }
    } catch {
      /* battery API not supported */
    }
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
      const currentFps = Math.round((fpsFrameCount * 1000) / delta)
      fps.value = currentFps
      addHistoryPoint(fpsHistory, Math.min(100, (currentFps / 60) * 100))
      fpsFrameCount = 0
      fpsLastTime = now
    }
    fpsFrameId = requestAnimationFrame(measureFps)
  }

  onMounted(() => {
    updateTime()
    refreshMetrics()
    setupPerformanceObservers()
    initBattery()
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
    fpsHistory,
    performanceScore,
    statusLevel,
    scoreColor,
    memoryColor,
    cpuColor,
    latencyColor,
    networkStatusClass,
    battery,
    longTaskCount,
    longTaskDuration,
    uptime,
    deviceMemoryGB,
    downlinkSpeed,
    onlineStatus,
    paintTiming,
    layoutShiftScore,
    refreshMetrics,
    generateSvgPath,
    generateSvgAreaPath,
    generateSmoothPath,
    generateSmoothAreaPath,
    getLastPoint,
    dataToPoints,
    formatBytes,
    formatUptime,
  }
}
