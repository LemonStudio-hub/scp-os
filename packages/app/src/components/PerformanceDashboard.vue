<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { PerformanceMonitorService } from '../platform/performance/performance-monitor.service'
import type {
  PerformanceIssue,
  WebVitals,
  FPSInfo,
  NetworkInfo,
} from '../platform/performance/performance-monitor.service'

// SVG icons
const ICON_MEMORY =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4"/><path d="M14 12h4"/></svg>'
const ICON_TIME =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
const ICON_FPS =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
const ICON_NET =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
const ICON_DOM =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'
const ICON_VITAL =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
const ICON_STORAGE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>'

// Import dashboard components
import {
  DashboardHeader,
  PerformanceScore,
  MetricCard,
  IssueList,
  RecommendationList,
  DashboardFooter,
} from './dashboard'
import { PerformanceOptimizerService } from '../platform/performance/performance-optimizer.service'
import { PerformanceApiService } from '../platform/performance/performance-api.service'
import { useAuthStore } from '../stores/authStore'
import { useI18n } from '../gui/composables/useI18n'

const { t } = useI18n()

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const latestReport = ref<any>(null)
const issues = ref<PerformanceIssue[]>([])
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const recommendations = ref<any[]>([])
const completedSteps = ref<Record<string, number[]>>({})
const lastUpdated = ref<string>('--:--:--')
const apiStatus = ref<string>(t('common.unknown'))
const statusMessage = ref<string>('')
const version = ref('v2.0.0')

// Real-time metrics
const webVitals = ref<WebVitals>({ lcp: null, cls: null, inp: null, fcp: null, ttfb: null })
const fpsInfo = ref<FPSInfo>({
  current: 60,
  min: 60,
  max: 60,
  avg: 60,
  frames: 0,
  droppedFrames: 0,
})
const networkInfo = ref<NetworkInfo | null>(null)
const domNodes = ref(0)
const storageUsage = ref(0)
const storageQuota = ref(0)
const memoryUsage = ref(0)
const memoryLimit = ref(0)
const pageLoadTime = ref(0)
const resourceCount = ref(0)
const refreshTimer = ref<number | null>(null)

// Computed
const memoryPercentage = computed(() => {
  if (memoryLimit.value > 0) return (memoryUsage.value / memoryLimit.value) * 100
  return 0
})

const storagePercentage = computed(() => {
  if (storageQuota.value > 0) return (storageUsage.value / storageQuota.value) * 100
  return 0
})

const metricCount = computed(() => monitorService.value?.getMetricNames().length || 0)

// Methods
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const formatMs = (ms: number): string => {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms)}ms`
}

const getMemoryStatus = (percentage: number): 'good' | 'medium' | 'poor' => {
  if (percentage >= 80) return 'poor'
  if (percentage >= 60) return 'medium'
  return 'good'
}

const getFPSStatus = (fps: number): 'good' | 'medium' | 'poor' => {
  if (fps >= 50) return 'good'
  if (fps >= 30) return 'medium'
  return 'poor'
}

const getVitalStatus = (
  name: string,
  value: number | null
): 'good' | 'medium' | 'poor' | 'unknown' => {
  if (value === null) return 'unknown'
  switch (name) {
    case 'lcp':
      return value <= 2500 ? 'good' : value <= 4000 ? 'medium' : 'poor'
    case 'cls':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'medium' : 'poor'
    case 'inp':
      return value <= 200 ? 'good' : value <= 500 ? 'medium' : 'poor'
    case 'fcp':
      return value <= 1800 ? 'good' : value <= 3000 ? 'medium' : 'poor'
    case 'ttfb':
      return value <= 800 ? 'good' : value <= 1800 ? 'medium' : 'poor'
    default:
      return 'unknown'
  }
}

const toggleMonitoring = () => {
  if (!monitorService.value) return

  if (isMonitoring.value) {
    monitorService.value.stopMonitoring()
    isMonitoring.value = false
    statusMessage.value = t('perf.monitoringStopped')
  } else {
    monitorService.value.startMonitoring(5000)
    isMonitoring.value = true
    statusMessage.value = t('perf.monitoringStarted')
  }

  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

const refreshData = () => {
  if (!monitorService.value) return

  statusMessage.value = t('perf.refreshing')

  collectRealTimeMetrics()
  generateReport()
  lastUpdated.value = new Date().toLocaleTimeString()

  setTimeout(() => {
    statusMessage.value = ''
  }, 1500)
}

const collectRealTimeMetrics = () => {
  if (!monitorService.value) return

  // Collect from service
  webVitals.value = monitorService.value.getWebVitals()
  fpsInfo.value = monitorService.value.getFPSInfo()
  networkInfo.value = monitorService.value.getNetworkInfo()
  domNodes.value = monitorService.value.getDOMNodeCount()

  // Memory
  if (performance.memory) {
    memoryUsage.value = performance.memory.usedJSHeapSize
    memoryLimit.value = performance.memory.jsHeapSizeLimit
  }

  // Page load
  const navEntries = performance.getEntriesByType?.('navigation')
  if (navEntries && navEntries.length > 0) {
    const nav = navEntries[0] as PerformanceNavigationTiming
    pageLoadTime.value = nav.loadEventEnd - nav.startTime
  }

  // Resources
  const resources = performance.getEntriesByType?.('resource') || []
  resourceCount.value = resources.length

  // Storage
  if (navigator.storage?.estimate) {
    navigator.storage.estimate().then((est) => {
      if (est.usage !== undefined) storageUsage.value = est.usage
      if (est.quota !== undefined) storageQuota.value = est.quota
    })
  }
}

const generateReport = () => {
  if (!monitorService.value || !optimizerService.value) return

  const report = monitorService.value.generateReport()
  
  // Use createOptimizationPlan to compute the dynamic currentScore and strategies
  const plan = optimizerService.value.createOptimizationPlan(report.issues || [])
  report.score = plan.currentScore
  
  latestReport.value = report
  issues.value = report.issues || []
  recommendations.value = plan.strategies
}

const handleClear = () => {
  if (!monitorService.value) return
  monitorService.value.clear()
  latestReport.value = null
  issues.value = []
  recommendations.value = []
  statusMessage.value = t('perf.dataCleared')
  setTimeout(() => {
    statusMessage.value = ''
  }, 2000)
}

const handleExport = () => {
  if (!latestReport.value) {
    statusMessage.value = t('perf.noDataToExport')
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
    webVitals: webVitals.value,
    fps: fpsInfo.value,
    network: networkInfo.value,
    domNodes: domNodes.value,
    memory: { used: memoryUsage.value, limit: memoryLimit.value, percent: memoryPercentage.value },
    storage: {
      usage: storageUsage.value,
      quota: storageQuota.value,
      percent: storagePercentage.value,
    },
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

  statusMessage.value = t('perf.reportExported')
  setTimeout(() => {
    statusMessage.value = ''
  }, 2000)
}

const handleClose = () => emit('close')

const checkApiStatus = async () => {
  if (!apiService.value) return
  const isOnline = await apiService.value.getApiStatus()
  apiStatus.value = isOnline ? t('dash.online') : t('dash.offline')
}

const initCompletedSteps = () => {
  if (!optimizerService.value) return
  const strategies = optimizerService.value.getAllStrategies()
  const stepsMap: Record<string, number[]> = {}
  strategies.forEach((s) => {
    const validation = optimizerService.value!.validateImplementation(s.id)
    const completed: number[] = []
    s.steps.forEach((_, idx) => {
      if (validation.checks[`step-${idx}`]) {
        completed.push(idx)
      }
    })
    stepsMap[s.id] = completed
  })
  completedSteps.value = stepsMap
}

const handleToggleStep = (strategyId: string, stepIndex: number) => {
  if (!optimizerService.value) return
  
  const currentCompleted = completedSteps.value[strategyId] || []
  if (currentCompleted.includes(stepIndex)) {
    optimizerService.value.markStepNotImplemented(strategyId, stepIndex)
  } else {
    optimizerService.value.markStepImplemented(strategyId, stepIndex)
  }
  
  initCompletedSteps()
  refreshData()
}

watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue) {
      initCompletedSteps()
      refreshData()
      checkApiStatus()
    }
  }
)

onMounted(() => {
  try {
    monitorService.value = new PerformanceMonitorService()
    optimizerService.value = new PerformanceOptimizerService()
    initCompletedSteps()
    apiService.value = new PerformanceApiService()

    const authStore = useAuthStore()
    if (authStore.userId) {
      apiService.value.setUserId(authStore.userId)
    }

    watch(
      () => authStore.userId,
      (newUserId) => {
        if (apiService.value && newUserId) {
          apiService.value.setUserId(newUserId)
        }
      }
    )

    monitorService.value.startMonitoring(5000)
    isMonitoring.value = true
    checkApiStatus()

    if (apiService.value && monitorService.value) {
      apiService.value.startAutoSend(60000, () => {
        const names = monitorService.value?.getMetricNames() || []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allMetrics: any[] = []
        for (const name of names) {
          const latest = monitorService.value?.getLatestMetric(name)
          if (latest) allMetrics.push(latest)
        }
        return allMetrics
      })
    }

    // Start auto-refresh every 2 seconds for real-time metrics
    refreshTimer.value = window.setInterval(() => {
      if (props.isVisible) collectRealTimeMetrics()
    }, 2000)

    setTimeout(() => {
      refreshData()
    }, 500)
  } catch (error) {
    console.error('[PerformanceDashboard] Init error:', error)
    statusMessage.value = t('perf.failedToInitialize')
  }
})

onUnmounted(() => {
  if (monitorService.value) monitorService.value.stopMonitoring()
  if (apiService.value) apiService.value.stopAutoSend()
  if (refreshTimer.value) clearInterval(refreshTimer.value)
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
            :is-monitoring="isMonitoring"
            :version="version"
            @toggle-monitoring="toggleMonitoring"
            @refresh="refreshData"
            @close="handleClose"
          />

          <!-- Performance Score -->
          <PerformanceScore :score="latestReport?.score ?? 0" :issue-count="issues.length" />

          <!-- Scrollable Dashboard Body -->
          <div class="dashboard-body">
            <!-- Real-time Metrics Grid -->
            <div class="metrics-section">
              <h3 class="section-title">
                <!-- eslint-disable-next-line vue/no-v-html -->
                <span class="title-icon" v-html="ICON_VITAL" />
                {{ t('perf.realtimeMetrics') }}
              </h3>
              <TransitionGroup name="metric-stagger" appear tag="div" class="metrics-grid">
                <!-- Memory -->
                <MetricCard
                  key="memory"
                  :icon="ICON_MEMORY"
                  :name="t('perf.memory')"
                  :value="memoryPercentage"
                  unit="%"
                  type="memory"
                  :progress="memoryPercentage"
                  :meta-label="t('perf.used')"
                  :meta-value="formatBytes(memoryUsage)"
                  :footer="`${t('perf.of')} ${formatBytes(memoryLimit)}`"
                  :status="getMemoryStatus(memoryPercentage)"
                />

                <!-- FPS -->
                <MetricCard
                  key="fps"
                  :icon="ICON_FPS"
                  :name="t('perf.frameRate')"
                  :value="fpsInfo.current"
                  unit="FPS"
                  type="fps"
                  :progress="(fpsInfo.current / 60) * 100"
                  :meta-label="t('perf.minAvgMax')"
                  :meta-value="`${fpsInfo.min} / ${fpsInfo.avg} / ${fpsInfo.max}`"
                  :footer="t('perf.target60Fps')"
                  :status="getFPSStatus(fpsInfo.current)"
                />

                <!-- Page Load -->
                <MetricCard
                  key="pageLoad"
                  :icon="ICON_TIME"
                  :name="t('perf.pageLoad')"
                  :value="pageLoadTime"
                  unit="ms"
                  type="time"
                  :footer="t('perf.totalLoadTime')"
                  :status="pageLoadTime < 1500 ? 'good' : pageLoadTime < 3000 ? 'medium' : 'poor'"
                />

                <!-- DOM Nodes -->
                <MetricCard
                  key="domNodes"
                  :icon="ICON_DOM"
                  :name="t('perf.domNodes')"
                  :value="domNodes"
                  type="count"
                  :footer="domNodes > 3000 ? t('perf.reduceDomSize') : t('perf.healthyDomSize')"
                  :status="domNodes < 1500 ? 'good' : domNodes < 3000 ? 'medium' : 'poor'"
                />
              </TransitionGroup>
            </div>

            <!-- Web Vitals Section -->
            <div class="metrics-section vitals-section">
              <h3 class="section-title">
                <!-- eslint-disable-next-line vue/no-v-html -->
                <span class="title-icon" v-html="ICON_VITAL" />
                {{ t('perf.webVitals') }}
              </h3>
              <div class="vitals-grid">
                <!-- LCP -->
                <div class="vital-card">
                  <div class="vital-header">
                    <span class="vital-name">LCP</span>
                    <span
                      class="vital-badge"
                      :class="`vital-${getVitalStatus('lcp', webVitals.lcp)}`"
                    >
                      {{
                        getVitalStatus('lcp', webVitals.lcp) === 'unknown'
                          ? '-'
                          : getVitalStatus('lcp', webVitals.lcp).toUpperCase()
                      }}
                    </span>
                  </div>
                  <div class="vital-value">
                    {{ webVitals.lcp !== null ? formatMs(webVitals.lcp) : t('perf.collecting') }}
                  </div>
                  <div class="vital-desc">{{ t('perf.lcpDesc') }}</div>
                  <div class="vital-bar">
                    <div
                      class="vital-bar-fill"
                      :style="{ width: `${Math.min(100, ((webVitals.lcp || 0) / 4000) * 100)}%` }"
                      :class="`vital-${getVitalStatus('lcp', webVitals.lcp)}`"
                    />
                  </div>
                  <div class="vital-thresholds"><span>0</span><span>2.5s</span><span>4s+</span></div>
                </div>

                <!-- CLS -->
                <div class="vital-card">
                  <div class="vital-header">
                    <span class="vital-name">CLS</span>
                    <span
                      class="vital-badge"
                      :class="`vital-${getVitalStatus('cls', webVitals.cls)}`"
                    >
                      {{
                        getVitalStatus('cls', webVitals.cls) === 'unknown'
                          ? '-'
                          : getVitalStatus('cls', webVitals.cls).toUpperCase()
                      }}
                    </span>
                  </div>
                  <div class="vital-value">
                    {{ webVitals.cls !== null ? webVitals.cls.toFixed(3) : t('perf.collecting') }}
                  </div>
                  <div class="vital-desc">{{ t('perf.clsDesc') }}</div>
                  <div class="vital-bar">
                    <div
                      class="vital-bar-fill"
                      :style="{ width: `${Math.min(100, ((webVitals.cls || 0) / 0.25) * 100)}%` }"
                      :class="`vital-${getVitalStatus('cls', webVitals.cls)}`"
                    />
                  </div>
                  <div class="vital-thresholds"><span>0</span><span>0.1</span><span>0.25+</span></div>
                </div>

                <!-- INP -->
                <div class="vital-card">
                  <div class="vital-header">
                    <span class="vital-name">INP</span>
                    <span
                      class="vital-badge"
                      :class="`vital-${getVitalStatus('inp', webVitals.inp)}`"
                    >
                      {{
                        getVitalStatus('inp', webVitals.inp) === 'unknown'
                          ? '-'
                          : getVitalStatus('inp', webVitals.inp).toUpperCase()
                      }}
                    </span>
                  </div>
                  <div class="vital-value">
                    {{ webVitals.inp !== null ? formatMs(webVitals.inp) : t('perf.collecting') }}
                  </div>
                  <div class="vital-desc">{{ t('perf.inpDesc') }}</div>
                  <div class="vital-bar">
                    <div
                      class="vital-bar-fill"
                      :style="{ width: `${Math.min(100, ((webVitals.inp || 0) / 500) * 100)}%` }"
                      :class="`vital-${getVitalStatus('inp', webVitals.inp)}`"
                    />
                  </div>
                  <div class="vital-thresholds">
                    <span>0</span><span>200ms</span><span>500ms+</span>
                  </div>
                </div>

                <!-- TTFB -->
                <div class="vital-card">
                  <div class="vital-header">
                    <span class="vital-name">TTFB</span>
                    <span
                      class="vital-badge"
                      :class="`vital-${getVitalStatus('ttfb', webVitals.ttfb)}`"
                    >
                      {{
                        getVitalStatus('ttfb', webVitals.ttfb) === 'unknown'
                          ? '-'
                          : getVitalStatus('ttfb', webVitals.ttfb).toUpperCase()
                      }}
                    </span>
                  </div>
                  <div class="vital-value">
                    {{ webVitals.ttfb !== null ? formatMs(webVitals.ttfb) : t('perf.collecting') }}
                  </div>
                  <div class="vital-desc">{{ t('perf.ttfbDesc') }}</div>
                  <div class="vital-bar">
                    <div
                      class="vital-bar-fill"
                      :style="{ width: `${Math.min(100, ((webVitals.ttfb || 0) / 1800) * 100)}%` }"
                      :class="`vital-${getVitalStatus('ttfb', webVitals.ttfb)}`"
                    />
                  </div>
                  <div class="vital-thresholds">
                    <span>0</span><span>800ms</span><span>1.8s+</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Network & Storage Section -->
            <div class="metrics-section info-section">
              <h3 class="section-title">
                <!-- eslint-disable-next-line vue/no-v-html -->
                <span class="title-icon" v-html="ICON_NET" />
                {{ t('perf.systemInfo') }}
              </h3>
              <div class="info-grid">
                <!-- Network -->
                <div class="info-card">
                  <div class="info-card-title">
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <span class="info-icon" v-html="ICON_NET" />
                    {{ t('perf.network') }}
                  </div>
                  <div v-if="networkInfo" class="info-card-body">
                    <div class="info-row">
                      <span>{{ t('perf.type') }}</span
                      ><span class="info-val"
                        >{{ networkInfo.effectiveType.toUpperCase() }} ({{ networkInfo.type }})</span
                      >
                    </div>
                    <div class="info-row">
                      <span>{{ t('perf.downlink') }}</span
                      ><span class="info-val">{{ networkInfo.downlink }} Mbps</span>
                    </div>
                    <div class="info-row">
                      <span>RTT</span><span class="info-val">{{ networkInfo.rtt }} ms</span>
                    </div>
                    <div class="info-row">
                      <span>{{ t('perf.saveData') }}</span
                      ><span class="info-val">{{
                        networkInfo.saveData ? t('perf.yes') : t('perf.no')
                      }}</span>
                    </div>
                  </div>
                  <div v-else class="info-card-body">
                    <p class="info-placeholder">{{ t('perf.networkApiUnavailable') }}</p>
                  </div>
                </div>

                <!-- Storage -->
                <div class="info-card">
                  <div class="info-card-title">
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <span class="info-icon" v-html="ICON_STORAGE" />
                    {{ t('perf.storage') }}
                  </div>
                  <div class="info-card-body">
                    <div class="info-row">
                      <span>{{ t('perf.used') }}</span
                      ><span class="info-val">{{ formatBytes(storageUsage) }}</span>
                    </div>
                    <div class="info-row">
                      <span>{{ t('perf.quota') }}</span
                      ><span class="info-val">{{ formatBytes(storageQuota) }}</span>
                    </div>
                    <div class="info-row">
                      <span>{{ t('perf.usage') }}</span>
                      <span class="info-val">{{ storagePercentage.toFixed(1) }}%</span>
                    </div>
                    <div class="storage-bar">
                      <div
                        class="storage-bar-fill"
                        :style="{ width: `${Math.min(100, storagePercentage)}%` }"
                      />
                    </div>
                  </div>
                </div>

                <!-- Resources -->
                <div class="info-card">
                  <div class="info-card-title">
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <span class="info-icon" v-html="ICON_DOM" />
                    {{ t('perf.resources') }}
                  </div>
                  <div class="info-card-body">
                    <div class="info-row">
                      <span>{{ t('perf.loaded') }}</span
                      ><span class="info-val">{{ resourceCount }}</span>
                    </div>
                    <div class="info-row">
                      <span>{{ t('perf.domNodes') }}</span
                      ><span class="info-val">{{ domNodes }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Issues Section -->
            <IssueList :issues="issues" />

            <!-- Recommendations Section -->
            <RecommendationList
              :recommendations="recommendations"
              :show-steps="true"
              :completed-steps="completedSteps"
              @toggle-step="handleToggleStep"
            />
          </div>

          <!-- Footer -->
          <DashboardFooter
            :metric-count="metricCount"
            :last-updated="lastUpdated"
            :api-status="apiStatus"
            :status-message="statusMessage"
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
/* ── Transitions (keep existing) ──────────────────────────────────── */
.perf-dashboard-enter-active {
  animation: dashboardFadeIn 0.35s cubic-bezier(0.32, 0.72, 0, 1) both;
}
.perf-dashboard-leave-active {
  animation: dashboardFadeOut 0.25s ease both;
}
@keyframes dashboardFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes dashboardFadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.perf-overlay-enter-active {
  animation: overlayFadeIn 0.35s cubic-bezier(0.32, 0.72, 0, 1) both;
}
.perf-overlay-leave-active {
  animation: overlayFadeOut 0.25s ease both;
}
@keyframes overlayFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px);
  }
}
@keyframes overlayFadeOut {
  from {
    opacity: 1;
    backdrop-filter: blur(8px);
  }
  to {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
}

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

.metric-stagger-enter-active {
  animation: metricSlideUp 0.4s cubic-bezier(0.32, 0.72, 0, 1) both;
}
.metric-stagger-move-transition {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.metric-stagger:nth-child(1) {
  animation-delay: 0ms;
}
.metric-stagger:nth-child(2) {
  animation-delay: 60ms;
}
.metric-stagger:nth-child(3) {
  animation-delay: 120ms;
}
.metric-stagger:nth-child(4) {
  animation-delay: 180ms;
}
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

/* ── Layout ───────────────────────────────────────────────────────── */
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
  background: var(--gui-bg-base, #1c1c1e);
  border-radius: var(--gui-radius-squircle-xl, 18px);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.08));
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dashboard-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 24px;
}

.metrics-section {
  padding: 16px 24px;
  flex-shrink: 0;
}

.vitals-section {
  padding-top: 8px;
}
.info-section {
  padding-top: 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--gui-text-primary, #ffffff);
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.01em;
}

.title-icon {
  display: flex;
  align-items: center;
  color: var(--gui-accent, #8e8e93);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

/* ── Web Vitals ───────────────────────────────────────────────────── */
.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.vital-card {
  background: var(--gui-bg-surface, #1c1c1e);
  border-radius: 12px;
  padding: 14px;
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.vital-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.vital-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--gui-text-secondary, #8e8e93);
}

.vital-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.vital-badge.vital-good {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
}
.vital-badge.vital-medium {
  background: rgba(255, 149, 0, 0.15);
  color: #ff9500;
}
.vital-badge.vital-poor {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
}
.vital-badge.vital-unknown {
  background: rgba(142, 142, 147, 0.15);
  color: #8e8e93;
}

.vital-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--gui-text-primary, #ffffff);
  margin: 4px 0 2px;
}

.vital-desc {
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
  margin-bottom: 10px;
}

.vital-bar {
  height: 4px;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  border-radius: 2px;
  overflow: hidden;
}

.vital-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition:
    width 0.4s ease,
    background 0.3s ease;
}
.vital-bar-fill.vital-good {
  background: #34c759;
}
.vital-bar-fill.vital-medium {
  background: #ff9500;
}
.vital-bar-fill.vital-poor {
  background: #ff3b30;
}

.vital-thresholds {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 10px;
  color: var(--gui-text-tertiary, #636366);
}

/* ── System Info ──────────────────────────────────────────────────── */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.info-card {
  background: var(--gui-bg-surface, #1c1c1e);
  border-radius: 12px;
  padding: 14px;
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.info-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--gui-text-secondary, #8e8e93);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.info-icon {
  display: flex;
  align-items: center;
  opacity: 0.7;
}

.info-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.info-row span:first-child {
  color: var(--gui-text-tertiary, #636366);
}
.info-val {
  color: var(--gui-text-primary, #ffffff);
  font-weight: 500;
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  font-size: 11px;
}

.info-placeholder {
  font-size: 12px;
  color: var(--gui-text-tertiary, #636366);
  text-align: center;
  padding: 8px 0;
}

.storage-bar {
  height: 4px;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}

.storage-bar-fill {
  height: 100%;
  background: var(--gui-accent, #007aff);
  border-radius: 2px;
  transition: width 0.4s ease;
}

/* ── Scrollbar ────────────────────────────────────────────────────── */
.dashboard-body::-webkit-scrollbar {
  width: 6px;
}
.dashboard-body::-webkit-scrollbar-track {
  background: transparent;
}
.dashboard-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}
.dashboard-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* ── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .dashboard-container {
    width: 96%;
    max-height: 95vh;
    border-radius: var(--gui-radius-lg, 12px);
  }
  .metrics-grid {
    grid-template-columns: 1fr 1fr;
  }
  .vitals-grid {
    grid-template-columns: 1fr 1fr;
  }
  .info-grid {
    grid-template-columns: 1fr;
  }
  .metrics-section {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .vitals-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .perf-modal {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}
.light .perf-modal__backdrop {
  background: rgba(0, 0, 0, 0.3);
}
.light .perf-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.light .perf-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.light .storage-bar-fill {
  background: var(--gui-accent, #636366);
}
.light .title-icon {
  color: var(--gui-accent, #636366);
}
</style>
