/**
 * Theme Store
 * 
 * Manages the current theme, persists selection in localStorage,
 * and applies theme colors to CSS custom properties.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { themes, availableThemes, darkTheme, type Theme } from '../themes'

const THEME_STORAGE_KEY = 'scp-os-selected-theme'

export const useThemeStore = defineStore('theme', () => {
  const currentThemeId = ref<string>(loadSavedTheme())
  const isInitialized = ref(false)

  function loadSavedTheme(): string {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY)
      if (saved && themes[saved]) return saved
    } catch { /* ignore */ }
    return 'dark'
  }

  const currentTheme = ref<Theme>(themes[currentThemeId.value] || darkTheme)

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
    root.style.setProperty('--gui-accent', c.accent)
    root.style.setProperty('--gui-accent-hover', c.accentHover)
    root.style.setProperty('--gui-accent-muted', c.accentMuted)
    root.style.setProperty('--gui-accent-glow', c.accentGlow)
    root.style.setProperty('--gui-accent-soft', c.accentSoft)
    root.style.setProperty('--gui-border-subtle', c.borderSubtle)
    root.style.setProperty('--gui-border-default', c.borderDefault)
    root.style.setProperty('--gui-border-strong', c.borderStrong)
    root.style.setProperty('--gui-separator', c.separator)
    root.style.setProperty('--gui-success', c.success)
    root.style.setProperty('--gui-warning', c.warning)
    root.style.setProperty('--gui-error', c.error)
    root.style.setProperty('--gui-info', c.info)
    root.style.setProperty('--gui-glass-bg', c.glassBg)
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

    // Update light/dark class on html element
    if (theme.isDark) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
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
    } catch { /* ignore */ }

    applyTheme(theme)
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
    isInitialized,
    availableThemes,
    themes,
    setTheme,
    init,
  }
})
