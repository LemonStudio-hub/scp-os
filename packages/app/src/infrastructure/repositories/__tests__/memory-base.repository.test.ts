import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryBaseRepository } from '../memory-base.repository'
import type { Entity } from '../../../domain/entities'

interface TestEntity extends Entity {
  id: string
  name: string
  value: number
  createdAt: Date
  updatedAt: Date
}

class TestRepository extends MemoryBaseRepository<TestEntity> {}

describe('MemoryBaseRepository', () => {
  let repo: TestRepository

  const createEntity = (id: string, name = `Entity ${id}`, value = 0): TestEntity => ({
    id,
    name,
    value,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  beforeEach(() => {
    repo = new TestRepository()
  })

  describe('findById', () => {
    it('returns entity when found', async () => {
      const entity = createEntity('1')
      await repo.save(entity)
      expect(await repo.findById('1')).toEqual(entity)
    })

    it('returns null when not found', async () => {
      expect(await repo.findById('missing')).toBeNull()
    })
  })

  describe('findAll', () => {
    it('returns all entities', async () => {
      await repo.save(createEntity('1'))
      await repo.save(createEntity('2'))
      const all = await repo.findAll()
      expect(all).toHaveLength(2)
    })

    it('returns empty array when empty', async () => {
      expect(await repo.findAll()).toEqual([])
    })
  })

  describe('find', () => {
    beforeEach(async () => {
      await repo.save(createEntity('1', 'Alpha', 10))
      await repo.save(createEntity('2', 'Beta', 20))
      await repo.save(createEntity('3', 'Gamma', 30))
    })

    it('applies filter', async () => {
      const result = await repo.find({ filter: (e) => e.value > 15 })
      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('applies sort', async () => {
      const result = await repo.find({ sort: (a, b) => b.value - a.value })
      expect(result.data[0].name).toBe('Gamma')
    })

    it('applies limit', async () => {
      const result = await repo.find({ limit: 2 })
      expect(result.data).toHaveLength(2)
      expect(result.hasMore).toBe(true)
    })

    it('applies offset', async () => {
      const result = await repo.find({ offset: 1, limit: 2 })
      expect(result.data).toHaveLength(2)
    })

    it('returns hasMore false when all items fit', async () => {
      const result = await repo.find({ limit: 10 })
      expect(result.hasMore).toBe(false)
    })
  })

  describe('findOne', () => {
    it('returns first matching entity', async () => {
      await repo.save(createEntity('1', 'Alpha'))
      await repo.save(createEntity('2', 'Beta'))
      const found = await repo.findOne((e) => e.name === 'Beta')
      expect(found?.id).toBe('2')
    })

    it('returns null when no match', async () => {
      await repo.save(createEntity('1'))
      expect(await repo.findOne((e) => e.name === 'Missing')).toBeNull()
    })
  })

  describe('save', () => {
    it('creates new entity', async () => {
      const entity = createEntity('1')
      await repo.save(entity)
      expect(await repo.findById('1')).toEqual(entity)
    })

    it('updates existing entity', async () => {
      await repo.save(createEntity('1', 'Original'))
      await repo.save(createEntity('1', 'Updated'))
      expect((await repo.findById('1'))!.name).toBe('Updated')
    })
  })

  describe('delete', () => {
    it('removes entity', async () => {
      await repo.save(createEntity('1'))
      await repo.delete('1')
      expect(await repo.findById('1')).toBeNull()
    })
  })

  describe('exists', () => {
    it('returns true when entity exists', async () => {
      await repo.save(createEntity('1'))
      expect(await repo.exists('1')).toBe(true)
    })

    it('returns false when entity does not exist', async () => {
      expect(await repo.exists('1')).toBe(false)
    })
  })

  describe('count', () => {
    it('returns entity count', async () => {
      await repo.save(createEntity('1'))
      await repo.save(createEntity('2'))
      expect(await repo.count()).toBe(2)
    })
  })

  describe('clear', () => {
    it('removes all entities', async () => {
      await repo.save(createEntity('1'))
      await repo.save(createEntity('2'))
      await repo.clear()
      expect(await repo.count()).toBe(0)
    })
  })

  describe('initializeWith', () => {
    it('clears and repopulates', async () => {
      await repo.save(createEntity('old'))
      await repo.initializeWith([createEntity('new1'), createEntity('new2')])
      expect(await repo.count()).toBe(2)
      expect(await repo.findById('old')).toBeNull()
      expect(await repo.findById('new1')).not.toBeNull()
    })
  })

  describe('getIds', () => {
    it('returns all entity IDs', async () => {
      await repo.save(createEntity('a'))
      await repo.save(createEntity('b'))
      expect(repo.getIds()).toEqual(expect.arrayContaining(['a', 'b']))
    })
  })
})
