/**
 * GUI Design Tokens v3 — Unified, iOS-Inspired, SCP Foundation Theme
 *
 * All components MUST use these CSS variables. No hardcoded values.
 * Fallbacks in components MUST match the token values below.
 */

// ── Color Palette ─────────────────────────────────────────────────────
export const colors = {
  // Background layers (iOS dark mode, #1C1C1E base)
  bgBase: '#1C1C1E',
  bgSurface: '#2C2C2E',
  bgSurfaceRaised: '#3A3A3C',
  bgSurfaceOverlay: '#48484A',
  bgSurfaceHover: 'rgba(255, 255, 255, 0.06)',
  bgSurfaceActive: 'rgba(255, 255, 255, 0.1)',

  // Text hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  textDisabled: '#48484A',
  textInverse: '#000000',

  // SCP Brand
  accent: '#8E8E93',
  accentHover: '#AEAEB2',
  accentMuted: '#6C6C70',
  accentGlow: 'rgba(142, 142, 147, 0.25)',
  accentSoft: 'rgba(142, 142, 147, 0.1)',

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

  // Dock / Toolbar
  dockBg: 'rgba(44, 44, 46, 0.85)',
  dockBorder: 'rgba(255, 255, 255, 0.08)',
  dockItemBg: 'rgba(255, 255, 255, 0.04)',
  dockItemHover: 'rgba(255, 255, 255, 0.08)',
  dockItemActive: 'rgba(142, 142, 147, 0.15)',

  // Glass / Blur (overlays, context menus, bottom sheets)
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

  // Backdrop (modal overlays)
  backdropBg: 'rgba(0, 0, 0, 0.4)',

  // Handle bar (bottom sheets)
  handleBar: 'rgba(255, 255, 255, 0.2)',

  // Home indicator
  homeIndicator: 'rgba(255, 255, 255, 0.3)',

  // App icon gradients (frosted glass dark gray)
  appIconFrom: '#4A4A4C',
  appIconTo: '#636366',
  appIconTerminalFrom: '#4A4A4C',
  appIconTerminalTo: '#636366',
  appIconFilesFrom: '#4A4A4C',
  appIconFilesTo: '#636366',
  appIconSettingsFrom: '#4A4A4C',
  appIconSettingsTo: '#636366',

  // Foreground icon colors (white)
  iconFg: '#FFFFFF',

  // Status bar
  statusBarText: '#FFFFFF',
  statusBarBattery: '#34C759',

  // Wallpaper
  wallpaperBase: '#1C1C1E',
  wallpaperGradient1: 'rgba(142, 142, 147, 0.08)',
  wallpaperGradient2: 'rgba(142, 142, 147, 0.05)',
  wallpaperGradient3: 'rgba(63, 63, 66, 0.03)',
} as const

// ── Spacing Scale (4px base unit) ─────────────────────────────────────
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

// ── Border Radius ─────────────────────────────────────────────────────
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

// ── Shadows ───────────────────────────────────────────────────────────
export const shadows = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
  base: '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
  md: '0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.3)',
  lg: '0 16px 40px rgba(0, 0, 0, 0.6), 0 6px 12px rgba(0, 0, 0, 0.4)',
  xl: '0 24px 48px rgba(0, 0, 0, 0.7)',
  glow: '0 0 20px rgba(233, 69, 96, 0.15)',
  glowStrong: '0 0 32px rgba(233, 69, 96, 0.25)',
} as const

// ── Transitions ───────────────────────────────────────────────────────
export const transitions = {
  fast: '120ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  // iOS spring — deceleration curve for dismiss animations
  iosSpring: '400ms cubic-bezier(0.32, 0.72, 0, 1)',
  // Bounce spring for icon taps
  bounceSpring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  // Smooth ease-out for page transitions
  smooth: '500ms cubic-bezier(0.16, 1, 0.3, 1)',
} as const

// ── Z-Index Layers ────────────────────────────────────────────────────
export const zIndex = {
  desktop: 100,
  toolbar: 200,
  window: 300,
  windowActive: 350,
  modal: 400,
  contextMenu: 500,
  toast: 600,
} as const

// ── Typography ────────────────────────────────────────────────────────
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
  // iOS-first: SF Pro where available, fall back to system stack
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

// ── Icon Sizes ────────────────────────────────────────────────────────
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

// ── Component Dimensions ──────────────────────────────────────────────
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
  sliderThumbSize: '20px',
  sliderTrackHeight: '4px',
} as const

// ── Window Defaults ───────────────────────────────────────────────────
export const windowDefaults = {
  width: 800,
  height: 500,
  minWidth: 320,
  minHeight: 240,
  xOffset: 40,
  yOffset: 40,
} as const

// ── CSS Custom Properties Injection ───────────────────────────────────
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

  // Font Sizes — also inject as --gui-font-<key> for backward compat
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

  // Component Dimensions
  Object.entries(dimensions).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    root.style.setProperty(`--gui-dim-${cssKey}`, value)
  })
}
