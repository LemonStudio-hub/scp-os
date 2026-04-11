/**
 * Extension Point System
 * Provides extension points for plugins to extend the platform
 */

import type { Extension, ExtensionPoint, ExtensionMetadata } from '../plugins/types'
import logger from '../../utils/logger'

/**
 * Generic extension point
 */
class GenericExtensionPoint<T = unknown> implements ExtensionPoint<T> {
  id: string
  name: string
  description: string
  extensions: Map<string, Extension<T>>
  metadata: ExtensionMetadata

  constructor(id: string, name: string, description: string) {
    this.id = id
    this.name = name
    this.description = description
    this.extensions = new Map()
    this.metadata = {
      id,
      name,
      description,
      extensions: [],
      createdAt: Date.now()
    }
  }

  register(extension: Extension<T>): void {
    if (this.extensions.has(extension.id)) {
      throw new Error(`Extension with id ${extension.id} already exists`)
    }

    this.extensions.set(extension.id, extension)
    this.metadata.extensions.push({
      id: extension.id,
      name: extension.name,
      description: extension.description || '',
      version: extension.version || '1.0.0',
      author: extension.author || 'Unknown'
    })

    logger.info(`Registered extension ${extension.id} in ${this.id}`)
  }

  unregister(extensionId: string): void {
    if (!this.extensions.has(extensionId)) {
      throw new Error(`Extension with id ${extensionId} not found`)
    }

    this.extensions.delete(extensionId)
    this.metadata.extensions = this.metadata.extensions.filter(
      (e: { id: string }) => e.id !== extensionId
    )

    logger.info(`Unregistered extension ${extensionId} from ${this.id}`)
  }

  get(extensionId: string): Extension<T> | undefined {
    return this.extensions.get(extensionId)
  }

  getAll(): Extension<T>[] {
    return Array.from(this.extensions.values())
  }

  has(extensionId: string): boolean {
    return this.extensions.has(extensionId)
  }

  clear(): void {
    this.extensions.clear()
    this.metadata.extensions = []
    logger.info(`Cleared all extensions from ${this.id}`)
  }
}

/**
 * Extension Registry
 * Central registry for all extension points
 */
export class ExtensionRegistry {
  private extensionPoints: Map<string, ExtensionPoint>

  constructor() {
    this.extensionPoints = new Map()

    // Register built-in extension points
    this.registerBuiltInExtensionPoints()

    logger.info('Extension registry initialized')
  }

  /**
   * Register built-in extension points
   */
  private registerBuiltInExtensionPoints(): void {
    // Command extension point
    this.registerExtensionPoint(
      'command',
      'Command',
      'Extension point for registering terminal commands'
    )

    // Theme extension point
    this.registerExtensionPoint(
      'theme',
      'Theme',
      'Extension point for registering UI themes'
    )

    // Data source extension point
    this.registerExtensionPoint(
      'data-source',
      'Data Source',
      'Extension point for registering data sources'
    )

    // UI component extension point
    this.registerExtensionPoint(
      'ui-component',
      'UI Component',
      'Extension point for registering UI components'
    )
  }

  /**
   * Register an extension point
   */
  registerExtensionPoint(
    id: string,
    name: string,
    description: string
  ): ExtensionPoint {
    if (this.extensionPoints.has(id)) {
      throw new Error(`Extension point ${id} already exists`)
    }

    const extensionPoint = new GenericExtensionPoint(id, name, description)
    this.extensionPoints.set(id, extensionPoint)

    logger.info(`Registered extension point: ${id}`)

    return extensionPoint
  }

  /**
   * Unregister an extension point
   */
  unregisterExtensionPoint(id: string): void {
    if (!this.extensionPoints.has(id)) {
      throw new Error(`Extension point ${id} not found`)
    }

    this.extensionPoints.delete(id)

    logger.info(`Unregistered extension point: ${id}`)
  }

  /**
   * Get an extension point
   */
  getExtensionPoint<T = unknown>(id: string): ExtensionPoint<T> | undefined {
    return this.extensionPoints.get(id) as ExtensionPoint<T>
  }

  /**
   * Get all extension points
   */
  getAllExtensionPoints(): ExtensionPoint[] {
    return Array.from(this.extensionPoints.values())
  }

  /**
   * Check if extension point exists
   */
  hasExtensionPoint(id: string): boolean {
    return this.extensionPoints.has(id)
  }

  /**
   * Register an extension to an extension point
   */
  registerExtension<T = unknown>(
    extensionPointId: string,
    extension: Extension<T>
  ): void {
    const extensionPoint = this.getExtensionPoint<T>(extensionPointId)

    if (!extensionPoint) {
      throw new Error(`Extension point ${extensionPointId} not found`)
    }

    extensionPoint.register(extension)
  }

  /**
   * Unregister an extension from an extension point
   */
  unregisterExtension(extensionPointId: string, extensionId: string): void {
    const extensionPoint = this.getExtensionPoint(extensionPointId)

    if (!extensionPoint) {
      throw new Error(`Extension point ${extensionPointId} not found`)
    }

    extensionPoint.unregister(extensionId)
  }

  /**
   * Get an extension from an extension point
   */
  getExtension<T = any>(
    extensionPointId: string,
    extensionId: string
  ): Extension<T> | undefined {
    const extensionPoint = this.getExtensionPoint<T>(extensionPointId)

    if (!extensionPoint) {
      throw new Error(`Extension point ${extensionPointId} not found`)
    }

    return extensionPoint.get(extensionId)
  }

  /**
   * Get all extensions from an extension point
   */
  getExtensions<T = any>(extensionPointId: string): Extension<T>[] {
    const extensionPoint = this.getExtensionPoint<T>(extensionPointId)

    if (!extensionPoint) {
      throw new Error(`Extension point ${extensionPointId} not found`)
    }

    return extensionPoint.getAll()
  }

  /**
   * Clear all extensions from an extension point
   */
  clearExtensions(extensionPointId: string): void {
    const extensionPoint = this.getExtensionPoint(extensionPointId)

    if (!extensionPoint) {
      throw new Error(`Extension point ${extensionPointId} not found`)
    }

    extensionPoint.clear()
  }

  /**
   * Clear all extension points
   */
  clear(): void {
    this.extensionPoints.clear()
    logger.info('Cleared all extension points')
  }

  /**
   * Register a command extension
   */
  registerCommand(command: any): void {
    // Register main command
    this.registerExtension('command', {
      id: command.name,
      name: command.name,
      description: command.description,
      data: command
    })

    // Register aliases if they exist
    if (command.aliases && Array.isArray(command.aliases)) {
      for (const alias of command.aliases) {
        this.registerExtension('command', {
          id: alias,
          name: command.name,
          description: command.description,
          data: command
        })
      }
    }
  }

  /**
   * Register a theme extension
   */
  registerTheme(theme: any): void {
    this.registerExtension('theme', {
      id: theme.name,
      name: theme.name,
      description: 'Theme',
      data: theme
    })
  }

  /**
   * Register a data source extension
   */
  registerDataSource(source: any): void {
    this.registerExtension('data-source', {
      id: source.name,
      name: source.name,
      description: 'Data source',
      data: source
    })
  }

  /**
   * Register a UI component extension
   */
  registerUIComponent(component: any): void {
    this.registerExtension('ui-component', {
      id: component.name,
      name: component.name,
      description: 'UI component',
      data: component
    })
  }

  /**
   * Unregister a command extension
   */
  unregisterCommand(command: any): void {
    this.unregisterExtension('command', command.name)
  }

  /**
   * Unregister a theme extension
   */
  unregisterTheme(theme: any): void {
    this.unregisterExtension('theme', theme.name)
  }

  /**
   * Unregister a data source extension
   */
  unregisterDataSource(source: any): void {
    this.unregisterExtension('data-source', source.name)
  }

  /**
   * Unregister a UI component extension
   */
  unregisterUIComponent(component: any): void {
    this.unregisterExtension('ui-component', component.name)
  }

  /**
   * Get a command extension
   */
  getCommand(commandName: string): any {
    return this.getExtension('command', commandName)
  }

  /**
   * Get a theme extension
   */
  getTheme(themeName: string): any {
    return this.getExtension('theme', themeName)
  }
}

/**
 * Global extension registry instance
 */
let globalExtensionRegistry: ExtensionRegistry | null = null

/**
 * Get or create the global extension registry
 */
export function getGlobalExtensionRegistry(): ExtensionRegistry {
  if (!globalExtensionRegistry) {
    globalExtensionRegistry = new ExtensionRegistry()
  }
  return globalExtensionRegistry
}

/**
 * Reset the global extension registry
 */
export function resetGlobalExtensionRegistry(): void {
  globalExtensionRegistry = null
}