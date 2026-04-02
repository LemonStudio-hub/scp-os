/**
 * Event system type definitions
 */

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (data: T) => void | Promise<void>

/**
 * Event configuration
 */
export interface EventConfig {
  /** Maximum number of handlers for this event */
  maxHandlers?: number
  /** Whether to emit events asynchronously */
  async?: boolean
  /** Error handler for event processing errors */
  errorHandler?: (error: Error, event: string, data: any) => void
}

/**
 * Event subscription
 */
export interface EventSubscription {
  /** Event name */
  event: string
  /** Handler function */
  handler: EventHandler
  /** Whether this is a one-time subscription */
  once: boolean
  /** Subscription ID */
  id: string
}

/**
 * Event emitter options
 */
export interface EventEmitterOptions {
  /** Enable debug mode */
  debug?: boolean
  /** Default error handler */
  errorHandler?: (error: Error, event: string, data: any) => void
  /** Maximum listeners per event */
  maxListeners?: number
}

/**
 * Event data types
 */
export interface CommandEventData {
  command: string
  args: string[]
  timestamp: number
}

export interface TerminalEventData {
  action: 'write' | 'clear' | 'resize'
  data?: string
  size?: { rows: number; cols: number }
  timestamp: number
}

export interface TabEventData {
  action: 'create' | 'switch' | 'close'
  tabId: string
  timestamp: number
}

export interface PluginEventData {
  action: 'load' | 'enable' | 'disable' | 'unload'
  pluginName: string
  timestamp: number
}

export interface ThemeEventData {
  action: 'change'
  themeName: string
  timestamp: number
}

export interface AppEventData {
  action: 'init' | 'ready' | 'error'
  data?: any
  timestamp: number
}

/**
 * Event types enum
 */
export enum EventType {
  // Command events
  COMMAND_EXECUTE = 'command:execute',
  COMMAND_COMPLETE = 'command:complete',
  COMMAND_ERROR = 'command:error',

  // Terminal events
  TERMINAL_INIT = 'terminal:init',
  TERMINAL_WRITE = 'terminal:write',
  TERMINAL_CLEAR = 'terminal:clear',
  TERMINAL_RESIZE = 'terminal:resize',

  // Tab events
  TAB_CREATE = 'tab:create',
  TAB_SWITCH = 'tab:switch',
  TAB_CLOSE = 'tab:close',

  // Plugin events
  PLUGIN_LOAD = 'plugin:load',
  PLUGIN_ENABLE = 'plugin:enable',
  PLUGIN_DISABLE = 'plugin:disable',
  PLUGIN_UNLOAD = 'plugin:unload',

  // Theme events
  THEME_CHANGE = 'theme:change',

  // Application events
  APP_INIT = 'app:init',
  APP_READY = 'app:ready',
  APP_ERROR = 'app:error'
}