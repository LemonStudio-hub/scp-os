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

const { getNextZIndex, bringToFront, setFocusedWindow, getFocusedWindowId } = useZIndex()

export const useWindowManagerStore = defineStore('windowManager', () => {
  // Single source of truth - reactive Map
  const windows = ref<Map<string, WindowInstance>>(new Map())

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

    const windowInstance: WindowInstance = {
      config,
      state: 'normal',
      position,
      size,
      zIndex,
      focused: true,
      minimized: false,
      maximized: false,
      createdAt: Date.now(),
      lastFocusedAt: Date.now(),
    }

    windows.value.set(config.id, windowInstance)
    setFocusedWindow(config.id)

    // Persist to IndexedDB
    saveWindowState(windowInstance)

    return windowInstance
  }

  function closeWindow(windowId: string): boolean {
    const win = windows.value.get(windowId)
    if (!win) return false

    windows.value.delete(windowId)

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

    windows.value.set(windowId, {
      ...win,
      zIndex: newZIndex,
      focused: true,
      lastFocusedAt: Date.now(),
    })

    // Update all other windows to not be focused
    windows.value.forEach((w, id) => {
      if (id !== windowId && w.focused) {
        windows.value.set(id, { ...w, focused: false })
      }
    })

    return true
  }

  function minimizeWindow(windowId: string): boolean {
    const win = windows.value.get(windowId)
    if (!win || !win.config.minimizable) return false

    windows.value.set(windowId, {
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

    windows.value.set(windowId, {
      ...win,
      minimized: false,
      state,
    })

    focusWindow(windowId)
    return true
  }

  function maximizeWindow(windowId: string): boolean {
    const win = windows.value.get(windowId)
    if (!win || !win.config.maximizable) return false

    const isCurrentlyMaximized = win.maximized

    windows.value.set(windowId, {
      ...win,
      maximized: !isCurrentlyMaximized,
      state: isCurrentlyMaximized ? 'normal' : 'maximized',
    })

    return true
  }

  function updateWindowDimensions(windowId: string, dimensions: WindowDimensions): boolean {
    const win = windows.value.get(windowId)
    if (!win) return false

    windows.value.set(windowId, {
      ...win,
      position: { x: dimensions.x, y: dimensions.y },
      size: { width: dimensions.width, height: dimensions.height },
    })

    return true
  }

  function updateWindowPosition(windowId: string, x: number, y: number): boolean {
    const win = windows.value.get(windowId)
    if (!win) return false

    windows.value.set(windowId, {
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
      console.error('[WindowManager] Failed to save window state:', error)
    }
  }

  async function deleteWindowState(windowId: string): Promise<void> {
    try {
      await indexedDBService.deleteGUIWindowState(windowId)
    } catch (error) {
      console.error('[WindowManager] Failed to delete window state:', error)
    }
  }

  async function loadWindowStates(): Promise<void> {
    try {
      const savedWindows = await indexedDBService.loadGUIWindowStates()
      if (savedWindows && savedWindows.length > 0) {
        for (const savedWindow of savedWindows) {
          windows.value.set(savedWindow.config.id, savedWindow)
        }
        console.log(`[WindowManager] Restored ${savedWindows.length} windows from IndexedDB`)
      }
    } catch (error) {
      console.error('[WindowManager] Failed to load window states:', error)
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
