/**
 * Logger utility
 * Provides a consistent way to log messages with different severity levels
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface Logger {
  debug(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
}

class ConsoleLogger implements Logger {
  debug(message: string, ...args: unknown[]): void {
    // debug 信息只在开发环境输出，且使用 console.log 是合理的
    if (import.meta.env?.DEV) {
      /* eslint-disable-next-line no-console */
      console.log(`[DEBUG] ${message}`, ...args)
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (import.meta.env?.DEV) {
      /* eslint-disable-next-line no-console */
      console.log(`[INFO] ${message}`, ...args)
    }
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args)
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...args)
  }
}

// Create a singleton instance
const logger = new ConsoleLogger()

export default logger
