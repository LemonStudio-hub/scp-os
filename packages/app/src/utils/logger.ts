/**
 * Logger utility
 * Provides a consistent way to log messages with different severity levels
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface Logger {
  debug(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
}

class ConsoleLogger implements Logger {
  debug(message: string, ...args: unknown[]): void {
    // Debug logs are dev-only; console.log is intentional here to avoid ESLint no-console errors in production builds
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
