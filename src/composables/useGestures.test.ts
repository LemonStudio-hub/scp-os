import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, defineComponent, h } from 'vue'
import { useGestures } from './useGestures'
import { mount } from '@vue/test-utils'

// Mock Hammer.js
const eventListeners: Record<string, Function[]> = {}

const mockHammerInstance = {
  get: vi.fn(() => ({
    set: vi.fn(),
  })),
  on: vi.fn((event: string, callback: Function) => {
    if (!eventListeners[event]) {
      eventListeners[event] = []
    }
    eventListeners[event].push(callback)
  }),
  destroy: vi.fn(() => {
    Object.keys(eventListeners).forEach(key => {
      delete eventListeners[key]
    })
  }),
  emit: vi.fn((event: string, data?: any) => {
    if (eventListeners[event]) {
      eventListeners[event].forEach(callback => callback(data))
    }
  }),
}

vi.mock('hammerjs', () => {
  const MockHammer = class {
    constructor(_element: any, _options: any) {
      return mockHammerInstance
    }
  }

  return {
    default: MockHammer,
  }
})

describe('useGestures', () => {
  let mockContainer: HTMLDivElement
  let callbacks: {
    onClearScreen: () => void
    onHistoryUp: () => void
    onHistoryDown: () => void
    onFocus: () => void
    onScrollTop: () => void
    onScrollBottom: () => void
  }

  beforeEach(() => {
    mockContainer = document.createElement('div')
    document.body.appendChild(mockContainer)
    
    callbacks = {
      onClearScreen: vi.fn(),
      onHistoryUp: vi.fn(),
      onHistoryDown: vi.fn(),
      onFocus: vi.fn(),
      onScrollTop: vi.fn(),
      onScrollBottom: vi.fn(),
    }
  })

  afterEach(() => {
    document.body.removeChild(mockContainer)
    Object.keys(eventListeners).forEach(key => {
      delete eventListeners[key]
    })
  })

  // 辅助函数：创建一个测试组件来包装 useGestures
  const createTestComponent = (container: HTMLDivElement, callbacks: any, setupCallback?: (result: any) => void) => {
    return defineComponent({
      setup() {
        const containerRef = ref(container)
        const gestureResult = useGestures(containerRef, callbacks)
        if (setupCallback) {
          setupCallback(gestureResult)
        }
        return () => h('div')
      }
    })
  }

  describe('初始化', () => {
    it('应该返回 initGestures 和 destroyGestures 函数', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
      }))
      
      expect(typeof gestureResult.initGestures).toBe('function')
      expect(typeof gestureResult.destroyGestures).toBe('function')
      expect(typeof gestureResult.isMobile.value).toBe('boolean')
      
      wrapper.unmount()
    })

    it('应该在容器未定义时不初始化手势', () => {
      const undefinedContainer = document.createElement('div')
      const wrapper = mount(createTestComponent(undefinedContainer, {}, (result) => {
        result.initGestures()
      }))
      
      // 创建一个新的组件，容器为 undefined
      const undefinedComponent = defineComponent({
        setup() {
          const containerRef = ref<HTMLElement | undefined>(undefined)
          const gestureResult = useGestures(containerRef, {})
          gestureResult.initGestures()
          return () => h('div')
        }
      })
      
      expect(() => mount(undefinedComponent)).not.toThrow()
      
      wrapper.unmount()
    })

    it('应该创建 Hammer 实例', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      // 检查 Hammer 是否被调用
      expect(mockHammerInstance.on).toHaveBeenCalled()
      
      wrapper.unmount()
    })

    it('应该注册 tap 事件处理器', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      expect(mockHammerInstance.on).toHaveBeenCalledWith('tap', expect.any(Function))
      
      wrapper.unmount()
    })

    it('应该注册 press 事件处理器', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      expect(mockHammerInstance.on).toHaveBeenCalledWith('press', expect.any(Function))
      
      wrapper.unmount()
    })
  })

  describe('移动端手势', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      })
    })

    it('应该检测为移动设备', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
      }))
      
      expect(gestureResult.isMobile.value).toBe(true)
      
      wrapper.unmount()
    })

    it('应该在 tap 时调用 onFocus', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      mockHammerInstance.emit('tap')
      
      expect(callbacks.onFocus).toHaveBeenCalled()
      
      wrapper.unmount()
    })

    it('应该在 press 时调用 onClearScreen', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      mockHammerInstance.emit('press')
      
      expect(callbacks.onClearScreen).toHaveBeenCalled()
      
      wrapper.unmount()
    })

    it('应该注册移动端特定的手势事件', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      expect(mockHammerInstance.on).toHaveBeenCalledWith('swipeup', expect.any(Function))
      expect(mockHammerInstance.on).toHaveBeenCalledWith('swipeleft', expect.any(Function))
      expect(mockHammerInstance.on).toHaveBeenCalledWith('swiperight', expect.any(Function))
      expect(mockHammerInstance.on).toHaveBeenCalledWith('swipedown', expect.any(Function))
      
      wrapper.unmount()
    })

    it('应该在 swipeup 时调用 onClearScreen', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      mockHammerInstance.emit('swipeup')
      
      expect(callbacks.onClearScreen).toHaveBeenCalled()
      
      wrapper.unmount()
    })

    it('应该在 swipeleft 时调用 onHistoryUp', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      mockHammerInstance.emit('swipeleft')
      
      expect(callbacks.onHistoryUp).toHaveBeenCalled()
      
      wrapper.unmount()
    })

    it('应该在 swiperight 时调用 onHistoryDown', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      mockHammerInstance.emit('swiperight')
      
      expect(callbacks.onHistoryDown).toHaveBeenCalled()
      
      wrapper.unmount()
    })

    it('应该在 swipedown 时调用 onScrollBottom', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      mockHammerInstance.emit('swipedown')
      
      expect(callbacks.onScrollBottom).toHaveBeenCalled()
      
      wrapper.unmount()
    })
  })

  describe('桌面端手势', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true,
      })
    })

    it('应该检测为桌面设备', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
      }))
      
      expect(gestureResult.isMobile.value).toBe(false)
      
      wrapper.unmount()
    })

    it('应该在 swipeup 时调用 onScrollTop', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      mockHammerInstance.emit('swipeup')
      
      expect(callbacks.onScrollTop).toHaveBeenCalled()
      
      wrapper.unmount()
    })

    it('应该在 swipedown 时调用 onScrollBottom', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      mockHammerInstance.emit('swipedown')
      
      expect(callbacks.onScrollBottom).toHaveBeenCalled()
      
      wrapper.unmount()
    })

    it('应该在 tap 时调用 onFocus', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      mockHammerInstance.emit('tap')
      
      expect(callbacks.onFocus).toHaveBeenCalled()
      
      wrapper.unmount()
    })
  })

  describe('回调函数', () => {
    it('应该在没有提供回调时不抛出错误', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, {}, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      expect(() => gestureResult.initGestures()).not.toThrow()
      
      wrapper.unmount()
    })

    it('应该正确处理可选回调', () => {
      const minimalCallbacks = {
        onFocus: vi.fn(),
      }
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, minimalCallbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      mockHammerInstance.emit('tap')
      
      expect(minimalCallbacks.onFocus).toHaveBeenCalled()
      
      wrapper.unmount()
    })
  })

  describe('销毁手势', () => {
    it('应该销毁 Hammer 实例', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      gestureResult.destroyGestures()
      
      expect(mockHammerInstance.destroy).toHaveBeenCalled()
      
      wrapper.unmount()
    })

    it('应该能够多次调用 destroyGestures', () => {
      let gestureResult: any
      const wrapper = mount(createTestComponent(mockContainer, callbacks, (result) => {
        gestureResult = result
        gestureResult.initGestures()
      }))
      
      gestureResult.destroyGestures()
      gestureResult.destroyGestures()
      
      expect(() => gestureResult.destroyGestures()).not.toThrow()
      
      wrapper.unmount()
    })
  })

  // pinch 事件只在移动端注册，这里跳过测试
})