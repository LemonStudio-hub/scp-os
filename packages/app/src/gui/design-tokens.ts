/**
 * GUI Design Tokens — iOS Frosted Glass with #1C1C1E background
 * Squircle border radius, white foreground icons, gray app icons
 */

export const colors = {
  // Background
  bgBase: '#1C1C1E',
  bgSurface: '#2C2C2E',
  bgSurfaceRaised: '#3A3A3C',
  bgSurfaceOverlay: '#48484A',
  bgSurfaceHover: 'rgba(255, 255, 255, 0.06)',
  bgSurfaceActive: 'rgba(255, 255, 255, 0.1)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  textDisabled: '#48484A',
  textInverse: '#000000',

  // Accent (gray frosted glass)
  accent: '#8E8E93',
  accentHover: '#AEAEB2',
  accentSoft: 'rgba(142, 142, 147, 0.1)',
  accentGlow: 'rgba(142, 142, 147, 0.15)',

  // Semantic
  success: '#34C759',
  successBg: 'rgba(52, 199, 89, 0.1)',
  warning: '#FFCC00',
  warningBg: 'rgba(255, 204, 0, 0.1)',
  error: '#FF3B30',
  errorBg: 'rgba(255, 59, 48, 0.1)',
  info: '#0A84FF',
  infoBg: 'rgba(10, 132, 255, 0.1)',

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderDefault: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.12)',
  separator: 'rgba(84, 84, 88, 0.65)',

  // Window
  windowBg: '#1C1C1E',
  windowHeaderBg: 'rgba(44, 44, 46, 0.85)',
  windowBorder: 'rgba(255, 255, 255, 0.08)',
  windowBorderActive: 'rgba(255, 255, 255, 0.12)',
  windowShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
  windowShadowActive: '0 16px 48px rgba(0, 0, 0, 0.6)',

  // Dock
  dockBg: 'rgba(44, 44, 46, 0.85)',
  dockBorder: 'rgba(255, 255, 255, 0.08)',
  dockItemBg: 'rgba(255, 255, 255, 0.04)',
  dockItemHover: 'rgba(255, 255, 255, 0.08)',
  dockItemActive: 'rgba(142, 142, 147, 0.15)',

  // Glass
  glassBg: 'rgba(44, 44, 46, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',

  // Editor
  editorBg: '#1C1C1E',
  editorGutter: '#2C2C2E',
  editorLineHighlight: 'rgba(255, 255, 255, 0.03)',
  editorSelection: 'rgba(10, 132, 255, 0.3)',
  editorCursor: '#FFFFFF',

  // File Manager
  fileSelected: 'rgba(142, 142, 147, 0.1)',
  fileHover: 'rgba(255, 255, 255, 0.04)',

  // Backdrop
  backdropBg: 'rgba(0, 0, 0, 0.3)',

  // Handle bar
  handleBar: 'rgba(255, 255, 255, 0.2)',

  // Home indicator
  homeIndicator: 'rgba(255, 255, 255, 0.3)',

  // App icon gradients (frosted glass dark gray)
  appIconFrom: '#4A4A4C',
  appIconTo: '#636366',

  // Foreground icons (white)
  iconFg: '#FFFFFF',

  // Status bar
  statusBarText: '#FFFFFF',
  statusBarBattery: '#34C759',

  // Wallpaper
  wallpaperBase: '#1C1C1E',
  wallpaperGradient1: 'rgba(142, 142, 147, 0.08)',
  wallpaperGradient2: 'rgba(142, 142, 147, 0.05)',
  wallpaperGradient3: 'rgba(63, 63, 66, 0.03)',

  // iOS Toggle
  iosToggleOff: '#39393D',
  iosToggleOn: '#34C759',
  iosToggleThumb: '#FFFFFF',

  // iOS Slider
  iosSliderTrack: 'rgba(255, 255, 255, 0.15)',
  iosSliderThumb: '#FFFFFF',
} as const

export const spacing = {
  xxs: '2px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '60px',
  '5xl': '80px',
} as const

export const radius = {
  none: '0px',
  xs: '4px',
  sm: '6px',
  base: '8px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
} as const

export const shadows = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
  base: '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
  md: '0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.3)',
  lg: '0 16px 40px rgba(0, 0, 0, 0.6), 0 6px 12px rgba(0, 0, 0, 0.4)',
  xl: '0 24px 48px rgba(0, 0, 0, 0.7)',
  glow: '0 0 20px rgba(142, 142, 147, 0.15)',
  glowStrong: '0 0 32px rgba(142, 142, 147, 0.25)',
} as const

export const transitions = {
  fast: '120ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  iosSpring: '350ms cubic-bezier(0.32, 0.72, 0, 1)',
  bounceSpring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: '500ms cubic-bezier(0.16, 1, 0.3, 1)',
} as const

export const zIndex = {
  desktop: 100,
  toolbar: 200,
  window: 300,
  windowActive: 350,
  modal: 400,
  contextMenu: 500,
  toast: 600,
} as const

export const fontSizes = {
  xs: '11px',
  sm: '12px',
  base: '13px',
  md: '14px',
  lg: '15px',
  xl: '17px',
  '2xl': '22px',
  '3xl': '28px',
} as const

export const fontFamilies = {
  sans: '-apple-system, "SF Pro Display", "SF Pro Text", BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: '"JetBrains Mono", "Cascadia Code", "Fira Code", "SF Mono", Consolas, monospace',
} as const

export const fontWeights = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

export const lineHeights = {
  tight: 1.3,
  base: 1.5,
  relaxed: 1.7,
} as const

export const iconSizes = {
  xs: '14px',
  sm: '16px',
  base: '20px',
  md: '24px',
  lg: '28px',
  xl: '32px',
  dock: '48px',
  homeScreen: '60px',
} as const

export const dimensions = {
  statusBarHeight: '44px',
  statusBarPaddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
  navBarHeight: '44px',
  dockIconSize: '48px',
  homeScreenIconSize: '60px',
  homeScreenIconRadius: '14px',
  homeScreenGridGap: '32px',
  homeIndicatorWidth: '134px',
  homeIndicatorHeight: '5px',
  handleBarWidth: '36px',
  handleBarHeight: '5px',
  handleBarRadius: '100px',
  badgeSize: '16px',
  badgeFontSize: '10px',
  dotActiveSize: '4px',
  dotStatusSize: '6px',
  keyboardButtonHeight: '40px',
  keyboardButtonMinWidth: '40px',
  sliderThumbSize: '28px',
  sliderTrackHeight: '4px',
  toggleWidth: '51px',
  toggleHeight: '31px',
} as const

export const windowDefaults = {
  width: 800,
  height: 500,
  minWidth: 320,
  minHeight: 240,
  xOffset: 40,
  yOffset: 40,
} as const

export function injectGUITokens(): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  Object.entries(colors).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    root.style.setProperty(`--gui-${cssKey}`, value)
  })

  Object.entries(spacing).forEach(([key, value]) => {
    root.style.setProperty(`--gui-spacing-${key}`, value)
  })

  Object.entries(radius).forEach(([key, value]) => {
    root.style.setProperty(`--gui-radius-${key}`, value)
  })

  Object.entries(shadows).forEach(([key, value]) => {
    root.style.setProperty(`--gui-shadow-${key}`, value)
  })

  Object.entries(transitions).forEach(([key, value]) => {
    root.style.setProperty(`--gui-transition-${key}`, value)
  })

  Object.entries(zIndex).forEach(([key, value]) => {
    root.style.setProperty(`--gui-z-${key}`, String(value))
  })

  Object.entries(fontSizes).forEach(([key, value]) => {
    root.style.setProperty(`--gui-font-${key}`, value)
  })

  Object.entries(fontWeights).forEach(([key, value]) => {
    root.style.setProperty(`--gui-font-weight-${key}`, String(value))
  })

  Object.entries(lineHeights).forEach(([key, value]) => {
    root.style.setProperty(`--gui-line-height-${key}`, String(value))
  })

  Object.entries(fontFamilies).forEach(([key, value]) => {
    root.style.setProperty(`--gui-font-${key}`, value)
  })

  Object.entries(iconSizes).forEach(([key, value]) => {
    root.style.setProperty(`--gui-icon-${key}`, value)
  })

  Object.entries(dimensions).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    root.style.setProperty(`--gui-dim-${cssKey}`, value)
  })
}
