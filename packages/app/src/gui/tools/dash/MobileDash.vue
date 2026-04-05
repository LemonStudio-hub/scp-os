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
        <!-- Summary Cards -->
        <div class="mobile-dash__cards">
          <!-- Memory Card -->
          <div class="mobile-dash__card">
            <div class="mobile-dash__card-header">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="6" width="16" height="10" rx="2"/>
                <path d="M6 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              <span>Memory</span>
            </div>
            <div class="mobile-dash__card-value">{{ memoryUsage.used }} MB</div>
            <div class="mobile-dash__card-bar">
              <div
                class="mobile-dash__card-bar-fill"
                :style="{ width: `${memoryUsage.percent}%` }"
              />
            </div>
            <div class="mobile-dash__card-footer">
              <span>{{ memoryUsage.percent }}% used</span>
              <span>/ {{ memoryUsage.total }} MB</span>
            </div>
          </div>

          <!-- Performance Card -->
          <div class="mobile-dash__card">
            <div class="mobile-dash__card-header">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <span>Score</span>
            </div>
            <div class="mobile-dash__card-value" :class="scoreClass">
              {{ performanceScore }}
            </div>
            <div class="mobile-dash__card-footer">
              <span>{{ scoreText }}</span>
            </div>
          </div>
        </div>

        <!-- Metrics List -->
        <div class="mobile-dash__metrics">
          <h3 class="mobile-dash__metrics-title">Metrics</h3>
          <div class="mobile-dash__metric-row">
            <span class="mobile-dash__metric-label">JS Heap</span>
            <span class="mobile-dash__metric-value">{{ jsHeap }}</span>
          </div>
          <div class="mobile-dash__metric-row">
            <span class="mobile-dash__metric-label">DOM Nodes</span>
            <span class="mobile-dash__metric-value">{{ domNodes }}</span>
          </div>
          <div class="mobile-dash__metric-row">
            <span class="mobile-dash__metric-label">Resources</span>
            <span class="mobile-dash__metric-value">{{ resources }}</span>
          </div>
          <div class="mobile-dash__metric-row">
            <span class="mobile-dash__metric-label">JS Event Listeners</span>
            <span class="mobile-dash__metric-value">{{ jsListeners }}</span>
          </div>
        </div>

        <!-- Refresh Button -->
        <button class="mobile-dash__refresh" @click="refreshMetrics">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 10a8 8 0 0114.93-4M16 10a8 8 0 01-14.93 4"/>
            <path d="M19 2v4h-4M1 18v-4h4"/>
          </svg>
          Refresh
        </button>
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

// Metrics state
const memoryUsage = ref({ used: 0, total: 0, percent: 0 })
const performanceScore = ref(85)
const jsHeap = ref('—')
const domNodes = ref('—')
const resources = ref('—')
const jsListeners = ref('—')

const scoreClass = computed(() => {
  const s = performanceScore.value
  if (s >= 80) return 'mobile-dash__score--good'
  if (s >= 50) return 'mobile-dash__score--warn'
  return 'mobile-dash__score--bad'
})

const scoreText = computed(() => {
  const s = performanceScore.value
  if (s >= 80) return 'Good performance'
  if (s >= 50) return 'Needs attention'
  return 'Poor performance'
})

function refreshMetrics() {
  const mem = (window.performance as any)?.memory
  
  if (mem) {
    const usedMB = Math.round(mem.usedJSHeapSize / 1024 / 1024)
    const totalMB = Math.round(mem.totalJSHeapSize / 1024 / 1024)
    const limitMB = Math.round(mem.jsHeapSizeLimit / 1024 / 1024)
    const pct = Math.round((usedMB / limitMB) * 100)
    
    memoryUsage.value = { used: usedMB, total: totalMB, percent: pct }
    jsHeap.value = `${usedMB} / ${limitMB} MB`
  } else {
    memoryUsage.value = { used: 0, total: 0, percent: 0 }
    jsHeap.value = 'Not available'
  }

  // DOM metrics
  const allNodes = document.querySelectorAll('*')
  domNodes.value = allNodes.length.toString()

  // Resources
  const perfEntries = performance.getEntriesByType('resource')
  resources.value = perfEntries.length.toString()

  // Calculate a rough performance score
  let score = 100
  if (memoryUsage.value.percent > 70) score -= 20
  if (memoryUsage.value.percent > 90) score -= 20
  if (parseInt(domNodes.value) > 1500) score -= 15
  if (parseInt(domNodes.value) > 3000) score -= 15
  if (perfEntries.length > 100) score -= 10
  
  performanceScore.value = Math.max(0, score)
  
  // JS event listeners (approximation)
  jsListeners.value = '~' + Math.floor(parseInt(domNodes.value) * 0.3)
}

let refreshInterval: number | null = null

onMounted(() => {
  refreshMetrics()
  refreshInterval = window.setInterval(refreshMetrics, 10000)
})

onUnmounted(() => {
  if (refreshInterval !== null) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────── */
.mobile-dash {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #060606);
}

.mobile-dash__content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
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
  border-radius: 12px;
  padding: 14px;
  border: 0.5px solid var(--gui-border-subtle, #38383A);
}

.mobile-dash__card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--gui-text-secondary, #8E8E93);
  font-size: 12px;
  margin-bottom: 8px;
}

.mobile-dash__card-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--gui-text-primary, #FFFFFF);
  margin-bottom: 8px;
}

.mobile-dash__score--good {
  color: #34C759;
}

.mobile-dash__score--warn {
  color: #FF9500;
}

.mobile-dash__score--bad {
  color: #FF3B30;
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
  background: var(--gui-accent, #007AFF);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.mobile-dash__card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--gui-text-tertiary, #636366);
}

/* ── Metrics ────────────────────────────────────────────────────────── */
.mobile-dash__metrics {
  background: var(--gui-bg-surface, #2C2C2E);
  border-radius: 12px;
  padding: 14px;
  border: 0.5px solid var(--gui-border-subtle, #38383A);
  margin-bottom: 16px;
}

.mobile-dash__metrics-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
  margin: 0 0 12px;
}

.mobile-dash__metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 0.5px solid var(--gui-border-subtle, #38383A);
}

.mobile-dash__metric-row:last-child {
  border-bottom: none;
}

.mobile-dash__metric-label {
  font-size: 13px;
  color: var(--gui-text-secondary, #8E8E93);
}

.mobile-dash__metric-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
}

/* ── Refresh Button ─────────────────────────────────────────────────── */
.mobile-dash__refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 44px;
  border-radius: 12px;
  border: none;
  background: var(--gui-accent, #007AFF);
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 150ms ease, transform 100ms ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-dash__refresh:active {
  opacity: 0.8;
  transform: scale(0.98);
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

.mobile-dash__card,
.mobile-dash__metrics {
  animation: dash-fade-in 300ms ease;
}
</style>
