<template>
  <div ref="containerRef" class="admin-trend-chart">
    <svg
      :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
      :width="svgWidth"
      :height="svgHeight"
      class="admin-trend-chart__svg"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
    >
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="0.3" />
          <stop offset="100%" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>

      <g v-for="(y, i) in gridYPositions" :key="`grid-${i}`">
        <line
          :x1="padding.left"
          :y1="y"
          :x2="svgWidth - padding.right"
          :y2="y"
          stroke="#2a2a2a"
          stroke-width="0.5"
        />
        <text :x="padding.left - 8" :y="y + 4" text-anchor="end" fill="#4a4a4a" font-size="10">
          {{ gridLabels[i] }}
        </text>
      </g>

      <path v-if="areaPath" :d="areaPath" :fill="`url(#${gradientId})`" />

      <path
        v-if="linePath"
        :d="linePath"
        :stroke="color"
        stroke-width="2"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <circle
        v-for="(point, i) in points"
        :key="`dot-${i}`"
        :cx="point.x"
        :cy="point.y"
        r="2.5"
        :fill="color"
        :opacity="hoverIndex === i ? 1 : 0"
        class="admin-trend-chart__dot"
      />

      <line
        v-if="hoverIndex !== null && points[hoverIndex]"
        :x1="points[hoverIndex].x"
        :y1="padding.top"
        :x2="points[hoverIndex].x"
        :y2="svgHeight - padding.bottom"
        stroke="#2a2a2a"
        stroke-width="1"
        stroke-dasharray="4 2"
      />
    </svg>

    <div
      v-if="hoverIndex !== null && tooltipPos"
      class="admin-trend-chart__tooltip"
      :style="{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }"
    >
      <div class="admin-trend-chart__tooltip-date">{{ data[hoverIndex].date }}</div>
      <div class="admin-trend-chart__tooltip-value">
        {{ data[hoverIndex].value.toLocaleString() }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

interface DataPoint {
  date: string
  value: number
}

interface Props {
  data: DataPoint[]
  height?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: 200,
  color: '#3b82f6',
})

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(300)
const hoverIndex = ref<number | null>(null)

const gradientId = `trend-grad-${Math.random().toString(36).slice(2, 9)}`

const padding = { top: 20, right: 20, bottom: 30, left: 50 }
const gridLineCount = 4

const svgWidth = computed(() => containerWidth.value)
const svgHeight = computed(() => props.height)

const chartWidth = computed(() => svgWidth.value - padding.left - padding.right)
const chartHeight = computed(() => svgHeight.value - padding.top - padding.bottom)

const maxValue = computed(() => {
  if (props.data.length === 0) return 100
  const max = Math.max(...props.data.map((d) => d.value))
  return Math.ceil((max * 1.1) / 10) * 10 || 100
})

const minValue = computed(() => {
  if (props.data.length === 0) return 0
  const min = Math.min(...props.data.map((d) => d.value))
  return Math.max(0, Math.floor((min * 0.9) / 10) * 10)
})

const gridYPositions = computed(() => {
  const positions: number[] = []
  for (let i = 0; i <= gridLineCount; i++) {
    const y = padding.top + (chartHeight.value / gridLineCount) * i
    positions.push(y)
  }
  return positions
})

const gridLabels = computed(() => {
  const labels: string[] = []
  const range = maxValue.value - minValue.value
  for (let i = 0; i <= gridLineCount; i++) {
    const val = maxValue.value - (range / gridLineCount) * i
    labels.push(Math.round(val).toLocaleString())
  }
  return labels
})

const points = computed(() => {
  if (props.data.length === 0) return []
  const range = maxValue.value - minValue.value || 1
  return props.data.map((d, i) => ({
    x: padding.left + (i / Math.max(props.data.length - 1, 1)) * chartWidth.value,
    y: padding.top + chartHeight.value - ((d.value - minValue.value) / range) * chartHeight.value,
  }))
})

function bezierPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let path = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return path
}

const linePath = computed(() => {
  if (points.value.length < 2) return ''
  return bezierPath(points.value)
})

const areaPath = computed(() => {
  if (points.value.length < 2) return ''
  const bp = bezierPath(points.value)
  const bottom = svgHeight.value - padding.bottom
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  return `${bp} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`
})

const tooltipPos = computed(() => {
  if (hoverIndex.value === null || !points.value[hoverIndex.value]) return null
  const pt = points.value[hoverIndex.value]
  return {
    x: pt.x,
    y: pt.y - 40,
  }
})

function onMouseMove(event: MouseEvent) {
  if (!containerRef.value || props.data.length === 0) return
  const rect = containerRef.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const chartStart = padding.left
  const chartEnd = svgWidth.value - padding.right
  const relX = mouseX - chartStart
  const totalWidth = chartEnd - chartStart
  const index = Math.round((relX / totalWidth) * (props.data.length - 1))
  if (index >= 0 && index < props.data.length) {
    hoverIndex.value = index
  } else {
    hoverIndex.value = null
  }
}

function onMouseLeave() {
  hoverIndex.value = null
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.offsetWidth
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

watch(containerRef, (el, oldEl) => {
  if (oldEl) resizeObserver?.unobserve(oldEl)
  if (el) {
    containerWidth.value = el.offsetWidth
    resizeObserver?.observe(el)
  }
})
</script>

<style scoped>
.admin-trend-chart {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.admin-trend-chart__svg {
  display: block;
  width: 100%;
  height: auto;
}

.admin-trend-chart__dot {
  transition: opacity 150ms ease;
}

.admin-trend-chart__tooltip {
  position: absolute;
  transform: translateX(-50%);
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  padding: 6px 10px;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  z-index: 10;
}

.admin-trend-chart__tooltip-date {
  font-size: 10px;
  color: #6a6a6a;
  margin-bottom: 2px;
}

.admin-trend-chart__tooltip-value {
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
}
</style>
