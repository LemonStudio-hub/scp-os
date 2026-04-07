/**
 * GUI Module — Public API
 *
 * This is the ONLY entry point for external modules to interact with the GUI.
 * All internal implementation details are hidden behind this interface.
 *
 * Usage:
 *   import { injectGUITokens, registerAllTools, ToolRegistry, eventBus, Events } from '@/gui'
 */

// Design system
export { injectGUITokens } from './design-tokens'
export { icon, iconNames } from './icons'
export type { IconName, IconProps } from './icons'

// Tool registry
export { ToolRegistry, openTool } from './registry/ToolRegistry'
export { registerAllTools } from './registry/registerTools'
export type { ToolModule, ToolWindowConfig } from './registry/ToolRegistry'

// Event system
export { eventBus, Events } from './events/EventBus'
export type { EventBus } from './events/EventBus'

// Shared types
export type {
  ToolType,
  WindowState,
  WindowConfig,
  WindowInstance,
  WindowSize,
  WindowPosition,
  WindowDimensions,
  FileItem,
  FilePermissions,
  ViewMode,
  SortField,
  SortOrder,
  ContextMenuIcon,
  ContextMenuItem,
  ContextMenuState,
  OpenFile,
  EditorState,
  EditorCursor,
  EditorSelection,
} from './types'

// Composables (standalone utilities)
export { useDraggable } from './composables/useDraggable'
export type { UseDraggableOptions, DragState } from './composables/useDraggable'

export { useResizable } from './composables/useResizable'
export type { UseResizableOptions, ResizeState } from './composables/useResizable'

export { useZIndex } from './composables/useZIndex'

export { useMobile } from './composables/useMobile'

export { useI18n } from './composables/useI18n'
export type { Locale } from '../locales'

export { useTheme } from './composables/useTheme'

export { useHammer } from './composables/useHammer'
export type { UseHammerOptions, GestureState } from './composables/useHammer'

export { useSwipeGesture } from './composables/useSwipeGesture'
export type { SwipeThresholds, SwipeState } from './composables/useSwipeGesture'

export { useTerminalEmulator } from './composables/useTerminalEmulator'
export type { UseTerminalEmulatorOptions } from './composables/useTerminalEmulator'

// Keyboard Shortcuts
export {
  useKeyboardShortcuts,
  useKeyboardShortcutManager,
  registerShortcut,
  unregisterShortcut,
  updateShortcut,
  getShortcuts,
  formatShortcut,
  parseShortcut,
  matchesShortcut,
  setContext,
  getContext,
} from './composables/useKeyboardShortcuts'
export type { KeyboardShortcut, ShortcutBinding } from './composables/useKeyboardShortcuts'

// Components (UI primitives)
export { default as SCPWindow } from './components/SCPWindow.vue'
export { default as SCPToolbar } from './components/SCPToolbar.vue'
export { default as MobileWindow } from './components/MobileWindow.vue'
export { default as MobileNavBar } from './components/MobileNavBar.vue'
export { default as MobileBottomSheet } from './components/MobileBottomSheet.vue'
export { default as MobileDock } from './components/MobileDock.vue'

export { default as GUIIcon } from './components/ui/GUIIcon.vue'
export { default as SCPButton } from './components/ui/SCPButton.vue'
export { default as SCPInput } from './components/ui/SCPInput.vue'
export { default as SCPContextMenu } from './components/ui/SCPContextMenu.vue'
export { default as SCPFileIcon } from './components/ui/SCPFileIcon.vue'
export { default as SCPBreadcrumbs } from './components/ui/SCPBreadcrumbs.vue'
export { default as SCPStatusBar } from './components/ui/SCPStatusBar.vue'
export { default as SCPTabs } from './components/ui/SCPTabs.vue'

// Mobile
export { default as HomeScreen } from './mobile/HomeScreen.vue'
export { default as MobileApp } from './mobile/MobileApp.vue'
export type { HomeApp } from './mobile/HomeScreen.vue'
