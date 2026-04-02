/**
 * Plugin Loader
 * Handles loading plugins from files or URLs
 */

import type { Plugin, PluginManifest, PluginLoadResult } from './types'
import { PluginManager } from './plugin-manager'
import { EventType } from '../events/types'

/**
 * Plugin loader options
 */
export interface PluginLoaderOptions {
  /** Enable debug mode */
  debug?: boolean
  /** Plugin manager instance */
  pluginManager?: PluginManager
  /** Maximum file size (bytes) */
  maxFileSize?: number
}

/**
 * Plugin load source type
 */
type LoadSource = 'file' | 'url' | 'object'

/**
 * Plugin load context
 */
interface LoadContext {
  type: LoadSource
  source: string | Plugin
  timestamp: number
}

/**
 * Plugin Loader
 */
export class PluginLoader {
  private config: Required<PluginLoaderOptions>
  private pluginManager: PluginManager
  private loadHistory = new Map<string, LoadContext>()

  constructor(options: PluginLoaderOptions = {}) {
    this.config = {
      debug: options.debug ?? false,
      pluginManager: options.pluginManager ?? (() => {
        const { getGlobalPluginManager } = require('./plugin-manager')
        return getGlobalPluginManager()
      })(),
      maxFileSize: options.maxFileSize ?? 1024 * 1024 // 1MB
    }

    this.pluginManager = this.config.pluginManager

    if (this.config.debug) {
      console.log('[PluginLoader] Plugin loader initialized', this.config)
    }
  }

  /**
   * Load a plugin from a file path
   * @param filePath - Path to plugin file
   */
  async loadFromFile(filePath: string): Promise<PluginLoadResult> {
    if (this.config.debug) {
      console.log(`[PluginLoader] Loading plugin from file: ${filePath}`)
    }

    try {
      // Dynamically import the plugin file
      const module = await import(/* @vite-ignore */ filePath)

      // Get the default export or the plugin export
      const plugin = module.default || module.plugin

      if (!plugin) {
        return {
          success: false,
          error: `No plugin found in file: ${filePath}`
        }
      }

      // Register the plugin
      const result = await this.pluginManager.register(plugin)

      // Record load history
      if (result.success) {
        this.loadHistory.set(plugin.name, {
          type: 'file',
          source: filePath,
          timestamp: Date.now()
        })
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[PluginLoader] Failed to load plugin from ${filePath}:`, error)

      return {
        success: false,
        error: `Failed to load plugin: ${errorMessage}`
      }
    }
  }

  /**
   * Load a plugin from a URL
   * @param url - URL to plugin file
   */
  async loadFromURL(url: string): Promise<PluginLoadResult> {
    if (this.config.debug) {
      console.log(`[PluginLoader] Loading plugin from URL: ${url}`)
    }

    try {
      // Fetch the plugin code
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Check content length
      const contentLength = response.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > this.config.maxFileSize) {
        throw new Error(`Plugin file too large: ${contentLength} bytes`)
      }

      const code = await response.text()

      // Check file size
      if (code.length > this.config.maxFileSize) {
        throw new Error(`Plugin file too large: ${code.length} bytes`)
      }

      // Create a blob and object URL
      const blob = new Blob([code], { type: 'application/javascript' })
      const pluginUrl = URL.createObjectURL(blob)

      // Dynamically import the plugin
      const module = await import(/* @vite-ignore */ pluginUrl)

      // Get the default export or the plugin export
      const plugin = module.default || module.plugin

      if (!plugin) {
        URL.revokeObjectURL(pluginUrl)
        return {
          success: false,
          error: `No plugin found at URL: ${url}`
        }
      }

      // Register the plugin
      const result = await this.pluginManager.register(plugin)

      // Clean up object URL
      URL.revokeObjectURL(pluginUrl)

      // Record load history
      if (result.success) {
        this.loadHistory.set(plugin.name, {
          type: 'url',
          source: url,
          timestamp: Date.now()
        })
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[PluginLoader] Failed to load plugin from ${url}:`, error)

      return {
        success: false,
        error: `Failed to load plugin: ${errorMessage}`
      }
    }
  }

  /**
   * Load a plugin from an object
   * @param plugin - Plugin object
   */
  async loadFromObject(plugin: Plugin): Promise<PluginLoadResult> {
    if (this.config.debug) {
      console.log(`[PluginLoader] Loading plugin from object: ${plugin.name}`)
    }

    try {
      // Register the plugin
      const result = await this.pluginManager.register(plugin)

      // Record load history
      if (result.success) {
        this.loadHistory.set(plugin.name, {
          type: 'object',
          source: plugin,
          timestamp: Date.now()
        })
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[PluginLoader] Failed to load plugin ${plugin.name}:`, error)

      return {
        success: false,
        error: `Failed to load plugin: ${errorMessage}`
      }
    }
  }

  /**
   * Load multiple plugins
   * @param sources - Array of file paths, URLs, or plugin objects
   */
  async loadMultiple(
    sources: Array<string | Plugin>
  ): Promise<PluginLoadResult[]> {
    const promises = sources.map((source) => {
      if (typeof source === 'string') {
        if (source.startsWith('http://') || source.startsWith('https://')) {
          return this.loadFromURL(source)
        } else {
          return this.loadFromFile(source)
        }
      } else {
        return this.loadFromObject(source)
      }
    })

    return Promise.all(promises)
  }

  /**
   * Unload a plugin
   * @param pluginName - Plugin name
   */
  async unload(pluginName: string): Promise<void> {
    await this.pluginManager.unregister(pluginName)
    this.loadHistory.delete(pluginName)

    if (this.config.debug) {
      console.log(`[PluginLoader] Unloaded plugin: ${pluginName}`)
    }
  }

  /**
   * Get load history
   */
  getLoadHistory(): Map<string, LoadContext> {
    return new Map(this.loadHistory)
  }

  /**
   * Clear load history
   */
  clearLoadHistory(): void {
    this.loadHistory.clear()
  }

  /**
   * Get configuration
   */
  getConfig(): Required<PluginLoaderOptions> {
    return { ...this.config }
  }
}

/**
 * Global plugin loader instance
 */
let globalPluginLoader: PluginLoader | null = null

/**
 * Get or create the global plugin loader
 * @param options - Plugin loader configuration (only used on first call)
 */
export function getGlobalPluginLoader(options?: PluginLoaderOptions): PluginLoader {
  if (!globalPluginLoader) {
    globalPluginLoader = new PluginLoader(options)
  }
  return globalPluginLoader
}

/**
 * Reset the global plugin loader
 */
export function resetGlobalPluginLoader(): void {
  globalPluginLoader = null
}