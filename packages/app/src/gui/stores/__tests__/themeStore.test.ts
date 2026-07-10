import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../themes', () => {
  const mockColors = {
    bgBase: '#000000',
    bgSurface: '#1C1C1E',
    bgSurfaceRaised: '#2C2C2E',
    bgSurfaceOverlay: '#3A3A3C',
    bgSurfaceHover: 'rgba(255,255,255,0.06)',
    bgSurfaceActive: 'rgba(255,255,255,0.1)',
    textPrimary: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',
    textDisabled: '#48484A',
    textInverse: '#000000',
    accent: '#8E8E93',
    accentHover: '#AEAEB2',
    accentMuted: '#6C6C70',
    accentGlow: 'rgba(142,142,147,0.25)',
    accentSoft: 'rgba(142,142,147,0.1)',
    borderSubtle: 'rgba(255,255,255,0.06)',
    borderDefault: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.12)',
    separator: 'rgba(84,84,88,0.65)',
    success: '#34C759',
    warning: '#FFCC00',
    error: '#FF3B30',
    info: '#0A84FF',
    terminalBg: '#000000',
    terminalFg: '#FFFFFF',
    terminalCursor: '#FFFFFF',
    terminalCursorAccent: '#000000',
    terminalSelection: 'rgba(10,132,255,0.3)',
    terminalBlack: '#1C1C1E',
    terminalRed: '#FF3B30',
    terminalGreen: '#34C759',
    terminalYellow: '#FFCC00',
    terminalBlue: '#0A84FF',
    terminalMagenta: '#AF52DE',
    terminalCyan: '#5AC8FA',
    terminalWhite: '#FFFFFF',
    terminalBrightBlack: '#6C6C70',
    terminalBrightRed: '#FF453A',
    terminalBrightGreen: '#30D158',
    terminalBrightYellow: '#FFD60A',
    terminalBrightBlue: '#5E5CE6',
    terminalBrightMagenta: '#BF5AF2',
    terminalBrightCyan: '#64D2FF',
    terminalBrightWhite: '#FFFFFF',
    glassBg: 'rgba(0,0,0,0.5)',
    glassBgStrong: 'rgba(0,0,0,0.7)',
    glassBorder: 'rgba(255,255,255,0.1)',
    dockBg: 'rgba(0,0,0,0.6)',
    dockBorder: 'rgba(255,255,255,0.08)',
    dockItemBg: 'rgba(255,255,255,0.05)',
    dockItemHover: 'rgba(255,255,255,0.1)',
    dockItemActive: 'rgba(255,255,255,0.15)',
    windowHeaderBg: '#1C1C1E',
    windowBorder: 'rgba(255,255,255,0.08)',
    windowBorderActive: 'rgba(255,255,255,0.15)',
    appIconFrom: '#8E8E93',
    appIconTo: '#636366',
    wallpaperGradient1: '#000000',
    wallpaperGradient2: '#1C1C1E',
    wallpaperGradient3: '#2C2C2E',
    statusBarText: '#FFFFFF',
    statusBarBattery: '#34C759',
    handleBar: '#48484A',
    homeIndicator: '#FFFFFF',
    backdropBg: 'rgba(0,0,0,0.4)',
    fileSelected: 'rgba(142,142,147,0.2)',
    fileHover: 'rgba(255,255,255,0.06)',
    editorGutter: '#1C1C1E',
    editorLineHighlight: 'rgba(255,255,255,0.04)',
    iosToggleOff: '#39393D',
    iosToggleOn: '#34C759',
    iosToggleThumb: '#FFFFFF',
    iosSliderTrack: '#39393D',
    iosSliderThumb: '#FFFFFF',
    iconFg: '#FFFFFF',
    errorBg: 'rgba(255,59,48,0.15)',
    warningBg: 'rgba(255,204,0,0.15)',
    successBg: 'rgba(52,199,89,0.15)',
    editorBg: '#1C1C1E',
    innerGlow: 'rgba(255,255,255,0.02)',
  }

  const darkTheme = {
    id: 'dark',
    name: 'Dark',
    icon: 'Moon',
    description: 'Pure black background with gray accents',
    i18nKey: 'dark',
    isDark: true,
    colors: mockColors,
  }

  const lightTheme = {
    id: 'light',
    name: 'Light',
    icon: 'Sun',
    description: 'Clean white background',
    i18nKey: 'light',
    isDark: false,
    colors: { ...mockColors, bgBase: '#FFFFFF', textPrimary: '#000000' },
  }

  const themes = { dark: darkTheme, light: lightTheme }
  const availableThemes = [darkTheme, lightTheme]

  return { themes, availableThemes, darkTheme, Theme: {} }
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('ThemeStore', () => {
  let store: ReturnType<typeof import('../themeStore').useThemeStore>

  beforeEach(async () => {
    localStorageMock.clear()
    vi.clearAllMocks()
    setActivePinia(createPinia())
    const { useThemeStore } = await import('../themeStore')
    store = useThemeStore()
  })

  describe('defaults', () => {
    it('should default currentThemeId to dark', () => {
      expect(store.currentThemeId).toBe('dark')
    })

    it('should have currentTheme derived from currentThemeId', () => {
      expect(store.currentTheme.id).toBe('dark')
      expect(store.currentTheme.isDark).toBe(true)
    })

    it('should have isInitialized as false by default', () => {
      expect(store.isInitialized).toBe(false)
    })
  })

  describe('setTheme', () => {
    it('should update currentThemeId', () => {
      store.setTheme('light')
      expect(store.currentThemeId).toBe('light')
    })

    it('should update currentTheme', () => {
      store.setTheme('light')
      expect(store.currentTheme.id).toBe('light')
      expect(store.currentTheme.isDark).toBe(false)
    })

    it('should persist theme to localStorage', () => {
      store.setTheme('light')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('scp-os-selected-theme', 'light')
    })

    it('should ignore invalid theme id', () => {
      const prevId = store.currentThemeId
      store.setTheme('non-existent')
      expect(store.currentThemeId).toBe(prevId)
    })

    it('should apply theme CSS properties to document', () => {
      store.setTheme('light')
      const root = document.documentElement
      // jsdom normalizes hex colors to rgb()
      expect(root.style.getPropertyValue('--gui-bg-base')).toBeTruthy()
      expect(root.style.getPropertyValue('--gui-text-primary')).toBeTruthy()
    })
  })

  describe('init', () => {
    it('should set isInitialized to true', () => {
      expect(store.isInitialized).toBe(false)
      store.init()
      expect(store.isInitialized).toBe(true)
    })

    it('should apply current theme', () => {
      store.init()
      const root = document.documentElement
      expect(root.style.getPropertyValue('--gui-bg-base')).toBeTruthy()
    })
  })

  describe('loadSavedTheme', () => {
    it('should load saved theme from localStorage', async () => {
      localStorageMock.setItem('scp-os-selected-theme', 'light')
      // Re-create store to pick up the localStorage value
      setActivePinia(createPinia())
      const { useThemeStore } = await import('../themeStore')
      const newStore = useThemeStore()
      expect(newStore.currentThemeId).toBe('light')
    })

    it('should fall back to dark when no saved theme exists', () => {
      expect(store.currentThemeId).toBe('dark')
    })

    it('should fall back to dark when saved theme is invalid', async () => {
      localStorageMock.setItem('scp-os-selected-theme', 'invalid-theme')
      setActivePinia(createPinia())
      const { useThemeStore } = await import('../themeStore')
      const newStore = useThemeStore()
      expect(newStore.currentThemeId).toBe('dark')
    })
  })

  describe('applyTheme', () => {
    it('should add dark class for dark themes', () => {
      store.setTheme('dark')
      const root = document.documentElement
      expect(root.classList.contains('dark')).toBe(true)
      expect(root.classList.contains('light')).toBe(false)
    })

    it('should add light class for light themes', () => {
      store.setTheme('light')
      const root = document.documentElement
      expect(root.classList.contains('light')).toBe(true)
      expect(root.classList.contains('dark')).toBe(false)
    })

    it('should set body background and color', () => {
      store.setTheme('dark')
      // jsdom normalizes hex to rgb() so just check they are set
      expect(document.body.style.background).toBeTruthy()
      expect(document.body.style.color).toBeTruthy()
    })
  })
})
