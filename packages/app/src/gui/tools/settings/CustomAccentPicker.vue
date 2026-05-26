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
        type="button"
        class="accent-picker__trigger"
        :class="{ 'accent-picker__trigger--open': isOpen }"
        :style="{ '--accent-color': normalizedColor }"
        :aria-expanded="isOpen"
        aria-label="Open custom color picker"
        @click="isOpen = !isOpen"
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

      <Transition name="accent-picker-panel">
        <div v-if="isOpen" class="accent-picker__panel">
          <div class="accent-picker__preview" :style="{ '--accent-color': normalizedColor }">
            <span class="accent-picker__preview-swatch" />
            <span class="accent-picker__preview-text">{{ normalizedColor.toUpperCase() }}</span>
          </div>

          <div
            ref="tonePlane"
            class="accent-picker__tone-plane"
            :style="{ '--hue-color': hueColor }"
            @pointerdown="startToneDrag"
          >
            <span
              class="accent-picker__tone-thumb"
              :style="{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }"
            />
          </div>

          <label class="accent-picker__field accent-picker__field--hex">
            <span>HEX</span>
            <input
              :value="hexInput"
              maxlength="7"
              spellcheck="false"
              @input="onHexInput"
              @blur="hexInput = normalizedColor.toUpperCase()"
            />
          </label>

          <label class="accent-picker__hue">
            <span>Hue</span>
            <input type="range" min="0" max="360" :value="Math.round(hsv.h)" @input="onHueInput" />
          </label>

          <div class="accent-picker__rgb-grid">
            <label v-for="channel in rgbChannels" :key="channel.key" class="accent-picker__field">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

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

const normalizedColor = computed(() => normalizeHex(props.modelValue) || fallbackColor)
const rgb = computed(() => hexToRgb(normalizedColor.value))
const hsv = computed(() => rgbToHsv(rgb.value.r, rgb.value.g, rgb.value.b))
const hueColor = computed(() => rgbToHex(hsvToRgb(hsv.value.h, 1, 1)))
const hexInput = ref(normalizedColor.value.toUpperCase())

const rgbChannels = computed(() => [
  { key: 'r' as const, label: 'R', value: rgb.value.r },
  { key: 'g' as const, label: 'G', value: rgb.value.g },
  { key: 'b' as const, label: 'B', value: rgb.value.b },
])

watch(normalizedColor, (color) => {
  hexInput.value = color.toUpperCase()
})

function selectColor(color: string) {
  const nextColor = normalizeHex(color)
  if (nextColor) emit('update:modelValue', nextColor)
}

function onHexInput(event: Event) {
  const value = (event.target as HTMLInputElement).value.trim()
  hexInput.value = value
  const nextColor = normalizeHex(value)
  if (nextColor) emit('update:modelValue', nextColor)
}

function onHueInput(event: Event) {
  const nextHue = Number((event.target as HTMLInputElement).value)
  const nextRgb = hsvToRgb(nextHue, hsv.value.s, hsv.value.v)
  emit('update:modelValue', rgbToHex(nextRgb))
}

function onRgbInput(channel: RgbChannel, event: Event) {
  const value = clamp(Number((event.target as HTMLInputElement).value), 0, 255)
  emit(
    'update:modelValue',
    rgbToHex({
      ...rgb.value,
      [channel]: value,
    })
  )
}

function startToneDrag(event: PointerEvent) {
  event.preventDefault()
  updateToneFromPointer(event)
  window.addEventListener('pointermove', updateToneFromPointer)
  window.addEventListener('pointerup', stopToneDrag)
  window.addEventListener('pointercancel', stopToneDrag)
}

function stopToneDrag() {
  window.removeEventListener('pointermove', updateToneFromPointer)
  window.removeEventListener('pointerup', stopToneDrag)
  window.removeEventListener('pointercancel', stopToneDrag)
}

function updateToneFromPointer(event: PointerEvent) {
  if (!tonePlane.value) return
  const rect = tonePlane.value.getBoundingClientRect()
  const saturation = clamp((event.clientX - rect.left) / rect.width, 0, 1)
  const value = 1 - clamp((event.clientY - rect.top) / rect.height, 0, 1)
  emit('update:modelValue', rgbToHex(hsvToRgb(hsv.value.h, saturation, value)))
}

function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  const expanded = /^#?[0-9a-fA-F]{3}$/.test(trimmed)
    ? trimmed
        .replace('#', '')
        .split('')
        .map((char) => char + char)
        .join('')
    : trimmed.replace('#', '')

  return /^[0-9a-fA-F]{6}$/.test(expanded) ? `#${expanded.toLowerCase()}` : null
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '')
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

function rgbToHex(color: { r: number; g: number; b: number }) {
  return `#${[color.r, color.g, color.b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`
}

function rgbToHsv(r: number, g: number, b: number) {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  let h = 0

  if (delta !== 0) {
    if (max === red) h = ((green - blue) / delta) % 6
    else if (max === green) h = (blue - red) / delta + 2
    else h = (red - green) / delta + 4
  }

  h = Math.round(h * 60)
  if (h < 0) h += 360

  return {
    h,
    s: max === 0 ? 0 : delta / max,
    v: max,
  }
}

function hsvToRgb(h: number, s: number, v: number) {
  const chroma = v * s
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1))
  const match = v - chroma
  let red = 0
  let green = 0
  let blue = 0

  if (h < 60) [red, green, blue] = [chroma, x, 0]
  else if (h < 120) [red, green, blue] = [x, chroma, 0]
  else if (h < 180) [red, green, blue] = [0, chroma, x]
  else if (h < 240) [red, green, blue] = [0, x, chroma]
  else if (h < 300) [red, green, blue] = [x, 0, chroma]
  else [red, green, blue] = [chroma, 0, x]

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
}

onBeforeUnmount(stopToneDrag)
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

.accent-picker__panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 40;
  width: min(280px, calc(100vw - 40px));
  padding: 14px;
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.1));
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
    var(--gui-bg-surface-raised, #2c2c2e);
  box-shadow: var(--gui-shadow-ios-dropdown, 0 8px 32px rgba(0, 0, 0, 0.6));
}

.accent-picker__preview {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.accent-picker__preview-swatch {
  width: 36px;
  height: 36px;
  border: 1px solid var(--gui-border-strong, rgba(255, 255, 255, 0.14));
  border-radius: 10px;
  background: var(--accent-color);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
}

.accent-picker__preview-text {
  color: var(--gui-text-primary, #ffffff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  font-weight: 600;
}

.accent-picker__tone-plane {
  position: relative;
  height: 128px;
  margin-bottom: 12px;
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.12));
  border-radius: 10px;
  background:
    linear-gradient(180deg, transparent, #000), linear-gradient(90deg, #fff, var(--hue-color));
  cursor: crosshair;
  touch-action: none;
}

.accent-picker__tone-thumb {
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

.accent-picker__field,
.accent-picker__hue {
  display: grid;
  gap: 6px;
  color: var(--gui-text-tertiary, #8e8e93);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.accent-picker__field input {
  width: 100%;
  min-width: 0;
  height: 34px;
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  background: var(--gui-bg-surface, #1c1c1e);
  color: var(--gui-text-primary, #ffffff);
  font:
    600 13px ui-monospace,
    SFMono-Regular,
    Menlo,
    Consolas,
    monospace;
  text-align: center;
  outline: none;
}

.accent-picker__field input:focus {
  border-color: var(--gui-accent, #8e8e93);
  box-shadow: 0 0 0 3px var(--gui-accent-soft, rgba(142, 142, 147, 0.16));
}

.accent-picker__field--hex {
  margin-bottom: 10px;
}

.accent-picker__hue {
  margin-bottom: 12px;
}

.accent-picker__hue input {
  width: 100%;
  height: 14px;
  margin: 0;
  accent-color: var(--accent-color, #0063d1);
  background: linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000);
}

.accent-picker__rgb-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

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

:global(.light .accent-picker__panel) {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(246, 246, 248, 0.96)),
    var(--gui-bg-surface-raised, #f2f2f7);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.14);
}

:global(.light .accent-picker__field input) {
  background: var(--gui-bg-surface, #ffffff);
}
</style>
