import type { TerminalConfig } from '../types/terminal'
import { SCP_THEME } from '../constants/theme'

export function getResponsiveFontSize(): number {
  const screenWidth = window.innerWidth
  
  if (screenWidth >= 1200) {
    return 16  // Desktop large
  } else if (screenWidth >= 768) {
    return 14  // Desktop/tablet
  } else if (screenWidth >= 480) {
    return 12  // Mobile large
  } else {
    return 10  // Mobile small
  }
}

export function createTerminalConfig(): TerminalConfig {
  return {
    theme: SCP_THEME,
    fontSize: getResponsiveFontSize(),
    lineHeight: 1.6,
    cursorBlink: true,
    cursorStyle: 'block',
    scrollback: 1000,
    tabStopWidth: 4,
    allowProposedApi: true
  }
}

export function updateTerminalFontSize(terminal: any): void {
  if (!terminal) return
  
  const newFontSize = getResponsiveFontSize()
  terminal.options.fontSize = newFontSize
  terminal.refresh(0, terminal.rows - 1)
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