/**
 * Theme Store
 *
 * Manages the current theme, persists selection in localStorage,
 * and applies theme colors to CSS custom properties. Supports custom accent colors.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { themes, availableThemes, darkTheme, type Theme } from '../themes'

const THEME_STORAGE_KEY = 'scp-os-selected-theme'
const CUSTOM_ACCENT_KEY = 'scp-os-custom-accent'

// Helper to adjust hex color brightness
function adjustColorBrightness(hex: string, percent: number): string {
  let c = hex.substring(1)
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]
  }
  let r = parseInt(c.substring(0, 2), 16)
  let g = parseInt(c.substring(2, 4), 16)
  let b = parseInt(c.substring(4, 6), 16)

  r = Math.min(255, Math.max(0, r + (r * percent) / 100))
  g = Math.min(255, Math.max(0, g + (g * percent) / 100))
  b = Math.min(255, Math.max(0, b + (b * percent) / 100))

  const rr = Math.round(r).toString(16).padStart(2, '0')
  const gg = Math.round(g).toString(16).padStart(2, '0')
  const bb = Math.round(b).toString(16).padStart(2, '0')

  return `#${rr}${gg}${bb}`
}

// Helper to convert hex to rgba
function hexToRgbA(hex: string, alpha: number): string {
  let c = hex.substring(1)
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]
  }
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const useThemeStore = defineStore('theme', () => {
  const currentThemeId = ref<string>(loadSavedTheme())
  const isInitialized = ref(false)

  function loadSavedTheme(): string {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY)
      if (saved && themes[saved]) return saved
    } catch {
      /* ignore */
    }
    return 'dark'
  }

  function loadCustomAccent(): string | null {
    try {
      return localStorage.getItem(CUSTOM_ACCENT_KEY)
    } catch {
      return null
    }
  }

  const currentTheme = ref<Theme>(themes[currentThemeId.value] || darkTheme)
  const customAccentColor = ref<string | null>(loadCustomAccent())

  // Apply theme immediately when store is created (before component mount)
  if (typeof document !== 'undefined') {
    applyTheme(currentTheme.value)
  }

  /**
   * Apply a theme's colors to CSS custom properties.
   */
  function applyTheme(theme: Theme): void {
    const root = document.documentElement
    const c = theme.colors

    // UI Colors
    root.style.setProperty('--gui-bg-base', c.bgBase)
    root.style.setProperty('--gui-bg-surface', c.bgSurface)
    root.style.setProperty('--gui-bg-surface-raised', c.bgSurfaceRaised)
    root.style.setProperty('--gui-bg-surface-overlay', c.bgSurfaceOverlay)
    root.style.setProperty('--gui-bg-surface-hover', c.bgSurfaceHover)
    root.style.setProperty('--gui-bg-surface-active', c.bgSurfaceActive)
    root.style.setProperty('--gui-text-primary', c.textPrimary)
    root.style.setProperty('--gui-text-secondary', c.textSecondary)
    root.style.setProperty('--gui-text-tertiary', c.textTertiary)
    root.style.setProperty('--gui-text-disabled', c.textDisabled)
    root.style.setProperty('--gui-text-inverse', c.textInverse)

    // Dynamic accent color calculation
    const accent = customAccentColor.value || c.accent
    const accentHover = customAccentColor.value ? adjustColorBrightness(customAccentColor.value, 15) : c.accentHover
    const accentMuted = customAccentColor.value ? adjustColorBrightness(customAccentColor.value, -15) : c.accentMuted
    const accentGlow = customAccentColor.value ? hexToRgbA(customAccentColor.value, 0.25) : c.accentGlow
    const accentSoft = customAccentColor.value ? hexToRgbA(customAccentColor.value, 0.08) : c.accentSoft

    root.style.setProperty('--gui-accent', accent)
    root.style.setProperty('--gui-accent-hover', accentHover)
    root.style.setProperty('--gui-accent-muted', accentMuted)
    root.style.setProperty('--gui-accent-glow', accentGlow)
    root.style.setProperty('--gui-accent-soft', accentSoft)

    root.style.setProperty('--gui-border-subtle', c.borderSubtle)
    root.style.setProperty('--gui-border-default', c.borderDefault)
    root.style.setProperty('--gui-border-strong', c.borderStrong)
    root.style.setProperty('--gui-separator', c.separator)
    root.style.setProperty('--gui-success', c.success)
    root.style.setProperty('--gui-warning', c.warning)
    root.style.setProperty('--gui-error', c.error)
    root.style.setProperty('--gui-info', c.info)
    root.style.setProperty('--gui-glass-bg', c.glassBg)
    root.style.setProperty('--gui-glass-bg-strong', c.glassBgStrong)
    root.style.setProperty('--gui-glass-border', c.glassBorder)
    root.style.setProperty('--gui-dock-bg', c.dockBg)
    root.style.setProperty('--gui-dock-border', c.dockBorder)
    root.style.setProperty('--gui-dock-item-bg', c.dockItemBg)
    root.style.setProperty('--gui-dock-item-hover', c.dockItemHover)
    root.style.setProperty('--gui-dock-item-active', c.dockItemActive)
    root.style.setProperty('--gui-window-header-bg', c.windowHeaderBg)
    root.style.setProperty('--gui-window-border', c.windowBorder)
    root.style.setProperty('--gui-window-border-active', c.windowBorderActive)
    root.style.setProperty('--gui-app-icon-from', c.appIconFrom)
    root.style.setProperty('--gui-app-icon-to', c.appIconTo)
    root.style.setProperty('--gui-wallpaper-gradient1', c.wallpaperGradient1)
    root.style.setProperty('--gui-wallpaper-gradient2', c.wallpaperGradient2)
    root.style.setProperty('--gui-wallpaper-gradient3', c.wallpaperGradient3)
    root.style.setProperty('--gui-status-bar-text', c.statusBarText)
    root.style.setProperty('--gui-status-bar-battery', c.statusBarBattery)
    root.style.setProperty('--gui-handle-bar', c.handleBar)
    root.style.setProperty('--gui-home-indicator', c.homeIndicator)
    root.style.setProperty('--gui-backdrop-bg', c.backdropBg)
    root.style.setProperty('--gui-file-selected', c.fileSelected)
    root.style.setProperty('--gui-file-hover', c.fileHover)
    root.style.setProperty('--gui-editor-gutter', c.editorGutter)
    root.style.setProperty('--gui-editor-line-highlight', c.editorLineHighlight)
    root.style.setProperty('--gui-ios-toggle-off', c.iosToggleOff)
    root.style.setProperty('--gui-ios-toggle-on', c.iosToggleOn)
    root.style.setProperty('--gui-ios-toggle-thumb', c.iosToggleThumb)
    root.style.setProperty('--gui-ios-slider-track', c.iosSliderTrack)
    root.style.setProperty('--gui-ios-slider-thumb', c.iosSliderThumb)
    root.style.setProperty('--gui-icon-fg', c.iconFg)
    root.style.setProperty('--gui-error-bg', c.errorBg)
    root.style.setProperty('--gui-warning-bg', c.warningBg)
    root.style.setProperty('--gui-success-bg', c.successBg)
    root.style.setProperty('--gui-editor-bg', c.editorBg)
    root.style.setProperty('--gui-inner-glow', c.innerGlow)

    // Apply dynamic shadows based on light/dark mode
    if (theme.isDark) {
      root.style.setProperty('--gui-shadow-sm', '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)')
      root.style.setProperty('--gui-shadow-base', '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)')
      root.style.setProperty('--gui-shadow-md', '0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.3)')
      root.style.setProperty('--gui-shadow-lg', '0 16px 40px rgba(0, 0, 0, 0.6), 0 6px 12px rgba(0, 0, 0, 0.4)')
      root.style.setProperty('--gui-shadow-xl', '0 24px 48px rgba(0, 0, 0, 0.7)')
      root.style.setProperty('--gui-shadow-ios-card', '0 2px 12px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 0, 0, 0.3)')
      root.style.setProperty('--gui-shadow-ios-sheet', '0 -10px 40px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.1)')
      root.style.setProperty('--gui-shadow-ios-dropdown', '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.08)')
      root.style.setProperty('--gui-shadow-ios-modal', '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 1px rgba(255, 255, 255, 0.06)')
    } else {
      root.style.setProperty('--gui-shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.02)')
      root.style.setProperty('--gui-shadow-base', '0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)')
      root.style.setProperty('--gui-shadow-md', '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)')
      root.style.setProperty('--gui-shadow-lg', '0 16px 36px rgba(0, 0, 0, 0.10), 0 4px 12px rgba(0, 0, 0, 0.05)')
      root.style.setProperty('--gui-shadow-xl', '0 24px 48px rgba(0, 0, 0, 0.12)')
      root.style.setProperty('--gui-shadow-ios-card', '0 4px 16px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.03)')
      root.style.setProperty('--gui-shadow-ios-sheet', '0 -10px 40px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.04)')
      root.style.setProperty('--gui-shadow-ios-dropdown', '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.04)')
      root.style.setProperty('--gui-shadow-ios-modal', '0 20px 50px rgba(0, 0, 0, 0.10), 0 0 1px rgba(0, 0, 0, 0.05)')
    }

    // Remove previous theme classes
    availableThemes.forEach(t => {
      root.classList.remove(t.id)
    })
    // Add current theme class
    root.classList.add(theme.id)

    // Update light/dark class on html element
    if (theme.isDark) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }

    // Update body background and color to match theme
    const body = document.body
    if (body) {
      body.style.background = c.bgBase
      body.style.color = c.textPrimary
    }
  }

  /**
   * Set the current theme and persist the selection.
   */
  function setTheme(themeId: string): void {
    const theme = themes[themeId]
    if (!theme) return

    currentThemeId.value = themeId
    currentTheme.value = theme

    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId)
    } catch {
      /* ignore */
    }

    applyTheme(theme)
  }

  /**
   * Set a custom accent color and apply it.
   */
  function setCustomAccentColor(color: string | null): void {
    customAccentColor.value = color
    try {
      if (color) {
        localStorage.setItem(CUSTOM_ACCENT_KEY, color)
      } else {
        localStorage.removeItem(CUSTOM_ACCENT_KEY)
      }
    } catch {
      /* ignore */
    }
    applyTheme(currentTheme.value)
  }

  /**
   * Initialize the theme store.
   */
  function init(): void {
    applyTheme(currentTheme.value)
    isInitialized.value = true
  }

  return {
    currentThemeId,
    currentTheme,
    customAccentColor,
    isInitialized,
    availableThemes,
    themes,
    setTheme,
    setCustomAccentColor,
    init,
  }
})
