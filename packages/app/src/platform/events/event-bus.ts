/**
 * Event Bus Implementation
 * Provides a centralized event system for the SCP-OS platform
 */

import type { EventHandler, EventSubscription } from './types'

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
   * Get the number of handlers for an event
   * @param event - Event name
   */
  listenerCount(event: string): number
}

/**
 * Default Event Bus Configuration
 */
const DEFAULT_CONFIG = {
  maxListeners: 10,
  async: false,
  warnOnMemoryLeak: true
}

/**
 * Event Bus Implementation
 */
export class EventBus implements IEventBus {
  private handlers = new Map<string, Set<EventHandler>>()
  private subscriptions = new Map<string, Set<EventSubscription>>()
  private config: typeof DEFAULT_CONFIG

  constructor(config?: Partial<typeof DEFAULT_CONFIG>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Register an event handler
   */
  on<T = any>(event: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)

    // Check for potential memory leak
    if (this.config.warnOnMemoryLeak) {
      const count = this.listenerCount(event)
      if (count > this.config.maxListeners) {
        console.warn(
          `[EventBus] Possible memory leak detected. ${count} listeners added for event "${event}". Use emitter.setMaxListeners() to increase limit.`
        )
      }
    }
  }

  /**
   * Unregister an event handler
   */
  off<T = any>(event: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.handlers.delete(event)
      }
    }
  }

  /**
   * Emit an event
   */
  emit<T = any>(event: string, data: T): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      for (const handler of handlers) {
        try {
          const result = handler(data)
          if (result instanceof Promise) {
            result.catch((err: unknown) => {
              console.error(
                `[EventBus] Error in async handler for event "${event}":`,
                err
              )
            })
          }
        } catch (error) {
          console.error(
            `[EventBus] Error in handler for event "${event}":`,
            error
          )
        }
      }
    }
  }

  /**
   * Register a one-time event handler
   */
  once<T = any>(event: string, handler: EventHandler<T>): void {
    const wrappedHandler = (data: T) => {
      this.off(event, wrappedHandler)
      handler(data)
    }
    this.on(event, wrappedHandler)
  }

  /**
   * Remove all handlers for an event
   */
  removeAllListeners(event: string): void {
    this.handlers.delete(event)
    this.subscriptions.delete(event)
  }

  /**
   * Get the number of handlers for an event
   */
  listenerCount(event: string): number {
    return this.handlers.get(event)?.size ?? 0
  }

  /**
   * Get all event names with handlers
   */
  eventNames(): string[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear()
    this.subscriptions.clear()
  }

  /**
   * Set maximum listeners warning threshold
   */
  setMaxListeners(n: number): void {
    this.config.maxListeners = n
  }
}

/**
 * Global event bus instance
 */
let globalEventBus: EventBus | null = null

/**
 * Get or create the global event bus
 * @param config - Event bus configuration (only used on first call)
 */
export function getGlobalEventBus(config?: Partial<typeof DEFAULT_CONFIG>): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus(config)
  }
  return globalEventBus
}

/**
 * Reset the global event bus
 */
export function resetGlobalEventBus(): void {
  globalEventBus = null
}

/**
 * Subscribe to an event with automatic cleanup
 */
export function subscribe<T = any>(
  eventBus: EventBus,
  event: string,
  handler: EventHandler<T>
): () => void {
  eventBus.on(event, handler)
  return () => {
    eventBus.off(event, handler)
  }
}