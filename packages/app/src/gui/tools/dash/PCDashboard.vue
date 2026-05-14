<template>
  <SCPWindow :window-instance="windowInstance" @close="onClose">
    <div ref="dashRoot" class="dash">
      <div class="dash__bg">
        <div class="dash__bg-orb dash__bg-orb--1" />
        <div class="dash__bg-orb dash__bg-orb--2" />
        <div class="dash__bg-orb dash__bg-orb--3" />
        <div class="dash__bg-grid" />
        <div class="dash__bg-scanline" />
        <div class="dash__bg-vignette" />
      </div>

      <div ref="particlesContainer" class="dash__particles">
        <span v-for="n in 30" :key="n" class="dash__particle" :style="particleStyle(n)" />
      </div>

      <div class="dash__content">
        <header class="dash__header">
          <div class="dash__header-left">
            <div class="dash__status-indicator">
              <span class="dash__status-dot" :class="`dash__status-dot--${statusLevel}`" />
              <span class="dash__status-label">{{ statusLabel }}</span>
            </div>
            <div class="dash__classification">
              <span class="dash__class-badge">SCP</span>
              <span class="dash__class-level">
                {{
                  statusLevel === 'good'
                    ? 'UNRESTRICTED'
                    : statusLevel === 'warn'
                      ? 'RESTRICTED'
                      : 'CLASSIFIED'
                }}
              </span>
            </div>
          </div>
          <div class="dash__header-center">
            <span class="dash__clock">{{ currentTime }}</span>
            <span class="dash__uptime">UPTIME: {{ formatUptime(uptime) }}</span>
          </div>
          <div class="dash__header-right">
            <button
              class="dash__btn-icon"
              :class="{ 'dash__btn-icon--active': activeTab === 'overview' }"
              title="Overview"
              @click="activeTab = 'overview'"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            </button>
            <button
              class="dash__btn-icon"
              :class="{ 'dash__btn-icon--active': activeTab === 'system' }"
              title="System"
              @click="activeTab = 'system'"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <rect x="1" y="3" width="14" height="10" rx="2" />
                <path d="M5 16V13" />
                <path d="M11 16V13" />
                <path d="M1 10h14" />
              </svg>
            </button>
            <button
              class="dash__btn-icon"
              :class="{ 'dash__btn-icon--active': activeTab === 'network' }"
              title="Network"
              @click="activeTab = 'network'"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--gui-text-secondary, #8e8e93)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M0 11a15 15 0 0 1 24 0" />
                <path d="M4 14a10 10 0 0 1 16 0" />
                <path d="M8 17a5 5 0 0 1 8 0" />
                <circle
                  cx="12"
                  cy="20"
                  r="2"
                  fill="var(--gui-text-secondary, #8e8e93)"
                  stroke="none"
                />
              </svg>
            </button>
            <div class="dash__header-divider" />
            <button
              class="dash__btn-icon"
              :class="{ 'dash__btn-icon--spinning': isRefreshing }"
              title="Refresh"
              @click="refreshMetrics"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 8a5 5 0 019.33-2.5M13 8a5 5 0 01-9.33 2.5" />
                <path d="M15 4v3h-3M1 12v-3h3" />
              </svg>
            </button>
          </div>
        </header>

        <section v-if="activeTab === 'overview'" class="dash__tab-content">
          <div class="dash__hero">
            <div class="dash__gauge-cluster">
              <div class="dash__gauge-wrap">
                <svg class="dash__gauge-svg" viewBox="0 0 200 120">
                  <defs>
                    <filter id="gaugeGlow">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" :stop-color="scoreColor" stop-opacity="0.4" />
                      <stop offset="50%" :stop-color="scoreColor" stop-opacity="1" />
                      <stop offset="100%" :stop-color="scoreColor" stop-opacity="0.6" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    stroke-width="12"
                    stroke-linecap="round"
                  />
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#gaugeGrad)"
                    stroke-width="12"
                    stroke-linecap="round"
                    :stroke-dasharray="251.3"
                    :stroke-dashoffset="251.3 - (251.3 * performanceScore) / 100"
                    class="dash__gauge-arc"
                    filter="url(#gaugeGlow)"
                  />
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    :stroke="scoreColor"
                    stroke-width="1"
                    stroke-dasharray="4 8"
                    opacity="0.2"
                  />
                  <text
                    x="100"
                    y="78"
                    text-anchor="middle"
                    :fill="scoreColor"
                    font-size="36"
                    font-weight="900"
                    font-family="'SF Mono','JetBrains Mono',monospace"
                  >
                    {{ performanceScore }}
                  </text>
                  <text
                    x="100"
                    y="96"
                    text-anchor="middle"
                    fill="rgba(255,255,255,0.25)"
                    font-size="8"
                    font-weight="600"
                    letter-spacing="0.2em"
                  >
                    SYSTEM INDEX
                  </text>
                </svg>
              </div>
            </div>

            <div class="dash__hero-stats">
              <div v-for="stat in heroStats" :key="stat.label" class="dash__hero-stat">
                <svg class="dash__mini-gauge" viewBox="0 0 60 36">
                  <path
                    d="M 6 30 A 24 24 0 0 1 54 30"
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    stroke-width="5"
                    stroke-linecap="round"
                  />
                  <path
                    d="M 6 30 A 24 24 0 0 1 54 30"
                    fill="none"
                    :stroke="stat.color"
                    stroke-width="5"
                    stroke-linecap="round"
                    :stroke-dasharray="75.4"
                    :stroke-dashoffset="75.4 - 75.4 * Math.min(1, stat.pct / 100)"
                    class="dash__mini-gauge-arc"
                  />
                </svg>
                <div class="dash__hero-stat-body">
                  <span class="dash__hero-stat-val" :style="{ color: stat.color }"
                    >{{ stat.value }}<small v-if="stat.unit">{{ stat.unit }}</small></span
                  >
                  <span class="dash__hero-stat-lbl">{{ stat.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="dash__charts">
            <div
              v-for="chart in timelineCharts"
              :key="chart.label"
              class="dash__chart-card"
              style="--delay: 0"
            >
              <div class="dash__chart-head">
                <span class="dash__chart-dot" :style="{ background: chart.color }" />
                <span>{{ chart.label }}</span>
                <span class="dash__chart-badge">{{ chart.badge }}</span>
              </div>
              <div class="dash__chart-body">
                <svg
                  :viewBox="`0 0 ${chartW} ${chartH}`"
                  preserveAspectRatio="none"
                  class="dash__chart-svg"
                >
                  <defs>
                    <linearGradient :id="chart.gradId" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" :stop-color="chart.color" stop-opacity="0.5" />
                      <stop offset="100%" :stop-color="chart.color" stop-opacity="0" />
                    </linearGradient>
                    <filter :id="chart.gradId + 'Glow'">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <line
                    v-for="y in 4"
                    :key="'h' + y"
                    x1="0"
                    :y1="(chartH / 5) * y"
                    :x2="chartW"
                    :y2="(chartH / 5) * y"
                    stroke="rgba(255,255,255,0.025)"
                    stroke-width="1"
                    stroke-dasharray="2 4"
                  />
                  <text
                    v-for="y in [1, 3]"
                    :key="'l' + y"
                    x="2"
                    :y="(chartH / 5) * y - 2"
                    fill="rgba(255,255,255,0.08)"
                    font-size="7"
                    font-family="monospace"
                  >
                    {{ 100 - y * 20 }}
                  </text>
                  <path :d="chart.areaPath" :fill="`url(#${chart.gradId})`" />
                  <path
                    :d="chart.linePath"
                    fill="none"
                    :stroke="chart.color"
                    stroke-width="2.5"
                    stroke-linejoin="round"
                    class="dash__chart-line"
                    :filter="`url(#${chart.gradId}Glow)`"
                  />
                  <circle
                    v-if="chart.lastPoint"
                    :cx="chart.lastPoint.x"
                    :cy="chart.lastPoint.y"
                    r="4"
                    :fill="chart.color"
                    class="dash__chart-dot-live"
                  />
                  <circle
                    v-if="chart.lastPoint"
                    :cx="chart.lastPoint.x"
                    :cy="chart.lastPoint.y"
                    r="8"
                    :fill="chart.color"
                    opacity="0.2"
                    class="dash__chart-dot-pulse"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div class="dash__metrics-grid">
            <div
              v-for="(m, i) in metricItems"
              :key="m.label"
              class="dash__metric"
              :style="{ '--delay': i }"
            >
              <!-- eslint-disable-next-line vue/no-v-html -- icons are hardcoded static SVGs -->
              <div class="dash__metric-icon" v-html="m.icon" />
              <div class="dash__metric-body">
                <span class="dash__metric-label">{{ m.label }}</span>
                <span class="dash__metric-value">{{ m.value }}</span>
              </div>
              <div class="dash__metric-bar-wrap">
                <div
                  class="dash__metric-bar"
                  :style="{ width: m.barWidth + '%', background: m.barColor || scoreColor }"
                />
              </div>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'system'" class="dash__tab-content">
          <div class="dash__system-grid">
            <div class="dash__system-card dash__system-card--wide">
              <div class="dash__system-head">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <rect x="1" y="3" width="14" height="10" rx="2" />
                </svg>
                <span>System Information</span>
              </div>
              <div class="dash__info-table">
                <div class="dash__info-row">
                  <span class="dash__info-key">Platform</span>
                  <span class="dash__info-val">{{ navigator.platform || 'Unknown' }}</span>
                </div>
                <div class="dash__info-row">
                  <span class="dash__info-key">CPU Cores</span>
                  <span class="dash__info-val"
                    >{{ cpuCores }} physical / {{ cpuThreads }} logical</span
                  >
                </div>
                <div class="dash__info-row">
                  <span class="dash__info-key">Device Memory</span>
                  <span class="dash__info-val">{{
                    deviceMemoryGB > 0 ? deviceMemoryGB + ' GB' : 'Unknown'
                  }}</span>
                </div>
                <div class="dash__info-row">
                  <span class="dash__info-key">User Agent</span>
                  <span class="dash__info-val dash__info-val--sm"
                    >{{ navigator.userAgent.substring(0, 60) }}...</span
                  >
                </div>
                <div class="dash__info-row">
                  <span class="dash__info-key">Language</span>
                  <span class="dash__info-val">{{ navigator.language }}</span>
                </div>
                <div class="dash__info-row">
                  <span class="dash__info-key">Cookie Enabled</span>
                  <span
                    class="dash__info-val"
                    :style="{ color: navigator.cookieEnabled ? '#34C759' : '#FF3B30' }"
                    >{{ navigator.cookieEnabled ? 'Yes' : 'No' }}</span
                  >
                </div>
                <div class="dash__info-row">
                  <span class="dash__info-key">Do Not Track</span>
                  <span class="dash__info-val">{{ navigator.doNotTrack || 'Unspecified' }}</span>
                </div>
              </div>
            </div>

            <div class="dash__system-card">
              <div class="dash__system-head">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path d="M6 2h4v2H6z" />
                  <path d="M3 4h10v8H3z" />
                  <path d="M6 12v2h4v-2" />
                </svg>
                <span>Battery</span>
              </div>
              <div class="dash__battery-wrap">
                <div
                  class="dash__battery-icon"
                  :class="{ 'dash__battery-icon--charging': battery.charging }"
                >
                  <div class="dash__battery-fill" :style="{ height: battery.level * 100 + '%' }" />
                  <svg
                    class="dash__battery-zap"
                    v-if="battery.charging"
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M8 1L3 9h4l-1 6 6-8H7l1-6z" />
                  </svg>
                </div>
                <span class="dash__battery-pct">{{ Math.round(battery.level * 100) }}%</span>
                <span class="dash__battery-status">{{
                  battery.charging ? 'Charging' : 'Discharging'
                }}</span>
              </div>
            </div>

            <div class="dash__system-card">
              <div class="dash__system-head">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <circle cx="8" cy="8" r="7" />
                  <path d="M8 4v4l3 3" />
                </svg>
                <span>Performance Metrics</span>
              </div>
              <div class="dash__perf-metrics">
                <div class="dash__perf-row">
                  <span>FCP</span>
                  <span>{{ paintTiming.fcp > 0 ? Math.round(paintTiming.fcp) + 'ms' : '—' }}</span>
                </div>
                <div class="dash__perf-row">
                  <span>FP</span>
                  <span>{{ paintTiming.fp > 0 ? Math.round(paintTiming.fp) + 'ms' : '—' }}</span>
                </div>
                <div class="dash__perf-row">
                  <span>Long Tasks</span>
                  <span :style="{ color: longTaskCount > 5 ? '#FF3B30' : '#34C759' }">{{
                    longTaskCount
                  }}</span>
                </div>
                <div class="dash__perf-row">
                  <span>CLS Score</span>
                  <span :style="{ color: layoutShiftScore > 0.1 ? '#FF3B30' : '#34C759' }">{{
                    layoutShiftScore.toFixed(3)
                  }}</span>
                </div>
                <div class="dash__perf-row">
                  <span>Page Load</span>
                  <span>{{ pageLoadTime }}ms</span>
                </div>
              </div>
            </div>
          </div>

          <div class="dash__alerts">
            <div class="dash__alerts-head">
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path d="M8 2l7 12H1L8 2z" />
                <path d="M8 6v3" />
                <circle cx="8" cy="12" r="0.5" fill="currentColor" />
              </svg>
              <span>System Alerts</span>
              <span class="dash__alerts-count">{{ alerts.length }}</span>
            </div>
            <div class="dash__alerts-list">
              <div
                v-for="(alert, i) in alerts"
                :key="i"
                class="dash__alert"
                :class="`dash__alert--${alert.level}`"
              >
                <span class="dash__alert-time">{{ alert.time }}</span>
                <span class="dash__alert-msg">{{ alert.message }}</span>
              </div>
              <div v-if="alerts.length === 0" class="dash__alert dash__alert--info">
                <span class="dash__alert-time">{{ currentTime }}</span>
                <span class="dash__alert-msg"
                  >No active alerts. All systems operating within normal parameters.</span
                >
              </div>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'network'" class="dash__tab-content">
          <div class="dash__network-card dash__network-card--full">
            <div class="dash__network-head">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--gui-text-secondary, #8e8e93)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M0 11a15 15 0 0 1 24 0" />
                <path d="M4 14a10 10 0 0 1 16 0" />
                <path d="M8 17a5 5 0 0 1 8 0" />
                <circle
                  cx="12"
                  cy="20"
                  r="2"
                  fill="var(--gui-text-secondary, #8e8e93)"
                  stroke="none"
                />
              </svg>
              <span>Network Status</span>
              <span class="dash__network-badge" :class="networkStatusClass">{{
                networkStatus
              }}</span>
            </div>
            <div class="dash__network-rows">
              <div class="dash__network-row">
                <span class="dash__network-key">Status</span>
                <span class="dash__network-val" :class="networkStatusClass">{{
                  networkStatus
                }}</span>
              </div>
              <div class="dash__network-row">
                <span class="dash__network-key">Latency</span>
                <span class="dash__network-val" :style="{ color: latencyColor }"
                  >{{ latency }}ms</span
                >
              </div>
              <div class="dash__network-row">
                <span class="dash__network-key">Connection</span>
                <span class="dash__network-val">{{ connectionType }}</span>
              </div>
              <div class="dash__network-row">
                <span class="dash__network-key">Bandwidth</span>
                <span class="dash__network-val">{{
                  downlinkSpeed > 0 ? downlinkSpeed + ' Mbps' : 'Unknown'
                }}</span>
              </div>
              <div class="dash__network-row">
                <span class="dash__network-key">Online</span>
                <span
                  class="dash__network-val"
                  :style="{ color: onlineStatus ? '#34C759' : '#FF3B30' }"
                  >{{ onlineStatus ? 'Yes' : 'No' }}</span
                >
              </div>
              <div class="dash__network-row">
                <span class="dash__network-key">Data Saver</span>
                <span class="dash__network-val">{{
                  (navigator as any).connection?.saveData ? 'Active' : 'Inactive'
                }}</span>
              </div>
            </div>
            <div class="dash__speed-section">
              <div class="dash__speed-head">
                <span class="dash__speed-label">Network Speed Test</span>
                <button
                  class="dash__speed-btn"
                  :class="{ 'dash__speed-btn--testing': isSpeedTesting }"
                  :disabled="isSpeedTesting"
                  @click="runSpeedTest"
                >
                  <div v-if="isSpeedTesting" class="dash__speed-spinner" />
                  <svg
                    v-else
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--gui-text-secondary, #8e8e93)"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M0 11a15 15 0 0 1 24 0" />
                    <path d="M4 14a10 10 0 0 1 16 0" />
                    <path d="M8 17a5 5 0 0 1 8 0" />
                    <circle
                      cx="12"
                      cy="20"
                      r="2"
                      fill="var(--gui-text-secondary, #8e8e93)"
                      stroke="none"
                    />
                  </svg>
                  <span>{{ isSpeedTesting ? 'Testing...' : 'Run Test' }}</span>
                </button>
              </div>
              <div v-if="downloadSpeed > 0 || uploadSpeed > 0" class="dash__speed-results">
                <div class="dash__speed-item">
                  <span class="dash__speed-item-label">Download</span>
                  <span class="dash__speed-item-value"
                    >{{ downloadSpeed }} <small>Mbps</small></span
                  >
                  <div class="dash__speed-bar">
                    <div
                      class="dash__speed-bar-fill"
                      :style="{ width: Math.min(100, downloadSpeed / 2) + '%' }"
                    />
                  </div>
                </div>
                <div class="dash__speed-item">
                  <span class="dash__speed-item-label">Upload</span>
                  <span class="dash__speed-item-value">{{ uploadSpeed }} <small>Mbps</small></span>
                  <div class="dash__speed-bar">
                    <div
                      class="dash__speed-bar-fill dash__speed-bar-fill--up"
                      :style="{ width: Math.min(100, uploadSpeed * 2) + '%' }"
                    />
                  </div>
                </div>
                <div class="dash__speed-item">
                  <span class="dash__speed-item-label">Ping</span>
                  <span class="dash__speed-item-value">{{ ping }} <small>ms</small></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer class="dash__footer">
          <span class="dash__footer-text">{{
            isAutoRefresh ? 'LIVE MONITORING ACTIVE' : 'MONITORING PAUSED'
          }}</span>
          <span class="dash__footer-pulse" :class="{ 'dash__footer-pulse--live': isAutoRefresh }" />
          <span class="dash__footer-sep">|</span>
          <span class="dash__footer-text">Last update: {{ lastUpdated }}</span>
          <span class="dash__footer-sep">|</span>
          <span class="dash__footer-text">Session: {{ formatUptime(uptime) }}</span>
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
import logger from '../../../utils/logger'

interface Props {
  windowInstance: WindowInstance
}

defineProps<Props>()

const {
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
  battery,
  longTaskCount,
  uptime,
  deviceMemoryGB,
  downlinkSpeed,
  onlineStatus,
  paintTiming,
  layoutShiftScore,
  storagePercent,
  refreshMetrics,
  generateSvgPath,
  generateSvgAreaPath,
  getLastPoint,
  formatBytes,
  formatUptime,
} = useDashboardData(3000)

const activeTab = ref<'overview' | 'system' | 'network'>('overview')
const isSpeedTesting = ref(false)
const downloadSpeed = ref(0)
const uploadSpeed = ref(0)
const ping = ref(0)

const statusLabel = computed(() => {
  if (statusLevel.value === 'good') return 'SYSTEMS NOMINAL'
  if (statusLevel.value === 'warn') return 'ELEVATED LOAD'
  return 'SYSTEM DEGRADED'
})

const heroStats = computed(() => [
  {
    label: 'Memory',
    value: memoryUsage.value.percent,
    unit: '%',
    pct: memoryUsage.value.percent,
    color: memoryColor.value,
  },
  {
    label: 'CPU Load',
    value: cpuUsage.value,
    unit: '%',
    pct: cpuUsage.value,
    color: cpuColor.value,
  },
  {
    label: 'Frame Rate',
    value: fps.value,
    unit: 'fps',
    pct: Math.min(100, (fps.value / 60) * 100),
    color: fps.value >= 50 ? '#34C759' : fps.value >= 30 ? '#FF9500' : '#FF3B30',
  },
  {
    label: 'Latency',
    value: latency.value,
    unit: 'ms',
    pct: Math.min(100, (latency.value / 200) * 100),
    color: latencyColor.value,
  },
])

const chartW = 400
const chartH = 90

const memLinePath = computed(() => generateSvgPath(memoryHistory.value, chartW, chartH))
const memAreaPath = computed(() => generateSvgAreaPath(memoryHistory.value, chartW, chartH))
const cpuLinePath = computed(() => generateSvgPath(cpuHistory.value, chartW, chartH))
const cpuAreaPath = computed(() => generateSvgAreaPath(cpuHistory.value, chartW, chartH))
const latLinePath = computed(() => generateSvgPath(latencyHistory.value, chartW, chartH))
const latAreaPath = computed(() => generateSvgAreaPath(latencyHistory.value, chartW, chartH))

const memLastPt = computed(() => getLastPoint(memoryHistory.value, chartW, chartH))
const cpuLastPt = computed(() => getLastPoint(cpuHistory.value, chartW, chartH))
const latLastPt = computed(() => getLastPoint(latencyHistory.value, chartW, chartH))

const timelineCharts = computed(() => [
  {
    label: 'Memory Timeline',
    badge: `${memoryUsage.value.used}/${memoryUsage.value.limit}MB`,
    color: memoryColor.value,
    gradId: 'memGrad',
    linePath: memLinePath.value,
    areaPath: memAreaPath.value,
    lastPoint: memLastPt.value,
  },
  {
    label: 'CPU Timeline',
    badge: `${cpuCores.value} cores`,
    color: cpuColor.value,
    gradId: 'cpuGrad',
    linePath: cpuLinePath.value,
    areaPath: cpuAreaPath.value,
    lastPoint: cpuLastPt.value,
  },
  {
    label: 'Latency Timeline',
    badge: networkStatus.value,
    color: latencyColor.value,
    gradId: 'latGrad',
    linePath: latLinePath.value,
    areaPath: latAreaPath.value,
    lastPoint: latLastPt.value,
  },
])

const ICON_HEAP =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M4 7h8"/><path d="M4 10h5"/></svg>'
const ICON_NODES =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>'
const ICON_ASSETS =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 2h5l2 3h5v7H2V2z"/></svg>'
const ICON_LISTENERS =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 13l-6.5-6.5"/><circle cx="5" cy="5" r="3"/><circle cx="12" cy="12" r="2.5"/></svg>'
const ICON_STORAGE =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="8" cy="4" rx="6" ry="2"/><path d="M2 4v8c0 1.1 2.7 2 6 2s6-.9 6-2V4"/></svg>'
const ICON_LOAD =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 14l4-4 3 3 7-7"/><path d="M12 6h4v4"/></svg>'

const metricItems = computed(() => [
  {
    label: 'JS Heap',
    value: jsHeap.value,
    icon: ICON_HEAP,
    barWidth: memoryUsage.value.percent,
    barColor: memoryColor.value,
  },
  {
    label: 'DOM Nodes',
    value: domNodes.value,
    icon: ICON_NODES,
    barWidth: Math.min(100, (parseInt(domNodes.value) || 0) / 50),
    barColor: (parseInt(domNodes.value) || 0) > 2000 ? '#FF9500' : '#34C759',
  },
  {
    label: 'Resources',
    value: resources.value,
    icon: ICON_ASSETS,
    barWidth: Math.min(100, (parseInt(resources.value) || 0) / 2),
    barColor: (parseInt(resources.value) || 0) > 100 ? '#FF9500' : '#5AC8FA',
  },
  {
    label: 'Listeners',
    value: jsListeners.value,
    icon: ICON_LISTENERS,
    barWidth: 0,
    barColor: scoreColor.value,
  },
  {
    label: 'Storage',
    value: formatBytes(storageUsed.value),
    icon: ICON_STORAGE,
    barWidth: storagePercent.value,
    barColor: storagePercent.value > 80 ? '#FF9500' : '#34C759',
  },
  {
    label: 'Page Load',
    value: `${pageLoadTime.value}ms`,
    icon: ICON_LOAD,
    barWidth: Math.min(100, pageLoadTime.value / 50),
    barColor: pageLoadTime.value > 3000 ? '#FF9500' : '#34C759',
  },
])

const alerts = computed(() => {
  const list: { time: string; level: 'warn' | 'bad' | 'info'; message: string }[] = []
  if (memoryUsage.value.percent > 80)
    list.push({
      time: currentTime.value,
      level: 'warn',
      message: `Memory usage at ${memoryUsage.value.percent}% — consider optimization`,
    })
  if (cpuUsage.value > 70)
    list.push({
      time: currentTime.value,
      level: 'warn',
      message: `CPU load elevated: ${cpuUsage.value}%`,
    })
  if (!onlineStatus.value)
    list.push({ time: currentTime.value, level: 'bad', message: 'Network connection lost' })
  if (latency.value > 150)
    list.push({
      time: currentTime.value,
      level: 'warn',
      message: `High latency detected: ${latency.value}ms`,
    })
  if (longTaskCount.value > 5)
    list.push({
      time: currentTime.value,
      level: 'warn',
      message: `${longTaskCount.value} long tasks detected in monitoring period`,
    })
  if (fps.value < 30)
    list.push({
      time: currentTime.value,
      level: 'bad',
      message: `Frame rate critically low: ${fps.value} fps`,
    })
  if (performanceScore.value < 50)
    list.push({
      time: currentTime.value,
      level: 'bad',
      message: `System health index critically low: ${performanceScore.value}`,
    })
  return list
})

function particleStyle(n: number) {
  const x = Math.sin(n * 1.7 + 1.2) * 45 + 50
  const y = Math.cos(n * 2.3 + 0.8) * 45 + 50
  const duration = 5 + (n % 8)
  const delay = n * 0.3
  const size = 1 + (n % 4)
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
      const summary = results.getSummary()
      downloadSpeed.value = Math.round(summary.download || 0)
      uploadSpeed.value = Math.round(summary.upload || 0)
      ping.value = Math.round(summary.latency || 0)
      logger.info('[Dash] Speed test completed:', {
        dl: downloadSpeed.value,
        ul: uploadSpeed.value,
        ping: ping.value,
      })
      isSpeedTesting.value = false
    }
    test.onError = (error: any) => {
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
  background: var(--gui-bg-base, #050508);
  font-family: 'SF Mono', 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace;
  overflow-y: auto;
  overflow-x: hidden;
  color: var(--gui-text-primary, rgba(255, 255, 255, 0.9));
}

.dash::-webkit-scrollbar {
  width: 3px;
}
.dash::-webkit-scrollbar-track {
  background: transparent;
}
.dash::-webkit-scrollbar-thumb {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  border-radius: 2px;
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
  filter: blur(120px);
  opacity: 0.07;
  animation: orbFloat 16s ease-in-out infinite alternate;
}

.dash__bg-orb--1 {
  width: 500px;
  height: 500px;
  background: var(--gui-accent, #007aff);
  top: -160px;
  right: -100px;
}

.dash__bg-orb--2 {
  width: 350px;
  height: 350px;
  background: #5e5ce6;
  bottom: -100px;
  left: -80px;
  animation-delay: -8s;
  animation-duration: 18s;
}

.dash__bg-orb--3 {
  width: 250px;
  height: 250px;
  background: #30b0c7;
  top: 40%;
  left: 55%;
  animation-delay: -4s;
  animation-duration: 20s;
  opacity: 0.04;
}

@keyframes orbFloat {
  0% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(20px, -15px) scale(1.04);
  }
  66% {
    transform: translate(-10px, 10px) scale(1.06);
  }
  100% {
    transform: translate(15px, 25px) scale(1.08);
  }
}

.dash__bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(ellipse at center, black 20%, transparent 65%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 20%, transparent 65%);
}

.dash__bg-scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.025) 2px,
    rgba(0, 0, 0, 0.025) 4px
  );
  pointer-events: none;
  opacity: 0.5;
}

.dash__bg-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.4) 100%);
  pointer-events: none;
}

.dash__particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.dash__particle {
  position: absolute;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: particleFloat linear infinite;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.15);
}

.light .dash__particle {
  background: rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}

@keyframes particleFloat {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  8% {
    opacity: 0.4;
  }
  92% {
    opacity: 0.4;
  }
  100% {
    transform: translateY(-500px) translateX(30px);
    opacity: 0;
  }
}

.dash__content {
  position: relative;
  z-index: 2;
  padding: 16px 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dash__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.dash__header-left {
  display: flex;
  align-items: center;
  gap: 16px;
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

.dash__status-dot--good {
  background: #34c759;
  box-shadow: 0 0 14px rgba(52, 199, 89, 0.7);
  animation: dashStatusPulse 2s ease-in-out infinite;
}
.dash__status-dot--warn {
  background: #ff9500;
  box-shadow: 0 0 14px rgba(255, 149, 0, 0.7);
  animation: dashStatusPulse 1.5s ease-in-out infinite;
}
.dash__status-dot--bad {
  background: #ff3b30;
  box-shadow: 0 0 14px rgba(255, 59, 48, 0.7);
  animation: dashStatusPulse 0.8s ease-in-out infinite;
}

@keyframes dashStatusPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.6);
  }
}

.dash__status-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--gui-text-secondary, rgba(255, 255, 255, 0.6));
  text-transform: uppercase;
}

.dash__classification {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dash__class-badge {
  font-size: 9px;
  font-weight: 800;
  padding: 2px 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.5));
  letter-spacing: 0.15em;
}

.dash__class-level {
  font-size: 9px;
  font-weight: 600;
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.3));
  letter-spacing: 0.12em;
}

.dash__header-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.dash__clock {
  font-size: 13px;
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.35));
  letter-spacing: 0.08em;
}
.dash__uptime {
  font-size: 9px;
  color: var(--gui-text-disabled, rgba(255, 255, 255, 0.15));
  letter-spacing: 0.06em;
}

.dash__header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dash__header-divider {
  width: 1px;
  height: 16px;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  margin: 0 4px;
}

.dash__btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.35));
  cursor: pointer;
  transition: all 0.2s ease;
}

.dash__btn-icon:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, rgba(255, 255, 255, 0.8));
}
.dash__btn-icon--active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  color: var(--gui-text-primary, #fff);
  border-color: var(--gui-border-strong, rgba(255, 255, 255, 0.1));
}
.dash__btn-icon--spinning {
  animation: dashSpin 0.8s linear infinite;
}
@keyframes dashSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.dash__tab-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: dashFadeIn 0.35s ease both;
}

.dash__hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  backdrop-filter: blur(24px);
  animation: dashFadeIn 0.5s ease both;
}

.dash__gauge-cluster {
  flex-shrink: 0;
  width: 200px;
}

.dash__gauge-svg {
  width: 100%;
  height: auto;
}

.dash__gauge-arc {
  transition:
    stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1),
    stroke 0.3s ease;
}

.dash__mini-gauge {
  width: 60px;
  height: 36px;
  margin-bottom: 4px;
}

.dash__mini-gauge-arc {
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.dash__hero-stats {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.dash__hero-stat {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  transition: all 0.25s ease;
}

.dash__hero-stat:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.05));
  transform: translateY(-2px);
  border-color: var(--gui-border-default, rgba(255, 255, 255, 0.08));
}

.dash__hero-stat-body {
  text-align: center;
}

.dash__hero-stat-val {
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
}

.dash__hero-stat-val small {
  font-size: 9px;
  font-weight: 500;
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.3));
  margin-left: 1px;
}

.dash__hero-stat-lbl {
  display: block;
  font-size: 9px;
  color: var(--gui-text-disabled, rgba(255, 255, 255, 0.25));
  margin-top: 2px;
  letter-spacing: 0.05em;
}

.dash__charts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.dash__chart-card {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 12px;
  backdrop-filter: blur(12px);
  animation: dashFadeIn 0.5s ease both;
  animation-delay: calc(var(--delay, 0) * 80ms);
  transition: all 0.25s ease;
}

.dash__chart-card:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.04));
  border-color: var(--gui-border-default, rgba(255, 255, 255, 0.08));
  transform: translateY(-1px);
}

.dash__chart-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  color: var(--gui-text-secondary, rgba(255, 255, 255, 0.55));
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
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
  font-size: 9px;
  font-weight: 500;
  color: var(--gui-text-disabled, rgba(255, 255, 255, 0.2));
}

.dash__chart-body {
  width: 100%;
  height: 90px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  overflow: hidden;
}

.dash__chart-svg {
  width: 100%;
  height: 100%;
}

.dash__chart-line {
  transition: d 0.4s ease;
}

.dash__chart-dot-live {
  transition:
    cx 0.3s ease,
    cy 0.3s ease;
}

.dash__chart-dot-pulse {
  animation: chartPulse 2s ease-in-out infinite;
}

@keyframes chartPulse {
  0%,
  100% {
    r: 8;
    opacity: 0.2;
  }
  50% {
    r: 12;
    opacity: 0;
  }
}

.dash__metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.dash__metric {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  animation: dashFadeIn 0.5s ease both;
  animation-delay: calc(var(--delay, 0) * 60ms);
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.dash__metric:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.05));
  transform: translateY(-1px);
  border-color: var(--gui-border-default, rgba(255, 255, 255, 0.08));
}

.dash__metric-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.04));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.35));
  flex-shrink: 0;
}

.dash__metric-body {
  flex: 1;
  min-width: 0;
}

.dash__metric-label {
  display: block;
  font-size: 9px;
  color: var(--gui-text-disabled, rgba(255, 255, 255, 0.25));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dash__metric-value {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: var(--gui-text-primary, rgba(255, 255, 255, 0.8));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash__metric-bar-wrap {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.04));
}

.dash__metric-bar {
  height: 100%;
  border-radius: 0 1px 1px 0;
  transition:
    width 0.5s ease,
    background 0.3s ease;
  min-width: 0;
}

.dash__system-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 10px;
}

.dash__system-card {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 14px;
  backdrop-filter: blur(12px);
}

.dash__system-card--wide {
  grid-column: span 1;
}

.dash__system-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--gui-text-secondary, rgba(255, 255, 255, 0.55));
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
}

.dash__info-table {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.dash__info-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.03));
}

.dash__info-key {
  font-size: 10px;
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.3));
}
.dash__info-val {
  font-size: 10px;
  font-weight: 600;
  color: var(--gui-text-secondary, rgba(255, 255, 255, 0.7));
}
.dash__info-val--sm {
  font-size: 8px;
}

.dash__battery-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.dash__battery-icon {
  position: relative;
  width: 32px;
  height: 56px;
  border: 2px solid var(--gui-border-strong, rgba(255, 255, 255, 0.3));
  border-radius: 6px;
  padding: 3px;
  overflow: hidden;
}

.dash__battery-icon::after {
  content: '';
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px 2px 0 0;
}

.dash__battery-fill {
  background: #34c759;
  border-radius: 3px;
  transition: height 0.5s ease;
  width: 100%;
  position: absolute;
  bottom: 3px;
  left: 3px;
  right: 3px;
}

.dash__battery-zap {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--gui-text-primary, rgba(255, 255, 255, 0.8));
}

.dash__battery-icon--charging .dash__battery-fill {
  background: #ff9500;
}
.dash__battery-pct {
  font-size: 20px;
  font-weight: 800;
  color: var(--gui-text-primary, #fff);
}
.dash__battery-status {
  font-size: 9px;
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.3));
  text-transform: uppercase;
}

.dash__perf-metrics {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dash__perf-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
}
.dash__perf-row span:first-child {
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.3));
}
.dash__perf-row span:last-child {
  color: var(--gui-text-secondary, rgba(255, 255, 255, 0.7));
  font-weight: 600;
}

.dash__alerts {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 12px;
}

.dash__alerts-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 700;
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.5));
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.dash__alerts-count {
  margin-left: auto;
  font-size: 10px;
  padding: 1px 8px;
  border-radius: 4px;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.5));
}

.dash__alerts-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 120px;
  overflow-y: auto;
}

.dash__alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 10px;
  border-left: 3px solid transparent;
}

.dash__alert--warn {
  border-left-color: var(--gui-warning);
  background: rgba(255, 149, 0, 0.04);
}
.dash__alert--bad {
  border-left-color: var(--gui-error, #ff3b30);
  background: rgba(255, 59, 48, 0.04);
}
.dash__alert--info {
  border-left-color: rgba(255, 255, 255, 0.1);
}
.dash__alert-time {
  flex-shrink: 0;
  color: var(--gui-text-disabled, rgba(255, 255, 255, 0.2));
  font-size: 9px;
}
.dash__alert-msg {
  color: var(--gui-text-secondary, rgba(255, 255, 255, 0.55));
}

.dash__network-card--full {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  padding: 18px;
  backdrop-filter: blur(12px);
}

.dash__network-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--gui-text-secondary, rgba(255, 255, 255, 0.6));
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.dash__network-badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.status-online {
  color: var(--gui-success, #34c759);
}
.status-slow {
  color: #ff9500;
}
.status-offline {
  color: var(--gui-error, #ff3b30);
}

.dash__network-badge.status-online {
  background: rgba(52, 199, 89, 0.12);
  color: var(--gui-success, #34c759);
}
.dash__network-badge.status-slow {
  background: rgba(255, 149, 0, 0.12);
  color: #ff9500;
}
.dash__network-badge.status-offline {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.12));
  color: var(--gui-error, #ff3b30);
}

.dash__network-rows {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.dash__network-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.dash__network-key {
  font-size: 9px;
  color: var(--gui-text-disabled, rgba(255, 255, 255, 0.25));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.dash__network-val {
  font-size: 12px;
  font-weight: 700;
  color: var(--gui-text-primary, rgba(255, 255, 255, 0.8));
}

.dash__speed-section {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
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
  font-weight: 700;
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.45));
  text-transform: uppercase;
}

.dash__speed-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 6px;
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.04));
  color: var(--gui-text-secondary, rgba(255, 255, 255, 0.6));
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dash__speed-btn:hover:not(:disabled) {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  color: var(--gui-text-primary, #fff);
}
.dash__speed-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dash__speed-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--gui-border-strong, rgba(255, 255, 255, 0.1));
  border-top: 2px solid #fff;
  border-radius: 50%;
  animation: dashSpin 0.8s linear infinite;
}

.dash__speed-results {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 14px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.dash__speed-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dash__speed-item-label {
  font-size: 9px;
  color: var(--gui-text-disabled, rgba(255, 255, 255, 0.25));
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.dash__speed-item-value {
  font-size: 16px;
  font-weight: 800;
  color: var(--gui-text-primary, #fff);
}
.dash__speed-item-value small {
  font-size: 10px;
  font-weight: 500;
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.3));
}

.dash__speed-bar {
  height: 3px;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  border-radius: 2px;
  overflow: hidden;
}
.dash__speed-bar-fill {
  height: 100%;
  background: #5ac8fa;
  border-radius: 2px;
  transition: width 0.5s ease;
}
.dash__speed-bar-fill--up {
  background: #34c759;
}

.dash__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.03);
}

.dash__footer-text {
  font-size: 9px;
  color: var(--gui-text-disabled, rgba(255, 255, 255, 0.2));
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.dash__footer-sep {
  color: var(--gui-text-disabled, rgba(255, 255, 255, 0.08));
}

.dash__footer-pulse {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.15));
  transition: all 0.3s ease;
}

.dash__footer-pulse--live {
  background: #34c759;
  box-shadow: 0 0 8px rgba(52, 199, 89, 0.6);
  animation: dashLivePulse 2s ease-in-out infinite;
}

@keyframes dashLivePulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(0.7);
  }
}

@keyframes dashFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1000px) {
  .dash__charts {
    grid-template-columns: 1fr;
  }
  .dash__metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .dash__system-grid {
    grid-template-columns: 1fr 1fr;
  }
  .dash__network-rows {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 700px) {
  .dash__hero {
    flex-direction: column;
  }
  .dash__gauge-cluster {
    width: 160px;
  }
  .dash__hero-stats {
    width: 100%;
    grid-template-columns: repeat(2, 1fr);
  }
  .dash__metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dash__system-grid {
    grid-template-columns: 1fr;
  }
  .dash__network-rows {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
