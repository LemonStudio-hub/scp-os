import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PluginSyncRegistry } from './pluginSyncRegistry'

describe('PluginSyncRegistry', () => {
  let registry: PluginSyncRegistry

  beforeEach(() => {
    registry = new PluginSyncRegistry()
    localStorage.clear()
  })

  it('registers, overwrites, unregisters, and returns descriptor copies', () => {
    const localStorageKeys = ['weather-city']
    const defaults = { 'weather-city': 'Shanghai' }
    registry.register({
      id: 'weather-widget',
      localStorageKeys,
      defaults,
    })
    localStorageKeys.push('mutated-before-overwrite')
    defaults['weather-city'] = 'Beijing'
    registry.register({
      id: 'weather-widget',
      localStorageKeys: ['weather-unit'],
      defaults: {
        'weather-unit': 'C',
      },
    })

    const descriptors = registry.getAll()
    descriptors[0].localStorageKeys = ['mutated']
    descriptors[0].defaults = { 'weather-unit': 'F' }

    expect(registry.getAll()).toEqual([
      {
        id: 'weather-widget',
        localStorageKeys: ['weather-unit'],
        defaults: {
          'weather-unit': 'C',
        },
      },
    ])

    registry.unregister('weather-widget')
    expect(registry.getAll()).toEqual([])
  })

  it('collects declared localStorage keys', () => {
    registry.register({
      id: 'weather-widget',
      localStorageKeys: ['weather-city', 'weather-unit'],
    })
    localStorage.setItem('weather-city', 'Shanghai')
    localStorage.setItem('weather-unit', 'C')

    expect(registry.collectAll()).toEqual({
      'weather-widget': {
        'weather-city': 'Shanghai',
        'weather-unit': 'C',
      },
    })
  })

  it('uses defaults for missing keys and skips plugins without data', () => {
    registry.register({
      id: 'weather-widget',
      localStorageKeys: ['weather-city', 'weather-unit'],
      defaults: {
        'weather-city': 'Shanghai',
      },
    })
    registry.register({
      id: 'empty-widget',
      localStorageKeys: ['empty-key'],
    })

    expect(registry.collectAll()).toEqual({
      'weather-widget': {
        'weather-city': 'Shanghai',
      },
    })
  })

  it('only applies registered plugins and declared keys', () => {
    registry.register({
      id: 'weather-widget',
      localStorageKeys: ['weather-city'],
    })

    registry.applyAll({
      'weather-widget': {
        'weather-city': 'Beijing',
        'weather-unit': 'F',
      },
      unknown: {
        ignored: 'value',
      },
    })

    expect(localStorage.getItem('weather-city')).toBe('Beijing')
    expect(localStorage.getItem('weather-unit')).toBeNull()
    expect(localStorage.getItem('ignored')).toBeNull()
  })

  it('writes strings, serializes values, and removes nullish values', () => {
    registry.register({
      id: 'weather-widget',
      localStorageKeys: ['weather-city', 'weather-interval', 'weather-options', 'weather-unit'],
    })
    localStorage.setItem('weather-unit', 'C')

    registry.applyAll({
      'weather-widget': {
        'weather-city': 'Shanghai',
        'weather-interval': 3600,
        'weather-options': { alerts: true },
        'weather-unit': null,
      },
    })

    expect(localStorage.getItem('weather-city')).toBe('Shanghai')
    expect(localStorage.getItem('weather-interval')).toBe('3600')
    expect(localStorage.getItem('weather-options')).toBe('{"alerts":true}')
    expect(localStorage.getItem('weather-unit')).toBeNull()
  })

  it('calls onRestore without letting callback errors block writes', () => {
    const onRestore = vi.fn(() => {
      throw new Error('restore failed')
    })
    registry.register({
      id: 'weather-widget',
      localStorageKeys: ['weather-city'],
      onRestore,
    })

    registry.applyAll({
      'weather-widget': {
        'weather-city': 'Shanghai',
      },
    })

    expect(localStorage.getItem('weather-city')).toBe('Shanghai')
    expect(onRestore).toHaveBeenCalledWith({
      'weather-city': 'Shanghai',
    })
  })
})
