<template>
  <MobileWindow title="Dashboard" @close="onClose">
    <div class="mdash">
      <div class="mdash__bg">
        <div class="mdash__bg-orb mdash__bg-orb--1" />
        <div class="mdash__bg-orb mdash__bg-orb--2" />
      </div>

      <div class="mdash__content">
        <header class="mdash__header">
          <div class="mdash__status">
            <span class="mdash__status-dot" :class="`mdash__status-dot--${statusLevel}`" />
            <span class="mdash__status-text">{{ statusLabel }}</span>
          </div>
          <button class="mdash__refresh-btn" :class="{ 'mdash__refresh-btn--spin': isRefreshing }" @click="refreshMetrics">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 8a5 5 0 019.33-2.5M13 8a5 5 0 01-9.33 2.5"/>
              <path d="M15 4v3h-3M1 12v-3h3"/>
            </svg>
          </button>
        </header>

        <section class="mdash__hero">
          <div class="mdash__score-wrap">
            <svg class="mdash__score-svg" viewBox="0 0 120 120">
              <defs>
                <filter id="mScoreGlow">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="8" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                :stroke="scoreColor" stroke-width="8" stroke-linecap="round"
                :stroke-dasharray="314.2"
                :stroke-dashoffset="314.2 - (314.2 * performanceScore / 100)"
                transform="rotate(-90 60 60)"
                class="mdash__score-arc"
                filter="url(#mScoreGlow)"
              />
            </svg>
            <div class="mdash__score-inner">
              <span class="mdash__score-num" :style="{ color: scoreColor }">{{ performanceScore }}</span>
              <span class="mdash__score-lbl">SCORE</span>
            </div>
          </div>
        </section>

        <section class="mdash__rings">
          <div class="mdash__ring-item">
            <div class="mdash__ring" :style="{ '--ring-pct': memoryUsage.percent, '--ring-color': memoryColor }" />
            <div class="mdash__ring-info">
              <span class="mdash__ring-val">{{ memoryUsage.percent }}%</span>
              <span class="mdash__ring-lbl">Memory</span>
            </div>
          </div>
          <div class="mdash__ring-item">
            <div class="mdash__ring" :style="{ '--ring-pct': cpuUsage, '--ring-color': cpuColor }" />
            <div class="mdash__ring-info">
              <span class="mdash__ring-val">{{ cpuUsage }}%</span>
              <span class="mdash__ring-lbl">CPU</span>
            </div>
          </div>
          <div class="mdash__ring-item">
            <div class="mdash__ring" :style="{ '--ring-pct': Math.min(100, (fps / 60) * 100), '--ring-color': fps >= 50 ? '#34C759' : fps >= 30 ? '#FF9500' : '#FF3B30' }" />
            <div class="mdash__ring-info">
              <span class="mdash__ring-val">{{ fps }}</span>
              <span class="mdash__ring-lbl">FPS</span>
            </div>
          </div>
          <div class="mdash__ring-item">
            <div class="mdash__ring" :style="{ '--ring-pct': Math.min(100, (latency / 200) * 100), '--ring-color': latencyColor }" />
            <div class="mdash__ring-info">
              <span class="mdash__ring-val">{{ latency }}ms</span>
              <span class="mdash__ring-lbl">Ping</span>
            </div>
          </div>
        </section>

        <section class="mdash__chart-section">
          <div class="mdash__chart-card">
            <div class="mdash__chart-head">
              <span class="mdash__chart-dot" :style="{ background: memoryColor }" />
              <span>Memory</span>
              <span class="mdash__chart-badge">{{ memoryUsage.used }}/{{ memoryUsage.limit }}MB</span>
            </div>
            <div class="mdash__chart-body">
              <svg :viewBox="`0 0 ${chartW} ${chartH}`" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="mMemGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" :stop-color="memoryColor" stop-opacity="0.3" />
                    <stop offset="100%" :stop-color="memoryColor" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path :d="memAreaPath" fill="url(#mMemGrad)" />
                <path :d="memLinePath" fill="none" :stroke="memoryColor" stroke-width="2" stroke-linejoin="round" />
              </svg>
            </div>
          </div>
          <div class="mdash__chart-card">
            <div class="mdash__chart-head">
              <span class="mdash__chart-dot" :style="{ background: cpuColor }" />
              <span>CPU</span>
              <span class="mdash__chart-badge">{{ cpuCores }} cores</span>
            </div>
            <div class="mdash__chart-body">
              <svg :viewBox="`0 0 ${chartW} ${chartH}`" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="mCpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" :stop-color="cpuColor" stop-opacity="0.3" />
                    <stop offset="100%" :stop-color="cpuColor" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path :d="cpuAreaPath" fill="url(#mCpuGrad)" />
                <path :d="cpuLinePath" fill="none" :stroke="cpuColor" stroke-width="2" stroke-linejoin="round" />
              </svg>
            </div>
          </div>
        </section>

        <section class="mdash__metrics">
          <div v-for="(m, i) in metricItems" :key="m.label" class="mdash__metric" :style="{ '--i': i }">
            <span class="mdash__metric-label">{{ m.label }}</span>
            <span class="mdash__metric-value">{{ m.value }}</span>
          </div>
        </section>

        <section class="mdash__network">
          <div class="mdash__network-head">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 6c2-3 10-3 14 0"/><path d="M3 9c1.5-2 7.5-2 10 0"/><circle cx="8" cy="14" r="1" fill="currentColor"/>
            </svg>
            <span>Network</span>
            <span class="mdash__network-badge" :class="networkStatusClass">{{ networkStatus }}</span>
          </div>
          <div class="mdash__network-grid">
            <div class="mdash__network-item">
              <span class="mdash__network-key">Type</span>
              <span class="mdash__network-val">{{ connectionType }}</span>
            </div>
            <div class="mdash__network-item">
              <span class="mdash__network-key">Latency</span>
              <span class="mdash__network-val">{{ latency }}ms</span>
            </div>
            <div class="mdash__network-item">
              <span class="mdash__network-key">Page Load</span>
              <span class="mdash__network-val">{{ pageLoadTime }}ms</span>
            </div>
            <div class="mdash__network-item">
              <span class="mdash__network-key">Storage</span>
              <span class="mdash__network-val">{{ storageFormatted }}</span>
            </div>
          </div>
          <button
            class="mdash__speed-btn"
            :class="{ 'mdash__speed-btn--testing': isSpeedTesting }"
            :disabled="isSpeedTesting"
            @click="runSpeedTest"
          >
            <div v-if="isSpeedTesting" class="mdash__speed-spinner" />
            <svg v-else width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 6c2-3 10-3 14 0"/><path d="M3 9c1.5-2 7.5-2 10 0"/><circle cx="8" cy="14" r="1" fill="currentColor"/>
            </svg>
            <span>{{ isSpeedTesting ? 'Testing...' : 'Speed Test' }}</span>
          </button>
          <div v-if="downloadSpeed > 0 || uploadSpeed > 0" class="mdash__speed-results">
            <div class="mdash__speed-item">
              <span class="mdash__speed-item-lbl">DL</span>
              <span class="mdash__speed-item-val">{{ downloadSpeed }}<small>Mbps</small></span>
            </div>
            <div class="mdash__speed-item">
              <span class="mdash__speed-item-lbl">UL</span>
              <span class="mdash__speed-item-val">{{ uploadSpeed }}<small>Mbps</small></span>
            </div>
            <div class="mdash__speed-item">
              <span class="mdash__speed-item-lbl">Ping</span>
              <span class="mdash__speed-item-val">{{ ping }}<small>ms</small></span>
            </div>
          </div>
        </section>

        <footer class="mdash__footer">
          <span class="mdash__footer-pulse" :class="{ 'mdash__footer-pulse--live': isAutoRefresh }" />
          <span class="mdash__footer-text">Updated {{ lastUpdated }}</span>
        </footer>
      </div>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
import { useDashboardData } from '../../composables/useDashboardData'
import Speedtest from '@cloudflare/speedtest'

const {
  memoryUsage, cpuUsage, cpuCores, jsHeap, domNodes, resources,
  jsListeners, latency, networkStatus, connectionType, lastUpdated,
  isRefreshing, isAutoRefresh, fps, pageLoadTime, storageUsed,
  memoryHistory, cpuHistory,
  performanceScore, statusLevel, scoreColor, memoryColor, cpuColor, latencyColor,
  networkStatusClass, refreshMetrics, generateSvgPath, generateSvgAreaPath, formatBytes,
} = useDashboardData(4000)

const isSpeedTesting = ref(false)
const downloadSpeed = ref(0)
const uploadSpeed = ref(0)
const ping = ref(0)

const statusLabel = computed(() => {
  if (statusLevel.value === 'good') return 'Nominal'
  if (statusLevel.value === 'warn') return 'Attention'
  return 'Degraded'
})

const chartW = 300
const chartH = 70

const memLinePath = computed(() => generateSvgPath(memoryHistory.value, chartW, chartH))
const memAreaPath = computed(() => generateSvgAreaPath(memoryHistory.value, chartW, chartH))
const cpuLinePath = computed(() => generateSvgPath(cpuHistory.value, chartW, chartH))
const cpuAreaPath = computed(() => generateSvgAreaPath(cpuHistory.value, chartW, chartH))

const storageFormatted = computed(() => formatBytes(storageUsed.value))

const metricItems = computed(() => [
  { label: 'JS Heap', value: jsHeap.value },
  { label: 'DOM Nodes', value: domNodes.value },
  { label: 'Resources', value: resources.value },
  { label: 'Listeners', value: jsListeners.value },
])

function onClose(): void {}

async function runSpeedTest() {
  if (isSpeedTesting.value) return
  isSpeedTesting.value = true
  try {
    const test = new Speedtest({ autoStart: true })
    test.onFinish = (results) => {
      const summary = results.getSummary()
      downloadSpeed.value = Math.round(summary.download || 0)
      uploadSpeed.value = Math.round(summary.upload || 0)
      ping.value = Math.round(summary.latency || 0)
      latency.value = ping.value
      isSpeedTesting.value = false
    }
    test.onError = () => {
      isSpeedTesting.value = false
    }
  } catch {
    isSpeedTesting.value = false
  }
}
</script>

<style scoped>
.mdash {
  position: relative;
  min-height: 100%;
  background: #08080C;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
  color: #fff;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mdash__bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.mdash__bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.1;
  animation: mOrbFloat 10s ease-in-out infinite alternate;
}

.mdash__bg-orb--1 {
  width: 200px;
  height: 200px;
  background: var(--gui-accent, #007AFF);
  top: -60px;
  right: -40px;
}

.mdash__bg-orb--2 {
  width: 160px;
  height: 160px;
  background: #5856D6;
  bottom: -40px;
  left: -30px;
  animation-delay: -5s;
}

@keyframes mOrbFloat {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(10px, 20px) scale(1.08); }
}

.mdash__content {
  position: relative;
  z-index: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mdash__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mdash__status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mdash__status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.mdash__status-dot--good { background: #34C759; box-shadow: 0 0 8px rgba(52,199,89,0.5); }
.mdash__status-dot--warn { background: #FF9500; box-shadow: 0 0 8px rgba(255,149,0,0.5); }
.mdash__status-dot--bad { background: #FF3B30; box-shadow: 0 0 8px rgba(255,59,48,0.5); }

.mdash__status-text {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
}

.mdash__refresh-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: none;
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.mdash__refresh-btn:active { background: rgba(255,255,255,0.12); transform: scale(0.92); }
.mdash__refresh-btn--spin { animation: mSpin 0.8s linear infinite; }
@keyframes mSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.mdash__hero {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  backdrop-filter: blur(16px);
  animation: mFadeIn 0.4s ease both;
}

.mdash__score-wrap {
  position: relative;
  width: 100px;
  height: 100px;
}

.mdash__score-svg {
  width: 100%;
  height: 100%;
}

.mdash__score-arc {
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease;
}

.mdash__score-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.mdash__score-num {
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
}

.mdash__score-lbl {
  display: block;
  font-size: 8px;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.15em;
  margin-top: 2px;
}

.mdash__rings {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.mdash__ring-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  animation: mFadeIn 0.4s ease both;
  transition: all 0.2s ease;
}

.mdash__ring-item:active {
  transform: scale(0.96);
  background: rgba(255,255,255,0.06);
}

.mdash__ring {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: conic-gradient(
    var(--ring-color) calc(var(--ring-pct) * 3.6deg),
    rgba(255,255,255,0.06) 0deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s ease;
}

.mdash__ring::after {
  content: '';
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #0D0D12;
}

.mdash__ring-info {
  text-align: center;
}

.mdash__ring-val {
  font-size: 13px;
  font-weight: 700;
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  color: #fff;
}

.mdash__ring-lbl {
  display: block;
  font-size: 9px;
  color: rgba(255,255,255,0.3);
  margin-top: 1px;
}

.mdash__chart-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mdash__chart-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 12px;
  backdrop-filter: blur(10px);
  animation: mFadeIn 0.4s ease both;
}

.mdash__chart-head {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
  margin-bottom: 8px;
}

.mdash__chart-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.mdash__chart-badge {
  margin-left: auto;
  font-size: 9px;
  font-weight: 500;
  color: rgba(255,255,255,0.25);
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
}

.mdash__chart-body {
  width: 100%;
  height: 60px;
  background: rgba(0,0,0,0.25);
  border-radius: 8px;
  overflow: hidden;
}

.mdash__chart-body svg {
  width: 100%;
  height: 100%;
}

.mdash__metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.mdash__metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px;
  animation: mFadeIn 0.4s ease both;
  animation-delay: calc(var(--i, 0) * 50ms);
}

.mdash__metric-label {
  font-size: 11px;
  color: rgba(255,255,255,0.35);
}

.mdash__metric-value {
  font-size: 12px;
  font-weight: 600;
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  color: rgba(255,255,255,0.9);
}

.mdash__network {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 14px;
  backdrop-filter: blur(10px);
}

.mdash__network-head {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
  margin-bottom: 10px;
}

.mdash__network-badge {
  margin-left: auto;
  font-size: 9px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-online { color: #34C759; }
.status-slow { color: #FF9500; }
.status-offline { color: #FF3B30; }

.mdash__network-badge.status-online { background: rgba(52,199,89,0.12); color: #34C759; }
.mdash__network-badge.status-slow { background: rgba(255,149,0,0.12); color: #FF9500; }
.mdash__network-badge.status-offline { background: rgba(255,59,48,0.12); color: #FF3B30; }

.mdash__network-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.mdash__network-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.mdash__network-key {
  font-size: 9px;
  color: rgba(255,255,255,0.3);
}

.mdash__network-val {
  font-size: 12px;
  font-weight: 600;
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  color: rgba(255,255,255,0.9);
}

.mdash__speed-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.7);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.mdash__speed-btn:active:not(:disabled) { background: rgba(255,255,255,0.1); transform: scale(0.98); }
.mdash__speed-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.mdash__speed-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.12);
  border-top: 2px solid #fff;
  border-radius: 50%;
  animation: mSpin 0.8s linear infinite;
}

.mdash__speed-results {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 10px;
  padding: 10px;
  background: rgba(0,0,0,0.25);
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.04);
}

.mdash__speed-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.mdash__speed-item-lbl {
  font-size: 8px;
  color: rgba(255,255,255,0.3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.mdash__speed-item-val {
  font-size: 14px;
  font-weight: 700;
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  color: #fff;
}

.mdash__speed-item-val small {
  font-size: 9px;
  font-weight: 500;
  color: rgba(255,255,255,0.3);
}

.mdash__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 4px 0 8px;
}

.mdash__footer-pulse {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  transition: all 0.3s ease;
}

.mdash__footer-pulse--live {
  background: #34C759;
  box-shadow: 0 0 5px rgba(52,199,89,0.5);
  animation: mPulse 2s ease-in-out infinite;
}

@keyframes mPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

@keyframes mFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 360px) {
  .mdash__rings { grid-template-columns: repeat(2, 1fr); }
  .mdash__content { padding: 12px; gap: 10px; }
}
</style>
