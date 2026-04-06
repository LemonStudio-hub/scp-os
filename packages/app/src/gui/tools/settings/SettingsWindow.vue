<template>
  <PCWindow :window-instance="windowInstance" @close="$emit('close')">
    <div class="pc-settings">
      <!-- Sidebar Navigation -->
      <div class="pc-settings__sidebar">
        <button
          v-for="section in sections"
          :key="section.id"
          :class="[
            'pc-settings__nav-btn',
            { 'pc-settings__nav-btn--active': activeSection === section.id },
          ]"
          @click="activeSection = section.id"
        >
          <span class="pc-settings__nav-icon" v-html="section.icon" />
          <span class="pc-settings__nav-label">{{ section.label }}</span>
        </button>
      </div>

      <!-- Content Area -->
      <div class="pc-settings__content gui-scrollable">
        <!-- Terminal Section -->
        <template v-if="activeSection === 'terminal'">
          <div class="pc-settings__section-title">{{ t('settings.terminal') }}</div>
          <div class="pc-settings__card">
            <!-- Font Size -->
            <div class="pc-settings__row" @click="showFontSizeSlider = !showFontSizeSlider">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.fontSize') }}</div>
                <div class="pc-settings__row-value">{{ settings.fontSize }}px</div>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.3"
                stroke-linecap="round"
              >
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </div>
            <div v-if="showFontSizeSlider" class="pc-settings__slider-row">
              <input
                v-model.number="settings.fontSize"
                type="range"
                min="10"
                max="22"
                step="1"
                class="k-ios-slider"
              />
              <div
                class="pc-settings__slider-preview"
                :style="{ fontSize: `${settings.fontSize}px` }"
              >
                {{ t('settings.fontPreview') }}
              </div>
            </div>

            <!-- Cursor Blink -->
            <div class="pc-settings__row" @click="settings.cursorBlink = !settings.cursorBlink">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.cursorBlink') }}</div>
              </div>
              <div
                class="pc-settings__toggle"
                :class="{ 'pc-settings__toggle--on': settings.cursorBlink }"
              />
            </div>

            <!-- Boot Animation -->
            <div class="pc-settings__row" @click="settings.bootAnimation = !settings.bootAnimation">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.bootAnimation') }}</div>
              </div>
              <div
                class="pc-settings__toggle"
                :class="{ 'pc-settings__toggle--on': settings.bootAnimation }"
              />
            </div>
          </div>
        </template>

        <!-- Appearance Section -->
        <template v-if="activeSection === 'appearance'">
          <div class="pc-settings__section-title">{{ t('settings.appearance') }}</div>

          <!-- Language -->
          <div class="pc-settings__card">
            <div class="pc-settings__row" @click="showLanguageDropdown = !showLanguageDropdown">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.language') }}</div>
                <div class="pc-settings__row-value">{{ currentLanguageName }}</div>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.3"
                stroke-linecap="round"
              >
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </div>
            <div v-if="showLanguageDropdown" class="pc-settings__language-dropdown">
              <div
                v-for="loc in availableLocales"
                :key="loc"
                :class="[
                  'pc-settings__lang-option',
                  { 'pc-settings__lang-option--active': locale === loc },
                ]"
                @click="selectLanguage(loc)"
              >
                <span>{{ localeNames[loc] }}</span>
                <svg
                  v-if="locale === loc"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                >
                  <path d="M4 8L7 11L12 5" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Theme Selection -->
          <div class="pc-settings__card">
            <div
              v-for="theme in themeStore.availableThemes"
              :key="theme.id"
              class="pc-settings__row pc-settings__row--radio"
              @click="themeStore.setTheme(theme.id)"
            >
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ theme.name }}</div>
                <div class="pc-settings__row-description">{{ theme.description }}</div>
              </div>
              <div
                class="pc-settings__radio"
                :class="{ 'pc-settings__radio--active': themeStore.currentThemeId === theme.id }"
              />
            </div>
          </div>

          <!-- Haptic Feedback -->
          <div class="pc-settings__card">
            <div class="pc-settings__row" @click="settings.haptic = !settings.haptic">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.hapticFeedback') }}</div>
              </div>
              <div
                class="pc-settings__toggle"
                :class="{ 'pc-settings__toggle--on': settings.haptic }"
              />
            </div>

            <!-- Animations -->
            <div class="pc-settings__row" @click="settings.animations = !settings.animations">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.animations') }}</div>
              </div>
              <div
                class="pc-settings__toggle"
                :class="{ 'pc-settings__toggle--on': settings.animations }"
              />
            </div>

            <!-- Wallpaper -->
            <div class="pc-settings__row" @click="wallpaperPickerVisible = true">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.wallpaper') }}</div>
                <div class="pc-settings__row-description">{{ currentWallpaperName }}</div>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.3"
                stroke-linecap="round"
              >
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </div>
          </div>
        </template>

        <!-- Storage Section -->
        <template v-if="activeSection === 'storage'">
          <div class="pc-settings__section-title">{{ t('settings.storage') }}</div>
          <div class="pc-settings__card">
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.usedSpace') }}</div>
              </div>
              <div class="pc-settings__row-value">{{ storageUsed }}</div>
            </div>
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.terminalStates') }}</div>
              </div>
              <div class="pc-settings__row-value">{{ terminalStateCount }}</div>
            </div>
            <div class="pc-settings__row pc-settings__row--destructive" @click="confirmClearData">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.clearAllData') }}</div>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.3"
                stroke-linecap="round"
              >
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </div>
          </div>
        </template>

        <!-- About Section -->
        <template v-if="activeSection === 'about'">
          <div class="pc-settings__section-title">{{ t('settings.about') }}</div>
          <div class="pc-settings__card">
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.application') }}</div>
              </div>
              <div class="pc-settings__row-value">SCP-OS</div>
            </div>
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.version') }}</div>
              </div>
              <div class="pc-settings__row-value">0.1.0</div>
            </div>
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.userId') }}</div>
                <div class="pc-settings__row-description">{{ userId }}</div>
              </div>
            </div>
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.build') }}</div>
              </div>
              <div class="pc-settings__row-value">{{ buildDate }}</div>
            </div>
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.license') }}</div>
              </div>
              <div class="pc-settings__row-value">MIT / CC BY-SA 3.0</div>
            </div>
          </div>
        </template>

        <!-- Reset -->
        <div class="pc-settings__reset-row">
          <button class="pc-settings__reset-btn" @click="confirmResetSettings">
            {{ t('settings.resetAll') }}
          </button>
        </div>
      </div>

      <!-- Confirmation Dialog -->
      <Transition name="pc-settings-dialog-fade">
        <div
          v-if="confirmDialog"
          class="pc-settings__dialog-overlay"
          @click.self="confirmDialog = null"
        >
          <div class="pc-settings__dialog">
            <h3 class="pc-settings__dialog-title">{{ confirmDialog.title }}</h3>
            <p class="pc-settings__dialog-text">{{ confirmDialog.text }}</p>
            <div class="pc-settings__dialog-actions">
              <button class="pc-settings__dialog-btn" @click="confirmDialog = null">
                {{ t('common.cancel') }}
              </button>
              <button
                class="pc-settings__dialog-btn pc-settings__dialog-btn--destructive"
                @click="confirmDialog.action"
              >
                {{ confirmDialog.confirmText }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Wallpaper Picker -->
    <WallpaperPicker v-model:visible="wallpaperPickerVisible" @change="onWallpaperChange" />
  </PCWindow>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { localeNames } from '../../../locales'
import PCWindow from '../../components/PCWindow.vue'
import WallpaperPicker from '../../components/WallpaperPicker.vue'
import { useTerminalStore } from '../../../stores/terminal'
import { useThemeStore } from '../../stores/themeStore'
import indexedDBService from '../../../utils/indexedDB'
import type { WindowInstance } from '../../types'

interface Props {
  windowInstance: WindowInstance
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

defineProps<Props>()

const { t, locale, availableLocales } = useI18n()
const terminalStore = useTerminalStore()
const themeStore = useThemeStore()
themeStore.init()

const STORAGE_KEY = 'scp-os-app-settings'

const defaultSettings: AppSettings = {
  fontSize: 14,
  cursorBlink: true,
  bootAnimation: true,
  haptic: true,
  animations: true,
  accent: '#8e8e93',
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { ...defaultSettings }
}

const settings = reactive<AppSettings>(loadSettings())

watch(
  settings,
  () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    applySettings()
  },
  { deep: true }
)

let prevFontSize = settings.fontSize

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
    } catch {
      /* ignore */
    }
    prevFontSize = settings.fontSize
  }
}

// Navigation sections
const sections = computed(() => [
  {
    id: 'terminal',
    label: t('settings.terminal'),
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  },
  {
    id: 'appearance',
    label: t('settings.appearance'),
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 8.6a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  },
  {
    id: 'storage',
    label: t('settings.storage'),
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/></svg>',
  },
  {
    id: 'about',
    label: t('settings.about'),
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  },
])

const activeSection = ref('terminal')

// Language
const showLanguageDropdown = ref(false)
const currentLanguageName = computed(() => localeNames[locale.value] || 'English')

function selectLanguage(loc: 'en' | 'zh-CN') {
  locale.value = loc
  showLanguageDropdown.value = false
  loadWallpaperName()
}

// Wallpaper
const wallpaperPickerVisible = ref(false)
const currentWallpaperName = ref<string>('None')

async function loadWallpaperName() {
  try {
    const { wallpaperService } = await import('../../../utils/wallpaperService')
    await wallpaperService.init()
    const id = wallpaperService.getCurrentWallpaperId()
    if (id) {
      const wp = await wallpaperService.getWallpaper(id)
      currentWallpaperName.value = wp?.name || t('common.none')
    } else {
      currentWallpaperName.value = t('common.none')
    }
  } catch {
    /* silently fail */
  }
}
loadWallpaperName()

function onWallpaperChange(_wallpaperId: string | null) {
  window.dispatchEvent(
    new CustomEvent('wallpaper-changed', { detail: { wallpaperId: _wallpaperId } })
  )
  loadWallpaperName()
}

// UI state
const showFontSizeSlider = ref(false)

// User info
const userId = ref<string>('Loading...')
indexedDBService
  .getUserId()
  .then((id) => {
    userId.value = id
  })
  .catch(() => {
    userId.value = 'Unknown'
  })
const buildDate = computed(() => '2026-04-06')

// Storage stats
const storageUsed = computed(() => {
  let total = 0
  for (const key in localStorage) {
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Confirmation dialog
const confirmDialog = ref<ConfirmDialog | null>(null)

function confirmClearData(): void {
  confirmDialog.value = {
    title: t('settings.clearConfirmTitle'),
    text: t('settings.clearConfirmMsg'),
    confirmText: t('settings.clear'),
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
    alert(t('settings.failedClear'))
  }
}

function confirmResetSettings(): void {
  confirmDialog.value = {
    title: t('settings.resetTitle'),
    text: t('settings.resetMsg'),
    confirmText: t('settings.reset'),
    action: resetSettings,
  }
}

function resetSettings(): void {
  Object.assign(settings, { ...defaultSettings })
  confirmDialog.value = null
}
</script>

<style scoped>
/* ── Layout ────────────────────────────────────────────────────────── */
.pc-settings {
  display: flex;
  height: 100%;
  background: var(--gui-bg-base, #1c1c1e);
}

/* ── Sidebar ───────────────────────────────────────────────────────── */
.pc-settings__sidebar {
  width: 200px;
  flex-shrink: 0;
  background: var(--gui-bg-surface, #2c2c2e);
  border-right: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  padding: var(--gui-spacing-base, 16px) 0;
  display: flex;
  flex-direction: column;
  gap: var(--gui-spacing-xxs, 2px);
}

.pc-settings__nav-btn {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-base, 16px);
  background: transparent;
  border: none;
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-secondary, #8e8e93);
  cursor: pointer;
  transition: all var(--gui-transition-base, 200ms ease);
  text-align: left;
  margin: 0 var(--gui-spacing-xs, 4px);
}

.pc-settings__nav-btn:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #ffffff);
}

.pc-settings__nav-btn--active {
  background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.1));
  color: var(--gui-text-primary, #ffffff);
  font-weight: var(--gui-font-weight-semibold, 600);
}

.pc-settings__nav-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.pc-settings__nav-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.pc-settings__nav-label {
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
}

/* ── Content Area ──────────────────────────────────────────────────── */
.pc-settings__content {
  flex: 1;
  overflow-y: auto;
  padding: var(--gui-spacing-xl, 24px);
  min-width: 0;
}

.pc-settings__section-title {
  font-size: var(--gui-font-lg, 15px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-primary, #ffffff);
  margin-bottom: var(--gui-spacing-base, 16px);
  letter-spacing: -0.01em;
}

/* ── Card ──────────────────────────────────────────────────────────── */
.pc-settings__card {
  background: var(--gui-bg-surface, #2c2c2e);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-lg, 12px);
  overflow: hidden;
  margin-bottom: var(--gui-spacing-base, 16px);
}

/* ── Row ───────────────────────────────────────────────────────────── */
.pc-settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gui-spacing-md, 12px) var(--gui-spacing-base, 16px);
  cursor: pointer;
  transition: background var(--gui-transition-fast, 120ms ease);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.04));
  -webkit-tap-highlight-color: transparent;
}

.pc-settings__row:last-child {
  border-bottom: none;
}

.pc-settings__row:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.04));
}

.pc-settings__row:active {
  opacity: 0.8;
}

.pc-settings__row-info {
  flex: 1;
  min-width: 0;
}

.pc-settings__row-label {
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #ffffff);
}

.pc-settings__row-description {
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-secondary, #8e8e93);
  margin-top: 2px;
}

.pc-settings__row-value {
  font-size: var(--gui-font-sm, 12px);
  color: var(--gui-text-secondary, #8e8e93);
  flex-shrink: 0;
  margin-right: var(--gui-spacing-sm, 8px);
}

/* ── Toggle (iOS-style) ────────────────────────────────────────────── */
.pc-settings__toggle {
  width: 44px;
  height: 24px;
  background: var(--gui-text-tertiary, #636366);
  border-radius: 999px;
  position: relative;
  transition: background var(--gui-transition-base, 200ms ease);
  flex-shrink: 0;
}

.pc-settings__toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #ffffff;
  border-radius: 50%;
  transition: transform var(--gui-transition-bounce-spring, 300ms cubic-bezier(0.34, 1.56, 0.64, 1));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.pc-settings__toggle--on {
  background: var(--gui-success, #34c759);
}

.pc-settings__toggle--on::after {
  transform: translateX(20px);
}

/* ── Radio ─────────────────────────────────────────────────────────── */
.pc-settings__radio {
  width: 18px;
  height: 18px;
  border: 2px solid var(--gui-text-tertiary, #636366);
  border-radius: 50%;
  flex-shrink: 0;
  transition: all var(--gui-transition-fast, 120ms ease);
}

.pc-settings__radio--active {
  border-color: var(--gui-accent, #8e8e93);
  background: var(--gui-accent, #8e8e93);
  box-shadow: inset 0 0 0 2px var(--gui-bg-surface, #2c2c2e);
}

/* ── Slider Row ────────────────────────────────────────────────────── */
.pc-settings__slider-row {
  padding: var(--gui-spacing-base, 16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-md, 12px);
  background: var(--gui-bg-surface-raised, #3a3a3c);
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  animation: sliderFadeIn 0.2s ease both;
}

@keyframes sliderFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pc-settings__slider-preview {
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
  color: var(--gui-text-primary, #ffffff);
  transition: font-size var(--gui-transition-base, 200ms ease);
}

/* ── Language Dropdown ─────────────────────────────────────────────── */
.pc-settings__language-dropdown {
  padding: var(--gui-spacing-xs, 4px);
  background: var(--gui-bg-surface-raised, #3a3a3c);
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  animation: sliderFadeIn 0.2s ease both;
}

.pc-settings__lang-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-base, 16px);
  border-radius: var(--gui-radius-sm, 6px);
  cursor: pointer;
  transition: background var(--gui-transition-fast, 120ms ease);
  font-size: var(--gui-font-sm, 12px);
  color: var(--gui-text-primary, #ffffff);
}

.pc-settings__lang-option:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
}

.pc-settings__lang-option--active {
  background: var(--gui-accent-soft, rgba(142, 142, 147, 0.12));
  color: var(--gui-accent, #8e8e93);
}

/* ── Destructive Row ───────────────────────────────────────────────── */
.pc-settings__row--destructive {
  color: var(--gui-error, #ff3b30);
}

.pc-settings__row--destructive .pc-settings__row-label {
  color: var(--gui-error, #ff3b30);
}

/* ── Reset Button ──────────────────────────────────────────────────── */
.pc-settings__reset-row {
  display: flex;
  justify-content: center;
  padding: var(--gui-spacing-xl, 24px) 0;
}

.pc-settings__reset-btn {
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-xl, 24px);
  background: transparent;
  border: 1px solid var(--gui-error, #ff3b30);
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-error, #ff3b30);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-semibold, 600);
  cursor: pointer;
  transition: all var(--gui-transition-base, 200ms ease);
}

.pc-settings__reset-btn:hover {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.12));
}

.pc-settings__reset-btn:active {
  transform: scale(0.96);
  opacity: 0.8;
}

/* ── Confirmation Dialog ───────────────────────────────────────────── */
.pc-settings__dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--gui-z-modal, 400);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gui-backdrop-bg, rgba(0, 0, 0, 0.5));
  animation: overlayFadeIn 0.2s ease both;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.pc-settings__dialog {
  width: 100%;
  max-width: 320px;
  background: var(--gui-bg-surface-raised, #3a3a3c);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-xl, 14px);
  padding: var(--gui-spacing-xl, 24px);
  box-shadow: var(--gui-shadow-ios-modal, 0 20px 60px rgba(0, 0, 0, 0.7));
  animation: dialogScaleIn 0.3s
    var(--gui-transition-ios-spring, 400ms cubic-bezier(0.32, 0.72, 0, 1)) both;
}

@keyframes dialogScaleIn {
  from {
    opacity: 0;
    transform: scale(0.88);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.pc-settings__dialog-title {
  font-size: var(--gui-font-lg, 15px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-primary, #ffffff);
  text-align: center;
  margin: 0 0 var(--gui-spacing-sm, 8px);
}

.pc-settings__dialog-text {
  font-size: var(--gui-font-sm, 12px);
  color: var(--gui-text-secondary, #8e8e93);
  text-align: center;
  margin: 0 0 var(--gui-spacing-lg, 20px);
  line-height: var(--gui-line-height-base, 1.5);
}

.pc-settings__dialog-actions {
  display: flex;
  gap: var(--gui-spacing-sm, 8px);
}

.pc-settings__dialog-btn {
  flex: 1;
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-md, 12px);
  background: var(--gui-bg-surface, #2c2c2e);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-primary, #ffffff);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-semibold, 600);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
}

.pc-settings__dialog-btn:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
}

.pc-settings__dialog-btn--destructive {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.15));
  color: var(--gui-error, #ff3b30);
  border-color: transparent;
}

/* ── Dialog Transition ─────────────────────────────────────────────── */
.pc-settings-dialog-fade-enter-active {
  animation:
    overlayFadeIn 0.2s ease both,
    dialogScaleIn 0.3s var(--gui-transition-ios-spring, 400ms cubic-bezier(0.32, 0.72, 0, 1)) both;
}

.pc-settings-dialog-fade-leave-active {
  animation: overlayFadeOut 0.15s ease both;
}

@keyframes overlayFadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* ── Responsive ────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .pc-settings {
    flex-direction: column;
  }

  .pc-settings__sidebar {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    padding: var(--gui-spacing-sm, 8px);
    border-right: none;
    border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  }

  .pc-settings__nav-btn {
    white-space: nowrap;
    flex-shrink: 0;
  }

  .pc-settings__nav-label {
    display: none;
  }
}
</style>
