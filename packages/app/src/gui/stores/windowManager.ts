/**
 * Window Manager Store
 * Manages the lifecycle of all GUI windows (open, close, focus, minimize, maximize).
 * Uses a single reactive Map as data source, ordered by insertion order.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  WindowInstance,
  WindowConfig,
  WindowState,
  ToolType,
  WindowDimensions,
} from '../types'
import { useZIndex } from '../composables/useZIndex'
import { windowDefaults } from '../design-tokens'
import indexedDBService from '../../utils/indexedDB'
import logger from '../../utils/logger'

const { getNextZIndex, bringToFront, setFocusedWindow, getFocusedWindowId } = useZIndex()

// Per-tool default placement: lets specific tools open in a dedicated region
// instead of the generic cascading offset. Settings opens in the right-region
// centered area so it doesn't cover the left-side desktop icons.
const TASKBAR_HEIGHT = 48

function computeDefaultPosition(
  tool: ToolType | undefined,
  size: { width: number; height: number },
  openCount: number
): { x: number; y: number } {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 }
  }

  if (tool === ('settings' as ToolType)) {
    const availW = window.innerWidth
    const availH = Math.max(0, window.innerHeight - TASKBAR_HEIGHT)
    // Center the window on a vertical axis at 70% of viewport width,
    // clamped so the window stays fully visible on narrow screens.
    const rawX = Math.round(availW * 0.7 - size.width / 2)
    const rawY = Math.round((availH - size.height) / 2)
    const maxX = Math.max(0, availW - size.width - 12)
    const maxY = Math.max(0, availH - size.height - 12)
    return {
      x: Math.min(maxX, Math.max(12, rawX)),
      y: Math.min(maxY, Math.max(12, rawY)),
    }
  }

  return {
    x: windowDefaults.xOffset * (openCount % 5),
    y: windowDefaults.yOffset * (openCount % 5),
  }
}

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

  function blurWindowsExcept(activeWindowId: string): void {
    const updates: Array<[string, WindowInstance]> = []
    windows.value.forEach((w, id) => {
      if (id !== activeWindowId && w.focused) {
        updates.push([id, { ...w, focused: false }])
      }
    })

    for (const [id, instance] of updates) {
      updateWindow(id, instance)
    }
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
    return openWindows.value.filter((w) => w.minimized)
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
    const size = {
      width: config.width ?? windowDefaults.width,
      height: config.height ?? windowDefaults.height,
    }
    const defaultPos = computeDefaultPosition(config.tool, size, openWindowCount)
    const position = {
      x: config.x ?? defaultPos.x,
      y: config.y ?? defaultPos.y,
    }

    const isFullscreen = config.tool === 'settings' ? false : (config.isFullscreen ?? false)

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
    blurWindowsExcept(config.id)
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

    blurWindowsExcept(windowId)

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
    const remainingWindows = openWindows.value.filter((w) => !w.minimized)
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
    return Array.from(windows.value.values()).some((w) => w.config.tool === tool && !w.minimized)
  }

  function getWindowByTool(tool: ToolType): WindowInstance | undefined {
    return Array.from(windows.value.values()).find((w) => w.config.tool === tool && !w.minimized)
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
      const savedWindows = (await indexedDBService.loadGUIWindowStates()) as WindowInstance[]
      if (savedWindows && savedWindows.length > 0) {
        for (const savedWindow of savedWindows) {
          const windowToRestore =
            savedWindow.config.tool === 'settings'
              ? {
                  ...savedWindow,
                  config: {
                    ...savedWindow.config,
                    isFullscreen: false,
                  },
                  state: 'normal' as WindowState,
                  maximized: false,
                  size: {
                    width: savedWindow.config.width ?? savedWindow.size.width,
                    height: savedWindow.config.height ?? savedWindow.size.height,
                  },
                }
              : savedWindow

          const restoredWindow = {
            ...windowToRestore,
            zIndex: getNextZIndex(),
          }

          updateWindow(restoredWindow.config.id, restoredWindow)
          if (windowToRestore !== savedWindow) {
            await saveWindowState(restoredWindow)
          }
        }

        const restoredWindows = openWindows.value
        const activeWindow =
          [...restoredWindows].reverse().find((w) => w.focused && !w.minimized) ??
          [...restoredWindows].reverse().find((w) => !w.minimized)

        if (activeWindow) {
          updateWindow(activeWindow.config.id, {
            ...activeWindow,
            focused: true,
          })
          blurWindowsExcept(activeWindow.config.id)
          setFocusedWindow(activeWindow.config.id)
        } else {
          blurWindowsExcept('')
          setFocusedWindow(null)
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
