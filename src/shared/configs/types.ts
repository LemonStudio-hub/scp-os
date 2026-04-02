/**
 * Configuration Types
 * Type definitions for the configuration system
 */

/**
 * Environment types
 */
export type Environment = 'development' | 'production' | 'test'

/**
 * Configuration value type
 */
export type ConfigValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ConfigValue[]
  | { [key: string]: ConfigValue }

/**
 * Configuration schema
 */
export interface ConfigSchema {
  /** Configuration key */
  key: string
  /** Configuration type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  /** Default value */
  default?: ConfigValue
  /** Required flag */
  required?: boolean
  /** Validation function */
  validate?: (value: ConfigValue) => boolean
  /** Description */
  description?: string
}

/**
 * Configuration source
 */
export interface ConfigSource {
  /** Source name */
  name: string
  /** Source priority (higher = more important) */
  priority: number
  /** Get configuration value */
  get(key: string): ConfigValue | undefined
  /** Set configuration value */
  set?(key: string, value: ConfigValue): void
  /** Check if source has value */
  has?(key: string): boolean
}

/**
 * Configuration change event
 */
export interface ConfigChangeEvent {
  /** Changed key */
  key: string
  /** Old value */
  oldValue: ConfigValue | undefined
  /** New value */
  newValue: ConfigValue
  /** Source that caused the change */
  source: string
  /** Timestamp */
  timestamp: number
}

/**
 * Configuration manager options
 */
export interface ConfigManagerOptions {
  /** Environment */
  environment?: Environment
  /** Enable debug mode */
  debug?: boolean
  /** Enable validation */
  enableValidation?: boolean
  /** Configuration sources */
  sources?: ConfigSource[]
  /** Configuration schemas */
  schemas?: ConfigSchema[]
}