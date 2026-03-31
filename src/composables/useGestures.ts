import Hammer from 'hammerjs'
import { onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'

export function useGestures(
  container: Ref<HTMLElement | undefined>,
  callbacks: {
    onClearScreen?: () => void
    onHistoryUp?: () => void
    onHistoryDown?: () => void
    onFocus?: () => void
    onScrollTop?: () => void
    onScrollBottom?: () => void
  }
) {
  let hammer: HammerManager | null = null
  const isMobile = ref(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))

  const initGestures = () => {
    if (!container.value) return

    hammer = new Hammer(container.value, {
      touchAction: 'auto',
      recognizers: [
        [Hammer.Tap],
        [Hammer.Pan, { direction: Hammer.DIRECTION_ALL, threshold: 10 }],
        [Hammer.Swipe, { direction: Hammer.DIRECTION_ALL, threshold: 30, velocity: 0.3 }],
        [Hammer.Pinch, { enable: true }],
        [Hammer.Press, { time: 500, threshold: 5 }]
      ]
    })

    // Multi-finger gestures
    if (isMobile.value) {
      // Three finger swipe up for clear screen
      hammer.get('swipe').set({ pointers: 3 })
      hammer.on('swipeup', () => {
        callbacks.onClearScreen?.()
      })

      // Two finger swipe left for history up
      hammer.get('swipe').set({ pointers: 2 })
      hammer.on('swipeleft', () => {
        callbacks.onHistoryUp?.()
      })

      // Two finger swipe right for history down
      hammer.on('swiperight', () => {
        callbacks.onHistoryDown?.()
      })

      // Two finger swipe down to scroll to bottom
      hammer.on('swipedown', () => {
        callbacks.onScrollBottom?.()
      })
    } else {
      // Desktop: simpler gestures
      hammer.get('swipe').set({ pointers: 1 })
      hammer.on('swipeup', () => {
        callbacks.onScrollTop?.()
      })
      hammer.on('swipedown', () => {
        callbacks.onScrollBottom?.()
      })
    }

    // Tap to focus
    hammer.on('tap', () => {
      callbacks.onFocus?.()
    })

    // Long press to clear screen (mobile)
    hammer.on('press', () => {
      callbacks.onClearScreen?.()
    })

    // Pinch to zoom (prevent default)
    hammer.get('pinch').set({ enable: true })
    hammer.on('pinchstart pinchmove', (e: HammerInput) => {
      e.preventDefault()
    })
  }

  const destroyGestures = () => {
    if (hammer) {
      hammer.destroy()
      hammer = null
    }
  }

  onUnmounted(() => {
    destroyGestures()
  })

  return {
    initGestures,
    destroyGestures,
    isMobile
  }
}