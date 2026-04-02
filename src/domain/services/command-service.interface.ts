/**
 * Command Domain Service Interface
 * Service interface for command-related business logic
 */

import type { CommandHistoryEntity } from '../entities'
import type { IDomainService } from './domain-service.interface'

/**
 * Command Execution Result
 */
export interface CommandExecutionResult {
  success: boolean
  output?: string
  error?: string
  duration: number
}

/**
 * Command Handler
 */
export type CommandHandler = (
  args: string[],
  write: (data: string) => void,
  writeln: (data: string) => void
) => void | Promise<void>

/**
 * Command Definition
 */
export interface CommandDefinition {
  name: string
  description: string
  usage?: string
  aliases?: string[]
  handler: CommandHandler
}

/**
 * Command Service Interface
 */
export interface ICommandService extends IDomainService {
  /**
   * Register a command
   */
  registerCommand(definition: CommandDefinition): void

  /**
   * Unregister a command
   */
  unregisterCommand(name: string): void

  /**
   * Get command by name
   */
  getCommand(name: string): CommandDefinition | null

  /**
   * Get all commands
   */
  getAllCommands(): CommandDefinition[]

  /**
   * Execute a command
   */
  executeCommand(
    command: string,
    write: (data: string) => void,
    writeln: (data: string) => void
  ): Promise<CommandExecutionResult>

  /**
   * Record command execution
   */
  recordExecution(
    command: string,
    success: boolean,
    duration: number,
    error?: string
  ): Promise<void>

  /**
   * Get command history
   */
  getCommandHistory(): Promise<CommandHistoryEntity[]>

  /**
   * Get recent commands
   */
  getRecentCommands(limit?: number): Promise<CommandHistoryEntity[]>

  /**
   * Search command history
   */
  searchHistory(query: string): Promise<CommandHistoryEntity[]>

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
   * Clear command history
   */
  clearHistory(): Promise<void>

  /**
   * Validate command format
   */
  validateCommand(command: string): boolean

  /**
   * Get command suggestions
   */
  getSuggestions(partial: string): string[]
}