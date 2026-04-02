/**
 * Unit tests for EventBus
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  EventBus,
  getGlobalEventBus,
  resetGlobalEventBus,
  onGlobal,
  offGlobal,
  emitGlobal,
  onceGlobal
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

      expect(eventBus.listenerCount('test-event')).toBe(1)
    })

    it('should register multiple handlers for the same event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      eventBus.on('test-event', handler1)
      eventBus.on('test-event', handler2)
      eventBus.on('test-event', handler3)

      expect(eventBus.listenerCount('test-event')).toBe(3)
    })

    it('should unregister an event handler', () => {
      const handler = vi.fn()
      eventBus.on('test-event', handler)
      eventBus.off('test-event', handler)

      expect(eventBus.listenerCount('test-event')).toBe(0)
    })

    it('should not unregister wrong handler', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on('test-event', handler1)
      eventBus.off('test-event', handler2)

      expect(eventBus.listenerCount('test-event')).toBe(1)
    })

    it('should remove all listeners for an event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on('test-event', handler1)
      eventBus.on('test-event', handler2)
      eventBus.removeAllListeners('test-event')

      expect(eventBus.listenerCount('test-event')).toBe(0)
    })
  })

  describe('Event Emission', () => {
    it('should emit event to registered handlers', () => {
      const handler = vi.fn()
      eventBus.on('test-event', handler)

      eventBus.emit('test-event', { value: 42 })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ value: 42 })
    })

    it('should emit event to all registered handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      eventBus.on('test-event', handler1)
      eventBus.on('test-event', handler2)
      eventBus.on('test-event', handler3)

      eventBus.emit('test-event', { value: 42 })

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(handler3).toHaveBeenCalledTimes(1)
    })

    it('should not emit to unregistered handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on('test-event', handler1)
      eventBus.off('test-event', handler1)
      eventBus.on('test-event', handler2)

      eventBus.emit('test-event', { value: 42 })

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('should handle events with no handlers', () => {
      expect(() => eventBus.emit('non-existent-event', {})).not.toThrow()
    })
  })

  describe('One-time Handlers', () => {
    it('should execute handler once and then remove it', () => {
      const handler = vi.fn()
      eventBus.once('test-event', handler)

      eventBus.emit('test-event', {})
      eventBus.emit('test-event', {})

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should execute handler once with correct data', () => {
      const handler = vi.fn()
      eventBus.once('test-event', handler)

      eventBus.emit('test-event', { value: 42 })

      expect(handler).toHaveBeenCalledWith({ value: 42 })
    })

    it('should allow multiple once handlers for the same event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.once('test-event', handler1)
      eventBus.once('test-event', handler2)

      eventBus.emit('test-event', {})

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })
  })

  describe('Async Handlers', () => {
    it('should handle async handlers', async () => {
      const handler = vi.fn(async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return data.value * 2
      })

      eventBus.on('test-event', handler)

      eventBus.emit('test-event', { value: 21 })

      // Wait for async handlers to complete
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle async once handlers', async () => {
      const handler = vi.fn(async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return data.value * 2
      })

      eventBus.once('test-event', handler)

      eventBus.emit('test-event', { value: 21 })
      eventBus.emit('test-event', { value: 21 })

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle errors in handlers', () => {
      const errorHandler = vi.fn()
      const eventBusWithError = new EventBus({
        errorHandler
      })

      const handler = vi.fn(() => {
        throw new Error('Handler error')
      })

      eventBusWithError.on('test-event', handler)
      eventBusWithError.emit('test-event', {})

      expect(errorHandler).toHaveBeenCalled()
      expect(errorHandler).toHaveBeenCalledWith(
        expect.any(Error),
        'test-event',
        {}
      )
    })

    it('should continue executing handlers after error', () => {
      const errorHandler = vi.fn()
      const eventBusWithError = new EventBus({
        errorHandler
      })

      const handler1 = vi.fn(() => {
        throw new Error('Handler error')
      })
      const handler2 = vi.fn()

      eventBusWithError.on('test-event', handler1)
      eventBusWithError.on('test-event', handler2)

      eventBusWithError.emit('test-event', {})

      expect(errorHandler).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })
  })

  describe('Utility Methods', () => {
    it('should return all event names', () => {
      eventBus.on('event1', vi.fn())
      eventBus.on('event2', vi.fn())
      eventBus.on('event3', vi.fn())

      const names = eventBus.eventNames()

      expect(names).toHaveLength(3)
      expect(names).toContain('event1')
      expect(names).toContain('event2')
      expect(names).toContain('event3')
    })

    it('should return listener count for an event', () => {
      eventBus.on('test-event', vi.fn())
      eventBus.on('test-event', vi.fn())
      eventBus.on('test-event', vi.fn())

      expect(eventBus.listenerCount('test-event')).toBe(3)
    })

    it('should return 0 for non-existent event', () => {
      expect(eventBus.listenerCount('non-existent')).toBe(0)
    })

    it('should clear all handlers', () => {
      eventBus.on('event1', vi.fn())
      eventBus.on('event2', vi.fn())
      eventBus.on('event3', vi.fn())

      eventBus.clear()

      expect(eventBus.eventNames()).toHaveLength(0)
    })

    it('should set max listeners', () => {
      const eventBusWithLimit = new EventBus({ maxListeners: 5 })
      eventBusWithLimit.setMaxListeners(10)

      const config = eventBusWithLimit.getConfig()
      expect(config.maxListeners).toBe(10)
    })
  })

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = eventBus.getConfig()

      expect(config.debug).toBe(false)
      expect(config.maxListeners).toBe(100)
    })

    it('should use custom configuration', () => {
      const customEventBus = new EventBus({
        debug: true,
        maxListeners: 50
      })

      const config = customEventBus.getConfig()

      expect(config.debug).toBe(true)
      expect(config.maxListeners).toBe(50)
    })

    it('should warn when exceeding max listeners', () => {
      const customEventBus = new EventBus({ maxListeners: 5 })
      const warnSpy = vi.spyOn(console, 'warn')

      // Add 6 listeners (exceeds max of 5)
      for (let i = 0; i < 6; i++) {
        customEventBus.on('test-event', vi.fn())
      }

      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('Global Event Bus', () => {
    it('should return same global instance', () => {
      const instance1 = getGlobalEventBus()
      const instance2 = getGlobalEventBus()

      expect(instance1).toBe(instance2)
    })

    it('should reset global event bus', () => {
      const instance1 = getGlobalEventBus()
      resetGlobalEventBus()
      const instance2 = getGlobalEventBus()

      expect(instance1).not.toBe(instance2)
    })

    it('should register and emit in global event bus', () => {
      const handler = vi.fn()

      onGlobal('test-event', handler)
      emitGlobal('test-event', { value: 42 })

      expect(handler).toHaveBeenCalledWith({ value: 42 })
    })

    it('should unregister from global event bus', () => {
      const handler = vi.fn()

      onGlobal('test-event', handler)
      offGlobal('test-event', handler)
      emitGlobal('test-event', {})

      expect(handler).not.toHaveBeenCalled()
    })

    it('should register once in global event bus', () => {
      const handler = vi.fn()

      onceGlobal('test-event', handler)
      emitGlobal('test-event', {})
      emitGlobal('test-event', {})

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle event chaining', () => {
      const results: number[] = []

      eventBus.on('step1', () => {
        results.push(1)
        eventBus.emit('step2', {})
      })

      eventBus.on('step2', () => {
        results.push(2)
        eventBus.emit('step3', {})
      })

      eventBus.on('step3', () => {
        results.push(3)
      })

      eventBus.emit('step1', {})

      expect(results).toEqual([1, 2, 3])
    })

    it('should handle concurrent event emissions', () => {
      const handler = vi.fn()
      eventBus.on('test-event', handler)

      eventBus.emit('test-event', { id: 1 })
      eventBus.emit('test-event', { id: 2 })
      eventBus.emit('test-event', { id: 3 })

      expect(handler).toHaveBeenCalledTimes(3)
      expect(handler).toHaveBeenNthCalledWith(1, { id: 1 })
      expect(handler).toHaveBeenNthCalledWith(2, { id: 2 })
      expect(handler).toHaveBeenNthCalledWith(3, { id: 3 })
    })

    it('should maintain handler order', () => {
      const results: string[] = []

      eventBus.on('test-event', () => results.push('first'))
      eventBus.on('test-event', () => results.push('second'))
      eventBus.on('test-event', () => results.push('third'))

      eventBus.emit('test-event', {})

      expect(results).toEqual(['first', 'second', 'third'])
    })
  })
})