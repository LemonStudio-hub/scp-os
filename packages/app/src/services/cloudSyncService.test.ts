import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  downloadCloudData,
  MAX_SNAPSHOT_BYTES,
  sanitizeStoresForSync,
  uploadAllLocalData,
} from './cloudSyncService'
import { pluginSyncRegistry } from './pluginSyncRegistry'

const mocks = vi.hoisted(() => ({
  authStore: {
    canUseCloudSync: true,
    authFetch: vi.fn(),
  },
  indexedDBService: {
    saveSetting: vi.fn(),
    loadSetting: vi.fn(),
    exportAllData: vi.fn(),
    importAllData: vi.fn(),
  },
}))

vi.mock('../config', () => ({
  config: {
    api: {
      workerUrl: 'https://api.test',
    },
  },
}))

vi.mock('../stores/authStore', () => ({
  useAuthStore: () => mocks.authStore,
}))

vi.mock('../utils/indexedDB', () => ({
  default: mocks.indexedDBService,
}))

vi.mock('../gui/stores/preferencesStore', () => ({
  PREF_DEFAULTS: {
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
  },
}))

function mockJsonResponse(body: unknown, init: { ok?: boolean; status?: number; headers?: Record<string, string> } = {}) {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    headers: {
      get: (name: string) => {
        const headers = init.headers || {}
        return headers[name] ?? headers[name.toLowerCase()] ?? null
      },
    },
    text: vi.fn().mockResolvedValue(text),
    json: vi.fn().mockResolvedValue(typeof body === 'string' ? JSON.parse(body) : body),
  }
}

describe('cloudSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mocks.authStore.canUseCloudSync = true
    mocks.indexedDBService.saveSetting.mockResolvedValue(undefined)
    mocks.indexedDBService.loadSetting.mockResolvedValue(null)
    mocks.indexedDBService.exportAllData.mockResolvedValue({ user_settings: [] })
    mocks.indexedDBService.importAllData.mockResolvedValue(undefined)
    for (const desc of pluginSyncRegistry.getAll()) {
      pluginSyncRegistry.unregister(desc.id)
    }
  })

  it('uploads a v2 snapshot with pluginData when registered plugin data exists', async () => {
    pluginSyncRegistry.register({
      id: 'weather-widget',
      localStorageKeys: ['weather-city'],
    })
    localStorage.setItem('weather-city', 'Shanghai')
    mocks.authStore.authFetch.mockResolvedValue(mockJsonResponse({ success: true }))

    const result = await uploadAllLocalData()

    expect(result).toEqual({ success: true })
    const [url, init] = mocks.authStore.authFetch.mock.calls[0] as [
      string,
      RequestInit & { body: string },
    ]
    expect(url).toBe('https://api.test/api/sync/data')
    expect(init.method).toBe('PUT')
    const snapshot = JSON.parse(init.body)
    expect(snapshot.version).toBe(2)
    expect(snapshot.pluginData).toEqual({
      'weather-widget': {
        'weather-city': 'Shanghai',
      },
    })
  })

  it('omits pluginData when no plugin data is collected', async () => {
    mocks.authStore.authFetch.mockResolvedValue(mockJsonResponse({ success: true }))

    await uploadAllLocalData()

    const init = mocks.authStore.authFetch.mock.calls[0][1] as RequestInit & { body: string }
    const snapshot = JSON.parse(init.body)
    expect(snapshot.version).toBe(2)
    expect(snapshot).not.toHaveProperty('pluginData')
  })

  it('strips auth_token from upload payload', async () => {
    mocks.indexedDBService.exportAllData.mockResolvedValue({
      user_settings: [
        { key: 'auth_token', value: 'secret-jwt' },
        { key: 'ui_preferences', value: { themeId: 'dark' } },
      ],
    })
    mocks.authStore.authFetch.mockResolvedValue(mockJsonResponse({ success: true }))

    await uploadAllLocalData()

    const init = mocks.authStore.authFetch.mock.calls[0][1] as RequestInit & { body: string }
    const snapshot = JSON.parse(init.body)
    expect(snapshot.stores.user_settings).toEqual([
      { key: 'ui_preferences', value: { themeId: 'dark' } },
    ])
  })

  it('downloads a v1 snapshot and skips plugin restore', async () => {
    pluginSyncRegistry.register({
      id: 'weather-widget',
      localStorageKeys: ['weather-city'],
    })
    mocks.authStore.authFetch.mockResolvedValue(
      mockJsonResponse({
        version: 1,
        exportedAt: '2026-06-03T00:00:00.000Z',
        stores: {
          user_settings: [
            {
              key: 'ui_preferences',
              value: {
                themeId: 'light',
              },
            },
          ],
        },
      })
    )

    const result = await downloadCloudData()

    expect(result).toEqual({ success: true })
    expect(mocks.indexedDBService.importAllData).toHaveBeenCalledWith({
      user_settings: [
        {
          key: 'ui_preferences',
          value: {
            themeId: 'light',
          },
        },
      ],
    })
    expect(localStorage.getItem('scp-os-selected-theme')).toBe('light')
    expect(localStorage.getItem('weather-city')).toBeNull()
  })

  it('downloads a v2 snapshot and applies pluginData', async () => {
    pluginSyncRegistry.register({
      id: 'weather-widget',
      localStorageKeys: ['weather-city'],
    })
    const applySpy = vi.spyOn(pluginSyncRegistry, 'applyAll')
    mocks.authStore.authFetch.mockResolvedValue(
      mockJsonResponse({
        version: 2,
        exportedAt: '2026-06-03T00:00:00.000Z',
        stores: {
          user_settings: [],
        },
        pluginData: {
          'weather-widget': {
            'weather-city': 'Shanghai',
          },
        },
      })
    )

    const result = await downloadCloudData()

    expect(result).toEqual({ success: true })
    expect(applySpy).toHaveBeenCalledWith({
      'weather-widget': {
        'weather-city': 'Shanghai',
      },
    })
    expect(localStorage.getItem('weather-city')).toBe('Shanghai')
    applySpy.mockRestore()
  })

  it('rejects snapshots with unsupported versions', async () => {
    mocks.authStore.authFetch.mockResolvedValue(
      mockJsonResponse({
        version: 99,
        exportedAt: '2026-06-03T00:00:00.000Z',
        stores: {},
      })
    )

    const result = await downloadCloudData()

    expect(result.success).toBe(false)
    expect(result.error).toBe('sync.invalidFormat')
    expect(mocks.indexedDBService.importAllData).not.toHaveBeenCalled()
  })

  it('rejects oversized snapshots before import', async () => {
    const oversized = JSON.stringify({
      version: 2,
      exportedAt: '2026-06-03T00:00:00.000Z',
      stores: { user_settings: [] },
    })
    mocks.authStore.authFetch.mockResolvedValue(
      mockJsonResponse(oversized, {
        headers: { 'Content-Length': String(MAX_SNAPSHOT_BYTES + 1) },
      })
    )

    const result = await downloadCloudData()

    expect(result).toEqual({ success: false, error: 'sync.snapshotTooLarge' })
    expect(mocks.indexedDBService.importAllData).not.toHaveBeenCalled()
  })

  it('preserves local auth settings after download', async () => {
    mocks.indexedDBService.loadSetting.mockImplementation(async (key: string) => {
      if (key === 'auth_token') return 'local-token'
      if (key === 'auth_email') return 'user@example.com'
      if (key === 'account_type') return 'registered'
      if (key === 'nickname') return 'Agent'
      return null
    })
    mocks.authStore.authFetch.mockResolvedValue(
      mockJsonResponse({
        version: 2,
        exportedAt: '2026-06-03T00:00:00.000Z',
        stores: {
          user_settings: [{ key: 'auth_token', value: 'cloud-should-not-win' }],
        },
      })
    )

    await downloadCloudData()

    expect(mocks.indexedDBService.importAllData).toHaveBeenCalledWith({
      user_settings: [],
    })
    expect(mocks.indexedDBService.saveSetting).toHaveBeenCalledWith('auth_token', 'local-token')
    expect(mocks.indexedDBService.saveSetting).toHaveBeenCalledWith(
      'auth_email',
      'user@example.com'
    )
    expect(mocks.indexedDBService.saveSetting).toHaveBeenCalledWith('account_type', 'registered')
    expect(mocks.indexedDBService.saveSetting).toHaveBeenCalledWith('nickname', 'Agent')
  })

  it('sanitizeStoresForSync removes only sensitive keys', () => {
    const stores = sanitizeStoresForSync({
      user_settings: [
        { key: 'auth_token', value: 'x' },
        { key: 'theme', value: 'dark' },
      ],
      tabs: [{ id: 1 }],
    })
    expect(stores.user_settings).toEqual([{ key: 'theme', value: 'dark' }])
    expect(stores.tabs).toEqual([{ id: 1 }])
  })
})
