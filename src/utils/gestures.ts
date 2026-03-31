import Hammer from 'hammerjs'

export function setupGestures(container: HTMLElement) {
  const hammer = new Hammer(container)

  // Three finger swipe up for clear screen
  hammer.get('swipe').set({ direction: Hammer.DIRECTION_UP, pointers: 3 })
  hammer.on('swipeup', () => {
    if (window.scpTerminalActions) {
      window.scpTerminalActions.clearScreen()
    }
  })

  // Two finger swipe left for history up
  hammer.get('swipe').set({ direction: Hammer.DIRECTION_LEFT, pointers: 2 })
  hammer.on('swipeleft', () => {
    if (window.scpTerminalActions) {
      window.scpTerminalActions.navigateHistory(-1)
    }
  })

  // Two finger swipe right for history down
  hammer.get('swipe').set({ direction: Hammer.DIRECTION_RIGHT, pointers: 2 })
  hammer.on('swiperight', () => {
    if (window.scpTerminalActions) {
      window.scpTerminalActions.navigateHistory(1)
    }
  })

  // Tap to focus
  hammer.on('tap', () => {
    if (window.scpTerminalActions) {
      window.scpTerminalActions.focus()
    }
  })

  return hammer
}

export function destroyGestures(hammer: HammerManager) {
  if (hammer) {
    hammer.destroy()
  }
}