<template>
  <div class="mobile-proxy">
    <div class="mobile-proxy__header">
      <div class="mobile-proxy__header-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <h2 class="mobile-proxy__header-title">{{ t('app.proxy') }}</h2>
      <div v-if="store.isDownloading" class="mobile-proxy__header-speed">
        {{ formatSpeed(store.currentSpeed) }}
      </div>
    </div>

    <div class="mobile-proxy__body">
      <div v-if="store.error && !store.isDownloading" class="mobile-proxy__alert mobile-proxy__alert--error">
        <span>{{ store.error }}</span>
        <button @click="store.clearError()">&times;</button>
      </div>

      <div v-if="!store.isDownloading && store.downloadProgress?.status !== 'completed'" class="mobile-proxy__input-area">
        <div class="mobile-proxy__input-wrap">
          <input
            v-model="downloadUrl"
            type="url"
            placeholder="输入下载链接..."
            class="mobile-proxy__input"
            @keyup.enter="startDownload()"
          />
          <button
            class="mobile-proxy__download-btn"
            :disabled="!downloadUrl.trim()"
            @click="startDownload()"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>

        <button class="mobile-proxy__advanced-toggle" @click="showAdvanced = !showAdvanced">
          {{ showAdvanced ? '收起选项' : '高级选项' }}
        </button>

        <div v-if="showAdvanced" class="mobile-proxy__advanced">
          <input v-model="customFilename" type="text" placeholder="自定义文件名" class="mobile-proxy__input mobile-proxy__input--sub" />
          <input v-model.number="rateLimitKBps" type="number" min="0" placeholder="速率限制 KB/s" class="mobile-proxy__input mobile-proxy__input--sub" />
        </div>
      </div>

      <div v-if="store.downloadProgress && store.isDownloading" class="mobile-proxy__downloading">
        <div class="mobile-proxy__dl-card">
          <div class="mobile-proxy__dl-header">
            <span class="mobile-proxy__dl-name">{{ store.downloadProgress.filename }}</span>
            <span class="mobile-proxy__dl-peak">峰值: {{ formatSpeed(store.peakSpeed) }}</span>
          </div>

          <div class="mobile-proxy__dl-bar-track">
            <div class="mobile-proxy__dl-bar-fill" :style="{ width: `${Math.min(100, store.currentProgress)}%` }" />
          </div>

          <div class="mobile-proxy__dl-grid">
            <div class="mobile-proxy__dl-stat">
              <span class="mobile-proxy__dl-stat-label">已下载</span>
              <span class="mobile-proxy__dl-stat-value">
                {{ formatBytes(store.downloadProgress.downloadedBytes) }}
                <template v-if="store.downloadProgress.totalBytes > 0">/ {{ formatBytes(store.downloadProgress.totalBytes) }}</template>
              </span>
            </div>
            <div class="mobile-proxy__dl-stat">
              <span class="mobile-proxy__dl-stat-label">进度</span>
              <span class="mobile-proxy__dl-stat-value mobile-proxy__dl-stat-value--blue">{{ Math.min(100, store.currentProgress) }}%</span>
            </div>
            <div class="mobile-proxy__dl-stat">
              <span class="mobile-proxy__dl-stat-label">速度</span>
              <span class="mobile-proxy__dl-stat-value mobile-proxy__dl-stat-value--green">{{ formatSpeed(store.currentSpeed) }}</span>
            </div>
            <div class="mobile-proxy__dl-stat">
              <span class="mobile-proxy__dl-stat-label">剩余</span>
              <span class="mobile-proxy__dl-stat-value">{{ etaDisplay }}</span>
            </div>
          </div>

          <div v-if="store.recentSpeedHistory.length > 1" class="mobile-proxy__sparkline-wrap">
            <svg class="mobile-proxy__sparkline" viewBox="0 0 280 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="mSpeedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#3fb950" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#3fb950" stop-opacity="0.02"/>
                </linearGradient>
              </defs>
              <path :d="mSparklineArea" fill="url(#mSpeedGrad)" />
              <path :d="mSparklineLine" fill="none" stroke="#3fb950" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </div>

          <button class="mobile-proxy__cancel-btn" @click="cancel()">取消下载</button>
        </div>
      </div>

      <div v-if="store.downloadProgress?.status === 'completed' && !store.isDownloading" class="mobile-proxy__done">
        <div class="mobile-proxy__done-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <p class="mobile-proxy__done-text">下载完成</p>
        <p class="mobile-proxy__done-detail">{{ store.downloadProgress.filename }}</p>
        <div class="mobile-proxy__done-stats">
          <span>{{ formatBytes(store.downloadProgress.totalBytes || store.downloadProgress.downloadedBytes) }}</span>
          <span v-if="store.downloadProgress.startTime && store.downloadProgress.endTime">{{ formatDuration(store.downloadProgress.endTime - store.downloadProgress.startTime) }}</span>
        </div>
        <button class="mobile-proxy__new-btn" @click="reset()">新下载</button>
      </div>

      <div v-if="history.length > 0" class="mobile-proxy__stats-bar">
        <div class="mobile-proxy__stats-chip">
          <span class="mobile-proxy__stats-chip-label">总下载</span>
          <span class="mobile-proxy__stats-chip-value">{{ store.downloadStats.totalDownloads }}</span>
        </div>
        <div class="mobile-proxy__stats-chip mobile-proxy__stats-chip--green">
          <span class="mobile-proxy__stats-chip-label">成功</span>
          <span class="mobile-proxy__stats-chip-value">{{ store.downloadStats.completedDownloads }}</span>
        </div>
        <div class="mobile-proxy__stats-chip mobile-proxy__stats-chip--purple">
          <span class="mobile-proxy__stats-chip-label">总流量</span>
          <span class="mobile-proxy__stats-chip-value">{{ formatBytes(store.downloadStats.totalBytesDownloaded) }}</span>
        </div>
        <div class="mobile-proxy__stats-chip mobile-proxy__stats-chip--blue">
          <span class="mobile-proxy__stats-chip-label">均速</span>
          <span class="mobile-proxy__stats-chip-value">{{ formatSpeed(store.downloadStats.averageSpeed) }}</span>
        </div>
      </div>

      <div class="mobile-proxy__history">
        <div class="mobile-proxy__history-header">
          <span>历史记录</span>
          <button v-if="history.length > 0" @click="store.fetchHistory(20, 0)">刷新</button>
        </div>

        <div v-if="store.isLoadingHistory" class="mobile-proxy__loading">
          <div class="mobile-proxy__spinner" />
        </div>

        <div v-else-if="history.length === 0" class="mobile-proxy__empty">暂无记录</div>

        <div v-else class="mobile-proxy__history-list">
          <div v-for="item in history" :key="item.id" class="mobile-proxy__history-item" @click="store.deleteHistoryItem(item.id)">
            <div class="mobile-proxy__history-dot" :class="`mobile-proxy__history-dot--${item.status}`" />
            <div class="mobile-proxy__history-info">
              <span class="mobile-proxy__history-name">{{ item.filename }}</span>
              <span class="mobile-proxy__history-meta">
                <span :class="`mobile-proxy__history-status--${item.status}`">{{ statusLabel(item.status) }}</span>
                &middot; {{ formatBytes(item.totalBytes || item.downloadedBytes) }}
                &middot; {{ formatTimeAgo(item.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect, onMounted } from 'vue'
import { useDownload } from '../../../composables/useDownload'
import { useI18n } from '../../composables/useI18n'

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

const elapsedSeconds = ref(0)
let elapsedInterval: ReturnType<typeof setInterval> | null = null

const etaDisplay = computed(() => {
  const prog = store.downloadProgress
  if (!prog) return '--'
  return formatETA(calcETA(prog.downloadedBytes, prog.totalBytes, store.currentSpeed))
})

watchEffect(() => {
  if (store.isDownloading) {
    elapsedSeconds.value = 0
    elapsedInterval = setInterval(() => {
      if (store.downloadProgress?.startTime) {
        elapsedSeconds.value = Math.floor((Date.now() - store.downloadProgress.startTime) / 1000)
      }
    }, 1000)
  } else {
    if (elapsedInterval) {
      clearInterval(elapsedInterval)
      elapsedInterval = null
    }
  }
})

const mSparklineArea = computed(() => {
  const samples = store.recentSpeedHistory
  if (samples.length < 2) return ''
  const W = 280, H = 40, P = 3
  const maxS = Math.max(...samples.map(s => s.speed), 1)
  const step = (W - P * 2) / Math.max(samples.length - 1, 1)
  const pts = samples.map((s, i) => {
    const x = P + i * step
    const y = H - P - (s.speed / maxS) * (H - P * 2)
    return `${x},${y}`
  })
  const lastX = P + (samples.length - 1) * step
  return `M${P},${H - P} L${pts.join(' L')} L${lastX},${H - P} Z`
})

const mSparklineLine = computed(() => {
  const samples = store.recentSpeedHistory
  if (samples.length < 2) return ''
  const W = 280, H = 40, P = 3
  const maxS = Math.max(...samples.map(s => s.speed), 1)
  const step = (W - P * 2) / Math.max(samples.length - 1, 1)
  const pts = samples.map((s, i) => {
    const x = P + i * step
    const y = H - P - (s.speed / maxS) * (H - P * 2)
    return `${x},${y}`
  })
  return `M${pts.join(' L')}`
})

function statusLabel(status: string): string {
  switch (status) {
    case 'completed': return '完成'
    case 'failed': return '失败'
    case 'cancelled': return '取消'
    default: return status
  }
}

onMounted(() => {
  store.fetchHistory(20, 0)
})
</script>

<style scoped>
.mobile-proxy {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0d1117;
  color: #c9d1d9;
  font-size: 14px;
}

.mobile-proxy__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #161b22, #1a2233);
  border-bottom: 1px solid #21262d;
}

.mobile-proxy__header-icon { color: #58a6ff; }
.mobile-proxy__header-title { font-size: 16px; font-weight: 600; margin: 0; }
.mobile-proxy__header-speed {
  margin-left: auto;
  font-size: 12px;
  color: #3fb950;
  font-family: 'SF Mono', monospace;
  font-weight: 500;
}

.mobile-proxy__body { flex: 1; overflow-y: auto; padding: 16px; }

.mobile-proxy__alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 14px;
  font-size: 13px;
}

.mobile-proxy__alert--error {
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid rgba(248, 81, 73, 0.3);
  color: #f85149;
}

.mobile-proxy__alert button {
  background: none;
  border: none;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
}

.mobile-proxy__input-area { margin-bottom: 20px; }

.mobile-proxy__input-wrap { display: flex; gap: 8px; margin-bottom: 8px; }

.mobile-proxy__input {
  flex: 1;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 10px;
  padding: 12px 14px;
  color: #c9d1d9;
  font-size: 14px;
  outline: none;
}

.mobile-proxy__input:focus { border-color: #58a6ff; }
.mobile-proxy__input::placeholder { color: #484f58; }
.mobile-proxy__input--sub { font-size: 13px; padding: 10px 12px; margin-bottom: 6px; }

.mobile-proxy__download-btn {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #238636, #3fb950);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mobile-proxy__download-btn:disabled { opacity: 0.4; }

.mobile-proxy__advanced-toggle {
  background: none;
  border: none;
  color: #58a6ff;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;
}

.mobile-proxy__advanced {
  margin-top: 8px;
  padding: 12px;
  background: #161b22;
  border-radius: 10px;
  border: 1px solid #21262d;
}

.mobile-proxy__downloading { margin-bottom: 20px; }

.mobile-proxy__dl-card {
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 12px;
  padding: 16px;
}

.mobile-proxy__dl-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.mobile-proxy__dl-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.mobile-proxy__dl-peak {
  font-size: 11px;
  color: #8b949e;
  flex-shrink: 0;
}

.mobile-proxy__dl-bar-track {
  height: 6px;
  background: #21262d;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
}

.mobile-proxy__dl-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #238636, #3fb950);
  border-radius: 3px;
  transition: width 0.3s;
  min-width: 2%;
}

.mobile-proxy__dl-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.mobile-proxy__dl-stat { display: flex; flex-direction: column; gap: 2px; }

.mobile-proxy__dl-stat-label { font-size: 10px; color: #484f58; text-transform: uppercase; }
.mobile-proxy__dl-stat-value { font-size: 13px; font-weight: 500; color: #c9d1d9; font-family: 'SF Mono', monospace; }
.mobile-proxy__dl-stat-value--green { color: #3fb950; }
.mobile-proxy__dl-stat-value--blue { color: #58a6ff; }

.mobile-proxy__sparkline-wrap {
  background: #0d1117;
  border: 1px solid #21262d;
  border-radius: 6px;
  padding: 6px;
  margin-bottom: 12px;
}

.mobile-proxy__sparkline { width: 100%; height: 40px; display: block; }

.mobile-proxy__cancel-btn {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(248, 81, 73, 0.3);
  background: rgba(248, 81, 73, 0.1);
  color: #f85149;
  font-size: 13px;
  cursor: pointer;
}

.mobile-proxy__done {
  text-align: center;
  padding: 24px 16px;
  margin-bottom: 20px;
  background: rgba(46, 160, 67, 0.06);
  border: 1px solid rgba(46, 160, 67, 0.2);
  border-radius: 12px;
}

.mobile-proxy__done-icon { color: #3fb950; margin-bottom: 8px; }
.mobile-proxy__done-text { font-size: 16px; font-weight: 600; color: #3fb950; margin: 0 0 4px; }
.mobile-proxy__done-detail { font-size: 12px; color: #8b949e; margin: 0 0 8px; }

.mobile-proxy__done-stats {
  display: flex;
  justify-content: center;
  gap: 12px;
  font-size: 12px;
  color: #8b949e;
  margin-bottom: 14px;
}

.mobile-proxy__new-btn {
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #238636, #3fb950);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.mobile-proxy__stats-bar {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  margin-bottom: 16px;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.mobile-proxy__stats-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 8px;
  flex-shrink: 0;
}

.mobile-proxy__stats-chip-label { font-size: 10px; color: #484f58; text-transform: uppercase; }
.mobile-proxy__stats-chip-value { font-size: 13px; font-weight: 600; color: #c9d1d9; font-family: 'SF Mono', monospace; }
.mobile-proxy__stats-chip--green .mobile-proxy__stats-chip-value { color: #3fb950; }
.mobile-proxy__stats-chip--purple .mobile-proxy__stats-chip-value { color: #a371f7; }
.mobile-proxy__stats-chip--blue .mobile-proxy__stats-chip-value { color: #58a6ff; }

.mobile-proxy__history { border-top: 1px solid #21262d; padding-top: 16px; }

.mobile-proxy__history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #8b949e;
}

.mobile-proxy__history-header button {
  background: none;
  border: none;
  color: #58a6ff;
  font-size: 12px;
  cursor: pointer;
}

.mobile-proxy__loading { display: flex; justify-content: center; padding: 20px; }

.mobile-proxy__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #30363d;
  border-top-color: #58a6ff;
  border-radius: 50%;
  animation: mproxy-spin 0.8s linear infinite;
}

@keyframes mproxy-spin { to { transform: rotate(360deg); } }

.mobile-proxy__empty { text-align: center; padding: 20px; color: #484f58; font-size: 13px; }

.mobile-proxy__history-list { display: flex; flex-direction: column; gap: 6px; }

.mobile-proxy__history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #161b22;
  border-radius: 10px;
}

.mobile-proxy__history-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.mobile-proxy__history-dot--completed { background: #3fb950; }
.mobile-proxy__history-dot--failed { background: #f85149; }
.mobile-proxy__history-dot--cancelled { background: #d29922; }

.mobile-proxy__history-info { flex: 1; min-width: 0; }
.mobile-proxy__history-name { display: block; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mobile-proxy__history-meta { display: block; font-size: 11px; color: #484f58; margin-top: 2px; }

.mobile-proxy__history-status--completed { color: #3fb950; }
.mobile-proxy__history-status--failed { color: #f85149; }
.mobile-proxy__history-status--cancelled { color: #d29922; }
</style>
