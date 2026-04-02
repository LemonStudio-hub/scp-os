/**
 * Base Application Template
 * Base implementation for application templates
 */

import type { IApplicationTemplate, ApplicationTemplateMetadata, ApplicationTemplateConfig } from './application-template.interface'

/**
 * Base Application Template
 * Provides common functionality for application templates
 */
export abstract class BaseApplicationTemplate implements IApplicationTemplate {
  abstract metadata: ApplicationTemplateMetadata
  abstract config: ApplicationTemplateConfig
  
  /**
   * Validate template configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Validate app name
    if (!this.config.appName || this.config.appName.trim() === '') {
      errors.push('Application name is required')
    }
    
    // Validate app version
    if (!this.config.appVersion || this.config.appVersion.trim() === '') {
      errors.push('Application version is required')
    }
    
    // Validate plugins
    if (!Array.isArray(this.config.plugins)) {
      errors.push('Plugins must be an array')
    } else {
      this.config.plugins.forEach((plugin, index) => {
        if (!plugin.name) {
          errors.push(`Plugin at index ${index} must have a name`)
        }
      })
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Get template summary
   */
  getSummary(): {
    name: string
    description: string
    category: string
    features: string[]
  } {
    const features: string[] = []
    
    if (this.config.features.multiTab) features.push('Multi-tab support')
    if (this.config.features.gestureSupport) features.push('Gesture controls')
    if (this.config.features.voiceControl) features.push('Voice control')
    if (this.config.features.accessibility) features.push('Accessibility features')
    
    return {
      name: this.metadata.name,
      description: this.metadata.description,
      category: this.metadata.category,
      features
    }
  }
  
  /**
   * Export template to JSON
   */
  toJSON(): string {
    return JSON.stringify({
      metadata: this.metadata,
      config: this.config
    }, null, 2)
  }
  
  /**
   * Clone template
   */
  clone(): IApplicationTemplate {
    const cloned = new (this.constructor as any)()
    cloned.metadata = { ...this.metadata }
    cloned.config = JSON.parse(JSON.stringify(this.config))
    return cloned
  }
}

/**
 * Simple Application Template
 * Simplified implementation for basic application templates
 */
export class SimpleApplicationTemplate extends BaseApplicationTemplate {
  constructor(
    metadata: ApplicationTemplateMetadata,
    config: ApplicationTemplateConfig
  ) {
    super()
    this.metadata = metadata
    this.config = config
  }
}