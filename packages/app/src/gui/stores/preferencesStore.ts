import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import indexedDBService from '../../utils/indexedDB'

const PREFS_IDB_KEY = 'ui_preferences'

// localStorage keys kept only as a fast-paint cache for themeStore's sync boot read
const LS_THEME = 'scp-os-selected-theme'
const LS_ACCENT = 'scp-os-custom-accent'

export interface UserPreferences {
  themeId: string
  customAccent: string | null
  fontSize: number
  cursorBlink: boolean
  bootAnimation: boolean
  haptic: boolean
  animations: boolean
  desktopIconSize: 'large' | 'medium' | 'small'
  desktopGridSnap: boolean
  desktopSortBy: 'name' | 'date'
  taskbarPinned: string[]
  homeOrder: string[]
}

export const PREF_DEFAULTS: UserPreferences = {
  themeId: 'dark',
  customAccent: null,
  fontSize: 14,
  cursorBlink: true,
  bootAnimation: true,
  haptic: true,
  animations: true,
  desktopIconSize: 'medium',
  desktopGridSnap: true,
  desktopSortBy: 'name',
  taskbarPinned: ['terminal', 'filemanager', 'editor'],
  homeOrder: [],
}

function migrateFromLocalStorage(): Partial<UserPreferences> {
  const out: Partial<UserPreferences> = {}
  try {
    const theme = localStorage.getItem(LS_THEME)
    if (theme) out.themeId = theme

    const accent = localStorage.getItem(LS_ACCENT)
    if (accent) out.customAccent = accent

    const raw = localStorage.getItem('scp-os-app-settings')
    if (raw) {
      const s = JSON.parse(raw) as Record<string, unknown>
      if (typeof s.fontSize === 'number') out.fontSize = s.fontSize
      if (typeof s.cursorBlink === 'boolean') out.cursorBlink = s.cursorBlink
      if (typeof s.bootAnimation === 'boolean') out.bootAnimation = s.bootAnimation
      if (typeof s.haptic === 'boolean') out.haptic = s.haptic
      if (typeof s.animations === 'boolean') out.animations = s.animations
    }

    const pinned = localStorage.getItem('scp-os-taskbar-pinned')
    if (pinned) out.taskbarPinned = JSON.parse(pinned) as string[]

    const snap = localStorage.getItem('scp-os-grid-snap')
    if (snap !== null) out.desktopGridSnap = snap !== 'false'

    const size = localStorage.getItem('scp-os-desktop-icon-size')
    if (size === 'large' || size === 'medium' || size === 'small') out.desktopIconSize = size

    const sort = localStorage.getItem('scp-os-desktop-sort-by')
    if (sort === 'name' || sort === 'date') out.desktopSortBy = sort

    const order = localStorage.getItem('scp-os-home-order')
    if (order) out.homeOrder = JSON.parse(order) as string[]
  } catch {
    // ignore
  }
  return out
}

export const usePreferencesStore = defineStore('preferences', () => {
  const prefs = reactive<UserPreferences>({ ...PREF_DEFAULTS })
  const ready = ref(false)
  // Track keys explicitly set before init() finishes, so init() doesn't overwrite them
  const preInitOverrides: Partial<UserPreferences> = {}

  function syncLocalStorageCache(): void {
    try {
      localStorage.setItem(LS_THEME, prefs.themeId)
      if (prefs.customAccent) {
        localStorage.setItem(LS_ACCENT, prefs.customAccent)
      } else {
        localStorage.removeItem(LS_ACCENT)
      }
    } catch {
      // ignore
    }
  }

  async function init(): Promise<void> {
    if (ready.value) return
    try {
      const saved = (await indexedDBService.loadSetting(PREFS_IDB_KEY)) as UserPreferences | null
      if (saved && typeof saved === 'object') {
        // preInitOverrides wins over IDB — set() called before init() completes is authoritative
        Object.assign(prefs, { ...PREF_DEFAULTS, ...saved, ...preInitOverrides })
      } else {
        Object.assign(prefs, {
          ...PREF_DEFAULTS,
          ...migrateFromLocalStorage(),
          ...preInitOverrides,
        })
        await indexedDBService.saveSetting(PREFS_IDB_KEY, { ...prefs })
      }
    } catch {
      Object.assign(prefs, { ...PREF_DEFAULTS, ...migrateFromLocalStorage(), ...preInitOverrides })
    }
    syncLocalStorageCache()
    ready.value = true
  }

  async function set<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): Promise<void> {
    if ((prefs[key] as unknown) === value) return
    ;(prefs[key] as UserPreferences[K]) = value
    if (!ready.value) {
      // Record pre-init changes so init() doesn't overwrite them when it finishes
      ;(preInitOverrides[key] as UserPreferences[K]) = value
    }
    if (key === 'themeId' || key === 'customAccent') syncLocalStorageCache()
    await indexedDBService.saveSetting(PREFS_IDB_KEY, { ...prefs }).catch(() => {})
  }

  // Called after cloud download: re-reads IDB and syncs the localStorage paint cache
  async function reload(): Promise<void> {
    ready.value = false
    try {
      const saved = (await indexedDBService.loadSetting(PREFS_IDB_KEY)) as UserPreferences | null
      if (saved && typeof saved === 'object') {
        Object.assign(prefs, { ...PREF_DEFAULTS, ...saved })
      } else {
        // Old cloud snapshot had no ui_preferences — migrate from localStorage
        // so we don't overwrite theme/accent with defaults
        Object.assign(prefs, { ...PREF_DEFAULTS, ...migrateFromLocalStorage() })
        await indexedDBService.saveSetting(PREFS_IDB_KEY, { ...prefs }).catch(() => {})
      }
    } catch {
      // ignore
    }
    syncLocalStorageCache()
    ready.value = true
  }

  return { prefs, ready, init, set, reload }
})
