export const ErrorType = {
  // Terminal lifecycle errors
  TERMINAL_INIT_FAILED: 'TERMINAL_INIT_FAILED',
  TERMINAL_DISPOSE_FAILED: 'TERMINAL_DISPOSE_FAILED',
  TERMINAL_NOT_AVAILABLE: 'TERMINAL_NOT_AVAILABLE',
  TERMINAL_WRITE_FAILED: 'TERMINAL_WRITE_FAILED',

  // Command parsing and execution errors
  COMMAND_NOT_FOUND: 'COMMAND_NOT_FOUND',
  COMMAND_EXECUTION_FAILED: 'COMMAND_EXECUTION_FAILED',
  COMMAND_INVALID_ARGS: 'COMMAND_INVALID_ARGS',
  COMMAND_PARSING_FAILED: 'COMMAND_PARSING_FAILED',

  // Data retrieval and validation errors
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  DATA_INVALID: 'DATA_INVALID',

  // Network connectivity errors
  NETWORK_ERROR: 'NETWORK_ERROR',

  // Command history navigation errors
  HISTORY_UPDATE_FAILED: 'HISTORY_UPDATE_FAILED',
  HISTORY_NAVIGATION_FAILED: 'HISTORY_NAVIGATION_FAILED',
  HISTORY_RESET_FAILED: 'HISTORY_RESET_FAILED',

  // Callback execution errors
  CALLBACK_EXECUTION_FAILED: 'CALLBACK_EXECUTION_FAILED',

  // User input validation errors
  INVALID_INPUT: 'INVALID_INPUT',

  // Application-level global errors
  GLOBAL_ERROR: 'GLOBAL_ERROR',
  UNHANDLED_PROMISE_REJECTION: 'UNHANDLED_PROMISE_REJECTION',
  VUE_ERROR: 'VUE_ERROR',

  // Catch-all system errors
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType]

export const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const

export type ErrorSeverity = (typeof ErrorSeverity)[keyof typeof ErrorSeverity]

export interface ErrorLog {
  timestamp: Date
  type: ErrorType
  severity: ErrorSeverity
  message: string
  details?: string
  stack?: string
  userId?: string
  sessionId?: string
}

export interface ErrorConfig {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  details?: string
  context?: string
  stack?: string
  showToast?: boolean
  logToConsole?: boolean
}

export class SCPError extends Error {
  public readonly type: ErrorType
  public readonly severity: ErrorSeverity
  public readonly details?: string
  public readonly context?: string
  public readonly timestamp: Date

  constructor(config: ErrorConfig) {
    super(config.message)
    this.name = 'SCPError'
    this.type = config.type
    this.severity = config.severity
    this.details = config.details
    this.context = config.context
    this.timestamp = new Date()

    // captureStackTrace points the stack at SCPError, not at this constructor
    if ('captureStackTrace' in Error && typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, SCPError)
    }
  }

  toJSON(): ErrorLog {
    return {
      timestamp: this.timestamp,
      type: this.type,
      severity: this.severity,
      message: this.message,
      details: this.details,
      stack: this.stack,
    }
  }
}

export function isSCPError(error: unknown): error is SCPError {
  return error instanceof SCPError
}
