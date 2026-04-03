/**
 * Configuration Manager
 * Centralized configuration management with multi-environment support
 */

import type {
  ConfigValue,
  ConfigSchema,
  ConfigSource,
  ConfigChangeEvent,
  ConfigManagerOptions,
  Environment
} from './types'
import { EventBus, getGlobalEventBus } from '../../platform/events/event-bus'

/**
 * Environment configuration source
 */
class EnvironmentSource implements ConfigSource {
  name = 'environment'
  priority = 1000

  constructor() {}

  get(key: string): ConfigValue | undefined {
    const envKey = key.toUpperCase().replace(/-/g, '_')
    return (import.meta.env as any)[`VITE_${envKey}`]
  }

  has(key: string): boolean {
    const envKey = key.toUpperCase().replace(/-/g, '_')
    return `VITE_${envKey}` in import.meta.env
  }
}

/**
 * Default configuration source
 */
class DefaultSource implements ConfigSource {
  name = 'default'
  priority = 0
  private defaults: Record<string, ConfigValue>

  constructor(defaults: Record<string, ConfigValue> = {}) {
    this.defaults = defaults
  }

  get(key: string): ConfigValue | undefined {
    return this.defaults[key]
  }

  has(key: string): boolean {
    return key in this.defaults
  }
}

/**
 * Memory configuration source
 */
class MemorySource implements ConfigSource {
  name = 'memory'
  priority = 500
  private values: Record<string, ConfigValue>

  constructor(values: Record<string, ConfigValue> = {}) {
    this.values = values
  }

  get(key: string): ConfigValue | undefined {
    return this.values[key]
  }

  set(key: string, value: ConfigValue): void {
    this.values[key] = value
  }

  has(key: string): boolean {
    return key in this.values
  }

  clear(): void {
    this.values = {}
  }
}

/**
 * Configuration Manager
 */
export class ConfigManager {
  private sources: ConfigSource[] = []
  private schemas = new Map<string, ConfigSchema>()
  private eventBus: EventBus
  private config: Required<ConfigManagerOptions>
  private cache = new Map<string, ConfigValue>()

  constructor(options: ConfigManagerOptions = {}) {
    this.config = {
      environment: options.environment ?? this.detectEnvironment(),
      debug: options.debug ?? false,
      enableValidation: options.enableValidation ?? true,
      sources: options.sources ?? [],
      schemas: options.schemas ?? []
    }

    this.eventBus = getGlobalEventBus()

    // Add default sources
    this.addSource(new DefaultSource())
    this.addSource(new MemorySource())
    this.addSource(new EnvironmentSource())

    // Add custom sources
    for (const source of this.config.sources) {
      this.addSource(source)
    }

    // Register schemas
    for (const schema of this.config.schemas) {
      this.registerSchema(schema)
    }

    if (this.config.debug) {
      console.log('[ConfigManager] Configuration manager initialized', {
        environment: this.config.environment,
        sources: this.sources.map(s => s.name),
        schemas: this.schemas.size
      })
    }
  }

  /**
   * Detect current environment
   */
  private detectEnvironment(): Environment {
    if (typeof window === 'undefined' || typeof window.location === 'undefined' || typeof window.location.hostname === 'undefined') {
      return 'development'  // Default to development in test environment
    }
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development'
    }
    if (hostname.includes('test') || hostname.includes('staging')) {
      return 'test'
    }
    return 'production'
  }

  /**
   * Add a configuration source
   */
  addSource(source: ConfigSource): void {
    this.sources.push(source)
    this.sources.sort((a, b) => b.priority - a.priority)
    this.clearCache()

    if (this.config.debug) {
      console.log(`[ConfigManager] Added source: ${source.name} (priority: ${source.priority})`)
    }
  }

  /**
   * Remove a configuration source
   */
  removeSource(sourceName: string): void {
    this.sources = this.sources.filter(s => s.name !== sourceName)
    this.clearCache()

    if (this.config.debug) {
      console.log(`[ConfigManager] Removed source: ${sourceName}`)
    }
  }

  /**
   * Get configuration value
   */
  get<T = ConfigValue>(key: string): T | undefined {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key) as T
    }

    // Get from sources (highest priority first)
    let value: ConfigValue | undefined
    for (const source of this.sources) {
      if (source.has && source.has(key)) {
        value = source.get(key)
        break
      }
    }

    // Cache the value
    this.cache.set(key, value)

    return value as T
  }

  /**
   * Set configuration value (writes to memory source)
   */
  set(key: string, value: ConfigValue, source: string = 'memory'): void {
    const oldValue = this.get(key)

    // Find memory source
    const memorySource = this.sources.find(s => s.name === 'memory') as MemorySource
    if (memorySource && memorySource.set) {
      memorySource.set(key, value)
    }

    // Clear cache
    this.clearCache()

    // Emit change event
    this.eventBus.emit('config:change', {
      key,
      oldValue,
      newValue: value,
      source,
      timestamp: Date.now()
    } as ConfigChangeEvent)

    if (this.config.debug) {
      console.log(`[ConfigManager] Set ${key} =`, value, `(source: ${source})`)
    }
  }

  /**
   * Check if configuration key exists
   */
  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  /**
   * Get all configuration
   */
  getAll(): Record<string, ConfigValue> {
    const config: Record<string, ConfigValue> = {}

    // Collect all keys from all sources
    for (const source of this.sources) {
      if (source.has) {
        // Try to get all keys from source
        // This is a simplified approach - in a real implementation,
        // you might need to iterate over known keys or have a method on the source
      }
    }

    return config
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.cache.clear()

    if (this.config.debug) {
      console.log('[ConfigManager] Cache cleared')
    }
  }

  /**
   * Register configuration schema
   */
  registerSchema(schema: ConfigSchema): void {
    this.schemas.set(schema.key, schema)

    if (this.config.debug) {
      console.log(`[ConfigManager] Registered schema: ${schema.key}`)
    }
  }

  /**
   * Unregister configuration schema
   */
  unregisterSchema(key: string): void {
    this.schemas.delete(key)

    if (this.config.debug) {
      console.log(`[ConfigManager] Unregistered schema: ${key}`)
    }
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    for (const [key, schema] of this.schemas) {
      const value = this.get(key)

      // Check required
      if (schema.required && value === undefined) {
        errors.push(`Required configuration missing: ${key}`)
        continue
      }

      // Skip validation if value is undefined and not required
      if (value === undefined) {
        continue
      }

      // Check type
      if (!this.checkType(value, schema.type)) {
        errors.push(`Invalid type for ${key}: expected ${schema.type}, got ${typeof value}`)
        continue
      }

      // Run custom validation
      if (schema.validate && !schema.validate(value)) {
        errors.push(`Validation failed for ${key}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Check value type
   */
  private checkType(value: ConfigValue, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number'
      case 'boolean':
        return typeof value === 'boolean'
      case 'array':
        return Array.isArray(value)
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value)
      default:
        return true
    }
  }

  /**
   * Get environment
   */
  getEnvironment(): Environment {
    return this.config.environment
  }

  /**
   * Set environment
   */
  setEnvironment(environment: Environment): void {
    this.config.environment = environment

    // Update environment source
    this.removeSource('environment')
    this.addSource(new EnvironmentSource())

    this.clearCache()

    if (this.config.debug) {
      console.log(`[ConfigManager] Environment set to: ${environment}`)
    }
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    const memorySource = this.sources.find(s => s.name === 'memory') as MemorySource
    if (memorySource) {
      memorySource.clear()
    }

    this.clearCache()

    if (this.config.debug) {
      console.log('[ConfigManager] Configuration reset')
    }
  }

  /**
   * Watch for configuration changes
   */
  watch(key: string, callback: (value: ConfigValue) => void): () => void {
    const handler = (event: ConfigChangeEvent) => {
      if (event.key === key) {
        callback(event.newValue)
      }
    }

    this.eventBus.on('config:change', handler)

    // Return unsubscribe function
    return () => {
      this.eventBus.off('config:change', handler)
    }
  }

  /**
   * Get configuration source
   */
  getSource(sourceName: string): ConfigSource | undefined {
    return this.sources.find(s => s.name === sourceName)
  }

  /**
   * Get all sources
   */
  getSources(): ConfigSource[] {
    return [...this.sources]
  }
}

/**
 * Global configuration manager instance
 */
let globalConfigManager: ConfigManager | null = null

/**
 * Get or create the global configuration manager
 * @param options - Configuration manager options (only used on first call)
 */
export function getGlobalConfigManager(options?: ConfigManagerOptions): ConfigManager {
  if (!globalConfigManager) {
    globalConfigManager = new ConfigManager(options)
  }
  return globalConfigManager
}

/**
 * Reset the global configuration manager
 */
export function resetGlobalConfigManager(): void {
  globalConfigManager = null
}

/**
 * Shorthand for getting configuration value
 */
export function config<T = ConfigValue>(key: string): T | undefined {
  return getGlobalConfigManager().get<T>(key)
}

/**
 * Shorthand for setting configuration value
 */
export function setConfig(key: string, value: ConfigValue): void {
  getGlobalConfigManager().set(key, value)
}

/**
 * Shorthand for checking if configuration key exists
 */
export function hasConfig(key: string): boolean {
  return getGlobalConfigManager().has(key)
}