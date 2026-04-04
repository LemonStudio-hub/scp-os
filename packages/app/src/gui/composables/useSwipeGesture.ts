/**
 * Swipe Gesture Composable
 * Detects swipe direction and distance for iOS-style gestures.
 * Used for swipe-to-dismiss, swipe navigation, etc.
 */

import { ref, type Ref } from 'vue'

export interface SwipeState {
  isSwiping: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
  deltaX: number
  deltaY: number
  velocity: number
}

export interface SwipeThresholds {
  minDistance: number
  maxTime: number
  direction?: 'vertical' | 'horizontal' | 'both'
}

export function useSwipeGesture(
  _elementRef: Ref<HTMLElement | undefined>,
  thresholds: SwipeThresholds = { minDistance: 50, maxTime: 500, direction: 'both' }
) {
  const swipe = ref<SwipeState>({
    isSwiping: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
  })

  let startTime = 0

  const on = {
    onTouchStart(e: TouchEvent) {
      const touch = e.touches[0]
      if (!touch) return

      swipe.value = {
        isSwiping: true,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX: 0,
        deltaY: 0,
        velocity: 0,
      }
      startTime = Date.now()
    },

    onTouchMove(e: TouchEvent) {
      if (!swipe.value.isSwiping) return

      const touch = e.touches[0]
      if (!touch) return

      swipe.value.currentX = touch.clientX
      swipe.value.currentY = touch.clientY
      swipe.value.deltaX = touch.clientX - swipe.value.startX
      swipe.value.deltaY = touch.clientY - swipe.value.startY

      const elapsed = Date.now() - startTime
      swipe.value.velocity = elapsed > 0 ? Math.sqrt(
        swipe.value.deltaX ** 2 + swipe.value.deltaY ** 2
      ) / elapsed : 0
    },

    onTouchEnd() {
      if (!swipe.value.isSwiping) return

      const elapsed = Date.now() - startTime
      const { deltaX, deltaY, minDistance, maxTime, direction } = {
        ...swipe.value,
        ...thresholds,
      }

      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      // Check if swipe meets thresholds
      const meetsDistance = direction === 'horizontal'
        ? absX >= minDistance
        : direction === 'vertical'
          ? absY >= minDistance
          : (absX >= minDistance || absY >= minDistance)

      const meetsTime = elapsed <= maxTime

      if (meetsDistance && meetsTime) {
        // Determine dominant direction
        if (direction !== 'vertical' && absX > absY) {
          if (deltaX > 0) onSwipeRight?.()
          else onSwipeLeft?.()
        } else if (direction !== 'horizontal' && absY > absX) {
          if (deltaY > 0) onSwipeDown?.()
          else onSwipeUp?.()
        }
      }

      swipe.value.isSwiping = false
    },
  }

  // Callbacks to be set by consumer
  let onSwipeUp: (() => void) | undefined
  let onSwipeDown: (() => void) | undefined
  let onSwipeLeft: (() => void) | undefined
  let onSwipeRight: (() => void) | undefined

  function setCallbacks(callbacks: {
    onSwipeUp?: () => void
    onSwipeDown?: () => void
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
  }): void {
    onSwipeUp = callbacks.onSwipeUp
    onSwipeDown = callbacks.onSwipeDown
    onSwipeLeft = callbacks.onSwipeLeft
    onSwipeRight = callbacks.onSwipeRight
  }

  return {
    swipe,
    on,
    setCallbacks,
  }
}
