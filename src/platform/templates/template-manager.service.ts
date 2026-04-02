/**
 * Application Template Manager Service
 * Manages application templates and their lifecycle
 */

import type { IApplicationTemplate, ApplicationTemplateMetadata, ApplicationTemplateConfig } from './application-template.interface'
import type { IEventBus } from '../events/event-bus'
import { SimpleApplicationTemplate } from './base-application-template'

/**
 * Application Template Manager Service
 * Central manager for all application templates
 */
export class ApplicationTemplateManagerService {
  private templates: Map<string, IApplicationTemplate> = new Map()
  private currentTemplateId: string | null = null
  private eventBus: IEventBus | null = null
  
  constructor(eventBus?: IEventBus) {
    this.eventBus = eventBus || null
  }
  
  /**
   * Register an application template
   * @param template Application template
   */
  registerTemplate(template: IApplicationTemplate): void {
    // Validate template
    const validation = template.validate()
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`)
    }
    
    this.templates.set(template.metadata.id, template)
    
    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('template:registered', { 
        templateId: template.metadata.id,
        templateName: template.metadata.name
      })
    }
  }
  
  /**
   * Unregister an application template
   * @param templateId Template ID
   */
  unregisterTemplate(templateId: string): void {
    // If this is the current template, switch to default
    if (this.currentTemplateId === templateId) {
      this.currentTemplateId = null
    }
    
    this.templates.delete(templateId)
    
    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('template:unregistered', { 
        templateId 
      })
    }
  }
  
  /**
   * Get a template by ID
   * @param templateId Template ID
   * @returns Template or null
   */
  getTemplate(templateId: string): IApplicationTemplate | null {
    return this.templates.get(templateId) || null
  }
  
  /**
   * Get all templates
   * @returns Array of templates
   */
  getAllTemplates(): IApplicationTemplate[] {
    return Array.from(this.templates.values())
  }
  
  /**
   * Get current template
   * @returns Current template or null
   */
  getCurrentTemplate(): IApplicationTemplate | null {
    if (this.currentTemplateId === null) {
      return null
    }
    return this.templates.get(this.currentTemplateId) || null
  }
  
  /**
   * Set current template
   * @param templateId Template ID
   */
  setCurrentTemplate(templateId: string): void {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }
    
    // Validate template before setting as current
    const validation = template.validate()
    if (!validation.valid) {
      throw new Error(`Cannot set invalid template: ${validation.errors.join(', ')}`)
    }
    
    this.currentTemplateId = templateId
    
    // Apply template configuration
    this.applyTemplate(template)
    
    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('template:changed', { 
        templateId,
        templateName: template.metadata.name
      })
    }
  }
  
  /**
   * Apply template configuration
   * @param template Template to apply
   */
  private applyTemplate(template: IApplicationTemplate): void {
    const config = template.config
    
    // Apply UI theme
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      
      // Apply UI theme colors
      if (config.uiTheme.primary) {
        root.style.setProperty('--ui-primary', config.uiTheme.primary)
      }
      if (config.uiTheme.secondary) {
        root.style.setProperty('--ui-secondary', config.uiTheme.secondary)
      }
      if (config.uiTheme.accent) {
        root.style.setProperty('--ui-accent', config.uiTheme.accent)
      }
      if (config.uiTheme.background) {
        root.style.setProperty('--ui-background', config.uiTheme.background)
      }
      if (config.uiTheme.surface) {
        root.style.setProperty('--ui-surface', config.uiTheme.surface)
      }
      if (config.uiTheme.text) {
        root.style.setProperty('--ui-text', config.uiTheme.text)
      }
      
      // Apply custom CSS variables
      if (config.uiTheme.cssVariables) {
        Object.entries(config.uiTheme.cssVariables).forEach(([key, value]) => {
          root.style.setProperty(key, value)
        })
      }
    }
  }
  
  /**
   * Get templates by category
   * @param category Template category
   * @returns Array of templates
   */
  getTemplatesByCategory(category: string): IApplicationTemplate[] {
    return this.getAllTemplates().filter(template => 
      template.metadata.category === category
    )
  }
  
  /**
   * Get all categories
   * @returns Array of category names
   */
  getCategories(): string[] {
    const categories = new Set<string>()
    for (const template of this.templates.values()) {
      categories.add(template.metadata.category)
    }
    return Array.from(categories)
  }
  
  /**
   * Search templates by keyword
   * @param keyword Search keyword
   * @returns Array of matching templates
   */
  searchTemplates(keyword: string): IApplicationTemplate[] {
    const lowerKeyword = keyword.toLowerCase()
    return this.getAllTemplates().filter(template => 
      template.metadata.name.toLowerCase().includes(lowerKeyword) ||
      template.metadata.description.toLowerCase().includes(lowerKeyword) ||
      template.metadata.tags?.some(tag => tag.toLowerCase().includes(lowerKeyword))
    )
  }
  
  /**
   * Clone a template
   * @param templateId Template ID
   * @returns Cloned template
   */
  cloneTemplate(templateId: string): IApplicationTemplate | null {
    const template = this.getTemplate(templateId)
    return template ? template.clone() : null
  }
  
  /**
   * Export template to JSON
   * @param templateId Template ID
   * @returns JSON string
   */
  exportTemplate(templateId: string): string {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }
    return template.toJSON()
  }
  
  /**
   * Import template from JSON
   * @param json JSON string
   * @returns Imported template
   */
  importTemplate(json: string): IApplicationTemplate {
    const data = JSON.parse(json)
    
    // Validate data structure
    if (!data.metadata || !data.config) {
      throw new Error('Invalid template JSON: missing metadata or config')
    }
    
    // Create template instance (this is simplified, real implementation would use a registry)
    const template = new SimpleApplicationTemplate(data.metadata, data.config)
    this.registerTemplate(template)
    
    return template
  }
  
  /**
   * Get statistics
   * @returns Statistics about registered templates
   */
  getStatistics(): {
    totalTemplates: number
    totalCategories: number
    currentTemplate: string | null
    categoryCounts: Record<string, number>
  } {
    const categoryCounts: Record<string, number> = {}
    
    for (const template of this.templates.values()) {
      const category = template.metadata.category
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    }
    
    return {
      totalTemplates: this.templates.size,
      totalCategories: this.getCategories().length,
      currentTemplate: this.currentTemplateId,
      categoryCounts
    }
  }
  
  /**
   * Clear all templates
   */
  clear(): void {
    this.templates.clear()
    this.currentTemplateId = null
    
    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('template:registry:cleared')
    }
  }
}