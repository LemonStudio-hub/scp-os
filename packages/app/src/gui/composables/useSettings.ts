import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useTerminalStore } from '../../stores/terminal'
import indexedDBService from '../../utils/indexedDB'
import { useCloudQuota, type CloudQuota } from './useCloudQuota'
import { useI18n } from './useI18n'
import type { AppSettings } from '../types/settings'

interface ConfirmDialog {
  title: string
  text: string
  confirmText: string
  action: () => void
}

export const SETTINGS_STORAGE_KEY = 'scp-os-app-settings'

export const defaultSettings: AppSettings = {
  fontSize: 14,
  cursorBlink: true,
  bootAnimation: true,
  haptic: true,
  animations: true,
  accent: '#8e8e93',
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    // ignore
  }
  return { ...defaultSettings }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function useSettings() {
  const { t } = useI18n()
  const terminalStore = useTerminalStore()
  const settings = reactive<AppSettings>(loadSettings())
  const confirmDialog = ref<ConfirmDialog | null>(null)
  const storageUsed = ref('--')
  const userId = ref<string>(t('common.loading'))
  const { quota: cloudQuota, refresh: refreshCloudQuota } = useCloudQuota()

  let prevFontSize = settings.fontSize

  watch(
    settings,
    () => {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
      applySettings()
    },
    { deep: true }
  )

  onMounted(() => {
    void loadUserId()
    void calculateStorageUsed()
    void refreshCloudQuota()
  })

  async function loadUserId(): Promise<void> {
    try {
      userId.value = await indexedDBService.getUserId()
    } catch {
      userId.value = t('common.unknown')
    }
  }

  function getActiveTerminal() {
    return window.__terminalInstance?.terminal || null
  }

  function applySettings(): void {
    const scale = settings.fontSize / defaultSettings.fontSize
    const root = document.documentElement
    root.style.setProperty('--gui-font-xs', `${Math.round(11 * scale)}px`)
    root.style.setProperty('--gui-font-sm', `${Math.round(12 * scale)}px`)
    root.style.setProperty('--gui-font-base', `${Math.round(13 * scale)}px`)
    root.style.setProperty('--gui-font-md', `${Math.round(14 * scale)}px`)
    root.style.setProperty('--gui-font-lg', `${Math.round(15 * scale)}px`)
    root.style.setProperty('--gui-font-xl', `${Math.round(17 * scale)}px`)

    const terminal = getActiveTerminal()
    if (settings.fontSize !== prevFontSize && terminal) {
      terminalStore.fontSize = settings.fontSize
      try {
        terminal.options.fontSize = settings.fontSize
        terminal.refresh(0, terminal.rows - 1)
      } catch {
        // ignore
      }
      prevFontSize = settings.fontSize
    }
  }

  async function calculateStorageUsed(): Promise<void> {
    let total = 0
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += (localStorage[key].length + key.length) * 2
      }
    }
    try {
      await indexedDBService.init()
      total += await indexedDBService.getStorageSize()
    } catch {
      // ignore
    }
    storageUsed.value = formatBytes(total)
  }

  const terminalStateCount = computed(() => {
    let count = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || ''
      if (key.startsWith('scp-terminal-state-')) count++
    }
    return count
  })

  function formatCloudQuota(q: CloudQuota | null): string {
    if (!q) return '-'
    return `${formatBytes(q.used)} / ${formatBytes(q.max)} (${q.percent}%)`
  }

  function formatCloudFiles(q: CloudQuota | null): string {
    if (!q) return '-'
    return `${q.count} files`
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
      confirmText: t('settings.resetContinue'),
      action: confirmResetSettingsFinal,
    }
  }

  function confirmResetSettingsFinal(): void {
    triggerHaptic()
    confirmDialog.value = {
      title: t('settings.resetFinalTitle'),
      text: t('settings.resetFinalMsg'),
      confirmText: t('settings.reset'),
      action: resetSettings,
    }
  }

  function resetSettings(): void {
    Object.assign(settings, { ...defaultSettings })
    confirmDialog.value = null
    triggerHaptic()
  }

  return {
    settings,
    defaultSettings,
    confirmDialog,
    storageUsed,
    cloudQuota,
    userId,
    terminalStateCount,
    refreshCloudQuota,
    loadUserId,
    applySettings,
    calculateStorageUsed,
    formatCloudQuota,
    formatCloudFiles,
    toggleSetting,
    triggerHaptic,
    confirmClearData,
    clearAllData,
    confirmResetSettings,
    confirmResetSettingsFinal,
    resetSettings,
    formatBytes,
  }
}
