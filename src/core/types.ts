/**
 * Core type definitions for the SCP-OS platform
 */

/**
 * Service lifecycle types
 */
export const ServiceLifetime = {
  /** Singleton - same instance for all resolves */
  SINGLETON: 'singleton',
  /** Transient - new instance for each resolve */
  TRANSIENT: 'transient',
  /** Scoped - same instance within a scope */
  SCOPED: 'scoped'
} as const

export type ServiceLifetime = typeof ServiceLifetime[keyof typeof ServiceLifetime]

/**
 * Service factory function type
 */
export type ServiceFactory<T = any> = (container: any) => T

/**
 * Service registration options
 */
export interface ServiceRegistrationOptions<T = any> {
  /** Factory function to create the service */
  factory: ServiceFactory<T>
  /** Service lifetime */
  lifetime?: ServiceLifetime
  /** Dependencies (service tokens that this service depends on) */
  dependencies?: string[]
}

/**
 * Service registration
 */
export interface ServiceRegistration<T = any> {
  /** Factory function */
  factory: ServiceFactory<T>
  /** Service lifetime */
  lifetime: ServiceLifetime
  /** Dependencies */
  dependencies: string[]
  /** Instance (for singleton) */
  instance?: T
}

/**
 * Container scope
 */
export interface ContainerScope {
  /** Scope ID */
  id: string
  /** Scoped instances */
  instances: Map<string, any>
  /** Parent scope */
  parent?: ContainerScope
}

/**
 * Container configuration
 */
export interface ContainerConfig {
  /** Enable debug mode */
  debug?: boolean
  /** Auto-register services from type information */
  autoRegister?: boolean
  /** Detect circular dependencies */
  detectCircularDependencies?: boolean
  /** Default service lifetime */
  defaultLifetime?: ServiceLifetime
}