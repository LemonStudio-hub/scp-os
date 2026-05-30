import { describe, it, expect } from 'vitest'
import { CommandId } from '../command-id.vo'

describe('CommandId', () => {
  describe('construction', () => {
    it('creates valid command id', () => {
      const cmd = new CommandId('scan-scp')
      expect(cmd.getValue()).toBe('scan-scp')
    })

    it('normalizes to lowercase', () => {
      const cmd = new CommandId('Scan-SCP')
      expect(cmd.getValue()).toBe('scan-scp')
    })

    it('accepts single letter', () => {
      const cmd = new CommandId('a')
      expect(cmd.getValue()).toBe('a')
    })

    it('accepts letters and numbers', () => {
      const cmd = new CommandId('cmd-123')
      expect(cmd.getValue()).toBe('cmd-123')
    })

    it('accepts exactly 50 characters', () => {
      const value = 'a' + 'b'.repeat(49)
      const cmd = new CommandId(value)
      expect(cmd.getValue()).toBe(value.toLowerCase())
    })
  })

  describe('invalid construction', () => {
    it('throws on empty string', () => {
      expect(() => new CommandId('')).toThrow('Command ID cannot be empty')
    })

    it('throws on starting with number', () => {
      expect(() => new CommandId('1cmd')).toThrow('Invalid command ID')
    })

    it('throws on starting with hyphen', () => {
      expect(() => new CommandId('-cmd')).toThrow('Invalid command ID')
    })

    it('throws on containing underscores', () => {
      expect(() => new CommandId('scan_scp')).toThrow('Invalid command ID')
    })

    it('throws on containing spaces', () => {
      expect(() => new CommandId('scan scp')).toThrow('Invalid command ID')
    })

    it('throws on exceeding 50 characters', () => {
      const value = 'a' + 'b'.repeat(50)
      expect(() => new CommandId(value)).toThrow('Command ID cannot exceed 50 characters')
    })

    it('throws on containing special characters', () => {
      expect(() => new CommandId('cmd!@#')).toThrow('Invalid command ID')
    })
  })

  describe('equals', () => {
    it('returns true for same value', () => {
      const a = new CommandId('scan-scp')
      const b = new CommandId('scan-scp')
      expect(a.equals(b)).toBe(true)
    })

    it('returns false for different value', () => {
      const a = new CommandId('scan-scp')
      const b = new CommandId('list-scp')
      expect(a.equals(b)).toBe(false)
    })

    it('returns true for same logical value different case', () => {
      const a = new CommandId('Scan-SCP')
      const b = new CommandId('scan-scp')
      expect(a.equals(b)).toBe(true)
    })
  })

  describe('toString', () => {
    it('returns string representation', () => {
      expect(new CommandId('scan-scp').toString()).toBe('scan-scp')
    })

    it('returns lowercase string representation', () => {
      expect(new CommandId('SCAN-SCP').toString()).toBe('scan-scp')
    })
  })

  describe('toJSON', () => {
    it('returns raw value', () => {
      expect(new CommandId('scan-scp').toJSON()).toBe('scan-scp')
    })
  })

  describe('static create', () => {
    it('creates CommandId instance', () => {
      const cmd = CommandId.create('scan-scp')
      expect(cmd).toBeInstanceOf(CommandId)
      expect(cmd.getValue()).toBe('scan-scp')
    })

    it('normalizes case on create', () => {
      const cmd = CommandId.create('Scan-SCP')
      expect(cmd.getValue()).toBe('scan-scp')
    })
  })

  describe('static isValid', () => {
    it('returns true for valid id', () => {
      expect(CommandId.isValid('scan-scp')).toBe(true)
    })

    it('returns true for id with numbers', () => {
      expect(CommandId.isValid('cmd-123')).toBe(true)
    })

    it('returns false for empty string', () => {
      expect(CommandId.isValid('')).toBe(false)
    })

    it('returns false for id starting with number', () => {
      expect(CommandId.isValid('1cmd')).toBe(false)
    })

    it('returns false for id with underscores', () => {
      expect(CommandId.isValid('scan_scp')).toBe(false)
    })
  })
})
