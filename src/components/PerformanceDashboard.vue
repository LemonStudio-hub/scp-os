<template>
  <div class="performance-dashboard" v-if="isVisible">
    <div class="dashboard-overlay" @click="handleClose"></div>
    
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
          <span class="title-icon">📊</span>
          Real-time Metrics
        </h3>
        <div class="metrics-grid">
          <!-- Memory Metric -->
          <MetricCard
            icon="💾"
            name="Memory Usage"
            :value="memoryMetric?.value || 0"
            type="memory"
            :progress="memoryUsagePercentage"
            metaLabel="Used"
            :metaValue="formatBytes(memoryMetric?.value || 0)"
            footer="Total heap memory usage"
            :status="getMemoryStatus(memoryUsagePercentage)"
          />

          <!-- Page Load Time -->
          <MetricCard
            icon="⏱️"
            name="Page Load"
            :value="pageLoadMetric?.value || 0"
            unit="ms"
            type="time"
            footer="Time to fully load the page"
            :status="getLoadTimeStatus(pageLoadMetric?.value || 0)"
          />

          <!-- Resource Count -->
          <MetricCard
            icon="📦"
            name="Resources"
            :value="resourceCountMetric?.value || 0"
            type="count"
            footer="Total loaded resources"
          />

          <!-- Avg Resource Time -->
          <MetricCard
            icon="📊"
            name="Avg Resource"
            :value="avgResourceMetric?.value || 0"
            unit="ms"
            type="time"
            footer="Average resource load time"
          />
        </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { PerformanceMonitorService } from '../platform/performance/performance-monitor.service'
import { PerformanceOptimizerService } from '../platform/performance/performance-optimizer.service'
import { PerformanceApiService } from '../platform/performance/performance-api.service'
import type { PerformanceIssue } from '../platform/performance/performance-monitor.service'

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
  
  // Clear status message after 3 seconds
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

// Watch isVisible prop
watch(() => props.isVisible, (newValue) => {
  console.log('[PerformanceDashboard] isVisible changed:', newValue)
  if (newValue) {
    console.log('[PerformanceDashboard] Dashboard is now visible')
    // Refresh data when dashboard opens
    setTimeout(() => {
      refreshData()
      checkApiStatus()
    }, 100)
  }
})

// Lifecycle
onMounted(() => {
  console.log('[PerformanceDashboard] Component mounting...')
  
  try {
    monitorService.value = new PerformanceMonitorService()
    optimizerService.value = new PerformanceOptimizerService()
    apiService.value = new PerformanceApiService()
    
    console.log('[PerformanceDashboard] Services initialized')
    
    // Start monitoring automatically
    monitorService.value.startMonitoring(5000)
    isMonitoring.value = true
    
    console.log('[PerformanceDashboard] Monitoring started')
    
    // Check API status
    checkApiStatus()
    
    // Start automatic metrics transmission to backend
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
      
      console.log('[PerformanceDashboard] Auto-send started')
    }
    
    // Initial data load
    setTimeout(() => {
      console.log('[PerformanceDashboard] Refreshing data...')
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

<style scoped>
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
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dashboard-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  animation: fadeInOverlay 0.3s ease;
}

@keyframes fadeInOverlay {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px);
  }
}

.dashboard-container {
  position: relative;
  width: 90%;
  max-width: 1100px;
  max-height: 90vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  border-radius: 20px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.8),
    0 0 0 1px rgba(255, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.metrics-section {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: 0.5px;
}

.title-icon {
  font-size: 18px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

/* Scrollbar styles */
.metrics-section::-webkit-scrollbar {
  width: 8px;
}

.metrics-section::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
}

.metrics-section::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.metrics-section::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* Responsive design */
@media (max-width: 768px) {
  .dashboard-container {
    width: 95%;
    max-height: 95vh;
    border-radius: 16px;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .metrics-section {
    padding: 16px;
  }
}
</style>