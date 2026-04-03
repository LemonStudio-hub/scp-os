/**
 * GUI Window Management Types
 */

export type ToolType = 'filemanager' | 'editor' | 'terminal'

export type WindowState = 'normal' | 'minimized' | 'maximized' | 'fullscreen'

export interface WindowSize {
  width: number
  height: number
}

export interface WindowPosition {
  x: number
  y: number
}

export interface WindowConfig {
  id: string
  tool: ToolType
  title: string
  iconName?: string
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  x?: number
  y?: number
  resizable?: boolean
  draggable?: boolean
  closable?: boolean
  minimizable?: boolean
  maximizable?: boolean
}

export interface WindowInstance {
  config: WindowConfig
  state: WindowState
  position: WindowPosition
  size: WindowSize
  zIndex: number
  focused: boolean
  minimized: boolean
  maximized: boolean
  createdAt: number
  lastFocusedAt: number
}

export interface WindowEvent {
  type: 'open' | 'close' | 'focus' | 'blur' | 'minimize' | 'maximize' | 'restore' | 'move' | 'resize'
  windowId: string
  timestamp: number
}

export interface WindowDimensions {
  x: number
  y: number
  width: number
  height: number
}

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

// File Manager Types

export interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  size: number
  createdAt: number
  modifiedAt: number
  permissions: FilePermissions
  type?: string
}

export interface FilePermissions {
  read: boolean
  write: boolean
  execute: boolean
}

export type ViewMode = 'grid' | 'list'

export type SortField = 'name' | 'size' | 'type' | 'modifiedAt'
export type SortOrder = 'asc' | 'desc'

export interface FileSortConfig {
  field: SortField
  order: SortOrder
}

// Text Editor Types

export interface OpenFile {
  id: string
  path: string
  name: string
  content: string
  originalContent: string
  language: string
  dirty: boolean
  createdAt: number
  lastModifiedAt: number
}

export interface EditorCursor {
  line: number
  column: number
}

export interface EditorSelection {
  start: EditorCursor
  end: EditorCursor
}

export interface EditorState {
  openFiles: OpenFile[]
  activeFileId: string | null
  fontSize: number
  wordWrap: boolean
  showLineNumbers: boolean
  showMinimap: boolean
  tabSize: number
}

// Context Menu Types

export type ContextMenuIcon =
  | 'folder' | 'edit' | 'trash' | 'file' | 'refresh'
  | 'plus' | 'folder-open' | 'x' | 'save' | 'search'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: ContextMenuIcon
  disabled?: boolean
  divider?: boolean
  action?: () => void
  children?: ContextMenuItem[]
}

export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  items: ContextMenuItem[]
}

// Toolbar Types

export interface ToolbarItem {
  id: string
  tool: ToolType
  label: string
  icon: string
  badge?: number
  disabled?: boolean
}
