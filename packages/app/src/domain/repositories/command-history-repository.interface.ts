/**
 * Command History Repository Interface
 * Repository interface for command history entities
 */

import type { CommandHistoryEntity, CommandHistoryCollection } from '../entities'
import type { IRepository, QueryOptions, QueryResult } from './repository.interface'

/**
 * Command History Query Options
 */
export interface CommandHistoryQueryOptions extends QueryOptions<CommandHistoryEntity> {
  command?: string
  startDate?: Date
  endDate?: Date
  success?: boolean
}

/**
 * Command History Repository Interface
 */
export interface ICommandHistoryRepository extends IRepository<CommandHistoryEntity> {
  /**
   * Get command history collection
   */
  getCollection(): Promise<CommandHistoryCollection>

  /**
   * Add command to history
   */
  addCommand(entry: CommandHistoryEntity): Promise<void>

  /**
   * Get recent commands
   */
  getRecent(limit?: number): Promise<CommandHistoryEntity[]>

  /**
   * Find by command text
   */
  findByCommand(command: string): Promise<CommandHistoryEntity[]>

  /**
   * Find by command name (first word)
   */
  findByCommandName(name: string): Promise<CommandHistoryEntity[]>

  /**
   * Find by date range
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<CommandHistoryEntity[]>

  /**
   * Find successful commands
   */
  findSuccessful(): Promise<CommandHistoryEntity[]>

  /**
   * Find failed commands
   */
  findFailed(): Promise<CommandHistoryEntity[]>

  /**
   * Get command statistics
   */
  getStatistics(): Promise<{
    total: number
    successful: number
    failed: number
    averageDuration: number
    mostUsedCommands: Array<{ command: string; count: number }>
  }>

  /**
   * Clear history
   */
  clearHistory(): Promise<void>

  /**
   * Search command history
   */
  search(query: string): Promise<CommandHistoryEntity[]>

  /**
   * Find with query options
   */
  find(options: CommandHistoryQueryOptions): Promise<QueryResult<CommandHistoryEntity>>

  /**
   * Get command usage frequency
   */
  getUsageFrequency(): Promise<Record<string, number>>
}