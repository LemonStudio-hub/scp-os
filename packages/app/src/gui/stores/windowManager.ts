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

// Default placement keeps new windows away from the desktop icons.
const TASKBAR_HEIGHT = 48
const WINDOW_MARGIN = 12
const RIGHT_REGION_CENTER_RATIO = 0.7

function getViewportLimit(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: windowDefaults.width, height: windowDefaults.height }
  }

  return {
    width: Math.max(320, window.innerWidth - WINDOW_MARGIN * 2),
    height: Math.max(240, window.innerHeight - TASKBAR_HEIGHT - WINDOW_MARGIN * 2),
  }
}

/** Trust registry/config min sizes — do not hardcode per-tool overrides. */
function getEffectiveMinSize(config: WindowConfig): { minWidth: number; minHeight: number } {
  return {
    minWidth: config.minWidth ?? 320,
    minHeight: config.minHeight ?? 240,
  }
}

function clampWindowSize(
  size: { width: number; height: number },
  config: WindowConfig
): { width: number; height: number } {
  const viewportLimit = getViewportLimit()
  const { minWidth, minHeight } = getEffectiveMinSize(config)
  const safeMinWidth = Math.min(minWidth, viewportLimit.width)
  const safeMinHeight = Math.min(minHeight, viewportLimit.height)

  return {
    width: Math.min(viewportLimit.width, Math.max(safeMinWidth, size.width)),
    height: Math.min(viewportLimit.height, Math.max(safeMinHeight, size.height)),
  }
}

function clampPosition(value: number, max: number): number {
  if (max < WINDOW_MARGIN) return WINDOW_MARGIN
  return Math.min(max, Math.max(WINDOW_MARGIN, value))
}

function clampWindowPosition(
  position: { x: number; y: number },
  size: { width: number; height: number }
): { x: number; y: number } {
  if (typeof window === 'undefined') {
    return position
  }

  const availH = Math.max(0, window.innerHeight - TASKBAR_HEIGHT)

  return {
    x: clampPosition(position.x, window.innerWidth - size.width - WINDOW_MARGIN),
    y: clampPosition(position.y, availH - size.height - WINDOW_MARGIN),
  }
}

function clampWindowDimensions(
  dimensions: WindowDimensions,
  config: WindowConfig
): { position: { x: number; y: number }; size: { width: number; height: number } } {
  if (typeof window === 'undefined') {
    const size = clampWindowSize(dimensions, config)
    return {
      position: { x: dimensions.x, y: dimensions.y },
      size,
    }
  }

  const viewportLimit = getViewportLimit()
  const { minWidth, minHeight } = getEffectiveMinSize(config)
  const safeMinWidth = Math.min(minWidth, viewportLimit.width)
  const safeMinHeight = Math.min(minHeight, viewportLimit.height)
  const maxRight = window.innerWidth - WINDOW_MARGIN
  const maxBottom = window.innerHeight - TASKBAR_HEIGHT - WINDOW_MARGIN

  let left = dimensions.x
  let top = dimensions.y
  let right = dimensions.x + dimensions.width
  let bottom = dimensions.y + dimensions.height

  if (left < WINDOW_MARGIN) left = WINDOW_MARGIN
  if (top < WINDOW_MARGIN) top = WINDOW_MARGIN
  if (right > maxRight) right = maxRight
  if (bottom > maxBottom) bottom = maxBottom

  if (right - left < safeMinWidth) {
    right = Math.min(maxRight, left + safeMinWidth)
    left = Math.max(WINDOW_MARGIN, right - safeMinWidth)
  }

  if (bottom - top < safeMinHeight) {
    bottom = Math.min(maxBottom, top + safeMinHeight)
    top = Math.max(WINDOW_MARGIN, bottom - safeMinHeight)
  }

  return {
    position: { x: Math.round(left), y: Math.round(top) },
    size: {
      width: Math.round(right - left),
      height: Math.round(bottom - top),
    },
  }
}

function normalizeWindowConfig(config: WindowConfig, size: { width: number; height: number }) {
  const { minWidth, minHeight } = getEffectiveMinSize(config)

  return {
    ...config,
    width: size.width,
    height: size.height,
    minWidth,
    minHeight,
  }
}

function normalizeWindowInstance(instance: WindowInstance): WindowInstance {
  const size = clampWindowSize(instance.size, instance.config)
  const position = clampWindowPosition(instance.position, size)

  return {
    ...instance,
    config: normalizeWindowConfig(instance.config, size),
    position,
    size,
  }
}

function computeRightRegionPosition(
  size: { width: number; height: number },
  openCount: number
): { x: number; y: number } {
  if (typeof window === 'undefined') {
    return { x: WINDOW_MARGIN, y: WINDOW_MARGIN }
  }
  const availW = window.innerWidth
  const availH = Math.max(0, window.innerHeight - TASKBAR_HEIGHT)
  const cascadeIndex = openCount % 5
  const rawX = Math.round(
    availW * RIGHT_REGION_CENTER_RATIO - size.width / 2 + windowDefaults.xOffset * cascadeIndex
  )
  const rawY = Math.round((availH - size.height) / 2 + windowDefaults.yOffset * cascadeIndex)
  const maxX = availW - size.width - WINDOW_MARGIN
  const maxY = availH - size.height - WINDOW_MARGIN

  return {
    x: clampPosition(rawX, maxX),
    y: clampPosition(rawY, maxY),
  }
}

function computeDefaultPosition(
  tool: ToolType | undefined,
  size: { width: number; height: number },
  openCount: number
): { x: number; y: number } {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 }
  }

  if (tool === ('settings' as ToolType)) {
    return computeRightRegionPosition(size, 0)
  }

  return computeRightRegionPosition(size, openCount)
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
    const requestedSize = {
      width: config.width ?? windowDefaults.width,
      height: config.height ?? windowDefaults.height,
    }
    const size = clampWindowSize(requestedSize, config)
    const defaultPos = computeDefaultPosition(config.tool, size, openWindowCount)
    const position = clampWindowPosition(
      {
        x: config.x ?? defaultPos.x,
        y: config.y ?? defaultPos.y,
      },
      size
    )
    const normalizedConfig = normalizeWindowConfig(config, size)

    const isFullscreen = config.tool === 'settings' ? false : (config.isFullscreen ?? false)

    const windowInstance: WindowInstance = {
      config: normalizedConfig,
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

    const { position, size } = clampWindowDimensions(dimensions, win.config)

    updateWindow(windowId, {
      ...win,
      config: normalizeWindowConfig(win.config, size),
      position,
      size,
    })

    return true
  }

  function updateWindowTitle(windowId: string, title: string): boolean {
    const win = windows.value.get(windowId)
    if (!win) return false

    updateWindow(windowId, {
      ...win,
      config: {
        ...win.config,
        title,
      },
    })

    return true
  }

  function updateWindowPosition(windowId: string, x: number, y: number): boolean {
    const win = windows.value.get(windowId)
    if (!win) return false

    const position = clampWindowPosition({ x, y }, win.size)

    updateWindow(windowId, {
      ...win,
      position,
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

          const restoredWindow = normalizeWindowInstance({
            ...windowToRestore,
            zIndex: getNextZIndex(),
          })

          updateWindow(restoredWindow.config.id, restoredWindow)
          await saveWindowState(restoredWindow)
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
    updateWindowTitle,
    updateWindowPosition,
    getWindow,
    hasWindow,
    getWindowByTool,
    loadWindowStates,
    closeAllWindows,
  }
})
