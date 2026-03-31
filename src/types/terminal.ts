import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'

export interface TerminalConfig {
  theme: TerminalTheme
  fontSize: number
  lineHeight: number
  cursorBlink: boolean
  cursorStyle: 'block' | 'underline' | 'bar'
  scrollback: number
  tabStopWidth: number
  allowProposedApi: boolean
}

export interface TerminalTheme {
  background: string
  foreground: string
  cursor: string
  cursorAccent: string
  black: string
  red: string
  green: string
  yellow: string
  blue: string
  magenta: string
  cyan: string
  white: string
  brightBlack: string
  brightRed: string
  brightGreen: string
  brightYellow: string
  brightBlue: string
  brightMagenta: string
  brightCyan: string
  brightWhite: string
}

export interface TerminalInstance {
  terminal: Terminal | null
  fitAddon: FitAddon | null
  hammer: HammerManager | null
}

export type TerminalWrite = (data: string) => void
export type TerminalWriteln = (data: string) => void
export type TerminalClear = () => void