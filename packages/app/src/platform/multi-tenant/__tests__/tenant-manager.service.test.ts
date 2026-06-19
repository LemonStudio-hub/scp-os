import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TenantContext, TenantManager } from '../tenant-manager.service'
import type { TenantMetadata, TenantConfig } from '../tenant-manager.service'
import type { IEventBus } from '../../events/event-bus'

const createEventBus = (): IEventBus => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  once: vi.fn(),
  removeAllListeners: vi.fn(),
  listenerCount: vi.fn().mockReturnValue(0),
})

const createMetadata = (overrides: Partial<TenantMetadata> = {}): TenantMetadata => ({
  id: 'tenant-1',
  name: 'Test Tenant',
  description: 'A test tenant',
  status: 'active',
  plan: 'free',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
})

const createConfig = (overrides: Partial<TenantConfig> = {}): TenantConfig => ({
  features: {
    multiTab: true,
    gestureSupport: false,
    voiceControl: false,
    accessibility: true,
    customThemes: false,
    customCommands: false,
  },
  limits: {
    maxTabs: 10,
    maxCommandHistory: 100,
    maxStorageQuota: 1024 * 1024,
    maxCustomCommands: 5,
  },
  settings: {},
  ...overrides,
})

describe('TenantContext', () => {
  describe('getMetadata / getConfig', () => {
    it('returns the metadata', () => {
      const meta = createMetadata()
      const ctx = new TenantContext(meta, createConfig())
      expect(ctx.getMetadata()).toBe(meta)
    })

    it('returns the config', () => {
      const config = createConfig()
      const ctx = new TenantContext(createMetadata(), config)
      expect(ctx.getConfig()).toBe(config)
    })
  })

  describe('updateConfig', () => {
    it('deep merges features and limits', () => {
      const ctx = new TenantContext(createMetadata(), createConfig())
      ctx.updateConfig({
        features: { multiTab: false } as any,
        limits: { maxTabs: 20 } as any,
      })

      const updated = ctx.getConfig()
      // Merged features: multiTab overridden, rest preserved
      expect(updated.features.multiTab).toBe(false)
      expect(updated.features.accessibility).toBe(true)
      // Merged limits: maxTabs overridden, rest preserved
      expect(updated.limits.maxTabs).toBe(20)
      expect(updated.limits.maxCommandHistory).toBe(100)
    })

    it('emits tenant:config-updated event', () => {
      const eventBus = createEventBus()
      const ctx = new TenantContext(createMetadata(), createConfig(), eventBus)
      ctx.updateConfig({ features: { multiTab: false } as any })
      expect(eventBus.emit).toHaveBeenCalledWith('tenant:config-updated', {
        tenantId: 'tenant-1',
      })
    })
  })

  describe('set / get / delete', () => {
    it('stores and retrieves isolated data', () => {
      const ctx = new TenantContext(createMetadata(), createConfig())
      ctx.set('key1', 'value1')
      expect(ctx.get('key1')).toBe('value1')
    })

    it('returns undefined for unknown key', () => {
      const ctx = new TenantContext(createMetadata(), createConfig())
      expect(ctx.get('missing')).toBeUndefined()
    })

    it('deletes a key', () => {
      const ctx = new TenantContext(createMetadata(), createConfig())
      ctx.set('key1', 'value1')
      ctx.delete('key1')
      expect(ctx.get('key1')).toBeUndefined()
    })
  })

  describe('hasFeature', () => {
    it('returns true for enabled feature', () => {
      const ctx = new TenantContext(createMetadata(), createConfig())
      expect(ctx.hasFeature('multiTab')).toBe(true)
    })

    it('returns false for disabled feature', () => {
      const ctx = new TenantContext(createMetadata(), createConfig())
      expect(ctx.hasFeature('voiceControl')).toBe(false)
    })
  })

  describe('getLimit', () => {
    it('returns the limit value', () => {
      const ctx = new TenantContext(createMetadata(), createConfig())
      expect(ctx.getLimit('maxTabs')).toBe(10)
    })
  })

  describe('isActive', () => {
    it('returns true for active tenant', () => {
      const ctx = new TenantContext(createMetadata({ status: 'active' }), createConfig())
      expect(ctx.isActive()).toBe(true)
    })

    it('returns false for inactive tenant', () => {
      const ctx = new TenantContext(createMetadata({ status: 'suspended' }), createConfig())
      expect(ctx.isActive()).toBe(false)
    })
  })

  describe('serialize / deserialize round-trip', () => {
    it('preserves metadata, config, and isolated data', () => {
      const meta = createMetadata()
      const config = createConfig()
      const ctx = new TenantContext(meta, config)
      ctx.set('foo', 'bar')
      ctx.set('num', 42)

      const serialized = ctx.serialize()
      const restored = TenantContext.deserialize(serialized)

      expect(restored.getMetadata()).toEqual(meta)
      expect(restored.getConfig()).toEqual(config)
      expect(restored.get('foo')).toBe('bar')
      expect(restored.get('num')).toBe(42)
    })
  })
})

describe('TenantManager', () => {
  let manager: TenantManager
  let eventBus: IEventBus

  beforeEach(() => {
    eventBus = createEventBus()
    manager = new TenantManager(eventBus)
  })

  describe('registerTenant', () => {
    it('registers a tenant and returns context', () => {
      const meta = createMetadata()
      const ctx = manager.registerTenant(meta, createConfig())
      expect(ctx).toBeInstanceOf(TenantContext)
      expect(manager.getTenant('tenant-1')).toBe(ctx)
    })

    it('throws when registering duplicate tenant ID', () => {
      manager.registerTenant(createMetadata(), createConfig())
      expect(() => manager.registerTenant(createMetadata(), createConfig())).toThrow(
        'already exists'
      )
    })

    it('emits tenant:registered event', () => {
      manager.registerTenant(createMetadata(), createConfig())
      expect(eventBus.emit).toHaveBeenCalledWith(
        'tenant:registered',
        expect.objectContaining({ tenantId: 'tenant-1' })
      )
    })
  })

  describe('unregisterTenant', () => {
    it('removes the tenant', () => {
      manager.registerTenant(createMetadata(), createConfig())
      manager.unregisterTenant('tenant-1')
      expect(manager.getTenant('tenant-1')).toBeNull()
    })

    it('resets current tenant if unregistering current', () => {
      manager.registerTenant(createMetadata(), createConfig())
      manager.setCurrentTenant('tenant-1')
      manager.unregisterTenant('tenant-1')
      expect(manager.getCurrentTenant()).toBeNull()
    })

    it('emits tenant:unregistered event', () => {
      manager.registerTenant(createMetadata(), createConfig())
      manager.unregisterTenant('tenant-1')
      expect(eventBus.emit).toHaveBeenCalledWith('tenant:unregistered', { tenantId: 'tenant-1' })
    })
  })

  describe('getTenant / getAllTenants', () => {
    it('returns null for unknown tenant', () => {
      expect(manager.getTenant('missing')).toBeNull()
    })

    it('getAllTenants returns all registered tenants', () => {
      manager.registerTenant(createMetadata({ id: 'a' }), createConfig())
      manager.registerTenant(createMetadata({ id: 'b' }), createConfig())
      expect(manager.getAllTenants()).toHaveLength(2)
    })
  })

  describe('setCurrentTenant', () => {
    it('sets the current tenant', () => {
      manager.registerTenant(createMetadata(), createConfig())
      manager.setCurrentTenant('tenant-1')
      expect(manager.getCurrentTenant()).toBeDefined()
      expect(manager.getCurrentTenant()!.getMetadata().id).toBe('tenant-1')
    })

    it('throws when tenant not found', () => {
      expect(() => manager.setCurrentTenant('missing')).toThrow('not found')
    })

    it('throws when tenant is inactive', () => {
      manager.registerTenant(createMetadata({ status: 'suspended' }), createConfig())
      expect(() => manager.setCurrentTenant('tenant-1')).toThrow('not active')
    })

    it('emits tenant:changed event', () => {
      manager.registerTenant(createMetadata(), createConfig())
      manager.setCurrentTenant('tenant-1')
      expect(eventBus.emit).toHaveBeenCalledWith(
        'tenant:changed',
        expect.objectContaining({ tenantId: 'tenant-1' })
      )
    })
  })

  describe('getTenantsByPlan / getTenantsByStatus', () => {
    it('filters by plan', () => {
      manager.registerTenant(createMetadata({ id: 'a', plan: 'free' }), createConfig())
      manager.registerTenant(createMetadata({ id: 'b', plan: 'premium' }), createConfig())
      manager.registerTenant(createMetadata({ id: 'c', plan: 'free' }), createConfig())

      expect(manager.getTenantsByPlan('free')).toHaveLength(2)
      expect(manager.getTenantsByPlan('premium')).toHaveLength(1)
    })

    it('filters by status', () => {
      manager.registerTenant(createMetadata({ id: 'a', status: 'active' }), createConfig())
      manager.registerTenant(createMetadata({ id: 'b', status: 'inactive' }), createConfig())

      expect(manager.getTenantsByStatus('active')).toHaveLength(1)
      expect(manager.getTenantsByStatus('inactive')).toHaveLength(1)
    })
  })

  describe('getStatistics', () => {
    it('returns correct statistics', () => {
      manager.registerTenant(
        createMetadata({ id: 'a', plan: 'free', status: 'active' }),
        createConfig()
      )
      manager.registerTenant(
        createMetadata({ id: 'b', plan: 'premium', status: 'active' }),
        createConfig()
      )
      manager.registerTenant(
        createMetadata({ id: 'c', plan: 'free', status: 'inactive' }),
        createConfig()
      )
      manager.setCurrentTenant('a')

      const stats = manager.getStatistics()
      expect(stats.totalTenants).toBe(3)
      expect(stats.activeTenants).toBe(2)
      expect(stats.currentTenant).toBe('a')
      expect(stats.planCounts['free']).toBe(2)
      expect(stats.planCounts['premium']).toBe(1)
      expect(stats.statusCounts['active']).toBe(2)
      expect(stats.statusCounts['inactive']).toBe(1)
    })
  })

  describe('clear', () => {
    it('clears all tenants and resets current', () => {
      manager.registerTenant(createMetadata(), createConfig())
      manager.setCurrentTenant('tenant-1')
      manager.clear()

      expect(manager.getAllTenants()).toHaveLength(0)
      expect(manager.getCurrentTenant()).toBeNull()
    })

    it('emits tenant:registry:cleared event', () => {
      manager.clear()
      expect(eventBus.emit).toHaveBeenCalledWith('tenant:registry:cleared', {})
    })
  })
})
