export {}

interface TerminalInstance {
  cols: number
  rows: number
  terminal?: {
    options: Record<string, unknown>
    refresh(start: number, end: number): void
    rows: number
  }
}

interface TerminalController {
  clear(): void
  displayBootLog(): Promise<void>
  markBootLogShown(): void
  displayWelcomeMessage(): void
  displayShutdownLog(): Promise<void>
  displayStartupPrompt(): void
}

declare global {
  interface Window {
    scpTerminalActions?: {
      clearScreen: () => void
      navigateHistory: (direction: number) => void
      autocomplete: () => void
      focus: () => void
      scrollToTop: () => void
      scrollToBottom: () => void
    }
    openPerformanceDashboard?: () => void
    __terminalController?: TerminalController
    __terminalInstance?: TerminalInstance
    __USER_ID__?: string
  }

  interface Performance {
    memory?: {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }
  }
}
