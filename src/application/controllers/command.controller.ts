/**
 * Command Controller
 * Handles command execution and management
 */

import type { IController } from './controller.interface'
import type { ICommandService } from '../../domain/services'
import type { CommandDefinition, CommandExecutionResult } from '../../domain/services'

/**
 * Command Controller
 */
export class CommandController implements IController {
  private readonly _name = 'CommandController'
  private commandService: ICommandService

  get name(): string {
    return this._name
  }

  constructor(commandService: ICommandService) {
    this.commandService = commandService
  }

  /**
   * Register a command
   */
  registerCommand(definition: CommandDefinition): void {
    this.commandService.registerCommand(definition)
  }

  /**
   * Unregister a command
   */
  unregisterCommand(name: string): void {
    this.commandService.unregisterCommand(name)
  }

  /**
   * Get command by name
   */
  getCommand(name: string): CommandDefinition | null {
    return this.commandService.getCommand(name)
  }

  /**
   * Get all commands
   */
  getAllCommands(): CommandDefinition[] {
    return this.commandService.getAllCommands()
  }

  /**
   * Execute a command
   */
  async executeCommand(
    command: string,
    write: (data: string) => void,
    writeln: (data: string) => void
  ): Promise<CommandExecutionResult> {
    return this.commandService.executeCommand(command, write, writeln)
  }

  /**
   * Get command history
   */
  async getCommandHistory() {
    return this.commandService.getCommandHistory()
  }

  /**
   * Get recent commands
   */
  async getRecentCommands(limit?: number) {
    return this.commandService.getRecentCommands(limit)
  }

  /**
   * Search command history
   */
  async searchHistory(query: string) {
    return this.commandService.searchHistory(query)
  }

  /**
   * Get command statistics
   */
  async getStatistics() {
    return this.commandService.getStatistics()
  }

  /**
   * Clear command history
   */
  async clearHistory() {
    return this.commandService.clearHistory()
  }

  /**
   * Get command suggestions
   */
  getSuggestions(partial: string): string[] {
    return this.commandService.getSuggestions(partial)
  }
}