import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCommandHandler, commandHandlers } from '../index'
import { filesystem } from '../../utils/filesystem'
import { useSystemStore } from '../../stores/system'
import { useTabsStore } from '../../stores/tabs'

// Mock filesystem
vi.mock('../../utils/filesystem', () => ({
  filesystem: {
    getCurrentDirectory: vi.fn().mockReturnValue('/home/scp'),
    changeDirectory: vi.fn().mockReturnValue(true),
    getNodeByPath: vi.fn(),
    listDirectory: vi.fn().mockReturnValue([]),
    createDirectory: vi.fn().mockReturnValue(true),
    createFile: vi.fn().mockReturnValue(true),
    deleteNode: vi.fn().mockReturnValue(true),
    readFile: vi.fn().mockReturnValue('file content'),
    writeFile: vi.fn().mockReturnValue(true),
    copyNode: vi.fn().mockReturnValue(true),
    moveNode: vi.fn().mockReturnValue(true),
    changePermissions: vi.fn().mockReturnValue(true),
    changeOwner: vi.fn().mockReturnValue(true),
    findFiles: vi.fn().mockReturnValue([]),
    grepContent: vi.fn().mockReturnValue([]),
  },
}))

// Mock system store
vi.mock('../../stores/system', () => ({
  useSystemStore: vi.fn().mockReturnValue({
    markSystemLaunched: vi.fn(),
    markSystemRunning: vi.fn(),
    markSystemShutdown: vi.fn(),
    markBootLogShown: vi.fn(),
    resetBootLogShown: vi.fn(),
  }),
}))

// Mock tabs store
vi.mock('../../stores/tabs', () => ({
  useTabsStore: vi.fn().mockReturnValue({
    clearAllTabs: vi.fn(),
    addTab: vi.fn(),
    removeTab: vi.fn(),
    setActiveTab: vi.fn(),
  }),
}))

// Mock terminal responsive utils
vi.mock('../../utils/terminalResponsive', () => ({
  createBorderLine: vi
    .fn()
    .mockReturnValue('═════════════════════════════════════════════════════════════'),
  createBorderedTitle: vi
    .fn()
    .mockReturnValue('═════════════════════════════════════════════════════════════'),
  isNarrowTerminal: vi.fn().mockReturnValue(false),
}))

// Mock info query logs
vi.mock('../../utils/infoQueryLogs', () => ({
  generateInfoQueryLogs: vi.fn().mockReturnValue([]),
}))

// Mock security check logs
vi.mock('../../utils/securityCheckLogs', () => ({
  generateSecurityCheckLogs: vi
    .fn()
    .mockReturnValue(['[INIT] Starting security check...', 'SYSTEM SECURE']),
}))

// Mock network test logs
vi.mock('../../utils/networkTestLogs', () => ({
  generateNetworkTestLogs: vi.fn().mockResolvedValue(['[PHASE 1] Starting...', 'NETWORK HEALTHY']),
}))

// Mock penetration handler
vi.mock('../penetration', () => ({
  penetrationHandler: vi.fn(),
}))

// Get typed mocked references
const mockedFilesystem = vi.mocked(filesystem)
const mockedUseSystemStore = vi.mocked(useSystemStore)
const mockedUseTabsStore = vi.mocked(useTabsStore)

// Create IO helper
const createIO = () => {
  const output: string[] = []
  return {
    write: vi.fn((s: string) => output.push(s)),
    writeln: vi.fn((s: string) => output.push(s)),
    output,
  }
}

// Mock window.__terminalController
const mockTerminalController = {
  clear: vi.fn(),
  displayBootLog: vi.fn().mockResolvedValue(undefined),
  markBootLogShown: vi.fn(),
  displayWelcomeMessage: vi.fn(),
  displayShutdownLog: vi.fn().mockResolvedValue(undefined),
  displayStartupPrompt: vi.fn(),
}

describe('Command Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.__terminalController = mockTerminalController as any
    // Re-apply default return values cleared by clearAllMocks
    mockedFilesystem.getCurrentDirectory.mockReturnValue('/home/scp')
    mockedFilesystem.changeDirectory.mockReturnValue(true)
    mockedFilesystem.listDirectory.mockReturnValue([])
    mockedFilesystem.createDirectory.mockReturnValue(true)
    mockedFilesystem.createFile.mockReturnValue(true)
    mockedFilesystem.deleteNode.mockReturnValue(true)
    mockedFilesystem.readFile.mockReturnValue('file content')
    mockedFilesystem.writeFile.mockReturnValue(true)
    mockedFilesystem.copyNode.mockReturnValue(true)
    mockedFilesystem.moveNode.mockReturnValue(true)
    mockedFilesystem.changePermissions.mockReturnValue(true)
    mockedFilesystem.changeOwner.mockReturnValue(true)
    mockedFilesystem.findFiles.mockReturnValue([])
    mockedFilesystem.grepContent.mockReturnValue([])
    // Re-apply store mock return values
    mockedUseSystemStore.mockReturnValue({
      markSystemLaunched: vi.fn(),
      markSystemRunning: vi.fn(),
      markSystemShutdown: vi.fn(),
      markBootLogShown: vi.fn(),
      resetBootLogShown: vi.fn(),
    } as any)
    mockedUseTabsStore.mockReturnValue({
      clearAllTabs: vi.fn(),
      createTab: vi.fn(),
      closeTab: vi.fn(),
      switchTab: vi.fn(),
    } as any)
    mockTerminalController.clear.mockClear()
    mockTerminalController.displayBootLog.mockClear()
    mockTerminalController.markBootLogShown.mockClear()
    mockTerminalController.displayWelcomeMessage.mockClear()
    mockTerminalController.displayShutdownLog.mockClear()
    mockTerminalController.displayStartupPrompt.mockClear()
  })

  describe('getCommandHandler', () => {
    it('returns handler for known command', () => {
      const handler = getCommandHandler('help')
      expect(handler).toBeDefined()
      expect(typeof handler).toBe('function')
    })

    it('returns null for unknown command', () => {
      const handler = getCommandHandler('nonexistent' as any)
      expect(handler).toBeNull()
    })

    it('returns handlers for all expected commands', () => {
      const expectedCommands = [
        'start',
        'restart',
        'shutdown',
        'help',
        'status',
        'clear',
        'cls',
        'containment',
        'scp-list',
        'info',
        'protocol',
        'emergency',
        'logout',
        'version',
        'about',
        'search',
        'network',
        'performance',
        'check',
        'ls',
        'cd',
        'pwd',
        'mkdir',
        'rm',
        'cat',
        'echo',
        'touch',
        'cp',
        'mv',
        'uname',
        'df',
        'free',
        'uptime',
        'find',
        'grep',
        'chmod',
        'chown',
        'penetration',
      ]
      for (const cmd of expectedCommands) {
        expect(commandHandlers[cmd as keyof typeof commandHandlers]).toBeDefined()
      }
    })
  })

  describe('Static commands', () => {
    it('help - calls writeln multiple times', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('help')!
      handler([], write, writeln)
      expect(writeln.mock.calls.length).toBeGreaterThan(1)
    })

    it('status - calls writeln', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('status')!
      handler([], write, writeln)
      expect(writeln).toHaveBeenCalled()
    })

    it('containment - calls writeln', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('containment')!
      handler([], write, writeln)
      expect(writeln).toHaveBeenCalled()
    })

    it('version - calls writeln', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('version')!
      handler([], write, writeln)
      expect(writeln).toHaveBeenCalled()
    })

    it('about - calls writeln', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('about')!
      handler([], write, writeln)
      expect(writeln).toHaveBeenCalled()
    })

    it('clear - calls write with ANSI escape', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('clear')!
      handler([], write, writeln)
      expect(write).toHaveBeenCalledWith('\x1b[2J\x1b[H')
    })

    it('cls - calls write with ANSI escape', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('cls')!
      handler([], write, writeln)
      expect(write).toHaveBeenCalledWith('\x1b[2J\x1b[H')
    })

    it('df - calls writeln', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('df')!
      handler([], write, writeln)
      expect(writeln).toHaveBeenCalled()
    })

    it('free - calls writeln', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('free')!
      handler([], write, writeln)
      expect(writeln).toHaveBeenCalled()
    })

    it('uptime - calls writeln', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('uptime')!
      handler([], write, writeln)
      expect(writeln).toHaveBeenCalled()
    })

    it('pwd - calls writeln with current directory', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('pwd')!
      handler([], write, writeln)
      expect(writeln).toHaveBeenCalledWith('/home/scp')
    })

    it('uname - without args shows basic info', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('uname')!
      handler([], write, writeln)
      expect(writeln).toHaveBeenCalledWith('Linux')
    })

    it('uname - with -a shows detailed info', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('uname')!
      handler(['-a'], write, writeln)
      expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Linux scp-terminal'))
    })
  })

  describe('Filesystem commands', () => {
    describe('ls', () => {
      it('lists current directory with no args', () => {
        mockedFilesystem.listDirectory.mockReturnValue([])
        const { write, writeln } = createIO()
        const handler = getCommandHandler('ls')!
        handler([], write, writeln)
        expect(mockedFilesystem.listDirectory).toHaveBeenCalledWith('')
        expect(writeln).toHaveBeenCalled()
      })

      it('lists specified directory', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'directory' } as any)
        mockedFilesystem.listDirectory.mockReturnValue([])
        const { write, writeln } = createIO()
        const handler = getCommandHandler('ls')!
        handler(['/tmp'], write, writeln)
        expect(mockedFilesystem.getNodeByPath).toHaveBeenCalledWith('/tmp')
        expect(mockedFilesystem.listDirectory).toHaveBeenCalledWith('/tmp')
      })

      it('writes error for nonexistent path', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue(null)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('ls')!
        handler(['/nonexistent'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No such file or directory'))
      })

      it('displays files when present', () => {
        mockedFilesystem.listDirectory.mockReturnValue([
          {
            name: 'test.txt',
            type: 'file',
            size: 100,
            mtime: Date.now(),
            owner: 'scp',
            group: 'scp',
            permissions: {
              user: { read: true, write: true, execute: false },
              group: { read: true, write: false, execute: false },
              others: { read: true, write: false, execute: false },
            },
          },
        ] as any)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('ls')!
        handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('test.txt'))
      })

      it('writes error when path is not a directory', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'file' } as any)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('ls')!
        handler(['/file.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Not a directory'))
      })
    })

    describe('cd', () => {
      it('goes to home directory with no args', () => {
        mockedFilesystem.changeDirectory.mockReturnValue(true)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cd')!
        handler([], write, writeln)
        expect(mockedFilesystem.changeDirectory).toHaveBeenCalledWith('~')
      })

      it('changes to valid directory', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'directory' } as any)
        mockedFilesystem.changeDirectory.mockReturnValue(true)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cd')!
        handler(['/tmp'], write, writeln)
        expect(mockedFilesystem.getNodeByPath).toHaveBeenCalledWith('/tmp')
        expect(mockedFilesystem.changeDirectory).toHaveBeenCalledWith('/tmp')
      })

      it('writes error for nonexistent path', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue(null)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cd')!
        handler(['/nonexistent'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No such file or directory'))
      })

      it('writes error for file path', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'file' } as any)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cd')!
        handler(['/file.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Not a directory'))
      })

      it('writes usage when changeDirectory fails with no args', () => {
        mockedFilesystem.changeDirectory.mockReturnValue(false)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cd')!
        handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: cd'))
      })

      it('writes error when changeDirectory fails', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'directory' } as any)
        mockedFilesystem.changeDirectory.mockReturnValue(false)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cd')!
        handler(['/tmp'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Permission denied'))
      })
    })

    describe('mkdir', () => {
      it('writes usage with no args', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('mkdir')!
        handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: mkdir'))
      })

      it('creates directory successfully', () => {
        mockedFilesystem.getNodeByPath
          .mockReturnValueOnce({ type: 'directory' } as any) // parent check
          .mockReturnValueOnce(null) // existing check
        mockedFilesystem.createDirectory.mockReturnValue(true)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('mkdir')!
        handler(['/tmp/newdir'], write, writeln)
        expect(mockedFilesystem.createDirectory).toHaveBeenCalledWith('/tmp/newdir')
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Created directory'))
      })

      it('writes error when directory exists', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'directory' } as any)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('mkdir')!
        handler(['/tmp/existing'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('File exists'))
      })

      it('writes error when parent directory missing', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue(null)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('mkdir')!
        handler(['/nonexistent/dir'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No such file or directory'))
      })

      it('writes error when createDirectory fails', () => {
        // Single segment path - no parent to check, node doesn't exist
        mockedFilesystem.getNodeByPath.mockReturnValue(null)
        mockedFilesystem.createDirectory.mockReturnValue(false)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('mkdir')!
        handler(['newdir'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Permission denied'))
      })
    })

    describe('cat', () => {
      it('writes usage with no args', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cat')!
        handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: cat'))
      })

      it('writes error for nonexistent file', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue(null)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cat')!
        handler(['/nonexistent.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No such file or directory'))
      })

      it('writes file content successfully', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'file' } as any)
        mockedFilesystem.readFile.mockReturnValue('hello world')
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cat')!
        handler(['/file.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith('hello world')
      })

      it('writes error when file is a directory', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'directory' } as any)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cat')!
        handler(['/dir'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Is a directory'))
      })

      it('writes error when readFile returns null', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'file' } as any)
        mockedFilesystem.readFile.mockReturnValue(null)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cat')!
        handler(['/file.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Permission denied'))
      })
    })

    describe('rm', () => {
      it('writes usage with no args', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('rm')!
        handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: rm'))
      })

      it('writes usage when path starts with dash', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('rm')!
        handler(['-r'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: rm'))
      })

      it('deletes node successfully', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'file' } as any)
        mockedFilesystem.deleteNode.mockReturnValue(true)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('rm')!
        handler(['/file.txt'], write, writeln)
        expect(mockedFilesystem.deleteNode).toHaveBeenCalledWith('/file.txt')
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Removed'))
      })

      it('writes error for nonexistent path', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue(null)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('rm')!
        handler(['/nonexistent'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No such file or directory'))
      })

      it('refuses to remove non-empty directory without -r', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({
          type: 'directory',
          children: { file1: {}, file2: {} },
        } as any)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('rm')!
        handler(['/dir'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Is a directory'))
      })

      it('removes empty directory without -r', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'directory', children: {} } as any)
        mockedFilesystem.deleteNode.mockReturnValue(true)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('rm')!
        handler(['/emptydir'], write, writeln)
        expect(mockedFilesystem.deleteNode).toHaveBeenCalledWith('/emptydir')
      })

      it('removes directory with -r flag', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({
          type: 'directory',
          children: { file1: {} },
        } as any)
        mockedFilesystem.deleteNode.mockReturnValue(true)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('rm')!
        handler(['/dir', '-r'], write, writeln)
        expect(mockedFilesystem.deleteNode).toHaveBeenCalledWith('/dir')
      })
    })

    describe('touch', () => {
      it('writes usage with no args', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('touch')!
        handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: touch'))
      })

      it('creates file successfully', () => {
        mockedFilesystem.getNodeByPath
          .mockReturnValueOnce({ type: 'directory' } as any) // parent check
          .mockReturnValueOnce(null) // existing check
        mockedFilesystem.createFile.mockReturnValue(true)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('touch')!
        handler(['/tmp/newfile.txt'], write, writeln)
        expect(mockedFilesystem.createFile).toHaveBeenCalledWith('/tmp/newfile.txt')
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Created'))
      })

      it('updates mtime for existing file', () => {
        const existingNode = { type: 'file', mtime: 0 } as any
        mockedFilesystem.getNodeByPath
          .mockReturnValueOnce({ type: 'directory' } as any) // parent check
          .mockReturnValueOnce(existingNode) // existing check
        const { write, writeln } = createIO()
        const handler = getCommandHandler('touch')!
        handler(['/tmp/existing.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Updated'))
      })

      it('writes error for directory target', () => {
        mockedFilesystem.getNodeByPath
          .mockReturnValueOnce({ type: 'directory' } as any) // parent check
          .mockReturnValueOnce({ type: 'directory' } as any) // existing check
        const { write, writeln } = createIO()
        const handler = getCommandHandler('touch')!
        handler(['/tmp/dir'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Is a directory'))
      })

      it('writes error when createFile fails', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue(null) // no parent
        mockedFilesystem.createFile.mockReturnValue(false)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('touch')!
        handler(['newfile.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Permission denied'))
      })

      it('writes error when parent is not a directory', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'file' } as any)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('touch')!
        handler(['/file/child.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Not a directory'))
      })
    })

    describe('echo', () => {
      it('writes empty line with no args', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('echo')!
        handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith('')
      })

      it('writes joined args', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('echo')!
        handler(['hello', 'world'], write, writeln)
        expect(writeln).toHaveBeenCalledWith('hello world')
      })

      it('redirects to file with > operator', () => {
        mockedFilesystem.readFile.mockReturnValue(null) // file doesn't exist
        mockedFilesystem.createFile.mockReturnValue(true)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('echo')!
        handler(['hello', '>', '/tmp/file.txt'], write, writeln)
        expect(mockedFilesystem.createFile).toHaveBeenCalledWith('/tmp/file.txt', 'hello')
        // echo redirect should not produce terminal output
        expect(writeln).not.toHaveBeenCalled()
      })

      it('appends to file with >> operator', () => {
        mockedFilesystem.readFile.mockReturnValue('existing')
        mockedFilesystem.writeFile.mockReturnValue(true)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('echo')!
        handler(['new', '>>', '/tmp/file.txt'], write, writeln)
        expect(mockedFilesystem.writeFile).toHaveBeenCalledWith('/tmp/file.txt', 'existing\nnew')
      })

      it('writes error when redirect file missing', () => {
        mockedFilesystem.readFile.mockReturnValue(null) // doesn't exist
        mockedFilesystem.createFile.mockReturnValue(false) // create fails
        const { write, writeln } = createIO()
        const handler = getCommandHandler('echo')!
        handler(['text', '>', '/bad/path'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('cannot create file'))
      })

      it('overwrites existing file with >', () => {
        mockedFilesystem.readFile.mockReturnValue('old content')
        mockedFilesystem.writeFile.mockReturnValue(true)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('echo')!
        handler(['new', '>', '/tmp/file.txt'], write, writeln)
        expect(mockedFilesystem.writeFile).toHaveBeenCalledWith('/tmp/file.txt', 'new')
      })

      it('writes error for > redirect without filename', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('echo')!
        handler(['text', '>'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('missing file operand'))
      })

      it('handles append when existing content ends with newline', () => {
        mockedFilesystem.readFile.mockReturnValue('existing\n')
        mockedFilesystem.writeFile.mockReturnValue(true)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('echo')!
        handler(['new', '>>', '/tmp/file.txt'], write, writeln)
        // Should not double the newline
        expect(mockedFilesystem.writeFile).toHaveBeenCalledWith('/tmp/file.txt', 'existing\nnew')
      })
    })

    describe('find', () => {
      it('writes usage without pattern', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('find')!
        handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: find'))
      })

      it('writes usage without -name flag', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('find')!
        handler(['/tmp'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: find'))
      })

      it('writes results when found', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'directory' } as any)
        mockedFilesystem.findFiles.mockReturnValue(['/tmp/file1.txt', '/tmp/file2.txt'])
        const { write, writeln } = createIO()
        const handler = getCommandHandler('find')!
        handler(['/tmp', '-name', '*.txt'], write, writeln)
        expect(mockedFilesystem.findFiles).toHaveBeenCalledWith('*.txt', '/tmp')
        expect(writeln).toHaveBeenCalledWith('/tmp/file1.txt')
        expect(writeln).toHaveBeenCalledWith('/tmp/file2.txt')
      })

      it('writes no results message when empty', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'directory' } as any)
        mockedFilesystem.findFiles.mockReturnValue([])
        const { write, writeln } = createIO()
        const handler = getCommandHandler('find')!
        handler(['/tmp', '-name', '*.xyz'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No files matching'))
      })

      it('validates path exists', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue(null)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('find')!
        handler(['/bad', '-name', '*.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No such file or directory'))
      })

      it('validates path is a directory', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'file' } as any)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('find')!
        handler(['/file.txt', '-name', '*.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Not a directory'))
      })

      it('searches current directory when path is -name (no explicit path)', () => {
        // find(['-name', '*.txt']) => path = '-name', patternIndex = 0, pattern = '*.txt'
        // It calls getNodeByPath('-name') which returns null => error
        mockedFilesystem.getNodeByPath.mockReturnValue(null)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('find')!
        handler(['-name', '*.txt'], write, writeln)
        // The first arg '-name' becomes the path, and getNodeByPath returns null
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No such file or directory'))
      })
    })

    describe('grep', () => {
      it('writes usage with no args', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('grep')!
        handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: grep'))
      })

      it('writes usage with only pattern', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('grep')!
        handler(['pattern'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: grep'))
      })

      it('writes results when found', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'file' } as any)
        mockedFilesystem.grepContent.mockReturnValue([
          { file: '/tmp/test.txt', lines: ['match found here'] },
        ])
        const { write, writeln } = createIO()
        const handler = getCommandHandler('grep')!
        handler(['match', '/tmp/test.txt'], write, writeln)
        expect(mockedFilesystem.grepContent).toHaveBeenCalledWith('match', ['/tmp/test.txt'])
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('test.txt'))
      })

      it('writes no matches when empty', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'file' } as any)
        mockedFilesystem.grepContent.mockReturnValue([])
        const { write, writeln } = createIO()
        const handler = getCommandHandler('grep')!
        handler(['nomatch', '/tmp/test.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No matches found'))
      })

      it('writes error for nonexistent file', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue(null)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('grep')!
        handler(['pattern', '/nonexistent'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No such file or directory'))
      })

      it('writes error for directory target', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'directory' } as any)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('grep')!
        handler(['pattern', '/dir'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Is a directory'))
      })
    })

    describe('chmod', () => {
      it('writes usage with no args', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('chmod')!
        handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: chmod'))
      })

      it('writes usage with only permissions', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('chmod')!
        handler(['755'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: chmod'))
      })

      it('changes permissions successfully', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'file' } as any)
        mockedFilesystem.changePermissions.mockReturnValue(true)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('chmod')!
        handler(['755', '/tmp/file.txt'], write, writeln)
        expect(mockedFilesystem.changePermissions).toHaveBeenCalled()
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Changed permissions'))
      })

      it('writes error for nonexistent file', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue(null)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('chmod')!
        handler(['755', '/nonexistent'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No such file or directory'))
      })

      it('writes error when changePermissions fails', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'file' } as any)
        mockedFilesystem.changePermissions.mockReturnValue(false)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('chmod')!
        handler(['755', '/tmp/file.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Permission denied'))
      })
    })

    describe('chown', () => {
      it('writes usage with no args', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('chown')!
        handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: chown'))
      })

      it('writes usage with missing group', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('chown')!
        handler(['owner', '/file'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: chown'))
      })

      it('changes owner successfully', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'file' } as any)
        mockedFilesystem.changeOwner.mockReturnValue(true)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('chown')!
        handler(['scp:scp', '/tmp/file.txt'], write, writeln)
        expect(mockedFilesystem.changeOwner).toHaveBeenCalledWith('/tmp/file.txt', 'scp', 'scp')
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Changed owner'))
      })

      it('writes error for nonexistent file', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue(null)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('chown')!
        handler(['scp:scp', '/nonexistent'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No such file or directory'))
      })

      it('writes error when changeOwner fails', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue({ type: 'file' } as any)
        mockedFilesystem.changeOwner.mockReturnValue(false)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('chown')!
        handler(['scp:scp', '/tmp/file.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Permission denied'))
      })
    })
  })

  describe('System commands', () => {
    describe('shutdown', () => {
      it('writes usage without now arg', async () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('shutdown')!
        await handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: shutdown now'))
      })

      it('writes usage with invalid arg', async () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('shutdown')!
        await handler(['later'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: shutdown now'))
      })

      it('calls markSystemShutdown with now arg', async () => {
        const systemStore = mockedUseSystemStore()
        const { write, writeln } = createIO()
        const handler = getCommandHandler('shutdown')!
        await handler(['now'], write, writeln)
        expect(systemStore.markSystemShutdown).toHaveBeenCalled()
        expect(systemStore.resetBootLogShown).toHaveBeenCalled()
      })

      it('clears tabs on shutdown', async () => {
        const tabsStore = mockedUseTabsStore()
        const { write, writeln } = createIO()
        const handler = getCommandHandler('shutdown')!
        await handler(['now'], write, writeln)
        expect(tabsStore.clearAllTabs).toHaveBeenCalled()
      })

      it('displays shutdown log when controller available', async () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('shutdown')!
        await handler(['now'], write, writeln)
        expect(mockTerminalController.displayShutdownLog).toHaveBeenCalled()
        expect(mockTerminalController.displayStartupPrompt).toHaveBeenCalled()
      })

      it('writes error when controller unavailable', async () => {
        window.__terminalController = undefined as any
        const { write, writeln } = createIO()
        const handler = getCommandHandler('shutdown')!
        await handler(['now'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(
          expect.stringContaining('Terminal controller not available')
        )
      })
    })

    describe('start', () => {
      it('calls markSystemRunning', async () => {
        const systemStore = mockedUseSystemStore()
        const { write, writeln } = createIO()
        const handler = getCommandHandler('start')!
        await handler([], write, writeln)
        expect(systemStore.markSystemRunning).toHaveBeenCalled()
      })

      it('displays boot log when controller available', async () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('start')!
        await handler([], write, writeln)
        expect(mockTerminalController.clear).toHaveBeenCalled()
        expect(mockTerminalController.displayBootLog).toHaveBeenCalled()
        expect(mockTerminalController.markBootLogShown).toHaveBeenCalled()
        expect(mockTerminalController.displayWelcomeMessage).toHaveBeenCalled()
      })

      it('writes error when controller unavailable', async () => {
        window.__terminalController = undefined as any
        const { write, writeln } = createIO()
        const handler = getCommandHandler('start')!
        await handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith(
          expect.stringContaining('Terminal controller not available')
        )
      })
    })

    describe('restart', () => {
      it('calls resetBootLogShown', async () => {
        const systemStore = mockedUseSystemStore()
        const { write, writeln } = createIO()
        const handler = getCommandHandler('restart')!
        await handler([], write, writeln)
        expect(systemStore.resetBootLogShown).toHaveBeenCalled()
        expect(systemStore.markSystemRunning).toHaveBeenCalled()
      })

      it('displays boot log when controller available', async () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('restart')!
        await handler([], write, writeln)
        expect(mockTerminalController.clear).toHaveBeenCalled()
        expect(mockTerminalController.displayBootLog).toHaveBeenCalled()
        expect(mockTerminalController.markBootLogShown).toHaveBeenCalled()
        expect(mockTerminalController.displayWelcomeMessage).toHaveBeenCalled()
      })

      it('writes error when controller unavailable', async () => {
        window.__terminalController = undefined as any
        const { write, writeln } = createIO()
        const handler = getCommandHandler('restart')!
        await handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith(
          expect.stringContaining('Terminal controller not available')
        )
      })
    })
  })

  describe('Additional static commands', () => {
    it('scp-list - calls writeln', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('scp-list')!
      handler([], write, writeln)
      expect(writeln).toHaveBeenCalled()
    })

    it('protocol - calls writeln', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('protocol')!
      handler([], write, writeln)
      expect(writeln).toHaveBeenCalled()
    })

    it('emergency - calls writeln', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('emergency')!
      handler([], write, writeln)
      expect(writeln).toHaveBeenCalled()
    })

    it('logout - calls writeln', () => {
      const { write, writeln } = createIO()
      const handler = getCommandHandler('logout')!
      handler([], write, writeln)
      expect(writeln).toHaveBeenCalled()
    })
  })

  describe('Additional filesystem commands', () => {
    describe('cp', () => {
      it('writes usage with no args', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cp')!
        handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: cp'))
      })

      it('writes usage with only source', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cp')!
        handler(['/src'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: cp'))
      })

      it('copies file successfully', () => {
        // cp calls getNodeByPath for: source, dest parent, dest itself
        mockedFilesystem.getNodeByPath.mockImplementation((path: string): any => {
          if (path === '/src.txt') return { type: 'file' }
          if (path === '') return { type: 'directory' } // dest parent of /dst.txt
          return null // dest doesn't exist
        })
        mockedFilesystem.copyNode.mockReturnValue(true)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cp')!
        handler(['/src.txt', '/dst.txt'], write, writeln)
        expect(mockedFilesystem.copyNode).toHaveBeenCalledWith('/src.txt', '/dst.txt')
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Copied'))
      })

      it('writes error for nonexistent source', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue(null)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cp')!
        handler(['/nonexistent', '/dst'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No such file or directory'))
      })

      it('writes error when destination exists', () => {
        mockedFilesystem.getNodeByPath.mockImplementation((path: string): any => {
          if (path === '/src.txt') return { type: 'file' } // source exists
          if (path === '') return { type: 'directory' } // dest parent
          if (path === '/dst.txt') return { type: 'file' } // dest exists
          return null
        })
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cp')!
        handler(['/src.txt', '/dst.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('File exists'))
      })

      it('writes error when dest parent missing', () => {
        mockedFilesystem.getNodeByPath.mockImplementation((path: string): any => {
          if (path === '/src.txt') return { type: 'file' } // source exists
          return null // dest parent missing
        })
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cp')!
        handler(['/src.txt', '/bad/dst.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No such file or directory'))
      })

      it('writes error when dest parent is not directory', () => {
        mockedFilesystem.getNodeByPath.mockImplementation((path: string): any => {
          if (path === '/src.txt') return { type: 'file' } // source exists
          if (path === 'file') return { type: 'file' } // dest parent is file (no leading /)
          return null
        })
        const { write, writeln } = createIO()
        const handler = getCommandHandler('cp')!
        handler(['/src.txt', '/file/dst.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Not a directory'))
      })
    })

    describe('mv', () => {
      it('writes usage with no args', () => {
        const { write, writeln } = createIO()
        const handler = getCommandHandler('mv')!
        handler([], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Usage: mv'))
      })

      it('moves file successfully', () => {
        mockedFilesystem.getNodeByPath.mockImplementation((path: string): any => {
          if (path === '/src.txt') return { type: 'file' } // source exists
          if (path === '') return { type: 'directory' } // dest parent of /dst.txt
          return null
        })
        mockedFilesystem.moveNode.mockReturnValue(true)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('mv')!
        handler(['/src.txt', '/dst.txt'], write, writeln)
        expect(mockedFilesystem.moveNode).toHaveBeenCalledWith('/src.txt', '/dst.txt')
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Moved'))
      })

      it('writes error for nonexistent source', () => {
        mockedFilesystem.getNodeByPath.mockReturnValue(null)
        const { write, writeln } = createIO()
        const handler = getCommandHandler('mv')!
        handler(['/nonexistent', '/dst'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No such file or directory'))
      })

      it('writes error when dest parent missing', () => {
        mockedFilesystem.getNodeByPath.mockImplementation((path: string): any => {
          if (path === '/src.txt') return { type: 'file' } // source exists
          return null // dest parent missing
        })
        const { write, writeln } = createIO()
        const handler = getCommandHandler('mv')!
        handler(['/src.txt', '/bad/dst.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('No such file or directory'))
      })

      it('writes error when dest parent is not directory', () => {
        mockedFilesystem.getNodeByPath.mockImplementation((path: string): any => {
          if (path === '/src.txt') return { type: 'file' } // source exists
          if (path === 'file') return { type: 'file' } // dest parent is file (no leading /)
          return null
        })
        const { write, writeln } = createIO()
        const handler = getCommandHandler('mv')!
        handler(['/src.txt', '/file/dst.txt'], write, writeln)
        expect(writeln).toHaveBeenCalledWith(expect.stringContaining('Not a directory'))
      })
    })
  })
})
