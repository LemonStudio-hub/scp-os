import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTerminalPanelStore } from '../terminalPanel'

describe('TerminalPanelStore', () => {
  let store: ReturnType<typeof useTerminalPanelStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTerminalPanelStore()
  })

  function createMockTerminal(overrides?: Record<string, unknown>) {
    return {
      destroy: vi.fn(),
      clear: vi.fn(),
      options: { fontSize: 13 },
      ...overrides,
    }
  }

  describe('registerTerminal', () => {
    it('should add terminal instance to the map', () => {
      const instance = createMockTerminal()
      store.registerTerminal('term-1', instance)

      expect(store.terminalInstances.has('term-1')).toBe(true)
      expect(store.terminalInstances.get('term-1')).toStrictEqual(instance)
    })

    it('should set the registered terminal as active', () => {
      const instance = createMockTerminal()
      store.registerTerminal('term-1', instance)

      expect(store.activeTerminalId).toBe('term-1')
    })

    it('should update active terminal when registering a new one', () => {
      store.registerTerminal('term-1', createMockTerminal())
      store.registerTerminal('term-2', createMockTerminal())

      expect(store.activeTerminalId).toBe('term-2')
      expect(store.terminalInstances.size).toBe(2)
    })
  })

  describe('unregisterTerminal', () => {
    it('should call destroy on the terminal instance', () => {
      const instance = createMockTerminal()
      store.registerTerminal('term-1', instance)

      store.unregisterTerminal('term-1')

      expect(instance.destroy).toHaveBeenCalledOnce()
    })

    it('should remove the terminal from the map', () => {
      store.registerTerminal('term-1', createMockTerminal())

      store.unregisterTerminal('term-1')

      expect(store.terminalInstances.has('term-1')).toBe(false)
    })

    it('should clear activeTerminalId if removing the active terminal', () => {
      store.registerTerminal('term-1', createMockTerminal())
      expect(store.activeTerminalId).toBe('term-1')

      store.unregisterTerminal('term-1')

      expect(store.activeTerminalId).toBeNull()
    })

    it('should not clear activeTerminalId if removing a non-active terminal', () => {
      store.registerTerminal('term-1', createMockTerminal())
      store.registerTerminal('term-2', createMockTerminal())

      store.unregisterTerminal('term-1')

      expect(store.activeTerminalId).toBe('term-2')
    })

    it('should handle unregistering a non-existent terminal gracefully', () => {
      expect(() => store.unregisterTerminal('non-existent')).not.toThrow()
    })

    it('should handle instance without destroy method', () => {
      const instance = { options: { fontSize: 13 } }
      store.registerTerminal('term-1', instance)

      expect(() => store.unregisterTerminal('term-1')).not.toThrow()
      expect(store.terminalInstances.has('term-1')).toBe(false)
    })
  })

  describe('setFontSize', () => {
    it('should update the fontSize ref', () => {
      store.setFontSize(16)
      expect(store.fontSize).toBe(16)
    })

    it('should update fontSize on all registered terminal instances', () => {
      const instance1 = createMockTerminal()
      const instance2 = createMockTerminal()
      store.registerTerminal('term-1', instance1)
      store.registerTerminal('term-2', instance2)

      store.setFontSize(18)

      expect(instance1.options.fontSize).toBe(18)
      expect(instance2.options.fontSize).toBe(18)
    })

    it('should skip instances without options', () => {
      const instance = { destroy: vi.fn(), clear: vi.fn() }
      store.registerTerminal('term-1', instance)

      expect(() => store.setFontSize(20)).not.toThrow()
      expect(store.fontSize).toBe(20)
    })
  })

  describe('clear', () => {
    it('should call clear on the active terminal instance', () => {
      const instance = createMockTerminal()
      store.registerTerminal('term-1', instance)

      store.clear()

      expect(instance.clear).toHaveBeenCalledOnce()
    })

    it('should do nothing when no terminal is active', () => {
      expect(() => store.clear()).not.toThrow()
    })

    it('should do nothing when active terminal has no clear method', () => {
      store.registerTerminal('term-1', { options: {} })

      expect(() => store.clear()).not.toThrow()
    })

    it('should clear only the active terminal, not others', () => {
      const instance1 = createMockTerminal()
      const instance2 = createMockTerminal()
      store.registerTerminal('term-1', instance1)
      store.registerTerminal('term-2', instance2)

      store.clear()

      expect(instance2.clear).toHaveBeenCalledOnce()
      expect(instance1.clear).not.toHaveBeenCalled()
    })
  })

  describe('default state', () => {
    it('should start with empty terminal instances map', () => {
      expect(store.terminalInstances.size).toBe(0)
    })

    it('should start with null activeTerminalId', () => {
      expect(store.activeTerminalId).toBeNull()
    })

    it('should start with default fontSize of 13', () => {
      expect(store.fontSize).toBe(13)
    })
  })
})
