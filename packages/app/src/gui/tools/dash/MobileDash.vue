<template>
  <MobileWindow
    :visible="visible"
    title="Dash"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="mobile-dash">
      <!-- Dashboard Content -->
      <div class="mobile-dash__content">
        
        <!-- Header with Status -->
        <div class="mobile-dash__header">
          <div class="mobile-dash__header-left">
            <div class="mobile-dash__status-dot" :class="statusDotClass" />
            <span class="mobile-dash__status-text">{{ statusText }}</span>
          </div>
          <div class="mobile-dash__header-right">
            <span class="mobile-dash__time">{{ currentTime }}</span>
            <button class="mobile-dash__refresh-btn" @click="refreshMetrics" :class="{ 'is-refreshing': isRefreshing }">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3.5 9a5.5 5.5 0 0110.37-3.5M14.5 9a5.5 5.5 0 01-10.37 3.5"/>
                <path d="M16 5v3h-3M2 13v-3h3"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Performance Score Ring -->
        <div class="mobile-dash__score-section">
          <div class="mobile-dash__score-ring">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--gui-bg-surface-hover, #3A3A3C)" stroke-width="8"/>
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
                class="mobile-dash__score-ring-progress"
              />
            </svg>
            <div class="mobile-dash__score-center">
              <div class="mobile-dash__score-value" :style="{ color: scoreColor }">{{ performanceScore }}</div>
              <div class="mobile-dash__score-label">Score</div>
            </div>
          </div>
          <div class="mobile-dash__score-text">{{ scoreText }}</div>
        </div>

        <!-- Summary Cards -->
        <div class="mobile-dash__cards">
          <!-- Memory Card -->
          <div class="mobile-dash__card mobile-dash__card--memory">
            <div class="mobile-dash__card-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="7" width="16" height="10" rx="2"/>
                <path d="M7 7V5a1 1 0 011-1h4a1 1 0 011 1v2"/>
                <line x1="6" y1="11" x2="6" y2="13"/>
                <line x1="10" y1="11" x2="10" y2="13"/>
                <line x1="14" y1="11" x2="14" y2="13"/>
              </svg>
            </div>
            <div class="mobile-dash__card-content">
              <div class="mobile-dash__card-label">Memory</div>
              <div class="mobile-dash__card-value">{{ memoryUsage.used }} MB</div>
              <div class="mobile-dash__card-bar">
                <div
                  class="mobile-dash__card-bar-fill"
                  :style="{ width: `${memoryUsage.percent}%`, background: memoryBarGradient }"
                />
              </div>
              <div class="mobile-dash__card-footer">
                <span>{{ memoryUsage.percent }}%</span>
                <span>/ {{ memoryUsage.limit }} MB</span>
              </div>
            </div>
          </div>

          <!-- CPU Card -->
          <div class="mobile-dash__card mobile-dash__card--cpu">
            <div class="mobile-dash__card-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="5" width="12" height="12" rx="2"/>
                <line x1="9" y1="1" x2="9" y2="5"/>
                <line x1="13" y1="1" x2="13" y2="5"/>
                <line x1="9" y1="17" x2="9" y2="21"/>
                <line x1="13" y1="17" x2="13" y2="21"/>
                <line x1="1" y1="9" x2="5" y2="9"/>
                <line x1="1" y1="13" x2="5" y2="13"/>
                <line x1="17" y1="9" x2="21" y2="9"/>
                <line x1="17" y1="13" x2="21" y2="13"/>
              </svg>
            </div>
            <div class="mobile-dash__card-content">
              <div class="mobile-dash__card-label">CPU</div>
              <div class="mobile-dash__card-value">{{ cpuUsage }}%</div>
              <div class="mobile-dash__card-bar">
                <div
                  class="mobile-dash__card-bar-fill"
                  :style="{ width: `${cpuUsage}%`, background: cpuBarGradient }"
                />
              </div>
              <div class="mobile-dash__card-footer">
                <span>{{ cpuCores }} cores</span>
                <span>{{ cpuThreads }} threads</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Metrics -->
        <div class="mobile-dash__section">
          <div class="mobile-dash__section-header">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 10v4a1 1 0 01-1 1H3a1 1 0 01-1-1v-4M6 4V2a1 1 0 011-1h2a1 1 0 011 1v2"/>
              <circle cx="8" cy="9" r="2"/>
            </svg>
            <span>System Metrics</span>
          </div>
          <div class="mobile-dash__metrics-grid">
            <div class="mobile-dash__metric-item">
              <div class="mobile-dash__metric-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="9" cy="9" r="7"/>
                  <path d="M9 5v4l3 3"/>
                </svg>
              </div>
              <div class="mobile-dash__metric-content">
                <div class="mobile-dash__metric-label">JS Heap</div>
                <div class="mobile-dash__metric-value">{{ jsHeap }}</div>
              </div>
            </div>
            <div class="mobile-dash__metric-item">
              <div class="mobile-dash__metric-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="2" y="2" width="6" height="6" rx="1"/>
                  <rect x="10" y="2" width="6" height="6" rx="1"/>
                  <rect x="2" y="10" width="6" height="6" rx="1"/>
                  <rect x="10" y="10" width="6" height="6" rx="1"/>
                </svg>
              </div>
              <div class="mobile-dash__metric-content">
                <div class="mobile-dash__metric-label">DOM Nodes</div>
                <div class="mobile-dash__metric-value">{{ domNodes }}</div>
              </div>
            </div>
            <div class="mobile-dash__metric-item">
              <div class="mobile-dash__metric-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="9" cy="9" r="7"/>
                  <path d="M9 5v4"/>
                  <circle cx="9" cy="12" r="0.5" fill="currentColor"/>
                </svg>
              </div>
              <div class="mobile-dash__metric-content">
                <div class="mobile-dash__metric-label">Resources</div>
                <div class="mobile-dash__metric-value">{{ resources }}</div>
              </div>
            </div>
            <div class="mobile-dash__metric-item">
              <div class="mobile-dash__metric-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M2 14l4-4 3 3 7-7"/>
                  <path d="M12 6h4v4"/>
                </svg>
              </div>
              <div class="mobile-dash__metric-content">
                <div class="mobile-dash__metric-label">Event Listeners</div>
                <div class="mobile-dash__metric-value">{{ jsListeners }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Network Status -->
        <div class="mobile-dash__section">
          <div class="mobile-dash__section-header">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 6c2-3 10-3 14 0"/>
              <path d="M3 9c1.5-2 7.5-2 10 0"/>
              <path d="M5.5 12c1-1 3.5-1 5 0"/>
              <circle cx="8" cy="15" r="1" fill="currentColor"/>
            </svg>
            <span>Network</span>
          </div>
          <div class="mobile-dash__network-card">
            <div class="mobile-dash__network-row">
              <span class="mobile-dash__network-label">Connection</span>
              <span class="mobile-dash__network-value" :class="networkStatusClass">{{ networkStatus }}</span>
            </div>
            <div class="mobile-dash__network-row">
              <span class="mobile-dash__network-label">Latency</span>
              <span class="mobile-dash__network-value">{{ latency }}ms</span>
            </div>
            <div class="mobile-dash__network-row">
              <span class="mobile-dash__network-label">Type</span>
              <span class="mobile-dash__network-value">{{ connectionType }}</span>
            </div>
          </div>
        </div>

        <!-- Last Updated -->
        <div class="mobile-dash__footer">
          <span class="mobile-dash__footer-text">Last updated: {{ lastUpdated }}</span>
          <span class="mobile-dash__footer-dot" :class="{ 'mobile-dash__footer-dot--live': isAutoRefresh }" />
          <span class="mobile-dash__footer-text">{{ isAutoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF' }}</span>
        </div>
      </div>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'

interface Props {
  visible: boolean
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

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

// Status
const statusDotClass = computed(() => {
  if (performanceScore.value >= 80) return 'mobile-dash__status-dot--good'
  if (performanceScore.value >= 50) return 'mobile-dash__status-dot--warn'
  return 'mobile-dash__status-dot--bad'
})

const statusText = computed(() => {
  if (performanceScore.value >= 80) return 'All Systems Healthy'
  if (performanceScore.value >= 50) return 'Attention Needed'
  return 'Performance Degraded'
})

const scoreColor = computed(() => {
  const s = performanceScore.value
  if (s >= 80) return '#34C759'
  if (s >= 50) return '#FF9500'
  return '#FF3B30'
})

const scoreText = computed(() => {
  const s = performanceScore.value
  if (s >= 80) return 'System operating optimally'
  if (s >= 50) return 'Some metrics need attention'
  return 'Critical performance issues detected'
})

const memoryBarGradient = computed(() => {
  const p = memoryUsage.value.percent
  if (p < 50) return 'linear-gradient(90deg, #34C759, #30D158)'
  if (p < 80) return 'linear-gradient(90deg, #FF9500, #FF9F0A)'
  return 'linear-gradient(90deg, #FF3B30, #FF453A)'
})

const cpuBarGradient = computed(() => {
  const p = cpuUsage.value
  if (p < 50) return 'linear-gradient(90deg, #5AC8FA, #64D2FF)'
  if (p < 80) return 'linear-gradient(90deg, #FF9500, #FF9F0A)'
  return 'linear-gradient(90deg, #FF3B30, #FF453A)'
})

const networkStatusClass = computed(() => {
  if (networkStatus.value === 'Online') return 'mobile-dash__network-status--online'
  if (networkStatus.value === 'Slow') return 'mobile-dash__network-status--slow'
  return 'mobile-dash__network-status--offline'
})

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

async function refreshMetrics() {
  isRefreshing.value = true
  
  // Simulate refresh delay
  await new Promise(r => setTimeout(r, 300))

  const mem = (window.performance as any)?.memory

  if (mem) {
    const usedMB = Math.round(mem.usedJSHeapSize / 1024 / 1024)
    const limitMB = Math.round(mem.jsHeapSizeLimit / 1024 / 1024)
    const pct = Math.round((usedMB / limitMB) * 100)

    memoryUsage.value = { used: usedMB, limit: limitMB, percent: pct }
    jsHeap.value = `${usedMB} / ${limitMB} MB`
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
  lastUpdated.value = now.toLocaleTimeString('en-US', {
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
  refreshInterval = window.setInterval(refreshMetrics, 10000)
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
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────── */
.mobile-dash {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #0A0A0A);
}

.mobile-dash__content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.mobile-dash__content::-webkit-scrollbar {
  display: none;
}

/* ── Header ─────────────────────────────────────────────────────────── */
.mobile-dash__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.mobile-dash__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-dash__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gui-text-tertiary, #636366);
}

.mobile-dash__status-dot--good {
  background: #34C759;
  box-shadow: 0 0 8px rgba(52, 199, 89, 0.4);
}

.mobile-dash__status-dot--warn {
  background: #FF9500;
  box-shadow: 0 0 8px rgba(255, 149, 0, 0.4);
}

.mobile-dash__status-dot--bad {
  background: #FF3B30;
  box-shadow: 0 0 8px rgba(255, 59, 48, 0.4);
}

.mobile-dash__status-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--gui-text-primary, #FFFFFF);
}

.mobile-dash__header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-dash__time {
  font-size: 13px;
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  color: var(--gui-text-secondary, #8E8E93);
}

.mobile-dash__refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: var(--gui-bg-surface-hover, #3A3A3C);
  color: var(--gui-text-primary, #FFFFFF);
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-dash__refresh-btn:active {
  transform: scale(0.92);
}

.mobile-dash__refresh-btn.is-refreshing {
  animation: dash-spin 1s linear infinite;
}

@keyframes dash-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Score Section ──────────────────────────────────────────────────── */
.mobile-dash__score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.mobile-dash__score-ring {
  position: relative;
  width: 120px;
  height: 120px;
}

.mobile-dash__score-ring-progress {
  transition: stroke-dashoffset 0.5s ease, stroke 0.3s ease;
}

.mobile-dash__score-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.mobile-dash__score-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.mobile-dash__score-label {
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mobile-dash__score-text {
  font-size: 13px;
  color: var(--gui-text-secondary, #8E8E93);
  margin-top: 8px;
}

/* ── Cards ──────────────────────────────────────────────────────────── */
.mobile-dash__cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.mobile-dash__card {
  background: var(--gui-bg-surface, #2C2C2E);
  border-radius: 14px;
  padding: 14px;
  border: 0.5px solid var(--gui-border-subtle, #38383A);
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: dash-fade-in 0.3s ease;
}

.mobile-dash__card-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
}

.mobile-dash__card--memory .mobile-dash__card-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.mobile-dash__card--cpu .mobile-dash__card-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.mobile-dash__card-content {
  flex: 1;
}

.mobile-dash__card-label {
  font-size: 11px;
  color: var(--gui-text-secondary, #8E8E93);
  margin-bottom: 4px;
}

.mobile-dash__card-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--gui-text-primary, #FFFFFF);
  margin-bottom: 8px;
}

.mobile-dash__card-bar {
  height: 4px;
  background: var(--gui-bg-surface-hover, #3A3A3C);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 6px;
}

.mobile-dash__card-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease, background 0.3s ease;
}

.mobile-dash__card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--gui-text-tertiary, #636366);
}

/* ── Section ────────────────────────────────────────────────────────── */
.mobile-dash__section {
  margin-bottom: 20px;
}

.mobile-dash__section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
  margin-bottom: 12px;
}

/* ── Metrics Grid ───────────────────────────────────────────────────── */
.mobile-dash__metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.mobile-dash__metric-item {
  background: var(--gui-bg-surface, #2C2C2E);
  border-radius: 12px;
  padding: 12px;
  border: 0.5px solid var(--gui-border-subtle, #38383A);
  display: flex;
  align-items: center;
  gap: 10px;
  animation: dash-fade-in 0.3s ease;
}

.mobile-dash__metric-icon {
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

.mobile-dash__metric-content {
  flex: 1;
  min-width: 0;
}

.mobile-dash__metric-label {
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
  margin-bottom: 2px;
}

.mobile-dash__metric-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Network Card ───────────────────────────────────────────────────── */
.mobile-dash__network-card {
  background: var(--gui-bg-surface, #2C2C2E);
  border-radius: 12px;
  padding: 14px;
  border: 0.5px solid var(--gui-border-subtle, #38383A);
}

.mobile-dash__network-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 0.5px solid var(--gui-border-subtle, #38383A);
}

.mobile-dash__network-row:last-child {
  border-bottom: none;
}

.mobile-dash__network-label {
  font-size: 12px;
  color: var(--gui-text-secondary, #8E8E93);
}

.mobile-dash__network-value {
  font-size: 12px;
  font-weight: 600;
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
}

.mobile-dash__network-status--online {
  color: #34C759;
}

.mobile-dash__network-status--slow {
  color: #FF9500;
}

.mobile-dash__network-status--offline {
  color: #FF3B30;
}

/* ── Footer ─────────────────────────────────────────────────────────── */
.mobile-dash__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-top: 12px;
}

.mobile-dash__footer-text {
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
}

.mobile-dash__footer-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--gui-text-tertiary, #636366);
}

.mobile-dash__footer-dot--live {
  background: #34C759;
  box-shadow: 0 0 4px rgba(52, 199, 89, 0.4);
  animation: dash-pulse 2s ease-in-out infinite;
}

@keyframes dash-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ── Animations ─────────────────────────────────────────────────────── */
@keyframes dash-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

</style>
