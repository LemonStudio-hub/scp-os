import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DataSourceManagerService } from '../datasource-manager.service'
import type { DataSourcePlugin, DataSourceDefinition } from '../../plugins/types'
import type { IEventBus } from '../../events/event-bus'

const createEventBus = (): IEventBus => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  once: vi.fn(),
  removeAllListeners: vi.fn(),
  listenerCount: vi.fn().mockReturnValue(0),
})

const createDataSourceDef = (id: string, type = 'api'): DataSourceDefinition => ({
  id,
  name: `Source ${id}`,
  metadata: {
    name: `Source ${id}`,
    description: `Desc ${id}`,
    author: 'test',
    version: '1.0.0',
    type: type as any,
    capabilities: ['query'],
  },
})

const createPlugin = (
  name: string,
  dataSources: DataSourceDefinition[] = [createDataSourceDef(`${name}-ds`)]
): DataSourcePlugin => ({
  name,
  version: '1.0.0',
  type: 'datasource',
  metadata: dataSources[0].metadata,
  dataSources,
  onLoad: vi.fn(),
  onUnload: vi.fn(),
  query: vi.fn().mockResolvedValue({ data: [], total: 0, hasMore: false }),
  get: vi.fn().mockResolvedValue(null),
  search: vi.fn().mockResolvedValue({ data: [], total: 0, hasMore: false }),
  getDataSource: vi.fn(),
  getDataSourceIds: vi.fn().mockImplementation(() => dataSources.map((ds) => ds.id)),
  hasDataSource: vi.fn().mockImplementation((id: string) => dataSources.some((ds) => ds.id === id)),
  testConnection: vi.fn().mockResolvedValue(true),
  getStatistics: vi.fn().mockResolvedValue({ totalItems: 0 }),
})

describe('DataSourceManagerService', () => {
  let manager: DataSourceManagerService
  let eventBus: IEventBus

  beforeEach(() => {
    eventBus = createEventBus()
    manager = new DataSourceManagerService(eventBus)
  })

  describe('registerPlugin', () => {
    it('calls onLoad and registers data sources', async () => {
      const plugin = createPlugin('test-plugin')
      await manager.registerPlugin(plugin)

      expect(plugin.onLoad).toHaveBeenCalledOnce()
      expect(manager.getDataSource('test-plugin-ds')).toBeDefined()
    })

    it('emits datasource:plugin:registered event', async () => {
      const plugin = createPlugin('test-plugin')
      await manager.registerPlugin(plugin)

      expect(eventBus.emit).toHaveBeenCalledWith(
        'datasource:plugin:registered',
        expect.objectContaining({ pluginName: 'test-plugin' })
      )
    })

    it('registers multiple data sources from one plugin', async () => {
      const ds1 = createDataSourceDef('ds1')
      const ds2 = createDataSourceDef('ds2')
      const plugin = createPlugin('multi-plugin', [ds1, ds2])
      await manager.registerPlugin(plugin)

      expect(manager.getDataSource('ds1')).toBeDefined()
      expect(manager.getDataSource('ds2')).toBeDefined()
    })
  })

  describe('unregisterPlugin', () => {
    it('calls onUnload and removes data sources', async () => {
      const plugin = createPlugin('test-plugin')
      await manager.registerPlugin(plugin)
      await manager.unregisterPlugin('test-plugin')

      expect(plugin.onUnload).toHaveBeenCalledOnce()
      expect(manager.getDataSource('test-plugin-ds')).toBeNull()
    })

    it('emits datasource:plugin:unregistered event', async () => {
      const plugin = createPlugin('test-plugin')
      await manager.registerPlugin(plugin)
      await manager.unregisterPlugin('test-plugin')

      expect(eventBus.emit).toHaveBeenCalledWith('datasource:plugin:unregistered', {
        pluginName: 'test-plugin',
      })
    })

    it('does nothing when plugin is not found', async () => {
      await expect(manager.unregisterPlugin('missing')).resolves.toBeUndefined()
    })
  })

  describe('registerDataSource / unregisterDataSource', () => {
    it('registers and retrieves a data source', () => {
      const ds = createDataSourceDef('src1')
      manager.registerDataSource(ds)
      expect(manager.getDataSource('src1')).toBe(ds)
    })

    it('emits datasource:registered event', () => {
      const ds = createDataSourceDef('src1')
      manager.registerDataSource(ds)
      expect(eventBus.emit).toHaveBeenCalledWith(
        'datasource:registered',
        expect.objectContaining({ dataSourceId: 'src1' })
      )
    })

    it('unregisters a data source', () => {
      manager.registerDataSource(createDataSourceDef('src1'))
      manager.unregisterDataSource('src1')
      expect(manager.getDataSource('src1')).toBeNull()
    })

    it('emits datasource:unregistered event', () => {
      manager.registerDataSource(createDataSourceDef('src1'))
      manager.unregisterDataSource('src1')
      expect(eventBus.emit).toHaveBeenCalledWith('datasource:unregistered', {
        dataSourceId: 'src1',
      })
    })
  })

  describe('getAllDataSources', () => {
    it('returns all registered data sources', () => {
      manager.registerDataSource(createDataSourceDef('a'))
      manager.registerDataSource(createDataSourceDef('b'))
      expect(manager.getAllDataSources()).toHaveLength(2)
    })
  })

  describe('query / get / search', () => {
    it('query delegates to the plugin', async () => {
      const plugin = createPlugin('p')
      await manager.registerPlugin(plugin)

      await manager.query('p-ds', { limit: 10 })
      expect(plugin.query).toHaveBeenCalledWith('p-ds', { limit: 10 })
    })

    it('query throws when plugin not found', async () => {
      await expect(manager.query('missing', {})).rejects.toThrow('Plugin not found')
    })

    it('get delegates to the plugin', async () => {
      const plugin = createPlugin('p')
      await manager.registerPlugin(plugin)

      await manager.get('p-ds', 'item-1')
      expect(plugin.get).toHaveBeenCalledWith('p-ds', 'item-1')
    })

    it('get throws when plugin not found', async () => {
      await expect(manager.get('missing', 'id')).rejects.toThrow('Plugin not found')
    })

    it('search delegates to the plugin', async () => {
      const plugin = createPlugin('p')
      await manager.registerPlugin(plugin)

      await manager.search('p-ds', 'keyword')
      expect(plugin.search).toHaveBeenCalledWith('p-ds', 'keyword', undefined)
    })

    it('search throws when plugin not found', async () => {
      await expect(manager.search('missing', 'kw')).rejects.toThrow('Plugin not found')
    })
  })

  describe('testConnection', () => {
    it('delegates to the plugin', async () => {
      const plugin = createPlugin('p')
      await manager.registerPlugin(plugin)

      const result = await manager.testConnection('p-ds')
      expect(result).toBe(true)
      expect(plugin.testConnection).toHaveBeenCalledWith('p-ds')
    })

    it('returns false when plugin not found', async () => {
      expect(await manager.testConnection('missing')).toBe(false)
    })
  })

  describe('getStatistics', () => {
    it('delegates to the plugin', async () => {
      const plugin = createPlugin('p')
      await manager.registerPlugin(plugin)

      const stats = await manager.getStatistics('p-ds')
      expect(stats).toEqual({ totalItems: 0 })
    })

    it('throws when plugin not found', async () => {
      await expect(manager.getStatistics('missing')).rejects.toThrow('Plugin not found')
    })
  })

  describe('getGlobalStatistics', () => {
    it('returns correct counts and type breakdown', () => {
      manager.registerDataSource(createDataSourceDef('a', 'api'))
      manager.registerDataSource(createDataSourceDef('b', 'database'))
      manager.registerDataSource(createDataSourceDef('c', 'api'))

      const stats = manager.getGlobalStatistics()
      expect(stats.totalDataSources).toBe(3)
      expect(stats.totalPlugins).toBe(0)
      expect(stats.types['api']).toBe(2)
      expect(stats.types['database']).toBe(1)
    })
  })

  describe('clear', () => {
    it('clears all data sources and plugins', async () => {
      await manager.registerPlugin(createPlugin('p'))
      manager.clear()

      expect(manager.getAllDataSources()).toHaveLength(0)
      expect(manager.getAllPlugins()).toHaveLength(0)
    })

    it('emits datasource:registry:cleared event', () => {
      manager.clear()
      expect(eventBus.emit).toHaveBeenCalledWith('datasource:registry:cleared', {})
    })
  })
})
