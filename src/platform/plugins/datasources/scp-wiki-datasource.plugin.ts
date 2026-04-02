/**
 * SCP Wiki Data Source Plugin
 * Provides SCP Wiki as a data source
 */

import type { IDataSourcePlugin, DataSourceMetadata, DataSourceDefinition, DataSourceQueryOptions, DataSourceQueryResult } from '../datasource-plugin.interface'
import type { SCPEntity } from '../../domain/entities'
import type { Plugin } from '../plugin.interface'

/**
 * SCP Wiki Data Source Plugin
 */
export class ScpWikiDataSourcePlugin implements IDataSourcePlugin {
  readonly type: 'datasource' = 'datasource'
  readonly name: string = 'scp-wiki-datasource'
  readonly version: string = '1.0.0'
  readonly description: string = 'SCP Wiki data source'
  readonly author: string = 'SCP-OS Team'
  
  metadata: DataSourceMetadata = {
    name: 'SCP Wiki',
    description: 'Official SCP Foundation Wiki',
    author: 'SCP Community',
    version: '1.0.0',
    url: 'https://scp-wiki-cn.wikidot.com',
    type: 'api',
    capabilities: ['query', 'search', 'get'],
    readonly: true,
    requiresAuth: false
  }
  
  private dataSources: DataSourceDefinition[] = []
  private cache: Map<string, any> = new Map()
  private apiUrl: string
  
  constructor(apiUrl: string = 'https://api.woodcat.online') {
    this.apiUrl = apiUrl
    this.initializeDataSources()
  }
  
  get dataSources(): DataSourceDefinition[] {
    return this.dataSources
  }
  
  private initializeDataSources(): void {
    this.dataSources = [
      {
        id: 'scp-wiki-cn',
        name: 'SCP Wiki (Chinese)',
        metadata: {
          ...this.metadata,
          name: 'SCP Wiki (Chinese)',
          url: 'https://scp-wiki-cn.wikidot.com'
        }
      },
      {
        id: 'scp-wiki-en',
        name: 'SCP Wiki (English)',
        metadata: {
          ...this.metadata,
          name: 'SCP Wiki (English)',
          url: 'https://scp-wiki.net'
        }
      }
    ]
  }
  
  async query<T = any>(dataSourceId: string, options: DataSourceQueryOptions): Promise<DataSourceQueryResult<T>> {
    const dataSource = this.getDataSource(dataSourceId)
    if (!dataSource) {
      throw new Error(`Data source ${dataSourceId} not found`)
    }
    
    // Use list endpoint
    const url = new URL(`${this.apiUrl}/list`)
    if (options.limit) url.searchParams.set('limit', options.limit.toString())
    if (options.offset) url.searchParams.set('offset', options.offset.toString())
    
    const response = await fetch(url.toString())
    const data = await response.json()
    
    return {
      data: data.data || [],
      total: data.total || 0,
      hasMore: data.hasMore || false
    }
  }
  
  async get<T = any>(dataSourceId: string, id: string): Promise<T | null> {
    const cacheKey = `${dataSourceId}:${id}`
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }
    
    const dataSource = this.getDataSource(dataSourceId)
    if (!dataSource) {
      throw new Error(`Data source ${dataSourceId} not found`)
    }
    
    try {
      const url = new URL(`${this.apiUrl}/scrape`)
      url.searchParams.set('number', id)
      
      const response = await fetch(url.toString())
      const data = await response.json()
      
      if (data.success && data.data) {
        this.cache.set(cacheKey, data.data)
        return data.data as T
      }
      
      return null
    } catch (error) {
      console.error(`Failed to fetch SCP ${id}:`, error)
      return null
    }
  }
  
  async search<T = any>(dataSourceId: string, keyword: string, options: DataSourceQueryOptions = {}): Promise<DataSourceQueryResult<T>> {
    const dataSource = this.getDataSource(dataSourceId)
    if (!dataSource) {
      throw new Error(`Data source ${dataSourceId} not found`)
    }
    
    const url = new URL(`${this.apiUrl}/search`)
    url.searchParams.set('keyword', keyword)
    if (options.limit) url.searchParams.set('limit', options.limit.toString())
    if (options.offset) url.searchParams.set('offset', options.offset.toString())
    
    const response = await fetch(url.toString())
    const data = await response.json()
    
    return {
      data: data.data || [],
      total: data.total || 0,
      hasMore: data.hasMore || false
    }
  }
  
  getDataSource(dataSourceId: string): DataSourceDefinition | null {
    return this.dataSources.find(ds => ds.id === dataSourceId) || null
  }
  
  getDataSourceIds(): string[] {
    return this.dataSources.map(ds => ds.id)
  }
  
  hasDataSource(dataSourceId: string): boolean {
    return this.getDataSource(dataSourceId) !== null
  }
  
  async testConnection(dataSourceId: string): Promise<boolean> {
    try {
      const stats = await this.getStatistics(dataSourceId)
      return stats.totalItems >= 0
    } catch {
      return false
    }
  }
  
  async getStatistics(dataSourceId: string): Promise<{
    totalItems: number
    lastUpdated?: string
    [key: string]: any
  }> {
    const url = new URL(`${this.apiUrl}/stats`)
    const response = await fetch(url.toString())
    const data = await response.json()
    
    return {
      totalItems: data.total || 0,
      lastUpdated: data.lastUpdated,
      ...data
    }
  }
  
  async onLoad(): Promise<void> {
    console.log(`[ScpWikiDataSourcePlugin] Loaded`)
  }
  
  async onUnload(): Promise<void> {
    this.cache.clear()
    console.log(`[ScpWikiDataSourcePlugin] Unloaded`)
  }
  
  dependencies?: string[]
  config?: Record<string, any>
}