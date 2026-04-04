/**
 * Theme Definitions
 * 
 * Each theme defines a complete set of colors for:
 * - Background layers
 * - Text hierarchy
 * - Accent colors
 * - Terminal colors (xterm.js)
 * - UI elements (borders, separators, etc.)
 */

export interface ThemeColors {
  // UI Colors
  bgBase: string
  bgSurface: string
  bgSurfaceRaised: string
  bgSurfaceOverlay: string
  bgSurfaceHover: string
  bgSurfaceActive: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  textDisabled: string
  textInverse: string
  accent: string
  accentHover: string
  accentMuted: string
  accentGlow: string
  accentSoft: string
  borderSubtle: string
  borderDefault: string
  borderStrong: string
  separator: string
  success: string
  warning: string
  error: string
  info: string
  // Terminal-specific colors
  terminalBg: string
  terminalFg: string
  terminalCursor: string
  terminalCursorAccent: string
  terminalSelection: string
  terminalBlack: string
  terminalRed: string
  terminalGreen: string
  terminalYellow: string
  terminalBlue: string
  terminalMagenta: string
  terminalCyan: string
  terminalWhite: string
  terminalBrightBlack: string
  terminalBrightRed: string
  terminalBrightGreen: string
  terminalBrightYellow: string
  terminalBrightBlue: string
  terminalBrightMagenta: string
  terminalBrightCyan: string
  terminalBrightWhite: string
  // UI elements
  glassBg: string
  glassBorder: string
  dockBg: string
  dockBorder: string
  dockItemBg: string
  dockItemHover: string
  dockItemActive: string
  windowHeaderBg: string
  windowBorder: string
  windowBorderActive: string
  appIconFrom: string
  appIconTo: string
  wallpaperGradient1: string
  wallpaperGradient2: string
  wallpaperGradient3: string
  statusBarText: string
  statusBarBattery: string
  handleBar: string
  homeIndicator: string
  backdropBg: string
  fileSelected: string
  fileHover: string
  editorGutter: string
  editorLineHighlight: string
  iosToggleOff: string
  iosToggleOn: string
  iosToggleThumb: string
  iosSliderTrack: string
  iosSliderThumb: string
  iconFg: string
}

export interface Theme {
  id: string
  name: string
  icon: string
  description: string
  isDark: boolean
  colors: ThemeColors
}

// ── Dark Theme (default) ─────────────────────────────────────────────
export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  icon: '🌙',
  description: 'Pure black background with gray accents',
  isDark: true,
  colors: {
    bgBase: '#000000',
    bgSurface: '#1C1C1E',
    bgSurfaceRaised: '#2C2C2E',
    bgSurfaceOverlay: '#3A3A3C',
    bgSurfaceHover: 'rgba(255, 255, 255, 0.06)',
    bgSurfaceActive: 'rgba(255, 255, 255, 0.1)',
    textPrimary: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',
    textDisabled: '#48484A',
    textInverse: '#000000',
    accent: '#8E8E93',
    accentHover: '#AEAEB2',
    accentMuted: '#6C6C70',
    accentGlow: 'rgba(142, 142, 147, 0.25)',
    accentSoft: 'rgba(142, 142, 147, 0.1)',
    borderSubtle: 'rgba(255, 255, 255, 0.06)',
    borderDefault: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.12)',
    separator: 'rgba(84, 84, 88, 0.65)',
    success: '#34C759',
    warning: '#FFCC00',
    error: '#FF3B30',
    info: '#0A84FF',
    terminalBg: '#000000',
    terminalFg: '#FFFFFF',
    terminalCursor: '#FFFFFF',
    terminalCursorAccent: '#000000',
    terminalSelection: 'rgba(10, 132, 255, 0.3)',
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
    terminalBrightBlue: '#0A84FF',
    terminalBrightMagenta: '#BF5AF2',
    terminalBrightCyan: '#64D2FF',
    terminalBrightWhite: '#FFFFFF',
    glassBg: 'rgba(28, 28, 30, 0.75)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    dockBg: 'rgba(28, 28, 30, 0.85)',
    dockBorder: 'rgba(255, 255, 255, 0.08)',
    dockItemBg: 'rgba(255, 255, 255, 0.04)',
    dockItemHover: 'rgba(255, 255, 255, 0.08)',
    dockItemActive: 'rgba(142, 142, 147, 0.15)',
    windowHeaderBg: 'rgba(28, 28, 30, 0.85)',
    windowBorder: 'rgba(255, 255, 255, 0.08)',
    windowBorderActive: 'rgba(255, 255, 255, 0.12)',
    appIconFrom: '#4A4A4C',
    appIconTo: '#636366',
    wallpaperGradient1: 'rgba(142, 142, 147, 0.08)',
    wallpaperGradient2: 'rgba(142, 142, 147, 0.05)',
    wallpaperGradient3: 'rgba(63, 63, 66, 0.03)',
    statusBarText: '#FFFFFF',
    statusBarBattery: '#34C759',
    handleBar: 'rgba(255, 255, 255, 0.2)',
    homeIndicator: 'rgba(255, 255, 255, 0.3)',
    backdropBg: 'rgba(0, 0, 0, 0.4)',
    fileSelected: 'rgba(142, 142, 147, 0.1)',
    fileHover: 'rgba(255, 255, 255, 0.04)',
    editorGutter: '#1C1C1E',
    editorLineHighlight: 'rgba(255, 255, 255, 0.03)',
    iosToggleOff: '#39393D',
    iosToggleOn: '#34C759',
    iosToggleThumb: '#FFFFFF',
    iosSliderTrack: 'rgba(255, 255, 255, 0.15)',
    iosSliderThumb: '#FFFFFF',
    iconFg: '#FFFFFF',
  },
}

// ── Light Theme ──────────────────────────────────────────────────────
export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  icon: '☀️',
  description: 'White background with dark text',
  isDark: false,
  colors: {
    bgBase: '#F2F2F7',
    bgSurface: '#FFFFFF',
    bgSurfaceRaised: '#FFFFFF',
    bgSurfaceOverlay: '#F2F2F7',
    bgSurfaceHover: 'rgba(0, 0, 0, 0.04)',
    bgSurfaceActive: 'rgba(0, 0, 0, 0.08)',
    textPrimary: '#000000',
    textSecondary: '#6E6E73',
    textTertiary: '#AEAEB2',
    textDisabled: '#C7C7CC',
    textInverse: '#FFFFFF',
    accent: '#007AFF',
    accentHover: '#0A84FF',
    accentMuted: '#5AC8FA',
    accentGlow: 'rgba(0, 122, 255, 0.25)',
    accentSoft: 'rgba(0, 122, 255, 0.1)',
    borderSubtle: 'rgba(0, 0, 0, 0.06)',
    borderDefault: 'rgba(0, 0, 0, 0.1)',
    borderStrong: 'rgba(0, 0, 0, 0.16)',
    separator: 'rgba(60, 60, 67, 0.36)',
    success: '#34C759',
    warning: '#FFCC00',
    error: '#FF3B30',
    info: '#007AFF',
    terminalBg: '#1E1E1E',
    terminalFg: '#D4D4D4',
    terminalCursor: '#D4D4D4',
    terminalCursorAccent: '#1E1E1E',
    terminalSelection: 'rgba(0, 120, 215, 0.3)',
    terminalBlack: '#000000',
    terminalRed: '#CD3131',
    terminalGreen: '#0DBC79',
    terminalYellow: '#E5E510',
    terminalBlue: '#2472C8',
    terminalMagenta: '#BC3FBC',
    terminalCyan: '#11A8CD',
    terminalWhite: '#E5E5E5',
    terminalBrightBlack: '#666666',
    terminalBrightRed: '#F14C4C',
    terminalBrightGreen: '#23D18B',
    terminalBrightYellow: '#F5F543',
    terminalBrightBlue: '#3B8EEA',
    terminalBrightMagenta: '#D670D6',
    terminalBrightCyan: '#29B8DB',
    terminalBrightWhite: '#E5E5E5',
    glassBg: 'rgba(255, 255, 255, 0.8)',
    glassBorder: 'rgba(0, 0, 0, 0.08)',
    dockBg: 'rgba(255, 255, 255, 0.85)',
    dockBorder: 'rgba(0, 0, 0, 0.08)',
    dockItemBg: 'rgba(0, 0, 0, 0.04)',
    dockItemHover: 'rgba(0, 0, 0, 0.08)',
    dockItemActive: 'rgba(0, 122, 255, 0.15)',
    windowHeaderBg: 'rgba(255, 255, 255, 0.85)',
    windowBorder: 'rgba(0, 0, 0, 0.08)',
    windowBorderActive: 'rgba(0, 122, 255, 0.4)',
    appIconFrom: '#E5E5EA',
    appIconTo: '#D1D1D6',
    wallpaperGradient1: 'rgba(0, 122, 255, 0.08)',
    wallpaperGradient2: 'rgba(0, 122, 255, 0.05)',
    wallpaperGradient3: 'rgba(88, 86, 214, 0.03)',
    statusBarText: '#000000',
    statusBarBattery: '#34C759',
    handleBar: 'rgba(0, 0, 0, 0.2)',
    homeIndicator: 'rgba(0, 0, 0, 0.3)',
    backdropBg: 'rgba(0, 0, 0, 0.3)',
    fileSelected: 'rgba(0, 122, 255, 0.1)',
    fileHover: 'rgba(0, 0, 0, 0.04)',
    editorGutter: '#F2F2F7',
    editorLineHighlight: 'rgba(0, 0, 0, 0.03)',
    iosToggleOff: '#E5E5EA',
    iosToggleOn: '#34C759',
    iosToggleThumb: '#FFFFFF',
    iosSliderTrack: 'rgba(0, 0, 0, 0.15)',
    iosSliderThumb: '#FFFFFF',
    iconFg: '#000000',
  },
}

// ── SCP Theme (red accent) ──────────────────────────────────────────
export const scpTheme: Theme = {
  id: 'scp',
  name: 'SCP Red',
  icon: '🔴',
  description: 'SCP Foundation theme with red accents',
  isDark: true,
  colors: {
    bgBase: '#0A0A0A',
    bgSurface: '#1A1A1A',
    bgSurfaceRaised: '#242424',
    bgSurfaceOverlay: '#303030',
    bgSurfaceHover: 'rgba(233, 69, 96, 0.06)',
    bgSurfaceActive: 'rgba(233, 69, 96, 0.1)',
    textPrimary: '#E0E0E0',
    textSecondary: '#A0A0A0',
    textTertiary: '#6A6A6A',
    textDisabled: '#4A4A4A',
    textInverse: '#000000',
    accent: '#E94560',
    accentHover: '#FF5A73',
    accentMuted: '#C73A52',
    accentGlow: 'rgba(233, 69, 96, 0.25)',
    accentSoft: 'rgba(233, 69, 96, 0.1)',
    borderSubtle: 'rgba(233, 69, 96, 0.06)',
    borderDefault: 'rgba(233, 69, 96, 0.1)',
    borderStrong: 'rgba(233, 69, 96, 0.16)',
    separator: 'rgba(233, 69, 96, 0.3)',
    success: '#00FF00',
    warning: '#FFA500',
    error: '#FF4444',
    info: '#4169E1',
    terminalBg: '#0A0A0A',
    terminalFg: '#E0E0E0',
    terminalCursor: '#E94560',
    terminalCursorAccent: '#0A0A0A',
    terminalSelection: 'rgba(233, 69, 96, 0.3)',
    terminalBlack: '#1A1A1A',
    terminalRed: '#E94560',
    terminalGreen: '#00FF00',
    terminalYellow: '#FFA500',
    terminalBlue: '#4169E1',
    terminalMagenta: '#FF00FF',
    terminalCyan: '#00FFFF',
    terminalWhite: '#E0E0E0',
    terminalBrightBlack: '#555555',
    terminalBrightRed: '#FF5A73',
    terminalBrightGreen: '#66FF66',
    terminalBrightYellow: '#FFFF66',
    terminalBrightBlue: '#6666FF',
    terminalBrightMagenta: '#FF66FF',
    terminalBrightCyan: '#66FFFF',
    terminalBrightWhite: '#FFFFFF',
    glassBg: 'rgba(26, 26, 26, 0.75)',
    glassBorder: 'rgba(233, 69, 96, 0.08)',
    dockBg: 'rgba(26, 26, 26, 0.85)',
    dockBorder: 'rgba(233, 69, 96, 0.08)',
    dockItemBg: 'rgba(233, 69, 96, 0.04)',
    dockItemHover: 'rgba(233, 69, 96, 0.08)',
    dockItemActive: 'rgba(233, 69, 96, 0.15)',
    windowHeaderBg: 'rgba(26, 26, 26, 0.85)',
    windowBorder: 'rgba(233, 69, 96, 0.08)',
    windowBorderActive: 'rgba(233, 69, 96, 0.4)',
    appIconFrom: '#8B0000',
    appIconTo: '#E94560',
    wallpaperGradient1: 'rgba(139, 0, 0, 0.15)',
    wallpaperGradient2: 'rgba(233, 69, 96, 0.08)',
    wallpaperGradient3: 'rgba(92, 0, 0, 0.05)',
    statusBarText: '#E0E0E0',
    statusBarBattery: '#00FF00',
    handleBar: 'rgba(233, 69, 96, 0.2)',
    homeIndicator: 'rgba(233, 69, 96, 0.3)',
    backdropBg: 'rgba(0, 0, 0, 0.4)',
    fileSelected: 'rgba(233, 69, 96, 0.1)',
    fileHover: 'rgba(233, 69, 96, 0.04)',
    editorGutter: '#1A1A1A',
    editorLineHighlight: 'rgba(233, 69, 96, 0.03)',
    iosToggleOff: '#3A3A3A',
    iosToggleOn: '#E94560',
    iosToggleThumb: '#FFFFFF',
    iosSliderTrack: 'rgba(233, 69, 96, 0.15)',
    iosSliderThumb: '#FFFFFF',
    iconFg: '#E94560',
  },
}

// ── Hacker Theme (green on black) ───────────────────────────────────
export const hackerTheme: Theme = {
  id: 'hacker',
  name: 'Hacker',
  icon: '💻',
  description: 'Matrix-style green on black',
  isDark: true,
  colors: {
    bgBase: '#000000',
    bgSurface: '#0A1A0A',
    bgSurfaceRaised: '#0F2F0F',
    bgSurfaceOverlay: '#1A3A1A',
    bgSurfaceHover: 'rgba(0, 255, 0, 0.06)',
    bgSurfaceActive: 'rgba(0, 255, 0, 0.1)',
    textPrimary: '#00FF00',
    textSecondary: '#00CC00',
    textTertiary: '#008800',
    textDisabled: '#004400',
    textInverse: '#000000',
    accent: '#00FF00',
    accentHover: '#00FF44',
    accentMuted: '#00AA00',
    accentGlow: 'rgba(0, 255, 0, 0.25)',
    accentSoft: 'rgba(0, 255, 0, 0.1)',
    borderSubtle: 'rgba(0, 255, 0, 0.06)',
    borderDefault: 'rgba(0, 255, 0, 0.1)',
    borderStrong: 'rgba(0, 255, 0, 0.16)',
    separator: 'rgba(0, 255, 0, 0.3)',
    success: '#00FF00',
    warning: '#FFFF00',
    error: '#FF0000',
    info: '#00FFFF',
    terminalBg: '#000000',
    terminalFg: '#00FF00',
    terminalCursor: '#00FF00',
    terminalCursorAccent: '#000000',
    terminalSelection: 'rgba(0, 255, 0, 0.3)',
    terminalBlack: '#0A0A0A',
    terminalRed: '#FF0000',
    terminalGreen: '#00FF00',
    terminalYellow: '#FFFF00',
    terminalBlue: '#0000FF',
    terminalMagenta: '#FF00FF',
    terminalCyan: '#00FFFF',
    terminalWhite: '#00FF00',
    terminalBrightBlack: '#333333',
    terminalBrightRed: '#FF4444',
    terminalBrightGreen: '#00FF44',
    terminalBrightYellow: '#FFFF44',
    terminalBrightBlue: '#4444FF',
    terminalBrightMagenta: '#FF44FF',
    terminalBrightCyan: '#44FFFF',
    terminalBrightWhite: '#00FF00',
    glassBg: 'rgba(0, 10, 0, 0.75)',
    glassBorder: 'rgba(0, 255, 0, 0.08)',
    dockBg: 'rgba(0, 10, 0, 0.85)',
    dockBorder: 'rgba(0, 255, 0, 0.08)',
    dockItemBg: 'rgba(0, 255, 0, 0.04)',
    dockItemHover: 'rgba(0, 255, 0, 0.08)',
    dockItemActive: 'rgba(0, 255, 0, 0.15)',
    windowHeaderBg: 'rgba(0, 10, 0, 0.85)',
    windowBorder: 'rgba(0, 255, 0, 0.08)',
    windowBorderActive: 'rgba(0, 255, 0, 0.4)',
    appIconFrom: '#004400',
    appIconTo: '#00AA00',
    wallpaperGradient1: 'rgba(0, 255, 0, 0.08)',
    wallpaperGradient2: 'rgba(0, 255, 0, 0.05)',
    wallpaperGradient3: 'rgba(0, 128, 0, 0.03)',
    statusBarText: '#00FF00',
    statusBarBattery: '#00FF00',
    handleBar: 'rgba(0, 255, 0, 0.2)',
    homeIndicator: 'rgba(0, 255, 0, 0.3)',
    backdropBg: 'rgba(0, 0, 0, 0.4)',
    fileSelected: 'rgba(0, 255, 0, 0.1)',
    fileHover: 'rgba(0, 255, 0, 0.04)',
    editorGutter: '#0A1A0A',
    editorLineHighlight: 'rgba(0, 255, 0, 0.03)',
    iosToggleOff: '#1A1A1A',
    iosToggleOn: '#00FF00',
    iosToggleThumb: '#000000',
    iosSliderTrack: 'rgba(0, 255, 0, 0.15)',
    iosSliderThumb: '#00FF00',
    iconFg: '#00FF00',
  },
}

// ── Theme Registry ───────────────────────────────────────────────────
export const themes: Record<string, Theme> = {
  dark: darkTheme,
  light: lightTheme,
  scp: scpTheme,
  hacker: hackerTheme,
}

export const availableThemes: Theme[] = [
  darkTheme,
  lightTheme,
  scpTheme,
  hackerTheme,
]
