import { describe, it, expect, vi, beforeEach } from 'vitest'

// Override the global mock from setup.ts for this test file only
vi.unmock('../logger')
vi.mock('../logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

// Import after mock setup
import { ErrorType, ErrorSeverity, SCPError } from '../../types/error'
import logger from '../logger'

// We need to import the real errorHandler, not the mocked one from setup.ts.
// The setup.ts mocks '../utils/errorHandler' but we import '../errorHandler' (relative).
// To be safe, we unmock it and re-import.
vi.unmock('../errorHandler')

// Re-import after unmocking
const { ErrorHandler, createError, withErrorHandling, withSyncErrorHandling } =
  await import('../errorHandler')

describe('ErrorHandler', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handler: any

  beforeEach(() => {
    vi.clearAllMocks()
    handler = ErrorHandler.getInstance()
    handler.clearErrorLogs()
  })

  describe('handleError / createError', () => {
    it('should return an SCPError instance', () => {
      const error = handler.handleError({
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'Connection failed',
      })

      expect(error).toBeInstanceOf(SCPError)
      expect(error.type).toBe(ErrorType.NETWORK_ERROR)
      expect(error.severity).toBe(ErrorSeverity.HIGH)
      expect(error.message).toBe('Connection failed')
    })

    it('should add error to logs', () => {
      handler.handleError({
        type: ErrorType.DATA_NOT_FOUND,
        severity: ErrorSeverity.LOW,
        message: 'Not found',
      })

      const logs = handler.getErrorLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].type).toBe(ErrorType.DATA_NOT_FOUND)
    })

    it('should log to console by default', () => {
      handler.handleError({
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'Connection failed',
      })

      expect(logger.error).toHaveBeenCalled()
    })

    it('should not log to console when logToConsole is false', () => {
      handler.handleError({
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'Connection failed',
        logToConsole: false,
      })

      expect(logger.error).not.toHaveBeenCalled()
    })

    it('convenience createError should work identically', () => {
      const error = createError({
        type: ErrorType.TERMINAL_INIT_FAILED,
        severity: ErrorSeverity.CRITICAL,
        message: 'Init failed',
      })

      expect(error).toBeInstanceOf(SCPError)
      expect(error.type).toBe(ErrorType.TERMINAL_INIT_FAILED)
    })
  })

  describe('wrapAsync / withErrorHandling', () => {
    it('should return result when async function succeeds', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      const result = await handler.wrapAsync(fn, {
        type: ErrorType.UNKNOWN_ERROR,
        severity: ErrorSeverity.LOW,
        message: '',
      })
      expect(result).toBe('success')
    })

    it('should catch and wrap errors from async functions', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('async failure'))

      await expect(
        handler.wrapAsync(fn, {
          type: ErrorType.NETWORK_ERROR,
          severity: ErrorSeverity.HIGH,
          message: 'Wrapped error',
        })
      ).rejects.toThrow(SCPError)
    })

    it('convenience withErrorHandling should work identically', async () => {
      const fn = vi.fn().mockResolvedValue(42)
      const result = await withErrorHandling(fn, {
        type: ErrorType.UNKNOWN_ERROR,
        severity: ErrorSeverity.LOW,
        message: '',
      })
      expect(result).toBe(42)
    })

    it('should add error to logs when async function fails', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'))

      try {
        await handler.wrapAsync(fn, {
          type: ErrorType.NETWORK_ERROR,
          severity: ErrorSeverity.MEDIUM,
          message: 'Test',
        })
      } catch {
        // expected
      }

      const logs = handler.getErrorLogs()
      expect(logs.length).toBeGreaterThan(0)
    })
  })

  describe('wrapSync / withSyncErrorHandling', () => {
    it('should return result when sync function succeeds', () => {
      const fn = vi.fn().mockReturnValue('ok')
      const result = handler.wrapSync(fn, {
        type: ErrorType.UNKNOWN_ERROR,
        severity: ErrorSeverity.LOW,
        message: '',
      })
      expect(result).toBe('ok')
    })

    it('should catch and wrap errors from sync functions', () => {
      const fn = vi.fn().mockImplementation(() => {
        throw new Error('sync failure')
      })

      expect(() =>
        handler.wrapSync(fn, {
          type: ErrorType.COMMAND_EXECUTION_FAILED,
          severity: ErrorSeverity.MEDIUM,
          message: 'Wrapped',
        })
      ).toThrow(SCPError)
    })

    it('convenience withSyncErrorHandling should work identically', () => {
      const fn = vi.fn().mockReturnValue(99)
      const result = withSyncErrorHandling(fn, {
        type: ErrorType.UNKNOWN_ERROR,
        severity: ErrorSeverity.LOW,
        message: '',
      })
      expect(result).toBe(99)
    })
  })

  describe('getErrorLogs', () => {
    it('should return a copy of error logs', () => {
      handler.handleError({
        type: ErrorType.DATA_NOT_FOUND,
        severity: ErrorSeverity.LOW,
        message: 'Test',
      })

      const logs = handler.getErrorLogs()
      expect(logs).toHaveLength(1)

      // Mutating the returned array should not affect the internal logs
      logs.pop()
      expect(handler.getErrorLogs()).toHaveLength(1)
    })
  })

  describe('clearErrorLogs', () => {
    it('should empty the error logs', () => {
      handler.handleError({
        type: ErrorType.DATA_NOT_FOUND,
        severity: ErrorSeverity.LOW,
        message: 'A',
      })
      handler.handleError({
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'B',
      })

      expect(handler.getErrorLogs()).toHaveLength(2)

      handler.clearErrorLogs()
      expect(handler.getErrorLogs()).toHaveLength(0)
    })
  })

  describe('getRecentErrors', () => {
    it('should return the last N errors', () => {
      for (let i = 0; i < 5; i++) {
        handler.handleError({
          type: ErrorType.UNKNOWN_ERROR,
          severity: ErrorSeverity.LOW,
          message: `Error ${i}`,
        })
      }

      const recent = handler.getRecentErrors(3)
      expect(recent).toHaveLength(3)
      expect(recent[0].message).toBe('Error 2')
      expect(recent[2].message).toBe('Error 4')
    })

    it('should return all errors when count exceeds total', () => {
      handler.handleError({
        type: ErrorType.DATA_NOT_FOUND,
        severity: ErrorSeverity.LOW,
        message: 'Only one',
      })

      const recent = handler.getRecentErrors(10)
      expect(recent).toHaveLength(1)
    })
  })

  describe('getErrorsByType', () => {
    it('should filter errors by type', () => {
      handler.handleError({
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'Net',
      })
      handler.handleError({
        type: ErrorType.DATA_NOT_FOUND,
        severity: ErrorSeverity.LOW,
        message: 'Data',
      })
      handler.handleError({
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: 'Net2',
      })

      const networkErrors = handler.getErrorsByType(ErrorType.NETWORK_ERROR)
      expect(networkErrors).toHaveLength(2)
      expect(networkErrors.every((e: any) => e.type === ErrorType.NETWORK_ERROR)).toBe(true)
    })
  })

  describe('getErrorsBySeverity', () => {
    it('should filter errors by severity', () => {
      handler.handleError({
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'High',
      })
      handler.handleError({
        type: ErrorType.DATA_NOT_FOUND,
        severity: ErrorSeverity.LOW,
        message: 'Low',
      })
      handler.handleError({
        type: ErrorType.UNKNOWN_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'High2',
      })

      const highErrors = handler.getErrorsBySeverity(ErrorSeverity.HIGH)
      expect(highErrors).toHaveLength(2)
      expect(highErrors.every((e: any) => e.severity === ErrorSeverity.HIGH)).toBe(true)
    })
  })
})
