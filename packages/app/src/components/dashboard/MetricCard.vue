<template>
  <div class="metric-card" :class="cardClass">
    <div class="metric-header">
      <div class="metric-icon-wrapper" :class="statusClass">
        <span class="metric-icon" v-html="icon" />
      </div>
      <div class="metric-info">
        <span class="metric-name">{{ name }}</span>
        <span v-if="unit" class="metric-unit">{{ unit }}</span>
      </div>
    </div>
    
    <div class="metric-value-container">
      <span class="metric-value" :class="valueClass">
        {{ displayValue }}
      </span>
      <span 
        v-if="showTrend" 
        class="metric-trend"
        :class="trendClass"
      >
        {{ trendIcon }}
      </span>
    </div>
    
    <div v-if="showMeta" class="metric-meta">
      <span class="metric-label">{{ metaLabel }}</span>
      <span class="metric-detail" :class="statusClass">{{ metaValue }}</span>
    </div>
    
    <div v-if="showProgress" class="metric-progress">
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
    
    <div v-if="footer" class="metric-footer">
      <svg class="footer-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
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
  type: 'memory' | 'time' | 'count' | 'custom' | 'fps'
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
    case 'fps':
      return `${props.value} FPS`
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
  if (tc === 'trend-up') return '↑'
  if (tc === 'trend-down') return '↓'
  return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>'
})

const cardClass = computed(() => ({
  [`type-${props.type}`]: true,
  [`status-${props.status}`]: Boolean(props.status)
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
  background: var(--gui-bg-surface, #2C2C2E);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-lg, 12px);
  padding: 18px;
  transition: transform 150ms cubic-bezier(0.2, 0.9, 0.3, 1.1),
              box-shadow 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
              border-color 150ms ease;
  position: relative;
  overflow: hidden;
  will-change: transform;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  opacity: 0;
  transition: opacity 200ms ease;
}

.metric-card:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: var(--gui-shadow-ios-card, 0 4px 16px rgba(0, 0, 0, 0.5));
  border-color: var(--gui-border-strong, rgba(255, 255, 255, 0.12));
}

.metric-card:hover::before {
  opacity: 1;
}

.metric-card:active {
  transform: scale(0.98);
}

.metric-card.status-poor {
  border-color: rgba(255, 59, 48, 0.2);
}

.metric-card.status-poor:hover {
  box-shadow: 0 4px 16px rgba(255, 59, 48, 0.15);
  border-color: rgba(255, 59, 48, 0.3);
}

.metric-card.status-good {
  border-color: rgba(52, 199, 89, 0.2);
}

.metric-card.status-good:hover {
  box-shadow: 0 4px 16px rgba(52, 199, 89, 0.15);
  border-color: rgba(52, 199, 89, 0.3);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.metric-icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--gui-radius-md, 10px);
  background: var(--gui-bg-surface-raised, #3A3A3C);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.metric-card:hover .metric-icon-wrapper {
  transform: scale(1.06);
}

.metric-icon-wrapper.status-good {
  background: var(--gui-success-bg, rgba(52, 199, 89, 0.12));
  border-color: rgba(52, 199, 89, 0.25);
}

.metric-icon-wrapper.status-medium {
  background: var(--gui-warning-bg, rgba(255, 204, 0, 0.1));
  border-color: rgba(255, 204, 0, 0.2);
}

.metric-icon-wrapper.status-poor {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.12));
  border-color: rgba(255, 59, 48, 0.25);
}

.metric-icon {
  display: flex;
  align-items: center;
  color: var(--gui-text-primary, #FFFFFF);
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
  letter-spacing: -0.01em;
}

.metric-unit {
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.metric-value-container {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--gui-text-primary, #FFFFFF);
  letter-spacing: -0.02em;
  transition: color 200ms ease;
  font-variant-numeric: tabular-nums;
}

.metric-value.value-good {
  color: var(--gui-success, #34C759);
}

.metric-value.value-medium {
  color: var(--gui-warning, #FFCC00);
}

.metric-value.value-poor {
  color: var(--gui-error, #FF3B30);
}

.metric-trend {
  font-size: 14px;
  opacity: 0.7;
  transition: opacity 150ms ease;
  display: flex;
  align-items: center;
}

.metric-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 10px;
  background: var(--gui-bg-surface-raised, #3A3A3C);
  border-radius: var(--gui-radius-sm, 6px);
}

.metric-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--gui-text-tertiary, #636366);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.metric-detail {
  font-size: 12px;
  font-weight: 600;
  color: var(--gui-text-secondary, #8E8E93);
  font-variant-numeric: tabular-nums;
  transition: color 200ms ease;
}

.metric-detail.status-good {
  color: var(--gui-success, #34C759);
}

.metric-detail.status-medium {
  color: var(--gui-warning, #FFCC00);
}

.metric-detail.status-poor {
  color: var(--gui-error, #FF3B30);
}

.metric-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bg {
  flex: 1;
  height: 4px;
  background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-full, 999px);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--gui-radius-full, 999px);
  position: relative;
  transition: width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  overflow: hidden;
}

.progress-fill.status-good {
  background: var(--gui-success, #34C759);
}

.progress-fill.status-medium {
  background: var(--gui-warning, #FFCC00);
}

.progress-fill.status-poor {
  background: var(--gui-error, #FF3B30);
}

.progress-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: progressShimmer 2s infinite;
}

@keyframes progressShimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--gui-text-secondary, #8E8E93);
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.metric-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.footer-icon {
  color: var(--gui-text-tertiary, #636366);
  opacity: 0.6;
  flex-shrink: 0;
}

.footer-text {
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
  line-height: 1.4;
}

/* Responsive */
@media (max-width: 768px) {
  .metric-card {
    padding: 14px;
  }

  .metric-icon-wrapper {
    width: 36px;
    height: 36px;
  }

  .metric-value {
    font-size: 24px;
  }

  .metric-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>