/**
 * Event Bus Implementation
 * Provides a centralized event system for the SCP-OS platform
 */

import type {
  EventHandler,
  EventConfig,
  EventSubscription,
  EventEmitterOptions
} from './types'

/**
 * Event Bus Interface
 */
export interface IEventBus {
  /**
   * Register an event handler
   * @param event - Event name
   * @param handler - Event handler function
   */
  on<T = any>(event: string, handler: EventHandler<T>): void

  /**
   * Unregister an event handler
   * @param event - Event name
   * @param handler - Event handler function
   */
  off<T = any>(event: string, handler: EventHandler<T>): void

  /**
   * Emit an event
   * @param event - Event name
   * @param data - Event data
   */
  emit<T = any>(event: string, data: T): void

  /**
   * Register a one-time event handler
   * @param event - Event name
   * @param handler - Event handler function
   */
  once<T = any>(event: string, handler: EventHandler<T>): void

  /**
   * Remove all handlers for an event
   * @param event - Event name
   */
  removeAllListeners(event: string): void

  /**
   * Get all event names with registered handlers
   */
  eventNames(): string[]

  /**
   * Get the number of handlers for an event
   * @param event - Event name
   */
  listenerCount(event: string): number
}

/**
 * Default Event Bus Implementation
 */
export class EventBus implements IEventBus {
  private handlers = new Map<string, Set<EventHandler>>()
  private subscriptions = new Set<EventSubscription>()
  private config: Required<EventEmitterOptions>
  private subscriptionIdCounter = 0

  constructor(options: EventEmitterOptions = {}) {
    this.config = {
      debug: options.debug ?? false,
      errorHandler:
        options.errorHandler ??
        ((error, event, data) => {
          console.error(`[EventBus] Error in event handler for ${event}:`, error)
        }),
      maxListeners: options.maxListeners ?? 100
    }
  }

  /**
   * Register an event handler
   */
  on<T = any>(event: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }

    const handlers = this.handlers.get(event)!

    // Check max listeners
    if (handlers.size >= this.config.maxListeners) {
      console.warn(
        `[EventBus] Possible memory leak detected. ${handlers.size} listeners added for event "${event}". Use emitter.setMaxListeners() to increase limit.`
      )
    }

    handlers.add(handler)

    // Create subscription
    const subscription: EventSubscription = {
      event,
      handler,
      once: false,
      id: `sub-${this.subscriptionIdCounter++}`
    }

    this.subscriptions.add(subscription)

    if (this.config.debug) {
      console.log(`[EventBus] Registered handler for event: ${event}`)
    }
  }

  /**
   * Unregister an event handler
   */
  off<T = any>(event: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(event)
    if (!handlers) {
      return
    }

    handlers.delete(handler)

    // Remove subscription
    this.subscriptions.forEach(sub => {
      if (sub.event === event && sub.handler === handler) {
        this.subscriptions.delete(sub)
      }
    })

    if (handlers.size === 0) {
      this.handlers.delete(event)
    }

    if (this.config.debug) {
      console.log(`[EventBus] Unregistered handler for event: ${event}`)
    }
  }

  /**
   * Emit an event
   */
  emit<T = any>(event: string, data: T): void {
    const handlers = this.handlers.get(event)
    if (!handlers || handlers.size === 0) {
      if (this.config.debug) {
        console.log(`[EventBus] No handlers for event: ${event}`)
      }
      return
    }

    if (this.config.debug) {
      console.log(`[EventBus] Emitting event: ${event}`, data)
    }

    // Create a copy of handlers to avoid issues with concurrent modifications
    const handlersToExecute = Array.from(handlers)

    for (const handler of handlersToExecute) {
      this.executeHandler(event, handler, data)
    }
  }

  /**
   * Register a one-time event handler
   */
  once<T = any>(event: string, handler: EventHandler<T>): void {
    const wrappedHandler: EventHandler<T> = (data) => {
      this.off(event, wrappedHandler)
      handler(data)
    }

    // Store reference to original handler for removal
    ;(wrappedHandler as any)._originalHandler = handler

    this.on(event, wrappedHandler)

    // Update subscription to mark as once
    this.subscriptions.forEach(sub => {
      if (sub.event === event && sub.handler === wrappedHandler) {
        sub.once = true
      }
    })

    if (this.config.debug) {
      console.log(`[EventBus] Registered one-time handler for event: ${event}`)
    }
  }

  /**
   * Remove all handlers for an event
   */
  removeAllListeners(event: string): void {
    this.handlers.delete(event)

    // Remove all subscriptions for this event
    this.subscriptions.forEach(sub => {
      if (sub.event === event) {
        this.subscriptions.delete(sub)
      }
    })

    if (this.config.debug) {
      console.log(`[EventBus] Removed all listeners for event: ${event}`)
    }
  }

  /**
   * Get all event names with registered handlers
   */
  eventNames(): string[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Get the number of handlers for an event
   */
  listenerCount(event: string): number {
    return this.handlers.get(event)?.size ?? 0
  }

  /**
   * Clear all handlers and subscriptions
   */
  clear(): void {
    this.handlers.clear()
    this.subscriptions.clear()
    this.subscriptionIdCounter = 0

    if (this.config.debug) {
      console.log('[EventBus] Cleared all handlers and subscriptions')
    }
  }

  /**
   * Set maximum listeners per event
   * @param n - Maximum number of listeners
   */
  setMaxListeners(n: number): void {
    this.config.maxListeners = n
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<EventEmitterOptions> {
    return { ...this.config }
  }

  /**
   * Get all subscriptions
   */
  getSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions)
  }

  /**
   * Execute a single event handler
   * @private
   */
  private async executeHandler<T = any>(
    event: string,
    handler: EventHandler<T>,
    data: T
  ): Promise<void> {
    try {
      const result = handler(data)

      // If handler returns a promise, await it
      if (result instanceof Promise) {
        await result
      }
    } catch (error) {
      this.config.errorHandler(error as Error, event, data)
    }
  }
}

/**
 * Global event bus instance
 */
let globalEventBus: EventBus | null = null

/**
 * Get or create the global event bus instance
 * @param options - Event bus options (only used on first call)
 * @returns Global event bus instance
 */
export function getGlobalEventBus(options?: EventEmitterOptions): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus(options)
  }
  return globalEventBus
}

/**
 * Reset the global event bus instance
 */
export function resetGlobalEventBus(): void {
  if (globalEventBus) {
    globalEventBus.clear()
  }
  globalEventBus = null
}

/**
 * Register an event handler in the global event bus
 * @param event - Event name
 * @param handler - Event handler function
 */
export function onGlobal<T = any>(event: string, handler: EventHandler<T>): void {
  getGlobalEventBus().on(event, handler)
}

/**
 * Unregister an event handler from the global event bus
 * @param event - Event name
 * @param handler - Event handler function
 */
export function offGlobal<T = any>(event: string, handler: EventHandler<T>): void {
  getGlobalEventBus().off(event, handler)
}

/**
 * Emit an event in the global event bus
 * @param event - Event name
 * @param data - Event data
 */
export function emitGlobal<T = any>(event: string, data: T): void {
  getGlobalEventBus().emit(event, data)
}

/**
 * Register a one-time event handler in the global event bus
 * @param event - Event name
 * @param handler - Event handler function
 */
export function onceGlobal<T = any>(event: string, handler: EventHandler<T>): void {
  getGlobalEventBus().once(event, handler)
}

// Re-export types for convenience
export type { EventHandler, EventConfig, EventSubscription, EventEmitterOptions }