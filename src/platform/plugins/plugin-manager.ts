/**
 * Plugin Manager
 * Manages plugin lifecycle, dependencies, and registration
 */

import type {
  Plugin,
  CommandPlugin,
  ThemePlugin,
  DataSourcePlugin,
  UIPlugin,
  PluginStatus,
  PluginLoadResult,
  PluginValidationResult
} from './types'
import { PluginStatus as Status } from './types'
import { ExtensionRegistry, getGlobalExtensionRegistry } from '../extensions/extension-point'
import { EventBus, getGlobalEventBus } from '../events/event-bus'
import { EventType } from '../events/types'

/**
 * Plugin manager configuration
 */
export interface PluginManagerConfig {
  /** Enable debug mode */
  debug?: boolean
  /** Event bus instance */
  eventBus?: EventBus
  /** Extension registry instance */
  extensionRegistry?: ExtensionRegistry
}

/**
 * Plugin entry with metadata
 */
interface PluginEntry {
  /** Plugin instance */
  plugin: Plugin
  /** Plugin status */
  status: PluginStatus
  /** Load timestamp */
  loadedAt?: number
  /** Error message if status is ERROR */
  error?: string
}

/**
 * Plugin Manager
 */
export class PluginManager {
  private plugins = new Map<string, PluginEntry>()
  private config: Required<PluginManagerConfig>
  private eventBus: EventBus
  private extensionRegistry: ExtensionRegistry

  constructor(config: PluginManagerConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      eventBus: config.eventBus ?? getGlobalEventBus(),
      extensionRegistry: config.extensionRegistry ?? getGlobalExtensionRegistry()
    }

    this.eventBus = this.config.eventBus
    this.extensionRegistry = this.config.extensionRegistry

    if (this.config.debug) {
      console.log('[PluginManager] Plugin manager initialized', this.config)
    }
  }

  /**
   * Register a plugin
   * @param plugin - Plugin to register
   */
  async register(plugin: Plugin): Promise<PluginLoadResult> {
    if (this.plugins.has(plugin.name)) {
      return {
        success: false,
        error: `Plugin ${plugin.name} is already registered`
      }
    }

    // Validate plugin
    const validation = this.validatePlugin(plugin)
    if (!validation.valid) {
      return {
        success: false,
        error: `Plugin validation failed: ${validation.errors.join(', ')}`
      }
    }

    // Check dependencies
    if (plugin.dependencies && plugin.dependencies.length > 0) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          return {
            success: false,
            error: `Plugin ${plugin.name} requires ${dep}, but it is not registered`
          }
        }
      }
    }

    // Create plugin entry
    const entry: PluginEntry = {
      plugin,
      status: Status.REGISTERED
    }

    this.plugins.set(plugin.name, entry)

    if (this.config.debug) {
      console.log(`[PluginManager] Registered plugin: ${plugin.name} v${plugin.version}`)
    }

    // Emit plugin load event
    this.eventBus.emit(EventType.PLUGIN_LOAD, {
      action: 'load',
      pluginName: plugin.name,
      timestamp: Date.now()
    })

    // Load plugin
    return await this.load(plugin.name)
  }

  /**
   * Load a plugin
   * @param pluginName - Plugin name
   */
  async load(pluginName: string): Promise<PluginLoadResult> {
    const entry = this.plugins.get(pluginName)
    if (!entry) {
      return {
        success: false,
        error: `Plugin ${pluginName} not found`
      }
    }

    if (entry.status === Status.LOADED || entry.status === Status.ENABLED) {
      return {
        success: true,
        plugin: entry.plugin
      }
    }

    try {
      // Call onLoad hook
      if (entry.plugin.onLoad) {
        await entry.plugin.onLoad()
      }

      // Update status
      entry.status = Status.LOADED
      entry.loadedAt = Date.now()

      // Register extensions
      await this.registerExtensions(entry.plugin)

      if (this.config.debug) {
        console.log(`[PluginManager] Loaded plugin: ${pluginName}`)
      }

      return {
        success: true,
        plugin: entry.plugin
      }
    } catch (error) {
      entry.status = Status.ERROR
      entry.error = error instanceof Error ? error.message : String(error)

      console.error(`[PluginManager] Failed to load plugin ${pluginName}:`, error)

      return {
        success: false,
        error: entry.error
      }
    }
  }

  /**
   * Enable a plugin
   * @param pluginName - Plugin name
   */
  async enable(pluginName: string): Promise<PluginLoadResult> {
    const entry = this.plugins.get(pluginName)
    if (!entry) {
      return {
        success: false,
        error: `Plugin ${pluginName} not found`
      }
    }

    if (entry.status === Status.ERROR) {
      return {
        success: false,
        error: `Plugin ${pluginName} is in error state: ${entry.error}`
      }
    }

    // Load if not loaded
    if (entry.status === Status.REGISTERED) {
      const loadResult = await this.load(pluginName)
      if (!loadResult.success) {
        return loadResult
      }
    }

    if (entry.status === Status.ENABLED) {
      return {
        success: true,
        plugin: entry.plugin
      }
    }

    try {
      // Call onEnable hook
      if (entry.plugin.onEnable) {
        await entry.plugin.onEnable()
      }

      // Update status
      entry.status = Status.ENABLED

      if (this.config.debug) {
        console.log(`[PluginManager] Enabled plugin: ${pluginName}`)
      }

      // Emit plugin enable event
      this.eventBus.emit(EventType.PLUGIN_ENABLE, {
        action: 'enable',
        pluginName,
        timestamp: Date.now()
      })

      return {
        success: true,
        plugin: entry.plugin
      }
    } catch (error) {
      entry.status = Status.ERROR
      entry.error = error instanceof Error ? error.message : String(error)

      console.error(`[PluginManager] Failed to enable plugin ${pluginName}:`, error)

      return {
        success: false,
        error: entry.error
      }
    }
  }

  /**
   * Disable a plugin
   * @param pluginName - Plugin name
   */
  async disable(pluginName: string): Promise<PluginLoadResult> {
    const entry = this.plugins.get(pluginName)
    if (!entry) {
      return {
        success: false,
        error: `Plugin ${pluginName} not found`
      }
    }

    if (entry.status !== Status.ENABLED) {
      return {
        success: false,
        error: `Plugin ${pluginName} is not enabled`
      }
    }

    try {
      // Call onDisable hook
      if (entry.plugin.onDisable) {
        await entry.plugin.onDisable()
      }

      // Update status
      entry.status = Status.DISABLED

      if (this.config.debug) {
        console.log(`[PluginManager] Disabled plugin: ${pluginName}`)
      }

      // Emit plugin disable event
      this.eventBus.emit(EventType.PLUGIN_DISABLE, {
        action: 'disable',
        pluginName,
        timestamp: Date.now()
      })

      return {
        success: true,
        plugin: entry.plugin
      }
    } catch (error) {
      entry.status = Status.ERROR
      entry.error = error instanceof Error ? error.message : String(error)

      console.error(`[PluginManager] Failed to disable plugin ${pluginName}:`, error)

      return {
        success: false,
        error: entry.error
      }
    }
  }

  /**
   * Unload a plugin
   * @param pluginName - Plugin name
   */
  async unload(pluginName: string): Promise<PluginLoadResult> {
    const entry = this.plugins.get(pluginName)
    if (!entry) {
      return {
        success: false,
        error: `Plugin ${pluginName} not found`
      }
    }

    // Disable if enabled
    if (entry.status === Status.ENABLED) {
      await this.disable(pluginName)
    }

    try {
      // Call onUnload hook
      if (entry.plugin.onUnload) {
        await entry.plugin.onUnload()
      }

      // Unregister extensions
      await this.unregisterExtensions(entry.plugin)

      // Update status
      entry.status = Status.UNLOADED

      if (this.config.debug) {
        console.log(`[PluginManager] Unloaded plugin: ${pluginName}`)
      }

      // Emit plugin unload event
      this.eventBus.emit(EventType.PLUGIN_UNLOAD, {
        action: 'unload',
        pluginName,
        timestamp: Date.now()
      })

      return {
        success: true,
        plugin: entry.plugin
      }
    } catch (error) {
      entry.status = Status.ERROR
      entry.error = error instanceof Error ? error.message : String(error)

      console.error(`[PluginManager] Failed to unload plugin ${pluginName}:`, error)

      return {
        success: false,
        error: entry.error
      }
    }
  }

  /**
   * Unregister a plugin
   * @param pluginName - Plugin name
   */
  async unregister(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName)
    if (!entry) {
      return
    }

    // Unload first
    await this.unload(pluginName)

    // Remove from registry
    this.plugins.delete(pluginName)

    if (this.config.debug) {
      console.log(`[PluginManager] Unregistered plugin: ${pluginName}`)
    }
  }

  /**
   * Get a plugin
   * @param pluginName - Plugin name
   */
  getPlugin(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName)?.plugin
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).map((entry) => entry.plugin)
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
      .filter((entry) => entry.status === Status.ENABLED)
      .map((entry) => entry.plugin)
  }

  /**
   * Get plugins by type
   */
  getPluginsByType<T extends Plugin>(type: string): T[] {
    return this.getAllPlugins()
      .filter((p) => (p as any).type === type)
      .map((p) => p as T)
  }

  /**
   * Check if plugin is registered
   * @param pluginName - Plugin name
   */
  has(pluginName: string): boolean {
    return this.plugins.has(pluginName)
  }

  /**
   * Get plugin status
   * @param pluginName - Plugin name
   */
  getStatus(pluginName: string): PluginStatus | undefined {
    return this.plugins.get(pluginName)?.status
  }

  /**
   * Validate a plugin
   * @param plugin - Plugin to validate
   */
  validatePlugin(plugin: Plugin): PluginValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!plugin.name || typeof plugin.name !== 'string') {
      errors.push('Plugin name is required and must be a string')
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      errors.push('Plugin version is required and must be a string')
    }

    // Validate plugin type
    const pluginType = (plugin as any).type
    if (
      !['command', 'theme', 'datasource', 'ui'].includes(pluginType)
    ) {
      errors.push(`Invalid plugin type: ${pluginType}`)
    }

    // Validate type-specific fields
    if (pluginType === 'command') {
      const cmdPlugin = plugin as CommandPlugin
      if (!cmdPlugin.commands || !Array.isArray(cmdPlugin.commands)) {
        errors.push('Command plugin must have commands array')
      }
    } else if (pluginType === 'theme') {
      const themePlugin = plugin as ThemePlugin
      if (!themePlugin.theme) {
        errors.push('Theme plugin must have theme definition')
      }
    } else if (pluginType === 'datasource') {
      const dsPlugin = plugin as DataSourcePlugin
      if (!dsPlugin.source) {
        errors.push('DataSource plugin must have source definition')
      }
    } else if (pluginType === 'ui') {
      const uiPlugin = plugin as UIPlugin
      if (!uiPlugin.components || !Array.isArray(uiPlugin.components)) {
        errors.push('UI plugin must have components array')
      }
    }

    // Validate dependencies
    if (plugin.dependencies) {
      if (!Array.isArray(plugin.dependencies)) {
        errors.push('Dependencies must be an array')
      } else {
        for (const dep of plugin.dependencies) {
          if (typeof dep !== 'string') {
            errors.push(`Dependency must be a string: ${dep}`)
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Register plugin extensions
   * @private
   */
  private async registerExtensions(plugin: Plugin): Promise<void> {
    const pluginType = (plugin as any).type

    if (pluginType === 'command') {
      const cmdPlugin = plugin as CommandPlugin
      for (const command of cmdPlugin.commands) {
        this.extensionRegistry.registerCommand(command)
      }
    } else if (pluginType === 'theme') {
      const themePlugin = plugin as ThemePlugin
      this.extensionRegistry.registerTheme(themePlugin.theme)
    } else if (pluginType === 'datasource') {
      const dsPlugin = plugin as DataSourcePlugin
      this.extensionRegistry.registerDataSource(dsPlugin.source)
    } else if (pluginType === 'ui') {
      const uiPlugin = plugin as UIPlugin
      for (const component of uiPlugin.components) {
        this.extensionRegistry.registerUIComponent(component)
      }
    }
  }

  /**
   * Unregister plugin extensions
   * @private
   */
  private async unregisterExtensions(plugin: Plugin): Promise<void> {
    const pluginType = (plugin as any).type

    if (pluginType === 'command') {
      const cmdPlugin = plugin as CommandPlugin
      for (const command of cmdPlugin.commands) {
        this.extensionRegistry.unregisterCommand(command)
      }
    } else if (pluginType === 'theme') {
      const themePlugin = plugin as ThemePlugin
      this.extensionRegistry.unregisterTheme(themePlugin.theme)
    } else if (pluginType === 'datasource') {
      const dsPlugin = plugin as DataSourcePlugin
      this.extensionRegistry.unregisterDataSource(dsPlugin.source)
    } else if (pluginType === 'ui') {
      const uiPlugin = plugin as UIPlugin
      for (const component of uiPlugin.components) {
        this.extensionRegistry.unregisterUIComponent(component)
      }
    }
  }
}

/**
 * Global plugin manager instance
 */
let globalPluginManager: PluginManager | null = null

/**
 * Get or create the global plugin manager
 * @param config - Plugin manager configuration (only used on first call)
 */
export function getGlobalPluginManager(config?: PluginManagerConfig): PluginManager {
  if (!globalPluginManager) {
    globalPluginManager = new PluginManager(config)
  }
  return globalPluginManager
}

/**
 * Reset the global plugin manager
 */
export function resetGlobalPluginManager(): void {
  globalPluginManager = null
}