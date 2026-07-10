import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FileSystem } from '../filesystem'

vi.mock('../filesystemAdapter', () => ({
  createStorageAdapter: vi.fn().mockReturnValue({
    backend: 'memory',
    load: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
    getBackendName: vi.fn().mockReturnValue('memory'),
  }),
  migrateToOPFS: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('FileSystem', () => {
  let fs: FileSystem

  beforeEach(() => {
    fs = new FileSystem()
  })

  describe('getCurrentDirectory', () => {
    it('returns / initially', () => {
      expect(fs.getCurrentDirectory()).toBe('/')
    })
  })

  describe('changeDirectory', () => {
    it('goes to /home/scp with ~', () => {
      const result = fs.changeDirectory('~')
      expect(result).toBe(true)
      expect(fs.getCurrentDirectory()).toBe('/home/scp')
    })

    it('handles absolute path /etc', () => {
      const result = fs.changeDirectory('/etc')
      expect(result).toBe(true)
      expect(fs.getCurrentDirectory()).toBe('/etc')
    })

    it('goes up with ..', () => {
      fs.changeDirectory('/home/scp')
      const result = fs.changeDirectory('..')
      expect(result).toBe(true)
      expect(fs.getCurrentDirectory()).toBe('/home')
    })

    it('stays same with .', () => {
      fs.changeDirectory('/home/scp')
      const result = fs.changeDirectory('.')
      expect(result).toBe(true)
      expect(fs.getCurrentDirectory()).toBe('/home/scp')
    })

    it('returns false for nonexistent directory', () => {
      const result = fs.changeDirectory('nonexistent')
      expect(result).toBe(false)
    })
  })

  describe('getNodeByPath', () => {
    it('returns node for /home/scp', () => {
      const node = fs.getNodeByPath('/home/scp')
      expect(node).not.toBeNull()
      expect(node!.name).toBe('scp')
      expect(node!.type).toBe('directory')
    })

    it('returns null for /nonexistent', () => {
      const node = fs.getNodeByPath('/nonexistent')
      expect(node).toBeNull()
    })
  })

  describe('listDirectory', () => {
    it('returns children for /home/scp', () => {
      const children = fs.listDirectory('/home/scp')
      expect(children.length).toBeGreaterThan(0)
      const names = children.map((c) => c.name)
      expect(names).toContain('documents')
      expect(names).toContain('desktop')
    })

    it('uses current directory when no path given', () => {
      fs.changeDirectory('/home/scp')
      const children = fs.listDirectory()
      expect(children.length).toBeGreaterThan(0)
      const names = children.map((c) => c.name)
      expect(names).toContain('documents')
    })

    it('returns empty array for nonexistent path', () => {
      const children = fs.listDirectory('/nonexistent')
      expect(children).toEqual([])
    })
  })

  describe('createDirectory', () => {
    it('creates directory and node exists', () => {
      const result = fs.createDirectory('/home/scp/newdir')
      expect(result).toBe(true)
      const node = fs.getNodeByPath('/home/scp/newdir')
      expect(node).not.toBeNull()
      expect(node!.type).toBe('directory')
    })

    it('returns false for empty path', () => {
      const result = fs.createDirectory('')
      expect(result).toBe(false)
    })
  })

  describe('createFile', () => {
    it('creates file and readFile returns content', () => {
      const result = fs.createFile('/home/scp/newfile.txt', 'hello world')
      expect(result).toBe(true)
      expect(fs.readFile('/home/scp/newfile.txt')).toBe('hello world')
    })
  })

  describe('deleteNode', () => {
    it('deletes existing node', () => {
      fs.createFile('/home/scp/todelete.txt', 'content')
      const result = fs.deleteNode('/home/scp/todelete.txt')
      expect(result).toBe(true)
      expect(fs.getNodeByPath('/home/scp/todelete.txt')).toBeNull()
    })

    it('returns false for empty path', () => {
      const result = fs.deleteNode('')
      expect(result).toBe(false)
    })
  })

  describe('readFile', () => {
    it('returns content for a file', () => {
      fs.createFile('/home/scp/test.txt', 'file content')
      expect(fs.readFile('/home/scp/test.txt')).toBe('file content')
    })

    it('returns null for a directory', () => {
      const result = fs.readFile('/home/scp')
      expect(result).toBeNull()
    })
  })

  describe('writeFile', () => {
    it('updates content and size', () => {
      fs.createFile('/home/scp/writable.txt', 'old')
      const result = fs.writeFile('/home/scp/writable.txt', 'new content here')
      expect(result).toBe(true)
      expect(fs.readFile('/home/scp/writable.txt')).toBe('new content here')
      const node = fs.getNodeByPath('/home/scp/writable.txt')
      expect(node!.size).toBe('new content here'.length)
    })
  })

  describe('findFiles', () => {
    it('finds desktop files', () => {
      const results = fs.findFiles('.desktop')
      expect(results.length).toBeGreaterThan(0)
      expect(results.every((r) => r.includes('.desktop'))).toBe(true)
    })
  })

  describe('grepContent', () => {
    it('finds matching lines', () => {
      fs.createFile('/home/scp/grep-test.txt', 'line one\nline two\nline three')
      const results = fs.grepContent('two', ['/home/scp/grep-test.txt'])
      expect(results).toHaveLength(1)
      expect(results[0].file).toBe('/home/scp/grep-test.txt')
      expect(results[0].lines).toContain('line two')
    })
  })

  describe('getStorageBackend', () => {
    it('returns memory', () => {
      expect(fs.getStorageBackend()).toBe('memory')
    })
  })
})
