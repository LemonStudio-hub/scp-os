/**
 * Text Editor Store
 * Manages open files, dirty state, undo/redo tracking.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { filesystem } from '../../utils/filesystem'
import type { OpenFile } from '../types'

export const useTextEditorStore = defineStore('textEditor', () => {
  // State
  const openFiles = ref<OpenFile[]>([])
  const activeFileId = ref<string | null>(null)
  const fontSize = ref(14)
  const wordWrap = ref(true)
  const showLineNumbers = ref(true)
  const tabSize = ref(2)

  // Computed
  const activeFile = computed(() => {
    return openFiles.value.find(f => f.id === activeFileId.value) || null
  })

  const hasUnsavedChanges = computed(() => {
    return openFiles.value.some(f => f.dirty)
  })

  // Actions
  function openFile(path: string, content?: string): OpenFile {
    // Check if file is already open
    const existing = openFiles.value.find(f => f.path === path)
    if (existing) {
      activeFileId.value = existing.id
      return existing
    }

    const name = path.split('/').pop() || path
    const fileContent = content ?? filesystem.readFile(path) ?? ''
    const language = detectLanguage(name)

    const newFile: OpenFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      path,
      name,
      content: fileContent,
      originalContent: fileContent,
      language,
      dirty: false,
      createdAt: Date.now(),
      lastModifiedAt: Date.now(),
    }

    openFiles.value.push(newFile)
    activeFileId.value = newFile.id
    return newFile
  }

  function openNewFile(): OpenFile {
    const name = `untitled-${openFiles.value.length + 1}.txt`
    const newFile: OpenFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      path: `/home/scp/documents/${name}`,
      name,
      content: '',
      originalContent: '',
      language: 'plaintext',
      dirty: false,
      createdAt: Date.now(),
      lastModifiedAt: Date.now(),
    }

    openFiles.value.push(newFile)
    activeFileId.value = newFile.id
    return newFile
  }

  function closeFile(fileId: string): boolean {
    const index = openFiles.value.findIndex(f => f.id === fileId)
    if (index === -1) return false

    const file = openFiles.value[index]

    // Don't close dirty files without confirmation (handled by UI)
    if (file.dirty) {
      return false
    }

    openFiles.value.splice(index, 1)

    // If closing active file, activate another
    if (activeFileId.value === fileId) {
      activeFileId.value = openFiles.value.length > 0 ? openFiles.value[openFiles.value.length - 1].id : null
    }

    return true
  }

  function updateContent(fileId: string, content: string): void {
    const file = openFiles.value.find(f => f.id === fileId)
    if (!file) return

    file.content = content
    file.dirty = content !== file.originalContent
    file.lastModifiedAt = Date.now()
  }

  function saveFile(fileId: string): boolean {
    const file = openFiles.value.find(f => f.id === fileId)
    if (!file) return false

    const result = filesystem.writeFile(file.path, file.content)
    if (result) {
      file.originalContent = file.content
      file.dirty = false
      file.lastModifiedAt = Date.now()
    }

    return result
  }

  function saveAll(): boolean {
    let allSaved = true
    for (const file of openFiles.value) {
      if (file.dirty) {
        if (!saveFile(file.id)) {
          allSaved = false
        }
      }
    }
    return allSaved
  }

  function setActiveFile(fileId: string): void {
    activeFileId.value = fileId
  }

  function detectLanguage(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    const langMap: Record<string, string> = {
      ts: 'typescript', js: 'javascript', json: 'json', html: 'html',
      css: 'css', vue: 'vue', md: 'markdown', txt: 'plaintext',
      py: 'python', rs: 'rust', go: 'go', sh: 'shell', xml: 'xml',
      yaml: 'yaml', yml: 'yaml', sql: 'sql', log: 'log',
    }
    return langMap[ext] || 'plaintext'
  }

  function closeAll(): void {
    openFiles.value = []
    activeFileId.value = null
  }

  return {
    // State
    openFiles,
    activeFileId,
    fontSize,
    wordWrap,
    showLineNumbers,
    tabSize,

    // Computed
    activeFile,
    hasUnsavedChanges,

    // Actions
    openFile,
    openNewFile,
    closeFile,
    updateContent,
    saveFile,
    saveAll,
    setActiveFile,
    closeAll,
  }
})
