/**
 * Tool Registration — Registers all GUI tools with the ToolRegistry.
 * Each tool is self-contained and only exposes what the registry needs.
 */

import { ToolRegistry } from '../registry/ToolRegistry'

// Terminal tools
import TerminalPanel from '../tools/terminal/TerminalPanel.vue'
import MobileTerminal from '../tools/terminal/MobileTerminal.vue'

// File manager tools
import FileManagerWindow from '../tools/filemanager/FileManagerWindow.vue'
import MobileFileManager from '../tools/filemanager/MobileFileManager.vue'

// Editor tools
import EditorWindow from '../tools/editor/EditorWindow.vue'
import MobileEditor from '../tools/editor/MobileEditor.vue'

// Settings tools
import MobileSettings from '../tools/settings/MobileSettings.vue'

// Chat tools
import ChatWindow from '../tools/chat/ChatWindow.vue'

// Dash tools
import MobileDash from '../tools/dash/MobileDash.vue'

/**
 * Register all tools with the ToolRegistry.
 * Call this once during app initialization.
 */
export function registerAllTools(): void {
  // Terminal
  ToolRegistry.register({
    id: 'terminal',
    label: 'Terminal',
    icon: 'terminal',
    windowConfig: {
      width: 650,
      height: 380,
      minWidth: 320,
      minHeight: 200,
      resizable: true,
    },
    desktopComponent: TerminalPanel,
    mobileComponent: MobileTerminal,
  })

  // File Manager
  ToolRegistry.register({
    id: 'filemanager',
    label: 'File Manager',
    icon: 'folder',
    windowConfig: {
      width: 750,
      height: 480,
      minWidth: 320,
      minHeight: 240,
      resizable: true,
    },
    desktopComponent: FileManagerWindow,
    mobileComponent: MobileFileManager,
  })

  // Text Editor
  ToolRegistry.register({
    id: 'editor',
    label: 'Text Editor',
    icon: 'edit',
    windowConfig: {
      width: 700,
      height: 500,
      minWidth: 320,
      minHeight: 240,
      resizable: true,
    },
    desktopComponent: EditorWindow,
    mobileComponent: MobileEditor,
  })

  // Settings (mobile only — no desktop component)
  ToolRegistry.register({
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    windowConfig: {
      width: 400,
      height: 500,
      minWidth: 300,
      minHeight: 300,
      resizable: false,
    },
    mobileComponent: MobileSettings,
  })

  // Chat (mobile only)
  ToolRegistry.register({
    id: 'chat',
    label: 'Chat',
    icon: 'chat',
    windowConfig: {
      width: 400,
      height: 600,
      minWidth: 300,
      minHeight: 400,
      resizable: true,
    },
    mobileComponent: ChatWindow,
  })

  // Dash (mobile only - Performance Dashboard)
  ToolRegistry.register({
    id: 'dash',
    label: 'Dash',
    icon: 'dash',
    windowConfig: {
      width: 400,
      height: 550,
      minWidth: 300,
      minHeight: 400,
      resizable: true,
    },
    mobileComponent: MobileDash,
  })
}
