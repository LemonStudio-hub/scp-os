import { vi } from 'vitest'

// Mock window.scpTerminalActions for gesture tests
Object.defineProperty(window, 'scpTerminalActions', {
  value: {
    clearScreen: vi.fn(),
    navigateHistory: vi.fn(),
    scrollToTop: vi.fn(),
    scrollToBottom: vi.fn(),
    autocomplete: vi.fn(),
    focus: vi.fn(),
  },
  writable: true,
 configurable: true,
})

// Mock scraper module
vi.mock('../utils/errorHandler', () => ({
  errorHandler: {
    handleError: vi.fn((error) => {
      console.error('[Mock ErrorHandler]', error)
      return error
    }),
    setTerminalWriter: vi.fn(),
    getErrorLog: vi.fn(() => []),
    clearErrorLog: vi.fn(),
    getErrorCount: vi.fn(() => 0),
  },
  ErrorType: {
    TERMINAL_INIT_FAILED: 'TERMINAL_INIT_FAILED',
    TERMINAL_DISPOSE_FAILED: 'TERMINAL_DISPOSE_FAILED',
    TERMINAL_NOT_AVAILABLE: 'TERMINAL_NOT_AVAILABLE',
    TERMINAL_WRITE_FAILED: 'TERMINAL_WRITE_FAILED',
    COMMAND_NOT_FOUND: 'COMMAND_NOT_FOUND',
    COMMAND_EXECUTION_FAILED: 'COMMAND_EXECUTION_FAILED',
    COMMAND_INVALID_ARGS: 'COMMAND_INVALID_ARGS',
    COMMAND_PARSING_FAILED: 'COMMAND_PARSING_FAILED',
    GESTURE_INIT_FAILED: 'GESTURE_INIT_FAILED',
    GESTURE_DESTROY_FAILED: 'GESTURE_DESTROY_FAILED',
    GESTURE_EVENT_FAILED: 'GESTURE_EVENT_FAILED',
    GESTURE_SETUP_FAILED: 'GESTURE_SETUP_FAILED',
    GESTURE_HANDLER_FAILED: 'GESTURE_HANDLER_FAILED',
    DATA_NOT_FOUND: 'DATA_NOT_FOUND',
    DATA_INVALID: 'DATA_INVALID',
    NETWORK_ERROR: 'NETWORK_ERROR',
    SYSTEM_ERROR: 'SYSTEM_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    HISTORY_UPDATE_FAILED: 'HISTORY_UPDATE_FAILED',
    HISTORY_NAVIGATION_FAILED: 'HISTORY_NAVIGATION_FAILED',
    HISTORY_RESET_FAILED: 'HISTORY_RESET_FAILED',
    CALLBACK_EXECUTION_FAILED: 'CALLBACK_EXECUTION_FAILED',
    INVALID_INPUT: 'INVALID_INPUT',
    GLOBAL_ERROR: 'GLOBAL_ERROR',
    UNHANDLED_PROMISE_REJECTION: 'UNHANDLED_PROMISE_REJECTION',
    VUE_ERROR: 'VUE_ERROR',
  },
  ErrorSeverity: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
}))

// Mock scraper module
vi.mock('../utils/scraper', () => ({
  scraper: {
    scrapeSCP: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'SCP-999',
        name: '测试SCP',
        objectClass: 'SAFE',
        containment: ['测试收容协议'],
        description: ['测试描述'],
        appendix: [],
        url: 'https://test.com'
      },
      cached: false
    }),
    searchSCP: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'SCP-999',
        name: '测试SCP',
        objectClass: 'SAFE',
        containment: ['测试收容协议'],
        description: ['测试描述'],
        appendix: [],
        url: 'https://test.com'
      },
      cached: false
    }),
    formatForTerminal: vi.fn().mockReturnValue([
      '═══════════════════════════════════════════════════════════════',
      '          SCP-999 - 测试SCP - 安全级',
      '═══════════════════════════════════════════════════════════════',
    ])
  }
}))

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

// Mock window properties for responsive tests
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1920,
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 1080,
})

Object.defineProperty(window, 'location', {
  writable: true,
  configurable: true,
  value: {
    hostname: 'localhost',
    href: 'http://localhost:5173',
    origin: 'http://localhost:5173',
    protocol: 'http:',
    host: 'localhost:5173',
    pathname: '/',
    search: '',
    hash: '',
  },
})

// Mock setInterval and clearInterval
let mockIntervalId = 0
const mockIntervals: Map<number, ReturnType<typeof setTimeout>> = new Map()
const originalSetInterval = globalThis.setInterval
const originalClearInterval = globalThis.clearInterval

globalThis.setInterval = vi.fn((callback: () => void, delay: number): number => {
  const id = ++mockIntervalId
  const intervalId = originalSetInterval(callback, delay) as unknown as ReturnType<typeof setTimeout>
  mockIntervals.set(id, intervalId)
  return id
}) as unknown as typeof setInterval

globalThis.clearInterval = vi.fn((id: number | ReturnType<typeof setTimeout>) => {
  const intervalId = typeof id === 'number' ? mockIntervals.get(id) : id
  if (intervalId) {
    originalClearInterval(intervalId)
    if (typeof id === 'number') {
      mockIntervals.delete(id)
    }
  }
}) as unknown as typeof clearInterval