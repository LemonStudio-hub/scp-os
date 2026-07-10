import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CapabilityManagerService } from '../capability-manager.service'
import type { IEventBus } from '../../events/event-bus'

const createEventBus = (): IEventBus => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  once: vi.fn(),
  removeAllListeners: vi.fn(),
  listenerCount: vi.fn().mockReturnValue(0),
})

const stubCapability = () => ({
  initialize: vi.fn(),
  write: vi.fn(),
  writeln: vi.fn(),
  clear: vi.fn(),
  executeCommand: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
})

describe('CapabilityManagerService', () => {
  let manager: CapabilityManagerService
  let eventBus: IEventBus

  beforeEach(() => {
    eventBus = createEventBus()
    manager = new CapabilityManagerService(eventBus)
  })

  describe('terminal capabilities', () => {
    it('registers and retrieves a terminal capability', () => {
      const cap = stubCapability() as any
      manager.registerTerminalCapability('bash', cap)
      expect(manager.getTerminalCapability('bash')).toBe(cap)
    })

    it('getTerminalCapability returns null for unknown name', () => {
      expect(manager.getTerminalCapability('missing')).toBeNull()
    })

    it('getDefaultTerminalCapability returns the first registered', () => {
      const cap1 = stubCapability() as any
      const cap2 = stubCapability() as any
      manager.registerTerminalCapability('bash', cap1)
      manager.registerTerminalCapability('zsh', cap2)
      expect(manager.getDefaultTerminalCapability()).toBe(cap1)
    })

    it('getDefaultTerminalCapability returns null when empty', () => {
      expect(manager.getDefaultTerminalCapability()).toBeNull()
    })

    it('getTerminalCapabilityNames returns all names', () => {
      manager.registerTerminalCapability('bash', stubCapability() as any)
      manager.registerTerminalCapability('zsh', stubCapability() as any)
      expect(manager.getTerminalCapabilityNames()).toEqual(['bash', 'zsh'])
    })

    it('unregisterTerminalCapability removes the capability', () => {
      manager.registerTerminalCapability('bash', stubCapability() as any)
      manager.unregisterTerminalCapability('bash')
      expect(manager.getTerminalCapability('bash')).toBeNull()
    })

    it('hasTerminalCapability returns correct boolean', () => {
      manager.registerTerminalCapability('bash', stubCapability() as any)
      expect(manager.hasTerminalCapability('bash')).toBe(true)
      expect(manager.hasTerminalCapability('zsh')).toBe(false)
    })
  })

  describe('data capabilities', () => {
    const stubDataCap = () => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      query: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    })

    it('registers and retrieves a data capability', () => {
      const cap = stubDataCap() as any
      manager.registerDataCapability('sqlite', cap)
      expect(manager.getDataCapability('sqlite')).toBe(cap)
    })

    it('getDefaultDataCapability returns the first registered', () => {
      const cap1 = stubDataCap() as any
      manager.registerDataCapability('sqlite', cap1)
      manager.registerDataCapability('redis', stubDataCap() as any)
      expect(manager.getDefaultDataCapability()).toBe(cap1)
    })

    it('getDefaultDataCapability returns null when empty', () => {
      expect(manager.getDefaultDataCapability()).toBeNull()
    })

    it('getDataCapabilityNames returns all names', () => {
      manager.registerDataCapability('sqlite', stubDataCap() as any)
      manager.registerDataCapability('redis', stubDataCap() as any)
      expect(manager.getDataCapabilityNames()).toEqual(['sqlite', 'redis'])
    })

    it('unregisterDataCapability removes the capability', () => {
      manager.registerDataCapability('sqlite', stubDataCap() as any)
      manager.unregisterDataCapability('sqlite')
      expect(manager.getDataCapability('sqlite')).toBeNull()
    })

    it('hasDataCapability returns correct boolean', () => {
      manager.registerDataCapability('sqlite', stubDataCap() as any)
      expect(manager.hasDataCapability('sqlite')).toBe(true)
      expect(manager.hasDataCapability('redis')).toBe(false)
    })
  })

  describe('UI capabilities', () => {
    const stubUICap = () => ({
      renderComponent: vi.fn(),
      destroyComponent: vi.fn(),
      updateTheme: vi.fn(),
      getComponent: vi.fn(),
    })

    it('registers and retrieves a UI capability', () => {
      const cap = stubUICap() as any
      manager.registerUICapability('vue', cap)
      expect(manager.getUICapability('vue')).toBe(cap)
    })

    it('getDefaultUICapability returns the first registered', () => {
      const cap1 = stubUICap() as any
      manager.registerUICapability('vue', cap1)
      manager.registerUICapability('react', stubUICap() as any)
      expect(manager.getDefaultUICapability()).toBe(cap1)
    })

    it('getDefaultUICapability returns null when empty', () => {
      expect(manager.getDefaultUICapability()).toBeNull()
    })

    it('getUICapabilityNames returns all names', () => {
      manager.registerUICapability('vue', stubUICap() as any)
      manager.registerUICapability('react', stubUICap() as any)
      expect(manager.getUICapabilityNames()).toEqual(['vue', 'react'])
    })

    it('unregisterUICapability removes the capability', () => {
      manager.registerUICapability('vue', stubUICap() as any)
      manager.unregisterUICapability('vue')
      expect(manager.getUICapability('vue')).toBeNull()
    })

    it('hasUICapability returns correct boolean', () => {
      manager.registerUICapability('vue', stubUICap() as any)
      expect(manager.hasUICapability('vue')).toBe(true)
      expect(manager.hasUICapability('react')).toBe(false)
    })
  })

  describe('getStatistics', () => {
    it('returns correct counts', () => {
      manager.registerTerminalCapability('bash', stubCapability() as any)
      manager.registerTerminalCapability('zsh', stubCapability() as any)
      manager.registerDataCapability('sqlite', {} as any)
      manager.registerUICapability('vue', {} as any)

      const stats = manager.getStatistics()
      expect(stats.terminalCapabilities).toBe(2)
      expect(stats.dataCapabilities).toBe(1)
      expect(stats.uiCapabilities).toBe(1)
      expect(stats.totalCapabilities).toBe(4)
    })

    it('returns zeroes when empty', () => {
      const stats = manager.getStatistics()
      expect(stats.totalCapabilities).toBe(0)
    })
  })

  describe('clear', () => {
    it('clears all capabilities', () => {
      manager.registerTerminalCapability('bash', stubCapability() as any)
      manager.registerDataCapability('sqlite', {} as any)
      manager.registerUICapability('vue', {} as any)

      manager.clear()

      expect(manager.getStatistics().totalCapabilities).toBe(0)
    })

    it('emits capability:registry:cleared event', () => {
      manager.clear()
      expect(eventBus.emit).toHaveBeenCalledWith('capability:registry:cleared', {})
    })
  })

  describe('event emission', () => {
    it('emits capability:registered on register', () => {
      manager.registerTerminalCapability('bash', stubCapability() as any)
      expect(eventBus.emit).toHaveBeenCalledWith('capability:registered', {
        type: 'terminal',
        name: 'bash',
      })
    })

    it('emits capability:unregistered on unregister', () => {
      manager.registerTerminalCapability('bash', stubCapability() as any)
      manager.unregisterTerminalCapability('bash')
      expect(eventBus.emit).toHaveBeenCalledWith('capability:unregistered', {
        type: 'terminal',
        name: 'bash',
      })
    })
  })
})
