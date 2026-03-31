export {}

declare global {
  interface Window {
    scpTerminalActions?: {
      clearScreen: () => void
      navigateHistory: (direction: number) => void
      autocomplete: () => void
      focus: () => void
    }
  }
}