/**
 * Application Template Interface
 * Defines application templates for different use cases
 */

import type { TerminalTheme } from '../../types/terminal'
import type { ThemeConfig } from './capability.interfaces'

/**
 * Application Template Metadata
 */
export interface ApplicationTemplateMetadata {
  /** Template ID */
  id: string
  /** Template name */
  name: string
  /** Template description */
  description: string
  /** Template version */
  version: string
  /** Template author */
  author: string
  /** Template category (e.g., 'terminal', 'dashboard', 'monitoring') */
  category: string
  /** Template tags */
  tags?: string[]
  /** Template icon */
  icon?: string
  /** Template preview URL */
  previewUrl?: string
}

/**
 * Plugin Configuration
 */
export interface PluginConfiguration {
  /** Plugin name */
  name: string
  /** Enable plugin */
  enabled: boolean
  /** Plugin configuration */
  config?: Record<string, any>
}

/**
 * Application Template Configuration
 */
export interface ApplicationTemplateConfig {
  /** Application name */
  appName: string
  /** Application version */
  appVersion: string
  /** Default theme */
  defaultTheme: TerminalTheme | string
  /** UI theme configuration */
  uiTheme: ThemeConfig
  /** Plugin configurations */
  plugins: PluginConfiguration[]
  /** Enabled capabilities */
  capabilities: {
    terminal?: boolean
    data?: boolean
    ui?: boolean
  }
  /** Feature flags */
  features: {
    multiTab?: boolean
    gestureSupport?: boolean
    voiceControl?: boolean
    accessibility?: boolean
  }
  /** Custom configuration */
  customConfig?: Record<string, any>
}

/**
 * Application Template
 */
export interface IApplicationTemplate {
  /** Template metadata */
  metadata: ApplicationTemplateMetadata
  
  /** Template configuration */
  config: ApplicationTemplateConfig
  
  /**
   * Validate template configuration
   * @returns Validation result
   */
  validate(): {
    valid: boolean
    errors: string[]
  }
  
  /**
   * Get template summary
   * @returns Template summary
   */
  getSummary(): {
    name: string
    description: string
    category: string
    features: string[]
  }
  
  /**
   * Export template to JSON
   * @returns JSON string
   */
  toJSON(): string
  
  /**
   * Clone template
   * @returns Cloned template
   */
  clone(): IApplicationTemplate
}

/**
 * Application Template Factory
 * Factory function for creating application templates
 */
export type ApplicationTemplateFactory = () => IApplicationTemplate | Promise<IApplicationTemplate>