import { ref } from 'vue'
import { errorHandler, ErrorType, ErrorSeverity } from '../utils/errorHandler'

// Maximum command history size
const MAX_HISTORY_SIZE = 500

export function useCommandHistory() {
  const history = ref<string[]>([])
  const currentIndex = ref(-1)

  const addToHistory = (command: string) => {
    try {
      if (!command || typeof command !== 'string') {
        errorHandler.handleError({
          type: ErrorType.INVALID_INPUT,
          severity: ErrorSeverity.LOW,
          message: 'Invalid command history input',
          details: `Input type: ${typeof command}, value: ${String(command)}`,
        })
        return
      }
      
      history.value.push(command)
      
      // Limit history size
      if (history.value.length > MAX_HISTORY_SIZE) {
        history.value.shift()
      }
      
      currentIndex.value = -1
    } catch (error) {
      errorHandler.handleError({
        type: ErrorType.HISTORY_UPDATE_FAILED,
        severity: ErrorSeverity.MEDIUM,
        message: 'Failed to add command to history',
        details: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const navigateHistory = (direction: number, callback: (command: string) => void) => {
    try {
      if (typeof callback !== 'function') {
        errorHandler.handleError({
          type: ErrorType.INVALID_INPUT,
          severity: ErrorSeverity.HIGH,
          message: 'History navigation callback is not a function',
          details: `Callback type: ${typeof callback}`,
        })
        return
      }

      if (history.value.length === 0) {
        return
      }

      if (direction === -1) { // Up
        if (currentIndex.value < history.value.length - 1) {
          currentIndex.value++
          const index = history.value.length - 1 - currentIndex.value
          try {
            callback(history.value[index])
          } catch (error) {
            errorHandler.handleError({
              type: ErrorType.CALLBACK_EXECUTION_FAILED,
              severity: ErrorSeverity.MEDIUM,
              message: 'History navigation callback execution failed',
              details: error instanceof Error ? error.message : String(error),
            })
          }
        }
      } else { // Down
        if (currentIndex.value > -1) {
          currentIndex.value--
          if (currentIndex.value === -1) {
            try {
              callback('')
            } catch (error) {
              errorHandler.handleError({
                type: ErrorType.CALLBACK_EXECUTION_FAILED,
                severity: ErrorSeverity.MEDIUM,
                message: 'History navigation callback execution failed',
                details: error instanceof Error ? error.message : String(error),
              })
            }
          } else {
            const index = history.value.length - 1 - currentIndex.value
            try {
              callback(history.value[index])
            } catch (error) {
              errorHandler.handleError({
                type: ErrorType.CALLBACK_EXECUTION_FAILED,
                severity: ErrorSeverity.MEDIUM,
                message: 'History navigation callback execution failed',
                details: error instanceof Error ? error.message : String(error),
              })
            }
          }
        }
      }
    } catch (error) {
      errorHandler.handleError({
        type: ErrorType.HISTORY_NAVIGATION_FAILED,
        severity: ErrorSeverity.MEDIUM,
        message: 'Command history navigation failed',
        details: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const resetIndex = () => {
    try {
      currentIndex.value = -1
    } catch (error) {
      errorHandler.handleError({
        type: ErrorType.HISTORY_RESET_FAILED,
        severity: ErrorSeverity.LOW,
        message: 'History index reset failed',
        details: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    history,
    currentIndex,
    addToHistory,
    navigateHistory,
    resetIndex
  }
}