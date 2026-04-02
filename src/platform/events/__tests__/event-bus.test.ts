/**
 * Unit tests for EventBus
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  EventBus,
  getGlobalEventBus,
  resetGlobalEventBus,
  subscribe
} from '../event-bus'

describe('EventBus', () => {
  let eventBus: EventBus

  beforeEach(() => {
    eventBus = new EventBus()
    resetGlobalEventBus()
  })

  describe('Event Registration', () => {
    it('should register an event handler', () => {
      const handler = vi.fn()
      eventBus.on('test-event', handler)

      eventBus.emit('test-event', 'data')

      expect(handler).toHaveBeenCalledWith('data')
    })

    it('should register multiple handlers for the same event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on('test-event', handler1)
      eventBus.on('test-event', handler2)

      eventBus.emit('test-event', 'data')

      expect(handler1).toHaveBeenCalledWith('data')
      expect(handler2).toHaveBeenCalledWith('data')
    })

    it('should unregister an event handler', () => {
      const handler = vi.fn()
      eventBus.on('test-event', handler)
      eventBus.off('test-event', handler)

      eventBus.emit('test-event', 'data')

      expect(handler).not.toHaveBeenCalled()
    })

    it('should remove all handlers for an event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on('test-event', handler1)
      eventBus.on('test-event', handler2)

      eventBus.removeAllListeners('test-event')

      expect(eventBus.listenerCount('test-event')).toBe(0)
    })
  })

  describe('Event Emission', () => {
    it('should emit event with data', () => {
      const handler = vi.fn()
      eventBus.on('test-event', handler)

      eventBus.emit('test-event', { value: 42 })

      expect(handler).toHaveBeenCalledWith({ value: 42 })
    })

    it('should handle async handlers', async () => {
      const handler = vi.fn().mockResolvedValue(undefined)
      eventBus.on('test-event', handler)

      await eventBus.emit('test-event', 'data')

      expect(handler).toHaveBeenCalledWith('data')
    })

    it('should handle errors in handlers', () => {
      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error('Handler error')
      })
      eventBus.on('test-event', errorHandler)

      // Should not throw, but log error
      expect(() => eventBus.emit('test-event', 'data')).not.toThrow()
    })

    it('should handle errors in async handlers', async () => {
      const asyncErrorHandler = vi.fn().mockRejectedValue(new Error('Async error'))
      eventBus.on('test-event', asyncErrorHandler)

      // Should not throw, but log error
      expect(() => eventBus.emit('test-event', 'data')).not.toThrow()
      // Wait for async handlers to complete
      await new Promise(resolve => setTimeout(resolve, 10))
    })
  })

  describe('One-time Handlers', () => {
    it('should call handler only once', () => {
      const handler = vi.fn()
      eventBus.once('test-event', handler)

      eventBus.emit('test-event', 'data1')
      eventBus.emit('test-event', 'data2')

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith('data1')
    })

    it('should unregister after first call', () => {
      const handler = vi.fn()
      eventBus.once('test-event', handler)

      eventBus.emit('test-event', 'data')

      expect(eventBus.listenerCount('test-event')).toBe(0)
    })
  })

  describe('Event Query', () => {
    it('should return correct listener count', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      eventBus.on('event1', handler1)
      eventBus.on('event1', handler2)
      eventBus.on('event2', handler3)

      expect(eventBus.listenerCount('event1')).toBe(2)
      expect(eventBus.listenerCount('event2')).toBe(1)
      expect(eventBus.listenerCount('event3')).toBe(0)
    })

    it('should return all event names', () => {
      eventBus.on('event1', vi.fn())
      eventBus.on('event2', vi.fn())

      const eventNames = eventBus.eventNames()

      expect(eventNames).toHaveLength(2)
      expect(eventNames).toContain('event1')
      expect(eventNames).toContain('event2')
    })
  })

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = eventBus['config']

      expect(config.maxListeners).toBe(10)
      expect(config.async).toBe(false)
      expect(config.warnOnMemoryLeak).toBe(true)
    })

    it('should use custom configuration', () => {
      const customBus = new EventBus({
        maxListeners: 20,
        async: true,
        warnOnMemoryLeak: false
      })

      const config = customBus['config']

      expect(config.maxListeners).toBe(20)
      expect(config.async).toBe(true)
      expect(config.warnOnMemoryLeak).toBe(false)
    })

    it('should set max listeners', () => {
      eventBus.setMaxListeners(20)

      expect(eventBus['config'].maxListeners).toBe(20)
    })

    it('should warn when exceeding max listeners', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      for (let i = 0; i < 12; i++) {
        eventBus.on('test-event', vi.fn())
      }

      expect(consoleWarnSpy).toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })
  })

  describe('Clear', () => {
    it('should clear all handlers', () => {
      eventBus.on('event1', vi.fn())
      eventBus.on('event2', vi.fn())

      eventBus.clear()

      expect(eventBus.listenerCount('event1')).toBe(0)
      expect(eventBus.listenerCount('event2')).toBe(0)
    })
  })

  describe('Global Event Bus', () => {
    it('should return same global instance', () => {
      const instance1 = getGlobalEventBus()
      const instance2 = getGlobalEventBus()

      expect(instance1).toBe(instance2)
    })

    it('should reset global instance', () => {
      const instance1 = getGlobalEventBus()
      resetGlobalEventBus()
      const instance2 = getGlobalEventBus()

      expect(instance1).not.toBe(instance2)
    })
  })

  describe('Subscribe Helper', () => {
    it('should subscribe and unsubscribe', () => {
      const handler = vi.fn()
      const unsubscribe = subscribe(eventBus, 'test-event', handler)

      eventBus.emit('test-event', 'data1')
      expect(handler).toHaveBeenCalledWith('data1')

      unsubscribe()
      eventBus.emit('test-event', 'data2')
      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle mixed handler types', () => {
      const syncHandler = vi.fn()
      const asyncHandler = vi.fn().mockResolvedValue(undefined)
      const errorSyncHandler = vi.fn().mockImplementation(() => {
        throw new Error('Sync error')
      })

      eventBus.on('test-event', syncHandler)
      eventBus.on('test-event', asyncHandler)
      eventBus.on('test-event', errorSyncHandler)

      expect(() => eventBus.emit('test-event', 'data')).not.toThrow()

      expect(syncHandler).toHaveBeenCalled()
      expect(asyncHandler).toHaveBeenCalled()
      expect(errorSyncHandler).toHaveBeenCalled()
    })

    it('should preserve handler order', () => {
      const order: number[] = []
      const handler1 = vi.fn(() => { order.push(1) })
      const handler2 = vi.fn(() => { order.push(2) })
      const handler3 = vi.fn(() => { order.push(3) })

      eventBus.on('test-event', handler1)
      eventBus.on('test-event', handler2)
      eventBus.on('test-event', handler3)

      eventBus.emit('test-event', 'data')

      expect(order).toEqual([1, 2, 3])
    })

    it('should handle event emission while handling', () => {
      const handler1 = vi.fn((data: string) => {
        if (data === 'trigger') {
          eventBus.emit('test-event', 'nested')
        }
      })
      const handler2 = vi.fn()

      eventBus.on('test-event', handler1)
      eventBus.on('test-event', handler2)

      eventBus.emit('test-event', 'trigger')

      expect(handler1).toHaveBeenCalledTimes(2)
      expect(handler2).toHaveBeenCalledTimes(2)
    })
  })
})