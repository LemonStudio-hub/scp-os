import Hammer from 'hammerjs'
import { onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'
import { errorHandler, ErrorType, ErrorSeverity } from '../utils/errorHandler'

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
    try {
      if (!container.value) {
        errorHandler.handleError({
          type: ErrorType.INVALID_INPUT,
          severity: ErrorSeverity.LOW,
          message: '手势容器未找到',
        })
        return
      }

      try {
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
      } catch (error) {
        errorHandler.handleError({
          type: ErrorType.GESTURE_INIT_FAILED,
          severity: ErrorSeverity.HIGH,
          message: 'Hammer.js 初始化失败',
          details: error instanceof Error ? error.message : String(error),
          logToConsole: true,
        })
        throw error
      }

    // Multi-finger gestures
    if (isMobile.value) {
      // Three finger swipe up for clear screen
      try {
        hammer.get('swipe').set({ pointers: 3 })
        hammer.on('swipeup', () => {
          try {
            callbacks.onClearScreen?.()
          } catch (error) {
            errorHandler.handleError({
              type: ErrorType.CALLBACK_EXECUTION_FAILED,
              severity: ErrorSeverity.LOW,
              message: 'ClearScreen 回调执行失败',
              details: error instanceof Error ? error.message : String(error),
            })
          }
        })

        // Two finger swipe left for history up
        hammer.get('swipe').set({ pointers: 2 })
        hammer.on('swipeleft', () => {
          try {
            callbacks.onHistoryUp?.()
          } catch (error) {
            errorHandler.handleError({
              type: ErrorType.CALLBACK_EXECUTION_FAILED,
              severity: ErrorSeverity.LOW,
              message: 'HistoryUp 回调执行失败',
              details: error instanceof Error ? error.message : String(error),
            })
          }
        })

        // Two finger swipe right for history down
        hammer.on('swiperight', () => {
          try {
            callbacks.onHistoryDown?.()
          } catch (error) {
            errorHandler.handleError({
              type: ErrorType.CALLBACK_EXECUTION_FAILED,
              severity: ErrorSeverity.LOW,
              message: 'HistoryDown 回调执行失败',
              details: error instanceof Error ? error.message : String(error),
            })
          }
        })

        // Two finger swipe down to scroll to bottom
        hammer.on('swipedown', () => {
          try {
            callbacks.onScrollBottom?.()
          } catch (error) {
            errorHandler.handleError({
              type: ErrorType.CALLBACK_EXECUTION_FAILED,
              severity: ErrorSeverity.LOW,
              message: 'ScrollBottom 回调执行失败',
              details: error instanceof Error ? error.message : String(error),
            })
          }
        })
      } catch (error) {
        errorHandler.handleError({
          type: ErrorType.GESTURE_SETUP_FAILED,
          severity: ErrorSeverity.MEDIUM,
          message: '移动端手势设置失败',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    } else {
      // Desktop: simpler gestures
      try {
        hammer.get('swipe').set({ pointers: 1 })
        hammer.on('swipeup', () => {
          try {
            callbacks.onScrollTop?.()
          } catch (error) {
            errorHandler.handleError({
              type: ErrorType.CALLBACK_EXECUTION_FAILED,
              severity: ErrorSeverity.LOW,
              message: 'ScrollTop 回调执行失败',
              details: error instanceof Error ? error.message : String(error),
            })
          }
        })
        hammer.on('swipedown', () => {
          try {
            callbacks.onScrollBottom?.()
          } catch (error) {
            errorHandler.handleError({
              type: ErrorType.CALLBACK_EXECUTION_FAILED,
              severity: ErrorSeverity.LOW,
              message: 'ScrollBottom 回调执行失败',
              details: error instanceof Error ? error.message : String(error),
            })
          }
        })
      } catch (error) {
        errorHandler.handleError({
          type: ErrorType.GESTURE_SETUP_FAILED,
          severity: ErrorSeverity.MEDIUM,
          message: '桌面端手势设置失败',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Tap to focus
    try {
      hammer.on('tap', () => {
        try {
          callbacks.onFocus?.()
        } catch (error) {
          errorHandler.handleError({
            type: ErrorType.CALLBACK_EXECUTION_FAILED,
            severity: ErrorSeverity.LOW,
            message: 'Focus 回调执行失败',
            details: error instanceof Error ? error.message : String(error),
          })
        }
      })

      // Long press to clear screen (mobile)
      hammer.on('press', () => {
        try {
          callbacks.onClearScreen?.()
        } catch (error) {
          errorHandler.handleError({
            type: ErrorType.CALLBACK_EXECUTION_FAILED,
            severity: ErrorSeverity.LOW,
            message: 'ClearScreen 回调执行失败',
            details: error instanceof Error ? error.message : String(error),
          })
        }
      })

      // Pinch to zoom (prevent default)
      hammer.get('pinch').set({ enable: true })
      hammer.on('pinchstart pinchmove', (e: HammerInput) => {
        try {
          e.preventDefault()
        } catch (error) {
          errorHandler.handleError({
            type: ErrorType.GESTURE_HANDLER_FAILED,
            severity: ErrorSeverity.LOW,
            message: 'Pinch 手势处理失败',
            details: error instanceof Error ? error.message : String(error),
          })
        }
      })
    } catch (error) {
      errorHandler.handleError({
        type: ErrorType.GESTURE_SETUP_FAILED,
        severity: ErrorSeverity.MEDIUM,
        message: '通用手势设置失败',
        details: error instanceof Error ? error.message : String(error),
      })
    }
  } catch (error) {
    errorHandler.handleError({
      type: ErrorType.GESTURE_INIT_FAILED,
      severity: ErrorSeverity.HIGH,
      message: '手势初始化失败',
      details: error instanceof Error ? error.message : String(error),
      logToConsole: true,
    })
  }
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