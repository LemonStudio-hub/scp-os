import { describe, it, expect } from 'vitest'
import { SCPEntity } from '../scp.entity'

describe('SCPEntity', () => {
  const createEntity = (overrides = {}) =>
    new SCPEntity({
      id: 'SCP-173',
      name: 'The Sculpture',
      class: 'Euclid',
      site: 'Site-19',
      description: 'A concrete sculpture',
      containmentProcedures: ['Keep in locked container'],
      warningLevel: 'high',
      ...overrides,
    })

  describe('isSafe', () => {
    it('returns true for Safe class', () => {
      expect(createEntity({ class: 'Safe' }).isSafe()).toBe(true)
    })
    it('returns false for non-Safe class', () => {
      expect(createEntity({ class: 'Euclid' }).isSafe()).toBe(false)
    })
  })

  describe('isDangerous', () => {
    it('returns true for Euclid', () => {
      expect(createEntity({ class: 'Euclid' }).isDangerous()).toBe(true)
    })
    it('returns true for Keter', () => {
      expect(createEntity({ class: 'Keter' }).isDangerous()).toBe(true)
    })
    it('returns false for Safe', () => {
      expect(createEntity({ class: 'Safe' }).isDangerous()).toBe(false)
    })
  })

  describe('isExtremelyDangerous', () => {
    it('returns true for Keter class', () => {
      expect(createEntity({ class: 'Keter', warningLevel: 'low' }).isExtremelyDangerous()).toBe(
        true
      )
    })
    it('returns true for extreme warning level', () => {
      expect(createEntity({ class: 'Safe', warningLevel: 'extreme' }).isExtremelyDangerous()).toBe(
        true
      )
    })
    it('returns false for Safe with low warning', () => {
      expect(createEntity({ class: 'Safe', warningLevel: 'low' }).isExtremelyDangerous()).toBe(
        false
      )
    })
  })

  describe('getWarningPriority', () => {
    it('returns correct priority for each level', () => {
      expect(createEntity({ warningLevel: 'low' }).getWarningPriority()).toBe(1)
      expect(createEntity({ warningLevel: 'medium' }).getWarningPriority()).toBe(2)
      expect(createEntity({ warningLevel: 'high' }).getWarningPriority()).toBe(3)
      expect(createEntity({ warningLevel: 'extreme' }).getWarningPriority()).toBe(4)
    })
  })

  describe('getClassPriority', () => {
    it('returns correct priority for each class', () => {
      expect(createEntity({ class: 'Safe' }).getClassPriority()).toBe(1)
      expect(createEntity({ class: 'Euclid' }).getClassPriority()).toBe(2)
      expect(createEntity({ class: 'Keter' }).getClassPriority()).toBe(3)
      expect(createEntity({ class: 'Thaumiel' }).getClassPriority()).toBe(4)
    })
  })

  describe('toJSON', () => {
    it('serializes to plain object', () => {
      const entity = createEntity()
      const json = entity.toJSON()
      expect(json.id).toBe('SCP-173')
      expect(json.class).toBe('Euclid')
      expect(typeof json.createdAt).toBe('string')
      expect(typeof json.updatedAt).toBe('string')
    })
  })

  describe('fromJSON', () => {
    it('deserializes from plain object', () => {
      const entity = createEntity()
      const json = entity.toJSON()
      const restored = SCPEntity.fromJSON(json)
      expect(restored.id).toBe(entity.id)
      expect(restored.class).toBe(entity.class)
      expect(restored.createdAt).toBeInstanceOf(Date)
    })
  })
})
