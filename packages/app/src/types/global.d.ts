export {}

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
    __terminalController?: any
    __terminalInstance?: { cols: number; rows: number }
  }

  interface Performance {
    memory?: {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }
  }
}