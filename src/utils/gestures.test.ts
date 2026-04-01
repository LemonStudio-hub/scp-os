import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupGestures, destroyGestures } from './gestures'

// Mock Hammer.js
let mockHammerInstances: any[] = []

vi.mock('hammerjs', () => {
  const createMockHammerInstance = () => {
    const eventListeners: Record<string, Function[]> = {}
    
    const instance = {
      get: vi.fn(() => ({
        set: vi.fn(),
      })),
      on: vi.fn((event: string, callback: Function) => {
        if (!eventListeners[event]) {
          eventListeners[event] = []
        }
        eventListeners[event].push(callback)
      }),
      emit: vi.fn((event: string, data?: any) => {
        if (eventListeners[event]) {
          eventListeners[event].forEach(callback => {
            try {
              callback(data)
            } catch (e) {
              // Ignore errors
            }
          })
        }
      }),
      destroy: vi.fn(),
      eventListeners,
    }
    
    mockHammerInstances.push(instance)
    return instance
  }

  const MockHammer = class {
    constructor(_element: any, _options: any) {
      return createMockHammerInstance()
    }
  }

  return {
    default: MockHammer,
  }
})

describe('gestures utils', () => {
  let mockContainer: HTMLElement

  beforeEach(() => {
    mockHammerInstances = []
    mockContainer = document.createElement('div')
    document.body.appendChild(mockContainer)
    
    // Mock scpTerminalActions
    Object.defineProperty(window, 'scpTerminalActions', {
      value: {
        clearScreen: vi.fn(),
        navigateHistory: vi.fn(),
        scrollToTop: vi.fn(),
        scrollToBottom: vi.fn(),
        focus: vi.fn(),
        autocomplete: vi.fn(),
      },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    document.body.removeChild(mockContainer)
    mockHammerInstances = []
  })

  describe('setupGestures', () => {
    it('应该创建 Hammer 实例', () => {
      const hammer = setupGestures(mockContainer)
      expect(mockHammerInstances.length).toBe(1)
      expect(hammer).toBeDefined()
      hammer.destroy()
    })

    it('应该注册 tap 事件处理器', () => {
      const hammer = setupGestures(mockContainer)
      expect(hammer.on).toHaveBeenCalledWith('tap', expect.any(Function))
      hammer.destroy()
    })

    it('应该注册 doubletap 事件处理器', () => {
      const hammer = setupGestures(mockContainer)
      expect(hammer.on).toHaveBeenCalledWith('doubletap', expect.any(Function))
      hammer.destroy()
    })

    it('应该在 tap 时调用 focus', () => {
      const hammer = setupGestures(mockContainer)
      hammer.emit('tap', {})
      expect(window.scpTerminalActions?.focus).toHaveBeenCalled()
      hammer.destroy()
    })

    it('应该在 doubletap 时调用 autocomplete', () => {
      const hammer = setupGestures(mockContainer)
      hammer.emit('doubletap', {})
      expect(window.scpTerminalActions?.autocomplete).toHaveBeenCalled()
      hammer.destroy()
    })

    it('应该正确配置识别器', () => {
      const hammer = setupGestures(mockContainer)
      expect(hammer.get).toHaveBeenCalled()
      hammer.destroy()
    })
  })

  describe('手势事件注册', () => {
    it('应该注册 swipeup 事件', () => {
      const hammer = setupGestures(mockContainer)
      expect(hammer.on).toHaveBeenCalledWith('swipeup', expect.any(Function))
      hammer.destroy()
    })

    it('应该注册 swipedown 事件', () => {
      const hammer = setupGestures(mockContainer)
      expect(hammer.on).toHaveBeenCalledWith('swipedown', expect.any(Function))
      hammer.destroy()
    })

    // swipeleft 和 swiperight 只在移动端注册，这里跳过测试
  })

  describe('当 scpTerminalActions 未定义时', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'scpTerminalActions', {
        value: undefined,
        writable: true,
        configurable: true,
      })
    })

    it('应该在 swipeup 时不抛出错误', () => {
      const hammer = setupGestures(mockContainer)
      expect(() => hammer.emit('swipeup', {})).not.toThrow()
      hammer.destroy()
    })

    it('应该在 swipeleft 时不抛出错误', () => {
      const hammer = setupGestures(mockContainer)
      expect(() => hammer.emit('swipeleft', {})).not.toThrow()
      hammer.destroy()
    })

    it('应该在 tap 时不抛出错误', () => {
      const hammer = setupGestures(mockContainer)
      expect(() => hammer.emit('tap', {})).not.toThrow()
      hammer.destroy()
    })
  })

  describe('destroyGestures', () => {
    it('应该销毁 Hammer 实例', () => {
      const hammer = setupGestures(mockContainer)
      destroyGestures(hammer)
      expect(hammer.destroy).toHaveBeenCalled()
    })

    it('应该处理 null 值', () => {
      expect(() => destroyGestures(null as any)).not.toThrow()
    })

    it('应该处理 undefined 值', () => {
      expect(() => destroyGestures(undefined as any)).not.toThrow()
    })

    it('应该能够多次调用', () => {
      const hammer = setupGestures(mockContainer)
      destroyGestures(hammer)
      expect(() => destroyGestures(hammer)).not.toThrow()
    })
  })
})