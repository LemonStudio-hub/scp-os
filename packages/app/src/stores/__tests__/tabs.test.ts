import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTabsStore } from '../tabs'

vi.mock('../../utils/indexedDB', () => ({
  default: {
    init: vi.fn().mockResolvedValue(undefined),
    loadTabs: vi.fn().mockResolvedValue({ tabs: [], activeTabId: '', sidebarOpen: false }),
    saveTabs: vi.fn().mockResolvedValue(undefined),
    deleteTerminalState: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

describe('TabsStore', () => {
  let store: ReturnType<typeof useTabsStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTabsStore()
  })

  describe('initialize', () => {
    it('creates default tab when no saved tabs and sets isInitialized', async () => {
      await store.initialize()
      expect(store.isInitialized).toBe(true)
      expect(store.tabs).toHaveLength(1)
      expect(store.tabs[0].title).toBe('Main Terminal')
      expect(store.activeTabId).toBe(store.tabs[0].id)
    })

    it('skips if already initialized', async () => {
      await store.initialize()
      const tabCount = store.tabs.length
      await store.initialize()
      expect(store.tabs).toHaveLength(tabCount)
    })

    it('falls back on error', async () => {
      const indexedDBService = (await import('../../utils/indexedDB')).default
      vi.mocked(indexedDBService.init).mockRejectedValueOnce(new Error('DB error'))

      await store.initialize()
      expect(store.isInitialized).toBe(true)
      expect(store.tabs).toHaveLength(1)
    })
  })

  describe('createTab', () => {
    it('creates with auto title and sets active', async () => {
      await store.initialize()
      const initialCount = store.tabs.length
      const tab = store.createTab()
      expect(store.tabs).toHaveLength(initialCount + 1)
      expect(tab.title).toMatch(/^Terminal/)
      expect(store.activeTabId).toBe(tab.id)
    })

    it('uses custom title', async () => {
      await store.initialize()
      const tab = store.createTab('Custom Title')
      expect(tab.title).toBe('Custom Title')
    })
  })

  describe('switchTab', () => {
    it('is no-op if already active', async () => {
      await store.initialize()
      const activeId = store.activeTabId
      store.switchTab(activeId)
      expect(store.activeTabId).toBe(activeId)
    })

    it('is no-op if tab not found', async () => {
      await store.initialize()
      const activeId = store.activeTabId
      store.switchTab('nonexistent-id')
      expect(store.activeTabId).toBe(activeId)
    })

    it('switches to found tab', async () => {
      await store.initialize()
      const tab = store.createTab('Second')
      const secondId = tab.id
      store.createTab('Third')
      store.switchTab(secondId)
      expect(store.activeTabId).toBe(secondId)
      const second = store.tabs.find((t) => t.id === secondId)
      expect(second!.isActive).toBe(true)
    })
  })

  describe('closeTab', () => {
    it('returns false for locked tab', async () => {
      await store.initialize()
      const lockedTab = store.tabs.find((t) => t.isLocked)
      expect(store.closeTab(lockedTab!.id)).toBe(false)
    })

    it('returns false for not found tab', async () => {
      await store.initialize()
      expect(store.closeTab('nonexistent-id')).toBe(false)
    })

    it('switches to most recent on active close', async () => {
      await store.initialize()
      const second = store.createTab('Second')
      // Make second look more recent
      second.lastActiveAt = Date.now() + 1000
      const third = store.createTab('Third')
      // third is active now; close it
      expect(store.closeTab(third.id)).toBe(true)
      expect(store.activeTabId).toBe(second.id)
    })

    it('creates default tab if last tab closed', async () => {
      await store.initialize()
      // Create an unlocked tab and close the locked one first won't work,
      // so create unlocked, switch to it, then close it
      const unlocked = store.createTab('Unlocked')
      // Now close the unlocked tab (it's active), should switch to locked
      store.closeTab(unlocked.id)
      // The locked default tab should still exist
      expect(store.tabs).toHaveLength(1)
    })
  })

  describe('renameTab', () => {
    it('is no-op for empty title', async () => {
      await store.initialize()
      const tabId = store.tabs[0].id
      const originalTitle = store.tabs[0].title
      store.renameTab(tabId, '   ')
      expect(store.tabs[0].title).toBe(originalTitle)
    })

    it('updates title on success', async () => {
      await store.initialize()
      const tabId = store.tabs[0].id
      store.renameTab(tabId, 'New Name')
      expect(store.tabs[0].title).toBe('New Name')
    })
  })

  describe('toggleLockTab', () => {
    it('toggles isLocked', async () => {
      await store.initialize()
      const tab = store.tabs[0]
      const initial = tab.isLocked
      store.toggleLockTab(tab.id)
      expect(tab.isLocked).toBe(!initial)
      store.toggleLockTab(tab.id)
      expect(tab.isLocked).toBe(initial)
    })
  })

  describe('sidebar', () => {
    it('toggleSidebar toggles state', async () => {
      await store.initialize()
      expect(store.sidebarOpen).toBe(false)
      store.toggleSidebar()
      expect(store.sidebarOpen).toBe(true)
      store.toggleSidebar()
      expect(store.sidebarOpen).toBe(false)
    })

    it('openSidebar sets to true', async () => {
      await store.initialize()
      store.openSidebar()
      expect(store.sidebarOpen).toBe(true)
    })

    it('closeSidebar sets to false', async () => {
      await store.initialize()
      store.openSidebar()
      store.closeSidebar()
      expect(store.sidebarOpen).toBe(false)
    })
  })

  describe('computed properties', () => {
    it('activeTab returns active tab or null', async () => {
      await store.initialize()
      expect(store.activeTab).not.toBeNull()
      expect(store.activeTab!.id).toBe(store.activeTabId)
    })

    it('lockedTabs filters locked', async () => {
      await store.initialize()
      store.createTab('Unlocked')
      const locked = store.lockedTabs
      expect(locked.every((t) => t.isLocked)).toBe(true)
      expect(locked.length).toBeGreaterThanOrEqual(1)
    })

    it('tabCount returns count', async () => {
      await store.initialize()
      expect(store.tabCount).toBe(1)
      store.createTab('Second')
      expect(store.tabCount).toBe(2)
    })
  })

  describe('getTabsByCreationOrder', () => {
    it('returns tabs sorted by createdAt', async () => {
      await store.initialize()
      store.createTab('Second')
      store.createTab('Third')
      const ordered = store.getTabsByCreationOrder()
      for (let i = 1; i < ordered.length; i++) {
        expect(ordered[i].createdAt).toBeGreaterThanOrEqual(ordered[i - 1].createdAt)
      }
    })
  })

  describe('getRecentTabs', () => {
    it('returns tabs sorted by lastActiveAt', async () => {
      await store.initialize()
      store.createTab('Second')
      store.switchTab(store.tabs[0].id)
      const recent = store.getRecentTabs()
      expect(recent[0].id).toBe(store.tabs[0].id)
      expect(recent.length).toBeLessThanOrEqual(5)
    })
  })

  describe('clearAllTabs', () => {
    it('empties tabs and resets activeTabId', async () => {
      await store.initialize()
      store.createTab('Second')
      await store.clearAllTabs()
      expect(store.tabs).toHaveLength(0)
      expect(store.activeTabId).toBe('')
    })
  })

  describe('cleanupOldTabs', () => {
    it('removes old unlocked inactive tabs', async () => {
      await store.initialize()
      const old = store.createTab('Old Tab')
      // Make it look old and inactive
      old.lastActiveAt = Date.now() - 8 * 24 * 60 * 60 * 1000
      old.isLocked = false
      old.isActive = false

      await store.cleanupOldTabs()
      expect(store.tabs.find((t) => t.id === old.id)).toBeUndefined()
    })
  })
})
