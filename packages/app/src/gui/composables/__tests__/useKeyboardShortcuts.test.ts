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

  describe('parseShortcut - additional modifiers', () => {
    it('should parse Ctrl modifier', () => {
      const binding = parseShortcut('Ctrl+S')
      expect(binding.ctrlOrMeta).toBe(true)
      expect(binding.key).toBe('S')
    })

    it('should parse Cmd/Meta modifier', () => {
      const binding = parseShortcut('Cmd+S')
      expect(binding.ctrlOrMeta).toBe(true)
      const binding2 = parseShortcut('Meta+S')
      expect(binding2.ctrlOrMeta).toBe(true)
    })

    it('should parse Shift modifier', () => {
      const binding = parseShortcut('Shift+A')
      expect(binding.shift).toBe(true)
      expect(binding.key).toBe('A')
    })

    it('should parse Alt/Option modifier', () => {
      const binding = parseShortcut('Alt+Tab')
      expect(binding.alt).toBe(true)
      const binding2 = parseShortcut('Option+Tab')
      expect(binding2.alt).toBe(true)
    })

    it('should parse multiple modifiers combined', () => {
      const binding = parseShortcut('Ctrl+Shift+Alt+K')
      expect(binding.ctrlOrMeta).toBe(true)
      expect(binding.shift).toBe(true)
      expect(binding.alt).toBe(true)
      expect(binding.key).toBe('K')
    })

    it('should ignore unrecognized parts', () => {
      const binding = parseShortcut('Ctrl+Unknown+T')
      expect(binding.ctrlOrMeta).toBe(true)
      // 'Unknown' is not a recognized modifier, so it becomes the key
      // but 'T' overrides it since it comes later
      expect(binding.key).toBe('T')
    })
  })

  describe('matchesShortcut - platform detection', () => {
    it('should use metaKey on Mac', () => {
      const originalPlatform = navigator.platform
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true })

      const binding = parseShortcut('Ctrl+T')
      const event = new KeyboardEvent('keydown', {
        key: 't',
        ctrlKey: false,
        metaKey: true,
        shiftKey: false,
        altKey: false,
      })

      expect(matchesShortcut(event, binding)).toBe(true)

      Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true })
    })

    it('should use ctrlKey on non-Mac', () => {
      const originalPlatform = navigator.platform
      Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })

      const binding = parseShortcut('Ctrl+T')
      const event = new KeyboardEvent('keydown', {
        key: 't',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      })

      expect(matchesShortcut(event, binding)).toBe(true)

      Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true })
    })

    it('should be case-insensitive for single-char keys', () => {
      const originalPlatform = navigator.platform
      Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })

      const binding = parseShortcut('Ctrl+A')
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
      })

      expect(matchesShortcut(event, binding)).toBe(true)

      Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true })
    })

    it('should be exact match for multi-char keys', () => {
      const originalPlatform = navigator.platform
      Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })

      const binding = parseShortcut('Ctrl+Enter')
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
      })

      expect(matchesShortcut(event, binding)).toBe(true)

      Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true })
    })

    it('should not match multi-char key with wrong case', () => {
      const originalPlatform = navigator.platform
      Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })

      const binding = parseShortcut('Ctrl+Enter')
      const event = new KeyboardEvent('keydown', {
        key: 'enter',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
      })

      expect(matchesShortcut(event, binding)).toBe(false)

      Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true })
    })
  })

  describe('formatShortcut - platform-specific display', () => {
    it('should show symbols on Mac', () => {
      const originalPlatform = navigator.platform
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true })

      expect(formatShortcut('Ctrl+T')).toBe('⌃T')
      expect(formatShortcut('Cmd+Shift+M')).toBe('⌘⇧M')
      expect(formatShortcut('Alt+P')).toBe('⌥P')
      expect(formatShortcut('Option+K')).toBe('⌥K')

      Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true })
    })

    it('should show text labels on non-Mac', () => {
      const originalPlatform = navigator.platform
      Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })

      expect(formatShortcut('Ctrl+T')).toBe('Ctrl+T')
      expect(formatShortcut('Cmd+Shift+M')).toBe('Ctrl+Shift+M')
      expect(formatShortcut('Alt+P')).toBe('Alt+P')
      expect(formatShortcut('Option+K')).toBe('Alt+K')

      Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true })
    })
  })

  describe('registerShortcut - updates and defaults', () => {
    it('should update existing shortcut by ID', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      registerShortcut({
        id: 'dup-test',
        keys: 'Ctrl+A',
        description: 'First',
        category: 'test',
        handler: handler1,
      })

      registerShortcut({
        id: 'dup-test',
        keys: 'Ctrl+B',
        description: 'Second',
        category: 'test',
        handler: handler2,
      })

      const all = getShortcuts()
      const found = all.filter((s) => s.id === 'dup-test')
      expect(found).toHaveLength(1)
      expect(found[0].keys).toBe('Ctrl+B')
      expect(found[0].description).toBe('Second')
    })

    it('should insert new shortcut with defaults', () => {
      registerShortcut({
        id: 'new-test',
        keys: 'Ctrl+N',
        description: 'New',
        category: 'test',
        handler: vi.fn(),
      })

      const shortcut = getShortcuts().find((s) => s.id === 'new-test')
      expect(shortcut).toBeDefined()
      expect(shortcut!.enabled).toBe(true)
      expect(shortcut!.preventDefault).toBe(true)
      expect(shortcut!.context).toBe('global')
    })
  })

  describe('getShortcuts - filtering', () => {
    it('should return all shortcuts when no category provided', () => {
      registerShortcut({ id: 'a1', keys: 'Ctrl+1', description: 'A1', category: 'catA', handler: vi.fn() })
      registerShortcut({ id: 'a2', keys: 'Ctrl+2', description: 'A2', category: 'catB', handler: vi.fn() })
      registerShortcut({ id: 'a3', keys: 'Ctrl+3', description: 'A3', category: 'catA', handler: vi.fn() })

      const all = getShortcuts()
      expect(all.length).toBeGreaterThanOrEqual(3)
    })

    it('should filter by category when provided', () => {
      registerShortcut({ id: 'b1', keys: 'Ctrl+4', description: 'B1', category: 'filterA', handler: vi.fn() })
      registerShortcut({ id: 'b2', keys: 'Ctrl+5', description: 'B2', category: 'filterB', handler: vi.fn() })
      registerShortcut({ id: 'b3', keys: 'Ctrl+6', description: 'B3', category: 'filterA', handler: vi.fn() })

      const filtered = getShortcuts('filterA')
      expect(filtered).toHaveLength(2)
      expect(filtered.every((s) => s.category === 'filterA')).toBe(true)
    })
  })

  describe('handleKeydown - edge cases', () => {
    it('should return early when disabled', () => {
      const api = useKeyboardShortcuts()
      const handler = vi.fn()

      api.registerShortcut({
        id: 'disabled-test',
        keys: 'Ctrl+D',
        description: 'Disabled test',
        category: 'test',
        handler,
      })

      api.disable()

      const event = new KeyboardEvent('keydown', {
        key: 'd',
        ctrlKey: true,
        bubbles: true,
      })

      api.cleanup()
      api.setup()
      window.dispatchEvent(event)

      expect(handler).not.toHaveBeenCalled()
      api.cleanup()
      api.enable()
    })

    it('should skip shortcuts with enabled=false', () => {
      const api = useKeyboardShortcuts()
      const handler = vi.fn()

      api.registerShortcut({
        id: 'skip-test',
        keys: 'Ctrl+S',
        description: 'Skip test',
        category: 'test',
        handler,
        enabled: false,
      })

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      })

      api.cleanup()
      api.setup()
      window.dispatchEvent(event)

      expect(handler).not.toHaveBeenCalled()
      api.cleanup()
    })

    it('should skip shortcuts with non-matching context', () => {
      const api = useKeyboardShortcuts()
      const handler = vi.fn()

      api.setContext('editor')

      api.registerShortcut({
        id: 'context-test',
        keys: 'Ctrl+G',
        description: 'Context test',
        category: 'test',
        handler,
        context: 'terminal',
      })

      const event = new KeyboardEvent('keydown', {
        key: 'g',
        ctrlKey: true,
        bubbles: true,
      })

      api.cleanup()
      api.setup()
      window.dispatchEvent(event)

      expect(handler).not.toHaveBeenCalled()
      api.cleanup()
      api.setContext('global')
    })

    it('should call preventDefault on matching shortcut', () => {
      const originalPlatform = navigator.platform
      Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })

      const api = useKeyboardShortcuts()
      const handler = vi.fn()

      api.registerShortcut({
        id: 'prevent-test',
        keys: 'Ctrl+P',
        description: 'Prevent test',
        category: 'test',
        handler,
        preventDefault: true,
      })

      const event = new KeyboardEvent('keydown', {
        key: 'p',
        ctrlKey: true,
        bubbles: true,
      })

      const preventSpy = vi.spyOn(event, 'preventDefault')

      api.cleanup()
      api.setup()
      window.dispatchEvent(event)

      expect(preventSpy).toHaveBeenCalled()
      expect(handler).toHaveBeenCalled()
      api.cleanup()
      Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true })
    })

    it('should not call preventDefault when preventDefault is false', () => {
      const originalPlatform = navigator.platform
      Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })

      const api = useKeyboardShortcuts()
      const handler = vi.fn()

      api.registerShortcut({
        id: 'no-prevent-test',
        keys: 'Ctrl+Q',
        description: 'No prevent test',
        category: 'test',
        handler,
        preventDefault: false,
      })

      const event = new KeyboardEvent('keydown', {
        key: 'q',
        ctrlKey: true,
        bubbles: true,
      })

      const preventSpy = vi.spyOn(event, 'preventDefault')

      api.cleanup()
      api.setup()
      window.dispatchEvent(event)

      expect(preventSpy).not.toHaveBeenCalled()
      expect(handler).toHaveBeenCalled()
      api.cleanup()
      Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true })
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
