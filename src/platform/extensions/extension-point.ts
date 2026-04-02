/**
 * Extension Point System
 * Manages extensible points in the application where plugins can register their extensions
 */

import type {
  CommandDefinition,
  ThemeDefinition,
  DataSourceDefinition,
  UIComponentDefinition
} from '../plugins/types'

/**
 * Generic extension point interface
 */
export interface ExtensionPoint<T = any> {
  /** Extension point name */
  name: string
  /** Extension point description */
  description?: string
  /** Register an extension */
  register(extension: T): void
  /** Unregister an extension */
  unregister(extension: T): void
  /** Get all extensions */
  getAll(): T[]
  /** Get extension by name */
  get(name: string): T | undefined
  /** Check if extension exists */
  has(name: string): boolean
}

/**
 * Generic extension point implementation
 */
export class GenericExtensionPoint<T = any> implements ExtensionPoint<T> {
  private extensions = new Map<string, T>()

  constructor(
    public name: string,
    public description?: string
  ) {}

  register(extension: T): void {
    const extName = this.getExtensionName(extension)
    if (this.extensions.has(extName)) {
      console.warn(
        `[ExtensionPoint] Extension "${extName}" is already registered in point "${this.name}". Replacing...`
      )
    }
    this.extensions.set(extName, extension)
  }

  unregister(extension: T): void {
    const extName = this.getExtensionName(extension)
    this.extensions.delete(extName)
  }

  getAll(): T[] {
    return Array.from(this.extensions.values())
  }

  get(name: string): T | undefined {
    return this.extensions.get(name)
  }

  has(name: string): boolean {
    return this.extensions.has(name)
  }

  clear(): void {
    this.extensions.clear()
  }

  private getExtensionName(extension: T): string {
    // Handle different extension types
    if (typeof extension === 'object' && extension !== null) {
      if ('name' in extension && typeof extension.name === 'string') {
        return extension.name
      }
    }
    return String(extension)
  }
}

/**
 * Command extension point
 */
export class CommandExtensionPoint extends GenericExtensionPoint<CommandDefinition> {
  constructor() {
    super('commands', 'Extension point for terminal commands')
  }

  register(extension: CommandDefinition): void {
    super.register(extension)
  }

  unregister(extension: CommandDefinition): void {
    // Also unregister aliases
    if (extension.aliases) {
      for (const alias of extension.aliases) {
        this.extensions.delete(alias)
      }
    }
    super.unregister(extension)
  }

  get(name: string): CommandDefinition | undefined {
    // Try to find by name or alias
    return (
      this.extensions.get(name) ||
      Array.from(this.extensions.values()).find(
        (cmd) => cmd.aliases?.includes(name)
      )
    )
  }

  has(name: string): boolean {
    return (
      this.extensions.has(name) ||
      Array.from(this.extensions.values()).some(
        (cmd) => cmd.aliases?.includes(name)
      )
    )
  }
}

/**
 * Theme extension point
 */
export class ThemeExtensionPoint extends GenericExtensionPoint<ThemeDefinition> {
  constructor() {
    super('themes', 'Extension point for UI themes')
  }
}

/**
 * Data source extension point
 */
export class DataSourceExtensionPoint extends GenericExtensionPoint<DataSourceDefinition> {
  constructor() {
    super('datasources', 'Extension point for data sources')
  }
}

/**
 * UI component extension point
 */
export class UIComponentExtensionPoint extends GenericExtensionPoint<UIComponentDefinition> {
  constructor() {
    super('ui-components', 'Extension point for UI components')
  }

  getByPosition(position: string): UIComponentDefinition[] {
    return Array.from(this.extensions.values())
      .filter((comp) => comp.position === position)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  }
}

/**
 * Extension Registry
 * Central registry for all extension points
 */
export class ExtensionRegistry {
  private extensionPoints = new Map<string, ExtensionPoint>()

  constructor() {
    // Register built-in extension points
    this.registerExtensionPoint(new CommandExtensionPoint())
    this.registerExtensionPoint(new ThemeExtensionPoint())
    this.registerExtensionPoint(new DataSourceExtensionPoint())
    this.registerExtensionPoint(new UIComponentExtensionPoint())
  }

  registerExtensionPoint<T>(point: ExtensionPoint<T>): void {
    this.extensionPoints.set(point.name, point)
  }

  getExtensionPoint<T>(name: string): ExtensionPoint<T> | undefined {
    return this.extensionPoints.get(name) as ExtensionPoint<T>
  }

  getAllExtensionPoints(): ExtensionPoint[] {
    return Array.from(this.extensionPoints.values())
  }

  clear(): void {
    this.extensionPoints.forEach((point) => {
      if ('clear' in point && typeof point.clear === 'function') {
        ;(point as any).clear()
      }
    })
  }

  // Convenience methods for common extension points

  registerCommand(command: CommandDefinition): void {
    const point = this.getExtensionPoint<CommandDefinition>('commands')
    if (point) {
      point.register(command)
    }
  }

  unregisterCommand(command: CommandDefinition): void {
    const point = this.getExtensionPoint<CommandDefinition>('commands')
    if (point) {
      point.unregister(command)
    }
  }

  getCommand(name: string): CommandDefinition | undefined {
    const point = this.getExtensionPoint<CommandDefinition>('commands')
    return point?.get(name)
  }

  getAllCommands(): CommandDefinition[] {
    const point = this.getExtensionPoint<CommandDefinition>('commands')
    return point?.getAll() ?? []
  }

  registerTheme(theme: ThemeDefinition): void {
    const point = this.getExtensionPoint<ThemeDefinition>('themes')
    if (point) {
      point.register(theme)
    }
  }

  unregisterTheme(theme: ThemeDefinition): void {
    const point = this.getExtensionPoint<ThemeDefinition>('themes')
    if (point) {
      point.unregister(theme)
    }
  }

  getTheme(name: string): ThemeDefinition | undefined {
    const point = this.getExtensionPoint<ThemeDefinition>('themes')
    return point?.get(name)
  }

  getAllThemes(): ThemeDefinition[] {
    const point = this.getExtensionPoint<ThemeDefinition>('themes')
    return point?.getAll() ?? []
  }

  registerDataSource(source: DataSourceDefinition): void {
    const point = this.getExtensionPoint<DataSourceDefinition>('datasources')
    if (point) {
      point.register(source)
    }
  }

  unregisterDataSource(source: DataSourceDefinition): void {
    const point = this.getExtensionPoint<DataSourceDefinition>('datasources')
    if (point) {
      point.unregister(source)
    }
  }

  getDataSource(name: string): DataSourceDefinition | undefined {
    const point = this.getExtensionPoint<DataSourceDefinition>('datasources')
    return point?.get(name)
  }

  getAllDataSources(): DataSourceDefinition[] {
    const point = this.getExtensionPoint<DataSourceDefinition>('datasources')
    return point?.getAll() ?? []
  }

  registerUIComponent(component: UIComponentDefinition): void {
    const point = this.getExtensionPoint<UIComponentDefinition>('ui-components')
    if (point) {
      point.register(component)
    }
  }

  unregisterUIComponent(component: UIComponentDefinition): void {
    const point = this.getExtensionPoint<UIComponentDefinition>('ui-components')
    if (point) {
      point.unregister(component)
    }
  }

  getUIComponent(name: string): UIComponentDefinition | undefined {
    const point = this.getExtensionPoint<UIComponentDefinition>('ui-components')
    return point?.get(name)
  }

  getAllUIComponents(): UIComponentDefinition[] {
    const point = this.getExtensionPoint<UIComponentDefinition>('ui-components')
    return point?.getAll() ?? []
  }

  getUIComponentsByPosition(position: string): UIComponentDefinition[] {
    const point = this.getExtensionPoint<UIComponentDefinition>('ui-components')
    if (point && 'getByPosition' in point) {
      return (point as UIComponentExtensionPoint).getByPosition(position)
    }
    return []
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
  if (globalExtensionRegistry) {
    globalExtensionRegistry.clear()
  }
  globalExtensionRegistry = null
}