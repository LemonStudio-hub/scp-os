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
      <div v-if="isOpen" class="accent-picker-panel" :style="panelStyle" @mousedown.stop>
        <div class="accent-picker-panel__preview" :style="{ '--accent-color': normalizedColor }">
          <span class="accent-picker-panel__swatch" />
          <span class="accent-picker-panel__hex-label">{{ normalizedColor.toUpperCase() }}</span>
        </div>

        <div
          ref="tonePlane"
          class="accent-picker-panel__tone-plane"
          role="slider"
          tabindex="0"
          :aria-valuemin="0"
          :aria-valuemax="100"
          :aria-valuenow="Math.round(internalHsv.s * 100)"
          aria-label="Saturation and brightness"
          :style="{ '--hue-color': hueColor }"
          @pointerdown="startToneDrag"
          @keydown="onToneKeydown"
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
            :class="{ 'accent-picker-panel__input--invalid': hexInputInvalid }"
            :aria-invalid="hexInputInvalid"
            @input="onHexInput"
            @blur="onHexBlur"
          />
          <span v-if="hexInputInvalid" class="accent-picker-panel__error">Invalid hex color</span>
        </label>

        <div class="accent-picker-panel__hue">
          <span>Hue</span>
          <div
            ref="hueTrack"
            class="accent-picker-panel__hue-track"
            role="slider"
            tabindex="0"
            :aria-valuemin="0"
            :aria-valuemax="360"
            :aria-valuenow="internalHsv.h"
            aria-label="Hue"
            @pointerdown="startHueDrag"
            @keydown="onHueKeydown"
          >
            <div
              class="accent-picker-panel__hue-thumb"
              :style="{ left: `${(internalHsv.h / 360) * 100}%`, background: hueColor }"
            />
          </div>
        </div>

        <div class="accent-picker-panel__rgb-grid">
          <label
            v-for="channel in rgbChannels"
            :key="channel.key"
            class="accent-picker-panel__field"
          >
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
import { normalizeHex, hexToRgb, rgbToHex } from '../../utils/accentColor'

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

// Keep HSV independent so drag does not lose precision via RGB round-trips.
const internalHsv = ref({ h: 0, s: 0, v: 1 })
const hexInput = ref(normalizedColor.value.toUpperCase())
const hexInputInvalid = ref(false)

function syncHsvFromColor(color: string) {
  const c = hexToRgb(color)
  internalHsv.value = rgbToHsv(c.r, c.g, c.b)
}

// Sync HSV only from external modelValue (not while dragging).
watch(
  normalizedColor,
  (color) => {
    if (!isDragging) syncHsvFromColor(color)
    hexInput.value = color.toUpperCase()
  },
  { immediate: true }
)

const hueColor = computed(() => rgbToHex(hsvToRgb(internalHsv.value.h, 1, 1)))

const rgbChannels = computed(() => [
  { key: 'r' as const, label: 'R', value: rgb.value.r },
  { key: 'g' as const, label: 'G', value: rgb.value.g },
  { key: 'b' as const, label: 'B', value: rgb.value.b },
])

const PANEL_WIDTH = 280
const PANEL_HEIGHT = 320 // estimated height for flip-up placement

function computePanelStyle() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Prefer right-align; fall back to left if clipped.
  let right = vw - rect.right
  if (rect.right - PANEL_WIDTH < 0) right = vw - rect.left - PANEL_WIDTH

  // Prefer below trigger; flip above when space is tight.
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
  hexInputInvalid.value = !nextColor
  if (nextColor) {
    syncHsvFromColor(nextColor)
    emit('update:modelValue', nextColor)
  }
}

function onHexBlur() {
  const nextColor = normalizeHex(hexInput.value)
  if (nextColor) {
    hexInput.value = nextColor.toUpperCase()
    hexInputInvalid.value = false
  } else {
    hexInput.value = normalizedColor.value.toUpperCase()
    hexInputInvalid.value = false
  }
}

function onToneKeydown(event: KeyboardEvent) {
  const step = event.shiftKey ? 0.05 : 0.02
  let { s, v, h } = internalHsv.value
  if (event.key === 'ArrowRight') s = clamp(s + step, 0, 1)
  else if (event.key === 'ArrowLeft') s = clamp(s - step, 0, 1)
  else if (event.key === 'ArrowUp') v = clamp(v + step, 0, 1)
  else if (event.key === 'ArrowDown') v = clamp(v - step, 0, 1)
  else return
  event.preventDefault()
  internalHsv.value = { h, s, v }
  emit('update:modelValue', rgbToHex(hsvToRgb(h, s, v)))
}

function onHueKeydown(event: KeyboardEvent) {
  const step = event.shiftKey ? 10 : 2
  let { h, s, v } = internalHsv.value
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') h = (h + step) % 360
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') h = (h - step + 360) % 360
  else return
  event.preventDefault()
  internalHsv.value = { h, s, v }
  emit('update:modelValue', rgbToHex(hsvToRgb(h, s, v)))
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

function rgbToHsv(r: number, g: number, b: number) {
  const rd = r / 255,
    gd = g / 255,
    bd = b / 255
  const max = Math.max(rd, gd, bd),
    min = Math.min(rd, gd, bd)
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
  let r = 0,
    g = 0,
    b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
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
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
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
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
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
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)), #2c2c2e;
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
    linear-gradient(180deg, transparent, #000), linear-gradient(90deg, #fff, var(--hue-color));
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
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.35),
    0 2px 8px rgba(0, 0, 0, 0.35);
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
  font:
    600 13px ui-monospace,
    SFMono-Regular,
    Menlo,
    Consolas,
    monospace;
  text-align: center;
  outline: none;
  box-sizing: border-box;
}

.accent-picker-panel__field input:focus {
  border-color: var(--gui-accent, #8e8e93);
  box-shadow: 0 0 0 3px var(--gui-accent-soft, rgba(142, 142, 147, 0.16));
}

.accent-picker-panel__input--invalid {
  border-color: var(--gui-error, #ff3b30) !important;
  box-shadow: 0 0 0 2px rgba(255, 59, 48, 0.25);
}

.accent-picker-panel__error {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: var(--gui-error, #ff3b30);
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
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.3),
    0 2px 6px rgba(0, 0, 0, 0.4);
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
  transition:
    opacity 120ms ease,
    transform 120ms ease;
}

.accent-picker-panel-enter-from,
.accent-picker-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
