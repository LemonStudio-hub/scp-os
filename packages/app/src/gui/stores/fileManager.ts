/**
 * File Manager Store
 * Reactive wrapper around the virtual filesystem for the GUI file manager.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { filesystem } from '../../utils/filesystem'
import type { FileSystemNode } from '../../utils/filesystem'
import type { ViewMode, SortField, SortOrder, FileItem, ContextMenuIcon, ContextMenuState } from '../types'
import logger from '../../utils/logger'

// i18n — set by consuming component via setI18n()
 
let _t: ((key: string, params?: Record<string, string | number>) => string) = (key: string) => key

export function setI18n(i18n: { t: (key: string, params?: Record<string, string | number>) => string }): void {
  _t = i18n.t
}

export const useFileManagerStore = defineStore('fileManager', () => {
  // State
  const currentPath = ref<string>('/')
  const files = ref<FileItem[]>([])
  const viewMode = ref<ViewMode>('grid')
  const sortField = ref<SortField>('name')
  const sortOrder = ref<SortOrder>('asc')
  const searchQuery = ref<string>('')
  const selectedFiles = ref<Set<string>>(new Set())
  const contextMenu = ref<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  })
  const loading = ref(false)

  // Computed
  const sortedFiles = computed(() => {
    let filtered = files.value

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(f => f.name.toLowerCase().includes(query))
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      // Directories always come first
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1
      }

      let comparison = 0
      switch (sortField.value) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'type':
          comparison = (a.isDirectory ? 'folder' : a.name.split('.').pop() || '').localeCompare(
            b.isDirectory ? 'folder' : b.name.split('.').pop() || ''
          )
          break
        case 'modifiedAt':
          comparison = a.modifiedAt - b.modifiedAt
          break
      }
      return sortOrder.value === 'asc' ? comparison : -comparison
    })
  })

  const breadcrumbs = computed(() => {
    const segments = currentPath.value.split('/').filter(Boolean)
    return [
      { label: '/', path: '/' },
      ...segments.map((seg, i) => ({
        label: seg,
        path: '/' + segments.slice(0, i + 1).join('/'),
      })),
    ]
  })

  // Actions
  function loadDirectory(path?: string): void {
    loading.value = true
    try {
      if (path) {
        // Normalize path for virtual filesystem
        const fsPath = path === '/' ? '/' : path
        filesystem.changeDirectory(fsPath)
        currentPath.value = fsPath
      }

      const nodes = filesystem.listDirectory()
      files.value = nodes.map(nodeToItem)
    } catch (error) {
      logger.error('[FileManager] Failed to load directory:', error)
    } finally {
      loading.value = false
    }
  }

  function navigateTo(path: string): void {
    selectedFiles.value.clear()
    loadDirectory(path)
  }

  function goHome(): void {
    selectedFiles.value.clear()
    loadDirectory('/home/scp')
  }

  function goUp(): void {
    if (currentPath.value === '/') return
    const parts = currentPath.value.split('/').filter(Boolean)
    parts.pop()
    const parentPath = '/' + parts.join('/') || '/'
    loadDirectory(parentPath)
  }

  function toggleSelect(fileName: string): void {
    if (selectedFiles.value.has(fileName)) {
      selectedFiles.value.delete(fileName)
    } else {
      selectedFiles.value.add(fileName)
    }
  }

  function clearSelection(): void {
    selectedFiles.value.clear()
  }

  function setViewMode(mode: ViewMode): void {
    viewMode.value = mode
  }

  function setSort(field: SortField): void {
    if (sortField.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortOrder.value = 'asc'
    }
  }

  function setSearch(query: string): void {
    searchQuery.value = query
  }

  // File operations
  function createFile(name: string, content?: string): boolean {
    const fsPath = currentPath.value === '/' ? `/${name}` : `${currentPath.value}/${name}`
    const result = filesystem.createFile(fsPath, content)
    if (result) loadDirectory()
    return result
  }

  function createDirectory(name: string): boolean {
    const fsPath = currentPath.value === '/' ? `/${name}` : `${currentPath.value}/${name}`
    const result = filesystem.createDirectory(fsPath)
    if (result) loadDirectory()
    return result
  }

  function deleteSelected(): boolean {
    let success = true
    for (const fileName of selectedFiles.value) {
      const fsPath = currentPath.value === '/' ? `/${fileName}` : `${currentPath.value}/${fileName}`
      if (!filesystem.deleteNode(fsPath)) {
        success = false
      }
    }
    selectedFiles.value.clear()
    if (success) loadDirectory()
    return success
  }

  function renameFile(oldName: string, newName: string): boolean {
    if (oldName === newName) return true
    const fsSource = currentPath.value === '/' ? `/${oldName}` : `${currentPath.value}/${oldName}`
    const fsDest = currentPath.value === '/' ? `/${newName}` : `${currentPath.value}/${newName}`
    const result = filesystem.moveNode(fsSource, fsDest)
    if (result) loadDirectory()
    return result
  }

  function readFileContent(name: string): string | null {
    const fsPath = currentPath.value === '/' ? `/${name}` : `${currentPath.value}/${name}`
    return filesystem.readFile(fsPath)
  }

  function writeFileContent(name: string, content: string): boolean {
    const fsPath = currentPath.value === '/' ? `/${name}` : `${currentPath.value}/${name}`
    const result = filesystem.writeFile(fsPath, content)
    if (result) loadDirectory()
    return result
  }

  // Context menu
  interface FileContextAction {
    id: string
    label: string
    icon: ContextMenuIcon
    action: () => void
  }

  function showContextMenu(x: number, y: number, fileName?: string): void {
    const items: FileContextAction[] = fileName
      ? getFileContextItems(fileName)
      : getDirectoryContextItems()

    contextMenu.value = { visible: true, x, y, items: items as any }
  }

  function hideContextMenu(): void {
    contextMenu.value.visible = false
  }

  function getFileContextItems(fileName: string): FileContextAction[] {
    const file = files.value.find(f => f.name === fileName)
    const isDir = file?.isDirectory ?? false

    return [
      { id: 'open', label: isDir ? _t('fm.open') : _t('fm.edit'), icon: isDir ? 'folder-open' : 'edit', action: () => openFile(fileName) },
      { id: 'rename', label: _t('common.rename'), icon: 'edit', action: () => promptRename(fileName) },
      { id: 'delete', label: _t('common.delete'), icon: 'trash', action: () => deleteFile(fileName) },
    ]
  }

  function getDirectoryContextItems(): FileContextAction[] {
    return [
      { id: 'new-file', label: _t('fm.newFile'), icon: 'file', action: () => promptNewFile() },
      { id: 'new-folder', label: _t('fm.newFolder'), icon: 'folder', action: () => promptNewFolder() },
      { id: 'refresh', label: _t('fm.refresh'), icon: 'refresh', action: () => loadDirectory() },
    ]
  }

  // Action handlers
  function openFile(fileName: string): void {
    const fsPath = currentPath.value === '/' ? `/${fileName}` : `${currentPath.value}/${fileName}`
    const content = filesystem.readFile(fsPath)
    if (content !== null) {
      logger.info('[FileManager] Open file:', fileName, content)
    }
  }

  function deleteFile(fileName: string): void {
    const fsPath = currentPath.value === '/' ? `/${fileName}` : `${currentPath.value}/${fileName}`
    filesystem.deleteNode(fsPath)
    loadDirectory()
  }

  function promptRename(_fileName: string): void {
    const newName = prompt(_t('fm.promptRename'), _fileName)
    if (newName && newName !== _fileName) {
      renameFile(_fileName, newName)
    }
  }

  function promptNewFile(): void {
    const name = prompt(_t('fm.promptNewFile'), _t('fm.untitled'))
    if (name) {
      createFile(name, '')
    }
  }

  function promptNewFolder(): void {
    const name = prompt(_t('fm.promptNewFolder'), _t('fm.newFolderDefault'))
    if (name) {
      createDirectory(name)
    }
  }

  // Helper
  function nodeToItem(node: FileSystemNode): FileItem {
    return {
      name: node.name,
      path: `${currentPath.value}/${node.name}`.replace('//', '/'),
      isDirectory: node.type === 'directory',
      size: node.size,
      createdAt: node.mtime,
      modifiedAt: node.mtime,
      permissions: {
        read: node.permissions.user.read,
        write: node.permissions.user.write,
        execute: node.permissions.user.execute,
      },
      type: node.type === 'directory' ? 'folder' : node.name.split('.').pop(),
    }
  }

  // Initialize
  loadDirectory('/')

  return {
    // State
    currentPath,
    files,
    viewMode,
    sortField,
    sortOrder,
    searchQuery,
    selectedFiles,
    contextMenu,
    loading,

    // Computed
    sortedFiles,
    breadcrumbs,

    // Actions
    loadDirectory,
    navigateTo,
    goHome,
    goUp,
    toggleSelect,
    clearSelection,
    setViewMode,
    setSort,
    setSearch,
    createFile,
    createDirectory,
    deleteSelected,
    renameFile,
    readFileContent,
    writeFileContent,
    showContextMenu,
    hideContextMenu,
    getFileContextItems,
    getDirectoryContextItems,
    openFile,
    deleteFile,
    promptRename,
    promptNewFile,
    promptNewFolder,
  }
})
