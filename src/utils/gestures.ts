import Hammer from 'hammerjs'

// Detect if device is mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

export function setupGestures(container: HTMLElement) {
  const hammer = new Hammer(container, {
    touchAction: 'auto',
    recognizers: [
      [Hammer.Tap],
      [Hammer.Pan, { direction: Hammer.DIRECTION_ALL, threshold: 10 }],
      [Hammer.Swipe, { direction: Hammer.DIRECTION_ALL, threshold: 30, velocity: 0.3 }],
      [Hammer.Pinch, { enable: true }],
      [Hammer.Press, { time: 500, threshold: 5 }]
    ]
  })

  // Mobile-specific gestures
  if (isMobile) {
    // Three finger swipe up for clear screen
    hammer.get('swipe').set({ pointers: 3 })
    hammer.on('swipeup', () => {
      if (window.scpTerminalActions) {
        window.scpTerminalActions.clearScreen()
      }
    })

    // Two finger swipe left for history up
    hammer.get('swipe').set({ pointers: 2 })
    hammer.on('swipeleft', () => {
      if (window.scpTerminalActions) {
        window.scpTerminalActions.navigateHistory(-1)
      }
    })

    // Two finger swipe right for history down
    hammer.on('swiperight', () => {
      if (window.scpTerminalActions) {
        window.scpTerminalActions.navigateHistory(1)
      }
    })

    // Two finger swipe down to scroll to bottom
    hammer.on('swipedown', () => {
      if (window.scpTerminalActions && window.scpTerminalActions.scrollToBottom) {
        window.scpTerminalActions.scrollToBottom()
      }
    })

    // Long press to clear screen
    hammer.on('press', () => {
      if (window.scpTerminalActions) {
        window.scpTerminalActions.clearScreen()
      }
    })

    // Prevent pinch zoom
    hammer.get('pinch').set({ enable: true })
    hammer.on('pinchstart pinchmove', (e: HammerInput) => {
      e.preventDefault()
    })
  } else {
    // Desktop: simpler gestures
    hammer.get('swipe').set({ pointers: 1 })
    hammer.on('swipeup', () => {
      if (window.scpTerminalActions && window.scpTerminalActions.scrollToTop) {
        window.scpTerminalActions.scrollToTop()
      }
    })
    hammer.on('swipedown', () => {
      if (window.scpTerminalActions && window.scpTerminalActions.scrollToBottom) {
        window.scpTerminalActions.scrollToBottom()
      }
    })
  }

  // Tap to focus (both mobile and desktop)
  hammer.on('tap', () => {
    if (window.scpTerminalActions) {
      window.scpTerminalActions.focus()
    }
  })

  // Double tap to autocomplete
  hammer.on('doubletap', () => {
    if (window.scpTerminalActions) {
      window.scpTerminalActions.autocomplete()
    }
  })

  return hammer
}

export function destroyGestures(hammer: HammerManager) {
  if (hammer) {
    hammer.destroy()
  }
}