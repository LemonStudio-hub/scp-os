import { describe, it, expect, beforeEach } from 'vitest'
import { CommandHistoryMemoryRepository } from '../command-history-memory.repository'
import { CommandHistoryEntity } from '../../../domain/entities'

describe('CommandHistoryMemoryRepository', () => {
  let repo: CommandHistoryMemoryRepository

  const createEntry = (
    id: string,
    command: string,
    success = true,
    duration?: number,
    timestamp?: Date
  ) =>
    new CommandHistoryEntity({
      id,
      command,
      timestamp: timestamp ?? new Date(),
      success,
      duration,
    })

  beforeEach(() => {
    repo = new CommandHistoryMemoryRepository()
  })

  describe('addCommand', () => {
    it('saves and adds to collection', async () => {
      await repo.addCommand(createEntry('1', 'ls -la'))
      expect(await repo.count()).toBe(1)
    })
  })

  describe('getRecent', () => {
    it('returns recent commands sorted by timestamp desc', async () => {
      await repo.addCommand(createEntry('1', 'first', true, undefined, new Date('2024-01-01')))
      await repo.addCommand(createEntry('2', 'second', true, undefined, new Date('2024-01-02')))
      await repo.addCommand(createEntry('3', 'third', true, undefined, new Date('2024-01-03')))
      const recent = await repo.getRecent(2)
      expect(recent).toHaveLength(2)
      expect(recent[0].command).toBe('third')
      expect(recent[1].command).toBe('second')
    })

    it('defaults to limit of 10', async () => {
      for (let i = 0; i < 15; i++) {
        await repo.addCommand(createEntry(String(i), `cmd ${i}`))
      }
      const recent = await repo.getRecent()
      expect(recent).toHaveLength(10)
    })
  })

  describe('findByCommand', () => {
    it('finds by exact command text', async () => {
      await repo.addCommand(createEntry('1', 'ls -la'))
      await repo.addCommand(createEntry('2', 'ls -a'))
      await repo.addCommand(createEntry('3', 'cd /home'))
      const results = await repo.findByCommand('ls -la')
      expect(results).toHaveLength(1)
      expect(results[0].command).toBe('ls -la')
    })
  })

  describe('findByCommandName', () => {
    it('finds by command name (first word)', async () => {
      await repo.addCommand(createEntry('1', 'ls -la'))
      await repo.addCommand(createEntry('2', 'ls -a'))
      await repo.addCommand(createEntry('3', 'cd /home'))
      const results = await repo.findByCommandName('ls')
      expect(results).toHaveLength(2)
    })
  })

  describe('findByDateRange', () => {
    it('filters by date range', async () => {
      await repo.addCommand(createEntry('1', 'old', true, undefined, new Date('2024-01-01')))
      await repo.addCommand(createEntry('2', 'mid', true, undefined, new Date('2024-06-01')))
      await repo.addCommand(createEntry('3', 'new', true, undefined, new Date('2024-12-01')))
      const results = await repo.findByDateRange(new Date('2024-03-01'), new Date('2024-09-01'))
      expect(results).toHaveLength(1)
      expect(results[0].command).toBe('mid')
    })
  })

  describe('findSuccessful / findFailed', () => {
    it('separates successful and failed commands', async () => {
      await repo.addCommand(createEntry('1', 'ok', true))
      await repo.addCommand(createEntry('2', 'fail', false))
      await repo.addCommand(createEntry('3', 'ok2', true))
      expect(await repo.findSuccessful()).toHaveLength(2)
      expect(await repo.findFailed()).toHaveLength(1)
    })
  })

  describe('getStatistics', () => {
    it('returns correct statistics', async () => {
      await repo.addCommand(createEntry('1', 'ls', true, 100))
      await repo.addCommand(createEntry('2', 'ls', true, 200))
      await repo.addCommand(createEntry('3', 'cd', false))
      const stats = await repo.getStatistics()
      expect(stats.total).toBe(3)
      expect(stats.successful).toBe(2)
      expect(stats.failed).toBe(1)
      expect(stats.averageDuration).toBe(150)
      expect(stats.mostUsedCommands[0].command).toBe('ls')
      expect(stats.mostUsedCommands[0].count).toBe(2)
    })
  })

  describe('clearHistory', () => {
    it('clears both repo and collection', async () => {
      await repo.addCommand(createEntry('1', 'ls'))
      await repo.clearHistory()
      expect(await repo.count()).toBe(0)
    })
  })

  describe('search', () => {
    it('searches case-insensitively', async () => {
      await repo.addCommand(createEntry('1', 'ls -la'))
      await repo.addCommand(createEntry('2', 'cd /HOME'))
      const results = await repo.search('home')
      expect(results).toHaveLength(1)
    })
  })

  describe('find with options', () => {
    it('filters by command, startDate, endDate, and success', async () => {
      await repo.addCommand(createEntry('1', 'ls', true, undefined, new Date('2024-06-01')))
      await repo.addCommand(createEntry('2', 'ls', false, undefined, new Date('2024-07-01')))
      await repo.addCommand(createEntry('3', 'cd', true, undefined, new Date('2024-08-01')))

      const result = await repo.find({
        command: 'ls',
        success: true,
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-09-01'),
      })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe('1')
    })
  })

  describe('getUsageFrequency', () => {
    it('returns frequency map', async () => {
      await repo.addCommand(createEntry('1', 'ls -la'))
      await repo.addCommand(createEntry('2', 'ls -a'))
      await repo.addCommand(createEntry('3', 'cd /home'))
      const freq = await repo.getUsageFrequency()
      expect(freq['ls']).toBe(2)
      expect(freq['cd']).toBe(1)
    })
  })
})
