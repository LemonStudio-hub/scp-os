import { describe, it, expect } from 'vitest'
import { ClassParser } from '../parsers/classParser'

describe('ClassParser', () => {
  const parser = new ClassParser()

  describe('isValidClass', () => {
    it('should return true for SAFE', () => {
      expect(parser.isValidClass('SAFE')).toBe(true)
    })

    it('should return false for INVALID', () => {
      expect(parser.isValidClass('INVALID')).toBe(false)
    })

    it('should return true for all known object classes', () => {
      const validClasses = [
        'SAFE',
        'EUCLID',
        'KETER',
        'THAUMIEL',
        'NEUTRALIZED',
        'PENDING',
        'UNKNOWN',
      ]
      for (const className of validClasses) {
        expect(parser.isValidClass(className)).toBe(true)
      }
    })
  })
})
