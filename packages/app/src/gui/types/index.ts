/**
 * GUI Window Management Types
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type BuiltInToolType =
  | 'filemanager'
  | 'editor'
  | 'terminal'
  | 'settings'
  | 'appmanager'
  | 'chat'
  | 'dash'
  | 'feedback'
  | 'docs'
  | 'notification'
  | 'admin'

export type ToolType = BuiltInToolType | (string & {})

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
  isFullscreen?: boolean
  data?: Record<string, any>
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
  type:
    | 'open'
    | 'close'
    | 'focus'
    | 'blur'
    | 'minimize'
    | 'maximize'
    | 'restore'
    | 'move'
    | 'resize'
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
  isHidden?: boolean
}

export interface FilePermissions {
  read: boolean
  write: boolean
  execute: boolean
}

export type ViewMode = 'grid' | 'list' | 'column' | 'detail'

export type SortField = 'name' | 'size' | 'type' | 'modifiedAt'
export type SortOrder = 'asc' | 'desc'

export interface FileSortConfig {
  field: SortField
  order: SortOrder
}

export interface SidebarItem {
  label: string
  path: string
  icon?: string
  isFavorite?: boolean
}

export interface SidebarSection {
  id: string
  label: string
  items: SidebarItem[]
  collapsed?: boolean
}

export interface ColumnEntry {
  path: string
  files: FileItem[]
  selectedName?: string
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
  | 'folder'
  | 'edit'
  | 'trash'
  | 'file'
  | 'refresh'
  | 'plus'
  | 'folder-open'
  | 'x'
  | 'save'
  | 'search'
  | 'list'
  | 'settings'
  | 'eye'
  | 'sort'
  | 'play'
  | 'pin'
  | 'info'
  | 'terminal'
  | 'battery'
  | 'wifi'
  | 'menu'
  | 'file-text'
  | 'copy'
  | 'star'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: ContextMenuIcon
  disabled?: boolean
  divider?: boolean
  /** Non-interactive header row, usually shown at the top with a larger icon */
  header?: boolean
  /** Secondary text rendered under `label`. Only used by header rows today. */
  sublabel?: string
  /** Show this item visually as "checked" (leading checkmark). */
  checked?: boolean
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

export * from './feedback'
export * from './settings'
export * from './chat'
