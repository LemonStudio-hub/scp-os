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
  SCOPED: 'scoped',
} as const

export type ServiceLifetime = (typeof ServiceLifetime)[keyof typeof ServiceLifetime]

/**
 * Service factory function type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServiceFactory<T = any> = (container: any) => T

/**
 * Service registration options
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ServiceRegistration<T = any> {
  /** Service token */
  token: string
  /** Factory function */
  factory: ServiceFactory<T>
  /** Service lifetime */
  lifetime: ServiceLifetime
  /** Dependencies */
  dependencies: string[]
  /** Instance (for singleton) */
  instance?: T
  /** Whether the service has been instantiated */
  instantiated?: boolean
}

/**
 * Container scope
 */
export interface ContainerScope {
  /** Scope ID */
  id: string
  /** Scoped instances */
  instances: Map<string, unknown>
  /** Parent scope */
  parent?: ContainerScope | undefined
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
