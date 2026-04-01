import type { TerminalTheme } from '../types/terminal'

export const SCP_THEME: TerminalTheme = {
  background: '#0a0a0a',
  foreground: '#e0e0e0',
  cursor: '#00ff00',
  cursorAccent: '#00ff00',
  black: '#000000',
  red: '#ff4444',
  green: '#00ff00',
  yellow: '#ffa500',
  blue: '#4169e1',
  magenta: '#ff00ff',
  cyan: '#00ffff',
  white: '#ffffff',
  brightBlack: '#555555',
  brightRed: '#ff6666',
  brightGreen: '#66ff66',
  brightYellow: '#ffff66',
  brightBlue: '#6666ff',
  brightMagenta: '#ff66ff',
  brightCyan: '#66ffff',
  brightWhite: '#ffffff'
}

export const ANSICode = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m'
}

export const COLORS = {
  scpRed: '#8b0000',
  scpDarkRed: '#5c0000',
  scpGreen: '#00ff00',
  scpOrange: '#ffa500',
  scpRedError: '#ff4444',
  scpWhite: '#ffffff',
  scpGray: '#888888',
  scpBg: '#0a0a0a',
  scpDarkBg: '#000000'
}