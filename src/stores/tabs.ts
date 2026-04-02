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
  // 状态
  const tabs = ref<Tab[]>([])
  const activeTabId = ref<string>('')
  const sidebarOpen = ref<boolean>(false)

  // 计算属性
  const activeTab = computed(() => {
    return tabs.value.find(tab => tab.id === activeTabId.value) || null
  })

  const lockedTabs = computed(() => {
    return tabs.value.filter(tab => tab.isLocked)
  })

  const tabCount = computed(() => tabs.value.length)

  // 从 localStorage 加载标签页
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
      // 如果加载失败，创建默认标签页
      createDefaultTab()
    }
  }

  // 保存标签页到 localStorage
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

  // 创建默认标签页
  const createDefaultTab = () => {
    const defaultTab: Tab = {
      id: generateTabId(),
      title: '主终端',
      isActive: true,
      isLocked: true,
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    }
    tabs.value = [defaultTab]
    activeTabId.value = defaultTab.id
    saveTabs()
  }

  // 生成标签页 ID
  const generateTabId = () => {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 创建新标签页
  const createTab = (title?: string) => {
    const newTab: Tab = {
      id: generateTabId(),
      title: title || `终端 ${tabCount.value + 1}`,
      isActive: true,
      isLocked: false,
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    }

    // 将新标签页设置为活动标签
    tabs.value.forEach(tab => tab.isActive = false)
    tabs.value.push(newTab)
    activeTabId.value = newTab.id
    saveTabs()

    return newTab
  }

  // 切换标签页
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

  // 关闭标签页
  const closeTab = (tabId: string) => {
    const tab = tabs.value.find(t => t.id === tabId)
    if (!tab) return false

    // 不允许关闭锁定的标签页
    if (tab.isLocked) {
      console.warn('[Tabs Store] Cannot close locked tab:', tabId)
      return false
    }

    // 移除标签页
    const index = tabs.value.findIndex(t => t.id === tabId)
    tabs.value.splice(index, 1)

    // 如果关闭的是活动标签页，切换到最近的标签页
    if (tab.isActive && tabs.value.length > 0) {
      // 优先切换到最近使用的标签页
      const remainingTabs = tabs.value.filter(t => t.id !== tabId)
      const lastActive = remainingTabs
        .sort((a, b) => b.lastActiveAt - a.lastActiveAt)[0]
      if (lastActive) {
        switchTab(lastActive.id)
      }
    }

    // 如果没有标签页了，创建新的默认标签页
    if (tabs.value.length === 0) {
      createDefaultTab()
    }

    saveTabs()
    return true
  }

  // 重命名标签页
  const renameTab = (tabId: string, newTitle: string) => {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab && newTitle.trim()) {
      tab.title = newTitle.trim()
      saveTabs()
    }
  }

  // 锁定/解锁标签页
  const toggleLockTab = (tabId: string) => {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.isLocked = !tab.isLocked
      saveTabs()
    }
  }

  // 切换侧边栏
  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
    saveTabs()
  }

  // 打开侧边栏
  const openSidebar = () => {
    sidebarOpen.value = true
    saveTabs()
  }

  // 关闭侧边栏
  const closeSidebar = () => {
    sidebarOpen.value = false
    saveTabs()
  }

  // 清理过期的未锁定标签页
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

  // 获取标签页列表（按创建时间排序）
  const getTabsByCreationOrder = () => {
    return [...tabs.value].sort((a, b) => a.createdAt - b.createdAt)
  }

  // 获取最近使用的标签页
  const getRecentTabs = (limit: number = 5) => {
    return [...tabs.value]
      .sort((a, b) => b.lastActiveAt - a.lastActiveAt)
      .slice(0, limit)
  }

  // 监听标签页变化，自动保存
  watch(tabs, () => {
    saveTabs()
  }, { deep: true })

  // 初始化
  loadTabs()

  return {
    // 状态
    tabs,
    activeTabId,
    sidebarOpen,
    activeTab,
    lockedTabs,
    tabCount,
    
    // 方法
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