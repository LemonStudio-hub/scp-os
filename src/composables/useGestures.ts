import Hammer from 'hammerjs'
import { onUnmounted } from 'vue'
import type { Ref } from 'vue'

export function useGestures(
  container: Ref<HTMLElement | undefined>,
  callbacks: {
    onClearScreen?: () => void
    onHistoryUp?: () => void
    onHistoryDown?: () => void
    onFocus?: () => void
  }
) {
  let hammer: HammerManager | null = null

  const initGestures = () => {
    if (!container.value) return

    hammer = new Hammer(container.value)

    // Three finger swipe up for clear screen
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_UP, pointers: 3 })
    hammer.on('swipeup', () => {
      callbacks.onClearScreen?.()
    })

    // Two finger swipe left for history up
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_LEFT, pointers: 2 })
    hammer.on('swipeleft', () => {
      callbacks.onHistoryUp?.()
    })

    // Two finger swipe right for history down
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_RIGHT, pointers: 2 })
    hammer.on('swiperight', () => {
      callbacks.onHistoryDown?.()
    })

    // Tap to focus
    hammer.on('tap', () => {
      callbacks.onFocus?.()
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
    destroyGestures
  }
}