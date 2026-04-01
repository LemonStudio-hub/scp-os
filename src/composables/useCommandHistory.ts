import { ref } from 'vue'
import { errorHandler, ErrorType, ErrorSeverity } from '../utils/errorHandler'

// 最大命令历史记录数
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
          message: '无效的命令历史输入',
          details: `输入类型: ${typeof command}, 值: ${String(command)}`,
        })
        return
      }
      
      history.value.push(command)
      
      // 限制历史记录数量
      if (history.value.length > MAX_HISTORY_SIZE) {
        history.value.shift()
      }
      
      currentIndex.value = -1
    } catch (error) {
      errorHandler.handleError({
        type: ErrorType.HISTORY_UPDATE_FAILED,
        severity: ErrorSeverity.MEDIUM,
        message: '添加命令到历史记录失败',
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
          message: '历史导航回调不是函数',
          details: `回调类型: ${typeof callback}`,
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
              message: '历史导航回调执行失败',
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
                message: '历史导航回调执行失败',
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
                message: '历史导航回调执行失败',
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
        message: '命令历史导航失败',
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
        message: '历史索引重置失败',
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