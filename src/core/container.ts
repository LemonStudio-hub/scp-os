/**
 * Dependency Injection Container
 * Provides a lightweight dependency injection system for the SCP-OS platform
 */

import type {
  ServiceLifetime,
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
    this.register('DIContainer', () => this, {
      lifetime: Lifetime.SINGLETON
    })

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
    options?: ServiceRegistrationOptions<T>
  ): void {
    if (this.registrations.has(token)) {
      if (this.config.debug) {
        console.warn(`[DIContainer] Service ${token} is already registered. Replacing...`)
      }
    }

    const registration: ServiceRegistration = {
      token,
      factory,
      lifetime: options?.lifetime ?? this.config.defaultLifetime,
      dependencies: options?.dependencies ?? [],
      instance: options?.instance,
      instantiated: !!options?.instance
    }

    this.registrations.set(token, registration)

    // If singleton and instance provided, store it
    if (registration.lifetime === Lifetime.SINGLETON && registration.instance) {
      this.instances.set(token, registration.instance)
    }

    if (this.config.debug) {
      console.log(`[DIContainer] Registered service: ${token}`, {
        lifetime: registration.lifetime,
        dependencies: registration.dependencies
      })
    }
  }

  /**
   * Register multiple services at once
   * @param services - Array of service registrations
   */
  registerMultiple(services: Array<{
    token: string
    factory: ServiceFactory
    options?: ServiceRegistrationOptions
  }>): void {
    services.forEach(({ token, factory, options }) => {
      this.register(token, factory, options)
    })
  }

  /**
   * Resolve a service by token
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
      // Return cached instance for singleton
      if (registration.lifetime === Lifetime.SINGLETON) {
        if (this.instances.has(token)) {
          return this.instances.get(token) as T
        }

        const instance = this.createInstance(registration)
        this.instances.set(token, instance)
        registration.instantiated = true
        return instance as T
      }

      // Return scoped instance
      if (registration.lifetime === Lifetime.SCOPED) {
        if (this.currentScope) {
          if (this.currentScope.instances.has(token)) {
            return this.currentScope.instances.get(token) as T
          }

          const instance = this.createInstance(registration)
          this.currentScope.instances.set(token, instance)
          return instance as T
        }

        // No scope, fallback to singleton behavior
        if (this.config.debug) {
          console.warn(
            `[DIContainer] Scoped service ${token} resolved without scope, using singleton behavior`
          )
        }
        if (this.instances.has(token)) {
          return this.instances.get(token) as T
        }

        const instance = this.createInstance(registration)
        this.instances.set(token, instance)
        return instance as T
      }

      // Create new instance for transient
      return this.createInstance(registration) as T
    } finally {
      this.resolutionStack.pop()
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
    this.scopes.forEach(scope => scope.instances.delete(token))

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
    this.currentScope = null

    if (this.config.debug) {
      console.log('[DIContainer] Container cleared')
    }
  }

  /**
   * Create a new scope for scoped services
   * @param id - Scope identifier (optional, auto-generated if not provided)
   * @returns Scope object
   */
  createScope(id?: string): ContainerScope {
    const scopeId = id ?? `scope-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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

    return scope
  }

  /**
   * Enter an existing scope
   * @param id - Scope identifier
   */
  enterScope(id: string): void {
    const scope = this.scopes.get(id)
    if (!scope) {
      throw new Error(`Scope not found: ${id}`)
    }

    this.currentScope = scope

    if (this.config.debug) {
      console.log(`[DIContainer] Entered scope: ${id}`)
    }
  }

  /**
   * Exit the current scope
   */
  exitScope(): void {
    if (!this.currentScope) {
      if (this.config.debug) {
        console.warn('[DIContainer] No scope to exit')
      }
      return
    }

    const scopeId = this.currentScope.id
    this.currentScope = this.currentScope.parent ?? null

    if (this.config.debug) {
      console.log(`[DIContainer] Exited scope: ${scopeId}`)
    }
  }

  /**
   * Destroy a scope and clear its instances
   * @param id - Scope identifier
   */
  destroyScope(id: string): void {
    const scope = this.scopes.get(id)
    if (!scope) {
      throw new Error(`Scope not found: ${id}`)
    }

    // Clear all instances in the scope
    scope.instances.clear()
    this.scopes.delete(id)

    if (this.currentScope?.id === id) {
      this.currentScope = this.currentScope.parent ?? null
    }

    if (this.config.debug) {
      console.log(`[DIContainer] Destroyed scope: ${id}`)
    }
  }

  /**
   * Get all registered service tokens
   * @returns Array of service tokens
   */
  getRegisteredTokens(): string[] {
    return Array.from(this.registrations.keys())
  }

  /**
   * Get container configuration
   * @returns Container configuration
   */
  getConfig(): Required<ContainerConfig> {
    return { ...this.config }
  }

  /**
   * Create a service instance
   * @param registration - Service registration
   * @returns Service instance
   */
  private createInstance(registration: ServiceRegistration): any {
    try {
      const instance = registration.factory(this)
      return instance
    } catch (error) {
      console.error(
        `[DIContainer] Failed to create instance for ${registration.token}:`,
        error
      )
      throw error
    }
  }
}

/**
 * Global container instance
 */
let globalContainer: DIContainer | null = null

/**
 * Get or create the global container instance
 * @param config - Container configuration (only used on first call)
 * @returns Global container instance
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
  options?: ServiceRegistrationOptions<T>
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

// Re-export ServiceLifetime for convenience
export { ServiceLifetime } from './types'