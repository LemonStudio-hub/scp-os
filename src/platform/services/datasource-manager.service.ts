/**
 * Data Source Manager Service
 * Manages data source plugins and data access
 */

import type { IDataSourcePlugin } from '../plugins/datasource-plugin.interface'
import type { DataSourceDefinition, DataSourceQueryOptions, DataSourceQueryResult } from '../plugins/datasource-plugin.interface'
import type { IEventBus } from '../events/event-bus'

/**
 * Data Source Manager Service
 * Central manager for all data sources
 */
export class DataSourceManagerService {
  private dataSources: Map<string, DataSourceDefinition> = new Map()
  private plugins: Map<string, IDataSourcePlugin> = new Map()
  private eventBus: IEventBus | null = null
  
  constructor(eventBus?: IEventBus) {
    this.eventBus = eventBus || null
  }
  
  /**
   * Register a data source plugin
   */
  async registerPlugin(plugin: IDataSourcePlugin): Promise<void> {
    // Load plugin
    if (plugin.onLoad) {
      await plugin.onLoad()
    }
    
    // Register all data sources from the plugin
    for (const dataSource of plugin.dataSources) {
      this.registerDataSource(dataSource)
    }
    
    // Store plugin reference
    this.plugins.set(plugin.name, plugin)
    
    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('datasource:plugin:registered', { 
        pluginName: plugin.name,
        dataSources: plugin.getDataSourceIds()
      })
    }
  }
  
  /**
   * Unregister a data source plugin
   */
  async unregisterPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) {
      return
    }
    
    // Unregister all data sources from the plugin
    for (const dataSourceId of plugin.getDataSourceIds()) {
      this.unregisterDataSource(dataSourceId)
    }
    
    // Unload plugin
    if (plugin.onUnload) {
      await plugin.onUnload()
    }
    
    // Remove plugin reference
    this.plugins.delete(pluginName)
    
    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('datasource:plugin:unregistered', { 
        pluginName 
      })
    }
  }
  
  /**
   * Register a data source definition
   */
  registerDataSource(dataSource: DataSourceDefinition): void {
    this.dataSources.set(dataSource.id, dataSource)
    
    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('datasource:registered', { 
        dataSourceId: dataSource.id,
        dataSourceName: dataSource.name
      })
    }
  }
  
  /**
   * Unregister a data source
   */
  unregisterDataSource(dataSourceId: string): void {
    this.dataSources.delete(dataSourceId)
    
    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('datasource:unregistered', { 
        dataSourceId 
      })
    }
  }
  
  /**
   * Query data from a data source
   */
  async query<T = any>(dataSourceId: string, options: DataSourceQueryOptions): Promise<DataSourceQueryResult<T>> {
    const plugin = this.getPluginByDataSourceId(dataSourceId)
    if (!plugin) {
      throw new Error(`Plugin not found for data source ${dataSourceId}`)
    }
    
    return plugin.query<T>(dataSourceId, options)
  }
  
  /**
   * Get a single item by ID
   */
  async get<T = any>(dataSourceId: string, id: string): Promise<T | null> {
    const plugin = this.getPluginByDataSourceId(dataSourceId)
    if (!plugin) {
      throw new Error(`Plugin not found for data source ${dataSourceId}`)
    }
    
    return plugin.get<T>(dataSourceId, id)
  }
  
  /**
   * Search for items
   */
  async search<T = any>(dataSourceId: string, keyword: string, options?: DataSourceQueryOptions): Promise<DataSourceQueryResult<T>> {
    const plugin = this.getPluginByDataSourceId(dataSourceId)
    if (!plugin) {
      throw new Error(`Plugin not found for data source ${dataSourceId}`)
    }
    
    return plugin.search<T>(dataSourceId, keyword, options)
  }
  
  /**
   * Get a data source by ID
   */
  getDataSource(dataSourceId: string): DataSourceDefinition | null {
    return this.dataSources.get(dataSourceId) || null
  }
  
  /**
   * Get all data sources
   */
  getAllDataSources(): DataSourceDefinition[] {
    return Array.from(this.dataSources.values())
  }
  
  /**
   * Get plugin by data source ID
   */
  getPluginByDataSourceId(dataSourceId: string): IDataSourcePlugin | undefined {
    for (const plugin of this.plugins.values()) {
      if (plugin.hasDataSource(dataSourceId)) {
        return plugin
      }
    }
    return undefined
  }
  
  /**
   * Get all plugins
   */
  getAllPlugins(): IDataSourcePlugin[] {
    return Array.from(this.plugins.values())
  }
  
  /**
   * Test connection to a data source
   */
  async testConnection(dataSourceId: string): Promise<boolean> {
    const plugin = this.getPluginByDataSourceId(dataSourceId)
    if (!plugin) {
      return false
    }
    
    return plugin.testConnection(dataSourceId)
  }
  
  /**
   * Get statistics for a data source
   */
  async getStatistics(dataSourceId: string): Promise<{
    totalItems: number
    lastUpdated?: string
    [key: string]: any
  }> {
    const plugin = this.getPluginByDataSourceId(dataSourceId)
    if (!plugin) {
      throw new Error(`Plugin not found for data source ${dataSourceId}`)
    }
    
    return plugin.getStatistics(dataSourceId)
  }
  
  /**
   * Get data sources by type
   */
  getDataSourcesByType(type: string): DataSourceDefinition[] {
    return this.getAllDataSources().filter(ds => ds.metadata.type === type)
  }
  
  /**
   * Get statistics
   */
  getStatistics(): {
    totalDataSources: number
    totalPlugins: number
    types: Record<string, number>
  } {
    const dataSources = this.getAllDataSources()
    const types: Record<string, number> = {}
    
    for (const ds of dataSources) {
      const type = ds.metadata.type
      types[type] = (types[type] || 0) + 1
    }
    
    return {
      totalDataSources: dataSources.length,
      totalPlugins: this.plugins.size,
      types
    }
  }
  
  /**
   * Clear all data sources
   */
  clear(): void {
    this.dataSources.clear()
    this.plugins.clear()
    
    // Emit event
    if (this.eventBus) {
      this.eventBus.emit('datasource:registry:cleared')
    }
  }
}