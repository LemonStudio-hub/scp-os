<template>
  <div class="admin-stat-card" :style="{ '--stat-color': color }">
    <div class="admin-stat-card__header">
      <span class="admin-stat-card__title">{{ title }}</span>
      <div class="admin-stat-card__icon">
        <svg v-if="icon === 'users'" width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M12 15V13.5C12 12.6716 11.3284 12 10.5 12H7.5C6.67157 12 6 12.6716 6 13.5V15M15 12.75C15 11.0924 13.6569 9.75 12 9.75C11.4823 9.75 11 9.86427 10.56 1.06589M7.44 1.06589C6.99997 0.864274 6.51772 0.75 6 0.75C4.34315 0.75 3 2.09315 3 3.75C3 5.40685 4.34315 6.75 6 6.75C6.51772 6.75 6.99997 6.86427 7.44 6.65789M9 6.75C10.6569 6.75 12 5.40685 12 3.75C12 2.09315 10.6569 0.75 9 0.75C7.34315 0.75 6 2.09315 6 3.75C6 5.40685 7.34315 6.75 9 6.75Z"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          />
        </svg>
        <svg v-else-if="icon === 'activity'" width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M1.5 9H4.5L6.75 4.5L9.75 13.5L12 9H15"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg v-else-if="icon === 'server'" width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect
            x="3"
            y="2"
            width="12"
            height="5"
            rx="1.5"
            stroke="currentColor"
            stroke-width="1.2"
          />
          <rect
            x="3"
            y="11"
            width="12"
            height="5"
            rx="1.5"
            stroke="currentColor"
            stroke-width="1.2"
          />
          <circle cx="6" cy="4.5" r="0.75" fill="currentColor" />
          <circle cx="6" cy="13.5" r="0.75" fill="currentColor" />
        </svg>
        <svg v-else-if="icon === 'shield'" width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 1.5L3 4.5V8.25C3 12.17 5.64 15.81 9 16.87C12.36 15.81 15 12.17 15 8.25V4.5L9 1.5Z"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 1.5V16.5M1.5 9H16.5"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          />
        </svg>
      </div>
    </div>
    <div class="admin-stat-card__value">{{ displayValue }}</div>
    <div v-if="trend !== undefined" class="admin-stat-card__trend" :class="trendClass">
      <svg v-if="trend >= 0" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M6 9V3M6 3L3 6M6 3L9 6"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M6 3V9M6 9L3 6M6 9L9 6"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>{{ Math.abs(trend) }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: string | number
  icon?: string
  trend?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: '',
  trend: undefined,
  color: '#E94560',
})

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})

const trendClass = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend >= 0 ? 'admin-stat-card__trend--up' : 'admin-stat-card__trend--down'
})
</script>

<style scoped>
.admin-stat-card {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 16px 20px;
  border-left: 3px solid var(--stat-color, #e94560);
  transition: border-color 200ms ease;
}

.admin-stat-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.admin-stat-card__title {
  font-size: 12px;
  font-weight: 500;
  color: #6a6a6a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.admin-stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--stat-color, #e94560) 12%, transparent);
  color: var(--stat-color, #e94560);
}

.admin-stat-card__value {
  font-size: 28px;
  font-weight: 700;
  color: #e0e0e0;
  line-height: 1.2;
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;
}

.admin-stat-card__trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
}

.admin-stat-card__trend--up {
  color: #34c759;
  background: rgba(52, 199, 89, 0.1);
}

.admin-stat-card__trend--down {
  color: #ff3b30;
  background: rgba(255, 59, 48, 0.1);
}
</style>
