import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { FileSystemNode } from '../../../utils/filesystem'

// In-memory filesystem mock
const originalFsTree: Record<string, Record<string, FileSystemNode>> = {
  '/': {
    home: {
      name: 'home',
      type: 'directory',
      permissions: {
        user: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: true, write: false, execute: true },
      },
      owner: 'root',
      group: 'root',
      size: 0,
      mtime: 1000,
      children: {},
    },
    tmp: {
      name: 'tmp',
      type: 'directory',
      permissions: {
        user: { read: true, write: true, execute: true },
        group: { read: true, write: true, execute: true },
        others: { read: true, write: true, execute: true },
      },
      owner: 'root',
      group: 'root',
      size: 0,
      mtime: 1000,
      children: {},
    },
  },
  '/home': {
    scp: {
      name: 'scp',
      type: 'directory',
      permissions: {
        user: { read: true, write: true, execute: true },
        group: { read: true, write: true, execute: true },
        others: { read: true, write: false, execute: true },
      },
      owner: 'scp',
      group: 'foundation',
      size: 0,
      mtime: 2000,
      children: {},
    },
  },
  '/home/scp': {
    documents: {
      name: 'documents',
      type: 'directory',
      permissions: {
        user: { read: true, write: true, execute: true },
        group: { read: true, write: true, execute: true },
        others: { read: true, write: false, execute: true },
      },
      owner: 'scp',
      group: 'foundation',
      size: 0,
      mtime: 2000,
      children: {},
    },
    desktop: {
      name: 'desktop',
      type: 'directory',
      permissions: {
        user: { read: true, write: true, execute: true },
        group: { read: true, write: true, execute: true },
        others: { read: true, write: false, execute: true },
      },
      owner: 'scp',
      group: 'foundation',
      size: 0,
      mtime: 2000,
      children: {},
    },
    '.hidden': {
      name: '.hidden',
      type: 'file',
      permissions: {
        user: { read: true, write: true, execute: false },
        group: { read: false, write: false, execute: false },
        others: { read: false, write: false, execute: false },
      },
      owner: 'scp',
      group: 'foundation',
      size: 42,
      mtime: 3000,
      content: 'secret',
    },
    'readme.txt': {
      name: 'readme.txt',
      type: 'file',
      permissions: {
        user: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        others: { read: true, write: false, execute: false },
      },
      owner: 'scp',
      group: 'foundation',
      size: 100,
      mtime: 3000,
      content: 'hello',
    },
    'data.json': {
      name: 'data.json',
      type: 'file',
      permissions: {
        user: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        others: { read: true, write: false, execute: false },
      },
      owner: 'scp',
      group: 'foundation',
      size: 256,
      mtime: 4000,
      content: '{}',
    },
  },
  '/home/scp/documents': {
    'report.txt': {
      name: 'report.txt',
      type: 'file',
      permissions: {
        user: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        others: { read: true, write: false, execute: false },
      },
      owner: 'scp',
      group: 'foundation',
      size: 512,
      mtime: 5000,
      content: 'report content',
    },
  },
}

// Deep copy helper
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

let fsTree: Record<string, Record<string, FileSystemNode>> = deepClone(originalFsTree)
let currentFsPath = '/'

vi.mock('../../../utils/filesystem', () => ({
  filesystem: {
    changeDirectory: vi.fn((path: string) => {
      if (fsTree[path]) {
        currentFsPath = path
      } else {
        throw new Error(`No such directory: ${path}`)
      }
    }),
    listDirectory: vi.fn(() => {
      return Object.values(fsTree[currentFsPath] || {})
    }),
    readFile: vi.fn((path: string) => {
      const parts = path.split('/')
      const name = parts.pop()!
      const dir = parts.join('/') || '/'
      const node = fsTree[dir]?.[name]
      return node?.content ?? null
    }),
    createFile: vi.fn((path: string, content?: string) => {
      const parts = path.split('/')
      const name = parts.pop()!
      const dir = parts.join('/') || '/'
      if (!fsTree[dir]) return false
      fsTree[dir][name] = {
        name,
        type: 'file',
        permissions: {
          user: { read: true, write: true, execute: false },
          group: { read: false, write: false, execute: false },
          others: { read: false, write: false, execute: false },
        },
        owner: 'scp',
        group: 'foundation',
        size: (content || '').length,
        mtime: Date.now(),
        content: content || '',
      }
      return true
    }),
    createDirectory: vi.fn((path: string) => {
      const parts = path.split('/')
      const name = parts.pop()!
      const dir = parts.join('/') || '/'
      if (!fsTree[dir]) return false
      fsTree[dir][name] = {
        name,
        type: 'directory',
        permissions: {
          user: { read: true, write: true, execute: true },
          group: { read: false, write: false, execute: true },
          others: { read: false, write: false, execute: true },
        },
        owner: 'scp',
        group: 'foundation',
        size: 0,
        mtime: Date.now(),
        children: {},
      }
      fsTree[path] = {}
      return true
    }),
    deleteNode: vi.fn((path: string) => {
      const parts = path.split('/')
      const name = parts.pop()!
      const dir = parts.join('/') || '/'
      if (!fsTree[dir]?.[name]) return false
      delete fsTree[dir][name]
      return true
    }),
    moveNode: vi.fn((src: string, dest: string) => {
      const srcParts = src.split('/')
      const srcName = srcParts.pop()!
      const srcDir = srcParts.join('/') || '/'
      const destParts = dest.split('/')
      const destName = destParts.pop()!
      const destDir = destParts.join('/') || '/'
      if (!fsTree[srcDir]?.[srcName] || !fsTree[destDir]) return false
      const node = { ...fsTree[srcDir][srcName], name: destName }
      fsTree[destDir][destName] = node
      delete fsTree[srcDir][srcName]
      return true
    }),
    writeFile: vi.fn((path: string, content: string) => {
      const parts = path.split('/')
      const name = parts.pop()!
      const dir = parts.join('/') || '/'
      if (!fsTree[dir]?.[name]) return false
      fsTree[dir][name].content = content
      fsTree[dir][name].size = content.length
      return true
    }),
  },
}))

vi.mock('../../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

import { useFileManagerStore } from '../fileManager'

describe('FileManagerStore', () => {
  let store: ReturnType<typeof useFileManagerStore>

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the in-memory filesystem
    fsTree = deepClone(originalFsTree)
    currentFsPath = '/'
    setActivePinia(createPinia())
    store = useFileManagerStore()
  })

  describe('initial state', () => {
    it('should have default currentPath', () => {
      // loadDirectory('/') is called on store creation
      expect(store.currentPath).toBe('/')
    })

    it('should load files from root', () => {
      expect(store.files.length).toBeGreaterThan(0)
    })

    it('should default to grid view mode', () => {
      expect(store.viewMode).toBe('grid')
    })

    it('should default sortField to name ascending', () => {
      expect(store.sortField).toBe('name')
      expect(store.sortOrder).toBe('asc')
    })
  })

  describe('loadDirectory', () => {
    it('should update currentPath when loading a directory', () => {
      store.loadDirectory('/home/scp')
      expect(store.currentPath).toBe('/home/scp')
    })

    it('should populate files for the directory', () => {
      store.loadDirectory('/home/scp')
      const names = store.files.map((f) => f.name)
      expect(names).toContain('documents')
      expect(names).toContain('desktop')
      expect(names).toContain('readme.txt')
    })

    it('should not update currentPath when no path given', () => {
      store.loadDirectory('/home/scp')
      const prevPath = store.currentPath
      store.loadDirectory()
      expect(store.currentPath).toBe(prevPath)
    })
  })

  describe('navigateTo', () => {
    it('should clear selected files', () => {
      store.loadDirectory('/home/scp')
      store.toggleSelect('readme.txt')
      expect(store.selectedFiles.size).toBe(1)

      store.navigateTo('/home/scp/documents')
      expect(store.selectedFiles.size).toBe(0)
    })

    it('should load the target directory', () => {
      store.navigateTo('/home/scp/documents')
      expect(store.currentPath).toBe('/home/scp/documents')
      expect(store.files.map((f) => f.name)).toContain('report.txt')
    })
  })

  describe('goHome', () => {
    it('should navigate to /home/scp', () => {
      store.loadDirectory('/')
      store.goHome()
      expect(store.currentPath).toBe('/home/scp')
    })

    it('should clear selected files', () => {
      store.loadDirectory('/home/scp')
      store.toggleSelect('readme.txt')
      store.goHome()
      expect(store.selectedFiles.size).toBe(0)
    })
  })

  describe('goUp', () => {
    it('should navigate to parent directory', () => {
      store.loadDirectory('/home/scp/documents')
      store.goUp()
      expect(store.currentPath).toBe('/home/scp')
    })

    it('should not navigate above root', () => {
      store.loadDirectory('/')
      store.goUp()
      expect(store.currentPath).toBe('/')
    })
  })

  describe('toggleSelect', () => {
    it('should add file to selection when not selected', () => {
      store.toggleSelect('readme.txt')
      expect(store.selectedFiles.has('readme.txt')).toBe(true)
    })

    it('should remove file from selection when already selected', () => {
      store.toggleSelect('readme.txt')
      store.toggleSelect('readme.txt')
      expect(store.selectedFiles.has('readme.txt')).toBe(false)
    })

    it('should allow multiple selections', () => {
      store.toggleSelect('readme.txt')
      store.toggleSelect('data.json')
      expect(store.selectedFiles.size).toBe(2)
    })
  })

  describe('clearSelection', () => {
    it('should clear all selected files', () => {
      store.toggleSelect('readme.txt')
      store.toggleSelect('data.json')
      store.clearSelection()
      expect(store.selectedFiles.size).toBe(0)
    })
  })

  describe('setSort', () => {
    it('should set sort field and reset to asc when switching fields', () => {
      store.setSort('size')
      expect(store.sortField).toBe('size')
      expect(store.sortOrder).toBe('asc')
    })

    it('should toggle sort order when same field is set again', () => {
      store.setSort('name')
      expect(store.sortOrder).toBe('desc')
    })

    it('should toggle from desc back to asc on third call', () => {
      store.setSort('name') // toggles to desc
      store.setSort('name') // toggles back to asc
      expect(store.sortOrder).toBe('asc')
    })

    it('should reset to asc when switching to a different field', () => {
      store.setSort('name') // toggles to desc
      store.setSort('size') // new field, resets to asc
      expect(store.sortField).toBe('size')
      expect(store.sortOrder).toBe('asc')
    })
  })

  describe('toggleShowHidden', () => {
    it('should toggle showHidden from false to true', () => {
      expect(store.showHidden).toBe(false)
      store.toggleShowHidden()
      expect(store.showHidden).toBe(true)
    })

    it('should toggle showHidden back to false', () => {
      store.toggleShowHidden()
      store.toggleShowHidden()
      expect(store.showHidden).toBe(false)
    })
  })

  describe('favorites', () => {
    it('should have default favorites', () => {
      expect(store.favorites).toContain('/home/scp')
      expect(store.favorites).toContain('/home/scp/documents')
    })

    it('isFavorite should return true for existing favorites', () => {
      expect(store.isFavorite('/home/scp')).toBe(true)
    })

    it('isFavorite should return false for non-favorites', () => {
      expect(store.isFavorite('/tmp')).toBe(false)
    })

    it('addToFavorites should add a new path', () => {
      store.addToFavorites('/tmp')
      expect(store.favorites).toContain('/tmp')
      expect(store.isFavorite('/tmp')).toBe(true)
    })

    it('addToFavorites should not duplicate existing paths', () => {
      store.addToFavorites('/home/scp')
      const count = store.favorites.filter((p) => p === '/home/scp').length
      expect(count).toBe(1)
    })

    it('removeFromFavorites should remove a path', () => {
      store.removeFromFavorites('/home/scp')
      expect(store.isFavorite('/home/scp')).toBe(false)
    })

    it('removeFromFavorites should not affect other favorites', () => {
      store.removeFromFavorites('/home/scp')
      expect(store.isFavorite('/home/scp/documents')).toBe(true)
    })
  })

  describe('breadcrumbs', () => {
    it('should start with root breadcrumb for root path', () => {
      store.loadDirectory('/')
      expect(store.breadcrumbs).toEqual([{ label: '/', path: '/' }])
    })

    it('should generate breadcrumbs for nested path', () => {
      store.loadDirectory('/home/scp/documents')
      expect(store.breadcrumbs).toEqual([
        { label: '/', path: '/' },
        { label: 'home', path: '/home' },
        { label: 'scp', path: '/home/scp' },
        { label: 'documents', path: '/home/scp/documents' },
      ])
    })

    it('should generate breadcrumbs for single nested level', () => {
      store.loadDirectory('/home')
      expect(store.breadcrumbs).toEqual([
        { label: '/', path: '/' },
        { label: 'home', path: '/home' },
      ])
    })
  })

  describe('sortedFiles', () => {
    it('should sort directories before files', () => {
      store.loadDirectory('/home/scp')
      const dirs = store.sortedFiles.filter((f) => f.isDirectory)
      const files = store.sortedFiles.filter((f) => !f.isDirectory)
      // All dirs should come before all files
      if (dirs.length > 0 && files.length > 0) {
        const lastDirIndex = store.sortedFiles.lastIndexOf(dirs[dirs.length - 1])
        const firstFileIndex = store.sortedFiles.indexOf(files[0])
        expect(lastDirIndex).toBeLessThan(firstFileIndex)
      }
    })

    it('should filter hidden files when showHidden is false', () => {
      store.loadDirectory('/home/scp')
      store.toggleShowHidden() // false -> true
      store.toggleShowHidden() // true -> false
      const hidden = store.sortedFiles.filter((f) => f.isHidden)
      expect(hidden.length).toBe(0)
    })

    it('should include hidden files when showHidden is true', () => {
      store.loadDirectory('/home/scp')
      store.toggleShowHidden()
      const allNames = store.sortedFiles.map((f) => f.name)
      expect(allNames).toContain('.hidden')
    })
  })

  describe('sortedFiles - sorting by size', () => {
    it('should sort files by size ascending', () => {
      store.loadDirectory('/home/scp')
      store.setSort('size')
      const fileItems = store.sortedFiles.filter((f) => !f.isDirectory)
      for (let i = 1; i < fileItems.length; i++) {
        expect(fileItems[i].size).toBeGreaterThanOrEqual(fileItems[i - 1].size)
      }
    })

    it('should sort files by size descending', () => {
      store.loadDirectory('/home/scp')
      store.setSort('size') // asc
      store.setSort('size') // desc
      const fileItems = store.sortedFiles.filter((f) => !f.isDirectory)
      for (let i = 1; i < fileItems.length; i++) {
        expect(fileItems[i].size).toBeLessThanOrEqual(fileItems[i - 1].size)
      }
    })
  })

  describe('sortedFiles - sorting by type', () => {
    it('should sort files by type ascending', () => {
      store.loadDirectory('/home/scp')
      store.setSort('type')
      const fileItems = store.sortedFiles.filter((f) => !f.isDirectory)
      if (fileItems.length > 1) {
        for (let i = 1; i < fileItems.length; i++) {
          const prevType = fileItems[i - 1].name.split('.').pop() || ''
          const currType = fileItems[i].name.split('.').pop() || ''
          expect(currType.localeCompare(prevType)).toBeGreaterThanOrEqual(0)
        }
      }
    })

    it('should sort directories by type as "folder"', () => {
      store.loadDirectory('/home/scp')
      store.setSort('type')
      const dirItems = store.sortedFiles.filter((f) => f.isDirectory)
      // All directories should still come first
      if (dirItems.length > 0) {
        const lastDirIdx = store.sortedFiles.lastIndexOf(dirItems[dirItems.length - 1])
        const firstFileItem = store.sortedFiles.find((f) => !f.isDirectory)
        if (firstFileItem) {
          const firstFileIdx = store.sortedFiles.indexOf(firstFileItem)
          expect(lastDirIdx).toBeLessThan(firstFileIdx)
        }
      }
    })
  })

  describe('sortedFiles - sorting by modifiedAt', () => {
    it('should sort files by modifiedAt ascending', () => {
      store.loadDirectory('/home/scp')
      store.setSort('modifiedAt')
      const fileItems = store.sortedFiles.filter((f) => !f.isDirectory)
      for (let i = 1; i < fileItems.length; i++) {
        expect(fileItems[i].modifiedAt).toBeGreaterThanOrEqual(fileItems[i - 1].modifiedAt)
      }
    })

    it('should sort files by modifiedAt descending', () => {
      store.loadDirectory('/home/scp')
      store.setSort('modifiedAt') // asc
      store.setSort('modifiedAt') // desc
      const fileItems = store.sortedFiles.filter((f) => !f.isDirectory)
      for (let i = 1; i < fileItems.length; i++) {
        expect(fileItems[i].modifiedAt).toBeLessThanOrEqual(fileItems[i - 1].modifiedAt)
      }
    })
  })

  describe('sortedFiles - search query filtering', () => {
    it('should filter files by search query', () => {
      store.loadDirectory('/home/scp')
      store.setSearch('readme')
      const names = store.sortedFiles.map((f) => f.name)
      expect(names).toContain('readme.txt')
      expect(names).not.toContain('data.json')
    })

    it('should be case-insensitive when filtering', () => {
      store.loadDirectory('/home/scp')
      store.setSearch('README')
      const names = store.sortedFiles.map((f) => f.name)
      expect(names).toContain('readme.txt')
    })

    it('should return all files when search query is empty', () => {
      store.loadDirectory('/home/scp')
      store.setSearch('readme')
      store.setSearch('')
      const names = store.sortedFiles.map((f) => f.name)
      expect(names).toContain('readme.txt')
      expect(names).toContain('data.json')
    })

    it('should combine search filtering with hidden file filtering', () => {
      store.loadDirectory('/home/scp')
      // showHidden is false, so .hidden is excluded
      store.setSearch('hidden')
      const names = store.sortedFiles.map((f) => f.name)
      expect(names).not.toContain('.hidden')
    })
  })

  describe('breadcrumbs - extended', () => {
    it('should handle root path with single crumb', () => {
      store.loadDirectory('/')
      expect(store.breadcrumbs).toEqual([{ label: '/', path: '/' }])
    })

    it('should handle deeply nested path with multiple crumbs', () => {
      store.loadDirectory('/home/scp/documents')
      expect(store.breadcrumbs).toHaveLength(4)
      expect(store.breadcrumbs[0]).toEqual({ label: '/', path: '/' })
      expect(store.breadcrumbs[1]).toEqual({ label: 'home', path: '/home' })
      expect(store.breadcrumbs[2]).toEqual({ label: 'scp', path: '/home/scp' })
      expect(store.breadcrumbs[3]).toEqual({ label: 'documents', path: '/home/scp/documents' })
    })

    it('should update breadcrumbs when navigating', () => {
      store.loadDirectory('/home/scp')
      expect(store.breadcrumbs).toHaveLength(3)
      store.loadDirectory('/home/scp/documents')
      expect(store.breadcrumbs).toHaveLength(4)
    })
  })

  describe('quickAccess', () => {
    it('should return expected quick access items', () => {
      expect(store.quickAccess).toHaveLength(6)
    })

    it('should contain Home item', () => {
      const home = store.quickAccess.find((q) => q.label === 'Home')
      expect(home).toEqual({ label: 'Home', path: '/home/scp', icon: 'home' })
    })

    it('should contain Desktop item', () => {
      const desktop = store.quickAccess.find((q) => q.label === 'Desktop')
      expect(desktop).toEqual({ label: 'Desktop', path: '/home/scp/desktop', icon: 'grid' })
    })

    it('should contain Documents item', () => {
      const docs = store.quickAccess.find((q) => q.label === 'Documents')
      expect(docs).toEqual({ label: 'Documents', path: '/home/scp/documents', icon: 'document' })
    })

    it('should contain Downloads item', () => {
      const dl = store.quickAccess.find((q) => q.label === 'Downloads')
      expect(dl).toEqual({ label: 'Downloads', path: '/home/scp/downloads', icon: 'archive' })
    })

    it('should contain Root item', () => {
      const root = store.quickAccess.find((q) => q.label === 'Root')
      expect(root).toEqual({ label: 'Root', path: '/', icon: 'folder' })
    })

    it('should contain tmp item', () => {
      const tmp = store.quickAccess.find((q) => q.label === 'tmp')
      expect(tmp).toEqual({ label: 'tmp', path: '/tmp', icon: 'folder' })
    })
  })

  describe('deleteSelected', () => {
    it('should delete selected files and reload', () => {
      store.loadDirectory('/home/scp')
      store.toggleSelect('readme.txt')
      const result = store.deleteSelected()
      expect(result).toBe(true)
      expect(store.selectedFiles.size).toBe(0)
      const names = store.files.map((f) => f.name)
      expect(names).not.toContain('readme.txt')
    })

    it('should iterate and delete multiple selected files', () => {
      store.loadDirectory('/home/scp')
      store.toggleSelect('readme.txt')
      store.toggleSelect('data.json')
      const result = store.deleteSelected()
      expect(result).toBe(true)
      const names = store.files.map((f) => f.name)
      expect(names).not.toContain('readme.txt')
      expect(names).not.toContain('data.json')
    })

    it('should clear selection after delete', () => {
      store.loadDirectory('/home/scp')
      store.toggleSelect('readme.txt')
      store.deleteSelected()
      expect(store.selectedFiles.size).toBe(0)
    })

    it('should return false when deletion fails', () => {
      store.loadDirectory('/home/scp')
      store.toggleSelect('nonexistent.txt')
      const result = store.deleteSelected()
      expect(result).toBe(false)
    })
  })

  describe('renameFile', () => {
    it('should return true early when same name is given', () => {
      store.loadDirectory('/home/scp')
      const result = store.renameFile('readme.txt', 'readme.txt')
      expect(result).toBe(true)
    })

    it('should call moveNode and reload on success', () => {
      store.loadDirectory('/home/scp')
      const result = store.renameFile('readme.txt', 'renamed.txt')
      expect(result).toBe(true)
      const names = store.files.map((f) => f.name)
      expect(names).not.toContain('readme.txt')
      expect(names).toContain('renamed.txt')
    })

    it('should return false on failure', () => {
      store.loadDirectory('/home/scp')
      const result = store.renameFile('nonexistent.txt', 'new.txt')
      expect(result).toBe(false)
    })
  })

  describe('createFile', () => {
    it('should create file and reload on success', () => {
      store.loadDirectory('/home/scp')
      const result = store.createFile('newfile.txt', 'content')
      expect(result).toBe(true)
      const names = store.files.map((f) => f.name)
      expect(names).toContain('newfile.txt')
    })

    it('should return false on failure', () => {
      store.loadDirectory('/home/scp')
      // Navigate to a path where the parent directory doesn't exist in fsTree
      // The mock createFile checks if fsTree[dir] exists
      // By setting currentPath to a non-existent directory, createFile will fail
      store.$patch({ currentPath: '/nonexistent' })
      const result = store.createFile('fail.txt')
      expect(result).toBe(false)
    })
  })

  describe('createDirectory', () => {
    it('should create directory and reload on success', () => {
      store.loadDirectory('/home/scp')
      const result = store.createDirectory('newfolder')
      expect(result).toBe(true)
      const names = store.files.map((f) => f.name)
      expect(names).toContain('newfolder')
    })
  })

  describe('readFileContent', () => {
    it('should return file content for existing file', () => {
      store.loadDirectory('/home/scp')
      const content = store.readFileContent('readme.txt')
      expect(content).toBe('hello')
    })

    it('should return null for non-existent file', () => {
      store.loadDirectory('/home/scp')
      const content = store.readFileContent('nonexistent.txt')
      expect(content).toBeNull()
    })
  })

  describe('writeFileContent', () => {
    it('should write content and reload on success', () => {
      store.loadDirectory('/home/scp')
      const result = store.writeFileContent('readme.txt', 'new content')
      expect(result).toBe(true)
    })

    it('should return false for non-existent file', () => {
      store.loadDirectory('/home/scp')
      const result = store.writeFileContent('nonexistent.txt', 'content')
      expect(result).toBe(false)
    })
  })

  describe('showContextMenu', () => {
    it('should show context menu with file items when fileName provided', () => {
      store.loadDirectory('/home/scp')
      store.showContextMenu(100, 200, 'readme.txt')
      expect(store.contextMenu.visible).toBe(true)
      expect(store.contextMenu.x).toBe(100)
      expect(store.contextMenu.y).toBe(200)
      expect(store.contextMenu.items.length).toBeGreaterThan(0)
      const ids = store.contextMenu.items.map((i) => i.id)
      expect(ids).toContain('open')
      expect(ids).toContain('rename')
      expect(ids).toContain('delete')
    })

    it('should show context menu with directory items when no fileName provided', () => {
      store.loadDirectory('/home/scp')
      store.showContextMenu(100, 200)
      expect(store.contextMenu.visible).toBe(true)
      const ids = store.contextMenu.items.map((i) => i.id)
      expect(ids).toContain('new-file')
      expect(ids).toContain('new-folder')
      expect(ids).toContain('refresh')
      expect(ids).toContain('toggle-hidden')
    })
  })

  describe('hideContextMenu', () => {
    it('should set context menu visible to false', () => {
      store.loadDirectory('/home/scp')
      store.showContextMenu(100, 200)
      expect(store.contextMenu.visible).toBe(true)
      store.hideContextMenu()
      expect(store.contextMenu.visible).toBe(false)
    })
  })

  describe('getFileContextItems', () => {
    it('should return expected items for a file', () => {
      store.loadDirectory('/home/scp')
      const items = store.getFileContextItems('readme.txt')
      const ids = items.map((i) => i.id)
      expect(ids).toEqual(['open', 'rename', 'copy-path', 'favorite', 'delete'])
    })

    it('should return expected items for a directory', () => {
      store.loadDirectory('/home/scp')
      const items = store.getFileContextItems('documents')
      const ids = items.map((i) => i.id)
      expect(ids).toEqual(['open', 'rename', 'copy-path', 'favorite', 'delete'])
    })

    it('should include all required item properties', () => {
      store.loadDirectory('/home/scp')
      const items = store.getFileContextItems('readme.txt')
      for (const item of items) {
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('label')
        expect(item).toHaveProperty('icon')
        expect(item).toHaveProperty('action')
      }
    })
  })

  describe('getDirectoryContextItems', () => {
    it('should return expected items', () => {
      store.loadDirectory('/home/scp')
      const items = store.getDirectoryContextItems()
      const ids = items.map((i) => i.id)
      expect(ids).toEqual(['new-file', 'new-folder', 'refresh', 'toggle-hidden'])
    })

    it('should include all required item properties', () => {
      store.loadDirectory('/home/scp')
      const items = store.getDirectoryContextItems()
      for (const item of items) {
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('label')
        expect(item).toHaveProperty('icon')
        expect(item).toHaveProperty('action')
      }
    })
  })
})
