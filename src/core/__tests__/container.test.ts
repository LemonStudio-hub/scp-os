/**
 * Unit tests for DIContainer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DIContainer,
  ServiceLifetime,
  getGlobalContainer,
  resetGlobalContainer,
  registerGlobal,
  resolveGlobal
} from '../container'

describe('DIContainer', () => {
  let container: DIContainer

  beforeEach(() => {
    container = new DIContainer()
    resetGlobalContainer()
  })

  describe('Service Registration', () => {
    it('should register a service', () => {
      const factory = () => ({ value: 42 })
      container.register('TestService', factory)

      expect(container.has('TestService')).toBe(true)
    })

    it('should register multiple services', () => {
      container.register('Service1', () => ({ id: 1 }))
      container.register('Service2', () => ({ id: 2 }))

      expect(container.has('Service1')).toBe(true)
      expect(container.has('Service2')).toBe(true)
    })

    it('should replace existing service when registering again', () => {
      const factory1 = () => ({ value: 1 })
      const factory2 = () => ({ value: 2 })

      container.register('TestService', factory1)
      container.register('TestService', factory2)

      const instance = container.resolve('TestService')
      expect(instance.value).toBe(2)
    })

    it('should unregister a service', () => {
      container.register('TestService', () => ({}))
      container.unregister('TestService')

      expect(container.has('TestService')).toBe(false)
    })

    it('should clear all services', () => {
      container.register('Service1', () => ({}))
      container.register('Service2', () => ({}))
      container.clear()

      expect(container.has('Service1')).toBe(false)
      expect(container.has('Service2')).toBe(false)
    })
  })

  describe('Singleton Lifetime', () => {
    it('should return the same instance for singleton services', () => {
      let counter = 0
      const factory = () => ({ id: counter++ })

      container.register('SingletonService', factory, {
        lifetime: ServiceLifetime.SINGLETON
      })

      const instance1 = container.resolve('SingletonService')
      const instance2 = container.resolve('SingletonService')

      expect(instance1).toBe(instance2)
      expect(instance1.id).toBe(0)
      expect(instance2.id).toBe(0)
    })

    it('should use pre-instantiated instance', () => {
      const instance = { value: 42 }

      container.register('SingletonService', () => instance, {
        lifetime: ServiceLifetime.SINGLETON,
        instance
      })

      const resolved = container.resolve('SingletonService')
      expect(resolved).toBe(instance)
    })
  })

  describe('Transient Lifetime', () => {
    it('should return new instance for each resolve', () => {
      let counter = 0
      const factory = () => ({ id: counter++ })

      container.register('TransientService', factory, {
        lifetime: ServiceLifetime.TRANSIENT
      })

      const instance1 = container.resolve('TransientService')
      const instance2 = container.resolve('TransientService')

      expect(instance1).not.toBe(instance2)
      expect(instance1.id).toBe(0)
      expect(instance2.id).toBe(1)
    })
  })

  describe('Scoped Lifetime', () => {
    it('should return same instance within a scope', () => {
      let counter = 0
      const factory = () => ({ id: counter++ })

      container.register('ScopedService', factory, {
        lifetime: ServiceLifetime.SCOPED
      })

      const scope1 = container.createScope('scope1')
      const instance1 = container.resolve('ScopedService')
      const instance2 = container.resolve('ScopedService')

      expect(instance1).toBe(instance2)
      expect(instance1.id).toBe(0)

      container.exitScope()
      container.destroyScope('scope1')
    })

    it('should return different instances in different scopes', () => {
      let counter = 0
      const factory = () => ({ id: counter++ })

      container.register('ScopedService', factory, {
        lifetime: ServiceLifetime.SCOPED
      })

      const scope1 = container.createScope('scope1')
      const instance1 = container.resolve('ScopedService')

      container.exitScope()

      const scope2 = container.createScope('scope2')
      const instance2 = container.resolve('ScopedService')

      expect(instance1).not.toBe(instance2)
      expect(instance1.id).toBe(0)
      expect(instance2.id).toBe(1)

      container.exitScope()
      container.destroyScope('scope1')
      container.destroyScope('scope2')
    })

    it('should fallback to singleton when no scope is active', () => {
      let counter = 0
      const factory = () => ({ id: counter++ })

      container.register('ScopedService', factory, {
        lifetime: ServiceLifetime.SCOPED
      })

      const instance1 = container.resolve('ScopedService')
      const instance2 = container.resolve('ScopedService')

      expect(instance1).toBe(instance2)
    })
  })

  describe('Dependency Resolution', () => {
    it('should resolve dependencies', () => {
      container.register('Dependency', () => ({ value: 42 }))

      container.register('DependentService', (c) => {
        const dependency = c.resolve('Dependency')
        return { dep: dependency }
      })

      const instance = container.resolve('DependentService')
      expect(instance.dep.value).toBe(42)
    })

    it('should detect circular dependencies', () => {
      container.register('ServiceA', (c) => {
        c.resolve('ServiceB')
        return {}
      })

      container.register('ServiceB', (c) => {
        c.resolve('ServiceA')
        return {}
      })

      expect(() => container.resolve('ServiceA')).toThrow('Circular dependency detected')
    })

    it('should throw error for unregistered service', () => {
      expect(() => container.resolve('NonExistentService')).toThrow('Service not found')
    })
  })

  describe('Scope Management', () => {
    it('should create a scope with auto-generated id', () => {
      const scope = container.createScope()
      expect(scope.id).toBeDefined()
      expect(scope.id).toMatch(/^scope-/)
    })

    it('should create a scope with custom id', () => {
      const scope = container.createScope('custom-scope')
      expect(scope.id).toBe('custom-scope')
    })

    it('should enter an existing scope', () => {
      const scope1 = container.createScope('scope1')
      container.exitScope()

      container.enterScope('scope1')
      expect(container['currentScope']?.id).toBe('scope1')
    })

    it('should throw error when entering non-existent scope', () => {
      expect(() => container.enterScope('non-existent')).toThrow('Scope not found')
    })

    it('should destroy a scope', () => {
      const scope = container.createScope('test-scope')
      container.register('ScopedService', () => ({ id: 1 }), {
        lifetime: ServiceLifetime.SCOPED
      })

      const instance = container.resolve('ScopedService')
      expect(instance).toBeDefined()

      container.exitScope()
      container.destroyScope('test-scope')

      expect(() => container.enterScope('test-scope')).toThrow('Scope not found')
    })
  })

  describe('Global Container', () => {
    it('should return same global container instance', () => {
      const container1 = getGlobalContainer()
      const container2 = getGlobalContainer()

      expect(container1).toBe(container2)
    })

    it('should reset global container', () => {
      const container1 = getGlobalContainer()
      resetGlobalContainer()
      const container2 = getGlobalContainer()

      expect(container1).not.toBe(container2)
    })

    it('should register and resolve in global container', () => {
      registerGlobal('GlobalService', () => ({ value: 42 }))
      const instance = resolveGlobal('GlobalService')

      expect(instance.value).toBe(42)
    })
  })

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = container.getConfig()
      expect(config.debug).toBe(false)
      expect(config.autoRegister).toBe(false)
      expect(config.detectCircularDependencies).toBe(true)
      expect(config.defaultLifetime).toBe(ServiceLifetime.SINGLETON)
    })

    it('should use custom configuration', () => {
      const customContainer = new DIContainer({
        debug: true,
        autoRegister: true,
        detectCircularDependencies: false,
        defaultLifetime: ServiceLifetime.TRANSIENT
      })

      const config = customContainer.getConfig()
      expect(config.debug).toBe(true)
      expect(config.autoRegister).toBe(true)
      expect(config.detectCircularDependencies).toBe(false)
      expect(config.defaultLifetime).toBe(ServiceLifetime.TRANSIENT)
    })
  })

  describe('Utility Methods', () => {
    it('should get all registered tokens', () => {
      container.register('Service1', () => ({}))
      container.register('Service2', () => ({}))
      container.register('Service3', () => ({}))

      const tokens = container.getRegisteredTokens()
      expect(tokens).toHaveLength(4) // 3 services + DIContainer
      expect(tokens).toContain('Service1')
      expect(tokens).toContain('Service2')
      expect(tokens).toContain('Service3')
    })

    it('should resolve DIContainer itself', () => {
      const resolvedContainer = container.resolve('DIContainer')
      expect(resolvedContainer).toBe(container)
    })
  })
})