/**
 * Multi-tenant Support
 * Defines tenant context and management for multi-tenant applications
 */

import type { IEventBus } from '../events/event-bus'

/**
 * Tenant Metadata
 */
export interface TenantMetadata {
  /** Tenant ID */
  id: string
  /** Tenant name */
  name: string
  /** Tenant description */
  description: string
  /** Tenant logo URL */
  logoUrl?: string
  /** Tenant color scheme */
  colorScheme?: {
    primary: string
    secondary: string
  }
  /** Tenant domain (if applicable) */
  domain?: string
  /** Tenant status */
  status: 'active' | 'inactive' | 'suspended'
  /** Tenant plan */
  plan: 'free' | 'basic' | 'premium' | 'enterprise'
  /** Tenant created at */
  createdAt: Date
  /** Tenant updated at */
  updatedAt: Date
}

/**
 * Tenant Configuration
 */
export interface TenantConfig {
  /** Feature flags */
  features: {
    /** Enable multi-tab */
    multiTab: boolean
    /** Enable gesture support */
    gestureSupport: boolean
    /** Enable voice control */
    voiceControl: boolean
    /** Enable accessibility features */
    accessibility: boolean
    /** Enable custom themes */
    customThemes: boolean
    /** Enable custom commands */
    customCommands: boolean
  }
  /** Resource limits */
  limits: {
    /** Maximum number of tabs */
    maxTabs: number
    /** Maximum command history size */
    maxCommandHistory: number
    /** Maximum storage quota (in bytes) */
    maxStorageQuota: number
    /** Maximum number of custom commands */
    maxCustomCommands: number
  }
  /** Custom settings */
  settings: Record<string, any>
}

/**
 * Tenant Context
 * Provides tenant-specific context and isolation
 */
export class TenantContext {
  private metadata: TenantMetadata
  private config: TenantConfig
  private eventBus: IEventBus | null
  private isolatedData: Map<string, any> = new Map()
  
  constructor(
    metadata: TenantMetadata,
    config: TenantConfig,
    eventBus?: IEventBus
  ) {
    this.metadata = metadata
    this.config = config
    this.eventBus = eventBus || null
  }
  
  /**
   * Get tenant metadata
   */
  getMetadata(): TenantMetadata {
    return this.metadata
  }
  
  /**
   * Get tenant configuration
   */
  getConfig(): TenantConfig {
    return this.config
  }
  
  /**
   * Update tenant configuration
   * @param config New configuration
   */
  updateConfig(config: Partial<TenantConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      features: { ...this.config.features, ...config.features },
      limits: { ...this.config.limits, ...config.limits },
      settings: { ...this.config.settings, ...config.settings }
    }
    
    if (this.eventBus) {
      this.eventBus.emit('tenant:config-updated', { 
        tenantId: this.metadata.id 
      })
    }
  }
  
  /**
   * Store isolated data
   * @param key Data key
   * @param value Data value
   */
  set(key: string, value: any): void {
    this.isolatedData.set(key, value)
  }
  
  /**
   * Get isolated data
   * @param key Data key
   * @returns Data value or undefined
   */
  get(key: string): any {
    return this.isolatedData.get(key)
  }
  
  /**
   * Delete isolated data
   * @param key Data key
   */
  delete(key: string): void {
    this.isolatedData.delete(key)
  }
  
  /**
   * Clear all isolated data
   */
  clear(): void {
    this.isolatedData.clear()
  }
  
  /**
   * Check if feature is enabled
   * @param feature Feature name
   * @returns True if feature is enabled
   */
  hasFeature(feature: keyof TenantConfig['features']): boolean {
    return this.config.features[feature] === true
  }
  
  /**
   * Get resource limit
   * @param limit Limit name
   * @returns Limit value
   */
  getLimit(limit: keyof TenantConfig['limits']): number {
    return this.config.limits[limit]
  }
  
  /**
   * Check if tenant is active
   */
  isActive(): boolean {
    return this.metadata.status === 'active'
  }
  
  /**
   * Serialize tenant context
   * @returns Serialized context
   */
  serialize(): {
    metadata: TenantMetadata
    config: TenantConfig
    data: Record<string, any>
  } {
    return {
      metadata: this.metadata,
      config: this.config,
      data: Object.fromEntries(this.isolatedData)
    }
  }
  
  /**
   * Deserialize tenant context
   * @param data Serialized context data
   */
  static deserialize(data: {
    metadata: TenantMetadata
    config: TenantConfig
    data: Record<string, any>
  }, eventBus?: IEventBus): TenantContext {
    const context = new TenantContext(data.metadata, data.config, eventBus)
    Object.entries(data.data).forEach(([key, value]) => {
      context.set(key, value)
    })
    return context
  }
}

/**
 * Tenant Manager
 * Manages multiple tenants and their contexts
 */
export class TenantManager {
  private tenants: Map<string, TenantContext> = new Map()
  private currentTenantId: string | null = null
  private eventBus: IEventBus | null = null
  
  constructor(eventBus?: IEventBus) {
    this.eventBus = eventBus || null
  }
  
  /**
   * Register a tenant
   * @param metadata Tenant metadata
   * @param config Tenant configuration
   * @returns Tenant context
   */
  registerTenant(metadata: TenantMetadata, config: TenantConfig): TenantContext {
    if (this.tenants.has(metadata.id)) {
      throw new Error(`Tenant ${metadata.id} already exists`)
    }
    
    const context = new TenantContext(metadata, config, this.eventBus)
    this.tenants.set(metadata.id, context)
    
    if (this.eventBus) {
      this.eventBus.emit('tenant:registered', { 
        tenantId: metadata.id,
        tenantName: metadata.name
      })
    }
    
    return context
  }
  
  /**
   * Unregister a tenant
   * @param tenantId Tenant ID
   */
  unregisterTenant(tenantId: string): void {
    // If this is the current tenant, switch to null
    if (this.currentTenantId === tenantId) {
      this.currentTenantId = null
    }
    
    const context = this.tenants.get(tenantId)
    if (context) {
      context.clear()
    }
    
    this.tenants.delete(tenantId)
    
    if (this.eventBus) {
      this.eventBus.emit('tenant:unregistered', { 
        tenantId 
      })
    }
  }
  
  /**
   * Get tenant context by ID
   * @param tenantId Tenant ID
   * @returns Tenant context or null
   */
  getTenant(tenantId: string): TenantContext | null {
    return this.tenants.get(tenantId) || null
  }
  
  /**
   * Get all tenants
   * @returns Array of tenant contexts
   */
  getAllTenants(): TenantContext[] {
    return Array.from(this.tenants.values())
  }
  
  /**
   * Get current tenant context
   * @returns Current tenant context or null
   */
  getCurrentTenant(): TenantContext | null {
    if (this.currentTenantId === null) {
      return null
    }
    return this.tenants.get(this.currentTenantId) || null
  }
  
  /**
   * Set current tenant
   * @param tenantId Tenant ID
   */
  setCurrentTenant(tenantId: string): void {
    const context = this.tenants.get(tenantId)
    if (!context) {
      throw new Error(`Tenant ${tenantId} not found`)
    }
    
    if (!context.isActive()) {
      throw new Error(`Tenant ${tenantId} is not active`)
    }
    
    this.currentTenantId = tenantId
    
    if (this.eventBus) {
      this.eventBus.emit('tenant:changed', { 
        tenantId,
        tenantName: context.getMetadata().name
      })
    }
  }
  
  /**
   * Get tenants by plan
   * @param plan Tenant plan
   * @returns Array of tenant contexts
   */
  getTenantsByPlan(plan: string): TenantContext[] {
    return this.getAllTenants().filter(context => 
      context.getMetadata().plan === plan
    )
  }
  
  /**
   * Get tenants by status
   * @param status Tenant status
   * @returns Array of tenant contexts
   */
  getTenantsByStatus(status: string): TenantContext[] {
    return this.getAllTenants().filter(context => 
      context.getMetadata().status === status
    )
  }
  
  /**
   * Update tenant configuration
   * @param tenantId Tenant ID
   * @param config Configuration updates
   */
  updateTenantConfig(tenantId: string, config: Partial<TenantConfig>): void {
    const context = this.tenants.get(tenantId)
    if (!context) {
      throw new Error(`Tenant ${tenantId} not found`)
    }
    
    context.updateConfig(config)
  }
  
  /**
   * Get statistics
   * @returns Statistics about registered tenants
   */
  getStatistics(): {
    totalTenants: number
    activeTenants: number
    currentTenant: string | null
    planCounts: Record<string, number>
    statusCounts: Record<string, number>
  } {
    const planCounts: Record<string, number> = {}
    const statusCounts: Record<string, number> = {}
    
    for (const context of this.tenants.values()) {
      const metadata = context.getMetadata()
      
      planCounts[metadata.plan] = (planCounts[metadata.plan] || 0) + 1
      statusCounts[metadata.status] = (statusCounts[metadata.status] || 0) + 1
    }
    
    return {
      totalTenants: this.tenants.size,
      activeTenants: this.getTenantsByStatus('active').length,
      currentTenant: this.currentTenantId,
      planCounts,
      statusCounts
    }
  }
  
  /**
   * Clear all tenants
   */
  clear(): void {
    this.tenants.forEach((context) => context.clear())
    this.tenants.clear()
    this.currentTenantId = null
    
    if (this.eventBus) {
      this.eventBus.emit('tenant:registry:cleared')
    }
  }
}