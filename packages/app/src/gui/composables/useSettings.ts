import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from './useI18n'
import { useTerminalStore } from '../../stores/terminal'
import { useThemeStore } from '../stores/themeStore'
import indexedDBService from '../../utils/indexedDB'
import { localeNames } from '../../locales'

export interface AppSettings {
  fontSize: number
  cursorBlink: boolean
  bootAnimation: boolean
  haptic: boolean
  animations: boolean
  accent: string
}

export interface ConfirmDialog {
  title: string
  text: string
  confirmText: string
  action: () => void
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

export function useSettings() {
  const { t, locale, availableLocales } = useI18n()
  const terminalStore = useTerminalStore()
  const themeStore = useThemeStore()

  themeStore.init()

  const userId = ref<string>('Loading...')
  indexedDBService
    .getUserId()
    .then((id) => {
      userId.value = id
    })
    .catch(() => {
      userId.value = 'Unknown'
    })

  const wallpaperPickerVisible = ref(false)
  const currentWallpaperName = ref<string>('None')

  async function loadWallpaperName() {
    try {
      const { wallpaperService } = await import('../../utils/wallpaperService')
      await wallpaperService.init()
      const id = wallpaperService.getCurrentWallpaperId()
      if (id) {
        const wp = await wallpaperService.getWallpaper(id)
        currentWallpaperName.value = wp?.name || t('common.none')
      } else {
        currentWallpaperName.value = t('common.none')
      }
    } catch {
      // Silently fail
    }
  }

  loadWallpaperName()

  const currentLanguageName = computed(() => localeNames[locale.value] || 'English')

  function openLanguagePicker() {
    triggerHaptic()
    sliderSheets.language = true
  }

  function selectLanguage(loc: 'en' | 'zh-CN') {
    locale.value = loc
    triggerHaptic()
    sliderSheets.language = false
    setTimeout(() => {
      loadWallpaperName()
    }, 100)
  }

  function onWallpaperChange(wallpaperId: string | null) {
    window.dispatchEvent(new CustomEvent('wallpaper-changed', { detail: { wallpaperId } }))
    loadWallpaperName()
  }

  const FONT_SIZE_MIN = 10
  const FONT_SIZE_MAX = 22
  /** Base token sizes (px) at default fontSize=14 — must stay in step. */
  const FONT_TOKEN_BASE: Record<string, number> = {
    '--gui-font-xs': 11,
    '--gui-font-sm': 12,
    '--gui-font-base': 13,
    '--gui-font-md': 14,
    '--gui-font-lg': 15,
    '--gui-font-xl': 17,
    '--gui-font-2xl': 22,
    '--gui-font-3xl': 28,
  }

  function clampFontSize(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n)) return defaultSettings.fontSize
    return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(n)))
  }

  function loadSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = { ...defaultSettings, ...JSON.parse(raw) } as AppSettings
        parsed.fontSize = clampFontSize(parsed.fontSize)
        return parsed
      }
    } catch {
      /* ignore */
    }
    return { ...defaultSettings }
  }

  const settings = reactive<AppSettings>(loadSettings())

  let prevFontSize = settings.fontSize
  applySettings()

  watch(
    settings,
    () => {
      settings.fontSize = clampFontSize(settings.fontSize)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      applySettings()
    },
    { deep: true }
  )

  function getActiveTerminal() {
    return window.__terminalInstance?.terminal || null
  }

  function applySettings(): void {
    const scale = clampFontSize(settings.fontSize) / defaultSettings.fontSize
    const root = document.documentElement
    // Scale all 8 type tokens (including 2xl/3xl). Keep one decimal so adjacent steps stay distinct.
    for (const [token, base] of Object.entries(FONT_TOKEN_BASE)) {
      const px = Math.max(1, Math.round(base * scale * 10) / 10)
      root.style.setProperty(token, `${px}px`)
    }

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

  function resetFontSize(): void {
    settings.fontSize = defaultSettings.fontSize
  }

  const sliderSheets = reactive({ fontSize: false, language: false })
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
      ;(settings[key] as boolean) = !(settings[key] as boolean)
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
    triggerHaptic()
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
    triggerHaptic()
  }

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

  const buildDate = computed(() => '2026-04-04')

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return {
    t,
    locale,
    availableLocales,
    themeStore,
    settings,
    userId,
    wallpaperPickerVisible,
    currentWallpaperName,
    currentLanguageName,
    sliderSheets,
    sliderValues,
    confirmDialog,
    storageUsed,
    terminalStateCount,
    buildDate,
    loadWallpaperName,
    openLanguagePicker,
    selectLanguage,
    onWallpaperChange,
    openSlider,
    onFontSizeChange,
    resetFontSize,
    toggleSetting,
    triggerHaptic,
    confirmClearData,
    clearAllData,
    confirmResetSettings,
    resetSettings,
    formatBytes,
  }
}
