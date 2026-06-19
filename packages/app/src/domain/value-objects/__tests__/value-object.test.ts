import { describe, it, expect } from 'vitest'
import { ValueObject } from '../value-object'

// Concrete subclass for testing
class StringValueObject extends ValueObject<string> {
  protected validate(): void {
    if (typeof this.value !== 'string') {
      throw new Error('Value must be a string')
    }
  }
}

class NumberValueObject extends ValueObject<number> {
  protected validate(): void {
    if (typeof this.value !== 'number') {
      throw new Error('Value must be a number')
    }
    if (this.value < 0) {
      throw new Error('Value must be non-negative')
    }
  }
}

describe('ValueObject', () => {
  describe('getValue', () => {
    it('returns the stored value', () => {
      const vo = new StringValueObject('hello')
      expect(vo.getValue()).toBe('hello')
    })
  })

  describe('toString', () => {
    it('converts value to string', () => {
      expect(new StringValueObject('hello').toString()).toBe('hello')
      expect(new NumberValueObject(42).toString()).toBe('42')
    })
  })

  describe('toJSON', () => {
    it('returns the raw value', () => {
      expect(new StringValueObject('test').toJSON()).toBe('test')
      expect(new NumberValueObject(10).toJSON()).toBe(10)
    })
  })

  describe('equals', () => {
    it('returns true for same reference', () => {
      const vo = new StringValueObject('test')
      expect(vo.equals(vo)).toBe(true)
    })

    it('returns true for equal values', () => {
      const a = new StringValueObject('test')
      const b = new StringValueObject('test')
      expect(a.equals(b)).toBe(true)
    })

    it('returns false for different values', () => {
      const a = new StringValueObject('foo')
      const b = new StringValueObject('bar')
      expect(a.equals(b)).toBe(false)
    })
  })

  describe('hashCode', () => {
    it('returns consistent hash for same value', () => {
      const a = new StringValueObject('test')
      const b = new StringValueObject('test')
      expect(a.hashCode()).toBe(b.hashCode())
    })

    it('returns different hash for different values', () => {
      const a = new StringValueObject('foo')
      const b = new StringValueObject('bar')
      expect(a.hashCode()).not.toBe(b.hashCode())
    })
  })

  describe('validate', () => {
    it('calls validate on construction', () => {
      expect(() => new NumberValueObject(-1)).toThrow('non-negative')
    })

    it('does not throw for valid values', () => {
      expect(() => new NumberValueObject(0)).not.toThrow()
      expect(() => new StringValueObject('valid')).not.toThrow()
    })
  })
})
