import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to test both dev and prod modes, so we use dynamic import with vi.mock
// to control import.meta.env.DEV

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Since the logger module is already loaded (it's imported by other modules via setup.ts),
  // we test the singleton instance behavior. The import.meta.env.DEV value is determined
  // at module load time. In vitest with jsdom, import.meta.env.DEV is typically falsy
  // unless running in dev mode.

  describe('warn', () => {
    it('should always call console.warn', async () => {
      const { default: logger } = await import('../logger')
      logger.warn('test warning', 'extra')

      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] test warning', 'extra')
    })
  })

  describe('error', () => {
    it('should always call console.error', async () => {
      const { default: logger } = await import('../logger')
      logger.error('test error', 'details')

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] test error', 'details')
    })
  })

  describe('debug', () => {
    it('should only call console.log in dev mode', async () => {
      const { default: logger } = await import('../logger')
      consoleLogSpy.mockClear()

      logger.debug('debug message')

      // In vitest, import.meta.env.DEV is typically false unless explicitly set
      // If DEV is false, console.log should NOT be called
      // If DEV is true, it should be called
      if (import.meta.env?.DEV) {
        expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] debug message')
      } else {
        expect(consoleLogSpy).not.toHaveBeenCalled()
      }
    })
  })

  describe('info', () => {
    it('should only call console.log in dev mode', async () => {
      const { default: logger } = await import('../logger')
      consoleLogSpy.mockClear()

      logger.info('info message')

      if (import.meta.env?.DEV) {
        expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] info message')
      } else {
        expect(consoleLogSpy).not.toHaveBeenCalled()
      }
    })
  })

  describe('multiple arguments', () => {
    it('warn should pass multiple arguments to console.warn', async () => {
      const { default: logger } = await import('../logger')
      logger.warn('msg', 'arg1', 'arg2', 123)

      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] msg', 'arg1', 'arg2', 123)
    })

    it('error should pass multiple arguments to console.error', async () => {
      const { default: logger } = await import('../logger')
      logger.error('err', { detail: 'info' })

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] err', { detail: 'info' })
    })
  })
})
