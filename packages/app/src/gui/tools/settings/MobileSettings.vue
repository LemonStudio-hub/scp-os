<template>
  <MobileWindow
    :visible="visible"
    title="Settings"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="settings-app k-ios-page k-ios-page--dark">
      <div class="settings-app__content gui-scrollable">

        <!-- Terminal Section -->
        <div class="k-ios-block__title">Terminal</div>
        <div class="k-ios-list">
          <!-- Font Size -->
          <div class="k-ios-list__item" @click="openSlider('fontSize')">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">Font Size</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <span class="k-ios-list__item-value">{{ settings.fontSize }}px</span>
              <svg class="k-ios-list__item-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <!-- Cursor Blink -->
          <div class="k-ios-list__item" @click="toggleSetting('cursorBlink')">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">Cursor Blink</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <ToggleSwitch v-model:active="settings.cursorBlink" />
            </div>
          </div>
          <!-- Boot Animation -->
          <div class="k-ios-list__item" @click="toggleSetting('bootAnimation')">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">Boot Animation</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <ToggleSwitch v-model:active="settings.bootAnimation" />
            </div>
          </div>
        </div>

        <!-- Appearance Section -->
        <div class="k-ios-block__title">Appearance</div>
        <div class="k-ios-list">
          <!-- Theme Selection -->
          <div v-for="theme in themeStore.availableThemes" :key="theme.id" class="k-ios-list__item" @click="themeStore.setTheme(theme.id)">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ theme.icon }} {{ theme.name }}</div>
                <div class="k-ios-list__item-description">{{ theme.description }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <div class="k-ios-list__item-radio" :class="{ 'k-ios-list__item-radio--active': themeStore.currentThemeId === theme.id }" />
            </div>
          </div>
          <!-- Haptic Feedback -->
          <div class="k-ios-list__item" @click="toggleSetting('haptic')">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">Haptic Feedback</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <ToggleSwitch v-model:active="settings.haptic" />
            </div>
          </div>
          <!-- Animations -->
          <div class="k-ios-list__item" @click="toggleSetting('animations')">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">Animations</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <ToggleSwitch v-model:active="settings.animations" />
            </div>
          </div>
        </div>

        <!-- Storage Section -->
        <div class="k-ios-block__title">Storage</div>
        <div class="k-ios-list">
          <div class="k-ios-list__item">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">Used Space</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <span class="k-ios-list__item-value">{{ storageUsed }}</span>
            </div>
          </div>
          <div class="k-ios-list__item">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">Terminal States</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <span class="k-ios-list__item-value">{{ terminalStateCount }}</span>
            </div>
          </div>
          <div class="k-ios-list__item" @click="confirmClearData">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label k-ios-list__item-label--destructive">Clear All Data</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <svg class="k-ios-list__item-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- About Section -->
        <div class="k-ios-block__title">About</div>
        <div class="k-ios-list">
          <div class="k-ios-list__item">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">Application</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <span class="k-ios-list__item-value">SCP-OS</span>
            </div>
          </div>
          <div class="k-ios-list__item">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">Version</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <span class="k-ios-list__item-value">{{ config.app.version }}</span>
            </div>
          </div>
          <div class="k-ios-list__item">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">Build</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <span class="k-ios-list__item-value">{{ buildDate }}</span>
            </div>
          </div>
          <div class="k-ios-list__item">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">License</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <span class="k-ios-list__item-value">MIT / CC BY-SA 3.0</span>
            </div>
          </div>
        </div>

        <!-- Reset -->
        <div class="k-ios-list" style="margin-top: var(--gui-spacing-xl, 24px);">
          <div class="k-ios-list__item" @click="confirmResetSettings">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label k-ios-list__item-label--centered">Reset All Settings</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <svg class="k-ios-list__item-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
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
              <button class="settings-confirm-btn settings-confirm-btn--destructive" @click="confirmDialog.action">
                {{ confirmDialog.confirmText }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Font Size Slider Sheet -->
      <Sheet v-model:visible="sliderSheets.fontSize">
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
            class="k-ios-slider"
            @input="onFontSizeChange"
          />
          <div class="settings-slider-sheet__labels">
            <span>10px</span>
            <span>22px</span>
          </div>
        </div>
      </Sheet>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
import Sheet from '../../konsta/Sheet.vue'
import ToggleSwitch from '../../konsta/ToggleSwitch.vue'
import { useTerminalStore } from '../../../stores/terminal'
import { useThemeStore } from '../../stores/themeStore'
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

const defaultSettings: AppSettings = {
  fontSize: 14,
  cursorBlink: true,
  bootAnimation: true,
  haptic: true,
  animations: true,
  accent: '#8e8e93',
}

defineProps<Props>()

const terminalStore = useTerminalStore()
const themeStore = useThemeStore()

// Initialize theme store
themeStore.init()

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...defaultSettings }
}

const settings = reactive<AppSettings>(loadSettings())

let prevFontSize = settings.fontSize

watch(settings, () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  applySettings()
}, { deep: true })

function getActiveTerminal() {
  return (window as any).__terminalInstance?.terminal || null
}

function applySettings(): void {
  const terminal = getActiveTerminal()

  if (settings.fontSize !== prevFontSize && terminal) {
    terminalStore.fontSize = settings.fontSize
    try {
      terminal.options.fontSize = settings.fontSize
      terminal.refresh(0, terminal.rows - 1)
    } catch { /* ignore */ }
    prevFontSize = settings.fontSize
  }
}

const sliderSheets = reactive({ fontSize: false })
const sliderValues = reactive({ fontSize: settings.fontSize })

function openSlider(type: 'fontSize'): void {
  if (type === 'fontSize') {
    sliderValues.fontSize = settings.fontSize
    sliderSheets.fontSize = true
  }
}

function onFontSizeChange(): void {
  settings.fontSize = sliderValues.fontSize
}

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

const buildDate = computed(() => '2026-04-04')

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<style scoped>
.settings-app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.settings-app__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--gui-spacing-base, 16px);
}

/* iOS list item right value */
.k-ios-list__item-value {
  font-size: var(--gui-font-base, 13px);
  color: var(--gui-text-secondary, #8e8e93);
  white-space: nowrap;
}

.k-ios-list__item-color-dot {
  width: 12px;
  height: 12px;
  border-radius: var(--gui-radius-full, 9999px);
  flex-shrink: 0;
}

.k-ios-list__item-label--destructive {
  color: var(--gui-error, #ff3b30);
}

.k-ios-list__item-label--centered {
  text-align: center;
  width: 100%;
}

/* Radio indicator for theme selection */
.k-ios-list__item-radio {
  width: 20px;
  height: 20px;
  border-radius: var(--gui-radius-full, 9999px);
  border: 2px solid var(--gui-text-tertiary, #636366);
  transition: all var(--gui-transition-fast, 120ms ease);
}

.k-ios-list__item-radio--active {
  border-color: var(--gui-accent, #8E8E93);
  background: var(--gui-accent, #8E8E93);
  box-shadow: inset 0 0 0 3px var(--gui-bg-surface-raised, #3A3A3C);
}

/* Confirm Dialog */
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
  background: var(--gui-bg-surface-raised, #2c2c2e);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-xl, 14px);
  padding: var(--gui-spacing-xl, 24px);
  box-shadow: var(--gui-shadow-xl, 0 24px 48px rgba(0, 0, 0, 0.7));
  animation: gui-window-open 0.3s cubic-bezier(0.32, 0.72, 0, 1) both;
}

.settings-confirm-title {
  font-size: var(--gui-font-lg, 15px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-primary, #ffffff);
  margin: 0 0 var(--gui-spacing-sm, 8px);
  text-align: center;
}

.settings-confirm-text {
  font-size: var(--gui-font-base, 13px);
  color: var(--gui-text-secondary, #8e8e93);
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
  background: var(--gui-bg-surface, #1c1c1e);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-primary, #ffffff);
  font-size: var(--gui-font-base, 13px);
  font-weight: var(--gui-font-weight-semibold, 600);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
}

.settings-confirm-btn:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.settings-confirm-btn--destructive {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.15));
  color: var(--gui-error, #ff3b30);
  border-color: transparent;
}

/* Slider Sheet */
.settings-slider-sheet {
  padding: var(--gui-spacing-lg, 20px) var(--gui-spacing-base, 16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-md, 12px);
}

.settings-slider-sheet__preview {
  font-family: var(--gui-font-mono, "JetBrains Mono", monospace);
  color: var(--gui-text-primary, #ffffff);
  padding: var(--gui-spacing-xl, 24px);
  background: var(--gui-bg-surface, #1c1c1e);
  border-radius: var(--gui-radius-lg, 12px);
  min-width: 200px;
  text-align: center;
  transition: font-size var(--gui-transition-base, 200ms ease);
}

.settings-slider-sheet__labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 280px;
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-tertiary, #636366);
}

/* Color Picker Sheet */
.settings-color-sheet {
  padding: var(--gui-spacing-lg, 20px) var(--gui-spacing-base, 16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-md, 12px);
}

.settings-color-sheet__label {
  font-size: var(--gui-font-sm, 12px);
  color: var(--gui-text-tertiary, #636366);
}
</style>
