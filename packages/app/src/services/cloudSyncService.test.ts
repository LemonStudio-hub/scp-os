import { beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadCloudData, uploadAllLocalData } from './cloudSyncService'
import { pluginSyncRegistry } from './pluginSyncRegistry'

const mocks = vi.hoisted(() => ({
  authStore: {
    canUseCloudSync: true,
    authFetch: vi.fn(),
  },
  indexedDBService: {
    saveSetting: vi.fn(),
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

describe('cloudSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mocks.authStore.canUseCloudSync = true
    mocks.indexedDBService.saveSetting.mockResolvedValue(undefined)
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
    mocks.authStore.authFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true }),
    })

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
    mocks.authStore.authFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true }),
    })

    await uploadAllLocalData()

    const init = mocks.authStore.authFetch.mock.calls[0][1] as RequestInit & { body: string }
    const snapshot = JSON.parse(init.body)
    expect(snapshot.version).toBe(2)
    expect(snapshot).not.toHaveProperty('pluginData')
  })

  it('downloads a v1 snapshot and skips plugin restore', async () => {
    pluginSyncRegistry.register({
      id: 'weather-widget',
      localStorageKeys: ['weather-city'],
    })
    mocks.authStore.authFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
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
      }),
    })

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
    mocks.authStore.authFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
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
      }),
    })

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
    mocks.authStore.authFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        version: 99,
        exportedAt: '2026-06-03T00:00:00.000Z',
        stores: {},
      }),
    })

    const result = await downloadCloudData()

    expect(result.success).toBe(false)
    expect(result.error).toBe('云端同步数据格式无效')
    expect(mocks.indexedDBService.importAllData).not.toHaveBeenCalled()
  })
})
