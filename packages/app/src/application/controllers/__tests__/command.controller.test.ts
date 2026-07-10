/**
 * Unit tests for CommandController
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CommandController } from '../command.controller'
import type { ICommandService } from '../../../domain/services'
import type { CommandDefinition, CommandExecutionResult } from '../../../domain/services'

describe('CommandController', () => {
  let controller: CommandController
  let mockCommandService: ICommandService

  const createMockCommandService = (): ICommandService => ({
    name: 'MockCommandService',
    registerCommand: vi.fn(),
    unregisterCommand: vi.fn(),
    getCommand: vi.fn(),
    getAllCommands: vi.fn(),
    executeCommand: vi.fn(),
    recordExecution: vi.fn(),
    getCommandHistory: vi.fn(),
    getRecentCommands: vi.fn(),
    searchHistory: vi.fn(),
    getStatistics: vi.fn(),
    clearHistory: vi.fn(),
    validateCommand: vi.fn(),
    getSuggestions: vi.fn(),
    initialize: vi.fn(),
    dispose: vi.fn(),
  })

  const sampleCommand: CommandDefinition = {
    name: 'test',
    description: 'A test command',
    usage: 'test [args]',
    aliases: ['t'],
    handler: vi.fn(),
  }

  beforeEach(() => {
    mockCommandService = createMockCommandService()
    controller = new CommandController(mockCommandService)
  })

  describe('name getter', () => {
    it('should return CommandController', () => {
      expect(controller.name).toBe('CommandController')
    })
  })

  describe('registerCommand', () => {
    it('should delegate to commandService.registerCommand', () => {
      controller.registerCommand(sampleCommand)

      expect(mockCommandService.registerCommand).toHaveBeenCalledWith(sampleCommand)
      expect(mockCommandService.registerCommand).toHaveBeenCalledTimes(1)
    })
  })

  describe('unregisterCommand', () => {
    it('should delegate to commandService.unregisterCommand', () => {
      controller.unregisterCommand('test')

      expect(mockCommandService.unregisterCommand).toHaveBeenCalledWith('test')
      expect(mockCommandService.unregisterCommand).toHaveBeenCalledTimes(1)
    })
  })

  describe('getCommand', () => {
    it('should return command when found', () => {
      vi.mocked(mockCommandService.getCommand).mockReturnValue(sampleCommand)

      const result = controller.getCommand('test')

      expect(result).toEqual(sampleCommand)
      expect(mockCommandService.getCommand).toHaveBeenCalledWith('test')
    })

    it('should return null when command not found', () => {
      vi.mocked(mockCommandService.getCommand).mockReturnValue(null)

      const result = controller.getCommand('nonexistent')

      expect(result).toBeNull()
      expect(mockCommandService.getCommand).toHaveBeenCalledWith('nonexistent')
    })
  })

  describe('getAllCommands', () => {
    it('should return all commands from service', () => {
      const commands = [sampleCommand]
      vi.mocked(mockCommandService.getAllCommands).mockReturnValue(commands)

      const result = controller.getAllCommands()

      expect(result).toEqual(commands)
      expect(mockCommandService.getAllCommands).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when no commands registered', () => {
      vi.mocked(mockCommandService.getAllCommands).mockReturnValue([])

      const result = controller.getAllCommands()

      expect(result).toEqual([])
    })
  })

  describe('executeCommand', () => {
    it('should delegate to commandService.executeCommand', async () => {
      const write = vi.fn()
      const writeln = vi.fn()
      const expectedResult: CommandExecutionResult = {
        success: true,
        output: 'done',
        duration: 100,
      }
      vi.mocked(mockCommandService.executeCommand).mockResolvedValue(expectedResult)

      const result = await controller.executeCommand('test arg1', write, writeln)

      expect(result).toEqual(expectedResult)
      expect(mockCommandService.executeCommand).toHaveBeenCalledWith('test arg1', write, writeln)
    })

    it('should return error result on failure', async () => {
      const write = vi.fn()
      const writeln = vi.fn()
      const expectedResult: CommandExecutionResult = {
        success: false,
        error: 'Command failed',
        duration: 50,
      }
      vi.mocked(mockCommandService.executeCommand).mockResolvedValue(expectedResult)

      const result = await controller.executeCommand('bad', write, writeln)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Command failed')
    })
  })

  describe('getSuggestions', () => {
    it('should return suggestions from service', () => {
      const suggestions = ['test', 'terminal', 'theme']
      vi.mocked(mockCommandService.getSuggestions).mockReturnValue(suggestions)

      const result = controller.getSuggestions('te')

      expect(result).toEqual(suggestions)
      expect(mockCommandService.getSuggestions).toHaveBeenCalledWith('te')
    })

    it('should return empty array when no matches', () => {
      vi.mocked(mockCommandService.getSuggestions).mockReturnValue([])

      const result = controller.getSuggestions('xyz')

      expect(result).toEqual([])
    })
  })

  describe('getCommandHistory', () => {
    it('should delegate to commandService.getCommandHistory', async () => {
      vi.mocked(mockCommandService.getCommandHistory).mockResolvedValue([])

      const result = await controller.getCommandHistory()

      expect(result).toEqual([])
      expect(mockCommandService.getCommandHistory).toHaveBeenCalledTimes(1)
    })
  })

  describe('getRecentCommands', () => {
    it('should delegate with limit parameter', async () => {
      vi.mocked(mockCommandService.getRecentCommands).mockResolvedValue([])

      await controller.getRecentCommands(5)

      expect(mockCommandService.getRecentCommands).toHaveBeenCalledWith(5)
    })

    it('should delegate without limit when omitted', async () => {
      vi.mocked(mockCommandService.getRecentCommands).mockResolvedValue([])

      await controller.getRecentCommands()

      expect(mockCommandService.getRecentCommands).toHaveBeenCalledWith(undefined)
    })
  })

  describe('searchHistory', () => {
    it('should delegate to commandService.searchHistory', async () => {
      vi.mocked(mockCommandService.searchHistory).mockResolvedValue([])

      await controller.searchHistory('test')

      expect(mockCommandService.searchHistory).toHaveBeenCalledWith('test')
    })
  })

  describe('getStatistics', () => {
    it('should delegate to commandService.getStatistics', async () => {
      const stats = { total: 10, successful: 8, failed: 2, averageDuration: 50, mostUsedCommands: [] }
      vi.mocked(mockCommandService.getStatistics).mockResolvedValue(stats)

      const result = await controller.getStatistics()

      expect(result).toEqual(stats)
    })
  })

  describe('clearHistory', () => {
    it('should delegate to commandService.clearHistory', async () => {
      vi.mocked(mockCommandService.clearHistory).mockResolvedValue(undefined)

      await controller.clearHistory()

      expect(mockCommandService.clearHistory).toHaveBeenCalledTimes(1)
    })
  })
})
