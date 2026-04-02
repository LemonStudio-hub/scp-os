/**
 * Dependency Injection Container
 * Provides a lightweight dependency injection system for the SCP-OS platform
 */

import type {
  ServiceFactory,
  ServiceRegistrationOptions,
  ServiceRegistration,
  ContainerScope,
  ContainerConfig
} from './types'
import { ServiceLifetime as Lifetime } from './types'

/**
 * Dependency Injection Container
 * Manages service registration, resolution, and lifecycle
 */
export class DIContainer {
  private registrations = new Map<string, ServiceRegistration>()
  private instances = new Map<string, any>()
  private scopes = new Map<string, ContainerScope>()
  private currentScope: ContainerScope | null = null
  private resolutionStack: string[] = []
  private config: Required<ContainerConfig>

  constructor(config: ContainerConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      autoRegister: config.autoRegister ?? false,
      detectCircularDependencies: config.detectCircularDependencies ?? true,
      defaultLifetime: config.defaultLifetime ?? Lifetime.SINGLETON
    }

    // Register the container itself
    this.register('DIContainer', () => this)

    if (this.config.debug) {
      console.log('[DIContainer] Container initialized', this.config)
    }
  }

  /**
   * Register a service with the container
   * @param token - Service token (identifier)
   * @param factory - Factory function to create the service
   * @param options - Registration options
   */
  register<T = any>(
    token: string,
    factory: ServiceFactory<T>,
    options: Partial<ServiceRegistrationOptions<T>> = {}
  ): void {
    if (this.registrations.has(token)) {
      if (this.config.debug) {
        console.warn(`[DIContainer] Service ${token} is already registered. Replacing...`)
      }
    }

    const registration: ServiceRegistration = {
      token,
      factory,
      lifetime: options.lifetime ?? this.config.defaultLifetime,
      dependencies: options.dependencies ?? []
    }

    this.registrations.set(token, registration)

    if (this.config.debug) {
      console.log(`[DIContainer] Registered service: ${token}`, {
        lifetime: registration.lifetime,
        dependencies: registration.dependencies
      })
    }
  }

  /**
   * Resolve a service from the container
   * @param token - Service token
   * @returns Service instance
   */
  resolve<T = any>(token: string): T {
    if (!this.registrations.has(token)) {
      throw new Error(`Service not found: ${token}`)
    }

    const registration = this.registrations.get(token)!

    // Check for circular dependencies
    if (this.config.detectCircularDependencies) {
      if (this.resolutionStack.includes(token)) {
        throw new Error(
          `Circular dependency detected: ${this.resolutionStack.join(' -> ')} -> ${token}`
        )
      }
    }

    this.resolutionStack.push(token)

    try {
      // Singleton
      if (registration.lifetime === Lifetime.SINGLETON) {
        if (!this.instances.has(token)) {
          this.instances.set(token, this.createInstance(registration))
        }
        return this.instances.get(token) as T
      }

      // Scoped
      if (registration.lifetime === Lifetime.SCOPED) {
        if (this.currentScope) {
          if (!this.currentScope.instances.has(token)) {
            this.currentScope.instances.set(token, this.createInstance(registration))
          }
          return this.currentScope.instances.get(token) as T
        }
        // Fallback to singleton when no scope is active
        if (!this.instances.has(token)) {
          this.instances.set(token, this.createInstance(registration))
        }
        return this.instances.get(token) as T
      }

      // Transient
      return this.createInstance(registration) as T
    } finally {
      this.resolutionStack.pop()
    }
  }

  /**
   * Create a service instance
   * @private
   */
  private createInstance(registration: ServiceRegistration): any {
    try {
      return registration.factory(this)
    } catch (error) {
      console.error(
        `[DIContainer] Failed to create instance for ${registration.token}:`,
        error
      )
      throw error
    }
  }

  /**
   * Check if a service is registered
   * @param token - Service token
   * @returns True if registered
   */
  has(token: string): boolean {
    return this.registrations.has(token)
  }

  /**
   * Unregister a service
   * @param token - Service token
   */
  unregister(token: string): void {
    this.registrations.delete(token)
    this.instances.delete(token)
    if (this.config.debug) {
      console.log(`[DIContainer] Unregistered service: ${token}`)
    }
  }

  /**
   * Clear all registrations and instances
   */
  clear(): void {
    this.registrations.clear()
    this.instances.clear()
    this.scopes.clear()
    if (this.config.debug) {
      console.log('[DIContainer] Container cleared')
    }
  }

  /**
   * Create a new scope
   * @returns Scope ID
   */
  createScope(): string {
    const scopeId = `scope-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const scope: ContainerScope = {
      id: scopeId,
      instances: new Map(),
      parent: this.currentScope ?? undefined
    }
    this.scopes.set(scopeId, scope)
    this.currentScope = scope
    if (this.config.debug) {
      console.log(`[DIContainer] Created scope: ${scopeId}`)
    }
    return scopeId
  }

  /**
   * Destroy a scope
   * @param scopeId - Scope ID
   */
  destroyScope(scopeId: string): void {
    const scope = this.scopes.get(scopeId)
    if (!scope) {
      console.warn(`[DIContainer] Scope not found: ${scopeId}`)
      return
    }

    // Clear scope instances
    scope.instances.clear()
    this.scopes.delete(scopeId)

    // Update current scope if we destroyed the current one
    if (this.currentScope?.id === scopeId) {
      this.currentScope = scope.parent ?? null
    }

    if (this.config.debug) {
      console.log(`[DIContainer] Destroyed scope: ${scopeId}`)
    }
  }

  /**
   * Get the current scope
   */
  getCurrentScope(): ContainerScope | null {
    return this.currentScope
  }

  /**
   * Get all registered services
   */
  getRegistrations(): ServiceRegistration[] {
    return Array.from(this.registrations.values())
  }

  /**
   * Get container configuration
   */
  getConfig(): Required<ContainerConfig> {
    return { ...this.config }
  }
}

/**
 * Global container instance
 */
let globalContainer: DIContainer | null = null

/**
 * Get or create the global container
 * @param config - Container configuration (only used on first call)
 */
export function getGlobalContainer(config?: ContainerConfig): DIContainer {
  if (!globalContainer) {
    globalContainer = new DIContainer(config)
  }
  return globalContainer
}

/**
 * Reset the global container instance
 */
export function resetGlobalContainer(): void {
  if (globalContainer) {
    globalContainer.clear()
  }
  globalContainer = null
}

/**
 * Register a service in the global container
 * @param token - Service token
 * @param factory - Factory function
 * @param options - Registration options
 */
export function registerGlobal<T = any>(
  token: string,
  factory: ServiceFactory<T>,
  options?: Partial<ServiceRegistrationOptions<T>>
): void {
  getGlobalContainer().register(token, factory, options)
}

/**
 * Resolve a service from the global container
 * @param token - Service token
 * @returns Service instance
 */
export function resolveGlobal<T = any>(token: string): T {
  return getGlobalContainer().resolve<T>(token)
}