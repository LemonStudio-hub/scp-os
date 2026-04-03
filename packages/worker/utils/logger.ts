/**
 * 结构化日志系统
 * 提供统一的日志格式和级别
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export class Logger {
  private static instance: Logger

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  /**
   * 调试日志
   */
  debug(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, meta)
  }

  /**
   * 信息日志
   */
  info(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, meta)
  }

  /**
   * 警告日志
   */
  warn(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, meta)
  }

  /**
   * 错误日志
   */
  error(message: string, error?: Error, meta?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, {
      ...meta,
      error: error?.message,
      stack: error?.stack,
    })
  }

  /**
   * 基础日志方法
   */
  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const logEntry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      ...meta,
    }

    const logString = JSON.stringify(logEntry)

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logString)
        break
      case LogLevel.INFO:
        console.log(logString)
        break
      case LogLevel.WARN:
        console.warn(logString)
        break
      case LogLevel.ERROR:
        console.error(logString)
        break
    }
  }

  /**
   * 记录操作开始
   */
  startOperation(operation: string, meta?: Record<string, any>): () => void {
    const startTime = Date.now()
    this.info(`Operation started: ${operation}`, meta)

    return () => {
      const duration = Date.now() - startTime
      this.info(`Operation completed: ${operation}`, { ...meta, duration })
    }
  }
}

// 导出单例
export const logger = Logger.getInstance()