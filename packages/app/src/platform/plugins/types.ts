/**
 * Plugin system type definitions
 */

import type { Component } from 'vue'

/**
 * Extension interface
 */
export interface Extension<T = unknown> {
  /** Extension ID */
  id: string
  /** Extension name */
  name: string
  /** Extension description */
  description?: string
  /** Extension version */
  version?: string
  /** Extension author */
  author?: string
  /** Extension data */
  data: T
}

/**
 * Extension metadata
 */
export interface ExtensionMetadata {
  /** Extension point ID */
  id: string
  /** Extension point name */
  name: string
  /** Extension point description */
  description: string
  /** Registered extensions */
  extensions: {
    id: string
    name: string
    description: string
    version: string
    author: string
  }[]
  /** Created timestamp */
  createdAt: number
}

/**
 * Extension point interface
 */
export interface ExtensionPoint<T = unknown> {
  /** Extension point ID */
  id: string
  /** Extension point name */
  name: string
  /** Extension point description */
  description: string
  /** Extension metadata */
  metadata: ExtensionMetadata

  /**
   * Register an extension
   */
  register(extension: Extension<T>): void

  /**
   * Unregister an extension
   */
  unregister(extensionId: string): void

  /**
   * Get an extension by ID
   */
  get(extensionId: string): Extension<T> | undefined

  /**
   * Get all extensions
   */
  getAll(): Extension<T>[]

  /**
   * Check if extension exists
   */
  has(extensionId: string): boolean

  /**
   * Clear all extensions
   */
  clear(): void
}

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
  UNLOADED: 'unloaded',
} as const

export type PluginStatus = (typeof PluginStatus)[keyof typeof PluginStatus]

/**
 * Plugin configuration
 */
export interface PluginConfig {
  [key: string]: unknown
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
  default?: unknown
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
  terminal: {
    ansiColors: ANSIColors
    fontFamily: string
    fontSize: number
  }
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
  query<T>(query: unknown): Promise<T[]>
}

/**
 * Data source query options
 */
export interface DataSourceQueryOptions {
  /** Limit number of results */
  limit?: number
  /** Offset for pagination */
  offset?: number
  /** Search keyword */
  keyword?: string
  /** Filter by object class */
  objectClass?: string
  /** Sort field */
  sort?: string
  /** Sort direction */
  sortDirection?: 'asc' | 'desc'
}

/**
 * Data source query result
 */
export interface DataSourceQueryResult<T = unknown> {
  /** Query results */
  data: T[]
  /** Total number of results */
  total: number
  /** Whether there are more results */
  hasMore: boolean
}

/**
 * Data source metadata
 */
export interface DataSourceMetadata {
  /** Data source name */
  name: string
  /** Data source description */
  description: string
  /** Data source author */
  author: string
  /** Data source version */
  version: string
  /** Data source URL (if remote) */
  url?: string
  /** Data source type (e.g., 'api', 'database', 'file') */
  type: 'api' | 'database' | 'file' | 'memory'
  /** Data source capabilities */
  capabilities: string[]
  /** Whether data source is readonly */
  readonly?: boolean
  /** Authentication required */
  requiresAuth?: boolean
}

/**
 * Data source definition
 */
export interface DataSourceDefinition {
  /** Data source ID */
  id: string
  /** Data source name */
  name: string
  /** Data source metadata */
  metadata: DataSourceMetadata
}

/**
 * Data source plugin
 */
export interface DataSourcePlugin extends Plugin {
  /** Plugin type */
  type: 'datasource'
  /** Data source metadata */
  metadata: DataSourceMetadata
  /** Data source definitions provided by this plugin */
  dataSources: DataSourceDefinition[]

  /**
   * Query data from the data source
   */
  query<T = unknown>(
    dataSourceId: string,
    options: DataSourceQueryOptions
  ): Promise<DataSourceQueryResult<T>>

  /**
   * Get a single item by ID
   */
  get<T = unknown>(dataSourceId: string, id: string): Promise<T | null>

  /**
   * Search for items
   */
  search<T = unknown>(
    dataSourceId: string,
    keyword: string,
    options?: DataSourceQueryOptions
  ): Promise<DataSourceQueryResult<T>>

  /**
   * Get data source by ID
   */
  getDataSource(dataSourceId: string): DataSourceDefinition | null

  /**
   * Get all data source IDs
   */
  getDataSourceIds(): string[]

  /**
   * Check if plugin provides a specific data source
   */
  hasDataSource(dataSourceId: string): boolean

  /**
   * Test connection to data source
   */
  testConnection(dataSourceId: string): Promise<boolean>

  /**
   * Get data source statistics
   */
  getStatistics(dataSourceId: string): Promise<{
    totalItems: number
    lastUpdated?: string
    [key: string]: unknown
  }>
}

/**
 * UI plugin
 */
export interface UIPlugin extends Plugin {
  /** Plugin type */
  type: 'ui'
  /** UI components */
  components: Array<{
    /** Component name */
    name: string
    /** Vue component */
    component: Component
    /** Component position */
    position?: 'sidebar' | 'toolbar' | 'statusbar'
    /** Component priority (higher = more important) */
    priority?: number
  }>
}

export type TypedPlugin = CommandPlugin | ThemePlugin | DataSourcePlugin | UIPlugin

export type PluginType = TypedPlugin['type']

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
