import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface Tab {
  id: string
  title: string
  icon?: string
  isActive: boolean
  isLocked: boolean
  createdAt: number
  lastActiveAt: number
}

const STORAGE_KEY = 'scp-terminal-tabs'

export const useTabsStore = defineStore('tabs', () => {
  // State
  const tabs = ref<Tab[]>([])
  const activeTabId = ref<string>('')
  const sidebarOpen = ref<boolean>(false)

  // Computed
  const activeTab = computed(() => {
    return tabs.value.find(tab => tab.id === activeTabId.value) || null
  })

  const lockedTabs = computed(() => {
    return tabs.value.filter(tab => tab.isLocked)
  })

  const tabCount = computed(() => tabs.value.length)

  // Load tabs from localStorage
  const loadTabs = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        tabs.value = parsed.tabs || []
        activeTabId.value = parsed.activeTabId || ''
        sidebarOpen.value = parsed.sidebarOpen || false
      }
    } catch (error) {
      console.error('[Tabs Store] Failed to load tabs:', error)
      // Create default tab if loading fails
      createDefaultTab()
    }
  }

  // Save tabs to localStorage
  const saveTabs = () => {
    try {
      const data = {
        tabs: tabs.value,
        activeTabId: activeTabId.value,
        sidebarOpen: sidebarOpen.value
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
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
  const cleanupOldTabs = (maxAge: number = 7 * 24 * 60 * 60 * 1000) => {
    const now = Date.now()
    const toRemove: string[] = []

    tabs.value.forEach(tab => {
      if (!tab.isLocked && !tab.isActive && (now - tab.lastActiveAt) > maxAge) {
        toRemove.push(tab.id)
      }
    })

    toRemove.forEach(tabId => {
      closeTab(tabId)
    })
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

  // Watch for tab changes and auto-save
  watch(tabs, () => {
    saveTabs()
  }, { deep: true })

  // Initialize
  loadTabs()

  return {
    // State
    tabs,
    activeTabId,
    sidebarOpen,
    activeTab,
    lockedTabs,
    tabCount,
    
    // Methods
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
    getRecentTabs
  }
})