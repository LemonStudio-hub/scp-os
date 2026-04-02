/**
 * Plugin system type definitions
 */

import type { Component } from 'vue'

/**
 * Plugin lifecycle status
 */
export const PluginStatus = {
  /** Plugin is registered but not loaded */
  REGISTERED: 'registered',
  /** Plugin is loaded and ready */
  LOADED: 'loaded',
  /** Plugin is enabled and active */
  ENABLED: 'enabled',
  /** Plugin is disabled but still loaded */
  DISABLED: 'disabled',
  /** Plugin failed to load */
  ERROR: 'error',
  /** Plugin is unloaded */
  UNLOADED: 'unloaded'
} as const

export type PluginStatus = typeof PluginStatus[keyof typeof PluginStatus]

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
  /** Plugin name (unique identifier) */
  name: string
  /** Plugin version */
  version: string
  /** Plugin description */
  description?: string
  /** Plugin author */
  author?: string
  /** Plugin dependencies */
  dependencies?: string[]
  /** Plugin configuration */
  config?: PluginConfig

  /**
   * Called when plugin is loaded
   */
  onLoad?(): Promise<void> | void

  /**
   * Called when plugin is enabled
   */
  onEnable?(): Promise<void> | void

  /**
   * Called when plugin is disabled
   */
  onDisable?(): Promise<void> | void

  /**
   * Called when plugin is unloaded
   */
  onUnload?(): Promise<void> | void
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
  /** Option alias */
  alias?: string
  /** Option description */
  description: string
  /** Option type */
  type: 'string' | 'number' | 'boolean'
  /** Option is required */
  required?: boolean
  /** Default value */
  default?: any
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
  /** Command permission */
  permission?: string
  /** Command options */
  options?: CommandOption[]
}

/**
 * Command plugin
 */
export interface CommandPlugin extends Plugin {
  /** Plugin type */
  type: 'command'
  /** Commands provided by this plugin */
  commands: CommandDefinition[]
}

/**
 * ANSI color mapping
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
 * Terminal configuration
 */
export interface TerminalConfig {
  /** ANSI colors */
  ansiColors: ANSIColors
  /** Font family */
  fontFamily: string
  /** Font size */
  fontSize: number
}

/**
 * Color palette
 */
export interface ColorPalette {
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
 * Theme definition
 */
export interface ThemeDefinition {
  /** Theme name */
  name: string
  /** Colors */
  colors: ColorPalette
  /** Terminal configuration */
  terminal: TerminalConfig
}

/**
 * Theme plugin
 */
export interface ThemePlugin extends Plugin {
  /** Plugin type */
  type: 'theme'
  /** Theme configuration */
  theme: ThemeDefinition
}

/**
 * Data source client
 */
export interface DataSourceClient {
  /** Get data */
  get<T>(key: string): Promise<T | null>
  /** Set data */
  set<T>(key: string, value: T): Promise<void>
  /** Delete data */
  delete(key: string): Promise<void>
  /** Query data */
  query<T>(query: any): Promise<T[]>
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
}

/**
 * Data source plugin
 */
export interface DataSourcePlugin extends Plugin {
  /** Plugin type */
  type: 'datasource'
  /** Data source configuration */
  source: DataSourceDefinition
}

/**
 * UI component definition
 */
export interface UIComponentDefinition {
  /** Component name */
  name: string
  /** Vue component */
  component: Component
  /** Component position */
  position?: 'sidebar' | 'toolbar' | 'statusbar'
  /** Component priority (higher = more important) */
  priority?: number
}

/**
 * UI plugin
 */
export interface UIPlugin extends Plugin {
  /** Plugin type */
  type: 'ui'
  /** UI components */
  components: UIComponentDefinition[]
}

/**
 * Plugin manifest
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
  /** Plugin dependencies */
  dependencies?: string[]
  /** Minimum platform version */
  minPlatformVersion?: string
}

/**
 * Plugin load result
 */
export interface PluginLoadResult {
  /** Load success */
  success: boolean
  /** Plugin instance (if successful) */
  plugin?: Plugin
  /** Error message (if failed) */
  error?: string
}

/**
 * Plugin validation result
 */
export interface PluginValidationResult {
  /** Validation passed */
  valid: boolean
  /** Validation errors */
  errors: string[]
  /** Validation warnings */
  warnings: string[]
}