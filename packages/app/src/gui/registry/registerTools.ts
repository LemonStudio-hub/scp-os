import { ToolRegistry } from '../registry/ToolRegistry'
import { useI18n } from '../composables/useI18n'
import { defineAsyncComponent, h } from 'vue'

const AsyncTerminalPanel = defineAsyncComponent(() => import('../tools/terminal/TerminalPanel.vue'))
const AsyncMobileTerminal = defineAsyncComponent(() => import('../tools/terminal/MobileTerminal.vue'))
const AsyncFileManagerWindow = defineAsyncComponent(() => import('../tools/filemanager/FileManagerWindow.vue'))
const AsyncMobileFileManager = defineAsyncComponent(() => import('../tools/filemanager/MobileFileManager.vue'))
const AsyncEditorWindow = defineAsyncComponent(() => import('../tools/editor/EditorWindow.vue'))
const AsyncMobileEditor = defineAsyncComponent(() => import('../tools/editor/MobileEditor.vue'))
const AsyncSettingsWindow = defineAsyncComponent(() => import('../tools/settings/SettingsWindow.vue'))
const AsyncMobileSettings = defineAsyncComponent(() => import('../tools/settings/MobileSettings.vue'))
const AsyncChatWindow = defineAsyncComponent(() => import('../tools/chat/ChatWindow.vue'))
const AsyncPCChatWindow = defineAsyncComponent(() => import('../tools/chat/PCChatWindow.vue'))
const AsyncMobileDash = defineAsyncComponent(() => import('../tools/dash/MobileDash.vue'))
const AsyncPCDashboard = defineAsyncComponent(() => import('../tools/dash/PCDashboard.vue'))
const AsyncMobileFeedback = defineAsyncComponent(() => import('../tools/feedback/MobileFeedback.vue'))
const AsyncPCFeedbackWindow = defineAsyncComponent(() => import('../tools/feedback/PCFeedbackWindow.vue'))
const AsyncPCDocsWindow = defineAsyncComponent(() => import('../tools/docs/PCDocsWindow.vue'))
const AsyncMobileDocs = defineAsyncComponent(() => import('../tools/docs/MobileDocs.vue'))
const AsyncPCProxyWindow = defineAsyncComponent(() => import('../tools/proxy/PCProxyWindow.vue'))
const AsyncMobileProxy = defineAsyncComponent(() => import('../tools/proxy/MobileProxy.vue'))

function lbl(key: string): () => string {
  return () => {
    const { t } = useI18n()
    return t(key)
  }
}

export function registerAllTools(): void {
  ToolRegistry.register({
    id: 'terminal',
    label: lbl('app.terminal'),
    icon: 'terminal',
    windowConfig: { width: 650, height: 380, minWidth: 320, minHeight: 200, resizable: true },
    desktopComponent: AsyncTerminalPanel,
    mobileComponent: AsyncMobileTerminal,
  })

  ToolRegistry.register({
    id: 'filemanager',
    label: lbl('app.fileManager'),
    icon: 'folder',
    windowConfig: { width: 750, height: 480, minWidth: 320, minHeight: 240, resizable: true },
    desktopComponent: AsyncFileManagerWindow,
    mobileComponent: AsyncMobileFileManager,
  })

  ToolRegistry.register({
    id: 'editor',
    label: lbl('app.editor'),
    icon: 'edit',
    windowConfig: { width: 700, height: 500, minWidth: 320, minHeight: 240, resizable: true },
    desktopComponent: AsyncEditorWindow,
    mobileComponent: AsyncMobileEditor,
  })

  ToolRegistry.register({
    id: 'settings',
    label: lbl('app.settings'),
    icon: 'settings',
    windowConfig: { width: 800, height: 550, minWidth: 600, minHeight: 400, resizable: true },
    desktopComponent: AsyncSettingsWindow,
    mobileComponent: AsyncMobileSettings,
  })

  ToolRegistry.register({
    id: 'chat',
    label: lbl('app.chat'),
    icon: 'chat',
    windowConfig: { width: 400, height: 600, minWidth: 300, minHeight: 400, resizable: true },
    desktopComponent: AsyncPCChatWindow,
    mobileComponent: AsyncChatWindow,
  })

  ToolRegistry.register({
    id: 'dash',
    label: lbl('app.dash'),
    icon: 'dash',
    windowConfig: { width: 700, height: 550, minWidth: 500, minHeight: 400, resizable: true },
    desktopComponent: AsyncPCDashboard,
    mobileComponent: AsyncMobileDash,
  })

  ToolRegistry.register({
    id: 'feedback',
    label: lbl('app.feedback'),
    icon: 'feedback',
    windowConfig: { width: 400, height: 600, minWidth: 300, minHeight: 450, resizable: true },
    desktopComponent: AsyncPCFeedbackWindow,
    mobileComponent: AsyncMobileFeedback,
  })

  ToolRegistry.register({
    id: 'docs',
    label: lbl('app.docs'),
    icon: 'docs',
    windowConfig: { width: 800, height: 600, minWidth: 500, minHeight: 400, resizable: true },
    desktopComponent: AsyncPCDocsWindow,
    mobileComponent: AsyncMobileDocs,
  })

  ToolRegistry.register({
    id: 'proxy',
    label: lbl('app.proxy'),
    icon: 'proxy',
    windowConfig: { width: 700, height: 550, minWidth: 420, minHeight: 380, resizable: true },
    desktopComponent: AsyncPCProxyWindow,
    mobileComponent: {
      render() {
        return h(AsyncMobileProxy, { visible: true, onClose: () => {} })
      },
    },
  })
}
