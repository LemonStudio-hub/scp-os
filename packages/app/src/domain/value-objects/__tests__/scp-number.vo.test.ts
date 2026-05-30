import { describe, it, expect } from 'vitest'
import { SCPNumber } from '../scp-number.vo'

describe('SCPNumber', () => {
  describe('construction', () => {
    it('creates valid SCP number with standard format', () => {
      const scp = new SCPNumber('SCP-173')
      expect(scp.getValue()).toBe('SCP-173')
    })

    it('creates valid SCP number with variant', () => {
      const scp = new SCPNumber('SCP-966-J')
      expect(scp.getValue()).toBe('SCP-966-J')
    })

    it('normalizes to uppercase', () => {
      const scp = new SCPNumber('scp-173')
      expect(scp.getValue()).toBe('SCP-173')
    })

    it('accepts SCP-0', () => {
      const scp = new SCPNumber('SCP-0')
      expect(scp.getValue()).toBe('SCP-0')
    })

    it('accepts SCP-9999', () => {
      const scp = new SCPNumber('SCP-9999')
      expect(scp.getValue()).toBe('SCP-9999')
    })
  })

  describe('invalid construction', () => {
    it('throws on empty string', () => {
      expect(() => new SCPNumber('')).toThrow('SCP number cannot be empty')
    })

    it('throws on invalid format', () => {
      expect(() => new SCPNumber('173')).toThrow('Invalid SCP number')
    })

    it('throws on format without prefix', () => {
      expect(() => new SCPNumber('TEST-173')).toThrow('Invalid SCP number')
    })

    it('throws on negative number range', () => {
      expect(() => new SCPNumber('SCP-10000')).toThrow('SCP number must be between 0 and 9999')
    })

    it('throws on letters as number', () => {
      expect(() => new SCPNumber('SCP-ABC')).toThrow('Invalid SCP number')
    })
  })

  describe('getNumber', () => {
    it('returns numeric part', () => {
      expect(new SCPNumber('SCP-173').getNumber()).toBe(173)
    })

    it('returns numeric part for variant', () => {
      expect(new SCPNumber('SCP-966-J').getNumber()).toBe(966)
    })

    it('returns 0 for SCP-0', () => {
      expect(new SCPNumber('SCP-0').getNumber()).toBe(0)
    })
  })

  describe('getVariant', () => {
    it('returns variant when present', () => {
      expect(new SCPNumber('SCP-966-J').getVariant()).toBe('J')
    })

    it('returns null when no variant', () => {
      expect(new SCPNumber('SCP-173').getVariant()).toBeNull()
    })

    it('handles lowercase variant normalized to uppercase', () => {
      expect(new SCPNumber('scp-076-A').getVariant()).toBe('A')
    })
  })

  describe('hasVariant', () => {
    it('returns true when variant exists', () => {
      expect(new SCPNumber('SCP-966-J').hasVariant()).toBe(true)
    })

    it('returns false when no variant', () => {
      expect(new SCPNumber('SCP-173').hasVariant()).toBe(false)
    })
  })

  describe('compareTo', () => {
    it('returns negative when first is smaller', () => {
      const a = new SCPNumber('SCP-1')
      const b = new SCPNumber('SCP-173')
      expect(a.compareTo(b)).toBeLessThan(0)
    })

    it('returns positive when first is larger', () => {
      const a = new SCPNumber('SCP-999')
      const b = new SCPNumber('SCP-173')
      expect(a.compareTo(b)).toBeGreaterThan(0)
    })

    it('returns zero when equal', () => {
      const a = new SCPNumber('SCP-173')
      const b = new SCPNumber('SCP-173')
      expect(a.compareTo(b)).toBe(0)
    })
  })

  describe('equals', () => {
    it('returns true for same value', () => {
      const a = new SCPNumber('SCP-173')
      const b = new SCPNumber('SCP-173')
      expect(a.equals(b)).toBe(true)
    })

    it('returns false for different value', () => {
      const a = new SCPNumber('SCP-173')
      const b = new SCPNumber('SCP-682')
      expect(a.equals(b)).toBe(false)
    })

    it('returns true for same logical value different case', () => {
      const a = new SCPNumber('SCP-173')
      const b = new SCPNumber('scp-173')
      expect(a.equals(b)).toBe(true)
    })
  })

  describe('toString', () => {
    it('returns string representation', () => {
      expect(new SCPNumber('SCP-173').toString()).toBe('SCP-173')
    })
  })

  describe('static create', () => {
    it('creates SCPNumber instance', () => {
      const scp = SCPNumber.create('SCP-173')
      expect(scp).toBeInstanceOf(SCPNumber)
      expect(scp.getValue()).toBe('SCP-173')
    })
  })

  describe('static fromNumber', () => {
    it('creates from number', () => {
      const scp = SCPNumber.fromNumber(173)
      expect(scp.getValue()).toBe('SCP-173')
    })

    it('creates from number with variant', () => {
      const scp = SCPNumber.fromNumber(966, 'J')
      expect(scp.getValue()).toBe('SCP-966-J')
    })
  })

  describe('static isValid', () => {
    it('returns true for valid number', () => {
      expect(SCPNumber.isValid('SCP-173')).toBe(true)
    })

    it('returns true for valid number with variant', () => {
      expect(SCPNumber.isValid('SCP-966-J')).toBe(true)
    })

    it('returns false for empty string', () => {
      expect(SCPNumber.isValid('')).toBe(false)
    })

    it('returns false for invalid format', () => {
      expect(SCPNumber.isValid('INVALID')).toBe(false)
    })
  })
})
