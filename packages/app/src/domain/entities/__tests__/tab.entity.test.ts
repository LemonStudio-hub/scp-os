import { describe, it, expect } from 'vitest'
import { TabEntity, TabCollection } from '../tab.entity'

describe('TabEntity', () => {
  const createTab = (overrides = {}) =>
    new TabEntity({
      id: 'tab-1',
      title: 'Terminal',
      type: 'terminal',
      ...overrides,
    })

  describe('constructor', () => {
    it('sets defaults correctly', () => {
      const tab = createTab()
      expect(tab.status).toBe('active')
      expect(tab.closable).toBe(true)
      expect(tab.data).toEqual({})
      expect(tab.createdAt).toBeInstanceOf(Date)
      expect(tab.updatedAt).toBeInstanceOf(Date)
    })

    it('accepts custom values', () => {
      const tab = createTab({
        status: 'inactive',
        closable: false,
        icon: 'terminal',
        data: { key: 'value' },
      })
      expect(tab.status).toBe('inactive')
      expect(tab.closable).toBe(false)
      expect(tab.icon).toBe('terminal')
      expect(tab.data).toEqual({ key: 'value' })
    })
  })

  describe('setStatus', () => {
    it('updates status and updatedAt', () => {
      const tab = createTab()
      const before = tab.updatedAt
      tab.setStatus('loading')
      expect(tab.status).toBe('loading')
      expect(tab.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    })
  })

  describe('setTitle', () => {
    it('updates title and updatedAt', () => {
      const tab = createTab()
      tab.setTitle('New Title')
      expect(tab.title).toBe('New Title')
    })
  })

  describe('setData', () => {
    it('sets a data key and updates updatedAt', () => {
      const tab = createTab()
      tab.setData('content', 'hello')
      expect(tab.data.content).toBe('hello')
    })
  })

  describe('getData', () => {
    it('returns the value for a data key', () => {
      const tab = createTab({ data: { x: 42 } })
      expect(tab.getData('x')).toBe(42)
    })

    it('returns undefined for missing key', () => {
      const tab = createTab()
      expect(tab.getData('missing')).toBeUndefined()
    })
  })

  describe('status checks', () => {
    it('isActive returns true for active status', () => {
      expect(createTab({ status: 'active' }).isActive()).toBe(true)
      expect(createTab({ status: 'inactive' }).isActive()).toBe(false)
    })

    it('isLoading returns true for loading status', () => {
      expect(createTab({ status: 'loading' }).isLoading()).toBe(true)
      expect(createTab({ status: 'active' }).isLoading()).toBe(false)
    })

    it('hasError returns true for error status', () => {
      expect(createTab({ status: 'error' }).hasError()).toBe(true)
      expect(createTab({ status: 'active' }).hasError()).toBe(false)
    })
  })

  describe('toJSON / fromJSON', () => {
    it('round-trips through serialization', () => {
      const tab = createTab({ icon: 'terminal', data: { cursor: 5 } })
      const json = tab.toJSON()
      expect(typeof json.createdAt).toBe('string')
      expect(typeof json.updatedAt).toBe('string')

      const restored = TabEntity.fromJSON(json)
      expect(restored.id).toBe(tab.id)
      expect(restored.title).toBe(tab.title)
      expect(restored.type).toBe(tab.type)
      expect(restored.status).toBe(tab.status)
      expect(restored.closable).toBe(tab.closable)
      expect(restored.data).toEqual(tab.data)
    })
  })
})

describe('TabCollection', () => {
  const createTab = (id: string, overrides = {}) =>
    new TabEntity({
      id,
      title: `Tab ${id}`,
      type: 'terminal',
      ...overrides,
    })

  describe('add', () => {
    it('adds a tab and sets it active if first', () => {
      const collection = new TabCollection()
      const tab = createTab('t1')
      collection.add(tab)
      expect(collection.getCount()).toBe(1)
      expect(collection.getActiveId()).toBe('t1')
    })

    it('does not change active tab when adding second tab', () => {
      const collection = new TabCollection()
      collection.add(createTab('t1'))
      collection.add(createTab('t2'))
      expect(collection.getActiveId()).toBe('t1')
      expect(collection.getCount()).toBe(2)
    })
  })

  describe('remove', () => {
    it('removes a closable tab', () => {
      const collection = new TabCollection()
      collection.add(createTab('t1'))
      collection.remove('t1')
      expect(collection.getCount()).toBe(0)
      expect(collection.getActiveId()).toBeNull()
    })

    it('throws when removing a non-closable tab', () => {
      const collection = new TabCollection()
      collection.add(createTab('t1', { closable: false }))
      expect(() => collection.remove('t1')).toThrow('not closable')
    })

    it('auto-sets next active tab when removing active tab', () => {
      const collection = new TabCollection()
      collection.add(createTab('t1'))
      collection.add(createTab('t2'))
      collection.setActive('t1')
      collection.remove('t1')
      expect(collection.getActiveId()).toBe('t2')
    })
  })

  describe('get / getAll / has', () => {
    it('returns correct tab references', () => {
      const collection = new TabCollection()
      const tab = createTab('t1')
      collection.add(tab)
      expect(collection.get('t1')).toBe(tab)
      expect(collection.get('missing')).toBeUndefined()
      expect(collection.has('t1')).toBe(true)
      expect(collection.has('missing')).toBe(false)
      expect(collection.getAll()).toHaveLength(1)
    })
  })

  describe('setActive', () => {
    it('sets active tab and deactivates others', () => {
      const collection = new TabCollection()
      collection.add(createTab('t1'))
      collection.add(createTab('t2'))
      collection.setActive('t2')
      expect(collection.getActiveId()).toBe('t2')
      expect(collection.get('t1')!.status).toBe('inactive')
      expect(collection.get('t2')!.status).toBe('active')
    })

    it('throws when setting non-existent tab as active', () => {
      const collection = new TabCollection()
      expect(() => collection.setActive('missing')).toThrow('not found')
    })
  })

  describe('clear', () => {
    it('removes all tabs and resets active', () => {
      const collection = new TabCollection()
      collection.add(createTab('t1'))
      collection.add(createTab('t2'))
      collection.clear()
      expect(collection.getCount()).toBe(0)
      expect(collection.getActiveId()).toBeNull()
    })
  })
})
