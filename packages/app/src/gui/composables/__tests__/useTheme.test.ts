import { describe, it, expect, beforeEach } from 'vitest'
import { useTheme } from '../useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset documentElement style
    document.documentElement.style.removeProperty('--gui-accent')
    document.documentElement.style.removeProperty('--gui-accent-hover')
    document.documentElement.style.removeProperty('--gui-accent-soft')
    document.documentElement.style.removeProperty('--gui-accent-glow')
    // Remove dynamic style element if present
    const existing = document.getElementById('dynamic-theme-style')
    if (existing) existing.remove()
  })

  describe('accentThemes', () => {
    it('should have 8 accent themes', () => {
      const { accentThemes } = useTheme()
      expect(accentThemes).toHaveLength(8)
    })

    it('each theme should have accent, accentHover, accentSoft, accentGlow', () => {
      const { accentThemes } = useTheme()
      for (const theme of accentThemes) {
        expect(theme.value).toBeDefined()
        expect(theme.accent).toBeDefined()
        expect(theme.accentHover).toBeDefined()
        expect(theme.accentSoft).toBeDefined()
        expect(theme.accentGlow).toBeDefined()
      }
    })
  })

  describe('applyTheme', () => {
    it('should set CSS custom properties on documentElement', () => {
      const { applyTheme } = useTheme()
      applyTheme('#e94560')

      const root = document.documentElement
      expect(root.style.getPropertyValue('--gui-accent')).toBe('#e94560')
      expect(root.style.getPropertyValue('--gui-accent-hover')).toBe('#ff5a73')
      expect(root.style.getPropertyValue('--gui-accent-soft')).toBe('rgba(233, 69, 96, 0.08)')
      expect(root.style.getPropertyValue('--gui-accent-glow')).toBe('rgba(233, 69, 96, 0.25)')
    })

    it('should update currentAccent ref', () => {
      const { applyTheme, currentAccent } = useTheme()
      applyTheme('#60a5fa')
      expect(currentAccent.value).toBe('#60a5fa')
    })

    it('should fall back to default theme for unknown color', () => {
      const { applyTheme } = useTheme()
      applyTheme('#unknown')

      const root = document.documentElement
      // Should use the default (#e94560) theme
      expect(root.style.getPropertyValue('--gui-accent')).toBe('#e94560')
    })

    it('should create dynamic-theme-style element', () => {
      const { applyTheme } = useTheme()
      applyTheme('#34d399')

      const styleEl = document.getElementById('dynamic-theme-style')
      expect(styleEl).not.toBeNull()
      expect(styleEl!.tagName).toBe('STYLE')
    })

    it('should update terminal theme when terminal is provided', () => {
      const { applyTheme } = useTheme()
      const mockTerminal = {
        options: { theme: {} },
      } as any

      applyTheme('#60a5fa', mockTerminal)

      expect(mockTerminal.options.theme.cursor).toBe('#60a5fa')
      expect(mockTerminal.options.theme.foreground).toBe('#f0f0f0')
    })
  })

  describe('loadSettings', () => {
    it('should return default color when no saved settings', () => {
      const { currentAccent } = useTheme()
      // useTheme calls loadSettings internally during construction
      // With no localStorage data, it should default to '#e94560'
      expect(currentAccent.value).toBe('#e94560')
    })

    it('should load accent from localStorage', () => {
      localStorage.setItem('scp-os-app-settings', JSON.stringify({ accent: '#60a5fa' }))

      const { currentAccent } = useTheme()
      expect(currentAccent.value).toBe('#60a5fa')
    })

    it('should fall back to default when localStorage has invalid JSON', () => {
      localStorage.setItem('scp-os-app-settings', 'not-json')

      const { currentAccent } = useTheme()
      expect(currentAccent.value).toBe('#e94560')
    })

    it('should fall back to default when localStorage has no accent field', () => {
      localStorage.setItem('scp-os-app-settings', JSON.stringify({ other: 'value' }))

      const { currentAccent } = useTheme()
      expect(currentAccent.value).toBe('#e94560')
    })
  })
})
