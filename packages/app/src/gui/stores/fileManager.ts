/**
 * File Manager Store
 * Reactive wrapper around the virtual filesystem for the GUI file manager.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { filesystem } from '../../utils/filesystem'
import type { FileSystemNode } from '../../utils/filesystem'
import type { ViewMode, SortField, SortOrder, FileItem, ContextMenuItem, ContextMenuState } from '../types'

export const useFileManagerStore = defineStore('fileManager', () => {
  // State
  const currentPath = ref<string>(filesystem.getCurrentDirectory())
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
        filesystem.changeDirectory(path)
        currentPath.value = filesystem.getCurrentDirectory()
      }

      const nodes = filesystem.listDirectory()
      files.value = nodes.map(nodeToItem)
    } catch (error) {
      console.error('[FileManager] Failed to load directory:', error)
    } finally {
      loading.value = false
    }
  }

  function navigateTo(path: string): void {
    selectedFiles.value.clear()
    loadDirectory(path)
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
    const path = `${currentPath.value}/${name}`
    const result = filesystem.createFile(path, content)
    if (result) loadDirectory()
    return result
  }

  function createDirectory(name: string): boolean {
    const path = `${currentPath.value}/${name}`
    const result = filesystem.createDirectory(path)
    if (result) loadDirectory()
    return result
  }

  function deleteSelected(): boolean {
    let success = true
    for (const fileName of selectedFiles.value) {
      const path = `${currentPath.value}/${fileName}`
      if (!filesystem.deleteNode(path)) {
        success = false
      }
    }
    selectedFiles.value.clear()
    if (success) loadDirectory()
    return success
  }

  function renameFile(oldName: string, newName: string): boolean {
    if (oldName === newName) return true
    const sourcePath = `${currentPath.value}/${oldName}`
    const destPath = `${currentPath.value}/${newName}`
    const result = filesystem.moveNode(sourcePath, destPath)
    if (result) loadDirectory()
    return result
  }

  function readFileContent(name: string): string | null {
    const path = `${currentPath.value}/${name}`
    return filesystem.readFile(path)
  }

  function writeFileContent(name: string, content: string): boolean {
    const path = `${currentPath.value}/${name}`
    const result = filesystem.writeFile(path, content)
    if (result) loadDirectory()
    return result
  }

  // Context menu
  function showContextMenu(x: number, y: number, fileName?: string): void {
    const items: ContextMenuItem[] = fileName
      ? getFileContextItems(fileName)
      : getDirectoryContextItems()

    contextMenu.value = { visible: true, x, y, items }
  }

  function hideContextMenu(): void {
    contextMenu.value.visible = false
  }

  function getFileContextItems(fileName: string): ContextMenuItem[] {
    const file = files.value.find(f => f.name === fileName)
    const isDir = file?.isDirectory ?? false

    return [
      { id: 'open', label: isDir ? 'Open' : 'Edit', icon: isDir ? 'folder-open' : 'edit', action: () => openFile(fileName) },
      { id: 'rename', label: 'Rename', icon: 'edit', action: () => promptRename(fileName) },
      { id: 'delete', label: 'Delete', icon: 'trash', action: () => deleteSelected() },
    ]
  }

  function getDirectoryContextItems(): ContextMenuItem[] {
    return [
      { id: 'new-file', label: 'New File', icon: 'file', action: () => promptNewFile() },
      { id: 'new-folder', label: 'New Folder', icon: 'folder', action: () => promptNewFolder() },
      { id: 'refresh', label: 'Refresh', icon: 'refresh', action: () => loadDirectory() },
    ]
  }

  // Placeholder action handlers (to be implemented in UI)
  function openFile(_fileName: string): void {
    // Will be handled by the window manager to open in editor or file manager
    console.log('[FileManager] Open file:', _fileName)
  }

  function promptRename(_fileName: string): void {
    console.log('[FileManager] Prompt rename:', _fileName)
  }

  function promptNewFile(): void {
    console.log('[FileManager] Prompt new file')
  }

  function promptNewFolder(): void {
    console.log('[FileManager] Prompt new folder')
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
  loadDirectory()

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
    promptRename,
    promptNewFile,
    promptNewFolder,
  }
})
