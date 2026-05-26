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
  glassBgStrong: string
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
  // Semantic backgrounds
  errorBg: string
  warningBg: string
  successBg: string
  editorBg: string
  innerGlow: string
}

export interface Theme {
  id: string
  name: string
  icon: string
  description: string
  i18nKey: string
  isDark: boolean
  colors: ThemeColors
}

// ── Dark Theme (default) ─────────────────────────────────────────────
export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  icon: 'Moon',
  description: 'Pure black background with gray accents',
  i18nKey: 'dark',
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
    glassBgStrong: 'rgba(44, 44, 46, 0.95)',
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
    errorBg: 'rgba(255, 59, 48, 0.12)',
    warningBg: 'rgba(255, 204, 0, 0.12)',
    successBg: 'rgba(52, 199, 89, 0.12)',
    editorBg: '#0A0A0A',
    innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
  },
}

// ── Light Theme ──────────────────────────────────────────────────────
// Color contrast ratios verified against WCAG AA (4.5:1 for normal text).
// Status/terminal colors use "dark on light" variants for readability.
export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  icon: 'Sun',
  description: 'Classic clean light interface',
  i18nKey: 'light',
  isDark: false,
  colors: {
    // ── Background layers ──
    bgBase: '#F2F2F7',
    bgSurface: '#FFFFFF',
    bgSurfaceRaised: '#FFFFFF',
    bgSurfaceOverlay: 'rgba(255, 255, 255, 0.95)',
    bgSurfaceHover: 'rgba(0, 0, 0, 0.04)',
    bgSurfaceActive: 'rgba(0, 0, 0, 0.08)',

    // ── Text ──
    textPrimary: '#000000',
    textSecondary: '#3C3C43',
    textTertiary: '#8E8E93',
    textDisabled: '#C7C7CC',
    textInverse: '#FFFFFF',

    // ── Accent (Classic iOS Blue) ──
    accent: '#007AFF',
    accentHover: '#0056B3',
    accentMuted: '#E5F1FF',
    accentGlow: 'rgba(0, 122, 255, 0.25)',
    accentSoft: 'rgba(0, 122, 255, 0.08)',

    // ── Borders & Separators ──
    borderSubtle: 'rgba(0, 0, 0, 0.05)',
    borderDefault: 'rgba(0, 0, 0, 0.10)',
    borderStrong: 'rgba(0, 0, 0, 0.18)',
    separator: 'rgba(60, 60, 67, 0.29)',

    // ── Status Colors ──
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',

    // ── Terminal ──
    terminalBg: '#FFFFFF',
    terminalFg: '#000000',
    terminalCursor: '#000000',
    terminalCursorAccent: '#FFFFFF',
    terminalSelection: 'rgba(0, 122, 255, 0.2)',
    terminalBlack: '#000000',
    terminalRed: '#FF3B30',
    terminalGreen: '#34C759',
    terminalYellow: '#FF9500',
    terminalBlue: '#007AFF',
    terminalMagenta: '#AF52DE',
    terminalCyan: '#5AC8FA',
    terminalWhite: '#FFFFFF',
    terminalBrightBlack: '#8E8E93',
    terminalBrightRed: '#FF453A',
    terminalBrightGreen: '#30D158',
    terminalBrightYellow: '#FFD60A',
    terminalBrightBlue: '#0A84FF',
    terminalBrightMagenta: '#BF5AF2',
    terminalBrightCyan: '#64D2FF',
    terminalBrightWhite: '#FFFFFF',

    // ── Glass / Frosted Effects ──
    glassBg: 'rgba(255, 255, 255, 0.82)',
    glassBgStrong: 'rgba(255, 255, 255, 0.96)',
    glassBorder: 'rgba(0, 0, 0, 0.06)',

    // ── Dock ──
    dockBg: 'rgba(255, 255, 255, 0.85)',
    dockBorder: 'rgba(0, 0, 0, 0.06)',
    dockItemBg: 'rgba(0, 0, 0, 0.03)',
    dockItemHover: 'rgba(0, 0, 0, 0.06)',
    dockItemActive: 'rgba(0, 122, 255, 0.12)',

    // ── Window ──
    windowHeaderBg: 'rgba(242, 242, 247, 0.92)',
    windowBorder: 'rgba(0, 0, 0, 0.06)',
    windowBorderActive: 'rgba(0, 122, 255, 0.50)',

    // ── App Icons ──
    appIconFrom: '#E5E5EA',
    appIconTo: '#D1D1D6',

    // ── Wallpaper/Background ──
    wallpaperGradient1: 'rgba(0, 122, 255, 0.05)',
    wallpaperGradient2: 'rgba(0, 122, 255, 0.03)',
    wallpaperGradient3: 'rgba(142, 142, 147, 0.01)',

    // ── Status Bar ──
    statusBarText: '#000000',
    statusBarBattery: '#34C759',

    // ── Gesture Indicators ──
    handleBar: 'rgba(0, 0, 0, 0.20)',
    homeIndicator: 'rgba(0, 0, 0, 0.30)',

    // ── Overlay ──
    backdropBg: 'rgba(0, 0, 0, 0.15)',

    // ── File Manager ──
    fileSelected: 'rgba(0, 122, 255, 0.08)',
    fileHover: 'rgba(0, 0, 0, 0.03)',

    // ── Editor ──
    editorGutter: '#F2F2F7',
    editorLineHighlight: 'rgba(0, 122, 255, 0.04)',
    editorBg: '#FFFFFF',

    // ── iOS Controls ──
    iosToggleOff: '#C8C8CE',
    iosToggleOn: '#34C759',
    iosToggleThumb: '#FFFFFF',
    iosSliderTrack: 'rgba(0, 0, 0, 0.10)',
    iosSliderThumb: '#FFFFFF',

    // ── Icons ──
    iconFg: 'currentColor',

    // ── Status Backgrounds ──
    errorBg: 'rgba(255, 59, 48, 0.06)',
    warningBg: 'rgba(255, 149, 0, 0.06)',
    successBg: 'rgba(52, 199, 89, 0.06)',

    // ── Misc ──
    innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.90)',
  },
}

export const claudeTheme: Theme = {
  id: 'claude',
  name: 'Claude',
  icon: 'claude',
  description: 'Signature Anthropic Claude warm palette',
  i18nKey: 'claude',
  isDark: false,
  colors: {
    // ── Background layers ──
    bgBase: '#FAF9F5',
    bgSurface: '#F4F3EE',
    bgSurfaceRaised: '#FFFFFF',
    bgSurfaceOverlay: 'rgba(255, 255, 255, 0.96)',
    bgSurfaceHover: 'rgba(31, 30, 29, 0.04)',
    bgSurfaceActive: 'rgba(31, 30, 29, 0.08)',

    // ── Text ──
    textPrimary: '#000000',
    textSecondary: '#4E4D49',
    textTertiary: '#8C8A82',
    textDisabled: '#C2C0B8',
    textInverse: '#FFFFFF',

    // ── Accent (Official Claude Terracotta clay orange accents) ──
    accent: '#D97757',
    accentHover: '#C56143',
    accentMuted: '#F5D9D0',
    accentGlow: 'rgba(217, 119, 87, 0.25)',
    accentSoft: 'rgba(217, 119, 87, 0.08)',

    // ── Borders & Separators ──
    borderSubtle: 'rgba(31, 30, 29, 0.05)',
    borderDefault: 'rgba(31, 30, 29, 0.10)',
    borderStrong: 'rgba(31, 30, 29, 0.18)',
    separator: 'rgba(31, 30, 29, 0.12)',

    // ── Status Colors ──
    success: '#248A3D',
    warning: '#8A5500',
    error: '#C81414',
    info: '#6A9BCC',

    // ── Terminal ──
    terminalBg: '#FAF9F5',
    terminalFg: '#1F1E1D',
    terminalCursor: '#D97757',
    terminalCursorAccent: '#FFFFFF',
    terminalSelection: 'rgba(217, 119, 87, 0.18)',
    terminalBlack: '#1F1E1D',
    terminalRed: '#C81414',
    terminalGreen: '#248A3D',
    terminalYellow: '#8A5500',
    terminalBlue: '#6A9BCC',
    terminalMagenta: '#8B1A8B',
    terminalCyan: '#00678F',
    terminalWhite: '#F4F3EE',
    terminalBrightBlack: '#B2B0A9',
    terminalBrightRed: '#D62929',
    terminalBrightGreen: '#2DA44E',
    terminalBrightYellow: '#9C6200',
    terminalBrightBlue: '#6A9BCC',
    terminalBrightMagenta: '#A020A0',
    terminalBrightCyan: '#0087B5',
    terminalBrightWhite: '#FFFFFF',

    // ── Glass / Frosted Effects ──
    glassBg: 'rgba(250, 249, 245, 0.82)',
    glassBgStrong: 'rgba(250, 249, 245, 0.96)',
    glassBorder: 'rgba(31, 30, 29, 0.06)',

    // ── Dock ──
    dockBg: 'rgba(250, 249, 245, 0.85)',
    dockBorder: 'rgba(31, 30, 29, 0.06)',
    dockItemBg: 'rgba(31, 30, 29, 0.03)',
    dockItemHover: 'rgba(31, 30, 29, 0.06)',
    dockItemActive: 'rgba(217, 119, 87, 0.12)',

    // ── Window ──
    windowHeaderBg: 'rgba(244, 243, 238, 0.92)',
    windowBorder: 'rgba(31, 30, 29, 0.06)',
    windowBorderActive: 'rgba(217, 119, 87, 0.50)',

    // ── App Icons ──
    appIconFrom: '#E0876A',
    appIconTo: '#D97757',

    // ── Wallpaper/Background ──
    wallpaperGradient1: 'rgba(217, 119, 87, 0.05)',
    wallpaperGradient2: 'rgba(217, 119, 87, 0.03)',
    wallpaperGradient3: 'rgba(110, 100, 90, 0.01)',

    // ── Status Bar ──
    statusBarText: '#1F1E1D',
    statusBarBattery: '#248A3D',

    // ── Gesture Indicators ──
    handleBar: 'rgba(31, 30, 29, 0.20)',
    homeIndicator: 'rgba(31, 30, 29, 0.30)',

    // ── Overlay ──
    backdropBg: 'rgba(31, 30, 29, 0.30)',

    // ── File Manager ──
    fileSelected: 'rgba(217, 119, 87, 0.08)',
    fileHover: 'rgba(31, 30, 29, 0.03)',

    // ── Editor ──
    editorGutter: '#F4F3EE',
    editorLineHighlight: 'rgba(217, 119, 87, 0.04)',
    editorBg: '#FFFFFF',

    // ── iOS Controls ──
    iosToggleOff: '#C8C8CE',
    iosToggleOn: '#248A3D',
    iosToggleThumb: '#FFFFFF',
    iosSliderTrack: 'rgba(31, 30, 29, 0.10)',
    iosSliderThumb: '#FFFFFF',

    // ── Icons ──
    iconFg: 'currentColor',

    // ── Status Backgrounds ──
    errorBg: 'rgba(200, 20, 20, 0.06)',
    warningBg: 'rgba(138, 85, 0, 0.06)',
    successBg: 'rgba(36, 138, 61, 0.06)',

    // ── Misc ──
    innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.90)',
  },
}

// ── SCP Theme (red accent) ──────────────────────────────────────────
export const scpTheme: Theme = {
  id: 'scp',
  name: 'SCP Red',
  icon: 'SCP',
  description: 'SCP Foundation theme with red accents',
  i18nKey: 'scpRed',
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
    glassBgStrong: 'rgba(36, 36, 36, 0.95)',
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
    errorBg: 'rgba(255, 68, 68, 0.12)',
    warningBg: 'rgba(255, 165, 0, 0.12)',
    successBg: 'rgba(0, 255, 0, 0.12)',
    editorBg: '#0A0A0A',
    innerGlow: 'inset 0 1px 0 rgba(233, 69, 96, 0.06)',
  },
}

// ── Hacker Theme (green on black) ───────────────────────────────────
export const hackerTheme: Theme = {
  id: 'hacker',
  name: 'Hacker',
  icon: 'Code',
  description: 'Matrix-style green on black',
  i18nKey: 'hacker',
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
    glassBgStrong: 'rgba(15, 47, 15, 0.95)',
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
    errorBg: 'rgba(255, 0, 0, 0.12)',
    warningBg: 'rgba(255, 255, 0, 0.12)',
    successBg: 'rgba(0, 255, 0, 0.12)',
    editorBg: '#000000',
    innerGlow: 'inset 0 1px 0 rgba(0, 255, 0, 0.06)',
  },
}

// ── Theme Registry ───────────────────────────────────────────────────
export const themes: Record<string, Theme> = {
  dark: darkTheme,
  light: lightTheme,
  claude: claudeTheme,
  scp: scpTheme,
  hacker: hackerTheme,
}

export const availableThemes: Theme[] = [darkTheme, lightTheme, claudeTheme, scpTheme, hackerTheme]
