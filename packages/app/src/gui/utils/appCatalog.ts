import type { IconName } from '../icons'
import type { ToolType } from '../types'
import { filesystem } from '../../utils/filesystem'
import { parseDesktopFile, serializeDesktopFile } from '../../utils/desktopShortcut'

export interface AppCatalogItem {
  tool: ToolType
  id: string
  labelKey: string
  descriptionKey: string
  iconName: IconName
  desktopFile: string
  protected?: boolean
  defaultX: number
  defaultY: number
}

export const DESKTOP_PATH = '/home/scp/desktop'
const UNINSTALLED_TOOLS_KEY = 'scp-os-uninstalled-tools'

export const APP_CATALOG: AppCatalogItem[] = [
  {
    tool: 'terminal',
    id: 'terminal',
    labelKey: 'app.terminal',
    descriptionKey: 'appManager.desc.terminal',
    iconName: 'terminal',
    desktopFile: 'terminal.desktop',
    defaultX: 50,
    defaultY: 50,
  },
  {
    tool: 'filemanager',
    id: 'files',
    labelKey: 'app.fileManager',
    descriptionKey: 'appManager.desc.filemanager',
    iconName: 'folder',
    desktopFile: 'files.desktop',
    defaultX: 180,
    defaultY: 50,
  },
  {
    tool: 'editor',
    id: 'editor',
    labelKey: 'app.editor',
    descriptionKey: 'appManager.desc.editor',
    iconName: 'edit',
    desktopFile: 'editor.desktop',
    defaultX: 310,
    defaultY: 310,
  },
  {
    tool: 'chat',
    id: 'chat',
    labelKey: 'app.chat',
    descriptionKey: 'appManager.desc.chat',
    iconName: 'chat',
    desktopFile: 'chat.desktop',
    defaultX: 310,
    defaultY: 50,
  },
  {
    tool: 'dash',
    id: 'dash',
    labelKey: 'app.dash',
    descriptionKey: 'appManager.desc.dash',
    iconName: 'dash',
    desktopFile: 'dash.desktop',
    defaultX: 50,
    defaultY: 180,
  },
  {
    tool: 'feedback',
    id: 'feedback',
    labelKey: 'app.feedback',
    descriptionKey: 'appManager.desc.feedback',
    iconName: 'feedback',
    desktopFile: 'feedback.desktop',
    defaultX: 180,
    defaultY: 180,
  },
  {
    tool: 'docs',
    id: 'docs',
    labelKey: 'app.docs',
    descriptionKey: 'appManager.desc.docs',
    iconName: 'docs',
    desktopFile: 'docs.desktop',
    defaultX: 310,
    defaultY: 180,
  },
  {
    tool: 'settings',
    id: 'settings',
    labelKey: 'app.settings',
    descriptionKey: 'appManager.desc.settings',
    iconName: 'settings',
    desktopFile: 'settings.desktop',
    defaultX: 50,
    defaultY: 310,
  },
  {
    tool: 'appmanager',
    id: 'appmanager',
    labelKey: 'app.appManager',
    descriptionKey: 'appManager.desc.appmanager',
    iconName: 'grid',
    desktopFile: 'appmanager.desktop',
    protected: true,
    defaultX: 180,
    defaultY: 310,
  },
]

function desktopShortcutPath(fileName: string): string {
  return `${DESKTOP_PATH}/${fileName}`
}

function dispatchAppCatalogChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-catalog-changed'))
  }
}

function readUninstalledTools(): Set<ToolType> {
  if (typeof localStorage === 'undefined') return new Set()

  try {
    const raw = localStorage.getItem(UNINSTALLED_TOOLS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return new Set(parsed as ToolType[])
    }
  } catch {
    /* ignore invalid persisted state */
  }

  return new Set()
}

function writeUninstalledTools(tools: Set<ToolType>): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(UNINSTALLED_TOOLS_KEY, JSON.stringify([...tools]))
}

export function isToolUninstalled(tool: ToolType): boolean {
  return readUninstalledTools().has(tool)
}

function markToolInstalled(tool: ToolType): void {
  const tools = readUninstalledTools()
  if (!tools.delete(tool)) return
  writeUninstalledTools(tools)
}

function markToolUninstalled(tool: ToolType): void {
  const tools = readUninstalledTools()
  tools.add(tool)
  writeUninstalledTools(tools)
}

export function getDesktopShortcutPath(item: AppCatalogItem): string {
  return desktopShortcutPath(item.desktopFile)
}

export function findInstalledShortcut(tool: ToolType): string | null {
  if (isToolUninstalled(tool)) return null

  for (const node of filesystem.listDirectory(DESKTOP_PATH)) {
    if (node.type !== 'file' || !node.name.endsWith('.desktop')) continue
    const content = filesystem.readFile(desktopShortcutPath(node.name))
    if (!content) continue
    const shortcut = parseDesktopFile(content)
    if (shortcut?.tool === tool) return desktopShortcutPath(node.name)
  }
  return null
}

export function getInstalledAppTools(): Set<ToolType> {
  const installed = new Set<ToolType>()
  for (const app of APP_CATALOG) {
    if (findInstalledShortcut(app.tool)) installed.add(app.tool)
  }
  return installed
}

export function isAppInstalled(tool: ToolType): boolean {
  return Boolean(findInstalledShortcut(tool))
}

export function installApp(item: AppCatalogItem, label: string): boolean {
  if (isAppInstalled(item.tool)) return true

  const content = serializeDesktopFile({
    name: label,
    type: 'Application',
    tool: item.tool,
    icon: item.iconName,
    x: item.defaultX,
    y: item.defaultY,
  })

  const ok = filesystem.createFile(getDesktopShortcutPath(item), content)
  if (ok) {
    markToolInstalled(item.tool)
    dispatchAppCatalogChanged()
  }
  return ok
}

export function uninstallApp(tool: ToolType): boolean {
  const shortcutPath = findInstalledShortcut(tool)
  if (!shortcutPath) {
    markToolUninstalled(tool)
    dispatchAppCatalogChanged()
    return true
  }
  const ok = filesystem.deleteNode(shortcutPath)
  if (ok) {
    markToolUninstalled(tool)
    dispatchAppCatalogChanged()
  }
  return ok
}

export function removePinnedTool(tool: ToolType): void {
  const raw = localStorage.getItem('scp-os-taskbar-pinned')
  if (!raw) return

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return
    const next = parsed.filter((item) => item !== tool)
    localStorage.setItem('scp-os-taskbar-pinned', JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('taskbar-pins-changed'))
  } catch {
    /* ignore invalid persisted state */
  }
}
