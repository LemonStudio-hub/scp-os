<template>
  <SCPWindow :window-instance="windowInstance" @close="onClose">
    <div class="dash">
      <div class="dash__bg">
        <div class="dash__bg-orb dash__bg-orb--1" />
        <div class="dash__bg-orb dash__bg-orb--2" />
        <div class="dash__bg-grid" />
      </div>

      <div class="dash__content">
        <header class="dash__header">
          <div class="dash__header-left">
            <div class="dash__status-indicator">
              <span class="dash__status-dot" :class="`dash__status-dot--${statusLevel}`" />
              <span class="dash__status-label">{{ statusLabel }}</span>
            </div>
          </div>
          <div class="dash__header-center">
            <span class="dash__clock">{{ currentTime }}</span>
          </div>
          <div class="dash__header-right">
            <button
              class="dash__btn-icon"
              :class="{ 'dash__btn-icon--spinning': isRefreshing }"
              @click="refreshMetrics"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 8a5 5 0 019.33-2.5M13 8a5 5 0 01-9.33 2.5"/>
                <path d="M15 4v3h-3M1 12v-3h3"/>
              </svg>
            </button>
          </div>
        </header>

        <section class="dash__hero">
          <div class="dash__score-ring-wrap">
            <svg class="dash__score-svg" viewBox="0 0 140 140">
              <defs>
                <filter id="scoreGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="10" />
              <circle
                cx="70" cy="70" r="58" fill="none"
                :stroke="scoreColor" stroke-width="10" stroke-linecap="round"
                :stroke-dasharray="364.4"
                :stroke-dashoffset="364.4 - (364.4 * performanceScore / 100)"
                transform="rotate(-90 70 70)"
                class="dash__score-arc"
                filter="url(#scoreGlow)"
              />
            </svg>
            <div class="dash__score-center">
              <span class="dash__score-number" :style="{ color: scoreColor }">{{ performanceScore }}</span>
              <span class="dash__score-unit">SCORE</span>
            </div>
          </div>
          <div class="dash__hero-stats">
            <div class="dash__hero-stat">
              <div class="dash__hero-stat-ring" :style="{ '--ring-pct': memoryUsage.percent, '--ring-color': memoryColor }" />
              <div class="dash__hero-stat-body">
                <span class="dash__hero-stat-val">{{ memoryUsage.percent }}<small>%</small></span>
                <span class="dash__hero-stat-lbl">Memory</span>
              </div>
            </div>
            <div class="dash__hero-stat">
              <div class="dash__hero-stat-ring" :style="{ '--ring-pct': cpuUsage, '--ring-color': cpuColor }" />
              <div class="dash__hero-stat-body">
                <span class="dash__hero-stat-val">{{ cpuUsage }}<small>%</small></span>
                <span class="dash__hero-stat-lbl">CPU</span>
              </div>
            </div>
            <div class="dash__hero-stat">
              <div class="dash__hero-stat-ring" :style="{ '--ring-pct': Math.min(100, (fps / 60) * 100), '--ring-color': fps >= 50 ? '#34C759' : fps >= 30 ? '#FF9500' : '#FF3B30' }" />
              <div class="dash__hero-stat-body">
                <span class="dash__hero-stat-val">{{ fps }}<small>fps</small></span>
                <span class="dash__hero-stat-lbl">Frame Rate</span>
              </div>
            </div>
            <div class="dash__hero-stat">
              <div class="dash__hero-stat-ring" :style="{ '--ring-pct': Math.min(100, (latency / 200) * 100), '--ring-color': latencyColor }" />
              <div class="dash__hero-stat-body">
                <span class="dash__hero-stat-val">{{ latency }}<small>ms</small></span>
                <span class="dash__hero-stat-lbl">Latency</span>
              </div>
            </div>
          </div>
        </section>

        <section class="dash__charts">
          <div class="dash__chart-card" style="--delay:0">
            <div class="dash__chart-head">
              <span class="dash__chart-dot" :style="{ background: memoryColor }" />
              <span>Memory Timeline</span>
              <span class="dash__chart-badge">{{ memoryUsage.used }} / {{ memoryUsage.limit }} MB</span>
            </div>
            <div class="dash__chart-body">
              <svg :viewBox="`0 0 ${chartW} ${chartH}`" preserveAspectRatio="none">
                <defs>
                  <linearGradient :id="'memGrad'" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" :stop-color="memoryColor" stop-opacity="0.35" />
                    <stop offset="100%" :stop-color="memoryColor" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path :d="memAreaPath" :fill="`url(#memGrad)`" />
                <path :d="memLinePath" fill="none" :stroke="memoryColor" stroke-width="2" stroke-linejoin="round" class="dash__chart-line" />
              </svg>
            </div>
          </div>
          <div class="dash__chart-card" style="--delay:1">
            <div class="dash__chart-head">
              <span class="dash__chart-dot" :style="{ background: cpuColor }" />
              <span>CPU Timeline</span>
              <span class="dash__chart-badge">{{ cpuCores }} cores / {{ cpuThreads }} threads</span>
            </div>
            <div class="dash__chart-body">
              <svg :viewBox="`0 0 ${chartW} ${chartH}`" preserveAspectRatio="none">
                <defs>
                  <linearGradient :id="'cpuGrad'" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" :stop-color="cpuColor" stop-opacity="0.35" />
                    <stop offset="100%" :stop-color="cpuColor" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path :d="cpuAreaPath" :fill="`url(#cpuGrad)`" />
                <path :d="cpuLinePath" fill="none" :stroke="cpuColor" stroke-width="2" stroke-linejoin="round" class="dash__chart-line" />
              </svg>
            </div>
          </div>
          <div class="dash__chart-card" style="--delay:2">
            <div class="dash__chart-head">
              <span class="dash__chart-dot" :style="{ background: latencyColor }" />
              <span>Latency Timeline</span>
              <span class="dash__chart-badge">{{ networkStatus }}</span>
            </div>
            <div class="dash__chart-body">
              <svg :viewBox="`0 0 ${chartW} ${chartH}`" preserveAspectRatio="none">
                <defs>
                  <linearGradient :id="'latGrad'" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" :stop-color="latencyColor" stop-opacity="0.35" />
                    <stop offset="100%" :stop-color="latencyColor" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path :d="latAreaPath" :fill="`url(#latGrad)`" />
                <path :d="latLinePath" fill="none" :stroke="latencyColor" stroke-width="2" stroke-linejoin="round" class="dash__chart-line" />
              </svg>
            </div>
          </div>
        </section>

        <section class="dash__metrics-grid">
          <div v-for="(m, i) in metricItems" :key="m.label" class="dash__metric" :style="{ '--delay': i }">
            <div class="dash__metric-icon" v-html="m.icon" />
            <div class="dash__metric-body">
              <span class="dash__metric-label">{{ m.label }}</span>
              <span class="dash__metric-value">{{ m.value }}</span>
            </div>
          </div>
        </section>

        <section class="dash__network-card">
          <div class="dash__network-head">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 6c2-3 10-3 14 0"/><path d="M3 9c1.5-2 7.5-2 10 0"/><circle cx="8" cy="14" r="1" fill="currentColor"/>
            </svg>
            <span>Network</span>
            <span class="dash__network-badge" :class="networkStatusClass">{{ networkStatus }}</span>
          </div>
          <div class="dash__network-rows">
            <div class="dash__network-row">
              <span class="dash__network-key">Connection</span>
              <span class="dash__network-val" :class="networkStatusClass">{{ networkStatus }}</span>
            </div>
            <div class="dash__network-row">
              <span class="dash__network-key">Latency</span>
              <span class="dash__network-val">{{ latency }}ms</span>
            </div>
            <div class="dash__network-row">
              <span class="dash__network-key">Type</span>
              <span class="dash__network-val">{{ connectionType }}</span>
            </div>
            <div class="dash__network-row">
              <span class="dash__network-key">Page Load</span>
              <span class="dash__network-val">{{ pageLoadTime }}ms</span>
            </div>
          </div>
          <div class="dash__speed-section">
            <div class="dash__speed-head">
              <span class="dash__speed-label">Speed Test</span>
              <button
                class="dash__speed-btn"
                :class="{ 'dash__speed-btn--testing': isSpeedTesting }"
                :disabled="isSpeedTesting"
                @click="runSpeedTest"
              >
                <div v-if="isSpeedTesting" class="dash__speed-spinner" />
                <svg v-else width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 6c2-3 10-3 14 0"/><path d="M3 9c1.5-2 7.5-2 10 0"/><circle cx="8" cy="14" r="1" fill="currentColor"/>
                </svg>
                <span>{{ isSpeedTesting ? 'Testing...' : 'Run Test' }}</span>
              </button>
            </div>
            <div v-if="downloadSpeed > 0 || uploadSpeed > 0" class="dash__speed-results">
              <div class="dash__speed-item">
                <span class="dash__speed-item-label">Download</span>
                <span class="dash__speed-item-value">{{ downloadSpeed }} <small>Mbps</small></span>
              </div>
              <div class="dash__speed-item">
                <span class="dash__speed-item-label">Upload</span>
                <span class="dash__speed-item-value">{{ uploadSpeed }} <small>Mbps</small></span>
              </div>
              <div class="dash__speed-item">
                <span class="dash__speed-item-label">Ping</span>
                <span class="dash__speed-item-value">{{ ping }} <small>ms</small></span>
              </div>
            </div>
          </div>
        </section>

        <footer class="dash__footer">
          <span class="dash__footer-text">Updated {{ lastUpdated }}</span>
          <span class="dash__footer-pulse" :class="{ 'dash__footer-pulse--live': isAutoRefresh }" />
          <span class="dash__footer-text">{{ isAutoRefresh ? 'Live' : 'Paused' }}</span>
        </footer>
      </div>
    </div>
  </SCPWindow>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SCPWindow from '../../components/SCPWindow.vue'
import type { WindowInstance } from '../../types'
import { useDashboardData } from '../../composables/useDashboardData'
import Speedtest from '@cloudflare/speedtest'
import logger from '../../../utils/logger'

interface Props {
  windowInstance: WindowInstance
}

defineProps<Props>()

const {
  memoryUsage, cpuUsage, cpuCores, cpuThreads, jsHeap, domNodes, resources,
  jsListeners, latency, networkStatus, connectionType, currentTime, lastUpdated,
  isRefreshing, isAutoRefresh, fps, pageLoadTime, storageUsed,
  memoryHistory, cpuHistory, latencyHistory,
  performanceScore, statusLevel, scoreColor, memoryColor, cpuColor, latencyColor,
  networkStatusClass, refreshMetrics, generateSvgPath, generateSvgAreaPath, formatBytes,
} = useDashboardData(3000)

const isSpeedTesting = ref(false)
const downloadSpeed = ref(0)
const uploadSpeed = ref(0)
const ping = ref(0)

const statusLabel = computed(() => {
  if (statusLevel.value === 'good') return 'All Systems Nominal'
  if (statusLevel.value === 'warn') return 'Attention Required'
  return 'System Degraded'
})

const chartW = 400
const chartH = 90

const memLinePath = computed(() => generateSvgPath(memoryHistory.value, chartW, chartH))
const memAreaPath = computed(() => generateSvgAreaPath(memoryHistory.value, chartW, chartH))
const cpuLinePath = computed(() => generateSvgPath(cpuHistory.value, chartW, chartH))
const cpuAreaPath = computed(() => generateSvgAreaPath(cpuHistory.value, chartW, chartH))
const latLinePath = computed(() => generateSvgPath(latencyHistory.value, chartW, chartH))
const latAreaPath = computed(() => generateSvgAreaPath(latencyHistory.value, chartW, chartH))

const ICON_CLOCK = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="7"/><path d="M9 5v4l3 3"/></svg>'
const ICON_GRID = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="6" height="6" rx="1"/><rect x="10" y="2" width="6" height="6" rx="1"/><rect x="2" y="10" width="6" height="6" rx="1"/><rect x="10" y="10" width="6" height="6" rx="1"/></svg>'
const ICON_INFO = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="7"/><path d="M9 5v4"/><circle cx="9" cy="12" r="0.5" fill="currentColor"/></svg>'
const ICON_TREND = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 14l4-4 3 3 7-7"/><path d="M12 6h4v4"/></svg>'
const ICON_DB = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="9" cy="4" rx="6" ry="2"/><path d="M3 4v10c0 1.1 2.7 2 6 2s6-.9 6-2V4"/></svg>'
const ICON_LOAD = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 14l4-4 3 3 7-7"/><path d="M12 6h4v4"/></svg>'

const metricItems = computed(() => [
  { label: 'JS Heap', value: jsHeap.value, icon: ICON_CLOCK },
  { label: 'DOM Nodes', value: domNodes.value, icon: ICON_GRID },
  { label: 'Resources', value: resources.value, icon: ICON_INFO },
  { label: 'Listeners', value: jsListeners.value, icon: ICON_TREND },
  { label: 'Storage', value: formatBytes(storageUsed.value), icon: ICON_DB },
  { label: 'Page Load', value: `${pageLoadTime.value}ms`, icon: ICON_LOAD },
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
      logger.info('[Dash] Speed test:', { download: downloadSpeed.value, upload: uploadSpeed.value, ping: ping.value })
      isSpeedTesting.value = false
    }
    test.onError = (error) => {
      logger.error('[Dash] Speed test error:', error)
      isSpeedTesting.value = false
    }
  } catch (error) {
    logger.error('[Dash] Speed test failed:', error)
    isSpeedTesting.value = false
  }
}
</script>

<style scoped>
.dash {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #08080C;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
  overflow-y: auto;
  overflow-x: hidden;
  color: #fff;
}

.dash__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.dash__bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
  animation: orbFloat 12s ease-in-out infinite alternate;
}

.dash__bg-orb--1 {
  width: 300px;
  height: 300px;
  background: var(--gui-accent, #007AFF);
  top: -80px;
  right: -60px;
}

.dash__bg-orb--2 {
  width: 250px;
  height: 250px;
  background: #5856D6;
  bottom: -60px;
  left: -40px;
  animation-delay: -6s;
}

@keyframes orbFloat {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(20px, 30px) scale(1.1); }
}

.dash__bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
}

.dash__content {
  position: relative;
  z-index: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dash__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dash__status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dash__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.4s ease;
}

.dash__status-dot--good { background: #34C759; box-shadow: 0 0 10px rgba(52,199,89,0.5); }
.dash__status-dot--warn { background: #FF9500; box-shadow: 0 0 10px rgba(255,149,0,0.5); }
.dash__status-dot--bad { background: #FF3B30; box-shadow: 0 0 10px rgba(255,59,48,0.5); }

.dash__status-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255,255,255,0.8);
}

.dash__clock {
  font-size: 13px;
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  color: rgba(255,255,255,0.4);
  letter-spacing: 0.05em;
}

.dash__btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.6);
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.dash__btn-icon:hover { background: rgba(255,255,255,0.1); color: #fff; }
.dash__btn-icon--spinning { animation: dashSpin 0.8s linear infinite; }
@keyframes dashSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.dash__hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  animation: dashFadeIn 0.5s ease both;
}

.dash__score-ring-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.dash__score-svg {
  width: 100%;
  height: 100%;
}

.dash__score-arc {
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease;
}

.dash__score-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.dash__score-number {
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}

.dash__score-unit {
  display: block;
  font-size: 9px;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.15em;
  margin-top: 2px;
}

.dash__hero-stats {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.dash__hero-stat {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  transition: all 0.25s ease;
}

.dash__hero-stat:hover {
  background: rgba(255,255,255,0.06);
  transform: translateY(-2px);
  border-color: rgba(255,255,255,0.1);
}

.dash__hero-stat-ring {
  width: 40px;
  height: 40px;
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

.dash__hero-stat-ring::after {
  content: '';
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #0D0D12;
}

.dash__hero-stat-body {
  text-align: center;
}

.dash__hero-stat-val {
  font-size: 16px;
  font-weight: 700;
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  color: #fff;
}

.dash__hero-stat-val small {
  font-size: 10px;
  font-weight: 500;
  color: rgba(255,255,255,0.4);
  margin-left: 1px;
}

.dash__hero-stat-lbl {
  display: block;
  font-size: 10px;
  color: rgba(255,255,255,0.35);
  margin-top: 2px;
}

.dash__charts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.dash__chart-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 14px;
  backdrop-filter: blur(12px);
  animation: dashFadeIn 0.5s ease both;
  animation-delay: calc(var(--delay, 0) * 80ms);
  transition: all 0.25s ease;
}

.dash__chart-card:hover {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.1);
  transform: translateY(-2px);
}

.dash__chart-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  margin-bottom: 10px;
}

.dash__chart-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.3s ease;
}

.dash__chart-badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 500;
  color: rgba(255,255,255,0.3);
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
}

.dash__chart-body {
  width: 100%;
  height: 80px;
  background: rgba(0,0,0,0.3);
  border-radius: 8px;
  overflow: hidden;
}

.dash__chart-body svg {
  width: 100%;
  height: 100%;
}

.dash__chart-line {
  transition: d 0.3s ease;
}

.dash__metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.dash__metric {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  animation: dashFadeIn 0.5s ease both;
  animation-delay: calc(var(--delay, 0) * 60ms);
  transition: all 0.25s ease;
}

.dash__metric:hover {
  background: rgba(255,255,255,0.06);
  transform: translateY(-1px);
  border-color: rgba(255,255,255,0.1);
}

.dash__metric-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.4);
  flex-shrink: 0;
}

.dash__metric-body {
  flex: 1;
  min-width: 0;
}

.dash__metric-label {
  display: block;
  font-size: 10px;
  color: rgba(255,255,255,0.35);
}

.dash__metric-value {
  display: block;
  font-size: 12px;
  font-weight: 600;
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  color: rgba(255,255,255,0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash__network-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 16px;
  backdrop-filter: blur(12px);
  animation: dashFadeIn 0.5s ease both;
  animation-delay: 0.3s;
}

.dash__network-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  margin-bottom: 12px;
}

.dash__network-badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-online { color: #34C759; }
.status-slow { color: #FF9500; }
.status-offline { color: #FF3B30; }

.dash__network-badge.status-online { background: rgba(52,199,89,0.12); color: #34C759; }
.dash__network-badge.status-slow { background: rgba(255,149,0,0.12); color: #FF9500; }
.dash__network-badge.status-offline { background: rgba(255,59,48,0.12); color: #FF3B30; }

.dash__network-rows {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.dash__network-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dash__network-key {
  font-size: 10px;
  color: rgba(255,255,255,0.35);
}

.dash__network-val {
  font-size: 13px;
  font-weight: 600;
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  color: rgba(255,255,255,0.9);
}

.dash__speed-section {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 12px;
}

.dash__speed-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.dash__speed-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
}

.dash__speed-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.8);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dash__speed-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #fff; }
.dash__speed-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.dash__speed-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.15);
  border-top: 2px solid #fff;
  border-radius: 50%;
  animation: dashSpin 0.8s linear infinite;
}

.dash__speed-results {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px;
  background: rgba(0,0,0,0.3);
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.04);
}

.dash__speed-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dash__speed-item-label {
  font-size: 9px;
  color: rgba(255,255,255,0.3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.dash__speed-item-value {
  font-size: 16px;
  font-weight: 700;
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  color: #fff;
}

.dash__speed-item-value small {
  font-size: 10px;
  font-weight: 500;
  color: rgba(255,255,255,0.35);
}

.dash__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px 0;
}

.dash__footer-text {
  font-size: 10px;
  color: rgba(255,255,255,0.25);
}

.dash__footer-pulse {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  transition: all 0.3s ease;
}

.dash__footer-pulse--live {
  background: #34C759;
  box-shadow: 0 0 6px rgba(52,199,89,0.5);
  animation: dashPulse 2s ease-in-out infinite;
}

@keyframes dashPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

@keyframes dashFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 900px) {
  .dash__charts { grid-template-columns: 1fr; }
  .dash__metrics-grid { grid-template-columns: repeat(3, 1fr); }
  .dash__hero { flex-direction: column; }
  .dash__hero-stats { width: 100%; }
  .dash__network-rows { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .dash__hero-stats { grid-template-columns: repeat(2, 1fr); }
  .dash__metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .dash__network-rows { grid-template-columns: 1fr 1fr; }
}
</style>
