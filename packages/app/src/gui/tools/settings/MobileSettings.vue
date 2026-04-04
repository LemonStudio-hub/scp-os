<template>
  <MobileWindow
    :visible="visible"
    title="Settings"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="settings-app">
      <div class="settings-app__content gui-scrollable">

        <!-- Terminal -->
        <div class="settings-section" style="--section-delay: 0ms;">
          <div class="settings-section__header">
            <GUIIcon name="terminal" :size="16" class="settings-section__icon" />
            <span class="settings-section__label">Terminal</span>
          </div>
          <div class="settings-section__content">
            <!-- Font Size -->
            <div class="settings-row" @click="openSlider('fontSize')">
              <span class="settings-row__label">Font Size</span>
              <div class="settings-row__value-group">
                <span class="settings-row__value">{{ settings.fontSize }}px</span>
                <svg class="settings-row__chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <!-- Cursor Blink -->
            <div class="settings-row" @click="toggleSetting('cursorBlink')">
              <span class="settings-row__label">Cursor Blink</span>
              <ToggleSwitch :active="settings.cursorBlink" @toggle="toggleSetting('cursorBlink')" />
            </div>
            <!-- Boot Animation -->
            <div class="settings-row" @click="toggleSetting('bootAnimation')">
              <span class="settings-row__label">Boot Animation</span>
              <ToggleSwitch :active="settings.bootAnimation" @toggle="toggleSetting('bootAnimation')" />
            </div>
          </div>
        </div>

        <!-- Appearance -->
        <div class="settings-section" style="--section-delay: 60ms;">
          <div class="settings-section__header">
            <GUIIcon name="settings" :size="16" class="settings-section__icon" />
            <span class="settings-section__label">Appearance</span>
          </div>
          <div class="settings-section__content">
            <!-- Accent Color -->
            <div class="settings-row" @click="openSlider('accent')">
              <span class="settings-row__label">Accent Color</span>
              <div class="settings-row__value-group">
                <span class="settings-row__color-dot" :style="{ background: settings.accent }" />
                <span class="settings-row__value">{{ getAccentLabel(settings.accent) }}</span>
                <svg class="settings-row__chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <!-- Haptic Feedback -->
            <div class="settings-row" @click="toggleSetting('haptic')">
              <span class="settings-row__label">Haptic Feedback</span>
              <ToggleSwitch :active="settings.haptic" @toggle="toggleSetting('haptic')" />
            </div>
            <!-- Animations -->
            <div class="settings-row" @click="toggleSetting('animations')">
              <span class="settings-row__label">Animations</span>
              <ToggleSwitch :active="settings.animations" @toggle="toggleSetting('animations')" />
            </div>
          </div>
        </div>

        <!-- Storage -->
        <div class="settings-section" style="--section-delay: 120ms;">
          <div class="settings-section__header">
            <GUIIcon name="save" :size="16" class="settings-section__icon" />
            <span class="settings-section__label">Storage</span>
          </div>
          <div class="settings-section__content">
            <div class="settings-row">
              <span class="settings-row__label">Used Space</span>
              <span class="settings-row__value">{{ storageUsed }}</span>
            </div>
            <div class="settings-row">
              <span class="settings-row__label">Terminal States</span>
              <span class="settings-row__value">{{ terminalStateCount }}</span>
            </div>
            <div class="settings-row" @click="confirmClearData">
              <span class="settings-row__label settings-row__label--danger">Clear All Data</span>
              <svg class="settings-row__chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- About -->
        <div class="settings-section" style="--section-delay: 180ms;">
          <div class="settings-section__header">
            <GUIIcon name="file" :size="16" class="settings-section__icon" />
            <span class="settings-section__label">About</span>
          </div>
          <div class="settings-section__content">
            <div class="settings-row">
              <span class="settings-row__label">Application</span>
              <span class="settings-row__value">SCP-OS</span>
            </div>
            <div class="settings-row">
              <span class="settings-row__label">Version</span>
              <span class="settings-row__value">{{ config.app.version }}</span>
            </div>
            <div class="settings-row">
              <span class="settings-row__label">Build</span>
              <span class="settings-row__value">{{ buildDate }}</span>
            </div>
            <div class="settings-row">
              <span class="settings-row__label">License</span>
              <span class="settings-row__value">MIT / CC BY-SA 3.0</span>
            </div>
          </div>
        </div>

        <!-- Reset -->
        <div class="settings-section" style="--section-delay: 240ms;">
          <div class="settings-section__content">
            <div class="settings-row" @click="confirmResetSettings">
              <span class="settings-row__label settings-row__label--danger">Reset All Settings</span>
              <svg class="settings-row__chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div style="height: var(--gui-spacing-3xl, 48px);" />
      </div>

      <!-- Confirmation Dialog -->
      <Transition name="gui-ios-fade">
        <div v-if="confirmDialog" class="settings-confirm-overlay" @click.self="confirmDialog = null">
          <div class="settings-confirm-dialog">
            <h3 class="settings-confirm-title">{{ confirmDialog.title }}</h3>
            <p class="settings-confirm-text">{{ confirmDialog.text }}</p>
            <div class="settings-confirm-actions">
              <button class="settings-confirm-btn" @click="confirmDialog = null">Cancel</button>
              <button class="settings-confirm-btn settings-confirm-btn--danger" @click="confirmDialog.action">
                {{ confirmDialog.confirmText }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Font Size Slider Sheet -->
      <MobileBottomSheet
        v-model:visible="sliderSheets.fontSize"
        title="Font Size"
        swipe-to-dismiss
      >
        <div class="settings-slider-sheet">
          <div class="settings-slider-sheet__preview" :style="{ fontSize: `${sliderValues.fontSize}px` }">
            Aa 123
          </div>
          <input
            type="range"
            min="10"
            max="22"
            step="1"
            v-model.number="sliderValues.fontSize"
            class="settings-slider-sheet__slider"
            @input="onFontSizeChange"
          />
          <div class="settings-slider-sheet__labels">
            <span>10px</span>
            <span>22px</span>
          </div>
        </div>
      </MobileBottomSheet>

      <!-- Accent Color Picker Sheet -->
      <MobileBottomSheet
        v-model:visible="sliderSheets.accent"
        title="Accent Color"
        swipe-to-dismiss
      >
        <div class="settings-color-sheet">
          <div class="settings-color-sheet__grid">
            <button
              v-for="color in accentOptions"
              :key="color.value"
              :class="['settings-color-sheet__swatch', { 'settings-color-sheet__swatch--active': settings.accent === color.value }]"
              :style="{ background: color.value }"
              @click="setAccent(color.value)"
            >
              <svg v-if="settings.accent === color.value" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8L7 12L13 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <p class="settings-color-sheet__label">Tap to select accent color</p>
        </div>
      </MobileBottomSheet>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, defineComponent, h } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
import MobileBottomSheet from '../../components/MobileBottomSheet.vue'
import GUIIcon from '../../components/ui/GUIIcon.vue'
import { useTerminalStore } from '../../../stores/terminal'
import { useTheme } from '../../composables/useTheme'
import { config } from '../../../config'
import indexedDBService from '../../../utils/indexedDB'

interface Props {
  visible: boolean
}

interface ConfirmDialog {
  title: string
  text: string
  confirmText: string
  action: () => void
}

interface AppSettings {
  fontSize: number
  cursorBlink: boolean
  bootAnimation: boolean
  haptic: boolean
  animations: boolean
  accent: string
}

const STORAGE_KEY = 'scp-os-app-settings'

const accentOptions = [
  { value: '#e94560', label: 'Red' },
  { value: '#60a5fa', label: 'Blue' },
  { value: '#34d399', label: 'Green' },
  { value: '#fbbf24', label: 'Yellow' },
  { value: '#c084fc', label: 'Purple' },
  { value: '#f87171', label: 'Coral' },
  { value: '#22d3ee', label: 'Cyan' },
  { value: '#a0a0a0', label: 'Gray' },
]

const defaultSettings: AppSettings = {
  fontSize: 14,
  cursorBlink: true,
  bootAnimation: true,
  haptic: true,
  animations: true,
  accent: '#e94560',
}

defineProps<Props>()

const terminalStore = useTerminalStore()
const { applyTheme } = useTheme()

// Load settings from localStorage
function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...defaultSettings }
}

const settings = reactive<AppSettings>(loadSettings())

// Get the active terminal instance
function getActiveTerminal() {
  return (window as any).__terminalInstance?.terminal || null
}

// Persist settings
watch(settings, () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  applySettings()
}, { deep: true })

function applySettings(): void {
  terminalStore.fontSize = settings.fontSize
  // Apply accent color theme
  const terminal = getActiveTerminal()
  applyTheme(settings.accent, terminal)
}

// Slider sheets
const sliderSheets = reactive({
  fontSize: false,
  accent: false,
})
const sliderValues = reactive({
  fontSize: settings.fontSize,
})

function openSlider(type: 'fontSize' | 'accent'): void {
  if (type === 'fontSize') {
    sliderValues.fontSize = settings.fontSize
    sliderSheets.fontSize = true
  } else if (type === 'accent') {
    sliderSheets.accent = true
  }
}

function onFontSizeChange(): void {
  settings.fontSize = sliderValues.fontSize
}

function setAccent(color: string): void {
  settings.accent = color
  sliderSheets.accent = false
}

function getAccentLabel(color: string): string {
  return accentOptions.find(c => c.value === color)?.label || color
}

// Toggle settings
function toggleSetting(key: keyof AppSettings): void {
  if (typeof settings[key] === 'boolean') {
    (settings[key] as boolean) = !(settings[key] as boolean)
    triggerHaptic()
  }
}

function triggerHaptic(): void {
  if (settings.haptic && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10)
  }
}

// Confirm dialog
const confirmDialog = ref<ConfirmDialog | null>(null)

function confirmClearData(): void {
  triggerHaptic()
  confirmDialog.value = {
    title: 'Clear All Data',
    text: 'This will delete all terminal states, tabs, and saved data. This action cannot be undone.',
    confirmText: 'Clear',
    action: clearAllData,
  }
}

async function clearAllData(): Promise<void> {
  try {
    await indexedDBService.clearAll()
    localStorage.clear()
    confirmDialog.value = null
    location.reload()
  } catch {
    alert('Failed to clear data')
  }
}

function confirmResetSettings(): void {
  triggerHaptic()
  confirmDialog.value = {
    title: 'Reset Settings',
    text: 'Reset all settings to their default values?',
    confirmText: 'Reset',
    action: resetSettings,
  }
}

function resetSettings(): void {
  Object.assign(settings, { ...defaultSettings })
  confirmDialog.value = null
  triggerHaptic()
}

// Storage info
const storageUsed = computed(() => {
  let total = 0
  for (let key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      total += (localStorage[key].length + key.length) * 2
    }
  }
  return formatBytes(total)
})

const terminalStateCount = computed(() => {
  let count = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || ''
    if (key.startsWith('scp-terminal-state-')) count++
  }
  return count
})

const buildDate = computed(() => '2026-04-03')

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Toggle Switch component
const ToggleSwitch = defineComponent({
  props: {
    active: { type: Boolean, default: false },
  },
  emits: ['toggle'],
  setup(props, { emit }) {
    return () => h('div', {
      class: ['settings-toggle', { 'settings-toggle--active': props.active }],
      onClick: () => emit('toggle'),
    }, [
      h('div', { class: 'settings-toggle__track' }, [
        h('div', { class: 'settings-toggle__thumb' }),
      ]),
    ])
  },
})
</script>

<style scoped>
.settings-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #060606);
  font-family: var(--gui-font-sans);
}

.settings-app__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--gui-spacing-base, 16px);
}

/* ── Section ────────────────────────────────────────────────────────── */
.settings-section {
  margin-bottom: var(--gui-spacing-xl, 24px);
  opacity: 0;
  transform: translateY(12px);
  animation: settings-section-in 0.4s cubic-bezier(0.32, 0.72, 0, 1) both;
  animation-delay: var(--section-delay, 0ms);
}

@keyframes settings-section-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.settings-section__header {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-secondary, #a0a0a0);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--gui-spacing-sm, 8px);
  padding-left: var(--gui-spacing-md, 12px);
}

.settings-section__icon {
  color: var(--gui-text-tertiary, #6a6a6a);
}

.settings-section__content {
  background: var(--gui-bg-surface, #0c0c0c);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-lg, 12px);
  overflow: hidden;
}

/* ── Row ────────────────────────────────────────────────────────────── */
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gui-spacing-md, 12px) var(--gui-spacing-base, 16px);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.04));
  gap: var(--gui-spacing-md, 12px);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background var(--gui-transition-fast, 120ms ease);
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-row:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.04));
}

.settings-row__label {
  font-size: var(--gui-font-base, 13px);
  color: var(--gui-text-primary, #f0f0f0);
  flex: 1;
  min-width: 0;
}

.settings-row__label--danger {
  color: var(--gui-error, #f87171);
}

.settings-row__value-group {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
}

.settings-row__value {
  font-size: var(--gui-font-base, 13px);
  color: var(--gui-text-secondary, #a0a0a0);
  white-space: nowrap;
}

.settings-row__color-dot {
  width: 12px;
  height: 12px;
  border-radius: var(--gui-radius-full, 9999px);
  flex-shrink: 0;
}

.settings-row__chevron {
  color: var(--gui-text-disabled, #444444);
  flex-shrink: 0;
  margin-left: var(--gui-spacing-xxs, 2px);
}

/* ── Toggle Switch ─────────────────────────────────────────────────── */
.settings-toggle {
  display: flex;
  align-items: center;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}

.settings-toggle__track {
  width: 50px;
  height: 30px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 15px;
  position: relative;
  transition: background var(--gui-transition-base, 200ms ease);
  flex-shrink: 0;
}

.settings-toggle--active .settings-toggle__track {
  background: var(--gui-accent, #e94560);
}

.settings-toggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 26px;
  height: 26px;
  background: #ffffff;
  border-radius: 13px;
  box-shadow: var(--gui-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.3));
  transition: transform var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
}

.settings-toggle--active .settings-toggle__thumb {
  transform: translateX(20px);
}

/* ── Confirm Dialog ─────────────────────────────────────────────────── */
.settings-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--gui-z-modal, 400);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gui-backdrop-bg, rgba(0, 0, 0, 0.5));
  padding: var(--gui-spacing-xl, 24px);
}

.settings-confirm-dialog {
  width: 100%;
  max-width: 280px;
  background: var(--gui-bg-surface-raised, #111111);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-xl, 14px);
  padding: var(--gui-spacing-xl, 24px);
  box-shadow: var(--gui-shadow-xl, 0 24px 48px rgba(0, 0, 0, 0.7));
  animation: gui-window-open 0.3s cubic-bezier(0.32, 0.72, 0, 1) both;
}

.settings-confirm-title {
  font-size: var(--gui-font-lg, 15px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-primary, #f0f0f0);
  margin: 0 0 var(--gui-spacing-sm, 8px);
  text-align: center;
}

.settings-confirm-text {
  font-size: var(--gui-font-base, 13px);
  color: var(--gui-text-secondary, #a0a0a0);
  margin: 0 0 var(--gui-spacing-lg, 20px);
  text-align: center;
  line-height: var(--gui-line-height-base, 1.5);
}

.settings-confirm-actions {
  display: flex;
  gap: var(--gui-spacing-sm, 8px);
}

.settings-confirm-btn {
  flex: 1;
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-md, 12px);
  background: var(--gui-bg-surface, #0c0c0c);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-primary, #f0f0f0);
  font-size: var(--gui-font-base, 13px);
  font-weight: var(--gui-font-weight-semibold, 600);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
}

.settings-confirm-btn:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.settings-confirm-btn--danger {
  background: var(--gui-error-bg, rgba(248, 113, 113, 0.15));
  color: var(--gui-error, #f87171);
  border-color: transparent;
}

/* ── Slider Sheet ───────────────────────────────────────────────────── */
.settings-slider-sheet {
  padding: var(--gui-spacing-lg, 20px) var(--gui-spacing-base, 16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-md, 12px);
}

.settings-slider-sheet__preview {
  font-family: var(--gui-font-mono, "JetBrains Mono", "Cascadia Code", monospace);
  color: var(--gui-text-primary, #f0f0f0);
  padding: var(--gui-spacing-xl, 24px);
  background: var(--gui-bg-surface, #0c0c0c);
  border-radius: var(--gui-radius-lg, 12px);
  min-width: 200px;
  text-align: center;
  transition: font-size var(--gui-transition-base, 200ms ease);
}

.settings-slider-sheet__slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  max-width: 280px;
  height: var(--gui-dim-slider-track-height, 4px);
  background: var(--gui-border-default, rgba(255, 255, 255, 0.1));
  border-radius: var(--gui-radius-xs, 4px);
  outline: none;
}

.settings-slider-sheet__slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: var(--gui-dim-slider-thumb-size, 20px);
  height: var(--gui-dim-slider-thumb-size, 20px);
  background: var(--gui-accent, #e94560);
  border-radius: var(--gui-radius-full, 9999px);
  cursor: pointer;
  box-shadow: var(--gui-shadow-glow, 0 0 20px rgba(233, 69, 96, 0.15));
}

.settings-slider-sheet__labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 280px;
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-tertiary, #6a6a6a);
}

/* ── Color Picker Sheet ─────────────────────────────────────────────── */
.settings-color-sheet {
  padding: var(--gui-spacing-lg, 20px) var(--gui-spacing-base, 16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-md, 12px);
}

.settings-color-sheet__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--gui-spacing-md, 12px);
  width: 100%;
  max-width: 280px;
}

.settings-color-sheet__swatch {
  width: 56px;
  height: 56px;
  border-radius: var(--gui-radius-lg, 12px);
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
  -webkit-tap-highlight-color: transparent;
}

.settings-color-sheet__swatch:active {
  transform: scale(0.9);
}

.settings-color-sheet__swatch--active {
  border-color: #ffffff;
  box-shadow: var(--gui-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.5));
  transform: scale(1.08);
}

.settings-color-sheet__label {
  font-size: var(--gui-font-sm, 12px);
  color: var(--gui-text-tertiary, #6a6a6a);
}
</style>
