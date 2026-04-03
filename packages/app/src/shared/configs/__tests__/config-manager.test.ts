/**
 * Unit tests for Configuration Manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ConfigManager,
  getGlobalConfigManager,
  resetGlobalConfigManager,
  config,
  setConfig,
  hasConfig
} from '../config-manager'
import type { ConfigSource } from '../types'

describe('ConfigManager', () => {
  let configManager: ConfigManager

  beforeEach(() => {
    configManager = new ConfigManager({
      debug: false
    })
    resetGlobalConfigManager()
  })

  describe('Configuration Source Management', () => {
    it('should have default sources', () => {
      const sources = configManager.getSources()
      expect(sources.length).toBeGreaterThan(0)
      expect(sources.some(s => s.name === 'default')).toBe(true)
      expect(sources.some(s => s.name === 'memory')).toBe(true)
      expect(sources.some(s => s.name === 'environment')).toBe(true)
    })

    it('should add custom source', () => {
      const customSource: ConfigSource = {
        name: 'custom',
        priority: 100,
        get: (key) => `custom-${key}`,
        has: () => true
      }

      configManager.addSource(customSource)

      const sources = configManager.getSources()
      expect(sources.some(s => s.name === 'custom')).toBe(true)
    })

    it('should remove source', () => {
      configManager.removeSource('memory')

      const sources = configManager.getSources()
      expect(sources.some(s => s.name === 'memory')).toBe(false)
    })

    it('should prioritize sources correctly', () => {
      const lowPrioritySource: ConfigSource = {
        name: 'low',
        priority: 10,
        get: () => 'low',
        has: () => true
      }

      const highPrioritySource: ConfigSource = {
        name: 'high',
        priority: 100,
        get: () => 'high',
        has: () => true
      }

      configManager.addSource(lowPrioritySource)
      configManager.addSource(highPrioritySource)

      const value = configManager.get('test-key')
      expect(value).toBe('high')
    })
  })

  describe('Configuration Get/Set', () => {
    it('should get configuration value', () => {
      configManager.set('test-key', 'test-value')
      expect(configManager.get('test-key')).toBe('test-value')
    })

    it('should return undefined for non-existent key', () => {
      expect(configManager.get('non-existent-key')).toBeUndefined()
    })

    it('should set configuration value', () => {
      configManager.set('test-key', 'test-value')
      expect(configManager.get('test-key')).toBe('test-value')
    })

    it('should update existing value', () => {
      configManager.set('test-key', 'value1')
      configManager.set('test-key', 'value2')
      expect(configManager.get('test-key')).toBe('value2')
    })

    it('should check if configuration key exists', () => {
      expect(configManager.has('non-existent')).toBe(false)
      configManager.set('exists', 'value')
      expect(configManager.has('exists')).toBe(true)
    })
  })

  describe('Configuration Cache', () => {
    it('should cache configuration values', () => {
      configManager.set('test-key', 'test-value')

      // First call
      const value1 = configManager.get('test-key')
      // Second call (from cache)
      const value2 = configManager.get('test-key')

      expect(value1).toBe(value2)
    })

    it('should clear cache', () => {
      configManager.set('test-key', 'test-value')
      configManager.clearCache()

      // Cache is cleared, but value should still be available
      const value = configManager.get('test-key')
      expect(value).toBe('test-value')
    })

    it('should clear cache on set', () => {
      configManager.set('test-key', 'value1')
      configManager.set('test-key', 'value2')

      // Cache should be cleared, returning new value
      expect(configManager.get('test-key')).toBe('value2')
    })
  })

  describe('Configuration Schema', () => {
    it('should register schema', () => {
      const schema = {
        key: 'test-key',
        type: 'string' as const,
        default: 'default-value',
        required: true
      }

      configManager.registerSchema(schema)

      // Schema is registered (no direct getter, but affects validation)
      expect(() => configManager.registerSchema(schema)).not.toThrow()
    })

    it('should unregister schema', () => {
      const schema = {
        key: 'test-key',
        type: 'string' as const,
        default: 'default-value'
      }

      configManager.registerSchema(schema)
      configManager.unregisterSchema('test-key')

      expect(() => configManager.unregisterSchema('test-key')).not.toThrow()
    })

    it('should validate configuration', () => {
      const schema = {
        key: 'required-key',
        type: 'string' as const,
        required: true
      }

      configManager.registerSchema(schema)

      const result = configManager.validate()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Required configuration missing: required-key')
    })

    it('should validate type', () => {
      const schema = {
        key: 'number-key',
        type: 'number' as const,
        required: true
      }

      configManager.registerSchema(schema)
      configManager.set('number-key', 'not-a-number')

      const result = configManager.validate()
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Invalid type'))).toBe(true)
    })

    it('should use custom validation', () => {
      const schema = {
        key: 'range-key',
        type: 'number' as const,
        required: true,
        validate: (value: any) => value >= 0 && value <= 100
      }

      configManager.registerSchema(schema)
      configManager.set('range-key', 150)

      const result = configManager.validate()
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Validation failed'))).toBe(true)
    })
  })

  describe('Environment Management', () => {
    it('should detect environment', () => {
      const env = configManager.getEnvironment()
      expect(['development', 'production', 'test']).toContain(env)
    })

    it('should set environment', () => {
      configManager.setEnvironment('production')
      expect(configManager.getEnvironment()).toBe('production')
    })
  })

  describe('Configuration Reset', () => {
    it('should reset configuration', () => {
      configManager.set('key1', 'value1')
      configManager.set('key2', 'value2')

      configManager.reset()

      expect(configManager.get('key1')).toBeUndefined()
      expect(configManager.get('key2')).toBeUndefined()
    })
  })

  describe('Configuration Watch', () => {
    it('should watch configuration changes', () => {
      const callback = vi.fn()
      const unsubscribe = configManager.watch('test-key', callback)

      configManager.set('test-key', 'value1')
      configManager.set('test-key', 'value2')

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenCalledWith('value1')
      expect(callback).toHaveBeenCalledWith('value2')

      unsubscribe()
      configManager.set('test-key', 'value3')

      expect(callback).toHaveBeenCalledTimes(2) // No more calls after unsubscribe
    })
  })

  describe('Global Config Manager', () => {
    it('should return same global instance', () => {
      const instance1 = getGlobalConfigManager()
      const instance2 = getGlobalConfigManager()

      expect(instance1).toBe(instance2)
    })

    it('should reset global instance', () => {
      const instance1 = getGlobalConfigManager()
      resetGlobalConfigManager()
      const instance2 = getGlobalConfigManager()

      expect(instance1).not.toBe(instance2)
    })
  })

  describe('Shorthand Functions', () => {
    it('should use config shorthand', () => {
      setConfig('test-key', 'test-value')
      expect(config('test-key')).toBe('test-value')
    })

    it('should use hasConfig shorthand', () => {
      expect(hasConfig('non-existent')).toBe(false)
      setConfig('exists', 'value')
      expect(hasConfig('exists')).toBe(true)
    })
  })
})