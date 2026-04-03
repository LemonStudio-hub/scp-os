/**
 * UI Component Plugin Interface
 * Interface for UI component plugins in the SCP-OS platform
 */

import type { Plugin } from './plugin.interface'
import type { Component } from 'vue'

/**
 * UI Component Metadata
 */
export interface UIComponentMetadata {
  /** Component name */
  name: string
  /** Component description */
  description: string
  /** Component author */
  author: string
  /** Component version */
  version: string
  /** Component category (e.g., 'terminal', 'sidebar', 'status-bar') */
  category: string
  /** Component tags */
  tags?: string[]
  /** Component icon */
  icon?: string
  /** Component dependencies (other components) */
  componentDependencies?: string[]
}

/**
 * UI Component Definition
 */
export interface UIComponentDefinition {
  /** Component ID */
  id: string
  /** Component name */
  name: string
  /** Component metadata */
  metadata: UIComponentMetadata
  /** Vue component */
  component: Component
  /** Component props definition */
  props?: Record<string, any>
  /** Component events definition */
  events?: string[]
  /** Component slots definition */
  slots?: string[]
}

/**
 * UI Component Plugin
 * Plugin for providing UI components
 */
export interface IUIComponentPlugin extends Plugin {
  /** Plugin type identifier */
  type: 'ui'
  
  /** UI component metadata */
  metadata: UIComponentMetadata
  
  /** UI component definitions provided by this plugin */
  components: UIComponentDefinition[]
  
  /**
   * Get a component by ID
   * @param componentId Component ID
   * @returns Component definition or null
   */
  getComponent(componentId: string): UIComponentDefinition | null
  
  /**
   * Get all component IDs
   * @returns Array of component IDs
   */
  getComponentIds(): string[]
  
  /**
   * Check if plugin provides a specific component
   * @param componentId Component ID
   * @returns True if component exists
   */
  hasComponent(componentId: string): boolean
  
  /**
   * Get components by category
   * @param category Component category
   * @returns Array of component definitions
   */
  getComponentsByCategory(category: string): UIComponentDefinition[]
  
  /**
   * Get default component for this plugin
   * @returns Default component definition
   */
  getDefaultComponent(): UIComponentDefinition
}

/**
 * UI Component Plugin Factory
 * Factory function for creating UI component plugins
 */
export type UIComponentPluginFactory = () => IUIComponentPlugin | Promise<IUIComponentPlugin>