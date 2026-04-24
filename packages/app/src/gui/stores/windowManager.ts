/**
 * Window Manager Store
 * Manages the lifecycle of all GUI windows (open, close, focus, minimize, maximize).
 * Uses a single reactive Map as data source, ordered by insertion order.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WindowInstance, WindowConfig, WindowState, ToolType, WindowDimensions } from '../types'
import { useZIndex } from '../composables/useZIndex'
import { windowDefaults } from '../design-tokens'
import indexedDBService from '../../utils/indexedDB'
import logger from '../../utils/logger'

const { getNextZIndex, bringToFront, setFocusedWindow, getFocusedWindowId } = useZIndex()

export const useWindowManagerStore = defineStore('windowManager', () => {
  const windows = ref<Map<string, WindowInstance>>(new Map())

  function updateWindow(id: string, instance: WindowInstance): void {
    const newMap = new Map(windows.value)
    newMap.set(id, instance)
    windows.value = newMap
  }

  function deleteWindow(id: string): void {
    const newMap = new Map(windows.value)
    newMap.delete(id)
    windows.value = newMap
  }

  // Computed: ordered by insertion order (Map preserves insertion order)
  const openWindows = computed(() => {
    return Array.from(windows.value.values())
  })

  const focusedWindow = computed(() => {
    const focusedId = getFocusedWindowId()
    return focusedId ? windows.value.get(focusedId) : null
  })

  const windowCount = computed(() => windows.value.size)

  const minimizedWindows = computed(() => {
    return openWindows.value.filter(w => w.minimized)
  })

  // Actions
  function openWindow(config: WindowConfig): WindowInstance {
    // If window with same ID already exists, just focus it
    const existing = windows.value.get(config.id)
    if (existing) {
      if (existing.minimized) {
        restoreWindow(config.id)
      }
      focusWindow(config.id)
      return existing
    }

    const zIndex = getNextZIndex()
    const openWindowCount = windows.value.size
    const position = {
      x: config.x ?? windowDefaults.xOffset * (openWindowCount % 5),
      y: config.y ?? windowDefaults.yOffset * (openWindowCount % 5),
    }
    const size = {
      width: config.width ?? windowDefaults.width,
      height: config.height ?? windowDefaults.height,
    }

    // Handle fullscreen option - default to true for all apps
    const isFullscreen = config.isFullscreen ?? true

    const windowInstance: WindowInstance = {
      config,
      state: isFullscreen ? 'maximized' : 'normal',
      position,
      size,
      zIndex,
      focused: true,
      minimized: false,
      maximized: isFullscreen,
      createdAt: Date.now(),
      lastFocusedAt: Date.now(),
    }

    updateWindow(config.id, windowInstance)
    setFocusedWindow(config.id)

    // Persist to IndexedDB
    saveWindowState(windowInstance)

    return windowInstance
  }

  function closeWindow(windowId: string): boolean {
    const win = windows.value.get(windowId)
    if (!win) return false

    deleteWindow(windowId)

    // Delete persisted state
    deleteWindowState(windowId)

    // Focus the next window in order (last opened)
    const remainingWindows = openWindows.value
    if (remainingWindows.length > 0) {
      const lastWindow = remainingWindows[remainingWindows.length - 1]
      focusWindow(lastWindow.config.id)
    } else {
      setFocusedWindow(null)
    }

    return true
  }

  function focusWindow(windowId: string): boolean {
    const win = windows.value.get(windowId)
    if (!win || win.minimized) return false

    const newZIndex = bringToFront(windowId)

    updateWindow(windowId, {
      ...win,
      zIndex: newZIndex,
      focused: true,
      lastFocusedAt: Date.now(),
    })

    const updates: Array<[string, WindowInstance]> = []
    windows.value.forEach((w, id) => {
      if (id !== windowId && w.focused) {
        updates.push([id, { ...w, focused: false }])
      }
    })
    for (const [id, instance] of updates) {
      updateWindow(id, instance)
    }

    return true
  }

  function minimizeWindow(windowId: string): boolean {
    const win = windows.value.get(windowId)
    if (!win || win.config.minimizable === false) return false

    updateWindow(windowId, {
      ...win,
      minimized: true,
      state: 'minimized',
      focused: false,
    })

    // Focus next available window
    const remainingWindows = openWindows.value.filter(w => !w.minimized)
    if (remainingWindows.length > 0) {
      focusWindow(remainingWindows[remainingWindows.length - 1].config.id)
    } else {
      setFocusedWindow(null)
    }

    return true
  }

  function restoreWindow(windowId: string): boolean {
    const win = windows.value.get(windowId)
    if (!win) return false

    const state: WindowState = win.maximized ? 'maximized' : 'normal'

    updateWindow(windowId, {
      ...win,
      minimized: false,
      state,
    })

    focusWindow(windowId)
    return true
  }

  function maximizeWindow(windowId: string): boolean {
    const win = windows.value.get(windowId)
    if (!win || win.config.maximizable === false) return false

    const isCurrentlyMaximized = win.maximized

    updateWindow(windowId, {
      ...win,
      maximized: !isCurrentlyMaximized,
      state: isCurrentlyMaximized ? 'normal' : 'maximized',
    })

    return true
  }

  function updateWindowDimensions(windowId: string, dimensions: WindowDimensions): boolean {
    const win = windows.value.get(windowId)
    if (!win) return false

    updateWindow(windowId, {
      ...win,
      position: { x: dimensions.x, y: dimensions.y },
      size: { width: dimensions.width, height: dimensions.height },
    })

    return true
  }

  function updateWindowPosition(windowId: string, x: number, y: number): boolean {
    const win = windows.value.get(windowId)
    if (!win) return false

    updateWindow(windowId, {
      ...win,
      position: { x, y },
    })

    return true
  }

  function getWindow(windowId: string): WindowInstance | undefined {
    return windows.value.get(windowId)
  }

  function hasWindow(tool: ToolType): boolean {
    return Array.from(windows.value.values()).some(w => w.config.tool === tool && !w.minimized)
  }

  function getWindowByTool(tool: ToolType): WindowInstance | undefined {
    return Array.from(windows.value.values()).find(w => w.config.tool === tool && !w.minimized)
  }

  // Persistence
  async function saveWindowState(windowInstance: WindowInstance): Promise<void> {
    try {
      await indexedDBService.saveGUIWindowState(windowInstance)
    } catch (error) {
      logger.error('[WindowManager] Failed to save window state:', error)
    }
  }

  async function deleteWindowState(windowId: string): Promise<void> {
    try {
      await indexedDBService.deleteGUIWindowState(windowId)
    } catch (error) {
      logger.error('[WindowManager] Failed to delete window state:', error)
    }
  }

  async function loadWindowStates(): Promise<void> {
    try {
      const savedWindows = await indexedDBService.loadGUIWindowStates()
      if (savedWindows && savedWindows.length > 0) {
        for (const savedWindow of savedWindows) {
          updateWindow(savedWindow.config.id, savedWindow)
        }
        logger.info(`[WindowManager] Restored ${savedWindows.length} windows from IndexedDB`)
      }
    } catch (error) {
      logger.error('[WindowManager] Failed to load window states:', error)
    }
  }

  // Cleanup
  function closeAllWindows(): void {
    const windowIds = Array.from(windows.value.keys())
    for (const windowId of windowIds) {
      closeWindow(windowId)
    }
  }

  return {
    // State (single source of truth)
    windows,

    // Computed
    openWindows,
    focusedWindow,
    windowCount,
    minimizedWindows,

    // Actions
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    restoreWindow,
    maximizeWindow,
    updateWindowDimensions,
    updateWindowPosition,
    getWindow,
    hasWindow,
    getWindowByTool,
    loadWindowStates,
    closeAllWindows,
  }
})
