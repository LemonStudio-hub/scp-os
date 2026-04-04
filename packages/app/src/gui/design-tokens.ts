/**
 * GUI Design Tokens v4 — iOS Frosted Glass (Konsta UI Aesthetic)
 *
 * Dark mode first, all components use CSS variables from this file.
 * Icon colors are gray (#8e8e93) per iOS system design.
 */

export const colors = {
  // iOS Dark backgrounds
  bgBase: '#000000',
  bgSurface: '#1c1c1e',
  bgSurfaceRaised: '#2c2c2e',
  bgSurfaceOverlay: '#3a3a3c',
  bgSurfaceHover: '#3a3a3c',
  bgSurfaceActive: '#48484a',

  // Text hierarchy
  textPrimary: '#ffffff',
  textSecondary: '#8e8e93',
  textTertiary: '#636366',
  textDisabled: '#48484a',
  textInverse: '#000000',

  // Accent (gray per iOS system design)
  accent: '#8e8e93',
  accentHover: '#aeaeb2',
  accentSoft: 'rgba(142, 142, 147, 0.1)',
  accentGlow: 'rgba(142, 142, 147, 0.15)',

  // Semantic
  success: '#34c759',
  successBg: 'rgba(52, 199, 89, 0.1)',
  warning: '#ffcc00',
  warningBg: 'rgba(255, 204, 0, 0.1)',
  error: '#ff3b30',
  errorBg: 'rgba(255, 59, 48, 0.1)',
  info: '#0a84ff',
  infoBg: 'rgba(10, 132, 255, 0.1)',

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderDefault: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.12)',

  // iOS grouped list
  iosGroupedBg: '#1c1c1e',
  iosGroupedItemBg: '#2c2c2e',
  iosGroupedItemBgActive: '#3a3a3c',
  iosSeparator: 'rgba(255, 255, 255, 0.12)',

  // Window
  windowBg: '#000000',
  windowHeaderBg: 'rgba(28, 28, 30, 0.85)',
  windowBorder: 'rgba(255, 255, 255, 0.08)',
  windowBorderActive: 'rgba(255, 255, 255, 0.12)',
  windowShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4)',
  windowShadowActive: '0 16px 48px rgba(0, 0, 0, 0.7)',

  // Dock
  dockBg: 'rgba(28, 28, 30, 0.85)',
  dockBorder: 'rgba(255, 255, 255, 0.08)',
  dockItemBg: 'rgba(255, 255, 255, 0.04)',
  dockItemHover: 'rgba(255, 255, 255, 0.08)',
  dockItemActive: 'rgba(142, 142, 147, 0.15)',

  // Glass
  glassBg: 'rgba(28, 28, 30, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',

  // Editor
  editorBg: '#000000',
  editorGutter: '#1c1c1e',
  editorLineHighlight: 'rgba(255, 255, 255, 0.03)',
  editorSelection: 'rgba(10, 132, 255, 0.3)',
  editorCursor: '#ffffff',

  // File Manager
  fileSelected: 'rgba(142, 142, 147, 0.1)',
  fileHover: 'rgba(255, 255, 255, 0.04)',

  // Backdrop
  backdropBg: 'rgba(0, 0, 0, 0.4)',

  // Handle bar
  handleBar: 'rgba(255, 255, 255, 0.2)',

  // Home indicator
  homeIndicator: 'rgba(255, 255, 255, 0.3)',

  // App icon gradients (gray)
  appIconTerminalFrom: '#636366',
  appIconTerminalTo: '#8e8e93',
  appIconFilesFrom: '#48484a',
  appIconFilesTo: '#636366',
  appIconSettingsFrom: '#3a3a3c',
  appIconSettingsTo: '#48484a',

  // Status bar
  statusBarText: '#ffffff',
  statusBarBattery: '#34c759',

  // Wallpaper
  wallpaperBase: '#000000',
  wallpaperGradient1: 'rgba(142, 142, 147, 0.08)',
  wallpaperGradient2: 'rgba(142, 142, 147, 0.05)',
  wallpaperGradient3: 'rgba(63, 63, 66, 0.03)',

  // iOS Toggle
  iosToggleOff: '#39393d',
  iosToggleOn: '#34c759',
  iosToggleThumb: '#ffffff',

  // iOS Slider
  iosSliderTrack: 'rgba(255, 255, 255, 0.15)',
  iosSliderThumb: '#ffffff',
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
  lg: '12px',
  xl: '14px',
  '2xl': '20px',
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

  // Colors
  Object.entries(colors).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    root.style.setProperty(`--gui-${cssKey}`, value)
  })

  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    root.style.setProperty(`--gui-spacing-${key}`, value)
  })

  // Radius
  Object.entries(radius).forEach(([key, value]) => {
    root.style.setProperty(`--gui-radius-${key}`, value)
  })

  // Shadows
  Object.entries(shadows).forEach(([key, value]) => {
    root.style.setProperty(`--gui-shadow-${key}`, value)
  })

  // Transitions
  Object.entries(transitions).forEach(([key, value]) => {
    root.style.setProperty(`--gui-transition-${key}`, value)
  })

  // Z-Index
  Object.entries(zIndex).forEach(([key, value]) => {
    root.style.setProperty(`--gui-z-${key}`, String(value))
  })

  // Font Sizes
  Object.entries(fontSizes).forEach(([key, value]) => {
    root.style.setProperty(`--gui-font-${key}`, value)
  })

  // Font Weights
  Object.entries(fontWeights).forEach(([key, value]) => {
    root.style.setProperty(`--gui-font-weight-${key}`, String(value))
  })

  // Line Heights
  Object.entries(lineHeights).forEach(([key, value]) => {
    root.style.setProperty(`--gui-line-height-${key}`, String(value))
  })

  // Font Families
  Object.entries(fontFamilies).forEach(([key, value]) => {
    root.style.setProperty(`--gui-font-${key}`, value)
  })

  // Icon Sizes
  Object.entries(iconSizes).forEach(([key, value]) => {
    root.style.setProperty(`--gui-icon-${key}`, value)
  })

  // Dimensions
  Object.entries(dimensions).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    root.style.setProperty(`--gui-dim-${cssKey}`, value)
  })
}
