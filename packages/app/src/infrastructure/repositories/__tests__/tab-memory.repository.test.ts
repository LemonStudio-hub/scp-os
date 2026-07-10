import { describe, it, expect, beforeEach } from 'vitest'
import { TabMemoryRepository } from '../tab-memory.repository'
import { TabEntity } from '../../../domain/entities'

describe('TabMemoryRepository', () => {
  let repo: TabMemoryRepository

  const createTab = (
    id: string,
    overrides: Partial<{ type: 'terminal' | 'scp-browser' | 'database' | 'settings'; status: 'active' | 'inactive' | 'loading' | 'error'; closable: boolean }> = {},
  ) =>
    new TabEntity({
      id,
      title: `Tab ${id}`,
      type: overrides.type ?? 'terminal',
      status: overrides.status ?? 'active',
      closable: overrides.closable ?? true,
    })

  beforeEach(() => {
    repo = new TabMemoryRepository()
  })

  describe('getActive / setActive', () => {
    it('returns null when no active tab', async () => {
      expect(await repo.getActive()).toBeNull()
    })

    it('sets and gets active tab', async () => {
      const tab = createTab('t1')
      await repo.save(tab)
      await repo.setActive('t1')
      const active = await repo.getActive()
      expect(active?.id).toBe('t1')
    })
  })

  describe('findByType', () => {
    it('filters by tab type', async () => {
      await repo.save(createTab('t1', { type: 'terminal' }))
      await repo.save(createTab('t2', { type: 'settings' }))
      await repo.save(createTab('t3', { type: 'terminal' }))
      const results = await repo.findByType('terminal')
      expect(results).toHaveLength(2)
    })
  })

  describe('findByStatus', () => {
    it('filters by tab status', async () => {
      await repo.save(createTab('t1', { status: 'active' }))
      await repo.save(createTab('t2', { status: 'inactive' }))
      const results = await repo.findByStatus('active')
      expect(results).toHaveLength(1)
    })
  })

  describe('getCountByType', () => {
    it('returns counts per type', async () => {
      await repo.save(createTab('t1', { type: 'terminal' }))
      await repo.save(createTab('t2', { type: 'terminal' }))
      await repo.save(createTab('t3', { type: 'settings' }))
      const counts = await repo.getCountByType()
      expect(counts['terminal']).toBe(2)
      expect(counts['settings']).toBe(1)
    })
  })

  describe('getCountByStatus', () => {
    it('returns counts per status', async () => {
      await repo.save(createTab('t1', { status: 'active' }))
      await repo.save(createTab('t2', { status: 'inactive' }))
      await repo.save(createTab('t3', { status: 'active' }))
      const counts = await repo.getCountByStatus()
      expect(counts['active']).toBe(2)
      expect(counts['inactive']).toBe(1)
    })
  })

  describe('close', () => {
    it('closes a closable tab', async () => {
      await repo.save(createTab('t1'))
      await repo.close('t1')
      expect(await repo.findById('t1')).toBeNull()
    })

    it('throws when tab not found', async () => {
      await expect(repo.close('missing')).rejects.toThrow('not found')
    })

    it('throws when tab is not closable', async () => {
      await repo.save(createTab('t1', { closable: false }))
      await expect(repo.close('t1')).rejects.toThrow('not closable')
    })

    it('auto-updates active tab when closing active tab', async () => {
      await repo.save(createTab('t1'))
      await repo.save(createTab('t2'))
      await repo.setActive('t1')
      await repo.close('t1')
      const active = await repo.getActive()
      expect(active?.id).toBe('t2')
    })
  })

  describe('closeAll', () => {
    it('clears all tabs', async () => {
      await repo.save(createTab('t1'))
      await repo.save(createTab('t2'))
      await repo.closeAll()
      expect(await repo.count()).toBe(0)
      expect(await repo.getActive()).toBeNull()
    })
  })

  describe('closeInactive', () => {
    it('closes only inactive closable tabs', async () => {
      await repo.save(createTab('t1', { status: 'active' }))
      await repo.save(createTab('t2', { status: 'inactive' }))
      await repo.save(createTab('t3', { status: 'inactive', closable: false }))
      await repo.closeInactive()
      expect(await repo.count()).toBe(2)
      expect(await repo.findById('t2')).toBeNull()
      expect(await repo.findById('t3')).not.toBeNull()
    })
  })

  describe('updateStatus', () => {
    it('updates tab status', async () => {
      await repo.save(createTab('t1', { status: 'active' }))
      await repo.updateStatus('t1', 'loading')
      const tab = await repo.findById('t1')
      expect(tab?.status).toBe('loading')
    })

    it('throws when tab not found', async () => {
      await expect(repo.updateStatus('missing', 'active')).rejects.toThrow('not found')
    })
  })

  describe('updateTitle', () => {
    it('updates tab title', async () => {
      await repo.save(createTab('t1'))
      await repo.updateTitle('t1', 'New Title')
      const tab = await repo.findById('t1')
      expect(tab?.title).toBe('New Title')
    })

    it('throws when tab not found', async () => {
      await expect(repo.updateTitle('missing', 'title')).rejects.toThrow('not found')
    })
  })

  describe('updateData', () => {
    it('merges data key', async () => {
      await repo.save(createTab('t1'))
      await repo.updateData('t1', 'content', 'hello')
      await repo.updateData('t1', 'cursor', 5)
      const tab = await repo.findById('t1')
      expect(tab?.data).toEqual({ content: 'hello', cursor: 5 })
    })

    it('throws when tab not found', async () => {
      await expect(repo.updateData('missing', 'key', 'val')).rejects.toThrow('not found')
    })
  })

  describe('getAll', () => {
    it('returns all tabs', async () => {
      await repo.save(createTab('t1'))
      await repo.save(createTab('t2'))
      expect(await repo.getAll()).toHaveLength(2)
    })
  })

  describe('findWithQuery', () => {
    it('combines type and status filters', async () => {
      await repo.save(createTab('t1', { type: 'terminal', status: 'active' }))
      await repo.save(createTab('t2', { type: 'terminal', status: 'inactive' }))
      await repo.save(createTab('t3', { type: 'settings', status: 'active' }))
      const results = await repo.findWithQuery({ type: 'terminal', status: 'active' })
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('t1')
    })
  })
})
