/**
 * WindowManager Store Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWindowManagerStore } from '../../stores/windowManager'

// Mock IndexedDB
vi.mock('../../../utils/indexedDB', () => ({
  default: {
    saveGUIWindowState: vi.fn().mockResolvedValue(undefined),
    deleteGUIWindowState: vi.fn().mockResolvedValue(undefined),
    loadGUIWindowStates: vi.fn().mockResolvedValue([]),
  },
}))

describe('WindowManager Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const createWindowConfig = (overrides = {}) => ({
    id: 'test-window',
    tool: 'terminal' as const,
    title: 'Test Window',
    iconName: 'terminal' as const,
    width: 800,
    height: 600,
    ...overrides,
  })

  it('should open a new window', () => {
    const store = useWindowManagerStore()
    const config = createWindowConfig()

    const windowInstance = store.openWindow(config)

    expect(windowInstance).toBeDefined()
    expect(windowInstance.config.id).toBe('test-window')
    expect(store.windowCount).toBe(1)
    expect(store.openWindows.length).toBe(1)
  })

  it('should focus existing window if opened again', () => {
    const store = useWindowManagerStore()
    const config = createWindowConfig()

    const first = store.openWindow(config)
    const second = store.openWindow(config)

    expect(first.config.id).toBe(second.config.id)
    expect(store.windowCount).toBe(1)
  })

  it('should close a window', () => {
    const store = useWindowManagerStore()
    store.openWindow(createWindowConfig())

    const result = store.closeWindow('test-window')

    expect(result).toBe(true)
    expect(store.windowCount).toBe(0)
    expect(store.openWindows.length).toBe(0)
  })

  it('should return false when closing non-existent window', () => {
    const store = useWindowManagerStore()

    const result = store.closeWindow('non-existent')

    expect(result).toBe(false)
  })

  it('should minimize and restore a window', () => {
    const store = useWindowManagerStore()
    store.openWindow(createWindowConfig())

    store.minimizeWindow('test-window')
    expect(store.minimizedWindows.length).toBe(1)

    store.restoreWindow('test-window')
    expect(store.minimizedWindows.length).toBe(0)
  })

  it('should maximize and un-maximize a window', () => {
    const store = useWindowManagerStore()
    store.openWindow(createWindowConfig({ isFullscreen: false }))

    store.maximizeWindow('test-window')
    const win = store.openWindows.find(w => w.config.id === 'test-window')
    expect(win?.maximized).toBe(true)

    store.maximizeWindow('test-window')
    const restored = store.openWindows.find(w => w.config.id === 'test-window')
    expect(restored?.maximized).toBe(false)
  })

  it('should update window position', () => {
    const store = useWindowManagerStore()
    store.openWindow(createWindowConfig())

    store.updateWindowPosition('test-window', 100, 200)

    const win = store.openWindows.find(w => w.config.id === 'test-window')
    expect(win?.position.x).toBe(100)
    expect(win?.position.y).toBe(200)
  })

  it('should update window dimensions', () => {
    const store = useWindowManagerStore()
    store.openWindow(createWindowConfig())

    store.updateWindowDimensions('test-window', { x: 50, y: 75, width: 900, height: 700 })

    const win = store.openWindows.find(w => w.config.id === 'test-window')
    expect(win?.position.x).toBe(50)
    expect(win?.position.y).toBe(75)
    expect(win?.size.width).toBe(900)
    expect(win?.size.height).toBe(700)
  })

  it('should focus window and update z-index', () => {
    const store = useWindowManagerStore()
    store.openWindow(createWindowConfig({ id: 'win1' }))
    store.openWindow(createWindowConfig({ id: 'win2' }))

    store.focusWindow('win1')

    const win1 = store.getWindow('win1')
    const win2 = store.getWindow('win2')
    expect(win1?.focused).toBe(true)
    expect(win2?.focused).toBe(false)
  })

  it('should check if tool has open window', () => {
    const store = useWindowManagerStore()
    store.openWindow(createWindowConfig())

    expect(store.hasWindow('terminal')).toBe(true)
    expect(store.hasWindow('filemanager')).toBe(false)
  })

  it('should get window by tool type', () => {
    const store = useWindowManagerStore()
    store.openWindow(createWindowConfig())

    const win = store.getWindowByTool('terminal')
    expect(win?.config.id).toBe('test-window')
  })

  it('should close all windows', () => {
    const store = useWindowManagerStore()
    store.openWindow(createWindowConfig({ id: 'win1' }))
    store.openWindow(createWindowConfig({ id: 'win2' }))
    store.openWindow(createWindowConfig({ id: 'win3' }))

    store.closeAllWindows()

    expect(store.windowCount).toBe(0)
  })

  it('should maintain single source of truth (Map only, no dual data source)', () => {
    const store = useWindowManagerStore()
    store.openWindow(createWindowConfig({ id: 'win1' }))
    store.openWindow(createWindowConfig({ id: 'win2' }))
    store.closeWindow('win1')

    // Verify single data source consistency
    expect(store.windows.size).toBe(1)
    expect(store.openWindows.length).toBe(1)
    expect(store.openWindows[0].config.id).toBe('win2')
  })
})
