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
  }

  interface Performance {
    memory?: {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }
  }
}