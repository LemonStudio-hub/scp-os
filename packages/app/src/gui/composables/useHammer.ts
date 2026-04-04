/**
 * Hammer.js Gesture Composable
 * Provides swipe, pan, pinch, and tap gestures for mobile GUI.
 */

import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'
import Hammer, { type HammerManager, type HammerEvent } from 'hammerjs'

export interface GestureState {
  isSwiping: boolean
  direction: 'left' | 'right' | 'up' | 'down' | null
  deltaX: number
  deltaY: number
  velocityX: number
  velocityY: number
}

export interface UseHammerOptions {
  swipeThreshold?: number
  swipeVelocity?: number
  directions?: ('swipe' | 'pan' | 'pinch' | 'tap' | 'press')[]
}

export function useHammer(
  elementRef: Ref<HTMLElement | null>,
  options: UseHammerOptions = {}
) {
  const {
    swipeThreshold = 50,
    swipeVelocity = 0.3,
    directions = ['swipe', 'pan', 'tap'],
  } = options

  const gesture = ref<GestureState>({
    isSwiping: false,
    direction: null,
    deltaX: 0,
    deltaY: 0,
    velocityX: 0,
    velocityY: 0,
  })

  let mc: HammerManager | null = null

  // Callbacks
  const callbacks = {
    onSwipeLeft: null as (() => void) | null,
    onSwipeRight: null as (() => void) | null,
    onSwipeUp: null as (() => void) | null,
    onSwipeDown: null as (() => void) | null,
    onTap: null as (() => void) | null,
    onPress: null as (() => void) | null,
    onPan: null as ((e: HammerEvent) => void) | null,
  }

  function setup(): void {
    if (!elementRef.value || mc) return

    mc = new Hammer.Manager(elementRef.value, {
      recognizers: [],
    })

    // Swipe recognizer
    if (directions.includes('swipe')) {
      const swipe = new Hammer.Swipe({
        threshold: swipeThreshold,
        velocity: swipeVelocity,
        direction: Hammer.DIRECTION_ALL,
      })
      mc.add(swipe)

      mc.on('swipeleft', () => {
        callbacks.onSwipeLeft?.()
      })
      mc.on('swiperight', () => {
        callbacks.onSwipeRight?.()
      })
      mc.on('swipeup', () => {
        callbacks.onSwipeUp?.()
      })
      mc.on('swipedown', () => {
        callbacks.onSwipeDown?.()
      })
    }

    // Pan recognizer (for tracking drag movement)
    if (directions.includes('pan')) {
      const pan = new Hammer.Pan({
        threshold: 0,
        pointers: 0,
      })
      mc.add(pan)

      mc.on('panstart', () => {
        gesture.value.isSwiping = true
      })
      mc.on('panmove', (e: HammerEvent) => {
        gesture.value.deltaX = e.deltaX
        gesture.value.deltaY = e.deltaY
        gesture.value.velocityX = e.velocityX
        gesture.value.velocityY = e.velocityY

        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          gesture.value.direction = e.deltaX > 0 ? 'right' : 'left'
        } else {
          gesture.value.direction = e.deltaY > 0 ? 'down' : 'up'
        }

        callbacks.onPan?.(e)
      })
      mc.on('panend pancancel', () => {
        gesture.value.isSwiping = false
        gesture.value.direction = null
      })
    }

    // Tap recognizer
    if (directions.includes('tap')) {
      const tap = new Hammer.Tap()
      mc.add(tap)

      mc.on('tap', () => {
        callbacks.onTap?.()
      })
    }

    // Press (long press) recognizer
    if (directions.includes('press')) {
      const press = new Hammer.Press({ time: 500 })
      mc.add(press)

      mc.on('press', () => {
        callbacks.onPress?.()
      })
    }
  }

  function teardown(): void {
    if (mc) {
      mc.destroy()
      mc = null
    }
  }

  function setCallbacks(newCallbacks: Partial<typeof callbacks>): void {
    Object.assign(callbacks, newCallbacks)
  }

  onMounted(() => {
    setup()
  })

  onBeforeUnmount(() => {
    teardown()
  })

  return {
    gesture,
    setup,
    teardown,
    setCallbacks,
    manager: () => mc,
  }
}
