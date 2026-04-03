/**
 * Refactored Tabs Composable
 * Uses dependency injection and event-driven architecture
 */

import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { ITabRepository } from '../domain/repositories'
import { TabEntity } from '../domain/entities'
import type { TabType } from '../domain/entities'
import { getGlobalContainer } from '../core/container'
import { getGlobalEventBus } from '../platform/events/event-bus'
import { v4 as uuidv4 } from 'uuid'

/**
 * Tabs Composable
 * Refactored to use dependency injection and event bus
 */
export function useTabsRefactored() {
  const tabs = ref<TabEntity[]>([])
  const activeTabId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // Inject dependencies
  const tabRepository = getGlobalContainer().resolve<ITabRepository>('TabRepository')
  const eventBus = getGlobalEventBus()

  // Load tabs
  const loadTabs = async () => {
    loading.value = true
    error.value = null

    try {
      const allTabs = await tabRepository.getAll()
      tabs.value = allTabs

      const activeTab = await tabRepository.getActive()
      if (activeTab) {
        activeTabId.value = activeTab.id
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('[useTabs] Failed to load tabs:', err)
    } finally {
      loading.value = false
    }
  }

  // Create a new tab
  const createTab = async (
    title: string,
    type: TabType = 'terminal',
    options?: {
      icon?: string
      closable?: boolean
      data?: Record<string, any>
    }
  ): Promise<TabEntity> => {
    const tab = new TabEntity({
      id: uuidv4(),
      title,
      type,
      status: 'active',
      icon: options?.icon,
      closable: options?.closable ?? true,
      data: options?.data ?? {}
    })

    try {
      await tabRepository.save(tab)
      await tabRepository.setActive(tab.id)

      // Update local state
      tabs.value.push(tab)
      activeTabId.value = tab.id

      // Emit event
      eventBus.emit('tab:created', { tab })
      eventBus.emit('tab:changed', { tabId: tab.id })

      return tab
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('[useTabs] Failed to create tab:', err)
      throw err
    }
  }

  // Close a tab
  const closeTab = async (tabId: string) => {
    try {
      await tabRepository.close(tabId)

      // Update local state
      const index = tabs.value.findIndex(t => t.id === tabId)
      if (index !== -1) {
        tabs.value.splice(index, 1)
      }

      // Update active tab
      const activeTab = await tabRepository.getActive()
      activeTabId.value = activeTab?.id || null

      // Emit event
      eventBus.emit('tab:closed', { tabId })
      if (activeTab) {
        eventBus.emit('tab:changed', { tabId: activeTab.id })
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('[useTabs] Failed to close tab:', err)
      throw err
    }
  }

  // Set active tab
  const setActiveTab = async (tabId: string) => {
    try {
      await tabRepository.setActive(tabId)

      // Update local state
      activeTabId.value = tabId

      // Emit event
      eventBus.emit('tab:changed', { tabId })
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('[useTabs] Failed to set active tab:', err)
      throw err
    }
  }

  // Update tab title
  const updateTabTitle = async (tabId: string, title: string) => {
    try {
      await tabRepository.updateTitle(tabId, title)

      // Update local state
      const tab = tabs.value.find(t => t.id === tabId)
      if (tab) {
        tab.setTitle(title)
      }

      // Emit event
      eventBus.emit('tab:updated', { tabId, title })
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('[useTabs] Failed to update tab title:', err)
      throw err
    }
  }

  // Update tab data
  const updateTabData = async (tabId: string, key: string, value: any) => {
    try {
      await tabRepository.updateData(tabId, key, value)

      // Update local state
      const tab = tabs.value.find(t => t.id === tabId)
      if (tab) {
        tab.setData(key, value)
      }

      // Emit event
      eventBus.emit('tab:data:updated', { tabId, key, value })
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('[useTabs] Failed to update tab data:', err)
      throw err
    }
  }

  // Get tab by ID
  const getTab = (tabId: string): TabEntity | undefined => {
    return tabs.value.find(t => t.id === tabId)
  }

  // Get active tab
  const getActiveTab = (): TabEntity | undefined => {
    return tabs.value.find(t => t.id === activeTabId.value)
  }

  // Listen to events
  const handleTabCreated = (event: any) => {
    console.log('[useTabs] Tab created:', event.tab)
  }

  const handleTabClosed = (event: any) => {
    console.log('[useTabs] Tab closed:', event.tabId)
  }

  const handleTabChanged = (event: any) => {
    console.log('[useTabs] Active tab changed:', event.tabId)
  }

  // Lifecycle hooks
  onMounted(() => {
    loadTabs()
    eventBus.on('tab:created', handleTabCreated)
    eventBus.on('tab:closed', handleTabClosed)
    eventBus.on('tab:changed', handleTabChanged)
  })

  onUnmounted(() => {
    eventBus.off('tab:created', handleTabCreated)
    eventBus.off('tab:closed', handleTabClosed)
    eventBus.off('tab:changed', handleTabChanged)
  })

  // Computed properties
  const activeTab = computed(() => getActiveTab())
  const tabCount = computed(() => tabs.value.length)
  const isReady = computed(() => !loading.value)
  const hasError = computed(() => error.value !== null)

  return {
    tabs,
    activeTabId,
    loading,
    error,
    activeTab,
    tabCount,
    isReady,
    hasError,
    loadTabs,
    createTab,
    closeTab,
    setActiveTab,
    updateTabTitle,
    updateTabData,
    getTab,
    getActiveTab
  }
}