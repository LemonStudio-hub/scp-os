/**
 * Capability Abstraction Interfaces
 * Defines capabilities for different aspects of the SCP-OS platform
 */

import type { TerminalTheme } from '../../types/terminal'

/**
 * Terminal Configuration
 */
export interface TerminalConfig {
  /** Terminal theme */
  theme: TerminalTheme
  /** Font size */
  fontSize: number
  /** Line height */
  lineHeight: number
  /** Cursor blink */
  cursorBlink: boolean
  /** Cursor style */
  cursorStyle: 'block' | 'underline' | 'bar'
  /** Scrollback buffer size */
  scrollback: number
  /** Tab stop width */
  tabStopWidth: number
  /** Allow proposed API */
  allowProposedApi: boolean
}

/**
 * Terminal Capability
 * Provides terminal operations
 */
export interface ITerminalCapability {
  /**
   * Initialize terminal with configuration
   * @param config Terminal configuration
   */
  initialize(config: TerminalConfig): Promise<void>
  
  /**
   * Write data to terminal
   * @param data Data to write
   */
  write(data: string): void
  
  /**
   * Write line to terminal
   * @param data Data to write with newline
   */
  writeln(data: string): void
  
  /**
   * Clear terminal
   */
  clear(): void
  
  /**
   * Execute a command
   * @param command Command to execute
   */
  executeCommand(command: string): Promise<void>
  
  /**
   * Resize terminal
   * @param columns Number of columns
   * @param rows Number of rows
   */
  resize(columns: number, rows: number): Promise<void>
  
  /**
   * Get terminal state
   */
  getState(): {
    isInitialized: boolean
    dimensions: { columns: number; rows: number } | null
  }
  
  /**
   * Destroy terminal
   */
  destroy(): void
}

/**
 * Data Query Options
 */
export interface DataQuery<T> {
  /** Filter function */
  filter?: (item: T) => boolean
  /** Sort function */
  sort?: (a: T, b: T) => number
  /** Limit results */
  limit?: number
  /** Offset for pagination */
  offset?: number
}

/**
 * Data Capability
 * Provides data operations
 */
export interface IDataCapability {
  /**
   * Query data
   * @param query Query options
   * @returns Query results
   */
  query<T>(query: DataQuery<T>): Promise<T[]>
  
  /**
   * Get item by ID
   * @param id Item ID
   * @returns Item or null
   */
  get<T>(id: string): Promise<T | null>
  
  /**
   * Save item
   * @param id Item ID
   * @param data Item data
   */
  save<T>(id: string, data: T): Promise<void>
  
  /**
   * Delete item
   * @param id Item ID
   */
  delete(id: string): Promise<void>
  
  /**
   * Count items
   * @param filter Optional filter
   * @returns Item count
   */
  count<T>(filter?: (item: T) => boolean): Promise<number>
  
  /**
   * Batch operations
   */
  batch: {
    /**
     * Get multiple items
     */
    getMultiple<T>(ids: string[]): Promise<Map<string, T>>
    
    /**
     * Save multiple items
     */
    saveMultiple<T>(items: Map<string, T>): Promise<void>
    
    /**
     * Delete multiple items
     */
    deleteMultiple(ids: string[]): Promise<void>
  }
  
  /**
   * Transaction operations
   */
  transaction: {
    /**
     * Begin transaction
     */
    begin(): Promise<string>
    
    /**
     * Commit transaction
     */
    commit(transactionId: string): Promise<void>
    
    /**
     * Rollback transaction
     */
    rollback(transactionId: string): Promise<void>
  }
}

/**
 * Notification Message
 */
export interface NotificationMessage {
  /** Message type */
  type: 'info' | 'success' | 'warning' | 'error'
  /** Message title */
  title: string
  /** Message content */
  message: string
  /** Message duration (ms) */
  duration?: number
  /** Action button */
  action?: {
    label: string
    handler: () => void
  }
}

/**
 * Theme Configuration
 */
export interface ThemeConfig {
  /** Primary color */
  primary?: string
  /** Secondary color */
  secondary?: string
  /** Accent color */
  accent?: string
  /** Background color */
  background?: string
  /** Surface color */
  surface?: string
  /** Text color */
  text?: string
  /** Custom CSS variables */
  cssVariables?: Record<string, string>
}

/**
 * UI Capability
 * Provides UI operations
 */
export interface IUICapability {
  /**
   * Register a component
   * @param name Component name
   * @param component Vue component
   */
  registerComponent(name: string, component: any): void
  
  /**
   * Get registered component
   * @param name Component name
   * @returns Component or null
   */
  getComponent(name: string): any | null
  
  /**
   * Set theme
   * @param theme Theme configuration
   */
  setTheme(theme: ThemeConfig): void
  
  /**
   * Get current theme
   * @returns Current theme configuration
   */
  getTheme(): ThemeConfig
  
  /**
   * Show notification
   * @param message Notification message
   */
  notify(message: NotificationMessage): void
  
  /**
   * Show modal
   * @param config Modal configuration
   */
  showModal(config: {
    title: string
    content: string
    actions?: Array<{ label: string; handler: () => void }>
  }): Promise<string>
  
  /**
   * Show dialog
   * @param message Dialog message
   * @returns User choice
   */
  showDialog(message: string): Promise<boolean>
  
  /**
   * Set layout mode
   * @param mode Layout mode
   */
  setLayoutMode(mode: 'fullscreen' | 'windowed' | 'split'): void
  
  /**
   * Get layout mode
   * @returns Current layout mode
   */
  getLayoutMode(): 'fullscreen' | 'windowed' | 'split'
  
  /**
   * Register menu item
   * @param path Menu path (e.g., 'file.save')
   * @param config Menu item configuration
   */
  registerMenuItem(path: string, config: {
    label: string
    shortcut?: string
    handler: () => void
  }): void
  
  /**
   * Unregister menu item
   * @param path Menu path
   */
  unregisterMenuItem(path: string): void
}