/**
 * GUI Design Tokens
 * CSS custom properties and design constants for the GUI tool system.
 */

// ── Spacing Scale (4px base) ──────────────────────────────────────────
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const

// ── Border Radius ─────────────────────────────────────────────────────
export const radius = {
  none: '0px',
  sm: '4px',
  base: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const

// ── Shadows ───────────────────────────────────────────────────────────
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  base: '0 2px 8px rgba(0, 0, 0, 0.4)',
  md: '0 4px 16px rgba(0, 0, 0, 0.5)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.6)',
  xl: '0 12px 48px rgba(0, 0, 0, 0.7)',
} as const

// ── Transitions ───────────────────────────────────────────────────────
export const transitions = {
  fast: '150ms ease',
  base: '200ms ease',
  slow: '300ms ease',
  spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
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

// ── Font Sizes ────────────────────────────────────────────────────────
export const fontSizes = {
  xs: '11px',
  sm: '12px',
  base: '13px',
  md: '14px',
  lg: '16px',
  xl: '18px',
  '2xl': '24px',
} as const

// ── Font Weights ──────────────────────────────────────────────────────
export const fontWeights = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

// ── SCP GUI Color Palette ─────────────────────────────────────────────
export const colors = {
  // Background
  bgPrimary: '#0a0a0a',
  bgSecondary: '#111111',
  bgTertiary: '#1a1a1a',
  bgHover: '#1e1e1e',
  bgActive: '#252525',

  // Borders
  borderDefault: '#2a2a2a',
  borderHover: '#3a3a3a',
  borderActive: '#e94560',

  // Text
  textPrimary: '#e0e0e0',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
  textDisabled: '#444444',

  // SCP Brand
  scpRed: '#8b0000',
  scpRedBright: '#e94560',
  scpGreen: '#00ff00',
  scpYellow: '#ffff00',
  scpDarkGreen: '#008800',

  // Status
  success: '#00ff00',
  warning: '#ffff00',
  error: '#ff4444',
  info: '#4488ff',

  // Window
  windowBg: '#0d0d0d',
  windowHeaderBg: '#151515',
  windowHeaderActive: '#1a1a1a',
  windowBorder: '#2a2a2a',
  windowBorderActive: '#e94560',

  // Toolbar
  toolbarBg: '#0a0a0a',
  toolbarItemBg: '#1a1a1a',
  toolbarItemHover: '#252525',
  toolbarItemActive: '#e94560',

  // File Manager
  fileIconFolder: '#e9a560',
  fileIconText: '#a0a0a0',
  fileIconCode: '#4488ff',
  fileIconImage: '#00ff00',
  fileSelected: '#1e1e2e',

  // Editor
  editorBg: '#0d0d0d',
  editorGutter: '#1a1a1a',
  editorLineHighlight: '#1e1e1e',
  editorSelection: '#264f78',
  editorCursor: '#e94560',
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

  // Colors
  Object.entries(colors).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    root.style.setProperty(`--gui-color-${cssKey}`, value)
  })
}
