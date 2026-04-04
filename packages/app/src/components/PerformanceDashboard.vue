<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { PerformanceMonitorService } from '../platform/performance/performance-monitor.service'
import { PerformanceOptimizerService } from '../platform/performance/performance-optimizer.service'
import { PerformanceApiService } from '../platform/performance/performance-api.service'
import type { PerformanceIssue } from '../platform/performance/performance-monitor.service'

// SVG icon constants (flat, no emoji)
const ICON_MEMORY = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4"/><path d="M14 12h4"/></svg>'
const ICON_TIME = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
const ICON_BOX = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
const ICON_CHART = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>'

// Import dashboard components
import {
  DashboardHeader,
  PerformanceScore,
  MetricCard,
  IssueList,
  RecommendationList,
  DashboardFooter
} from './dashboard'

// Props
const props = defineProps<{
  isVisible: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Services
const monitorService = ref<PerformanceMonitorService | null>(null)
const optimizerService = ref<PerformanceOptimizerService | null>(null)
const apiService = ref<PerformanceApiService | null>(null)

// State
const isMonitoring = ref(false)
const latestReport = ref<any>(null)
const issues = ref<PerformanceIssue[]>([])
const recommendations = ref<any[]>([])
const lastUpdated = ref<string>('-')
const apiStatus = ref<string>('Unknown')
const statusMessage = ref<string>('')
const version = ref('v1.0.0')

// Computed
const metricCount = computed(() => monitorService.value?.getMetricNames().length || 0)

const memoryMetric = computed(() =>
  monitorService.value?.getLatestMetric('memory-used')
)

const memoryUsagePercentage = computed(() => {
  if (!memoryMetric.value || !performance.memory) return 0
  return ((memoryMetric.value.value / performance.memory.jsHeapSizeLimit) * 100)
})

const pageLoadMetric = computed(() =>
  monitorService.value?.getLatestMetric('page-load-time')
)

const resourceCountMetric = computed(() =>
  monitorService.value?.getLatestMetric('resource-count')
)

const avgResourceMetric = computed(() =>
  monitorService.value?.getLatestMetric('avg-resource-time')
)

// Methods
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const getMemoryStatus = (percentage: number): 'good' | 'medium' | 'poor' => {
  if (percentage >= 80) return 'poor'
  if (percentage >= 60) return 'medium'
  return 'good'
}

const getLoadTimeStatus = (loadTime: number): 'good' | 'medium' | 'poor' => {
  if (loadTime >= 3000) return 'poor'
  if (loadTime >= 1500) return 'medium'
  return 'good'
}

const toggleMonitoring = () => {
  if (!monitorService.value) return

  if (isMonitoring.value) {
    monitorService.value.stopMonitoring()
    isMonitoring.value = false
    statusMessage.value = 'Monitoring stopped'
  } else {
    monitorService.value.startMonitoring(5000)
    isMonitoring.value = true
    statusMessage.value = 'Monitoring started'
  }

  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

const refreshData = () => {
  if (!monitorService.value || !optimizerService.value) return

  statusMessage.value = 'Refreshing data...'

  latestReport.value = monitorService.value.generateReport()
  issues.value = latestReport.value.issues || []
  recommendations.value = optimizerService.value.recommendOptimizations(issues.value)
  lastUpdated.value = new Date().toLocaleTimeString()

  setTimeout(() => {
    statusMessage.value = 'Data refreshed successfully'
    setTimeout(() => {
      statusMessage.value = ''
    }, 2000)
  }, 500)
}

const handleClear = () => {
  if (!monitorService.value) return

  monitorService.value.clear()
  latestReport.value = null
  issues.value = []
  recommendations.value = []
  statusMessage.value = 'All data cleared'

  setTimeout(() => {
    statusMessage.value = ''
  }, 2000)
}

const handleExport = () => {
  if (!latestReport.value) {
    statusMessage.value = 'No data to export'
    setTimeout(() => {
      statusMessage.value = ''
    }, 2000)
    return
  }

  const exportData = {
    timestamp: new Date().toISOString(),
    score: latestReport.value.score,
    issues: issues.value,
    recommendations: recommendations.value,
    metrics: latestReport.value.metrics
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-report-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  statusMessage.value = 'Report exported successfully'
  setTimeout(() => {
    statusMessage.value = ''
  }, 2000)
}

const handleClose = () => {
  emit('close')
}

const checkApiStatus = async () => {
  if (!apiService.value) return

  const isOnline = await apiService.value.getApiStatus()
  apiStatus.value = isOnline ? 'Online' : 'Offline'
}

watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      refreshData()
      checkApiStatus()
    }, 100)
  }
})

onMounted(() => {
  try {
    monitorService.value = new PerformanceMonitorService()
    optimizerService.value = new PerformanceOptimizerService()
    apiService.value = new PerformanceApiService()

    monitorService.value.startMonitoring(5000)
    isMonitoring.value = true

    checkApiStatus()

    if (apiService.value && monitorService.value) {
      apiService.value.startAutoSend(60000, () => {
        const allMetrics: any[] = []
        const metricNames = monitorService.value!.getMetricNames()

        for (const name of metricNames) {
          const latest = monitorService.value!.getLatestMetric(name)
          if (latest) {
            allMetrics.push(latest)
          }
        }

        return allMetrics
      })
    }

    setTimeout(() => {
      refreshData()
    }, 1000)
  } catch (error) {
    console.error('[PerformanceDashboard] Error during mount:', error)
    statusMessage.value = 'Failed to initialize dashboard'
  }
})

onUnmounted(() => {
  if (monitorService.value) {
    monitorService.value.stopMonitoring()
  }

  if (apiService.value) {
    apiService.value.stopAutoSend()
  }
})
</script>

<template>
  <Transition name="perf-dashboard">
    <div v-if="isVisible" class="performance-dashboard">
      <Transition name="perf-overlay" appear>
        <div class="dashboard-overlay" @click="handleClose" />
      </Transition>

      <Transition name="perf-container" appear>
        <div class="dashboard-container">
          <!-- Header -->
          <DashboardHeader
            :isMonitoring="isMonitoring"
            :version="version"
            @toggleMonitoring="toggleMonitoring"
            @refresh="refreshData"
            @close="handleClose"
          />

          <!-- Performance Score -->
          <PerformanceScore
            :score="latestReport?.score || 0"
            :issueCount="issues.length"
          />

          <!-- Metrics Grid -->
          <div class="metrics-section">
            <h3 class="section-title">
              <span class="title-icon" v-html="ICON_CHART" />
              Real-time Metrics
            </h3>
            <TransitionGroup name="metric-stagger" appear tag="div" class="metrics-grid">
              <MetricCard
                key="memory"
                :icon="ICON_MEMORY"
                name="Memory Usage"
                :value="memoryMetric?.value || 0"
                type="memory"
                :progress="memoryUsagePercentage"
                metaLabel="Used"
                :metaValue="formatBytes(memoryMetric?.value || 0)"
                footer="Total heap memory usage"
                :status="getMemoryStatus(memoryUsagePercentage)"
              />

              <MetricCard
                key="pageLoad"
                :icon="ICON_TIME"
                name="Page Load"
                :value="pageLoadMetric?.value || 0"
                unit="ms"
                type="time"
                footer="Time to fully load the page"
                :status="getLoadTimeStatus(pageLoadMetric?.value || 0)"
              />

              <MetricCard
                key="resources"
                :icon="ICON_BOX"
                name="Resources"
                :value="resourceCountMetric?.value || 0"
                type="count"
                footer="Total loaded resources"
              />

              <MetricCard
                key="avgResource"
                :icon="ICON_CHART"
                name="Avg Resource"
                :value="avgResourceMetric?.value || 0"
                unit="ms"
                type="time"
                footer="Average resource load time"
              />
            </TransitionGroup>
          </div>

          <!-- Issues Section -->
          <IssueList :issues="issues" />

          <!-- Recommendations Section -->
          <RecommendationList
            :recommendations="recommendations"
            :showSteps="true"
          />

          <!-- Footer -->
          <DashboardFooter
            :metricCount="metricCount"
            :lastUpdated="lastUpdated"
            :apiStatus="apiStatus"
            :statusMessage="statusMessage"
            @export="handleExport"
            @refresh="refreshData"
            @clear="handleClear"
          />
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Dashboard Transition ──────────────────────────────────────────── */
.perf-dashboard-enter-active {
  animation: dashboardFadeIn 0.35s cubic-bezier(0.32, 0.72, 0, 1) both;
}

.perf-dashboard-leave-active {
  animation: dashboardFadeOut 0.25s ease both;
}

@keyframes dashboardFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes dashboardFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* ── Overlay Transition ───────────────────────────────────────────── */
.perf-overlay-enter-active {
  animation: overlayFadeIn 0.35s cubic-bezier(0.32, 0.72, 0, 1) both;
}

.perf-overlay-leave-active {
  animation: overlayFadeOut 0.25s ease both;
}

@keyframes overlayFadeIn {
  from { opacity: 0; backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(8px); }
}

@keyframes overlayFadeOut {
  from { opacity: 1; backdrop-filter: blur(8px); }
  to { opacity: 0; backdrop-filter: blur(0px); }
}

/* ── Container Transition ─────────────────────────────────────────── */
.perf-container-enter-active {
  animation: containerSpringIn 0.45s cubic-bezier(0.32, 0.72, 0, 1) both;
}

.perf-container-leave-active {
  animation: containerSpringOut 0.25s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes containerSpringIn {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes containerSpringOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(20px) scale(0.97);
  }
}

/* ── Metric Stagger ───────────────────────────────────────────────── */
.metric-stagger-enter-active {
  animation: metricSlideUp 0.4s cubic-bezier(0.32, 0.72, 0, 1) both;
}

.metric-stagger-move-transition {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.metric-stagger:nth-child(1) { animation-delay: 0ms; }
.metric-stagger:nth-child(2) { animation-delay: 60ms; }
.metric-stagger:nth-child(3) { animation-delay: 120ms; }
.metric-stagger:nth-child(4) { animation-delay: 180ms; }

@keyframes metricSlideUp {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ── Dashboard Layout ─────────────────────────────────────────────── */
.performance-dashboard {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dashboard-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.dashboard-container {
  position: relative;
  width: 92%;
  max-width: 1100px;
  max-height: 90vh;
  background: var(--gui-bg-base, #1C1C1E);
  border-radius: var(--gui-radius-squircle-xl, 18px);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.08));
  box-shadow: var(--gui-shadow-ios-modal, 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 1px rgba(255, 255, 255, 0.06));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.metrics-section {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.01em;
}

.title-icon {
  display: flex;
  align-items: center;
  color: var(--gui-accent, #8E8E93);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

/* Scrollbar */
.metrics-section::-webkit-scrollbar {
  width: 6px;
}

.metrics-section::-webkit-scrollbar-track {
  background: transparent;
}

.metrics-section::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: var(--gui-radius-full, 999px);
  transition: background 150ms ease;
}

.metrics-section::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-container {
    width: 96%;
    max-height: 95vh;
    border-radius: var(--gui-radius-lg, 12px);
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .metrics-section {
    padding: 16px;
  }
}
</style>
