<template>
  <div class="accent-picker">
    <div class="accent-picker__presets" aria-label="Preset accent colors">
      <button
        v-for="color in presets"
        :key="color"
        type="button"
        class="accent-picker__preset"
        :class="{ 'accent-picker__preset--active': normalizedColor === color.toLowerCase() }"
        :style="{ '--preset-color': color }"
        :aria-label="`Use ${color}`"
        @click="selectColor(color)"
      />
    </div>

    <div class="accent-picker__custom">
      <button
        ref="triggerRef"
        type="button"
        class="accent-picker__trigger"
        :class="{ 'accent-picker__trigger--open': isOpen }"
        :style="{ '--accent-color': normalizedColor }"
        :aria-expanded="isOpen"
        aria-label="Open custom color picker"
        @click="togglePanel"
      >
        <span class="accent-picker__trigger-swatch" />
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="accent-picker-panel">
      <div
        v-if="isOpen"
        class="accent-picker-panel"
        :style="panelStyle"
        @mousedown.stop
      >
        <div class="accent-picker-panel__preview" :style="{ '--accent-color': normalizedColor }">
          <span class="accent-picker-panel__swatch" />
          <span class="accent-picker-panel__hex-label">{{ normalizedColor.toUpperCase() }}</span>
        </div>

        <div
          ref="tonePlane"
          class="accent-picker-panel__tone-plane"
          :style="{ '--hue-color': hueColor }"
          @pointerdown="startToneDrag"
        >
          <span
            class="accent-picker-panel__tone-thumb"
            :style="{ left: `${internalHsv.s * 100}%`, top: `${(1 - internalHsv.v) * 100}%` }"
          />
        </div>

        <label class="accent-picker-panel__field accent-picker-panel__field--hex">
          <span>HEX</span>
          <input
            :value="hexInput"
            maxlength="7"
            spellcheck="false"
            @input="onHexInput"
            @blur="hexInput = normalizedColor.toUpperCase()"
          />
        </label>

        <div class="accent-picker-panel__hue">
          <span>Hue</span>
          <div
            ref="hueTrack"
            class="accent-picker-panel__hue-track"
            @pointerdown="startHueDrag"
          >
            <div
              class="accent-picker-panel__hue-thumb"
              :style="{ left: `${(internalHsv.h / 360) * 100}%`, background: hueColor }"
            />
          </div>
        </div>

        <div class="accent-picker-panel__rgb-grid">
          <label v-for="channel in rgbChannels" :key="channel.key" class="accent-picker-panel__field">
            <span>{{ channel.label }}</span>
            <input
              type="number"
              min="0"
              max="255"
              :value="channel.value"
              @input="onRgbInput(channel.key, $event)"
            />
          </label>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string | null
  presets: string[]
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

type RgbChannel = 'r' | 'g' | 'b'

const fallbackColor = '#0063d1'
const isOpen = ref(false)
const tonePlane = ref<HTMLElement | null>(null)
const hueTrack = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
let tonePlaneRect: DOMRect | null = null
let hueTrackRect: DOMRect | null = null
let isDragging = false
const panelStyle = ref<Record<string, string>>({})

const normalizedColor = computed(() => normalizeHex(props.modelValue) || fallbackColor)
const rgb = computed(() => hexToRgb(normalizedColor.value))

// 独立维护 HSV 状态，避免拖拽时 RGB→HSV 反推造成信息丢失
const internalHsv = ref({ h: 0, s: 0, v: 1 })
const hexInput = ref(normalizedColor.value.toUpperCase())

function syncHsvFromColor(color: string) {
  const c = hexToRgb(color)
  internalHsv.value = rgbToHsv(c.r, c.g, c.b)
}

// 只有外部 modelValue 变化（非拖拽触发）时才同步
watch(normalizedColor, (color) => {
  if (!isDragging) syncHsvFromColor(color)
  hexInput.value = color.toUpperCase()
}, { immediate: true })

const hueColor = computed(() => rgbToHex(hsvToRgb(internalHsv.value.h, 1, 1)))

const rgbChannels = computed(() => [
  { key: 'r' as const, label: 'R', value: rgb.value.r },
  { key: 'g' as const, label: 'G', value: rgb.value.g },
  { key: 'b' as const, label: 'B', value: rgb.value.b },
])

const PANEL_WIDTH = 280
const PANEL_HEIGHT = 320 // 估算高度，用于判断是否需要向上弹出

function computePanelStyle() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  // 水平：优先右对齐触发按钮，若超出左边界则左对齐
  let right = vw - rect.right
  if (rect.right - PANEL_WIDTH < 0) right = vw - rect.left - PANEL_WIDTH

  // 垂直：优先向下，若下方空间不足则向上弹出
  const spaceBelow = vh - rect.bottom - 10
  let top: string
  if (spaceBelow >= PANEL_HEIGHT) {
    top = `${rect.bottom + 10}px`
  } else {
    top = `${Math.max(8, rect.top - PANEL_HEIGHT - 10)}px`
  }

  panelStyle.value = {
    position: 'fixed',
    top,
    right: `${right}px`,
    width: `${PANEL_WIDTH}px`,
    zIndex: '999998',
  }
}

function togglePanel() {
  if (!isOpen.value) {
    computePanelStyle()
  }
  isOpen.value = !isOpen.value
}

function closePanel() {
  isOpen.value = false
}

function onDocumentClick(e: MouseEvent) {
  if (!isOpen.value) return
  const target = e.target as Node
  if (triggerRef.value?.contains(target)) return
  closePanel()
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentClick)
  stopToneDrag()
})

function selectColor(color: string) {
  const nextColor = normalizeHex(color)
  if (nextColor) emit('update:modelValue', nextColor)
}

function onHexInput(event: Event) {
  const value = (event.target as HTMLInputElement).value.trim()
  hexInput.value = value
  const nextColor = normalizeHex(value)
  if (nextColor) {
    syncHsvFromColor(nextColor)
    emit('update:modelValue', nextColor)
  }
}

function onRgbInput(channel: RgbChannel, event: Event) {
  const value = clamp(Number((event.target as HTMLInputElement).value), 0, 255)
  const nextRgb = { ...rgb.value, [channel]: value }
  const nextColor = rgbToHex(nextRgb)
  syncHsvFromColor(nextColor)
  emit('update:modelValue', nextColor)
}

function startHueDrag(event: PointerEvent) {
  event.preventDefault()
  isDragging = true
  hueTrackRect = hueTrack.value?.getBoundingClientRect() ?? null
  updateHueFromPointer(event)
  window.addEventListener('pointermove', updateHueFromPointer)
  window.addEventListener('pointerup', stopHueDrag)
  window.addEventListener('pointercancel', stopHueDrag)
}

function stopHueDrag() {
  isDragging = false
  hueTrackRect = null
  window.removeEventListener('pointermove', updateHueFromPointer)
  window.removeEventListener('pointerup', stopHueDrag)
  window.removeEventListener('pointercancel', stopHueDrag)
}

function updateHueFromPointer(event: PointerEvent) {
  const rect = hueTrackRect ?? hueTrack.value?.getBoundingClientRect()
  if (!rect) return
  const h = Math.round(clamp((event.clientX - rect.left) / rect.width, 0, 1) * 360)
  internalHsv.value = { ...internalHsv.value, h }
  emit('update:modelValue', rgbToHex(hsvToRgb(h, internalHsv.value.s, internalHsv.value.v)))
}

function startToneDrag(event: PointerEvent) {
  event.preventDefault()
  isDragging = true
  tonePlaneRect = tonePlane.value?.getBoundingClientRect() ?? null
  updateToneFromPointer(event)
  window.addEventListener('pointermove', updateToneFromPointer)
  window.addEventListener('pointerup', stopToneDrag)
  window.addEventListener('pointercancel', stopToneDrag)
}

function stopToneDrag() {
  isDragging = false
  tonePlaneRect = null
  window.removeEventListener('pointermove', updateToneFromPointer)
  window.removeEventListener('pointerup', stopToneDrag)
  window.removeEventListener('pointercancel', stopToneDrag)
}

onBeforeUnmount(stopHueDrag)

function updateToneFromPointer(event: PointerEvent) {
  const rect = tonePlaneRect ?? tonePlane.value?.getBoundingClientRect()
  if (!rect) return
  const s = clamp((event.clientX - rect.left) / rect.width, 0, 1)
  const v = 1 - clamp((event.clientY - rect.top) / rect.height, 0, 1)
  internalHsv.value = { ...internalHsv.value, s, v }
  emit('update:modelValue', rgbToHex(hsvToRgb(internalHsv.value.h, s, v)))
}

function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  const expanded = /^#?[0-9a-fA-F]{3}$/.test(trimmed)
    ? trimmed.replace('#', '').split('').map((c) => c + c).join('')
    : trimmed.replace('#', '')
  return /^[0-9a-fA-F]{6}$/.test(expanded) ? `#${expanded.toLowerCase()}` : null
}

function hexToRgb(hex: string) {
  const v = hex.replace('#', '')
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  }
}

function rgbToHex(color: { r: number; g: number; b: number }) {
  return `#${[color.r, color.g, color.b]
    .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`
}

function rgbToHsv(r: number, g: number, b: number) {
  const rd = r / 255, gd = g / 255, bd = b / 255
  const max = Math.max(rd, gd, bd), min = Math.min(rd, gd, bd)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === rd) h = ((gd - bd) / delta) % 6
    else if (max === gd) h = (bd - rd) / delta + 2
    else h = (rd - gd) / delta + 4
  }
  h = Math.round(h * 60)
  if (h < 0) h += 360
  return { h, s: max === 0 ? 0 : delta / max, v: max }
}

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
}
</script>

<style scoped>
.accent-picker {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.accent-picker__presets {
  display: flex;
  align-items: center;
  gap: 6px;
}

.accent-picker__preset {
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.12));
  border-radius: 999px;
  background: var(--preset-color);
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
  transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
}

.accent-picker__preset:hover {
  transform: translateY(-1px);
}

.accent-picker__preset--active {
  border-color: var(--gui-text-primary, #ffffff);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.24),
    0 0 0 2px var(--gui-accent-soft, rgba(142, 142, 147, 0.16));
}

.accent-picker__custom {
  position: relative;
}

.accent-picker__trigger {
  position: relative;
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.12));
  border-radius: 8px;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #ffffff);
  cursor: pointer;
  overflow: hidden;
  transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
}

.accent-picker__trigger:hover,
.accent-picker__trigger--open {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 22%, transparent);
}

.accent-picker__trigger:active {
  transform: scale(0.96);
}

.accent-picker__trigger-swatch {
  position: absolute;
  inset: 3px;
  border-radius: 6px;
  background: var(--accent-color);
  opacity: 0.9;
}

.accent-picker__trigger svg {
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55));
}
</style>

<style>
/* Teleport 到 body，不能用 scoped */
.accent-picker-panel {
  box-sizing: border-box;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
    #2c2c2e;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

.accent-picker-panel__preview {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.accent-picker-panel__swatch {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  background: var(--accent-color);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
}

.accent-picker-panel__hex-label {
  color: #ffffff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  font-weight: 600;
}

.accent-picker-panel__tone-plane {
  position: relative;
  height: 128px;
  margin-bottom: 12px;
  border-radius: 10px;
  background:
    linear-gradient(180deg, transparent, #000),
    linear-gradient(90deg, #fff, var(--hue-color));
  cursor: crosshair;
  touch-action: none;
  user-select: none;
}

.accent-picker-panel__tone-thumb {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2px solid #ffffff;
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.35);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.accent-picker-panel__field,
.accent-picker-panel__hue {
  display: grid;
  gap: 6px;
  color: #8e8e93;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.accent-picker-panel__field input {
  width: 100%;
  min-width: 0;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #1c1c1e;
  color: #ffffff;
  font: 600 13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  text-align: center;
  outline: none;
  box-sizing: border-box;
}

.accent-picker-panel__field input:focus {
  border-color: var(--gui-accent, #8e8e93);
  box-shadow: 0 0 0 3px var(--gui-accent-soft, rgba(142, 142, 147, 0.16));
}

.accent-picker-panel__field--hex {
  margin-bottom: 10px;
}

.accent-picker-panel__hue {
  margin-bottom: 12px;
}

.accent-picker-panel__hue-track {
  position: relative;
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000);
  cursor: crosshair;
  touch-action: none;
  user-select: none;
}

.accent-picker-panel__hue-thumb {
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.4);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.accent-picker-panel__rgb-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

/* 进入/离开动画 */
.accent-picker-panel-enter-active,
.accent-picker-panel-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}

.accent-picker-panel-enter-from,
.accent-picker-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
