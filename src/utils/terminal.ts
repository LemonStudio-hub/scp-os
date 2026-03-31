import type { TerminalConfig } from '../types/terminal'
import { SCP_THEME } from '../constants/theme'

export function createTerminalConfig(): TerminalConfig {
  return {
    theme: SCP_THEME,
    fontSize: 14,
    lineHeight: 1.6,
    cursorBlink: true,
    cursorStyle: 'block',
    scrollback: 1000,
    tabStopWidth: 4,
    allowProposedApi: true
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function randomDelay(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function isPrintableCharacter(char: string): boolean {
  const code = char.charCodeAt(0)
  return code >= 32 && code <= 126
}