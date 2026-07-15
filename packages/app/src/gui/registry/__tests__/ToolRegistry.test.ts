import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ToolRegistry, openTool, getToolLabel } from '../ToolRegistry'
import type { ToolModule } from '../ToolRegistry'

const createTool = (overrides: Partial<ToolModule> = {}): ToolModule => ({
  id: 'terminal',
  label: 'Terminal',
  icon: 'terminal',
  windowConfig: { width: 800, height: 600 },
  mobileComponent: {},
  ...overrides,
})

describe('ToolRegistry', () => {
  beforeEach(() => {
    // Clean up all registered tools between tests
    for (const id of ToolRegistry.getIds()) {
      ToolRegistry.unregister(id)
    }
  })

  describe('register / get / has', () => {
    it('registers and retrieves a tool', () => {
      const tool = createTool()
      ToolRegistry.register(tool)
      expect(ToolRegistry.get('terminal')).toBe(tool)
    })

    it('has returns true for registered tool', () => {
      ToolRegistry.register(createTool())
      expect(ToolRegistry.has('terminal')).toBe(true)
    })

    it('has returns false for unregistered tool', () => {
      expect(ToolRegistry.has('terminal')).toBe(false)
    })

    it('overwrites existing registration on re-register', () => {
      const first = createTool({ icon: 'a' })
      const second = createTool({ icon: 'b' })
      ToolRegistry.register(first)
      ToolRegistry.register(second)
      expect(ToolRegistry.get('terminal')?.icon).toBe('b')
    })
  })

  describe('unregister', () => {
    it('removes a registered tool', () => {
      ToolRegistry.register(createTool())
      ToolRegistry.unregister('terminal')
      expect(ToolRegistry.has('terminal')).toBe(false)
      expect(ToolRegistry.get('terminal')).toBeUndefined()
    })

    it('does not throw when unregistering non-existent tool', () => {
      expect(() => ToolRegistry.unregister('terminal')).not.toThrow()
    })
  })

  describe('getAll / getIds', () => {
    it('returns all registered tools', () => {
      ToolRegistry.register(createTool({ id: 'terminal' }))
      ToolRegistry.register(createTool({ id: 'editor' }))
      const all = ToolRegistry.getAll()
      expect(all).toHaveLength(2)
    })

    it('returns all registered tool IDs', () => {
      ToolRegistry.register(createTool({ id: 'terminal' }))
      ToolRegistry.register(createTool({ id: 'editor' }))
      const ids = ToolRegistry.getIds()
      expect(ids).toContain('terminal')
      expect(ids).toContain('editor')
    })
  })

  describe('getToolLabel', () => {
    it('resolves a static string label', () => {
      ToolRegistry.register(createTool({ label: 'My Terminal' }))
      expect(getToolLabel('terminal')).toBe('My Terminal')
    })

    it('resolves a function label', () => {
      ToolRegistry.register(createTool({ label: () => 'Translated Terminal' }))
      expect(getToolLabel('terminal')).toBe('Translated Terminal')
    })

    it('returns the toolId when tool is not registered', () => {
      expect(getToolLabel('terminal')).toBe('terminal')
    })
  })

  describe('openTool', () => {
    it('calls openWindow with resolved config', () => {
      ToolRegistry.register(createTool({ label: 'Terminal', icon: 'term' }))
      const openWindow = vi.fn()

      openTool('terminal', openWindow)

      expect(openWindow).toHaveBeenCalledOnce()
      const config = openWindow.mock.calls[0][0]
      expect(config.tool).toBe('terminal')
      expect(config.title).toBe('Terminal')
      expect(config.iconName).toBe('term')
      expect(config.width).toBe(800)
      expect(config.height).toBe(600)
      expect(config.isFullscreen).toBe(true)
      expect(config.id).toMatch(/^terminal-/)
    })

    it('passes data to openWindow', () => {
      ToolRegistry.register(createTool())
      const openWindow = vi.fn()
      const data = { foo: 'bar' }

      openTool('terminal', openWindow, data)

      expect(openWindow.mock.calls[0][0].data).toEqual(data)
    })

    it('resolves function labels when opening', () => {
      ToolRegistry.register(createTool({ label: () => 'Dynamic Label' }))
      const openWindow = vi.fn()

      openTool('terminal', openWindow)

      expect(openWindow.mock.calls[0][0].title).toBe('Dynamic Label')
    })

    it('warns and returns when tool is not registered', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const openWindow = vi.fn()

      openTool('terminal', openWindow)

      expect(openWindow).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not registered'))
      warnSpy.mockRestore()
    })

    it('calls onOpen callback when tool opens', () => {
      const onOpen = vi.fn()
      ToolRegistry.register(createTool({ onOpen }))
      const openWindow = vi.fn()

      openTool('terminal', openWindow)

      expect(onOpen).toHaveBeenCalledOnce()
    })

    it('skips opening for singleton tool when already open', () => {
      ToolRegistry.register(createTool({ singleton: true }))
      const openWindow = vi.fn()

      openTool('terminal', openWindow, undefined, ['terminal-123'])

      expect(openWindow).not.toHaveBeenCalled()
    })

    it('opens singleton tool when no existing instance', () => {
      ToolRegistry.register(createTool({ singleton: true }))
      const openWindow = vi.fn()

      openTool('terminal', openWindow, undefined, ['editor-456'])

      expect(openWindow).toHaveBeenCalledOnce()
    })

    it('uses default dimensions when windowConfig has no width/height', () => {
      ToolRegistry.register(createTool({ windowConfig: {} }))
      const openWindow = vi.fn()

      openTool('terminal', openWindow)

      const config = openWindow.mock.calls[0][0]
      expect(config.width).toBe(750)
      expect(config.height).toBe(500)
    })
  })
})
