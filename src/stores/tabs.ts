import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import indexedDBService from '../utils/indexedDB'

export interface Tab {
  id: string
  title: string
  icon?: string
  isActive: boolean
  isLocked: boolean
  createdAt: number
  lastActiveAt: number
}

export const useTabsStore = defineStore('tabs', () => {
  // State
  const tabs = ref<Tab[]>([])
  const activeTabId = ref<string>('')
  const sidebarOpen = ref<boolean>(false)
  const isInitialized = ref<boolean>(false)

  // Computed
  const activeTab = computed(() => {
    return tabs.value.find(tab => tab.id === activeTabId.value) || null
  })

  const lockedTabs = computed(() => {
    return tabs.value.filter(tab => tab.isLocked)
  })

  const tabCount = computed(() => tabs.value.length)

  // Initialize store with IndexedDB
  const initialize = async () => {
    if (isInitialized.value) return

    try {
      // Initialize IndexedDB
      await indexedDBService.init()

      // Load tabs from IndexedDB
      const data = await indexedDBService.loadTabs()
      tabs.value = data.tabs || []
      activeTabId.value = data.activeTabId || ''
      sidebarOpen.value = data.sidebarOpen || false

      // If no tabs exist, create default tab
      if (tabs.value.length === 0) {
        createDefaultTab()
      }

      isInitialized.value = true
      console.log('[Tabs Store] Initialized with IndexedDB')
    } catch (error) {
      console.error('[Tabs Store] Failed to initialize:', error)
      // Fallback: create default tab
      createDefaultTab()
      isInitialized.value = true
    }
  }

  // Save tabs to IndexedDB
  const saveTabs = async () => {
    if (!isInitialized.value) return

    try {
      await indexedDBService.saveTabs(
        tabs.value,
        activeTabId.value,
        sidebarOpen.value
      )
    } catch (error) {
      console.error('[Tabs Store] Failed to save tabs:', error)
    }
  }

  // Create default tab
  const createDefaultTab = () => {
    const defaultTab: Tab = {
      id: generateTabId(),
      title: 'Main Terminal',
      isActive: true,
      isLocked: true,
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    }
    tabs.value = [defaultTab]
    activeTabId.value = defaultTab.id
    saveTabs()
  }

  // Generate tab ID
  const generateTabId = () => {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Create new tab
  const createTab = (title?: string) => {
    const newTab: Tab = {
      id: generateTabId(),
      title: title || `Terminal ${tabCount.value + 1}`,
      isActive: true,
      isLocked: false,
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    }

    // Set new tab as active
    tabs.value.forEach(tab => tab.isActive = false)
    tabs.value.push(newTab)
    activeTabId.value = newTab.id
    saveTabs()

    return newTab
  }

  // Switch tab
  const switchTab = (tabId: string) => {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tabs.value.forEach(t => t.isActive = false)
      tab.isActive = true
      tab.lastActiveAt = Date.now()
      activeTabId.value = tabId
      saveTabs()
    }
  }

  // Close tab
  const closeTab = (tabId: string) => {
    const tab = tabs.value.find(t => t.id === tabId)
    if (!tab) return false

    // Cannot close locked tabs
    if (tab.isLocked) {
      console.warn('[Tabs Store] Cannot close locked tab:', tabId)
      return false
    }

    // Remove tab
    const index = tabs.value.findIndex(t => t.id === tabId)
    tabs.value.splice(index, 1)

    // If closing active tab, switch to most recent tab
    if (tab.isActive && tabs.value.length > 0) {
      // Switch to most recently used tab
      const remainingTabs = tabs.value.filter(t => t.id !== tabId)
      const lastActive = remainingTabs
        .sort((a, b) => b.lastActiveAt - a.lastActiveAt)[0]
      if (lastActive) {
        switchTab(lastActive.id)
      }
    }

    // If no tabs left, create default tab
    if (tabs.value.length === 0) {
      createDefaultTab()
    }

    saveTabs()
    return true
  }

  // Rename tab
  const renameTab = (tabId: string, newTitle: string) => {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab && newTitle.trim()) {
      tab.title = newTitle.trim()
      saveTabs()
    }
  }

  // Toggle lock tab
  const toggleLockTab = (tabId: string) => {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.isLocked = !tab.isLocked
      saveTabs()
    }
  }

  // Toggle sidebar
  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
    saveTabs()
  }

  // Open sidebar
  const openSidebar = () => {
    sidebarOpen.value = true
    saveTabs()
  }

  // Close sidebar
  const closeSidebar = () => {
    sidebarOpen.value = false
    saveTabs()
  }

  // Clean up old unlocked tabs
  const cleanupOldTabs = async (maxAge: number = 7 * 24 * 60 * 60 * 1000) => {
    const now = Date.now()
    const toRemove: string[] = []

    tabs.value.forEach(tab => {
      if (!tab.isLocked && !tab.isActive && (now - tab.lastActiveAt) > maxAge) {
        toRemove.push(tab.id)
      }
    })

    // Remove tabs and their terminal states
    for (const tabId of toRemove) {
      closeTab(tabId)
      try {
        await indexedDBService.deleteTerminalState(tabId)
      } catch (error) {
        console.error('[Tabs Store] Failed to delete terminal state during cleanup:', error)
      }
    }
  }

  // Get tabs sorted by creation time
  const getTabsByCreationOrder = () => {
    return [...tabs.value].sort((a, b) => a.createdAt - b.createdAt)
  }

  // Get recently used tabs
  const getRecentTabs = (limit: number = 5) => {
    return [...tabs.value]
      .sort((a, b) => b.lastActiveAt - a.lastActiveAt)
      .slice(0, limit)
  }

  // Clear all tabs (for shutdown)
  const clearAllTabs = async () => {
    // Get all tab IDs before clearing
    const tabIds = tabs.value.map(tab => tab.id)
    
    // Delete all terminal states from IndexedDB
    for (const tabId of tabIds) {
      try {
        await indexedDBService.deleteTerminalState(tabId)
      } catch (error) {
        console.error('[Tabs Store] Failed to delete terminal state:', error)
      }
    }
    
    // Clear all tabs
    tabs.value = []
    activeTabId.value = ''
    
    // Save to IndexedDB
    saveTabs()
    
    console.log('[Tabs Store] All tabs cleared')
  }

  // Watch for tab changes and auto-save
  watch(tabs, () => {
    saveTabs()
  }, { deep: true })

  // Initialize (async)
  initialize()

  return {
    // State
    tabs,
    activeTabId,
    sidebarOpen,
    activeTab,
    lockedTabs,
    tabCount,
    isInitialized,

    // Methods
    initialize,
    createTab,
    switchTab,
    closeTab,
    renameTab,
    toggleLockTab,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    cleanupOldTabs,
    getTabsByCreationOrder,
    getRecentTabs,
    clearAllTabs
  }
})