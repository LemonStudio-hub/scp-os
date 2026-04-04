/**
 * EventBus — Decoupled inter-module communication
 * Modules communicate through events rather than direct imports.
 */

type EventCallback = (...args: unknown[]) => void

interface Subscription {
  callback: EventCallback
  once: boolean
}

export class EventBus {
  private listeners: Map<string, Subscription[]> = new Map()

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  on(event: string, callback: EventCallback): () => void {
    const subs = this.listeners.get(event) || []
    subs.push({ callback, once: false })
    this.listeners.set(event, subs)

    return () => {
      const current = this.listeners.get(event) || []
      this.listeners.set(
        event,
        current.filter((s) => s.callback !== callback)
      )
    }
  }

  /**
   * Subscribe to an event once (auto-unsubscribe after first fire).
   */
  once(event: string, callback: EventCallback): () => void {
    const subs = this.listeners.get(event) || []
    subs.push({ callback, once: true })
    this.listeners.set(event, subs)

    return () => {
      const current = this.listeners.get(event) || []
      this.listeners.set(
        event,
        current.filter((s) => s.callback !== callback)
      )
    }
  }

  /**
   * Emit an event with arbitrary payload.
   */
  emit(event: string, ...args: unknown[]): void {
    const subs = this.listeners.get(event) || []
    const remaining: Subscription[] = []

    for (const sub of subs) {
      sub.callback(...args)
      if (!sub.once) {
        remaining.push(sub)
      }
    }

    if (remaining.length === subs.length) return
    if (remaining.length === 0) {
      this.listeners.delete(event)
    } else {
      this.listeners.set(event, remaining)
    }
  }

  /**
   * Remove all listeners for an event (or all events if no event specified).
   */
  off(event?: string): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  /**
   * Get the number of listeners for an event.
   */
  listenerCount(event: string): number {
    return (this.listeners.get(event) || []).length
  }
}

// Singleton instance — modules import this directly
export const eventBus = new EventBus()

/**
 * Well-known event names for type safety.
 * Modules should use these constants instead of raw strings.
 */
export const Events = {
  // Window lifecycle
  WINDOW_OPEN: 'window:open',
  WINDOW_CLOSE: 'window:close',
  WINDOW_FOCUS: 'window:focus',

  // File system
  FS_FILE_CREATED: 'fs:file:created',
  FS_FILE_DELETED: 'fs:file:deleted',
  FS_FILE_RENAMED: 'fs:file:renamed',
  FS_DIR_CREATED: 'fs:dir:created',
  FS_CONTENT_CHANGED: 'fs:content:changed',

  // Theme
  THEME_ACCENT_CHANGED: 'theme:accent:changed',
  THEME_FONT_SIZE_CHANGED: 'theme:font-size:changed',

  // Terminal
  TERMINAL_READY: 'terminal:ready',
  TERMINAL_COMMAND: 'terminal:command',
  TERMINAL_CLEAR: 'terminal:clear',

  // Settings
  SETTINGS_CHANGED: 'settings:changed',
} as const

export type EventName = (typeof Events)[keyof typeof Events]
