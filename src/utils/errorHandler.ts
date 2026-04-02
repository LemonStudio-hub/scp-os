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
    // Do not register global error handler here to avoid duplication
    // Global error handler is managed uniformly in main.ts
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

    // Add to error logs
    this.addErrorLog(error.toJSON())

    // Output to console
    if (config.logToConsole !== false) {
      this.logToConsole(error)
    }

    // Output to terminal
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
        message: error?.message || 'Async operation failed',
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
        message: error instanceof Error ? error.message : 'Sync operation failed',
        details: error instanceof Error ? error.stack : String(error),
        ...errorConfig,
      })
    }
  }

  private addErrorLog(log: ErrorLog) {
    this.errorLogs.value.push(log)
    
    // Limit log count
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

    const timestamp = error.timestamp.toLocaleTimeString('en-US')
    const severity = this.getSeverityDisplay(error.severity)
    const type = this.getTypeDisplay(error.type)
    const suggestions = this.getErrorSuggestions(error.type)

    this.terminalWriter(`\r\n`)
    this.terminalWriter(`${ANSICode.red}[${timestamp}] ERROR - ${severity}${ANSICode.reset}\r\n`)
    this.terminalWriter(`${ANSICode.yellow}Type: ${type}${ANSICode.reset}\r\n`)
    this.terminalWriter(`${ANSICode.white}Message: ${error.message}${ANSICode.reset}\r\n`)
    
    if (error.details) {
      this.terminalWriter(`${ANSICode.gray}Details: ${error.details}${ANSICode.reset}\r\n`)
    }

    // 显示建议
    if (suggestions.length > 0 && this.terminalWriter) {
      const writer = this.terminalWriter
      writer(`${ANSICode.cyan}Suggestions:${ANSICode.reset}\r\n`)
      suggestions.forEach((suggestion, index) => {
        writer(`  ${index + 1}. ${suggestion}${ANSICode.reset}\r\n`)
      })
    }
    
    if (this.terminalWriter) {
      this.terminalWriter(`\r\n`)
    }
  }

  private getErrorSuggestions(type: string): string[] {
    const suggestionsMap: Record<string, string[]> = {
      [ErrorType.NETWORK_ERROR]: [
        '检查网络连接是否正常',
        '使用 "network" 命令测试连接',
        '稍后重试或检查防火墙设置',
        '尝试刷新页面重新加载',
      ],
      [ErrorType.COMMAND_NOT_FOUND]: [
        '使用 "help" 命令查看可用命令',
        '检查命令拼写是否正确',
        '查看命令使用帮助',
      ],
      [ErrorType.DATA_NOT_FOUND]: [
        '检查SCP编号是否正确',
        '使用 "search" 命令搜索相关SCP',
        '尝试使用 "scp-list" 查看已知SCP',
      ],
      [ErrorType.TERMINAL_WRITE_FAILED]: [
        '刷新页面重试',
        '检查浏览器兼容性',
        '清除浏览器缓存',
      ],
      [ErrorType.COMMAND_INVALID_ARGS]: [
        '使用 "help <命令>" 查看用法',
        '检查命令参数格式',
        '参考命令示例',
      ],
    }
    
    return suggestionsMap[type] || [
      '如果是网络问题，请检查连接',
      '如果问题持续，请刷新页面',
      '使用 "help" 命令获取帮助',
    ]
  }

  private getSeverityDisplay(severity: string): string {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'Low'
      case ErrorSeverity.MEDIUM:
        return 'Medium'
      case ErrorSeverity.HIGH:
        return 'High'
      case ErrorSeverity.CRITICAL:
        return 'Critical'
      default:
        return 'Unknown'
    }
  }

  private getTypeDisplay(type: string): string {
    const typeMap: Record<string, string> = {
      [ErrorType.TERMINAL_INIT_FAILED]: 'Terminal initialization failed',
      [ErrorType.TERMINAL_DISPOSE_FAILED]: 'Terminal disposal failed',
      [ErrorType.TERMINAL_NOT_AVAILABLE]: 'Terminal not available',
      [ErrorType.TERMINAL_WRITE_FAILED]: 'Terminal write failed',
      [ErrorType.COMMAND_NOT_FOUND]: 'Command not found',
      [ErrorType.COMMAND_EXECUTION_FAILED]: 'Command execution failed',
      [ErrorType.COMMAND_INVALID_ARGS]: 'Invalid command arguments',
      [ErrorType.COMMAND_PARSING_FAILED]: 'Command parsing failed',
      [ErrorType.DATA_NOT_FOUND]: 'Data not found',
      [ErrorType.DATA_INVALID]: 'Invalid data',
      [ErrorType.NETWORK_ERROR]: 'Network error',
      [ErrorType.HISTORY_UPDATE_FAILED]: 'History update failed',
      [ErrorType.HISTORY_NAVIGATION_FAILED]: 'History navigation failed',
      [ErrorType.HISTORY_RESET_FAILED]: 'History reset failed',
      [ErrorType.CALLBACK_EXECUTION_FAILED]: 'Callback execution failed',
      [ErrorType.INVALID_INPUT]: 'Invalid input',
      [ErrorType.GLOBAL_ERROR]: 'Global error',
      [ErrorType.UNHANDLED_PROMISE_REJECTION]: 'Unhandled promise rejection',
      [ErrorType.VUE_ERROR]: 'Vue error',
      [ErrorType.SYSTEM_ERROR]: 'System error',
      [ErrorType.UNKNOWN_ERROR]: 'Unknown error',
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

// Convenience error creation function
export function createError(config: ErrorConfig): SCPError {
  return errorHandler.handleError(config)
}

// Convenience async error handling
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  config: Partial<ErrorConfig>
): Promise<T> {
  return errorHandler.wrapAsync(fn, config)
}

// Convenience sync error handling
export function withSyncErrorHandling<T>(
  fn: () => T,
  config: Partial<ErrorConfig>
): T {
  return errorHandler.wrapSync(fn, config)
}