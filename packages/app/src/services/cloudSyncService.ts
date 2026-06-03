import { config } from '../config'
import { useAuthStore } from '../stores/authStore'
import indexedDBService from '../utils/indexedDB'
import type { UserPreferences } from '../gui/stores/preferencesStore'
import { PREF_DEFAULTS } from '../gui/stores/preferencesStore'
import { pluginSyncRegistry } from './pluginSyncRegistry'

const API_BASE = config.api.workerUrl

export interface CloudSyncSnapshot {
  version: 1 | 2
  exportedAt: string
  stores: Record<string, unknown[]>
  preferences?: UserPreferences
  pluginData?: Record<string, unknown>
}

function collectPreferencesFromLocalStorage(): UserPreferences {
  const themeId = localStorage.getItem('scp-os-selected-theme') || PREF_DEFAULTS.themeId
  const customAccent = localStorage.getItem('scp-os-custom-accent') || null

  let fontSize = PREF_DEFAULTS.fontSize
  let cursorBlink = PREF_DEFAULTS.cursorBlink
  let bootAnimation = PREF_DEFAULTS.bootAnimation
  let haptic = PREF_DEFAULTS.haptic
  let animations = PREF_DEFAULTS.animations
  try {
    const raw = localStorage.getItem('scp-os-app-settings')
    if (raw) {
      const s = JSON.parse(raw) as Record<string, unknown>
      if (typeof s.fontSize === 'number') fontSize = s.fontSize
      if (typeof s.cursorBlink === 'boolean') cursorBlink = s.cursorBlink
      if (typeof s.bootAnimation === 'boolean') bootAnimation = s.bootAnimation
      if (typeof s.haptic === 'boolean') haptic = s.haptic
      if (typeof s.animations === 'boolean') animations = s.animations
    }
  } catch {
    /* ignore */
  }

  let desktopIconSize = PREF_DEFAULTS.desktopIconSize
  const rawSize = localStorage.getItem('scp-os-desktop-icon-size')
  if (rawSize === 'large' || rawSize === 'medium' || rawSize === 'small') desktopIconSize = rawSize

  let desktopGridSnap = PREF_DEFAULTS.desktopGridSnap
  const rawSnap = localStorage.getItem('scp-os-grid-snap')
  if (rawSnap !== null) desktopGridSnap = rawSnap !== 'false'

  let desktopSortBy = PREF_DEFAULTS.desktopSortBy
  const rawSort = localStorage.getItem('scp-os-desktop-sort-by')
  if (rawSort === 'name' || rawSort === 'date') desktopSortBy = rawSort

  let taskbarPinned = PREF_DEFAULTS.taskbarPinned
  try {
    const rawPinned = localStorage.getItem('scp-os-taskbar-pinned')
    if (rawPinned) taskbarPinned = JSON.parse(rawPinned) as string[]
  } catch {
    /* ignore */
  }

  let homeOrder = PREF_DEFAULTS.homeOrder
  try {
    const rawOrder = localStorage.getItem('scp-os-home-order')
    if (rawOrder) homeOrder = JSON.parse(rawOrder) as string[]
  } catch {
    /* ignore */
  }

  return {
    themeId,
    customAccent,
    fontSize,
    cursorBlink,
    bootAnimation,
    haptic,
    animations,
    desktopIconSize,
    desktopGridSnap,
    desktopSortBy,
    taskbarPinned,
    homeOrder,
  }
}

export async function uploadAllLocalData(): Promise<{ success: boolean; error?: string }> {
  const authStore = useAuthStore()
  if (!authStore.canUseCloudSync) {
    return { success: false, error: '游客不能使用云同步' }
  }

  const preferences = collectPreferencesFromLocalStorage()
  await indexedDBService.saveSetting('ui_preferences', preferences)
  const pluginData = pluginSyncRegistry.collectAll()

  const snapshot: CloudSyncSnapshot = {
    version: 2,
    exportedAt: new Date().toISOString(),
    stores: await indexedDBService.exportAllData(),
    preferences,
    pluginData: Object.keys(pluginData).length > 0 ? pluginData : undefined,
  }

  const response = await authStore.authFetch(`${API_BASE}/api/sync/data`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.success) {
    return { success: false, error: data.error || data.message || `HTTP ${response.status}` }
  }
  return { success: true }
}

export async function downloadCloudData(): Promise<{ success: boolean; error?: string }> {
  const authStore = useAuthStore()
  if (!authStore.canUseCloudSync) {
    return { success: false, error: '游客不能使用云同步' }
  }

  const response = await authStore.authFetch(`${API_BASE}/api/sync/data`)
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    return { success: false, error: data.error || data.message || `HTTP ${response.status}` }
  }

  const snapshot = (await response.json()) as CloudSyncSnapshot | { success: boolean; data: null }
  if ('success' in snapshot && snapshot.data === null) {
    return { success: false, error: '云端暂无同步数据' }
  }
  if (!('stores' in snapshot) || (snapshot.version !== 1 && snapshot.version !== 2)) {
    return { success: false, error: '云端同步数据格式无效' }
  }

  await indexedDBService.importAllData(snapshot.stores)

  const prefs = extractPreferences(snapshot)
  if (prefs) {
    writePreferencesToLocalStorage(prefs)
  }
  if (snapshot.pluginData) {
    pluginSyncRegistry.applyAll(snapshot.pluginData)
  }

  return { success: true }
}

function extractPreferences(snapshot: CloudSyncSnapshot): Partial<UserPreferences> | null {
  if (snapshot.preferences) {
    return snapshot.preferences
  }
  const userSettings = snapshot.stores['user_settings'] as
    | Array<{ key: string; value: unknown }>
    | undefined
  const record = userSettings?.find((r) => r.key === 'ui_preferences')?.value
  if (record && typeof record === 'object') {
    return record as Partial<UserPreferences>
  }
  return null
}

function writePreferencesToLocalStorage(prefs: Partial<UserPreferences>): void {
  if (prefs.themeId) {
    localStorage.setItem('scp-os-selected-theme', prefs.themeId)
  }
  if (prefs.customAccent) {
    localStorage.setItem('scp-os-custom-accent', prefs.customAccent)
  } else if ('customAccent' in prefs) {
    localStorage.removeItem('scp-os-custom-accent')
  }

  const settingsRaw = localStorage.getItem('scp-os-app-settings')
  const settings = settingsRaw ? (JSON.parse(settingsRaw) as Record<string, unknown>) : {}
  if ('fontSize' in prefs) settings.fontSize = prefs.fontSize
  if ('cursorBlink' in prefs) settings.cursorBlink = prefs.cursorBlink
  if ('bootAnimation' in prefs) settings.bootAnimation = prefs.bootAnimation
  if ('haptic' in prefs) settings.haptic = prefs.haptic
  if ('animations' in prefs) settings.animations = prefs.animations
  localStorage.setItem('scp-os-app-settings', JSON.stringify(settings))

  if ('desktopIconSize' in prefs)
    localStorage.setItem('scp-os-desktop-icon-size', String(prefs.desktopIconSize))
  if ('desktopGridSnap' in prefs)
    localStorage.setItem('scp-os-grid-snap', String(prefs.desktopGridSnap))
  if ('desktopSortBy' in prefs)
    localStorage.setItem('scp-os-desktop-sort-by', String(prefs.desktopSortBy))
  if (prefs.taskbarPinned)
    localStorage.setItem('scp-os-taskbar-pinned', JSON.stringify(prefs.taskbarPinned))
  if (prefs.homeOrder) localStorage.setItem('scp-os-home-order', JSON.stringify(prefs.homeOrder))
}
