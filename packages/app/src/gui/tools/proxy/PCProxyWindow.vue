<template>
  <SCPWindow :window-instance="windowInstance" @close="onClose">
    <div class="proxy-window">
      <div class="proxy-window__header">
        <div class="proxy-window__header-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span class="proxy-window__header-title">{{ t('app.proxy') }}</span>
        <div class="proxy-window__header-badge" :class="statusBadgeClass">{{ statusBadgeText }}</div>
        <div v-if="store.isDownloading" class="proxy-window__header-speed">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          {{ formatSpeed(store.currentSpeed) }}
        </div>
      </div>

      <div class="proxy-window__body">
        <div v-if="store.error && !store.isDownloading" class="proxy-window__alert proxy-window__alert--error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span>{{ store.error }}</span>
          <button class="proxy-window__alert-close" @click="store.clearError()">&times;</button>
        </div>

        <div v-if="!store.isDownloading && store.downloadProgress?.status !== 'completed'" class="proxy-window__input-section">
          <div class="proxy-window__input-group">
            <label class="proxy-window__label">URL</label>
            <div class="proxy-window__input-row">
              <input
                v-model="downloadUrl"
                type="url"
                placeholder="https://example.com/file.zip"
                class="proxy-window__input proxy-window__input--url"
                @keyup.enter="startDownload()"
              />
              <button
                class="proxy-window__btn proxy-window__btn--primary"
                :disabled="!downloadUrl.trim()"
                @click="startDownload()"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>下载</span>
              </button>
            </div>
          </div>

          <button class="proxy-window__toggle-advanced" @click="showAdvanced = !showAdvanced">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: showAdvanced ? 'rotate(90deg)' : '' }">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            高级选项
          </button>

          <transition name="proxy-slide">
            <div v-if="showAdvanced" class="proxy-window__advanced">
              <div class="proxy-window__input-group">
                <label class="proxy-window__label">文件名</label>
                <input v-model="customFilename" type="text" placeholder="自动识别" class="proxy-window__input" />
              </div>
              <div class="proxy-window__input-group">
                <label class="proxy-window__label">速率限制 (KB/s)</label>
                <input v-model.number="rateLimitKBps" type="number" min="0" max="51200" placeholder="0 = 不限" class="proxy-window__input proxy-window__input--small" />
              </div>
            </div>
          </transition>
        </div>

        <div v-if="store.downloadProgress && store.isDownloading" class="proxy-window__progress-section">
          <div class="proxy-window__progress-card">
            <div class="proxy-window__progress-header">
              <div class="proxy-window__progress-file">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span class="proxy-window__progress-filename">{{ store.downloadProgress.filename }}</span>
              </div>
              <div class="proxy-window__progress-peak">
                <span class="proxy-window__stat-label">峰值</span>
                <span class="proxy-window__stat-value proxy-window__stat-value--green">{{ formatSpeed(store.peakSpeed) }}</span>
              </div>
            </div>

            <div class="proxy-window__progress-bar-track">
              <div
                class="proxy-window__progress-bar-fill"
                :style="{ width: `${Math.min(100, store.currentProgress)}%` }"
              >
                <div class="proxy-window__progress-bar-shimmer" />
              </div>
              <template v-if="store.downloadProgress.totalBytes > 0">
                <div
                  class="proxy-window__progress-milestone"
                  v-for="milestone in milestones"
                  :key="milestone"
                  :style="{ left: `${milestone}%` }"
                />
              </template>
            </div>

            <div class="proxy-window__progress-stats-grid">
              <div class="proxy-window__stat-item">
                <span class="proxy-window__stat-label">已下载</span>
                <span class="proxy-window__stat-value">
                  {{ formatBytes(store.downloadProgress.downloadedBytes) }}
                  <template v-if="store.downloadProgress.totalBytes > 0">
                    / {{ formatBytes(store.downloadProgress.totalBytes) }}
                  </template>
                </span>
              </div>
              <div class="proxy-window__stat-item">
                <span class="proxy-window__stat-label">进度</span>
                <span class="proxy-window__stat-value proxy-window__stat-value--blue">{{ Math.min(100, store.currentProgress) }}%</span>
              </div>
              <div class="proxy-window__stat-item">
                <span class="proxy-window__stat-label">当前速度</span>
                <span class="proxy-window__stat-value proxy-window__stat-value--green">{{ formatSpeed(store.currentSpeed) }}</span>
              </div>
              <div class="proxy-window__stat-item">
                <span class="proxy-window__stat-label">预计剩余</span>
                <span class="proxy-window__stat-value">{{ etaDisplay }}</span>
              </div>
              <div class="proxy-window__stat-item">
                <span class="proxy-window__stat-label">已耗时</span>
                <span class="proxy-window__stat-value">{{ elapsedDisplay }}</span>
              </div>
              <div class="proxy-window__stat-item">
                <span class="proxy-window__stat-label">平均速度</span>
                <span class="proxy-window__stat-value">{{ avgSpeedDisplay }}</span>
              </div>
            </div>

            <div class="proxy-window__sparkline-section">
              <div class="proxy-window__sparkline-header">
                <span class="proxy-window__sparkline-title">实时速度</span>
                <div class="proxy-window__sparkline-legend">
                  <span class="proxy-window__legend-dot proxy-window__legend-dot--current" />
                  <span>当前</span>
                  <span class="proxy-window__legend-dot proxy-window__legend-dot--avg" />
                  <span>平均</span>
                </div>
              </div>
              <svg class="proxy-window__sparkline" :viewBox="`0 0 ${sparklineWidth} ${sparklineHeight}`" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3fb950" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#3fb950" stop-opacity="0.02"/>
                  </linearGradient>
                  <linearGradient id="avgLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#58a6ff" stop-opacity="0.5"/>
                    <stop offset="100%" stop-color="#58a6ff" stop-opacity="0.2"/>
                  </linearGradient>
                </defs>
                <path :d="sparklineAreaPath" fill="url(#speedGradient)" />
                <path :d="sparklineLinePath" fill="none" stroke="#3fb950" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <line
                  v-if="avgSpeedLineY !== null"
                  :x1="0"
                  :y1="avgSpeedLineY"
                  :x2="sparklineWidth"
                  :y2="avgSpeedLineY"
                  stroke="url(#avgLineGradient)"
                  stroke-width="1"
                  stroke-dasharray="4 3"
                />
              </svg>
            </div>

            <div class="proxy-window__progress-actions">
              <button class="proxy-window__btn proxy-window__btn--danger proxy-window__btn--full" @click="cancel()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                取消下载
              </button>
            </div>
          </div>
        </div>

        <div v-if="store.downloadProgress?.status === 'completed' && !store.isDownloading" class="proxy-window__success-section">
          <div class="proxy-window__success-card">
            <div class="proxy-window__success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="proxy-window__success-info">
              <p class="proxy-window__success-title">下载完成</p>
              <p class="proxy-window__success-detail">
                {{ store.downloadProgress.filename }} &middot;
                {{ formatBytes(store.downloadProgress.totalBytes || store.downloadProgress.downloadedBytes) }}
              </p>
            </div>
            <div class="proxy-window__success-stats">
              <div class="proxy-window__success-stat">
                <span class="proxy-window__success-stat-label">耗时</span>
                <span class="proxy-window__success-stat-value">{{ successDuration }}</span>
              </div>
              <div class="proxy-window__success-stat">
                <span class="proxy-window__success-stat-label">平均速度</span>
                <span class="proxy-window__success-stat-value">{{ successAvgSpeed }}</span>
              </div>
            </div>
            <button class="proxy-window__btn proxy-window__btn--primary proxy-window__btn--sm" @click="reset()">
              新下载
            </button>
          </div>
        </div>

        <div v-if="history.length > 0" class="proxy-window__stats-section">
          <div class="proxy-window__section-header">
            <h3 class="proxy-window__section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              数据统计
            </h3>
          </div>
          <div class="proxy-window__stats-grid">
            <div class="proxy-window__stat-card">
              <div class="proxy-window__stat-card-icon proxy-window__stat-card-icon--blue">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </div>
              <div class="proxy-window__stat-card-content">
                <span class="proxy-window__stat-card-value">{{ store.downloadStats.totalDownloads }}</span>
                <span class="proxy-window__stat-card-label">总下载</span>
              </div>
            </div>
            <div class="proxy-window__stat-card">
              <div class="proxy-window__stat-card-icon proxy-window__stat-card-icon--green">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="proxy-window__stat-card-content">
                <span class="proxy-window__stat-card-value">{{ store.downloadStats.completedDownloads }}</span>
                <span class="proxy-window__stat-card-label">已完成</span>
              </div>
            </div>
            <div class="proxy-window__stat-card">
              <div class="proxy-window__stat-card-icon proxy-window__stat-card-icon--yellow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              </div>
              <div class="proxy-window__stat-card-content">
                <span class="proxy-window__stat-card-value">{{ store.downloadStats.cancelledDownloads }}</span>
                <span class="proxy-window__stat-card-label">已取消</span>
              </div>
            </div>
            <div class="proxy-window__stat-card">
              <div class="proxy-window__stat-card-icon proxy-window__stat-card-icon--purple">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <div class="proxy-window__stat-card-content">
                <span class="proxy-window__stat-card-value">{{ formatBytes(store.downloadStats.totalBytesDownloaded) }}</span>
                <span class="proxy-window__stat-card-label">总流量</span>
              </div>
            </div>
            <div class="proxy-window__stat-card proxy-window__stat-card--wide">
              <div class="proxy-window__stat-card-icon proxy-window__stat-card-icon--green">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div class="proxy-window__stat-card-content">
                <span class="proxy-window__stat-card-value">{{ formatSpeed(store.downloadStats.averageSpeed) }}</span>
                <span class="proxy-window__stat-card-label">平均速度</span>
              </div>
            </div>
            <div class="proxy-window__stat-card">
              <div class="proxy-window__stat-card-icon proxy-window__stat-card-icon--orange">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <div class="proxy-window__stat-card-content">
                <span class="proxy-window__stat-card-value">{{ store.downloadStats.successRate }}%</span>
                <span class="proxy-window__stat-card-label">成功率</span>
              </div>
            </div>
          </div>
        </div>

        <div class="proxy-window__history-section">
          <div class="proxy-window__section-header">
            <h3 class="proxy-window__section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              历史记录
            </h3>
            <button v-if="history.length > 0" class="proxy-window__btn proxy-window__btn--ghost proxy-window__btn--xs" @click="store.fetchHistory(20, 0)">刷新</button>
          </div>

          <div v-if="store.isLoadingHistory" class="proxy-window__loading">
            <div class="proxy-window__spinner" />
          </div>

          <div v-else-if="history.length === 0" class="proxy-window__empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
            <span>暂无下载记录</span>
          </div>

          <div v-else class="proxy-window__history-list">
            <div v-for="item in history" :key="item.id" class="proxy-window__history-item">
              <div class="proxy-window__history-icon" :class="`proxy-window__history-icon--${item.status}`">
                <svg v-if="item.status === 'completed'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                <svg v-else-if="item.status === 'failed'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              </div>
              <div class="proxy-window__history-info">
                <span class="proxy-window__history-name">{{ item.filename }}</span>
                <div class="proxy-window__history-meta">
                  <span :class="`proxy-window__history-status proxy-window__history-status--${item.status}`">{{ statusLabel(item.status) }}</span>
                  <span>{{ formatBytes(item.totalBytes || item.downloadedBytes) }}</span>
                  <span>{{ formatTimeAgo(item.createdAt) }}</span>
                </div>
                <div v-if="item.status === 'completed' && item.completedAt" class="proxy-window__history-bar">
                  <div class="proxy-window__history-bar-fill" />
                </div>
              </div>
              <button class="proxy-window__history-delete" title="删除" @click="store.deleteHistoryItem(item.id)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <button
              v-if="store.historyTotal > history.length"
              class="proxy-window__btn proxy-window__btn--ghost proxy-window__btn--full"
              @click="store.fetchHistory(Math.min(100, store.historyTotal), history.length)"
            >
              加载更多 ({{ store.historyTotal - history.length }})
            </button>
          </div>
        </div>
      </div>
    </div>
  </SCPWindow>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect, onMounted, onUnmounted } from 'vue'
import SCPWindow from '../../components/SCPWindow.vue'
import { useDownload } from '../../../composables/useDownload'
import { useI18n } from '../../composables/useI18n'
import type { WindowInstance } from '../../types'

interface Props {
  windowInstance: WindowInstance
}

defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const {
  downloadUrl,
  customFilename,
  rateLimitKBps,
  showAdvanced,
  store,
  startDownload,
  cancel,
  reset,
  formatBytes,
  formatSpeed,
  formatTimeAgo,
  formatDuration,
  formatETA,
  calcETA,
} = useDownload()

const history = computed(() => store.history)

const sparklineWidth = 300
const sparklineHeight = 48
const sparklinePadding = 4

const milestones = computed(() => {
  const total = store.downloadProgress?.totalBytes || 0
  if (total <= 0) return []
  return [25, 50, 75].filter(m => m < 100)
})

const elapsedSeconds = ref(0)
let elapsedInterval: ReturnType<typeof setInterval> | null = null

const elapsedDisplay = computed(() => {
  return formatDuration(elapsedSeconds.value * 1000)
})

const etaDisplay = computed(() => {
  const prog = store.downloadProgress
  if (!prog) return '--'
  const eta = calcETA(prog.downloadedBytes, prog.totalBytes, store.currentSpeed)
  return formatETA(eta)
})

const avgSpeedDisplay = computed(() => {
  if (elapsedSeconds.value <= 0) return '--'
  const totalBytes = store.downloadProgress?.downloadedBytes || 0
  const avg = totalBytes / elapsedSeconds.value
  return formatSpeed(Math.round(avg))
})

const successDuration = computed(() => {
  const prog = store.downloadProgress
  if (!prog?.startTime || !prog?.endTime) return '--'
  return formatDuration(prog.endTime - prog.startTime)
})

const successAvgSpeed = computed(() => {
  const prog = store.downloadProgress
  if (!prog?.startTime || !prog?.endTime || !prog.totalBytes) return '--'
  const duration = (prog.endTime - prog.startTime) / 1000
  if (duration <= 0) return '--'
  return formatSpeed(Math.round(prog.totalBytes / duration))
})

const sparklineLinePath = computed(() => {
  const samples = store.recentSpeedHistory
  if (samples.length < 2) return ''

  const maxSpeed = Math.max(...samples.map(s => s.speed), 1)
  const xStep = (sparklineWidth - sparklinePadding * 2) / Math.max(samples.length - 1, 1)

  const points = samples.map((s, i) => {
    const x = sparklinePadding + i * xStep
    const y = sparklineHeight - sparklinePadding - (s.speed / maxSpeed) * (sparklineHeight - sparklinePadding * 2)
    return `${x},${y}`
  })

  return `M${points.join(' L')}`
})

const sparklineAreaPath = computed(() => {
  const samples = store.recentSpeedHistory
  if (samples.length < 2) return ''

  const maxSpeed = Math.max(...samples.map(s => s.speed), 1)
  const xStep = (sparklineWidth - sparklinePadding * 2) / Math.max(samples.length - 1, 1)

  const points = samples.map((s, i) => {
    const x = sparklinePadding + i * xStep
    const y = sparklineHeight - sparklinePadding - (s.speed / maxSpeed) * (sparklineHeight - sparklinePadding * 2)
    return `${x},${y}`
  })

  const lastX = sparklinePadding + (samples.length - 1) * xStep
  const firstX = sparklinePadding
  return `M${firstX},${sparklineHeight - sparklinePadding} L${points.join(' L')} L${lastX},${sparklineHeight - sparklinePadding} Z`
})

const avgSpeedLineY = computed(() => {
  const samples = store.recentSpeedHistory
  if (samples.length < 2) return null
  const avg = samples.reduce((sum, s) => sum + s.speed, 0) / samples.length
  const maxSpeed = Math.max(...samples.map(s => s.speed), 1)
  return sparklineHeight - sparklinePadding - (avg / maxSpeed) * (sparklineHeight - sparklinePadding * 2)
})

const statusBadgeClass = computed(() => {
  if (store.isDownloading) return 'proxy-window__header-badge--active'
  if (store.downloadProgress?.status === 'completed') return 'proxy-window__header-badge--success'
  if (store.downloadProgress?.status === 'failed') return 'proxy-window__header-badge--error'
  return 'proxy-window__header-badge--idle'
})

const statusBadgeText = computed(() => {
  if (store.isDownloading) return '传输中'
  if (store.downloadProgress?.status === 'completed') return '完成'
  if (store.downloadProgress?.status === 'failed') return '失败'
  return '就绪'
})

function statusLabel(status: string): string {
  switch (status) {
    case 'completed': return '已完成'
    case 'failed': return '失败'
    case 'cancelled': return '已取消'
    default: return status
  }
}

function startElapsedTimer() {
  elapsedSeconds.value = 0
  elapsedInterval = setInterval(() => {
    if (store.downloadProgress?.startTime) {
      elapsedSeconds.value = Math.floor((Date.now() - store.downloadProgress.startTime) / 1000)
    }
  }, 1000)
}

function stopElapsedTimer() {
  if (elapsedInterval) {
    clearInterval(elapsedInterval)
    elapsedInterval = null
  }
}

function onClose() {
  stopElapsedTimer()
  emit('close')
}

watchEffect(() => {
  if (store.isDownloading) {
    startElapsedTimer()
  } else {
    stopElapsedTimer()
  }
})

onMounted(() => {
  store.fetchHistory(20, 0)
})

onUnmounted(() => {
  stopElapsedTimer()
})
</script>

<style scoped>
.proxy-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0d1117;
  color: #c9d1d9;
  font-size: 13px;
  overflow: hidden;
}

.proxy-window__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #161b22 0%, #1a2233 100%);
  border-bottom: 1px solid #21262d;
}

.proxy-window__header-icon {
  color: #58a6ff;
  display: flex;
  align-items: center;
}

.proxy-window__header-title {
  font-weight: 600;
  font-size: 13px;
  color: #e6edf3;
}

.proxy-window__header-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.proxy-window__header-badge--idle { background: #21262d; color: #8b949e; }
.proxy-window__header-badge--active { background: rgba(56, 139, 253, 0.15); color: #58a6ff; animation: proxy-pulse 2s ease-in-out infinite; }
.proxy-window__header-badge--success { background: rgba(46, 160, 67, 0.15); color: #3fb950; }
.proxy-window__header-badge--error { background: rgba(248, 81, 73, 0.15); color: #f85149; }

.proxy-window__header-speed {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #3fb950;
  font-family: 'SF Mono', 'Cascadia Code', monospace;
  font-weight: 500;
}

@keyframes proxy-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.proxy-window__body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
}

.proxy-window__alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 14px;
  font-size: 12px;
}

.proxy-window__alert--error {
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid rgba(248, 81, 73, 0.3);
  color: #f85149;
}

.proxy-window__alert-close {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  opacity: 0.6;
}

.proxy-window__alert-close:hover { opacity: 1; }

.proxy-window__input-section { margin-bottom: 16px; }

.proxy-window__input-group { margin-bottom: 8px; }

.proxy-window__label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.proxy-window__input-row { display: flex; gap: 8px; }

.proxy-window__input {
  flex: 1;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 8px 12px;
  color: #c9d1d9;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.proxy-window__input:focus {
  border-color: #58a6ff;
  box-shadow: 0 0 0 3px rgba(56, 139, 253, 0.1);
}

.proxy-window__input::placeholder { color: #484f58; }

.proxy-window__input--url { font-family: 'SF Mono', 'Cascadia Code', monospace; font-size: 12px; }

.proxy-window__input--small { max-width: 140px; }

.proxy-window__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.proxy-window__btn--primary {
  background: linear-gradient(135deg, #238636 0%, #2ea043 100%);
  color: #fff;
}

.proxy-window__btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2ea043 0%, #3fb950 100%);
  box-shadow: 0 2px 8px rgba(46, 160, 67, 0.3);
}

.proxy-window__btn--primary:disabled { opacity: 0.4; cursor: not-allowed; }

.proxy-window__btn--danger {
  background: rgba(248, 81, 73, 0.1);
  color: #f85149;
  border: 1px solid rgba(248, 81, 73, 0.3);
}

.proxy-window__btn--danger:hover { background: rgba(248, 81, 73, 0.2); }

.proxy-window__btn--ghost {
  background: transparent;
  color: #8b949e;
  border: 1px solid #30363d;
}

.proxy-window__btn--ghost:hover { background: #21262d; color: #c9d1d9; }

.proxy-window__btn--xs { padding: 3px 8px; font-size: 11px; }
.proxy-window__btn--sm { padding: 6px 12px; }
.proxy-window__btn--full { width: 100%; justify-content: center; margin-top: 10px; }

.proxy-window__toggle-advanced {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #8b949e;
  font-size: 11px;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.15s;
}

.proxy-window__toggle-advanced:hover { color: #c9d1d9; }
.proxy-window__toggle-advanced svg { transition: transform 0.2s; }

.proxy-window__advanced {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  padding: 12px;
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 8px;
}

.proxy-slide-enter-active, .proxy-slide-leave-active { transition: all 0.2s ease; overflow: hidden; }
.proxy-slide-enter-from, .proxy-slide-leave-to { opacity: 0; max-height: 0; margin-top: 0; }
.proxy-slide-enter-to, .proxy-slide-leave-from { opacity: 1; max-height: 120px; }

.proxy-window__progress-section { margin-bottom: 16px; }

.proxy-window__progress-card {
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 10px;
  padding: 14px;
}

.proxy-window__progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.proxy-window__progress-file {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #58a6ff;
  min-width: 0;
  flex: 1;
}

.proxy-window__progress-filename {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
}

.proxy-window__progress-peak {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.proxy-window__progress-bar-track {
  height: 8px;
  background: #21262d;
  border-radius: 4px;
  overflow: visible;
  margin-bottom: 12px;
  position: relative;
}

.proxy-window__progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #238636, #3fb950);
  position: relative;
  transition: width 0.3s ease;
  min-width: 2%;
}

.proxy-window__progress-bar-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
  animation: proxy-shimmer 2s ease-in-out infinite;
}

@keyframes proxy-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.proxy-window__progress-milestone {
  position: absolute;
  top: -2px;
  width: 2px;
  height: 12px;
  background: #484f58;
  border-radius: 1px;
  transform: translateX(-50%);
}

.proxy-window__progress-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.proxy-window__stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.proxy-window__stat-label {
  font-size: 10px;
  color: #484f58;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.proxy-window__stat-value {
  font-size: 13px;
  font-weight: 500;
  color: #c9d1d9;
  font-family: 'SF Mono', 'Cascadia Code', monospace;
}

.proxy-window__stat-value--green { color: #3fb950; }
.proxy-window__stat-value--blue { color: #58a6ff; }

.proxy-window__sparkline-section {
  background: #0d1117;
  border: 1px solid #21262d;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 12px;
}

.proxy-window__sparkline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.proxy-window__sparkline-title {
  font-size: 11px;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.proxy-window__sparkline-legend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #484f58;
}

.proxy-window__legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.proxy-window__legend-dot--current { background: #3fb950; }
.proxy-window__legend-dot--avg { background: #58a6ff; opacity: 0.6; }

.proxy-window__sparkline {
  width: 100%;
  height: 48px;
  display: block;
}

.proxy-window__progress-actions { }

.proxy-window__success-section { margin-bottom: 16px; }

.proxy-window__success-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: rgba(46, 160, 67, 0.06);
  border: 1px solid rgba(46, 160, 67, 0.2);
  border-radius: 10px;
}

.proxy-window__success-icon { color: #3fb950; flex-shrink: 0; }
.proxy-window__success-info { flex: 1; min-width: 0; }
.proxy-window__success-title { font-weight: 600; font-size: 14px; color: #3fb950; margin: 0; }
.proxy-window__success-detail { font-size: 12px; color: #8b949e; margin: 2px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.proxy-window__success-stats {
  display: flex;
  gap: 16px;
}

.proxy-window__success-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.proxy-window__success-stat-label { font-size: 10px; color: #484f58; }
.proxy-window__success-stat-value { font-size: 12px; font-weight: 500; color: #3fb950; font-family: 'SF Mono', monospace; }

.proxy-window__stats-section { margin-bottom: 16px; }

.proxy-window__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.proxy-window__section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.proxy-window__stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.proxy-window__stat-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 8px;
}

.proxy-window__stat-card--wide { grid-column: span 2; }

.proxy-window__stat-card-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.proxy-window__stat-card-icon--blue { background: rgba(56, 139, 253, 0.12); color: #58a6ff; }
.proxy-window__stat-card-icon--green { background: rgba(46, 160, 67, 0.12); color: #3fb950; }
.proxy-window__stat-card-icon--yellow { background: rgba(210, 153, 34, 0.12); color: #d29922; }
.proxy-window__stat-card-icon--purple { background: rgba(163, 113, 247, 0.12); color: #a371f7; }
.proxy-window__stat-card-icon--orange { background: rgba(210, 153, 34, 0.12); color: #e3b341; }

.proxy-window__stat-card-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.proxy-window__stat-card-value {
  font-size: 14px;
  font-weight: 600;
  color: #e6edf3;
  font-family: 'SF Mono', 'Cascadia Code', monospace;
}

.proxy-window__stat-card-label {
  font-size: 10px;
  color: #484f58;
}

.proxy-window__history-section {
  border-top: 1px solid #21262d;
  padding-top: 14px;
}

.proxy-window__loading { display: flex; justify-content: center; padding: 20px; }

.proxy-window__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #30363d;
  border-top-color: #58a6ff;
  border-radius: 50%;
  animation: proxy-spin 0.8s linear infinite;
}

@keyframes proxy-spin { to { transform: rotate(360deg); } }

.proxy-window__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: #484f58;
  font-size: 12px;
}

.proxy-window__history-list { display: flex; flex-direction: column; gap: 4px; }

.proxy-window__history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #161b22;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all 0.15s;
}

.proxy-window__history-item:hover { border-color: #30363d; background: #1c2129; }

.proxy-window__history-icon {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.proxy-window__history-icon--completed { background: rgba(46, 160, 67, 0.12); color: #3fb950; }
.proxy-window__history-icon--failed { background: rgba(248, 81, 73, 0.12); color: #f85149; }
.proxy-window__history-icon--cancelled { background: rgba(210, 153, 34, 0.12); color: #d29922; }

.proxy-window__history-info { flex: 1; min-width: 0; }

.proxy-window__history-name {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #c9d1d9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.proxy-window__history-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #484f58;
  margin-top: 2px;
}

.proxy-window__history-status { font-weight: 500; }
.proxy-window__history-status--completed { color: #3fb950; }
.proxy-window__history-status--failed { color: #f85149; }
.proxy-window__history-status--cancelled { color: #d29922; }

.proxy-window__history-bar {
  height: 2px;
  background: #21262d;
  border-radius: 1px;
  margin-top: 4px;
  overflow: hidden;
}

.proxy-window__history-bar-fill {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #238636, #3fb950);
  border-radius: 1px;
}

.proxy-window__history-delete {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #484f58;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  opacity: 0;
}

.proxy-window__history-item:hover .proxy-window__history-delete { opacity: 1; }
.proxy-window__history-delete:hover { background: rgba(248, 81, 73, 0.1); color: #f85149; }
</style>
