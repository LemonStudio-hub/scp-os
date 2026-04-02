import { describe, it, expect, beforeEach, vi } from 'vitest'
import { commandHandlers, getCommandHandler } from './index'
import type { CommandType } from '../types/command'

// Mock scraper module
vi.mock('../utils/scraper', () => ({
  scraper: {
    scrapeSCP: vi.fn(),
    formatForTerminal: vi.fn(),
  },
}))

describe('commands/index', () => {
  let writeMock: any
  let writelnMock: any

  beforeEach(() => {
    writeMock = vi.fn()
    writelnMock = vi.fn()
    
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  describe('getCommandHandler', () => {
    it('should return valid command handler', () => {
      const handler = getCommandHandler('help')
      expect(handler).toBeDefined()
      expect(typeof handler).toBe('function')
    })

    it('should return handler for all known commands', () => {
      const commands: CommandType[] = [
        'help', 'status', 'clear', 'cls', 'containment',
        'scp-list', 'info', 'protocol', 'emergency',
        'version', 'about', 'search', 'logout'
      ]

      commands.forEach(cmd => {
        const handler = getCommandHandler(cmd)
        expect(handler).toBeDefined()
      })
    })

    it('should return null for unknown command', () => {
      const handler = getCommandHandler('unknown' as CommandType)
      expect(handler).toBeNull()
    })
  })

  describe('help command', () => {
    it('should display all available commands', () => {
      const handler = commandHandlers.help
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('Available Commands')
      expect(output).toContain('help')
      expect(output).toContain('status')
    })
  })

  describe('status command', () => {
    it('should display system status information', () => {
      const handler = commandHandlers.status
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('System Status Report')
      expect(output).toContain('Online')
      expect(output).toContain('Active Containment')
    })

    it('should display site status', () => {
      const handler = commandHandlers.status
      handler([], writeMock, writelnMock)
      
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('Site-19')
      expect(output).toContain('Site-17')
    })
  })

  describe('clear command', () => {
    it('should send clear screen command', () => {
      const handler = commandHandlers.clear
      handler([], writeMock, writelnMock)
      
      expect(writeMock).toHaveBeenCalledWith('\x1b[2J\x1b[H')
    })
  })

  describe('cls command', () => {
    it('should send clear screen command', () => {
      const handler = commandHandlers.cls
      handler([], writeMock, writelnMock)
      
      expect(writeMock).toHaveBeenCalledWith('\x1b[2J\x1b[H')
    })
  })

  describe('containment command', () => {
    it('should display containment protocol information', () => {
      const handler = commandHandlers.containment
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('Containment Protocols')
      expect(output).toContain('Safe Class')
      expect(output).toContain('Euclid Class')
      expect(output).toContain('Keter Class')
    })
  })

  describe('scp-list command', () => {
    it('should display SCP list', () => {
      const handler = commandHandlers['scp-list']
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('Known SCP Objects')
      expect(output).toContain('SCP-173')
    })

    it('should display tips', () => {
      const handler = commandHandlers['scp-list']
      handler([], writeMock, writelnMock)
      
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('info <number>')
      expect(output).toContain('search <keyword>')
    })
  })

  describe('info command', () => {
    it('should display specified SCP information', () => {
      const handler = commandHandlers.info
      handler(['173'], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('SCP-173')
    })

    it('should display prompt when no parameter provided', () => {
      const handler = commandHandlers.info
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalledWith(
        expect.stringContaining('Please specify SCP number')
      )
    })

    it('should display error when SCP does not exist', async () => {
      // Mock scraper to return failure
      const { scraper } = await import('../utils/scraper')
      vi.mocked(scraper.scrapeSCP).mockResolvedValue({
        success: false,
        error: 'SCP object does not exist or is inaccessible',
      })
      
      const handler = commandHandlers.info
      await handler(['9999'], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      // Test should display query failure information
      expect(output).toContain('Query failed')
      expect(output).toContain('9999')
    })
  })

  describe('protocol command', () => {
    it('should display security protocol information', () => {
      const handler = commandHandlers.protocol
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('Security Protocols')
      expect(output).toContain('Omega-7')
      expect(output).toContain('Alpha-1')
    })
  })

  describe('emergency command', () => {
    it('should display emergency contact information', () => {
      const handler = commandHandlers.emergency
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('Emergency Contact Information')
      expect(output).toContain('Containment Breach')
      expect(output).toContain('911')
    })
  })

  describe('version command', () => {
    it('should display version information', () => {
      const handler = commandHandlers.version
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('System Version')
      expect(output).toContain('3.0.2')
      expect(output).toContain('Security Level')
    })
  })

  describe('about command', () => {
    it('should display about information', () => {
      const handler = commandHandlers.about
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('About System')
      expect(output).toContain('Secure. Contain. Protect.')
    })

    it('should include warning information', () => {
      const handler = commandHandlers.about
      handler([], writeMock, writelnMock)
      
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('authorized personnel only')
    })
  })

  describe('search command', () => {
    it('should search and display results', () => {
      const handler = commandHandlers.search
      handler(['173'], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('Found')
      expect(output).toContain('SCP-173')
    })

    it('should display prompt when no parameter provided', () => {
      const handler = commandHandlers.search
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalledWith(
        expect.stringContaining('Please enter search keyword')
      )
    })

    it('should display prompt when no results found', () => {
      const handler = commandHandlers.search
      handler(['nonexistent keyword'], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalledWith(
        expect.stringContaining('No matching results found')
      )
    })

    it('should support multi-keyword search', () => {
      const handler = commandHandlers.search
      handler(['SCP', '173'], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
    })

    it('should be case-insensitive', () => {
      const handler = commandHandlers.search
      handler(['scp'], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('Found')
    })
  })

  describe('logout command', () => {
    it('should display logout information', () => {
      const handler = commandHandlers.logout
      handler([], writeMock, writelnMock)
      
      expect(writelnMock).toHaveBeenCalled()
      const calls = writelnMock.mock.calls
      const output = calls.map((call: any) => call[0]).join('\n')
      
      expect(output).toContain('Logging out securely')
      expect(output).toContain('Session terminated')
      expect(output).toContain('Secure. Contain. Protect.')
    })
  })

  })

export { commandHandlers }