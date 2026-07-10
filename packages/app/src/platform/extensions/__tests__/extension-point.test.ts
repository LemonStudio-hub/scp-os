import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ExtensionRegistry,
  getGlobalExtensionRegistry,
  resetGlobalExtensionRegistry,
} from '../extension-point'
import type { Extension } from '../../plugins/types'

// Silence logger calls
vi.mock('../../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('ExtensionRegistry', () => {
  let registry: ExtensionRegistry

  beforeEach(() => {
    resetGlobalExtensionRegistry()
    registry = new ExtensionRegistry()
  })

  describe('built-in extension points', () => {
    it('registers command, theme, data-source, and ui-component on construction', () => {
      expect(registry.hasExtensionPoint('command')).toBe(true)
      expect(registry.hasExtensionPoint('theme')).toBe(true)
      expect(registry.hasExtensionPoint('data-source')).toBe(true)
      expect(registry.hasExtensionPoint('ui-component')).toBe(true)
    })

    it('getExtensionPoint returns the built-in extension point', () => {
      const ep = registry.getExtensionPoint('command')
      expect(ep).toBeDefined()
      expect(ep!.id).toBe('command')
      expect(ep!.name).toBe('Command')
    })
  })

  describe('registerExtensionPoint / unregisterExtensionPoint', () => {
    it('registers a new extension point', () => {
      const ep = registry.registerExtensionPoint('custom', 'Custom', 'A custom point')
      expect(ep.id).toBe('custom')
      expect(registry.hasExtensionPoint('custom')).toBe(true)
    })

    it('throws when registering duplicate extension point', () => {
      expect(() => registry.registerExtensionPoint('command', 'Command', 'dup')).toThrow(
        'already exists'
      )
    })

    it('unregisters an extension point', () => {
      registry.registerExtensionPoint('temp', 'Temp', 'temp')
      registry.unregisterExtensionPoint('temp')
      expect(registry.hasExtensionPoint('temp')).toBe(false)
    })

    it('throws when unregistering non-existent extension point', () => {
      expect(() => registry.unregisterExtensionPoint('missing')).toThrow('not found')
    })
  })

  describe('getAllExtensionPoints', () => {
    it('returns all extension points including built-ins', () => {
      const all = registry.getAllExtensionPoints()
      expect(all.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('registerExtension / unregisterExtension', () => {
    const makeExtension = (id: string): Extension => ({
      id,
      name: id,
      description: `Extension ${id}`,
      data: {},
    })

    it('registers an extension to an extension point', () => {
      registry.registerExtension('command', makeExtension('ls'))
      const ext = registry.getExtension('command', 'ls')
      expect(ext).toBeDefined()
      expect(ext!.id).toBe('ls')
    })

    it('throws when registering to non-existent extension point', () => {
      expect(() => registry.registerExtension('missing', makeExtension('x'))).toThrow('not found')
    })

    it('throws when registering duplicate extension', () => {
      registry.registerExtension('command', makeExtension('ls'))
      expect(() => registry.registerExtension('command', makeExtension('ls'))).toThrow(
        'already exists'
      )
    })

    it('unregisters an extension', () => {
      registry.registerExtension('command', makeExtension('ls'))
      registry.unregisterExtension('command', 'ls')
      expect(registry.getExtension('command', 'ls')).toBeUndefined()
    })

    it('throws when unregistering non-existent extension', () => {
      expect(() => registry.unregisterExtension('command', 'missing')).toThrow('not found')
    })
  })

  describe('getExtension / getExtensions', () => {
    it('getExtension throws for non-existent extension point', () => {
      expect(() => registry.getExtension('missing', 'x')).toThrow('not found')
    })

    it('getExtensions returns all extensions in a point', () => {
      registry.registerExtension('command', {
        id: 'ls',
        name: 'ls',
        data: {},
      })
      registry.registerExtension('command', {
        id: 'cd',
        name: 'cd',
        data: {},
      })
      expect(registry.getExtensions('command').length).toBeGreaterThanOrEqual(2)
    })

    it('getExtensions throws for non-existent extension point', () => {
      expect(() => registry.getExtensions('missing')).toThrow('not found')
    })
  })

  describe('clearExtensions', () => {
    it('clears all extensions from an extension point', () => {
      registry.registerExtension('command', { id: 'ls', name: 'ls', data: {} })
      registry.clearExtensions('command')
      expect(registry.getExtensions('command')).toHaveLength(0)
    })

    it('throws for non-existent extension point', () => {
      expect(() => registry.clearExtensions('missing')).toThrow('not found')
    })
  })

  describe('registerCommand', () => {
    it('registers a command and its aliases', () => {
      registry.registerCommand({
        name: 'list',
        description: 'List files',
        aliases: ['ls', 'dir'],
        handler: vi.fn(),
      })

      const main = registry.getExtension('command', 'list')
      const ls = registry.getExtension('command', 'ls')
      const dir = registry.getExtension('command', 'dir')

      expect(main).toBeDefined()
      expect(ls).toBeDefined()
      expect(dir).toBeDefined()
      expect(ls!.name).toBe('list')
    })

    it('registers command without aliases', () => {
      registry.registerCommand({
        name: 'help',
        description: 'Show help',
        handler: vi.fn(),
      })

      expect(registry.getExtension('command', 'help')).toBeDefined()
    })
  })

  describe('registerTheme', () => {
    it('registers a theme extension', () => {
      registry.registerTheme({ name: 'dark', colors: {} })
      const ext = registry.getExtension('theme', 'dark')
      expect(ext).toBeDefined()
      expect(ext!.name).toBe('dark')
    })
  })

  describe('clear', () => {
    it('clears all extension points', () => {
      registry.clear()
      expect(registry.getAllExtensionPoints()).toHaveLength(0)
    })
  })

  describe('global singleton', () => {
    it('getGlobalExtensionRegistry returns a singleton', () => {
      const a = getGlobalExtensionRegistry()
      const b = getGlobalExtensionRegistry()
      expect(a).toBe(b)
    })

    it('resetGlobalExtensionRegistry creates a new instance', () => {
      const a = getGlobalExtensionRegistry()
      resetGlobalExtensionRegistry()
      const b = getGlobalExtensionRegistry()
      expect(a).not.toBe(b)
    })
  })
})
