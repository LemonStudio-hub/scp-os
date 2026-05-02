<template>
  <MobileWindow title="Dashboard" :show-back="true" @close="onClose">
    <div class="mdash">
      <div class="mdash__bg">
        <div class="mdash__bg-orb mdash__bg-orb--1" />
        <div class="mdash__bg-orb mdash__bg-orb--2" />
        <div class="mdash__bg-orb mdash__bg-orb--3" />
        <div class="mdash__bg-grid" />
        <div class="mdash__bg-vignette" />
      </div>

      <div class="mdash__particles">
        <span v-for="n in 15" :key="n" class="mdash__particle" :style="particleStyle(n)" />
      </div>

      <div class="mdash__content">
        <header class="mdash__header">
          <div class="mdash__header-top">
            <div class="mdash__status">
              <span class="mdash__status-dot" :class="`mdash__status-dot--${statusLevel}`" />
              <span class="mdash__status-text">{{ statusLabel }}</span>
            </div>
            <div class="mdash__header-actions">
              <div class="mdash__tab-pills">
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  class="mdash__pill"
                  :class="{ 'mdash__pill--active': activeTab === tab.id }"
                  @click="activeTab = tab.id"
                >{{ tab.label }}</button>
              </div>
              <button class="mdash__refresh-btn" :class="{ 'mdash__refresh-btn--spin': isRefreshing }" @click="refreshMetrics">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 8a5 5 0 019.33-2.5M13 8a5 5 0 01-9.33 2.5"/>
                  <path d="M15 4v3h-3M1 12v-3h3"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="mdash__meta">
            <span class="mdash__meta-item">{{ currentTime }}</span>
            <span class="mdash__meta-sep">·</span>
            <span class="mdash__meta-item">UPTIME: {{ formatUptime(uptime) }}</span>
          </div>
        </header>

        <section v-if="activeTab === 'overview'" class="mdash__tab">
          <div class="mdash__hero">
            <div class="mdash__gauge-cluster">
              <svg class="mdash__gauge-svg" viewBox="0 0 160 100">
                <defs>
                  <filter id="mGaugeGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <linearGradient id="mGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" :stop-color="scoreColor" stop-opacity="0.4" />
                    <stop offset="50%" :stop-color="scoreColor" stop-opacity="1" />
                    <stop offset="100%" :stop-color="scoreColor" stop-opacity="0.6" />
                  </linearGradient>
                </defs>
                <path d="M 16 82 A 64 64 0 0 1 144 82" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="10" stroke-linecap="round" />
                <path
                  d="M 16 82 A 64 64 0 0 1 144 82"
                  fill="none"
                  stroke="url(#mGaugeGrad)"
                  stroke-width="10"
                  stroke-linecap="round"
                  :stroke-dasharray="201.1"
                  :stroke-dashoffset="201.1 - (201.1 * performanceScore / 100)"
                  class="mdash__gauge-arc"
                  filter="url(#mGaugeGlow)"
                />
                <path d="M 16 82 A 64 64 0 0 1 144 82" fill="none" :stroke="scoreColor" stroke-width="0.8" stroke-dasharray="3 6" opacity="0.2" />
                <text x="80" y="62" text-anchor="middle" :fill="scoreColor" font-size="28" font-weight="900" font-family="'SF Mono','JetBrains Mono',monospace">{{ performanceScore }}</text>
                <text x="80" y="78" text-anchor="middle" fill="rgba(255,255,255,0.22)" font-size="7" font-weight="600" letter-spacing="0.18em">SYSTEM INDEX</text>
              </svg>
            </div>

            <div class="mdash__mini-gauges">
              <div v-for="stat in heroStats" :key="stat.label" class="mdash__mini-stat">
                <svg class="mdash__mini-gauge" viewBox="0 0 48 28">
                  <path d="M 5 24 A 19 19 0 0 1 43 24" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="4" stroke-linecap="round" />
                  <path
                    d="M 5 24 A 19 19 0 0 1 43 24"
                    fill="none"
                    :stroke="stat.color"
                    stroke-width="4"
                    stroke-linecap="round"
                    :stroke-dasharray="59.7"
                    :stroke-dashoffset="59.7 - (59.7 * Math.min(1, stat.pct / 100))"
                    class="mdash__mini-gauge-arc"
                  />
                </svg>
                <div class="mdash__mini-stat-body">
                  <span class="mdash__mini-stat-val" :style="{ color: stat.color }">{{ stat.value }}<small v-if="stat.unit">{{ stat.unit }}</small></span>
                  <span class="mdash__mini-stat-lbl">{{ stat.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mdash__chart-section">
            <div v-for="chart in mobileCharts" :key="chart.id" class="mdash__chart-card">
              <div class="mdash__chart-head">
                <span class="mdash__chart-dot" :style="{ background: chart.color }" />
                <span>{{ chart.label }}</span>
                <span class="mdash__chart-badge">{{ chart.badge }}</span>
              </div>
              <div class="mdash__chart-body">
                <svg :viewBox="`0 0 ${chartW} ${chartH}`" preserveAspectRatio="none">
                  <defs>
                    <linearGradient :id="chart.gradId" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" :stop-color="chart.color" stop-opacity="0.4" />
                      <stop offset="100%" :stop-color="chart.color" stop-opacity="0" />
                    </linearGradient>
                    <filter :id="chart.gradId + 'Glow'">
                      <feGaussianBlur stdDeviation="1.5" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <line v-for="y in 3" :key="'h'+y" x1="0" :y1="(chartH/4)*y" :x2="chartW" :y2="(chartH/4)*y" stroke="rgba(255,255,255,0.025)" stroke-width="1" stroke-dasharray="2 4" />
                  <text v-for="y in [1,3]" :key="'l'+y" x="2" :y="(chartH/4)*y - 2" fill="rgba(255,255,255,0.07)" font-size="6" font-family="monospace">{{ 100 - y * 25 }}</text>
                  <path :d="chart.areaPath" :fill="`url(#${chart.gradId})`" />
                  <path :d="chart.linePath" fill="none" :stroke="chart.color" stroke-width="2" stroke-linejoin="round" :filter="`url(#${chart.gradId}Glow)`" />
                  <circle v-if="chart.lastPoint" :cx="chart.lastPoint.x" :cy="chart.lastPoint.y" r="3" :fill="chart.color" class="mdash__chart-dot-live" />
                  <circle v-if="chart.lastPoint" :cx="chart.lastPoint.x" :cy="chart.lastPoint.y" r="6" :fill="chart.color" opacity="0.2" class="mdash__chart-dot-pulse" />
                </svg>
              </div>
            </div>
          </div>

          <div class="mdash__metrics">
            <div v-for="(m, i) in metricItems" :key="m.label" class="mdash__metric" :style="{ '--i': i }">
              <div class="mdash__metric-top">
                <span class="mdash__metric-label">{{ m.label }}</span>
                <span class="mdash__metric-value">{{ m.value }}</span>
              </div>
              <div class="mdash__metric-bar"><div class="mdash__metric-bar-inner" :style="{ width: m.barWidth + '%', background: m.barColor }" /></div>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'system'" class="mdash__tab">
          <div class="mdash__card">
            <div class="mdash__card-head">System Info</div>
            <div class="mdash__info-list">
              <div class="mdash__info-row">
                <span>CPU Cores</span>
                <span>{{ cpuCores }} / {{ cpuThreads }}</span>
              </div>
              <div class="mdash__info-row">
                <span>Platform</span>
                <span>{{ navigator.platform || 'Unknown' }}</span>
              </div>
              <div class="mdash__info-row">
                <span>Memory</span>
                <span>{{ deviceMemoryGB > 0 ? deviceMemoryGB + 'GB' : '?' }}</span>
              </div>
              <div class="mdash__info-row">
                <span>Language</span>
                <span>{{ navigator.language }}</span>
              </div>
              <div class="mdash__info-row">
                <span>Online</span>
                <span :style="{ color: onlineStatus ? '#34C759' : '#FF3B30' }">{{ onlineStatus ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </div>

          <div v-if="battery.level > 0 || true" class="mdash__card">
            <div class="mdash__card-head">Battery</div>
            <div class="mdash__battery">
              <div class="mdash__battery-icon" :class="{ 'mdash__battery-icon--charging': battery.charging }">
                <div class="mdash__battery-fill" :style="{ height: (battery.level * 100) + '%' }" />
                <svg v-if="battery.charging" class="mdash__battery-zap" width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L3 9h4l-1 6 6-8H7l1-6z"/></svg>
              </div>
              <div class="mdash__battery-detail">
                <span class="mdash__battery-pct">{{ Math.round(battery.level * 100) }}%</span>
                <span class="mdash__battery-state">{{ battery.charging ? 'Charging' : battery.level > 0 ? 'On Battery' : 'AC Power' }}</span>
              </div>
            </div>
          </div>

          <div class="mdash__card">
            <div class="mdash__card-head">Performance</div>
            <div class="mdash__info-list">
              <div class="mdash__info-row">
                <span>FCP</span>
                <span>{{ paintTiming.fcp > 0 ? Math.round(paintTiming.fcp) + 'ms' : '—' }}</span>
              </div>
              <div class="mdash__info-row">
                <span>FP</span>
                <span>{{ paintTiming.fp > 0 ? Math.round(paintTiming.fp) + 'ms' : '—' }}</span>
              </div>
              <div class="mdash__info-row">
                <span>Long Tasks</span>
                <span :style="{ color: longTaskCount > 5 ? '#FF3B30' : '#34C759' }">{{ longTaskCount }}</span>
              </div>
              <div class="mdash__info-row">
                <span>CLS</span>
                <span :style="{ color: layoutShiftScore > 0.1 ? '#FF3B30' : '#34C759' }">{{ layoutShiftScore.toFixed(3) }}</span>
              </div>
              <div class="mdash__info-row">
                <span>Page Load</span>
                <span>{{ pageLoadTime }}ms</span>
              </div>
              <div class="mdash__info-row">
                <span>Session</span>
                <span>{{ formatUptime(uptime) }}</span>
              </div>
            </div>
          </div>

          <div class="mdash__card">
            <div class="mdash__card-head">Alerts ({{ alerts.length }})</div>
            <div class="mdash__alerts">
              <div v-for="(a, i) in alerts" :key="i" class="mdash__alert" :class="`mdash__alert--${a.level}`">
                <span>{{ a.message }}</span>
              </div>
              <div v-if="alerts.length === 0" class="mdash__alert mdash__alert--ok">All systems nominal.</div>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'network'" class="mdash__tab">
          <div class="mdash__card">
            <div class="mdash__card-head">
              <span>Network</span>
              <span class="mdash__network-badge" :class="networkStatusClass">{{ networkStatus }}</span>
            </div>
            <div class="mdash__network-grid">
              <div class="mdash__network-item">
                <span class="mdash__network-key">Status</span>
                <span class="mdash__network-val" :class="networkStatusClass">{{ networkStatus }}</span>
              </div>
              <div class="mdash__network-item">
                <span class="mdash__network-key">Latency</span>
                <span class="mdash__network-val" :style="{ color: latencyColor }">{{ latency }}ms</span>
              </div>
              <div class="mdash__network-item">
                <span class="mdash__network-key">Type</span>
                <span class="mdash__network-val">{{ connectionType }}</span>
              </div>
              <div class="mdash__network-item">
                <span class="mdash__network-key">Bandwidth</span>
                <span class="mdash__network-val">{{ downlinkSpeed > 0 ? downlinkSpeed + ' Mbps' : 'Unknown' }}</span>
              </div>
            </div>
            <button
              class="mdash__speed-btn"
              :class="{ 'mdash__speed-btn--testing': isSpeedTesting }"
              :disabled="isSpeedTesting"
              @click="runSpeedTest"
            >
              <div v-if="isSpeedTesting" class="mdash__speed-spinner" />
              <span>{{ isSpeedTesting ? 'Testing...' : 'Speed Test' }}</span>
            </button>
            <div v-if="downloadSpeed > 0 || uploadSpeed > 0" class="mdash__speed-results">
              <div class="mdash__speed-item">
                <span class="mdash__speed-item-lbl">Download</span>
                <span class="mdash__speed-item-val">{{ downloadSpeed }}<small>Mbps</small></span>
              </div>
              <div class="mdash__speed-item">
                <span class="mdash__speed-item-lbl">Upload</span>
                <span class="mdash__speed-item-val">{{ uploadSpeed }}<small>Mbps</small></span>
              </div>
              <div class="mdash__speed-item">
                <span class="mdash__speed-item-lbl">Ping</span>
                <span class="mdash__speed-item-val">{{ ping }}<small>ms</small></span>
              </div>
            </div>
          </div>
        </section>

        <footer class="mdash__footer">
          <span class="mdash__footer-pulse" :class="{ 'mdash__footer-pulse--live': isAutoRefresh }" />
          <span class="mdash__footer-text">{{ isAutoRefresh ? 'LIVE' : 'PAUSED' }} · {{ lastUpdated }}</span>
        </footer>
      </div>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
import { useDashboardData } from '../../composables/useDashboardData'

const {
  memoryUsage, cpuUsage, cpuCores, cpuThreads, jsHeap, domNodes, resources,
  jsListeners, latency, networkStatus, connectionType, currentTime, lastUpdated,
  isRefreshing, isAutoRefresh, fps, pageLoadTime, storageUsed,
  memoryHistory, cpuHistory, latencyHistory,
  performanceScore, statusLevel, scoreColor, memoryColor, cpuColor, latencyColor,
  networkStatusClass, battery, longTaskCount, uptime,
  deviceMemoryGB, downlinkSpeed, onlineStatus, paintTiming, layoutShiftScore,
  storagePercent, refreshMetrics, generateSvgPath, generateSvgAreaPath, getLastPoint, formatBytes, formatUptime,
} = useDashboardData(4000)

const activeTab = ref<'overview' | 'system' | 'network'>('overview')
const isSpeedTesting = ref(false)
const downloadSpeed = ref(0)
const uploadSpeed = ref(0)
const ping = ref(0)

const tabs = [
  { id: 'overview' as const, label: 'Overview' },
  { id: 'system' as const, label: 'System' },
  { id: 'network' as const, label: 'Net' },
]

const statusLabel = computed(() => {
  if (statusLevel.value === 'good') return 'NOMINAL'
  if (statusLevel.value === 'warn') return 'CAUTION'
  return 'FAILING'
})

const heroStats = computed(() => [
  { label: 'Memory', value: memoryUsage.value.percent, unit: '%', pct: memoryUsage.value.percent, color: memoryColor.value },
  { label: 'CPU', value: cpuUsage.value, unit: '%', pct: cpuUsage.value, color: cpuColor.value },
  { label: 'FPS', value: fps.value, unit: '', pct: Math.min(100, (fps.value / 60) * 100), color: fps.value >= 50 ? '#34C759' : fps.value >= 30 ? '#FF9500' : '#FF3B30' },
  { label: 'Ping', value: latency.value, unit: 'ms', pct: Math.min(100, (latency.value / 200) * 100), color: latencyColor.value },
])

const chartW = 300
const chartH = 64

const memLinePath = computed(() => generateSvgPath(memoryHistory.value, chartW, chartH))
const memAreaPath = computed(() => generateSvgAreaPath(memoryHistory.value, chartW, chartH))
const cpuLinePath = computed(() => generateSvgPath(cpuHistory.value, chartW, chartH))
const cpuAreaPath = computed(() => generateSvgAreaPath(cpuHistory.value, chartW, chartH))
const latLinePath = computed(() => generateSvgPath(latencyHistory.value, chartW, chartH))
const latAreaPath = computed(() => generateSvgAreaPath(latencyHistory.value, chartW, chartH))

const memLastPt = computed(() => getLastPoint(memoryHistory.value, chartW, chartH))
const cpuLastPt = computed(() => getLastPoint(cpuHistory.value, chartW, chartH))
const latLastPt = computed(() => getLastPoint(latencyHistory.value, chartW, chartH))

const mobileCharts = computed(() => [
  { id: 'mem', label: 'Memory', badge: `${memoryUsage.value.used}/${memoryUsage.value.limit}MB`, color: memoryColor.value, gradId: 'mMemGrad', linePath: memLinePath.value, areaPath: memAreaPath.value, lastPoint: memLastPt.value },
  { id: 'cpu', label: 'CPU Load', badge: `${cpuCores.value} cores`, color: cpuColor.value, gradId: 'mCpuGrad', linePath: cpuLinePath.value, areaPath: cpuAreaPath.value, lastPoint: cpuLastPt.value },
  { id: 'lat', label: 'Latency', badge: networkStatus.value, color: latencyColor.value, gradId: 'mLatGrad', linePath: latLinePath.value, areaPath: latAreaPath.value, lastPoint: latLastPt.value },
])

const metricItems = computed(() => [
  { label: 'JS Heap', value: jsHeap.value, barWidth: memoryUsage.value.percent, barColor: memoryColor.value },
  { label: 'DOM Nodes', value: domNodes.value, barWidth: Math.min(100, (parseInt(domNodes.value) || 0) / 50), barColor: (parseInt(domNodes.value) || 0) > 2000 ? '#FF9500' : '#34C759' },
  { label: 'Resources', value: resources.value, barWidth: Math.min(100, (parseInt(resources.value) || 0) / 2), barColor: (parseInt(resources.value) || 0) > 100 ? '#FF9500' : '#5AC8FA' },
  { label: 'Listeners', value: jsListeners.value, barWidth: 0, barColor: scoreColor.value },
  { label: 'Storage', value: formatBytes(storageUsed.value), barWidth: storagePercent.value, barColor: storagePercent.value > 80 ? '#FF9500' : '#34C759' },
  { label: 'Page Load', value: pageLoadTime.value + 'ms', barWidth: Math.min(100, pageLoadTime.value / 50), barColor: pageLoadTime.value > 3000 ? '#FF9500' : '#34C759' },
])

const alerts = computed(() => {
  const list: { level: 'warn' | 'bad' | 'ok'; message: string }[] = []
  if (memoryUsage.value.percent > 80) list.push({ level: 'warn', message: `Memory: ${memoryUsage.value.percent}%` })
  if (cpuUsage.value > 70) list.push({ level: 'warn', message: `CPU: ${cpuUsage.value}%` })
  if (!onlineStatus.value) list.push({ level: 'bad', message: 'No network' })
  if (latency.value > 150) list.push({ level: 'warn', message: `Latency: ${latency.value}ms` })
  if (fps.value < 30) list.push({ level: 'bad', message: `Low FPS: ${fps.value}` })
  return list
})

function particleStyle(n: number) {
  const x = Math.sin(n * 2.1 + 0.7) * 42 + 50
  const y = Math.cos(n * 1.8 + 1.3) * 42 + 50
  const duration = 6 + (n % 6)
  const delay = n * 0.4
  const size = 1 + (n % 3)
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
  }
}

const navigator = window.navigator

function onClose(): void {}

async function runSpeedTest() {
  if (isSpeedTesting.value) return
  isSpeedTesting.value = true
  downloadSpeed.value = 0
  uploadSpeed.value = 0
  ping.value = 0
  try {
    const SpeedTest = (await import('@cloudflare/speedtest')).default
    const test = new SpeedTest({ autoStart: true })
    test.onFinish = (results: any) => {
      const s = results.getSummary()
      downloadSpeed.value = Math.round(s.download || 0)
      uploadSpeed.value = Math.round(s.upload || 0)
      ping.value = Math.round(s.latency || 0)
      isSpeedTesting.value = false
    }
    test.onError = () => { isSpeedTesting.value = false }
  } catch { isSpeedTesting.value = false }
}
</script>

<style scoped>
.mdash {
  position: relative;
  min-height: 100%;
  background: #050508;
  font-family: 'SF Mono', 'JetBrains Mono', 'Cascadia Code', monospace;
  color: rgba(255,255,255,0.9);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mdash__bg {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 0;
  overflow: hidden;
}

.mdash__bg-orb {
  position: absolute; border-radius: 50%;
  filter: blur(80px); opacity: 0.07;
  animation: mOrbFloat 14s ease-in-out infinite alternate;
}

.mdash__bg-orb--1 {
  width: 260px; height: 260px;
  background: var(--gui-accent, #007AFF);
  top: -80px; right: -50px;
}

.mdash__bg-orb--2 {
  width: 200px; height: 200px;
  background: #5E5CE6;
  bottom: -50px; left: -40px;
  animation-delay: -7s;
  animation-duration: 16s;
}

.mdash__bg-orb--3 {
  width: 140px; height: 140px;
  background: #30B0C7;
  top: 35%; left: 50%;
  animation-delay: -3s;
  animation-duration: 18s;
  opacity: 0.04;
}

@keyframes mOrbFloat {
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(10px, -8px) scale(1.03); }
  66% { transform: translate(-5px, 5px) scale(1.05); }
  100% { transform: translate(8px, 12px) scale(1.07); }
}

.mdash__bg-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: radial-gradient(ellipse at center, black 25%, transparent 65%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 25%, transparent 65%);
}

.mdash__bg-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.35) 100%);
  pointer-events: none;
}

.mdash__particles {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 1;
  overflow: hidden;
}

.mdash__particle {
  position: absolute;
  background: rgba(255,255,255,0.45);
  border-radius: 50%;
  animation: mParticleFloat linear infinite;
  box-shadow: 0 0 3px rgba(255,255,255,0.12);
}

@keyframes mParticleFloat {
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  8% { opacity: 0.35; }
  92% { opacity: 0.35; }
  100% { transform: translateY(-400px) translateX(20px); opacity: 0; }
}

.mdash__content {
  position: relative; z-index: 2;
  padding: 12px;
  display: flex; flex-direction: column;
  gap: 12px;
}

.mdash__header { display: flex; flex-direction: column; gap: 4px; }

.mdash__header-top {
  display: flex; align-items: center;
  justify-content: space-between;
}

.mdash__status {
  display: flex; align-items: center; gap: 6px;
}

.mdash__status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  transition: all 0.3s ease;
}

.mdash__status-dot--good { background: #34C759; box-shadow: 0 0 12px rgba(52,199,89,0.7); animation: mStatusPulse 2s ease-in-out infinite; }
.mdash__status-dot--warn { background: #FF9500; box-shadow: 0 0 12px rgba(255,149,0,0.7); animation: mStatusPulse 1.5s ease-in-out infinite; }
.mdash__status-dot--bad { background: #FF3B30; box-shadow: 0 0 12px rgba(255,59,48,0.7); animation: mStatusPulse 0.8s ease-in-out infinite; }

@keyframes mStatusPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.5); }
}

.mdash__status-text {
  font-size: 11px; font-weight: 700;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase; letter-spacing: 0.08em;
}

.mdash__header-actions { display: flex; align-items: center; gap: 8px; }

.mdash__tab-pills {
  display: flex; gap: 2px;
  background: rgba(255,255,255,0.04);
  border-radius: 8px; padding: 2px;
}

.mdash__pill {
  padding: 4px 10px; border-radius: 6px;
  border: none; background: transparent;
  color: rgba(255,255,255,0.3);
  font-size: 10px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
  text-transform: uppercase; letter-spacing: 0.04em;
  -webkit-tap-highlight-color: transparent;
}

.mdash__pill:active { transform: scale(0.95); }
.mdash__pill--active { background: rgba(255,255,255,0.1); color: #fff; }

.mdash__refresh-btn {
  width: 30px; height: 30px;
  border-radius: 8px; border: none;
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.4);
  display: flex; align-items: center;
  justify-content: center;
  cursor: pointer; transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.mdash__refresh-btn:active { background: rgba(255,255,255,0.1); transform: scale(0.9); }
.mdash__refresh-btn--spin { animation: mSpin 0.8s linear infinite; }
@keyframes mSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.mdash__meta {
  display: flex; align-items: center; gap: 6px;
  padding-left: 13px;
}

.mdash__meta-item {
  font-size: 9px; color: rgba(255,255,255,0.18);
  letter-spacing: 0.04em;
}

.mdash__meta-sep { color: rgba(255,255,255,0.08); }

.mdash__tab {
  display: flex; flex-direction: column; gap: 10px;
  animation: mFadeIn 0.3s ease both;
}

.mdash__hero {
  display: flex; flex-direction: column;
  align-items: center; gap: 10px;
  padding: 14px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 14px;
  backdrop-filter: blur(16px);
}

.mdash__gauge-cluster {
  width: 150px;
}

.mdash__gauge-svg {
  width: 100%; height: auto;
}

.mdash__gauge-arc {
  transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease;
}

.mdash__mini-gauges {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  width: 100%;
}

.mdash__mini-stat {
  display: flex; flex-direction: column;
  align-items: center; gap: 3px;
  padding: 6px 2px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.03);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.mdash__mini-stat:active {
  transform: scale(0.95);
  background: rgba(255,255,255,0.04);
}

.mdash__mini-gauge {
  width: 42px; height: 24px;
}

.mdash__mini-gauge-arc {
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.mdash__mini-stat-body { text-align: center; }

.mdash__mini-stat-val {
  font-size: 12px; font-weight: 800; line-height: 1;
}

.mdash__mini-stat-val small {
  font-size: 8px; font-weight: 500;
  color: rgba(255,255,255,0.3); margin-left: 1px;
}

.mdash__mini-stat-lbl {
  display: block; font-size: 7px;
  color: rgba(255,255,255,0.2); margin-top: 2px;
  text-transform: uppercase; letter-spacing: 0.04em;
}

.mdash__chart-section {
  display: flex; flex-direction: column; gap: 8px;
}

.mdash__chart-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 12px; padding: 10px;
  backdrop-filter: blur(8px);
}

.mdash__chart-head {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 700;
  color: rgba(255,255,255,0.5);
  margin-bottom: 6px;
  text-transform: uppercase; letter-spacing: 0.05em;
}

.mdash__chart-dot {
  width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
}

.mdash__chart-badge {
  margin-left: auto; font-size: 8px;
  font-weight: 500; color: rgba(255,255,255,0.18);
}

.mdash__chart-body {
  width: 100%; height: 54px;
  background: rgba(0,0,0,0.25);
  border-radius: 6px; overflow: hidden;
}

.mdash__chart-body svg { width: 100%; height: 100%; }

.mdash__chart-dot-live {
  transition: cx 0.3s ease, cy 0.3s ease;
}

.mdash__chart-dot-pulse {
  animation: mChartPulse 2s ease-in-out infinite;
}

@keyframes mChartPulse {
  0%, 100% { r: 6; opacity: 0.2; }
  50% { r: 10; opacity: 0; }
}

.mdash__metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }

.mdash__metric {
  display: flex; flex-direction: column; gap: 4px;
  padding: 8px 10px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 10px;
  animation: mFadeIn 0.35s ease both;
  animation-delay: calc(var(--i, 0) * 50ms);
  position: relative; overflow: hidden;
}

.mdash__metric-top {
  display: flex; justify-content: space-between;
}

.mdash__metric-label {
  font-size: 9px; color: rgba(255,255,255,0.25);
  text-transform: uppercase; letter-spacing: 0.04em;
}

.mdash__metric-value {
  font-size: 10px; font-weight: 700;
  color: rgba(255,255,255,0.7);
}

.mdash__metric-bar {
  height: 2px; background: rgba(255,255,255,0.04);
  border-radius: 1px; overflow: hidden;
}

.mdash__metric-bar-inner {
  height: 100%; border-radius: 1px;
  transition: width 0.5s ease;
  min-width: 0;
}

.mdash__card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 12px; padding: 12px;
}

.mdash__card-head {
  display: flex; align-items: center;
  justify-content: space-between;
  font-size: 11px; font-weight: 700;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
}

.mdash__info-list { display: flex; flex-direction: column; gap: 1px; }

.mdash__info-row {
  display: flex; justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255,255,255,0.02);
  font-size: 10px;
}

.mdash__info-row span:first-child { color: rgba(255,255,255,0.25); }
.mdash__info-row span:last-child { color: rgba(255,255,255,0.65); font-weight: 600; }

.mdash__battery {
  display: flex; align-items: center; gap: 16px;
}

.mdash__battery-icon {
  position: relative; width: 28px; height: 48px;
  border: 2px solid rgba(255,255,255,0.25);
  border-radius: 5px; padding: 2px; overflow: hidden;
  flex-shrink: 0;
}

.mdash__battery-icon::after {
  content: ''; position: absolute;
  top: -4px; left: 50%; transform: translateX(-50%);
  width: 12px; height: 2px;
  background: rgba(255,255,255,0.25);
  border-radius: 1px 1px 0 0;
}

.mdash__battery-fill {
  background: #34C759; border-radius: 3px;
  transition: height 0.5s ease; width: 100%;
  position: absolute; bottom: 2px; left: 2px; right: 2px;
}

.mdash__battery-icon--charging .mdash__battery-fill { background: #FF9500; }

.mdash__battery-zap {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255,255,255,0.7);
}

.mdash__battery-detail { display: flex; flex-direction: column; gap: 1px; }

.mdash__battery-pct { font-size: 18px; font-weight: 800; color: #fff; }

.mdash__battery-state { font-size: 9px; color: rgba(255,255,255,0.3); }

.mdash__alerts { display: flex; flex-direction: column; gap: 3px; }

.mdash__alert {
  padding: 5px 8px; border-radius: 5px;
  font-size: 9px; border-left: 3px solid transparent;
}

.mdash__alert--warn { border-left-color: #FF9500; background: rgba(255,149,0,0.04); color: rgba(255,255,255,0.5); }
.mdash__alert--bad { border-left-color: #FF3B30; background: rgba(255,59,48,0.04); color: rgba(255,255,255,0.5); }
.mdash__alert--ok { color: rgba(255,255,255,0.3); padding: 5px 0; }

.mdash__network-badge {
  font-size: 9px; font-weight: 700;
  padding: 2px 8px; border-radius: 4px;
  text-transform: uppercase; letter-spacing: 0.06em;
}

.status-online { color: #34C759; }
.status-slow { color: #FF9500; }
.status-offline { color: #FF3B30; }

.mdash__network-badge.status-online { background: rgba(52,199,89,0.12); color: #34C759; }
.mdash__network-badge.status-slow { background: rgba(255,149,0,0.12); color: #FF9500; }
.mdash__network-badge.status-offline { background: rgba(255,59,48,0.12); color: #FF3B30; }

.mdash__network-grid {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 8px; margin-bottom: 10px;
}

.mdash__network-item { display: flex; flex-direction: column; gap: 1px; }

.mdash__network-key {
  font-size: 8px; color: rgba(255,255,255,0.22);
  text-transform: uppercase; letter-spacing: 0.04em;
}

.mdash__network-val {
  font-size: 11px; font-weight: 700;
  color: rgba(255,255,255,0.75);
}

.mdash__speed-btn {
  width: 100%; display: flex;
  align-items: center; justify-content: center;
  gap: 6px; padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.5);
  font-size: 12px; font-weight: 700;
  cursor: pointer; transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  text-transform: uppercase; letter-spacing: 0.05em;
}

.mdash__speed-btn:active:not(:disabled) { background: rgba(255,255,255,0.08); transform: scale(0.97); }
.mdash__speed-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.mdash__speed-spinner {
  width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,0.08);
  border-top: 2px solid #fff;
  border-radius: 50%;
  animation: mSpin 0.8s linear infinite;
}

.mdash__speed-results {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 10px; margin-top: 10px;
  padding: 10px;
  background: rgba(0,0,0,0.25);
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.02);
}

.mdash__speed-item { display: flex; flex-direction: column; gap: 1px; }

.mdash__speed-item-lbl {
  font-size: 8px; color: rgba(255,255,255,0.25);
  text-transform: uppercase; letter-spacing: 0.08em;
}

.mdash__speed-item-val {
  font-size: 13px; font-weight: 800; color: #fff;
}

.mdash__speed-item-val small {
  font-size: 8px; font-weight: 500;
  color: rgba(255,255,255,0.25);
}

.mdash__footer {
  display: flex; align-items: center;
  justify-content: center; gap: 5px;
  padding: 2px 0 6px;
}

.mdash__footer-pulse {
  width: 4px; height: 4px; border-radius: 50%;
  background: rgba(255,255,255,0.1);
  transition: all 0.3s ease;
}

.mdash__footer-pulse--live {
  background: #34C759;
  box-shadow: 0 0 8px rgba(52,199,89,0.6);
  animation: mPulse 2s ease-in-out infinite;
}

@keyframes mPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.7); }
}

.mdash__footer-text {
  font-size: 9px; color: rgba(255,255,255,0.18);
  text-transform: uppercase; letter-spacing: 0.06em;
}

@keyframes mFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 350px) {
  .mdash__mini-gauges { grid-template-columns: repeat(2, 1fr); }
  .mdash__content { padding: 10px; gap: 8px; }
  .mdash__pill { padding: 3px 8px; font-size: 9px; }
}
</style>
