/**
 * GUI Design Tokens v2 — Flat, Modern, SCP Theme
 *
 * Design Philosophy:
 * - Flat surfaces with subtle depth (no heavy borders/gradients)
 * - Smooth animations with easing curves
 * - Clean typography with system font stack
 * - SCP Foundation dark theme: deep blacks, muted grays, accent red
 * - Glass morphism for overlays and context menus
 */

// ── Color Palette ─────────────────────────────────────────────────────
export const colors = {
  // Background layers (dark mode)
  bgBase: '#060606',
  bgSurface: '#0c0c0c',
  bgSurfaceRaised: '#111111',
  bgSurfaceOverlay: '#161616',
  bgSurfaceHover: '#1a1a1a',
  bgSurfaceActive: '#222222',

  // Borders (subtle, using color instead of heavy lines)
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderDefault: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',

  // Text hierarchy
  textPrimary: '#f0f0f0',
  textSecondary: '#a8a8a8',
  textTertiary: '#6a6a6a',
  textDisabled: '#444444',
  textInverse: '#ffffff',

  // SCP Brand
  accent: '#e94560',
  accentHover: '#ff5a73',
  accentMuted: '#c73a52',
  accentGlow: 'rgba(233, 69, 96, 0.25)',
  accentSoft: 'rgba(233, 69, 96, 0.08)',

  // Semantic
  success: '#34d399',
  successBg: 'rgba(52, 211, 153, 0.1)',
  warning: '#fbbf24',
  warningBg: 'rgba(251, 191, 36, 0.1)',
  error: '#f87171',
  errorBg: 'rgba(248, 113, 113, 0.1)',
  info: '#60a5fa',
  infoBg: 'rgba(96, 165, 250, 0.1)',

  // Window
  windowBg: '#0e0e0e',
  windowHeaderBg: 'rgba(18, 18, 18, 0.95)',
  windowBorder: 'rgba(255, 255, 255, 0.08)',
  windowBorderActive: 'rgba(233, 69, 96, 0.4)',
  windowShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4)',
  windowShadowActive: '0 16px 48px rgba(0, 0, 0, 0.7), 0 4px 12px rgba(233, 69, 96, 0.1)',

  // Toolbar / Dock
  dockBg: 'rgba(12, 12, 12, 0.85)',
  dockBorder: 'rgba(255, 255, 255, 0.08)',
  dockItemBg: 'rgba(255, 255, 255, 0.04)',
  dockItemHover: 'rgba(255, 255, 255, 0.1)',
  dockItemActive: 'rgba(233, 69, 96, 0.15)',

  // Code / Editor
  editorBg: '#0a0a0a',
  editorGutter: '#111111',
  editorLineHighlight: 'rgba(255, 255, 255, 0.03)',
  editorSelection: 'rgba(96, 165, 250, 0.2)',
  editorCursor: '#e94560',

  // File Manager
  fileSelected: 'rgba(233, 69, 96, 0.08)',
  fileHover: 'rgba(255, 255, 255, 0.04)',

  // Glass / Blur
  glassBg: 'rgba(16, 16, 16, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
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
} as const

// ── Border Radius ─────────────────────────────────────────────────────
export const radius = {
  none: '0px',
  xs: '4px',
  sm: '6px',
  base: '8px',
  md: '10px',
  lg: '12px',
  xl: '16px',
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
  spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
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
  xl: '18px',
  '2xl': '22px',
  '3xl': '28px',
} as const

export const fontFamilies = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
/**
 * Inject GUI design tokens as CSS custom properties on :root.
 * Call once during app initialization.
 */
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
}
