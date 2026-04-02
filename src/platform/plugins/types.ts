/**
 * Plugin system type definitions
 */

import type { Component } from 'vue'

/**
 * Plugin lifecycle status
 */
export enum PluginStatus {
  /** Plugin is registered but not loaded */
  REGISTERED = 'registered',
  /** Plugin is loaded and ready */
  LOADED = 'loaded',
  /** Plugin is enabled and active */
  ENABLED = 'enabled',
  /** Plugin is disabled but still loaded */
  DISABLED = 'disabled',
  /** Plugin failed to load */
  ERROR = 'error',
  /** Plugin is unloaded */
  UNLOADED = 'unloaded'
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  [key: string]: any
}

/**
 * Base plugin interface
 */
export interface Plugin {
  /** Unique plugin name */
  name: string
  /** Plugin version */
  version: string
  /** Plugin description */
  description?: string
  /** Plugin author */
  author?: string
  /** Plugin homepage URL */
  homepage?: string
  /** Plugin license */
  license?: string

  /** Lifecycle hook: called when plugin is loaded */
  onLoad?(): Promise<void> | void
  /** Lifecycle hook: called when plugin is unloaded */
  onUnload?(): Promise<void> | void
  /** Lifecycle hook: called when plugin is enabled */
  onEnable?(): Promise<void> | void
  /** Lifecycle hook: called when plugin is disabled */
  onDisable?(): Promise<void> | void

  /** Plugin dependencies (other plugin names) */
  dependencies?: string[]
  /** Plugin configuration */
  config?: PluginConfig
}

/**
 * Command handler function
 */
export type CommandHandler = (
  args: string[],
  write: (data: string) => void,
  writeln: (data: string) => void
) => void | Promise<void>

/**
 * Command option
 */
export interface CommandOption {
  /** Option name */
  name: string
  /** Option aliases */
  aliases?: string[]
  /** Option description */
  description: string
  /** Whether option requires a value */
  requiresValue?: boolean
  /** Default value */
  defaultValue?: any
}

/**
 * Command definition
 */
export interface CommandDefinition {
  /** Command name */
  name: string
  /** Command aliases */
  aliases?: string[]
  /** Command description */
  description: string
  /** Command usage */
  usage?: string
  /** Command handler */
  handler: CommandHandler
  /** Required permission */
  permission?: string
  /** Command options */
  options?: CommandOption[]
}

/**
 * Command plugin interface
 */
export interface CommandPlugin extends Plugin {
  /** Plugin type */
  type: 'command'
  /** Provided commands */
  commands: CommandDefinition[]
}

/**
 * ANSI color code
 */
export interface ANSIColors {
  black: string
  red: string
  green: string
  yellow: string
  blue: string
  magenta: string
  cyan: string
  white: string
  reset: string
}

/**
 * Theme color definition
 */
export interface ThemeColors {
  primary: string
  secondary: string
  background: string
  foreground: string
  error: string
  success: string
  warning: string
  info: string
}

/**
 * Terminal theme configuration
 */
export interface TerminalTheme {
  ansiColors: ANSIColors
  fontFamily: string
  fontSize: number
  cursorBlink?: boolean
  cursorStyle?: 'block' | 'underline' | 'bar'
}

/**
 * Theme definition
 */
export interface ThemeDefinition {
  /** Theme name */
  name: string
  /** Theme display name */
  displayName?: string
  /** Theme colors */
  colors: ThemeColors
  /** Terminal theme */
  terminal: TerminalTheme
}

/**
 * Theme plugin interface
 */
export interface ThemePlugin extends Plugin {
  /** Plugin type */
  type: 'theme'
  /** Theme definition */
  theme: ThemeDefinition
}

/**
 * Data query interface
 */
export interface DataQuery<T = any> {
  /** Query filter */
  filter?: (item: T) => boolean
  /** Query sort */
  sort?: (a: T, b: T) => number
  /** Query limit */
  limit?: number
  /** Query offset */
  offset?: number
}

/**
 * Batch operation
 */
export interface BatchOperation<T = any> {
  /** Operation type */
  type: 'create' | 'update' | 'delete'
  /** Data */
  data: T
}

/**
 * Data source client interface
 */
export interface DataSourceClient {
  /** Query data */
  query<T>(query: DataQuery<T>): Promise<T[]>
  /** Get data by ID */
  get<T>(id: string): Promise<T | null>
  /** Save data */
  save<T>(id: string, data: T): Promise<void>
  /** Delete data */
  delete(id: string): Promise<void>
  /** Batch operations */
  batch<T>(operations: BatchOperation<T>[]): Promise<void>
}

/**
 * Data source definition
 */
export interface DataSourceDefinition {
  /** Data source name */
  name: string
  /** Data source type */
  type: 'api' | 'local' | 'custom'
  /** Data source client */
  client: DataSourceClient
  /** Data source description */
  description?: string
}

/**
 * Data source plugin interface
 */
export interface DataSourcePlugin extends Plugin {
  /** Plugin type */
  type: 'datasource'
  /** Data source definition */
  source: DataSourceDefinition
}

/**
 * UI component position
 */
export type ComponentPosition = 'sidebar' | 'toolbar' | 'statusbar' | 'modal'

/**
 * UI component definition
 */
export interface UIComponentDefinition {
  /** Component name */
  name: string
  /** Vue component */
  component: Component
  /** Component position */
  position?: ComponentPosition
  /** Component priority */
  priority?: number
  /** Component props */
  props?: Record<string, any>
}

/**
 * UI plugin interface
 */
export interface UIPlugin extends Plugin {
  /** Plugin type */
  type: 'ui'
  /** UI components */
  components: UIComponentDefinition[]
}

/**
 * Plugin manifest (from plugin package)
 */
export interface PluginManifest {
  /** Plugin name */
  name: string
  /** Plugin version */
  version: string
  /** Plugin description */
  description?: string
  /** Plugin author */
  author?: string
  /** Plugin type */
  type: 'command' | 'theme' | 'datasource' | 'ui'
  /** Plugin entry point */
  main: string
  /** Plugin dependencies */
  dependencies?: string[]
  /** Plugin configuration */
  config?: PluginConfig
}

/**
 * Plugin load result
 */
export interface PluginLoadResult {
  /** Success */
  success: boolean
  /** Error message */
  error?: string
  /** Loaded plugin */
  plugin?: Plugin
}

/**
 * Plugin validation result
 */
export interface PluginValidationResult {
  /** Valid */
  valid: boolean
  /** Validation errors */
  errors: string[]
  /** Validation warnings */
  warnings: string[]
}