import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseShortcut,
  matchesShortcut,
  formatShortcut,
  registerShortcut,
  unregisterShortcut,
  updateShortcut,
  getShortcuts,
  setContext,
  getContext,
  useKeyboardShortcuts,
} from '../useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    const shortcuts = getShortcuts()
    shortcuts.forEach((s) => unregisterShortcut(s.id))
    setContext('global')
  })

  describe('parseShortcut', () => {
    it('should parse Ctrl+T', () => {
      const binding = parseShortcut('Ctrl+T')
      expect(binding.ctrlOrMeta).toBe(true)
      expect(binding.shift).toBe(false)
      expect(binding.alt).toBe(false)
      expect(binding.key).toBe('T')
    })

    it('should parse Cmd+Shift+M', () => {
      const binding = parseShortcut('Cmd+Shift+M')
      expect(binding.ctrlOrMeta).toBe(true)
      expect(binding.shift).toBe(true)
      expect(binding.alt).toBe(false)
      expect(binding.key).toBe('M')
    })

    it('should parse Alt+Enter', () => {
      const binding = parseShortcut('Alt+Enter')
      expect(binding.ctrlOrMeta).toBe(false)
      expect(binding.shift).toBe(false)
      expect(binding.alt).toBe(true)
      expect(binding.key).toBe('Enter')
    })

    it('should parse Meta as ctrlOrMeta', () => {
      const binding = parseShortcut('Meta+K')
      expect(binding.ctrlOrMeta).toBe(true)
    })

    it('should parse Option as alt', () => {
      const binding = parseShortcut('Option+P')
      expect(binding.alt).toBe(true)
    })

    it('should parse Command as ctrlOrMeta', () => {
      const binding = parseShortcut('Command+R')
      expect(binding.ctrlOrMeta).toBe(true)
    })

    it('should handle single key', () => {
      const binding = parseShortcut('Escape')
      expect(binding.key).toBe('Escape')
      expect(binding.ctrlOrMeta).toBe(false)
      expect(binding.shift).toBe(false)
      expect(binding.alt).toBe(false)
    })
  })

  describe('matchesShortcut', () => {
    it('should match Ctrl+T on Windows', () => {
      const binding = parseShortcut('Ctrl+T')
      const event = new KeyboardEvent('keydown', {
        key: 't',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
      })
      Object.defineProperty(event, 'metaKey', { value: false })

      const originalPlatform = navigator.platform
      Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })

      expect(matchesShortcut(event, binding)).toBe(true)

      Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true })
    })

    it('should not match when modifier differs', () => {
      const binding = parseShortcut('Ctrl+T')
      const event = new KeyboardEvent('keydown', {
        key: 't',
        ctrlKey: false,
        shiftKey: true,
      })

      expect(matchesShortcut(event, binding)).toBe(false)
    })

    it('should match case-insensitively for letters', () => {
      const binding = parseShortcut('Ctrl+T')
      const event = new KeyboardEvent('keydown', {
        key: 'T',
        ctrlKey: true,
      })

      expect(matchesShortcut(event, binding)).toBe(true)
    })
  })

  describe('formatShortcut', () => {
    it('should format for Windows', () => {
      Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })
      expect(formatShortcut('Ctrl+T')).toBe('Ctrl+T')
      expect(formatShortcut('Ctrl+Shift+M')).toBe('Ctrl+Shift+M')
    })

    it('should format for Mac', () => {
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true })
      expect(formatShortcut('Cmd+T')).toBe('⌘T')
      expect(formatShortcut('Cmd+Shift+M')).toBe('⌘⇧M')
    })
  })

  describe('registerShortcut', () => {
    it('should register a new shortcut', () => {
      const handler = vi.fn()
      registerShortcut({
        id: 'test-shortcut',
        keys: 'Ctrl+T',
        description: 'Test shortcut',
        category: 'test',
        handler,
      })

      const shortcuts = getShortcuts()
      expect(shortcuts.find((s) => s.id === 'test-shortcut')).toBeDefined()
    })

    it('should update existing shortcut', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      registerShortcut({
        id: 'test-shortcut',
        keys: 'Ctrl+T',
        description: 'Original',
        category: 'test',
        handler: handler1,
      })

      registerShortcut({
        id: 'test-shortcut',
        keys: 'Ctrl+Shift+T',
        description: 'Updated',
        category: 'test',
        handler: handler2,
      })

      const shortcuts = getShortcuts()
      const shortcut = shortcuts.find((s) => s.id === 'test-shortcut')
      expect(shortcut?.keys).toBe('Ctrl+Shift+T')
      expect(shortcut?.description).toBe('Updated')
    })

    it('should set default values', () => {
      registerShortcut({
        id: 'test-shortcut',
        keys: 'Ctrl+T',
        description: 'Test',
        category: 'test',
        handler: vi.fn(),
      })

      const shortcut = getShortcuts().find((s) => s.id === 'test-shortcut')
      expect(shortcut?.enabled).toBe(true)
      expect(shortcut?.preventDefault).toBe(true)
      expect(shortcut?.context).toBe('global')
    })
  })

  describe('unregisterShortcut', () => {
    it('should remove shortcut by id', () => {
      registerShortcut({
        id: 'test-shortcut',
        keys: 'Ctrl+T',
        description: 'Test',
        category: 'test',
        handler: vi.fn(),
      })

      unregisterShortcut('test-shortcut')
      expect(getShortcuts().find((s) => s.id === 'test-shortcut')).toBeUndefined()
    })

    it('should do nothing for non-existent id', () => {
      expect(() => unregisterShortcut('non-existent')).not.toThrow()
    })
  })

  describe('updateShortcut', () => {
    it('should update shortcut properties', () => {
      registerShortcut({
        id: 'test-shortcut',
        keys: 'Ctrl+T',
        description: 'Original',
        category: 'test',
        handler: vi.fn(),
      })

      updateShortcut('test-shortcut', { enabled: false, description: 'Disabled' })

      const shortcut = getShortcuts().find((s) => s.id === 'test-shortcut')
      expect(shortcut?.enabled).toBe(false)
      expect(shortcut?.description).toBe('Disabled')
    })

    it('should do nothing for non-existent id', () => {
      expect(() => updateShortcut('non-existent', { enabled: false })).not.toThrow()
    })
  })

  describe('getShortcuts', () => {
    it('should return all shortcuts', () => {
      registerShortcut({
        id: 's1',
        keys: 'Ctrl+1',
        description: 'S1',
        category: 'cat1',
        handler: vi.fn(),
      })
      registerShortcut({
        id: 's2',
        keys: 'Ctrl+2',
        description: 'S2',
        category: 'cat2',
        handler: vi.fn(),
      })

      expect(getShortcuts()).toHaveLength(2)
    })

    it('should filter by category', () => {
      registerShortcut({
        id: 's1',
        keys: 'Ctrl+1',
        description: 'S1',
        category: 'cat1',
        handler: vi.fn(),
      })
      registerShortcut({
        id: 's2',
        keys: 'Ctrl+2',
        description: 'S2',
        category: 'cat2',
        handler: vi.fn(),
      })

      expect(getShortcuts('cat1')).toHaveLength(1)
    })
  })

  describe('context', () => {
    it('should set and get context', () => {
      setContext('editor')
      expect(getContext()).toBe('editor')
    })

    it('should default to global', () => {
      setContext('global')
      expect(getContext()).toBe('global')
    })
  })

  describe('useKeyboardShortcuts composable', () => {
    it('should return API methods', () => {
      const api = useKeyboardShortcuts()
      expect(api.registerShortcut).toBeDefined()
      expect(api.unregisterShortcut).toBeDefined()
      expect(api.enable).toBeDefined()
      expect(api.disable).toBeDefined()
      expect(api.toggle).toBeDefined()
      expect(api.setup).toBeDefined()
      expect(api.cleanup).toBeDefined()
    })

    it('should enable and disable shortcuts', () => {
      const api = useKeyboardShortcuts()
      api.disable()
      expect(api.enabled.value).toBe(false)
      api.enable()
      expect(api.enabled.value).toBe(true)
      api.toggle()
      expect(api.enabled.value).toBe(false)
    })
  })
})
