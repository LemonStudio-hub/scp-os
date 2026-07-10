import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../../../utils/filesystem', () => ({
  filesystem: {
    readFile: vi.fn((path: string) => {
      const files: Record<string, string> = {
        '/home/scp/documents/hello.ts': 'const x: number = 1;',
        '/home/scp/documents/style.css': 'body { color: red; }',
        '/home/scp/documents/index.html': '<html></html>',
      }
      return files[path] ?? null
    }),
    writeFile: vi.fn(() => true),
  },
}))

import { useTextEditorStore } from '../textEditor'

describe('TextEditorStore', () => {
  let store: ReturnType<typeof useTextEditorStore>

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    store = useTextEditorStore()
  })

  describe('default state', () => {
    it('should start with no open files', () => {
      expect(store.openFiles).toEqual([])
    })

    it('should have null activeFileId', () => {
      expect(store.activeFileId).toBeNull()
    })

    it('should have default editor settings', () => {
      expect(store.fontSize).toBe(14)
      expect(store.wordWrap).toBe(true)
      expect(store.showLineNumbers).toBe(true)
      expect(store.tabSize).toBe(2)
    })

    it('should have no unsaved changes', () => {
      expect(store.hasUnsavedChanges).toBe(false)
    })
  })

  describe('openFile', () => {
    it('should open a file from the filesystem', async () => {
      const file = await store.openFile('/home/scp/documents/hello.ts')

      expect(store.openFiles.length).toBe(1)
      expect(file.path).toBe('/home/scp/documents/hello.ts')
      expect(file.name).toBe('hello.ts')
      expect(file.content).toBe('const x: number = 1;')
    })

    it('should set the opened file as active', async () => {
      const file = await store.openFile('/home/scp/documents/hello.ts')
      expect(store.activeFileId).toBe(file.id)
    })

    it('should set dirty to false initially', async () => {
      const file = await store.openFile('/home/scp/documents/hello.ts')
      expect(file.dirty).toBe(false)
    })

    it('should detect the correct language', async () => {
      const file = await store.openFile('/home/scp/documents/hello.ts')
      expect(file.language).toBe('typescript')
    })

    it('should use provided content instead of reading from filesystem', async () => {
      const file = await store.openFile('/some/path.ts', 'custom content')
      expect(file.content).toBe('custom content')
    })

    it('should not duplicate already open files', async () => {
      await store.openFile('/home/scp/documents/hello.ts')
      await store.openFile('/home/scp/documents/hello.ts')

      expect(store.openFiles.length).toBe(1)
    })

    it('should switch to already open file on duplicate open', async () => {
      const first = await store.openFile('/home/scp/documents/hello.ts')
      await store.openFile('/home/scp/documents/style.css')
      expect(store.activeFileId).not.toBe(first.id)

      await store.openFile('/home/scp/documents/hello.ts')
      expect(store.activeFileId).toBe(first.id)
    })

    it('should handle file not in filesystem gracefully', async () => {
      const file = await store.openFile('/nonexistent/file.txt')
      expect(file.content).toBe('')
      expect(file.name).toBe('file.txt')
    })
  })

  describe('openNewFile', () => {
    it('should create a new untitled file', () => {
      const file = store.openNewFile()

      expect(file.name).toBe('untitled-1.txt')
      expect(file.content).toBe('')
      expect(file.language).toBe('plaintext')
      expect(file.dirty).toBe(false)
    })

    it('should set the new file as active', () => {
      const file = store.openNewFile()
      expect(store.activeFileId).toBe(file.id)
    })

    it('should increment untitled counter', () => {
      store.openNewFile()
      const file2 = store.openNewFile()
      expect(file2.name).toBe('untitled-2.txt')
    })

    it('should add the file to openFiles', () => {
      store.openNewFile()
      expect(store.openFiles.length).toBe(1)
    })
  })

  describe('closeFile', () => {
    it('should close a clean file', async () => {
      const file = await store.openFile('/home/scp/documents/hello.ts')
      const result = store.closeFile(file.id)

      expect(result).toBe(true)
      expect(store.openFiles.length).toBe(0)
    })

    it('should refuse to close a dirty file', async () => {
      const file = await store.openFile('/home/scp/documents/hello.ts')
      store.updateContent(file.id, 'modified content')

      const result = store.closeFile(file.id)

      expect(result).toBe(false)
      expect(store.openFiles.length).toBe(1)
    })

    it('should return false for non-existent file id', () => {
      const result = store.closeFile('non-existent-id')
      expect(result).toBe(false)
    })

    it('should set active to the last remaining file', async () => {
      const file1 = await store.openFile('/home/scp/documents/hello.ts')
      const file2 = await store.openFile('/home/scp/documents/style.css')

      store.closeFile(file1.id)

      expect(store.activeFileId).toBe(file2.id)
    })

    it('should set active to null when closing the last file', async () => {
      const file = await store.openFile('/home/scp/documents/hello.ts')
      store.closeFile(file.id)

      expect(store.activeFileId).toBeNull()
    })
  })

  describe('updateContent', () => {
    it('should update file content', async () => {
      const file = await store.openFile('/home/scp/documents/hello.ts')
      store.updateContent(file.id, 'new content')

      expect(store.openFiles[0].content).toBe('new content')
    })

    it('should mark file as dirty when content differs from original', async () => {
      const file = await store.openFile('/home/scp/documents/hello.ts')
      store.updateContent(file.id, 'modified')

      expect(store.openFiles[0].dirty).toBe(true)
    })

    it('should mark file as clean when content matches original', async () => {
      const file = await store.openFile('/home/scp/documents/hello.ts')
      store.updateContent(file.id, 'modified')
      store.updateContent(file.id, file.originalContent)

      expect(store.openFiles[0].dirty).toBe(false)
    })

    it('should update lastModifiedAt', async () => {
      const file = await store.openFile('/home/scp/documents/hello.ts')
      const before = file.lastModifiedAt

      // small delay to ensure timestamp changes
      await new Promise((r) => setTimeout(r, 10))
      store.updateContent(file.id, 'modified')

      expect(store.openFiles[0].lastModifiedAt).toBeGreaterThanOrEqual(before)
    })

    it('should do nothing for non-existent file id', () => {
      expect(() => store.updateContent('non-existent', 'content')).not.toThrow()
    })

    it('should report hasUnsavedChanges when any file is dirty', async () => {
      const file = await store.openFile('/home/scp/documents/hello.ts')
      expect(store.hasUnsavedChanges).toBe(false)

      store.updateContent(file.id, 'modified')
      expect(store.hasUnsavedChanges).toBe(true)
    })
  })

  describe('setActiveFile', () => {
    it('should set the active file id', async () => {
      const file1 = await store.openFile('/home/scp/documents/hello.ts')
      await store.openFile('/home/scp/documents/style.css')

      store.setActiveFile(file1.id)
      expect(store.activeFileId).toBe(file1.id)
    })

    it('should update the activeFile computed', async () => {
      await store.openFile('/home/scp/documents/hello.ts')
      const file2 = await store.openFile('/home/scp/documents/style.css')

      store.setActiveFile(file2.id)
      expect(store.activeFile?.id).toBe(file2.id)
    })
  })

  describe('detectLanguage', () => {
    it.each([
      ['file.ts', 'typescript'],
      ['file.js', 'javascript'],
      ['file.json', 'json'],
      ['file.html', 'html'],
      ['file.css', 'css'],
      ['file.vue', 'vue'],
      ['file.md', 'markdown'],
      ['file.txt', 'plaintext'],
      ['file.py', 'python'],
      ['file.rs', 'rust'],
      ['file.go', 'go'],
      ['file.sh', 'shell'],
      ['file.xml', 'xml'],
      ['file.yaml', 'yaml'],
      ['file.yml', 'yaml'],
      ['file.sql', 'sql'],
      ['file.log', 'log'],
    ])('should detect %s as %s', async (fileName, expectedLang) => {
      const file = await store.openFile(`/test/${fileName}`, '')
      expect(file.language).toBe(expectedLang)
    })

    it('should default to plaintext for unknown extensions', async () => {
      const file = await store.openFile('/test/file.xyz', '')
      expect(file.language).toBe('plaintext')
    })

    it('should default to plaintext for files with no extension', async () => {
      const file = await store.openFile('/test/Makefile', '')
      expect(file.language).toBe('plaintext')
    })
  })

  describe('closeAll', () => {
    it('should remove all open files', async () => {
      await store.openFile('/home/scp/documents/hello.ts')
      await store.openFile('/home/scp/documents/style.css')

      store.closeAll()

      expect(store.openFiles.length).toBe(0)
    })

    it('should reset activeFileId to null', async () => {
      await store.openFile('/home/scp/documents/hello.ts')
      store.closeAll()

      expect(store.activeFileId).toBeNull()
    })

    it('should work when no files are open', () => {
      expect(() => store.closeAll()).not.toThrow()
      expect(store.openFiles.length).toBe(0)
      expect(store.activeFileId).toBeNull()
    })
  })

  describe('activeFile computed', () => {
    it('should return null when no file is active', () => {
      expect(store.activeFile).toBeNull()
    })

    it('should return the active file object', async () => {
      const file = await store.openFile('/home/scp/documents/hello.ts')
      expect(store.activeFile?.id).toBe(file.id)
      expect(store.activeFile?.name).toBe('hello.ts')
    })
  })
})
