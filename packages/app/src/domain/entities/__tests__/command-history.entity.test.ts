import { describe, it, expect } from 'vitest'
import { CommandHistoryEntity, CommandHistoryCollection } from '../command-history.entity'

describe('CommandHistoryEntity', () => {
  const createEntry = (overrides = {}) =>
    new CommandHistoryEntity({
      id: 'cmd-1',
      command: 'ls -la /home',
      timestamp: new Date('2024-01-01'),
      success: true,
      ...overrides,
    })

  describe('constructor', () => {
    it('sets defaults from timestamp', () => {
      const entry = createEntry()
      expect(entry.createdAt).toEqual(entry.timestamp)
      expect(entry.updatedAt).toEqual(entry.timestamp)
    })

    it('accepts custom createdAt/updatedAt', () => {
      const ts = new Date('2024-01-01')
      const created = new Date('2023-06-01')
      const entry = createEntry({ timestamp: ts, createdAt: created })
      expect(entry.createdAt).toEqual(created)
      expect(entry.updatedAt).toEqual(ts)
    })
  })

  describe('getCommandName', () => {
    it('returns the first word', () => {
      expect(createEntry({ command: 'ls -la' }).getCommandName()).toBe('ls')
      expect(createEntry({ command: 'help' }).getCommandName()).toBe('help')
    })

    it('returns empty string for empty command', () => {
      expect(createEntry({ command: '' }).getCommandName()).toBe('')
    })
  })

  describe('getArguments', () => {
    it('returns arguments after command name', () => {
      expect(createEntry({ command: 'ls -la /home' }).getArguments()).toEqual(['-la', '/home'])
    })

    it('returns empty array when no arguments', () => {
      expect(createEntry({ command: 'help' }).getArguments()).toEqual([])
    })
  })

  describe('toJSON / fromJSON', () => {
    it('round-trips through serialization', () => {
      const entry = createEntry({ duration: 150, error: undefined })
      const json = entry.toJSON()
      expect(typeof json.timestamp).toBe('string')

      const restored = CommandHistoryEntity.fromJSON(json)
      expect(restored.id).toBe(entry.id)
      expect(restored.command).toBe(entry.command)
      expect(restored.success).toBe(entry.success)
      expect(restored.duration).toBe(entry.duration)
    })

    it('preserves error field', () => {
      const entry = createEntry({ success: false, error: 'command not found' })
      const json = entry.toJSON()
      const restored = CommandHistoryEntity.fromJSON(json)
      expect(restored.error).toBe('command not found')
      expect(restored.success).toBe(false)
    })
  })
})

describe('CommandHistoryCollection', () => {
  const createEntry = (id: string, command: string, success = true) =>
    new CommandHistoryEntity({
      id,
      command,
      timestamp: new Date(),
      success,
    })

  describe('add', () => {
    it('adds entries and updates current index', () => {
      const collection = new CommandHistoryCollection()
      collection.add(createEntry('1', 'ls'))
      collection.add(createEntry('2', 'cd'))
      expect(collection.getCount()).toBe(2)
      expect(collection.getCurrentIndex()).toBe(1)
    })

    it('evicts oldest when exceeding maxSize', () => {
      const collection = new CommandHistoryCollection(3)
      collection.add(createEntry('1', 'a'))
      collection.add(createEntry('2', 'b'))
      collection.add(createEntry('3', 'c'))
      collection.add(createEntry('4', 'd'))
      expect(collection.getCount()).toBe(3)
      expect(collection.getAll()[0].command).toBe('b')
    })
  })

  describe('navigation', () => {
    it('getPrevious decrements index and returns entry', () => {
      const collection = new CommandHistoryCollection()
      collection.add(createEntry('1', 'first'))
      collection.add(createEntry('2', 'second'))
      // currentIndex is 1 after add
      const prev = collection.getPrevious()
      expect(prev?.command).toBe('second')
      expect(collection.getCurrentIndex()).toBe(0)
    })

    it('getPrevious returns undefined at start', () => {
      const collection = new CommandHistoryCollection()
      collection.add(createEntry('1', 'only'))
      collection.getPrevious() // index 0 → -1
      expect(collection.getPrevious()).toBeUndefined()
    })

    it('getNext increments index and returns entry', () => {
      const collection = new CommandHistoryCollection()
      collection.add(createEntry('1', 'first'))
      collection.add(createEntry('2', 'second'))
      collection.getPrevious() // index 1 → 0
      const next = collection.getNext()
      expect(next?.command).toBe('second')
    })

    it('getNext returns undefined at end', () => {
      const collection = new CommandHistoryCollection()
      collection.add(createEntry('1', 'only'))
      expect(collection.getNext()).toBeUndefined()
    })

    it('resetNavigation sets index to last entry', () => {
      const collection = new CommandHistoryCollection()
      collection.add(createEntry('1', 'a'))
      collection.add(createEntry('2', 'b'))
      collection.getPrevious()
      collection.getPrevious()
      collection.resetNavigation()
      expect(collection.getCurrentIndex()).toBe(1)
    })
  })

  describe('search', () => {
    it('finds entries matching query (case-insensitive)', () => {
      const collection = new CommandHistoryCollection()
      collection.add(createEntry('1', 'ls -la'))
      collection.add(createEntry('2', 'cd /home'))
      collection.add(createEntry('3', 'ls -a'))
      const results = collection.search('LS')
      expect(results).toHaveLength(2)
    })

    it('returns empty for no match', () => {
      const collection = new CommandHistoryCollection()
      collection.add(createEntry('1', 'ls'))
      expect(collection.search('grep')).toHaveLength(0)
    })
  })

  describe('clear', () => {
    it('removes all entries and resets index', () => {
      const collection = new CommandHistoryCollection()
      collection.add(createEntry('1', 'a'))
      collection.add(createEntry('2', 'b'))
      collection.clear()
      expect(collection.getCount()).toBe(0)
      expect(collection.getCurrentIndex()).toBe(-1)
    })
  })

  describe('getByIndex', () => {
    it('returns entry at index', () => {
      const collection = new CommandHistoryCollection()
      collection.add(createEntry('1', 'first'))
      collection.add(createEntry('2', 'second'))
      expect(collection.getByIndex(0)?.command).toBe('first')
      expect(collection.getByIndex(1)?.command).toBe('second')
      expect(collection.getByIndex(5)).toBeUndefined()
    })
  })
})
