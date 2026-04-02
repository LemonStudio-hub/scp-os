/**
 * Core type definitions for the SCP-OS platform
 */

/**
 * Service lifecycle types
 */
export enum ServiceLifetime {
  /** Singleton - same instance for all resolves */
  SINGLETON = 'singleton',
  /** Transient - new instance for each resolve */
  TRANSIENT = 'transient',
  /** Scoped - same instance within a scope */
  SCOPED = 'scoped'
}

/**
 * Service factory function type
 */
export type ServiceFactory<T = any> = (container: DIContainer) => T

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
  /** Whether the service is already instantiated */
  instance?: T
}

/**
 * Service registration
 */
export interface ServiceRegistration {
  /** Service token */
  token: string
  /** Service factory */
  factory: ServiceFactory
  /** Service lifetime */
  lifetime: ServiceLifetime
  /** Service dependencies */
  dependencies: string[]
  /** Service instance (for singleton) */
  instance?: any
  /** Whether the service is instantiated */
  instantiated: boolean
}

/**
 * Container scope for scoped services
 */
export interface ContainerScope {
  /** Unique scope identifier */
  id: string
  /** Scoped instances */
  instances: Map<string, any>
  /** Parent scope (for nested scopes) */
  parent?: ContainerScope
}

/**
 * Container configuration
 */
export interface ContainerConfig {
  /** Enable debug mode */
  debug?: boolean
  /** Enable auto-registration */
  autoRegister?: boolean
  /** Enable circular dependency detection */
  detectCircularDependencies?: boolean
  /** Default service lifetime */
  defaultLifetime?: ServiceLifetime
}