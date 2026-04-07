/**
 * Tool Registration — Registers all GUI tools with the ToolRegistry.
 * Each tool is self-contained and only exposes what the registry needs.
 */

import { ToolRegistry } from '../registry/ToolRegistry'
import { useI18n } from '../composables/useI18n'

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
import SettingsWindow from '../tools/settings/SettingsWindow.vue'
import MobileSettings from '../tools/settings/MobileSettings.vue'

// Chat tools
import ChatWindow from '../tools/chat/ChatWindow.vue'

// Dash tools
import MobileDash from '../tools/dash/MobileDash.vue'
import PCDashboard from '../tools/dash/PCDashboard.vue'

// Feedback tools
import MobileFeedback from '../tools/feedback/MobileFeedback.vue'

// i18n — resolved at runtime via the composable
// Labels are functions that call t() when evaluated (in openTool / getToolLabel)
function lbl(key: string): () => string {
  return () => {
    const { t } = useI18n()
    return t(key)
  }
}

/**
 * Register all tools with the ToolRegistry.
 * Call this once during app initialization.
 */
export function registerAllTools(): void {
  // Terminal
  ToolRegistry.register({
    id: 'terminal',
    label: lbl('app.terminal'),
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
    label: lbl('app.fileManager'),
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
    label: lbl('app.editor'),
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

  // Settings (now with desktop support)
  ToolRegistry.register({
    id: 'settings',
    label: lbl('app.settings'),
    icon: 'settings',
    windowConfig: {
      width: 800,
      height: 550,
      minWidth: 600,
      minHeight: 400,
      resizable: true,
    },
    desktopComponent: SettingsWindow,
    mobileComponent: MobileSettings,
  })

  // Chat (mobile only)
  ToolRegistry.register({
    id: 'chat',
    label: lbl('app.chat'),
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

  // Dash (both mobile and desktop)
  ToolRegistry.register({
    id: 'dash',
    label: lbl('app.dash'),
    icon: 'dash',
    windowConfig: {
      width: 700,
      height: 550,
      minWidth: 500,
      minHeight: 400,
      resizable: true,
    },
    desktopComponent: PCDashboard,
    mobileComponent: MobileDash,
  })

  // Feedback (mobile only - Public Feedback Board)
  ToolRegistry.register({
    id: 'feedback',
    label: lbl('app.feedback'),
    icon: 'feedback',
    windowConfig: {
      width: 400,
      height: 600,
      minWidth: 300,
      minHeight: 450,
      resizable: true,
    },
    mobileComponent: MobileFeedback,
  })
}
