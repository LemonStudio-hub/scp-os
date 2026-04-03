<template>
  <div class="metric-card" :class="cardClass">
    <div class="metric-header">
      <div class="metric-icon-wrapper" :class="statusClass">
        <span class="metric-icon" v-html="icon" />
      </div>
      <div class="metric-info">
        <span class="metric-name">{{ name }}</span>
        <span class="metric-unit" v-if="unit">{{ unit }}</span>
      </div>
    </div>
    
    <div class="metric-value-container">
      <span class="metric-value" :class="valueClass">
        {{ displayValue }}
      </span>
      <span 
        class="metric-trend" 
        :class="trendClass"
        v-if="showTrend"
      >
        {{ trendIcon }}
      </span>
    </div>
    
    <div class="metric-meta" v-if="showMeta">
      <span class="metric-label">{{ metaLabel }}</span>
      <span class="metric-detail" :class="statusClass">{{ metaValue }}</span>
    </div>
    
    <div class="metric-progress" v-if="showProgress">
      <div class="progress-bg">
        <div 
          class="progress-fill" 
          :class="statusClass"
          :style="{ width: `${progressValue}%` }"
        >
          <div class="progress-glow"></div>
        </div>
      </div>
      <span class="progress-text">{{ progressValue }}%</span>
    </div>
    
    <div class="metric-footer" v-if="footer">
      <span class="footer-icon">ℹ️</span>
      <span class="footer-text">{{ footer }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  icon: string
  name: string
  value: number | string
  unit?: string
  type: 'memory' | 'time' | 'count' | 'custom'
  progress?: number
  metaLabel?: string
  metaValue?: string | number
  footer?: string
  status?: 'good' | 'medium' | 'poor'
}>()

const displayValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  
  switch (props.type) {
    case 'memory':
      return formatBytes(props.value)
    case 'time':
      return formatTime(props.value)
    case 'count':
      return props.value.toLocaleString()
    default:
      return props.value.toString()
  }
})

const showProgress = computed(() => props.progress !== undefined)
const showMeta = computed(() => props.metaLabel && props.metaValue !== undefined)
const showTrend = computed(() => props.type === 'time')

const statusClass = computed(() => {
  if (props.status) return `status-${props.status}`
  
  if (showProgress.value) {
    const p = props.progress || 0
    if (p >= 80) return 'status-poor'
    if (p >= 60) return 'status-medium'
    return 'status-good'
  }
  
  return ''
})

const valueClass = computed(() => {
  if (props.status) return `value-${props.status}`
  if (props.type === 'time' && typeof props.value === 'number') {
    if (props.value >= 3000) return 'value-poor'
    if (props.value >= 1500) return 'value-medium'
  }
  return ''
})

const trendClass = computed(() => {
  if (typeof props.value !== 'number') return ''
  if (props.value >= 3000) return 'trend-down'
  if (props.value >= 1500) return 'trend-stable'
  return 'trend-up'
})

const trendIcon = computed(() => {
  const tc = trendClass.value
  if (tc === 'trend-up') return '📈'
  if (tc === 'trend-down') return '📉'
  return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>'
})

const cardClass = computed(() => ({
  [`type-${props.type}`]: true,
  [`status-${props.status}`]: !!props.status
}))

const metaValue = computed(() => {
  if (typeof props.metaValue === 'number') {
    return props.metaValue.toLocaleString()
  }
  return props.metaValue
})

const progressValue = computed(() => {
  if (typeof props.progress === 'number') {
    return Math.round(props.progress)
  }
  return 0
})

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}
</script>

<style scoped>
.metric-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%);
  border-radius: 14px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.15);
}

.metric-card:hover::before {
  opacity: 1;
}

.metric-card.status-poor {
  border-color: rgba(255, 68, 68, 0.3);
}

.metric-card.status-poor:hover {
  box-shadow: 0 8px 24px rgba(255, 68, 68, 0.2);
}

.metric-card.status-good {
  border-color: rgba(0, 255, 0, 0.3);
}

.metric-card.status-good:hover {
  box-shadow: 0 8px 24px rgba(0, 255, 0, 0.2);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.metric-icon-wrapper {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
}

.metric-card:hover .metric-icon-wrapper {
  transform: scale(1.05);
}

.metric-icon-wrapper.status-good {
  background: rgba(0, 255, 0, 0.1);
  border-color: rgba(0, 255, 0, 0.3);
  box-shadow: 0 0 12px rgba(0, 255, 0, 0.2);
}

.metric-icon-wrapper.status-medium {
  background: rgba(255, 255, 0, 0.1);
  border-color: rgba(255, 255, 0, 0.3);
  box-shadow: 0 0 12px rgba(255, 255, 0, 0.2);
}

.metric-icon-wrapper.status-poor {
  background: rgba(255, 68, 68, 0.1);
  border-color: rgba(255, 68, 68, 0.3);
  box-shadow: 0 0 12px rgba(255, 68, 68, 0.2);
}

.metric-icon {
  font-size: 22px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-name {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  opacity: 0.9;
  letter-spacing: 0.3px;
}

.metric-unit {
  font-size: 11px;
  color: #ffffff;
  opacity: 0.5;
  text-transform: uppercase;
}

.metric-value-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.metric-value {
  font-size: 26px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.metric-value.value-good {
  color: #00ff00;
  text-shadow: 0 2px 8px rgba(0, 255, 0, 0.4);
}

.metric-value.value-medium {
  color: #ffff00;
  text-shadow: 0 2px 8px rgba(255, 255, 0, 0.4);
}

.metric-value.value-poor {
  color: #ff4444;
  text-shadow: 0 2px 8px rgba(255, 68, 68, 0.4);
}

.metric-trend {
  font-size: 16px;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.metric-trend.trend-up {
  filter: drop-shadow(0 0 4px rgba(0, 255, 0, 0.4));
}

.metric-trend.trend-down {
  filter: drop-shadow(0 0 4px rgba(255, 68, 68, 0.4));
}

.metric-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.metric-label {
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-detail {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  transition: all 0.3s ease;
}

.metric-detail.status-good {
  color: #00ff00;
}

.metric-detail.status-medium {
  color: #ffff00;
}

.metric-detail.status-poor {
  color: #ff4444;
}

.metric-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bg {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  position: relative;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.progress-fill.status-good {
  background: linear-gradient(90deg, #00cc00, #00ff00);
  box-shadow: 0 0 12px rgba(0, 255, 0, 0.4);
}

.progress-fill.status-medium {
  background: linear-gradient(90deg, #cccc00, #ffff00);
  box-shadow: 0 0 12px rgba(255, 255, 0, 0.4);
}

.progress-fill.status-poor {
  background: linear-gradient(90deg, #cc0000, #ff4444);
  box-shadow: 0 0 12px rgba(255, 68, 68, 0.4);
}

.progress-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: progressShimmer 2s infinite;
}

@keyframes progressShimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-text {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  min-width: 36px;
  text-align: right;
}

.metric-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-icon {
  font-size: 14px;
  opacity: 0.6;
}

.footer-text {
  font-size: 11px;
  color: #ffffff;
  opacity: 0.5;
  font-style: italic;
}

/* Responsive design */
@media (max-width: 768px) {
  .metric-card {
    padding: 16px;
  }

  .metric-icon-wrapper {
    width: 38px;
    height: 38px;
  }

  .metric-icon {
    font-size: 18px;
  }

  .metric-value {
    font-size: 22px;
  }

  .metric-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>