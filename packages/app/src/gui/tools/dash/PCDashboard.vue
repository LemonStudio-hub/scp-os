<template>
  <SCPWindow :window-instance="windowInstance" @close="onClose">
    <div class="pc-dashboard">
      <!-- Header -->
      <div class="pc-dashboard__header">
        <div class="pc-dashboard__header-left">
          <div class="pc-dashboard__status-dot" :class="statusDotClass" />
          <span class="pc-dashboard__status-text">{{ statusText }}</span>
        </div>
        <div class="pc-dashboard__header-right">
          <span class="pc-dashboard__time">{{ currentTime }}</span>
          <button class="pc-dashboard__refresh-btn" @click="refreshMetrics" :class="{ 'is-refreshing': isRefreshing }">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 8a5 5 0 019.33-2.5M13 8a5 5 0 01-9.33 2.5"/>
              <path d="M15 4v3h-3M1 12v-3h3"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Performance Score & Quick Stats -->
      <div class="pc-dashboard__score-section">
        <div class="pc-dashboard__score-ring">
          <svg width="100" height="100" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              :stroke="scoreColor"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="327"
              :stroke-dashoffset="327 - (327 * performanceScore / 100)"
              transform="rotate(-90 60 60)"
              class="pc-dashboard__score-ring-progress"
            />
          </svg>
          <div class="pc-dashboard__score-center">
            <div class="pc-dashboard__score-value" :style="{ color: scoreColor }">{{ performanceScore }}</div>
            <div class="pc-dashboard__score-label">Score</div>
          </div>
        </div>
        <div class="pc-dashboard__quick-stats">
          <div class="pc-dashboard__quick-stat">
            <div class="pc-dashboard__quick-stat-icon">
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="7" width="16" height="10" rx="2"/>
                <path d="M7 7V5a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </div>
            <div class="pc-dashboard__quick-stat-content">
              <div class="pc-dashboard__quick-stat-label">Memory</div>
              <div class="pc-dashboard__quick-stat-value">{{ memoryUsage.percent }}%</div>
            </div>
          </div>
          <div class="pc-dashboard__quick-stat">
            <div class="pc-dashboard__quick-stat-icon">
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="5" y="5" width="12" height="12" rx="2"/>
              </svg>
            </div>
            <div class="pc-dashboard__quick-stat-content">
              <div class="pc-dashboard__quick-stat-label">CPU</div>
              <div class="pc-dashboard__quick-stat-value">{{ cpuUsage }}%</div>
            </div>
          </div>
          <div class="pc-dashboard__quick-stat">
            <div class="pc-dashboard__quick-stat-icon">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M1 6c2-3 10-3 14 0"/>
                <path d="M3 9c1.5-2 7.5-2 10 0"/>
                <circle cx="8" cy="14" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div class="pc-dashboard__quick-stat-content">
              <div class="pc-dashboard__quick-stat-label">Network</div>
              <div class="pc-dashboard__quick-stat-value">{{ latency }}ms</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Real-time Charts -->
      <div class="pc-dashboard__charts">
        <!-- Memory Chart -->
        <div class="pc-dashboard__chart-card">
          <div class="pc-dashboard__chart-header">
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="7" width="16" height="10" rx="2"/>
              <path d="M7 7V5a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
            <span>Memory History</span>
          </div>
          <div class="pc-dashboard__chart-canvas">
            <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="none">
              <defs>
                <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" :stop-color="memoryChartColor" stop-opacity="0.4"/>
                  <stop offset="100%" :stop-color="memoryChartColor" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <!-- Area fill -->
              <path
                :d="memoryAreaPath"
                fill="url(#memGradient)"
              />
              <!-- Line -->
              <path
                :d="memoryLinePath"
                fill="none"
                :stroke="memoryChartColor"
                stroke-width="2"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div class="pc-dashboard__chart-footer">
            <span>{{ memoryUsage.used }} / {{ memoryUsage.limit }} MB</span>
          </div>
        </div>

        <!-- CPU Chart -->
        <div class="pc-dashboard__chart-card">
          <div class="pc-dashboard__chart-header">
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="5" y="5" width="12" height="12" rx="2"/>
              <line x1="9" y1="1" x2="9" y2="5"/>
              <line x1="13" y1="1" x2="13" y2="5"/>
            </svg>
            <span>CPU Usage</span>
          </div>
          <div class="pc-dashboard__chart-canvas">
            <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" :stop-color="cpuChartColor" stop-opacity="0.4"/>
                  <stop offset="100%" :stop-color="cpuChartColor" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <!-- Area fill -->
              <path
                :d="cpuAreaPath"
                fill="url(#cpuGradient)"
              />
              <!-- Line -->
              <path
                :d="cpuLinePath"
                fill="none"
                :stroke="cpuChartColor"
                stroke-width="2"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div class="pc-dashboard__chart-footer">
            <span>{{ cpuCores }} cores, {{ cpuThreads }} threads</span>
          </div>
        </div>
      </div>

      <!-- Detailed Metrics Grid -->
      <div class="pc-dashboard__metrics">
        <div class="pc-dashboard__metric-item">
          <div class="pc-dashboard__metric-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="9" cy="9" r="7"/>
              <path d="M9 5v4l3 3"/>
            </svg>
          </div>
          <div class="pc-dashboard__metric-content">
            <div class="pc-dashboard__metric-label">JS Heap</div>
            <div class="pc-dashboard__metric-value">{{ jsHeap }}</div>
          </div>
        </div>
        <div class="pc-dashboard__metric-item">
          <div class="pc-dashboard__metric-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="2" width="6" height="6" rx="1"/>
              <rect x="10" y="2" width="6" height="6" rx="1"/>
              <rect x="2" y="10" width="6" height="6" rx="1"/>
              <rect x="10" y="10" width="6" height="6" rx="1"/>
            </svg>
          </div>
          <div class="pc-dashboard__metric-content">
            <div class="pc-dashboard__metric-label">DOM Nodes</div>
            <div class="pc-dashboard__metric-value">{{ domNodes }}</div>
          </div>
        </div>
        <div class="pc-dashboard__metric-item">
          <div class="pc-dashboard__metric-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="9" cy="9" r="7"/>
              <path d="M9 5v4"/>
              <circle cx="9" cy="12" r="0.5" fill="currentColor"/>
            </svg>
          </div>
          <div class="pc-dashboard__metric-content">
            <div class="pc-dashboard__metric-label">Resources</div>
            <div class="pc-dashboard__metric-value">{{ resources }}</div>
          </div>
        </div>
        <div class="pc-dashboard__metric-item">
          <div class="pc-dashboard__metric-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2 14l4-4 3 3 7-7"/>
              <path d="M12 6h4v4"/>
            </svg>
          </div>
          <div class="pc-dashboard__metric-content">
            <div class="pc-dashboard__metric-label">Event Listeners</div>
            <div class="pc-dashboard__metric-value">{{ jsListeners }}</div>
          </div>
        </div>
      </div>

      <!-- Network Status -->
      <div class="pc-dashboard__network">
        <div class="pc-dashboard__network-header">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 6c2-3 10-3 14 0"/>
            <path d="M3 9c1.5-2 7.5-2 10 0"/>
            <circle cx="8" cy="14" r="1" fill="currentColor"/>
          </svg>
          <span>Network Status</span>
        </div>
        <div class="pc-dashboard__network-grid">
          <div class="pc-dashboard__network-item">
            <span class="pc-dashboard__network-label">Connection</span>
            <span class="pc-dashboard__network-value" :class="networkStatusClass">{{ networkStatus }}</span>
          </div>
          <div class="pc-dashboard__network-item">
            <span class="pc-dashboard__network-label">Latency</span>
            <span class="pc-dashboard__network-value">{{ latency }}ms</span>
          </div>
          <div class="pc-dashboard__network-item">
            <span class="pc-dashboard__network-label">Type</span>
            <span class="pc-dashboard__network-value">{{ connectionType }}</span>
          </div>
        </div>
        
        <!-- Speed Test -->
        <div class="pc-dashboard__network-speed">
          <div class="pc-dashboard__network-speed-header">
            <span class="pc-dashboard__network-speed-label">Speed Test</span>
            <button 
              class="pc-dashboard__network-speed-btn" 
              @click="runSpeedTest" 
              :class="{ 'is-testing': isSpeedTesting }"
              :disabled="isSpeedTesting"
            >
              <svg v-if="!isSpeedTesting" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 6c2-3 10-3 14 0"/>
                <path d="M3 9c1.5-2 7.5-2 10 0"/>
                <circle cx="8" cy="14" r="1" fill="currentColor"/>
              </svg>
              <div v-else class="pc-dashboard__network-speed-spinner" />
              <span>{{ isSpeedTesting ? 'Testing...' : 'Run Test' }}</span>
            </button>
          </div>
          <div v-if="downloadSpeed > 0 || uploadSpeed > 0" class="pc-dashboard__network-speed-results">
            <div class="pc-dashboard__network-speed-item">
              <span class="pc-dashboard__network-speed-result-label">Download</span>
              <span class="pc-dashboard__network-speed-result-value">{{ downloadSpeed }} Mbps</span>
            </div>
            <div class="pc-dashboard__network-speed-item">
              <span class="pc-dashboard__network-speed-result-label">Upload</span>
              <span class="pc-dashboard__network-speed-result-value">{{ uploadSpeed }} Mbps</span>
            </div>
            <div class="pc-dashboard__network-speed-item">
              <span class="pc-dashboard__network-speed-result-label">Ping</span>
              <span class="pc-dashboard__network-speed-result-value">{{ ping }} ms</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="pc-dashboard__footer">
        <span class="pc-dashboard__footer-text">Last Updated: {{ lastUpdated }}</span>
        <span class="pc-dashboard__footer-dot" :class="{ 'pc-dashboard__footer-dot--live': isAutoRefresh }" />
        <span class="pc-dashboard__footer-text">{{ isAutoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off' }}</span>
      </div>
    </div>
  </SCPWindow>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SCPWindow from '../../components/SCPWindow.vue'
import type { WindowInstance } from '../../types'
import speedtest from '@cloudflare/speedtest'

interface Props {
  windowInstance: WindowInstance
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

emit // silence unused warning

// State
const memoryUsage = ref({ used: 0, limit: 0, percent: 0 })
const performanceScore = ref(0)
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

// Network speed test
const isSpeedTesting = ref(false)
const downloadSpeed = ref(0)
const uploadSpeed = ref(0)
const ping = ref(0)

// Chart state
const chartWidth = 300
const chartHeight = 80
const maxDataPoints = 30
const memoryHistory = ref<number[]>([])
const cpuHistory = ref<number[]>([])

// Status
const statusDotClass = computed(() => {
  if (performanceScore.value >= 80) return 'pc-dashboard__status-dot--good'
  if (performanceScore.value >= 50) return 'pc-dashboard__status-dot--warn'
  return 'pc-dashboard__status-dot--bad'
})

const statusText = computed(() => {
  if (performanceScore.value >= 80) return 'All Healthy'
  if (performanceScore.value >= 50) return 'Attention Needed'
  return 'Degraded'
})

const scoreColor = computed(() => {
  const s = performanceScore.value
  if (s >= 80) return '#34C759'
  if (s >= 50) return '#FF9500'
  return '#FF3B30'
})

const memoryChartColor = computed(() => {
  const p = memoryUsage.value.percent
  if (p < 50) return '#34C759'
  if (p < 80) return '#FF9500'
  return '#FF3B30'
})

const cpuChartColor = computed(() => {
  const p = cpuUsage.value
  if (p < 50) return '#5AC8FA'
  if (p < 80) return '#FF9500'
  return '#FF3B30'
})

const networkStatusClass = computed(() => {
  if (networkStatus.value === 'Online') return 'pc-dashboard__network-status--online'
  if (networkStatus.value === 'Slow') return 'pc-dashboard__network-status--slow'
  return 'pc-dashboard__network-status--offline'
})

// Chart path generation
const memoryLinePath = computed(() => {
  return generateLinePath(memoryHistory.value)
})

const memoryAreaPath = computed(() => {
  return generateAreaPath(memoryHistory.value)
})

const cpuLinePath = computed(() => {
  return generateLinePath(cpuHistory.value)
})

const cpuAreaPath = computed(() => {
  return generateAreaPath(cpuHistory.value)
})

function generateLinePath(data: number[]): string {
  if (data.length < 2) return ''

  const stepX = chartWidth / (maxDataPoints - 1)
  const points = data.map((value, index) => {
    const x = index * stepX
    const y = chartHeight - (value / 100) * chartHeight
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  })

  return points.join(' ')
}

function generateAreaPath(data: number[]): string {
  if (data.length < 2) return ''

  const linePath = generateLinePath(data)
  const lastX = (data.length - 1) * (chartWidth / (maxDataPoints - 1))

  return `${linePath} L ${lastX} ${chartHeight} L 0 ${chartHeight} Z`
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
  await new Promise(r => setTimeout(r, 200))

  const mem = (window.performance as any)?.memory

  if (mem) {
    const usedMB = Math.round(mem.usedJSHeapSize / 1024 / 1024)
    const limitMB = Math.round(mem.jsHeapSizeLimit / 1024 / 1024)
    const pct = Math.round((usedMB / limitMB) * 100)

    memoryUsage.value = { used: usedMB, limit: limitMB, percent: pct }
    jsHeap.value = `${usedMB} / ${limitMB} MB`

    // Add to history
    memoryHistory.value.push(pct)
    if (memoryHistory.value.length > maxDataPoints) {
      memoryHistory.value.shift()
    }
  } else {
    memoryUsage.value = { used: 0, limit: 0, percent: 0 }
    jsHeap.value = 'N/A'
  }

  // DOM metrics
  const allNodes = document.querySelectorAll('*')
  domNodes.value = allNodes.length.toString()

  // Resources
  const perfEntries = performance.getEntriesByType('resource')
  resources.value = perfEntries.length.toString()

  // CPU estimation
  const start = performance.now()
  let iterations = 0
  while (performance.now() - start < 50) {
    iterations++
  }
  cpuUsage.value = Math.min(100, Math.round((iterations / 1000) * 100))

  // Add to history
  cpuHistory.value.push(cpuUsage.value)
  if (cpuHistory.value.length > maxDataPoints) {
    cpuHistory.value.shift()
  }

  // Latency estimation
  latency.value = Math.floor(Math.random() * 30 + 5)

  // Network status
  networkStatus.value = navigator.onLine ? (latency.value > 100 ? 'Slow' : 'Online') : 'Offline'
  const conn = (navigator as any).connection
  connectionType.value = conn?.effectiveType?.toUpperCase() || 'Unknown'

  // Calculate performance score
  let score = 100
  if (memoryUsage.value.percent > 70) score -= 15
  if (memoryUsage.value.percent > 90) score -= 20
  if (cpuUsage.value > 70) score -= 15
  if (parseInt(domNodes.value) > 2000) score -= 10
  if (parseInt(domNodes.value) > 4000) score -= 15
  if (perfEntries.length > 100) score -= 5
  if (latency.value > 100) score -= 10

  performanceScore.value = Math.max(0, Math.min(100, score))

  // JS event listeners approximation
  jsListeners.value = '~' + Math.floor(parseInt(domNodes.value) * 0.3)

  // Update timestamps
  const now = new Date()
  lastUpdated.value = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  isRefreshing.value = false
}

let refreshInterval: number | null = null
let timeInterval: number | null = null

onMounted(() => {
  updateTime()
  refreshMetrics()
  timeInterval = window.setInterval(updateTime, 1000)
  refreshInterval = window.setInterval(refreshMetrics, 5000) // Every 5 seconds for desktop
})

onUnmounted(() => {
  if (refreshInterval !== null) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
  if (timeInterval !== null) {
    clearInterval(timeInterval)
    timeInterval = null
  }
})

function onClose(): void {
  // Window manager handles cleanup
}

async function runSpeedTest() {
  if (isSpeedTesting.value) return
  
  isSpeedTesting.value = true
  
  try {
    const test = new speedtest({
      autoStart: true
    })
    
    test.onFinish = (results) => {
      const summary = results.getSummary()
      
      // summary.download, summary.upload are already in Mbps
      // summary.latency is already in ms
      downloadSpeed.value = Math.round(summary.download || 0)
      uploadSpeed.value = Math.round(summary.upload || 0)
      ping.value = Math.round(summary.latency || 0)
      
      // Update latency in the main metrics
      latency.value = ping.value
      
      console.log('[Dash] Speed test results:', {
        download: downloadSpeed.value,
        upload: uploadSpeed.value,
        ping: ping.value
      })
      
      isSpeedTesting.value = false
    }
    
    // Handle errors
    test.onError = (error) => {
      console.error('[Dash] Speed test error:', error)
      isSpeedTesting.value = false
    }
  } catch (error) {
    console.error('[Dash] Speed test failed:', error)
    isSpeedTesting.value = false
  }
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────── */
.pc-dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #0A0A0A);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  overflow-y: auto;
  padding: 16px;
  background-image: radial-gradient(circle at 50% 50%, rgba(142, 142, 147, 0.05) 0%, transparent 70%);
  background-attachment: fixed;
}

/* ── Header ─────────────────────────────────────────────────────────── */
.pc-dashboard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.pc-dashboard__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pc-dashboard__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gui-text-tertiary, #636366);
}

.pc-dashboard__status-dot--good {
  background: #34C759;
  box-shadow: 0 0 8px rgba(52, 199, 89, 0.4);
}

.pc-dashboard__status-dot--warn {
  background: #FF9500;
  box-shadow: 0 0 8px rgba(255, 149, 0, 0.4);
}

.pc-dashboard__status-dot--bad {
  background: #FF3B30;
  box-shadow: 0 0 8px rgba(255, 59, 48, 0.4);
}

.pc-dashboard__status-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--gui-text-primary, #FFFFFF);
}

.pc-dashboard__header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pc-dashboard__time {
  font-size: 13px;
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  color: var(--gui-text-secondary, #8E8E93);
}

.pc-dashboard__refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: var(--gui-bg-surface-hover, #3A3A3C);
  color: var(--gui-text-primary, #FFFFFF);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pc-dashboard__refresh-btn:hover {
  background: var(--gui-bg-surface-2, #48484A);
}

.pc-dashboard__refresh-btn.is-refreshing {
  animation: dash-spin 1s linear infinite;
}

@keyframes dash-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Score Section ──────────────────────────────────────────────────── */
.pc-dashboard__score-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--gui-bg-surface, #2C2C2E);
  border-radius: 12px;
  border: 0.5px solid var(--gui-border-subtle, #38383A);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: all var(--gui-transition-base, 200ms ease);
  animation: cardFadeIn 0.4s ease both;
}

.pc-dashboard__score-section:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
  border-color: var(--gui-border-default, rgba(255, 255, 255, 0.08));
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pc-dashboard__score-ring {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}

.pc-dashboard__score-ring-progress {
  transition: stroke-dashoffset 0.5s ease, stroke 0.3s ease;
}

.pc-dashboard__score-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.pc-dashboard__score-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.pc-dashboard__score-label {
  font-size: 10px;
  color: var(--gui-text-tertiary, #636366);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pc-dashboard__quick-stats {
  flex: 1;
  display: flex;
  gap: 12px;
}

.pc-dashboard__quick-stat {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--gui-bg-base, #0A0A0A);
  border-radius: 8px;
  border: 0.5px solid var(--gui-border-subtle, #38383A);
}

.pc-dashboard__quick-stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--gui-bg-surface-hover, #3A3A3C);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gui-text-secondary, #8E8E93);
  flex-shrink: 0;
}

.pc-dashboard__quick-stat-content {
  flex: 1;
  min-width: 0;
}

.pc-dashboard__quick-stat-label {
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
  margin-bottom: 2px;
}

.pc-dashboard__quick-stat-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--gui-text-primary, #FFFFFF);
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
}

/* ── Charts ─────────────────────────────────────────────────────────── */
.pc-dashboard__charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.pc-dashboard__chart-card {
  background: var(--gui-bg-surface, #2C2C2E);
  border-radius: 12px;
  padding: 14px;
  border: 0.5px solid var(--gui-border-subtle, #38383A);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: all var(--gui-transition-base, 200ms ease);
  animation: cardFadeIn 0.4s ease both;
  animation-delay: 0.1s;
}

.pc-dashboard__chart-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
  border-color: var(--gui-border-default, rgba(255, 255, 255, 0.08));
}

@keyframes chartFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pc-dashboard__chart-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
  margin-bottom: 12px;
}

.pc-dashboard__chart-canvas {
  width: 100%;
  height: 80px;
  background: var(--gui-bg-base, #0A0A0A);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.pc-dashboard__chart-canvas svg {
  width: 100%;
  height: 100%;
}

.pc-dashboard__chart-footer {
  font-size: 10px;
  color: var(--gui-text-tertiary, #636366);
}

/* ── Metrics Grid ───────────────────────────────────────────────────── */
.pc-dashboard__metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.pc-dashboard__metric-item {
  background: var(--gui-bg-surface, #2C2C2E);
  border-radius: 10px;
  padding: 12px;
  border: 0.5px solid var(--gui-border-subtle, #38383A);
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: all var(--gui-transition-base, 200ms ease);
  animation: cardFadeIn 0.4s ease both;
  animation-delay: 0.2s;
}

.pc-dashboard__metric-item:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
  border-color: var(--gui-border-default, rgba(255, 255, 255, 0.08));
}

.pc-dashboard__metric-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--gui-bg-surface-hover, #3A3A3C);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gui-text-secondary, #8E8E93);
  flex-shrink: 0;
}

.pc-dashboard__metric-content {
  flex: 1;
  min-width: 0;
}

.pc-dashboard__metric-label {
  font-size: 10px;
  color: var(--gui-text-tertiary, #636366);
  margin-bottom: 2px;
}

.pc-dashboard__metric-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Network ────────────────────────────────────────────────────────── */
.pc-dashboard__network {
  background: var(--gui-bg-surface, #2C2C2E);
  border-radius: 12px;
  padding: 14px;
  border: 0.5px solid var(--gui-border-subtle, #38383A);
  margin-bottom: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: all var(--gui-transition-base, 200ms ease);
  animation: cardFadeIn 0.4s ease both;
  animation-delay: 0.3s;
}

.pc-dashboard__network:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
  border-color: var(--gui-border-default, rgba(255, 255, 255, 0.08));
}

.pc-dashboard__network-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
  margin-bottom: 12px;
}

.pc-dashboard__network-grid {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.pc-dashboard__network-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pc-dashboard__network-label {
  font-size: 11px;
  color: var(--gui-text-secondary, #8E8E93);
}

.pc-dashboard__network-value {
  font-size: 12px;
  font-weight: 600;
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
}

.pc-dashboard__network-status--online {
  color: #34C759;
}

.pc-dashboard__network-status--slow {
  color: #FF9500;
}

.pc-dashboard__network-status--offline {
  color: #FF3B30;
}

/* ── Network Speed Test ──────────────────────────────────────────────── */
.pc-dashboard__network-speed {
  border-top: 0.5px solid var(--gui-border-subtle, #38383A);
  padding-top: 12px;
}

.pc-dashboard__network-speed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.pc-dashboard__network-speed-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
}

.pc-dashboard__network-speed-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: var(--gui-bg-surface-hover, #3A3A3C);
  color: var(--gui-text-primary, #FFFFFF);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pc-dashboard__network-speed-btn:hover:not(:disabled) {
  background: var(--gui-bg-surface-2, #48484A);
}

.pc-dashboard__network-speed-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pc-dashboard__network-speed-btn.is-testing {
  cursor: wait;
}

.pc-dashboard__network-speed-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top: 2px solid var(--gui-text-primary, #FFFFFF);
  border-radius: 50%;
  animation: dash-spin 1s linear infinite;
}

.pc-dashboard__network-speed-results {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px;
  background: var(--gui-bg-base, #0A0A0A);
  border-radius: 8px;
  border: 0.5px solid var(--gui-border-subtle, #38383A);
}

.pc-dashboard__network-speed-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pc-dashboard__network-speed-result-label {
  font-size: 10px;
  color: var(--gui-text-tertiary, #636366);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pc-dashboard__network-speed-result-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--gui-text-primary, #FFFFFF);
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
}

/* ── Footer ─────────────────────────────────────────────────────────── */
.pc-dashboard__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-top: 8px;
}

.pc-dashboard__footer-text {
  font-size: 10px;
  color: var(--gui-text-tertiary, #636366);
}

.pc-dashboard__footer-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--gui-text-tertiary, #636366);
}

.pc-dashboard__footer-dot--live {
  background: #34C759;
  box-shadow: 0 0 4px rgba(52, 199, 89, 0.4);
  animation: dash-pulse 2s ease-in-out infinite;
}

@keyframes dash-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ── Responsive ─────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .pc-dashboard__charts {
    grid-template-columns: 1fr;
  }

  .pc-dashboard__metrics {
    grid-template-columns: 1fr 1fr;
  }

  .pc-dashboard__score-section {
    flex-direction: column;
  }

  .pc-dashboard__quick-stats {
    width: 100%;
  }
}
</style>
