/**
 * Unit tests for DIContainer (Dependency Injection Container)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  DIContainer,
  getGlobalContainer,
  resetGlobalContainer,
  registerGlobal,
  resolveGlobal
} from '../container'
import type { ServiceFactory } from '../types'
import { ServiceLifetime as Lifetime } from '../types'

describe('DIContainer', () => {
  let container: DIContainer

  beforeEach(() => {
    container = new DIContainer()
    resetGlobalContainer()
  })

  describe('Service Registration', () => {
    it('should register a service', () => {
      const factory: ServiceFactory<{ id: number }> = () => ({ id: 1 })
      container.register('testService', factory)

      expect(container.has('testService')).toBe(true)
    })

    it('should resolve a registered service', () => {
      const factory: ServiceFactory<{ id: number }> = () => ({ id: 1 })
      container.register('testService', factory)

      const instance = container.resolve('testService')
      expect(instance).toEqual({ id: 1 })
    })

    it('should throw error when resolving unregistered service', () => {
      expect(() => container.resolve('nonExistent')).toThrow('Service not found')
    })

    it('should replace existing service when registering again', () => {
      const factory1: ServiceFactory<{ id: number }> = () => ({ id: 1 })
      const factory2: ServiceFactory<{ id: number }> = () => ({ id: 2 })

      container.register('testService', factory1)
      container.register('testService', factory2)

      const instance = container.resolve('testService')
      expect(instance.id).toBe(2)
    })
  })

  describe('Singleton Lifetime', () => {
    it('should return the same instance for singleton services', () => {
      const factory: ServiceFactory<{ id: number }> = () => ({ id: Math.random() })
      container.register('SingletonService', factory, { lifetime: Lifetime.SINGLETON })

      const instance1 = container.resolve('SingletonService')
      const instance2 = container.resolve('SingletonService')

      expect(instance1).toBe(instance2)
    })

    it('should use default singleton lifetime', () => {
      const factory: ServiceFactory<{ value: number }> = () => ({ value: Math.random() })
      container.register('DefaultSingleton', factory)

      const instance1 = container.resolve('DefaultSingleton')
      const instance2 = container.resolve('DefaultSingleton')

      expect(instance1).toBe(instance2)
    })
  })

  describe('Transient Lifetime', () => {
    it('should return new instance for each resolve', () => {
      const factory: ServiceFactory<{ id: number }> = () => ({ id: Math.random() })
      container.register('TransientService', factory, { lifetime: Lifetime.TRANSIENT })

      const instance1 = container.resolve('TransientService')
      const instance2 = container.resolve('TransientService')

      expect(instance1).not.toBe(instance2)
      expect(instance1.id).not.toBe(instance2.id)
    })
  })

  describe('Scoped Lifetime', () => {
    it('should return same instance within a scope', () => {
      const factory: ServiceFactory<{ id: number }> = () => ({ id: Math.random() })
      container.register('ScopedService', factory, { lifetime: Lifetime.SCOPED })

      container.createScope()

      const instance1 = container.resolve('ScopedService')
      const instance2 = container.resolve('ScopedService')

      expect(instance1).toBe(instance2)
    })

    it('should return different instances in different scopes', () => {
      const factory: ServiceFactory<{ id: number }> = () => ({ id: Math.random() })
      container.register('ScopedService', factory, { lifetime: Lifetime.SCOPED })

      container.createScope()
      const instance1 = container.resolve('ScopedService')

      container.createScope()
      const instance2 = container.resolve('ScopedService')

      expect(instance1).not.toBe(instance2)
      expect(instance1.id).not.toBe(instance2.id)
    })

    it('should fallback to singleton when no scope is active', () => {
      const factory: ServiceFactory<{ id: number }> = () => ({ id: Math.random() })
      container.register('ScopedService', factory, { lifetime: Lifetime.SCOPED })

      // Resolve without scope
      const instance1 = container.resolve('ScopedService')
      const instance2 = container.resolve('ScopedService')

      expect(instance1).toBe(instance2)
    })
  })

  describe('Scope Management', () => {
    it('should create a scope', () => {
      container.createScope()

      expect(container.getCurrentScope()?.id).toBeDefined()
    })

    it('should destroy a scope', () => {
      const scopeId = container.createScope()
      container.destroyScope(scopeId)

      expect(container.getCurrentScope()).toBe(null)
    })

    it('should support nested scopes', () => {
      container.createScope()
      const parentScope = container.getCurrentScope()
      container.createScope()
      const childScope = container.getCurrentScope()

      expect(childScope?.parent).toBe(parentScope)

      container.destroyScope(childScope!.id)
      expect(container.getCurrentScope()).toBe(parentScope)

      container.destroyScope(parentScope!.id)
      expect(container.getCurrentScope()).toBe(null)
    })
  })

  describe('Service Unregistration', () => {
    it('should unregister a service', () => {
      const factory: ServiceFactory<{ id: number }> = () => ({ id: 1 })
      container.register('testService', factory)

      container.unregister('testService')

      expect(container.has('testService')).toBe(false)
      expect(() => container.resolve('testService')).toThrow()
    })

    it('should clear all services', () => {
      const factory1: ServiceFactory<{ id: number }> = () => ({ id: 1 })
      const factory2: ServiceFactory<{ id: number }> = () => ({ id: 2 })

      container.register('service1', factory1)
      container.register('service2', factory2)

      container.clear()

      expect(container.has('service1')).toBe(false)
      expect(container.has('service2')).toBe(false)
    })
  })

  describe('Dependency Resolution', () => {
    it('should resolve dependencies', () => {
      const depFactory: ServiceFactory<{ id: number }> = () => ({ id: 1 })
      const serviceFactory: ServiceFactory<{ dep: any }> = (c) => ({
        dep: c.resolve('dep')
      })

      container.register('dep', depFactory)
      container.register('service', serviceFactory)

      const instance = container.resolve('service')
      expect(instance.dep).toEqual({ id: 1 })
    })

    it('should detect circular dependencies', () => {
      const factoryA: ServiceFactory<{ depB: any }> = (c) => ({
        depB: c.resolve('ServiceB')
      })
      const factoryB: ServiceFactory<{ depA: any }> = (c) => ({
        depA: c.resolve('ServiceA')
      })

      container.register('ServiceA', factoryA)
      container.register('ServiceB', factoryB)

      expect(() => container.resolve('ServiceA')).toThrow('Circular dependency detected')
    })

    it('should not detect circular dependency when disabled', () => {
      const containerNoCheck = new DIContainer({ detectCircularDependencies: false })

      const factoryA: ServiceFactory<{ depB: any }> = (c) => ({
        depB: c.resolve('ServiceB')
      })
      const factoryB: ServiceFactory<{ depA: any }> = (c) => ({
        depA: c.resolve('ServiceA')
      })

      containerNoCheck.register('ServiceA', factoryA)
      containerNoCheck.register('ServiceB', factoryB)

      // This should throw a stack overflow error, but we catch it
      expect(() => containerNoCheck.resolve('ServiceA')).toThrow()
    })
  })

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = container.getConfig()

      expect(config.debug).toBe(false)
      expect(config.autoRegister).toBe(false)
      expect(config.detectCircularDependencies).toBe(true)
      expect(config.defaultLifetime).toBe(Lifetime.SINGLETON)
    })

    it('should use custom configuration', () => {
      const customContainer = new DIContainer({
        debug: true,
        autoRegister: true,
        detectCircularDependencies: false,
        defaultLifetime: Lifetime.TRANSIENT
      })

      const config = customContainer.getConfig()

      expect(config.debug).toBe(true)
      expect(config.autoRegister).toBe(true)
      expect(config.detectCircularDependencies).toBe(false)
      expect(config.defaultLifetime).toBe(Lifetime.TRANSIENT)
    })
  })

  describe('Query Methods', () => {
    it('should get all registrations', () => {
      const factory1: ServiceFactory<{ id: number }> = () => ({ id: 1 })
      const factory2: ServiceFactory<{ id: number }> = () => ({ id: 2 })

      container.register('service1', factory1)
      container.register('service2', factory2)

      const registrations = container.getRegistrations()

      // Container auto-registers itself, so we have 3 registrations
      expect(registrations).toHaveLength(3)
      expect(registrations.map((r) => r.token)).toContain('service1')
      expect(registrations.map((r) => r.token)).toContain('service2')
      expect(registrations.map((r) => r.token)).toContain('DIContainer')
    })

    it('should check if service is registered', () => {
      const factory: ServiceFactory<{ id: number }> = () => ({ id: 1 })
      container.register('testService', factory)

      expect(container.has('testService')).toBe(true)
      expect(container.has('nonExistent')).toBe(false)
    })
  })

  describe('Global Container', () => {
    it('should return same global instance', () => {
      const instance1 = getGlobalContainer()
      const instance2 = getGlobalContainer()

      expect(instance1).toBe(instance2)
    })

    it('should reset global instance', () => {
      const instance1 = getGlobalContainer()
      resetGlobalContainer()
      const instance2 = getGlobalContainer()

      expect(instance1).not.toBe(instance2)
    })

    it('should register service in global container', () => {
      const factory: ServiceFactory<{ value: number }> = () => ({ value: 42 })
      registerGlobal('globalService', factory)

      expect(getGlobalContainer().has('globalService')).toBe(true)
    })

    it('should resolve service from global container', () => {
      const factory: ServiceFactory<{ value: number }> = () => ({ value: 42 })
      registerGlobal('globalService', factory)

      const instance = resolveGlobal<{ value: number }>('globalService')
      expect(instance.value).toBe(42)
    })
  })

  describe('Self Registration', () => {
    it('should register itself', () => {
      const containerInstance = container.resolve('DIContainer')

      expect(containerInstance).toBe(container)
    })
  })
})