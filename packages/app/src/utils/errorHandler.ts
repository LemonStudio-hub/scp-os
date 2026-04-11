import { ref, type Ref } from 'vue'
import { SCPError, ErrorType, ErrorSeverity, type ErrorConfig, type ErrorLog } from '../types/error'
import { ANSICode } from '../constants/theme'
import logger from './logger'

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
    // 错误处理模块中使用 logger 是合理的，因为它本身就是处理错误的
    const message = `[${error.severity}] ${error.type}: ${error.message}`
    if (error.details) {
      logger.error(message, error.details)
    } else if (error.stack) {
      logger.error(message, error.stack)
    } else {
      logger.error(message)
    }
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
        'Check if your network connection is normal',
        'Use "network" command to test connection',
        'Try again later or check firewall settings',
        'Try refreshing the page to reload',
      ],
      [ErrorType.COMMAND_NOT_FOUND]: [
        'Use "help" command to see available commands',
        'Check if the command is spelled correctly',
        'See command usage help',
      ],
      [ErrorType.DATA_NOT_FOUND]: [
        'Check if the SCP number is correct',
        'Use "search" command to search for related SCP',
        'Try using "scp-list" to view known SCPs',
      ],
      [ErrorType.TERMINAL_WRITE_FAILED]: [
        'Refresh the page and try again',
        'Check browser compatibility',
        'Clear browser cache',
      ],
      [ErrorType.COMMAND_INVALID_ARGS]: [
        'Use "help <command>" to see usage',
        'Check command parameter format',
        'Refer to command examples',
      ],
    }
    
    return suggestionsMap[type] || [
      'If it\'s a network issue, please check your connection',
      'If the problem persists, please refresh the page',
      'Use "help" command to get help',
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