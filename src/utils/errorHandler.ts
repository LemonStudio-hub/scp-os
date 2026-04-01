import { ref, type Ref } from 'vue'
import { SCPError, ErrorType, ErrorSeverity, type ErrorConfig, type ErrorLog } from '../types/error'
import { ANSICode } from '../constants/theme'

// Re-export error types for convenience
export { ErrorType, ErrorSeverity }
export type { ErrorConfig, ErrorLog }

export class ErrorHandler {
  private static instance: ErrorHandler
  private errorLogs: Ref<ErrorLog[]> = ref([])
  private maxLogs: number = 100
  private terminalWriter?: ((data: string) => void) | null

  private constructor() {
    // 不在这里注册全局错误处理器，避免重复
    // 全局错误处理器在 main.ts 中统一管理
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  public setTerminalWriter(writer: (data: string) => void) {
    this.terminalWriter = writer
  }

  public handleError(config: ErrorConfig): SCPError {
    const error = new SCPError({
      ...config,
      logToConsole: config.logToConsole !== false,
    })

    // 添加到错误日志
    this.addErrorLog(error.toJSON())

    // 输出到控制台
    if (config.logToConsole !== false) {
      this.logToConsole(error)
    }

    // 输出到终端
    if (this.terminalWriter) {
      this.logToTerminal(error)
    }

    return error
  }

  public wrapAsync<T>(
    fn: () => Promise<T>,
    errorConfig: Partial<ErrorConfig>
  ): Promise<T> {
    return fn().catch((error) => {
      throw this.handleError({
        type: ErrorType.UNKNOWN_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: error?.message || '异步操作失败',
        details: error?.stack,
        ...errorConfig,
      })
    })
  }

  public wrapSync<T>(
    fn: () => T,
    errorConfig: Partial<ErrorConfig>
  ): T {
    try {
      return fn()
    } catch (error) {
      throw this.handleError({
        type: ErrorType.UNKNOWN_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: error instanceof Error ? error.message : '同步操作失败',
        details: error instanceof Error ? error.stack : String(error),
        ...errorConfig,
      })
    }
  }

  private addErrorLog(log: ErrorLog) {
    this.errorLogs.value.push(log)
    
    // 限制日志数量
    if (this.errorLogs.value.length > this.maxLogs) {
      this.errorLogs.value.shift()
    }
  }

  private logToConsole(error: SCPError) {
    console.group(`[${error.severity}] ${error.type}`)
    console.error(`Message: ${error.message}`)
    if (error.details) {
      console.error(`Details: ${error.details}`)
    }
    if (error.stack) {
      console.error(`Stack: ${error.stack}`)
    }
    console.groupEnd()
  }

  private logToTerminal(error: SCPError) {
    if (!this.terminalWriter) return

    const timestamp = error.timestamp.toLocaleTimeString('zh-CN')
    const severity = this.getSeverityDisplay(error.severity)
    const type = this.getTypeDisplay(error.type)

    this.terminalWriter(`\r\n`)
    this.terminalWriter(`${ANSICode.red}[${timestamp}] ERROR - ${severity}${ANSICode.reset}\r\n`)
    this.terminalWriter(`${ANSICode.yellow}Type: ${type}${ANSICode.reset}\r\n`)
    this.terminalWriter(`${ANSICode.white}Message: ${error.message}${ANSICode.reset}\r\n`)
    
    if (error.details) {
      this.terminalWriter(`${ANSICode.gray}Details: ${error.details}${ANSICode.reset}\r\n`)
    }
    
    this.terminalWriter(`\r\n`)
  }

  private getSeverityDisplay(severity: string): string {
    switch (severity) {
      case ErrorSeverity.LOW:
        return '低'
      case ErrorSeverity.MEDIUM:
        return '中'
      case ErrorSeverity.HIGH:
        return '高'
      case ErrorSeverity.CRITICAL:
        return '严重'
      default:
        return '未知'
    }
  }

  private getTypeDisplay(type: string): string {
    const typeMap: Record<string, string> = {
      [ErrorType.TERMINAL_INIT_FAILED]: '终端初始化失败',
      [ErrorType.TERMINAL_DISPOSE_FAILED]: '终端销毁失败',
      [ErrorType.TERMINAL_NOT_AVAILABLE]: '终端不可用',
      [ErrorType.TERMINAL_WRITE_FAILED]: '终端写入失败',
      [ErrorType.COMMAND_NOT_FOUND]: '命令未找到',
      [ErrorType.COMMAND_EXECUTION_FAILED]: '命令执行失败',
      [ErrorType.COMMAND_INVALID_ARGS]: '命令参数无效',
      [ErrorType.COMMAND_PARSING_FAILED]: '命令解析失败',
      [ErrorType.GESTURE_INIT_FAILED]: '手势初始化失败',
      [ErrorType.GESTURE_DESTROY_FAILED]: '手势销毁失败',
      [ErrorType.GESTURE_EVENT_FAILED]: '手势事件失败',
      [ErrorType.GESTURE_SETUP_FAILED]: '手势设置失败',
      [ErrorType.GESTURE_HANDLER_FAILED]: '手势处理失败',
      [ErrorType.DATA_NOT_FOUND]: '数据未找到',
      [ErrorType.DATA_INVALID]: '数据无效',
      [ErrorType.NETWORK_ERROR]: '网络错误',
      [ErrorType.HISTORY_UPDATE_FAILED]: '历史更新失败',
      [ErrorType.HISTORY_NAVIGATION_FAILED]: '历史导航失败',
      [ErrorType.HISTORY_RESET_FAILED]: '历史重置失败',
      [ErrorType.CALLBACK_EXECUTION_FAILED]: '回调执行失败',
      [ErrorType.INVALID_INPUT]: '无效输入',
      [ErrorType.GLOBAL_ERROR]: '全局错误',
      [ErrorType.UNHANDLED_PROMISE_REJECTION]: '未处理的 Promise 拒绝',
      [ErrorType.VUE_ERROR]: 'Vue 错误',
      [ErrorType.SYSTEM_ERROR]: '系统错误',
      [ErrorType.UNKNOWN_ERROR]: '未知错误',
    }
    return typeMap[type] || type
  }

  public getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs.value]
  }

  public clearErrorLogs() {
    this.errorLogs.value = []
  }

  public getRecentErrors(count: number = 10): ErrorLog[] {
    return this.errorLogs.value.slice(-count)
  }

  public getErrorsByType(type: string): ErrorLog[] {
    return this.errorLogs.value.filter(log => log.type === type)
  }

  public getErrorsBySeverity(severity: string): ErrorLog[] {
    return this.errorLogs.value.filter(log => log.severity === severity)
  }
}

export const errorHandler = ErrorHandler.getInstance()

// 便捷的错误创建函数
export function createError(config: ErrorConfig): SCPError {
  return errorHandler.handleError(config)
}

// 便捷的异步错误处理
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  config: Partial<ErrorConfig>
): Promise<T> {
  return errorHandler.wrapAsync(fn, config)
}

// 便捷的同步错误处理
export function withSyncErrorHandling<T>(
  fn: () => T,
  config: Partial<ErrorConfig>
): T {
  return errorHandler.wrapSync(fn, config)
}