/**
 * Command History Memory Repository
 * Memory implementation for command history repository
 */

import type {
  ICommandHistoryRepository,
  CommandHistoryQueryOptions
} from '../../domain/repositories'
import { CommandHistoryEntity, CommandHistoryCollection } from '../../domain/entities'
import type { QueryResult } from '../../domain/repositories'
import { MemoryBaseRepository } from './memory-base.repository'

/**
 * Command History Memory Repository
 */
export class CommandHistoryMemoryRepository
  extends MemoryBaseRepository<CommandHistoryEntity>
  implements ICommandHistoryRepository
{
  private collection = new CommandHistoryCollection()

  /**
   * Get command history collection
   */
  async getCollection(): Promise<CommandHistoryCollection> {
    // Rebuild collection from current entities
    const entities = await this.findAll()
    this.collection = new CommandHistoryCollection()
    entities.forEach(entity => this.collection.add(entity))
    return this.collection
  }

  /**
   * Add command to history
   */
  async addCommand(entry: CommandHistoryEntity): Promise<void> {
    await this.save(entry)
    this.collection.add(entry)
  }

  /**
   * Get recent commands
   */
  async getRecent(limit: number = 10): Promise<CommandHistoryEntity[]> {
    const result = await this.find({
      sort: (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      limit
    })
    return result.data
  }

  /**
   * Find by command text
   */
  async findByCommand(command: string): Promise<CommandHistoryEntity[]> {
    const result = await this.find({
      filter: entity => entity.command === command
    })
    return result.data
  }

  /**
   * Find by command name (first word)
   */
  async findByCommandName(name: string): Promise<CommandHistoryEntity[]> {
    const result = await this.find({
      filter: entity => entity.getCommandName() === name
    })
    return result.data
  }

  /**
   * Find by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<CommandHistoryEntity[]> {
    const result = await this.find({
      filter: entity => entity.timestamp >= startDate && entity.timestamp <= endDate
    })
    return result.data
  }

  /**
   * Find successful commands
   */
  async findSuccessful(): Promise<CommandHistoryEntity[]> {
    const result = await this.find({
      filter: entity => entity.success
    })
    return result.data
  }

  /**
   * Find failed commands
   */
  async findFailed(): Promise<CommandHistoryEntity[]> {
    const result = await this.find({
      filter: entity => !entity.success
    })
    return result.data
  }

  /**
   * Get command statistics
   */
  async getStatistics(): Promise<{
    total: number
    successful: number
    failed: number
    averageDuration: number
    mostUsedCommands: Array<{ command: string; count: number }>
  }> {
    const entities = await this.findAll()

    const total = entities.length
    const successful = entities.filter(e => e.success).length
    const failed = total - successful

    const durations = entities.filter(e => e.duration !== undefined).map(e => e.duration!)
    const averageDuration =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0

    const commandCounts = new Map<string, number>()
    entities.forEach(entity => {
      const name = entity.getCommandName()
      commandCounts.set(name, (commandCounts.get(name) || 0) + 1)
    })

    const mostUsedCommands = Array.from(commandCounts.entries())
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      total,
      successful,
      failed,
      averageDuration,
      mostUsedCommands
    }
  }

  /**
   * Clear history
   */
  async clearHistory(): Promise<void> {
    await this.clear()
    this.collection.clear()
  }

  /**
   * Search command history
   */
  async search(query: string): Promise<CommandHistoryEntity[]> {
    const lowerQuery = query.toLowerCase()
    const result = await this.find({
      filter: entity => entity.command.toLowerCase().includes(lowerQuery)
    })
    return result.data
  }

  /**
   * Find with query options
   */
  async find(options: CommandHistoryQueryOptions): Promise<QueryResult<CommandHistoryEntity>> {
    let filters: ((entity: CommandHistoryEntity) => boolean)[] = []

    if (options.filter) {
      filters.push(options.filter)
    }

    if (options.command) {
      filters.push(entity => entity.command === options.command)
    }

    if (options.startDate || options.endDate) {
      filters.push(entity => {
        if (options.startDate && entity.timestamp < options.startDate!) return false
        if (options.endDate && entity.timestamp > options.endDate!) return false
        return true
      })
    }

    if (options.success !== undefined) {
      filters.push(entity => entity.success === options.success)
    }

    const combinedFilter = filters.length > 0
      ? (entity: CommandHistoryEntity) => filters.every(f => f(entity))
      : undefined

    return super.find({
      ...options,
      filter: combinedFilter
    })
  }

  /**
   * Get command usage frequency
   */
  async getUsageFrequency(): Promise<Record<string, number>> {
    const statistics = await this.getStatistics()
    const frequency: Record<string, number> = {}
    statistics.mostUsedCommands.forEach(({ command, count }) => {
      frequency[command] = count
    })
    return frequency
  }
}