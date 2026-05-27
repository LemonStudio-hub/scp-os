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
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true })
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

  it('should default desktop window capabilities to enabled', () => {
    const store = useWindowManagerStore()
    const windowInstance = store.openWindow(createWindowConfig())

    expect(windowInstance.config.resizable).toBe(true)
    expect(windowInstance.config.draggable).toBe(true)
    expect(windowInstance.config.closable).toBe(true)
    expect(windowInstance.config.minimizable).toBe(true)
    expect(windowInstance.config.maximizable).toBe(true)
  })

  it('should open new desktop windows away from the top-left corner', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true })

    const store = useWindowManagerStore()
    const first = store.openWindow(createWindowConfig({ id: 'win1' }))
    const second = store.openWindow(createWindowConfig({ id: 'win2' }))

    expect(first.position.x).toBeGreaterThan(0)
    expect(first.position.y).toBeGreaterThan(0)
    expect(second.position.x).toBeGreaterThan(first.position.x)
    expect(second.position.y).toBeGreaterThan(first.position.y)
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
    const win = store.openWindows.find((w) => w.config.id === 'test-window')
    expect(win?.maximized).toBe(true)

    store.maximizeWindow('test-window')
    const restored = store.openWindows.find((w) => w.config.id === 'test-window')
    expect(restored?.maximized).toBe(false)
  })

  it('should update window position', () => {
    const store = useWindowManagerStore()
    store.openWindow(createWindowConfig())

    store.updateWindowPosition('test-window', 100, 200)

    const win = store.openWindows.find((w) => w.config.id === 'test-window')
    expect(win?.position.x).toBe(100)
    expect(win?.position.y).toBe(200)
  })

  it('should update window dimensions', () => {
    const store = useWindowManagerStore()
    store.openWindow(createWindowConfig())

    store.updateWindowDimensions('test-window', { x: 50, y: 75, width: 900, height: 700 })

    const win = store.openWindows.find((w) => w.config.id === 'test-window')
    expect(win?.position.x).toBe(50)
    expect(win?.position.y).toBe(75)
    expect(win?.size.width).toBe(900)
    expect(win?.size.height).toBe(700)
  })

  it('should keep the left and top edges stable when resize exceeds right and bottom bounds', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    const store = useWindowManagerStore()
    store.openWindow(
      createWindowConfig({ id: 'edge-resize', x: 500, y: 100, width: 500, height: 300 })
    )

    store.updateWindowDimensions('edge-resize', { x: 500, y: 100, width: 900, height: 700 })

    const win = store.openWindows.find((w) => w.config.id === 'edge-resize')
    expect(win?.position.x).toBe(500)
    expect(win?.position.y).toBe(100)
    expect(win?.size.width).toBe(796)
    expect(win?.size.height).toBe(700)
  })

  it('should allow windows to move partly outside the visible viewport', () => {
    const store = useWindowManagerStore()
    store.openWindow(createWindowConfig({ id: 'partial-offscreen' }))

    store.updateWindowPosition('partial-offscreen', -80, 850)

    const win = store.openWindows.find((w) => w.config.id === 'partial-offscreen')
    expect(win?.position.x).toBe(-80)
    expect(win?.position.y).toBe(820)
  })

  it('should allow window dimensions to extend below the taskbar area', () => {
    const store = useWindowManagerStore()
    store.openWindow(createWindowConfig({ id: 'below-taskbar', x: 200, y: 200 }))

    store.updateWindowDimensions('below-taskbar', { x: 200, y: 200, width: 900, height: 760 })

    const win = store.openWindows.find((w) => w.config.id === 'below-taskbar')
    expect(win?.position.y).toBe(200)
    expect(win?.size.height).toBe(760)
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
