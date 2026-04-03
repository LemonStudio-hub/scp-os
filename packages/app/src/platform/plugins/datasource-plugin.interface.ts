/**
 * Data Source Plugin Interface
 * Interface for data source plugins in the SCP-OS platform
 */

import type { Plugin } from './plugin.interface'

/**
 * Data Source Query Options
 */
export interface DataSourceQueryOptions {
  /** Limit number of results */
  limit?: number
  /** Offset for pagination */
  offset?: number
  /** Search keyword */
  keyword?: string
  /** Filter by object class */
  objectClass?: string
  /** Sort field */
  sort?: string
  /** Sort direction */
  sortDirection?: 'asc' | 'desc'
}

/**
 * Data Source Query Result
 */
export interface DataSourceQueryResult<T = any> {
  /** Query results */
  data: T[]
  /** Total number of results */
  total: number
  /** Whether there are more results */
  hasMore: boolean
}

/**
 * Data Source Metadata
 */
export interface DataSourceMetadata {
  /** Data source name */
  name: string
  /** Data source description */
  description: string
  /** Data source author */
  author: string
  /** Data source version */
  version: string
  /** Data source URL (if remote) */
  url?: string
  /** Data source type (e.g., 'api', 'database', 'file') */
  type: 'api' | 'database' | 'file' | 'memory'
  /** Data source capabilities */
  capabilities: string[]
  /** Whether data source is readonly */
  readonly?: boolean
  /** Authentication required */
  requiresAuth?: boolean
}

/**
 * Data Source Definition
 */
export interface DataSourceDefinition {
  /** Data source ID */
  id: string
  /** Data source name */
  name: string
  /** Data source metadata */
  metadata: DataSourceMetadata
}

/**
 * Data Source Plugin
 * Plugin for providing data sources
 */
export interface IDataSourcePlugin extends Plugin {
  /** Plugin type identifier */
  type: 'datasource'
  
  /** Data source metadata */
  metadata: DataSourceMetadata
  
  /** Data source definitions provided by this plugin */
  dataSources: DataSourceDefinition[]
  
  /**
   * Query data from the data source
   * @param dataSourceId Data source ID
   * @param options Query options
   * @returns Query results
   */
  query<T = any>(dataSourceId: string, options: DataSourceQueryOptions): Promise<DataSourceQueryResult<T>>
  
  /**
   * Get a single item by ID
   * @param dataSourceId Data source ID
   * @param id Item ID
   * @returns Item or null
   */
  get<T = any>(dataSourceId: string, id: string): Promise<T | null>
  
  /**
   * Search for items
   * @param dataSourceId Data source ID
   * @param keyword Search keyword
   * @param options Additional query options
   * @returns Search results
   */
  search<T = any>(dataSourceId: string, keyword: string, options?: DataSourceQueryOptions): Promise<DataSourceQueryResult<T>>
  
  /**
   * Get data source by ID
   * @param dataSourceId Data source ID
   * @returns Data source definition or null
   */
  getDataSource(dataSourceId: string): DataSourceDefinition | null
  
  /**
   * Get all data source IDs
   * @returns Array of data source IDs
   */
  getDataSourceIds(): string[]
  
  /**
   * Check if plugin provides a specific data source
   * @param dataSourceId Data source ID
   * @returns True if data source exists
   */
  hasDataSource(dataSourceId: string): boolean
  
  /**
   * Test connection to data source
   * @param dataSourceId Data source ID
   * @returns True if connection successful
   */
  testConnection(dataSourceId: string): Promise<boolean>
  
  /**
   * Get data source statistics
   * @param dataSourceId Data source ID
   * @returns Statistics
   */
  getStatistics(dataSourceId: string): Promise<{
    totalItems: number
    lastUpdated?: string
    [key: string]: any
  }>
}

/**
 * Data Source Plugin Factory
 * Factory function for creating data source plugins
 */
export type DataSourcePluginFactory = () => IDataSourcePlugin | Promise<IDataSourcePlugin>