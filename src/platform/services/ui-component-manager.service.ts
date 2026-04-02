/**
 * UI Component Manager Service
 * Manages UI component plugins and component registration
 */

import type { IUIComponentPlugin } from '../plugins/ui-component-plugin.interface'
import type { UIComponentDefinition } from '../plugins/ui-component-plugin.interface'
import type { IEventBus } from '../events/event-bus'
import type { Component } from 'vue'

/**
 * UI Component Manager Service
 * Central manager for all UI components
 */
export class UIComponentManagerService {
  private components: Map<string, UIComponentDefinition> = new Map()
  private plugins: Map<string, IUIComponentPlugin> = new Map()
  private componentRegistry: Map<string, Component> = new Map()
  private eventBus: IEventBus | null = null
  
  constructor(eventBus?: IEventBus) {
    this.eventBus = eventBus || null
  }
  
  /**
   * Register a UI component plugin
   */
  async registerPlugin(plugin: IUIComponentPlugin): Promise<void> {
    // Load plugin
    if (plugin.onLoad) {
      await plugin.onLoad()
    }
    
    // Register all components from the plugin
    for (const component of plugin.components) {
      this.registerComponent(component)
    }
    
    // Store plugin reference
    this.plugins.set(plugin.name, plugin)
    
    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('ui-component:plugin:registered', { 
        pluginName: plugin.name,
        components: plugin.getComponentIds()
      })
    }
  }
  
  /**
   * Unregister a UI component plugin
   */
  async unregisterPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) {
      return
    }
    
    // Unregister all components from the plugin
    for (const componentId of plugin.getComponentIds()) {
      this.unregisterComponent(componentId)
    }
    
    // Unload plugin
    if (plugin.onUnload) {
      await plugin.onUnload()
    }
    
    // Remove plugin reference
    this.plugins.delete(pluginName)
    
    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('ui-component:plugin:unregistered', { 
        pluginName 
      })
    }
  }
  
  /**
   * Register a UI component definition
   */
  registerComponent(component: UIComponentDefinition): void {
    this.components.set(component.id, component)
    
    // Register Vue component
    this.componentRegistry.set(component.id, component.component)
    
    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('ui-component:registered', { 
        componentId: component.id,
        componentName: component.name,
        category: component.metadata.category
      })
    }
  }
  
  /**
   * Unregister a UI component
   */
  unregisterComponent(componentId: string): void {
    this.components.delete(componentId)
    this.componentRegistry.delete(componentId)
    
    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('ui-component:unregistered', { 
        componentId 
      })
    }
  }
  
  /**
   * Get a component by ID
   */
  getComponent(componentId: string): UIComponentDefinition | null {
    return this.components.get(componentId) || null
  }
  
  /**
   * Get all components
   */
  getAllComponents(): UIComponentDefinition[] {
    return Array.from(this.components.values())
  }
  
  /**
   * Get Vue component by ID
   */
  getVueComponent(componentId: string): Component | null {
    return this.componentRegistry.get(componentId) || null
  }
  
  /**
   * Get plugin by component ID
   */
  getPluginByComponentId(componentId: string): IUIComponentPlugin | undefined {
    for (const plugin of this.plugins.values()) {
      if (plugin.hasComponent(componentId)) {
        return plugin
      }
    }
    return undefined
  }
  
  /**
   * Get all plugins
   */
  getAllPlugins(): IUIComponentPlugin[] {
    return Array.from(this.plugins.values())
  }
  
  /**
   * Get components by category
   */
  getComponentsByCategory(category: string): UIComponentDefinition[] {
    return this.getAllComponents().filter(comp => comp.metadata.category === category)
  }
  
  /**
   * Get all categories
   */
  getCategories(): string[] {
    const categories = new Set<string>()
    for (const component of this.components.values()) {
      categories.add(component.metadata.category)
    }
    return Array.from(categories)
  }
  
  /**
   * Search components by keyword
   */
  searchComponents(keyword: string): UIComponentDefinition[] {
    const lowerKeyword = keyword.toLowerCase()
    return this.getAllComponents().filter(comp => 
      comp.name.toLowerCase().includes(lowerKeyword) ||
      comp.metadata.description.toLowerCase().includes(lowerKeyword) ||
      comp.metadata.tags?.some(tag => tag.toLowerCase().includes(lowerKeyword))
    )
  }
  
  /**
   * Get statistics
   */
  getStatistics(): {
    totalComponents: number
    totalPlugins: number
    totalCategories: number
    categoryCounts: Record<string, number>
  } {
    const categoryCounts: Record<string, number> = {}
    
    for (const component of this.components.values()) {
      const category = component.metadata.category
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    }
    
    return {
      totalComponents: this.components.size,
      totalPlugins: this.plugins.size,
      totalCategories: this.getCategories().length,
      categoryCounts
    }
  }
  
  /**
   * Clear all components
   */
  clear(): void {
    this.components.clear()
    this.componentRegistry.clear()
    this.plugins.clear()
    
    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('ui-component:registry:cleared')
    }
  }
}