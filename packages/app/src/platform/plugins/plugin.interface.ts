/**
 * Plugin Interface
 * Base interface for all plugins in the SCP-OS platform
 */

/**
 * Plugin Configuration
 */
export interface PluginConfig {
  /** Enable plugin on load */
  autoEnable?: boolean
  /** Plugin-specific settings */
  settings?: Record<string, any>
}

/**
 * Plugin
 * Base interface for all plugins
 */
export interface Plugin {
  /** Plugin name (unique identifier) */
  name: string
  
  /** Plugin version (semver) */
  version: string
  
  /** Plugin description */
  description?: string
  
  /** Plugin author/maintainer */
  author?: string
  
  /** Plugin configuration */
  config?: PluginConfig
  
  /** Plugin dependencies (other plugins) */
  dependencies?: string[]
  
  /**
   * Called when plugin is loaded
   */
  onLoad?(): Promise<void> | void
  
  /**
   * Called when plugin is unloaded
   */
  onUnload?(): Promise<void> | void
  
  /**
   * Called when plugin is enabled
   */
  onEnable?(): Promise<void> | void
  
  /**
   * Called when plugin is disabled
   */
  onDisable?(): Promise<void> | void
}