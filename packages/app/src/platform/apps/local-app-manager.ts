import { unzipSync, strFromU8 } from 'fflate'
import { defineAsyncComponent } from 'vue'
import { filesystem } from '../../utils/filesystem'
import { serializeDesktopFile } from '../../utils/desktopShortcut'
import { ToolRegistry } from '../../gui/registry/ToolRegistry'
import { useThemeStore } from '../../gui/stores/themeStore'
import { useWindowManagerStore } from '../../gui/stores/windowManager'
import { commandRegistry } from '../../commands/commandRegistry'
import { permissionRegistry } from './permission-registry'
import { normalizePackagePath, validateLocalAppPackage } from './local-app-validator'
import type {
  InstalledLocalApp,
  LocalAppCommandContext,
  LocalAppInstallResult,
  LocalAppManifest,
  LocalAppPackageFile,
  PackageDiagnostic,
} from './local-app.types'
import type { CommandHandler } from '../../types/command'
import type { ToolType } from '../../gui/types'

const APPS_ROOT = '/home/scp/apps'
const DESKTOP_ROOT = '/home/scp/desktop'
const LOCAL_TOOL_PREFIX = 'local-app:'
const METADATA_KEY = 'scp-os-local-apps'
const DEFAULT_CURSOR = ''

type LocalAppApiContext = {
  appId: string
  windowId?: string
}

type LocalAppApiResult = unknown

type LocalAppApiErrorCode =
  | 'PERMISSION_DENIED'
  | 'INVALID_ARGUMENT'
  | 'UNSUPPORTED_API'
  | 'CONTEXT_UNAVAILABLE'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'

interface StructuredApiError {
  code: LocalAppApiErrorCode
  message: string
  permission?: string
  api?: string
}

class LocalAppApiError extends Error {
  constructor(
    public code: LocalAppApiErrorCode,
    message: string,
    public api?: string,
    public permission?: string
  ) {
    super(message)
    this.name = 'LocalAppApiError'
  }
}

const AsyncLocalIframeApp = defineAsyncComponent(
  () => import('../../gui/tools/localapp/LocalIframeApp.vue')
)

function isTextPath(path: string): boolean {
  return /\.(html?|css|js|mjs|json|txt|md|svg|xml|csv|log)$/i.test(path)
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, data] = dataUrl.split(',')
  const mime = meta.match(/^data:([^;]+)/)?.[1] || 'application/octet-stream'
  const binary = atob(data || '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize))
  }
  return btoa(binary)
}

function contentToBlob(path: string, content: string): Blob {
  if (content.startsWith('data:')) return dataUrlToBlob(content)
  return new Blob([content], { type: mimeForPath(path) })
}

function mimeForPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  if (ext === 'html' || ext === 'htm') return 'text/html'
  if (ext === 'css') return 'text/css'
  if (ext === 'js' || ext === 'mjs') return 'text/javascript'
  if (ext === 'json') return 'application/json'
  if (ext === 'svg') return 'image/svg+xml'
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webp') return 'image/webp'
  return 'application/octet-stream'
}

function storagePrefix(appId: string): string {
  return `scp-os-local-app:${appId}:`
}

function localToolId(appId: string): string {
  return `${LOCAL_TOOL_PREFIX}${appId}`
}

function readMetadata(): InstalledLocalApp[] {
  try {
    const raw = localStorage.getItem(METADATA_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as InstalledLocalApp[]) : []
  } catch {
    return []
  }
}

function writeMetadata(apps: InstalledLocalApp[]): void {
  localStorage.setItem(METADATA_KEY, JSON.stringify(apps))
}

function ensureDirectory(path: string): void {
  const parts = path.split('/').filter(Boolean)
  let current = ''
  for (const part of parts) {
    current += `/${part}`
    if (!filesystem.getNodeByPath(current)) {
      filesystem.createDirectory(current)
    }
  }
}

async function readFileAsText(file: File): Promise<string> {
  return await file.text()
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export class LocalAppManager {
  private apps = new Map<string, InstalledLocalApp>()
  private objectUrls = new Map<string, string>()
  private cursorSession: string | null = null

  async loadInstalledApps(): Promise<void> {
    ensureDirectory(APPS_ROOT)
    this.apps.clear()

    for (const app of readMetadata()) {
      if (!filesystem.getNodeByPath(app.rootPath)) continue
      this.apps.set(app.manifest.id, app)
      try {
        await this.registerRuntime(app)
      } catch (error) {
        console.warn(`[LocalAppManager] Failed to restore ${app.manifest.id}:`, error)
        this.apps.delete(app.manifest.id)
        commandRegistry.unregisterPlugin(app.manifest.id)
        ToolRegistry.unregister(app.toolId as ToolType)
      }
    }
    writeMetadata(this.getInstalledApps())
  }

  getInstalledApps(): InstalledLocalApp[] {
    return [...this.apps.values()].sort((a, b) => a.manifest.name.localeCompare(b.manifest.name))
  }

  getApp(appId: string): InstalledLocalApp | null {
    return this.apps.get(appId) ?? null
  }

  getIframeSandbox(appId: string): string {
    const app = this.getApp(appId)
    const sandbox = app?.manifest.sandbox
    const tokens = ['allow-scripts', 'allow-forms', 'allow-modals', 'allow-downloads']

    if (sandbox?.allowSameOrigin) tokens.push('allow-same-origin')
    if (sandbox?.allowPopups) tokens.push('allow-popups')
    if (sandbox?.allowTopNavigationByUserActivation) {
      tokens.push('allow-top-navigation-by-user-activation')
    }

    return tokens.join(' ')
  }

  async validateFromFileList(files: FileList, source: 'directory' | 'zip') {
    try {
      const packageFiles =
        source === 'zip' ? await this.readZipPackage(files) : await this.readDirectoryPackage(files)
      return validateLocalAppPackage(packageFiles)
    } catch (error) {
      return {
        ok: false,
        errors: [
          {
            severity: 'error' as const,
            code: 'PACKAGE_READ_FAILED',
            message: error instanceof Error ? error.message : String(error),
          },
        ],
        warnings: [],
        permissions: [],
        risk: 'low' as const,
      }
    }
  }

  async installFromFileList(files: FileList, source: 'directory' | 'zip'): Promise<LocalAppInstallResult> {
    try {
      const packageFiles =
        source === 'zip' ? await this.readZipPackage(files) : await this.readDirectoryPackage(files)
      return await this.installPackage(packageFiles, source)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async installPackage(
    packageFiles: LocalAppPackageFile[],
    source: 'directory' | 'zip'
  ): Promise<LocalAppInstallResult> {
    const validation = validateLocalAppPackage(packageFiles)
    if (!validation.ok || !validation.manifest) {
      return {
        success: false,
        error: this.formatDiagnostics(validation.errors),
        validation,
      }
    }

    const manifest = validation.manifest
    const manifestFile = this.findManifestFile(packageFiles)
    if (!manifestFile) {
      return {
        success: false,
        error: 'Missing scp-app.json',
        validation,
      }
    }

    const rootPrefix = manifestFile.path.replace(/scp-app\.json$/i, '')
    const previousApp = this.apps.get(manifest.id) ?? null
    const previousSnapshot = previousApp ? this.snapshotPackage(previousApp.rootPath) : []
    const previousShortcut = filesystem.readFile(`${DESKTOP_ROOT}/${manifest.id}.desktop`)

    try {
      commandRegistry.unregisterPlugin(manifest.id)
      ToolRegistry.unregister(localToolId(manifest.id) as ToolType)
      this.apps.delete(manifest.id)
      this.assertNoCommandConflicts(manifest)

      const installed = this.writePackage(manifest, packageFiles, rootPrefix, source)
      this.apps.set(manifest.id, installed)
      await this.registerRuntime(installed)
      if (installed.manifest.runtime === 'iframe-app') this.createDesktopShortcut(installed)
      writeMetadata(this.getInstalledApps())
      this.dispatchChanged()

      return { success: true, app: installed, validation }
    } catch (error) {
      await this.rollbackInstall(manifest.id, previousApp, previousSnapshot, previousShortcut)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        validation,
      }
    }
  }

  async uninstall(appId: string): Promise<void> {
    const app = this.apps.get(appId)
    if (!app) return

    commandRegistry.unregisterPlugin(appId)
    ToolRegistry.unregister(app.toolId as ToolType)
    filesystem.deleteNode(app.rootPath)
    filesystem.deleteNode(`${DESKTOP_ROOT}/${app.manifest.id}.desktop`)
    this.apps.delete(appId)
    writeMetadata(this.getInstalledApps())
    this.dispatchChanged()
  }

  private formatDiagnostics(diagnostics: PackageDiagnostic[]): string {
    return diagnostics.map((item) => `${item.code}: ${item.message}`).join('\n') || 'Invalid package'
  }

  private snapshotPackage(rootPath: string): LocalAppPackageFile[] {
    const files: LocalAppPackageFile[] = []
    const walk = (path: string) => {
      for (const node of filesystem.listDirectory(path)) {
        const childPath = `${path}/${node.name}`
        if (node.type === 'directory') {
          walk(childPath)
        } else {
          const content = filesystem.readFile(childPath)
          if (content !== null) {
            files.push({
              path: childPath.slice(rootPath.length + 1),
              content,
              size: content.length,
            })
          }
        }
      }
    }

    if (filesystem.getNodeByPath(rootPath)) walk(rootPath)
    return files
  }

  private restorePackage(rootPath: string, files: LocalAppPackageFile[]): void {
    if (filesystem.getNodeByPath(rootPath)) filesystem.deleteNode(rootPath)
    ensureDirectory(rootPath)

    for (const file of files) {
      const target = `${rootPath}/${normalizePackagePath(file.path)}`
      ensureDirectory(target.split('/').slice(0, -1).join('/'))
      filesystem.createFile(target, file.content)
    }
  }

  private async rollbackInstall(
    appId: string,
    previousApp: InstalledLocalApp | null,
    previousSnapshot: LocalAppPackageFile[],
    previousShortcut: string | null
  ): Promise<void> {
    try {
      commandRegistry.unregisterPlugin(appId)
      ToolRegistry.unregister(localToolId(appId) as ToolType)
      filesystem.deleteNode(`${APPS_ROOT}/${appId}`)
      filesystem.deleteNode(`${DESKTOP_ROOT}/${appId}.desktop`)
      this.apps.delete(appId)

      if (previousApp) {
        this.restorePackage(previousApp.rootPath, previousSnapshot)
        if (previousShortcut !== null) {
          const shortcutPath = `${DESKTOP_ROOT}/${appId}.desktop`
          if (filesystem.getNodeByPath(shortcutPath)) {
            filesystem.writeFile(shortcutPath, previousShortcut)
          } else {
            filesystem.createFile(shortcutPath, previousShortcut)
          }
        }
        this.apps.set(appId, previousApp)
        await this.registerRuntime(previousApp)
      }

      writeMetadata(this.getInstalledApps())
      this.dispatchChanged()
    } catch (error) {
      console.warn(`[LocalAppManager] Failed to rollback ${appId}:`, error)
    }
  }

  async createIframeDocument(appId: string): Promise<string> {
    const app = this.getApp(appId)
    if (!app) throw new Error(`Local app not found: ${appId}`)

    const entryPath = `${app.rootPath}/${normalizePackagePath(app.manifest.entry)}`
    const entry = filesystem.readFile(entryPath)
    if (entry === null) throw new Error(`Entry file not found: ${app.manifest.entry}`)

    const bridge = `<script>
window.scp = {
  request(type, payload) {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).slice(2);
      const onMessage = (event) => {
        const msg = event.data || {};
        if (msg.channel !== 'scp-os' || msg.id !== id) return;
        window.removeEventListener('message', onMessage);
        if (msg.ok === false || msg.error) {
          const details = typeof msg.error === 'object' && msg.error ? msg.error : { message: String(msg.error || 'SCP API failed') };
          const error = new Error(details.message || 'SCP API failed');
          error.code = details.code;
          error.permission = details.permission;
          error.api = details.api;
          reject(error);
        } else {
          resolve(msg.result);
        }
      };
      window.addEventListener('message', onMessage);
      parent.postMessage({ channel: 'scp-os', id, type, payload }, '*');
    });
  },
  storage: {
    get(key) { return window.scp.request('storage:get', { key }); },
    set(key, value) { return window.scp.request('storage:set', { key, value }); },
    remove(key) { return window.scp.request('storage:remove', { key }); }
  },
  notify(message) { return window.scp.request('notify', { message }); },
  window: {
    setTitle(title) { return window.scp.request('window:setTitle', { title }); },
    resize(width, height) { return window.scp.request('window:resize', { width, height }); }
  },
  ui: {
    setCursor(cursor) { return window.scp.request('ui:setCursor', { cursor }); },
    resetCursor() { return window.scp.request('ui:resetCursor'); }
  },
  theme: {
    getCurrent() { return window.scp.request('theme:getCurrent'); },
    setAccent(color) { return window.scp.request('theme:setAccent', { color }); },
    resetAccent() { return window.scp.request('theme:resetAccent'); }
  }
};
parent.postMessage({ channel: 'scp-os', type: 'ready' }, '*');
</script>`

    const withInlineAssets = this.inlineLocalAssets(app, entry)
    const rewritten = this.rewriteAssetUrls(app, withInlineAssets)
    return /<\/body>/i.test(rewritten)
      ? rewritten.replace(/<\/body>/i, `${bridge}</body>`)
      : `${rewritten}${bridge}`
  }

  releaseIframeSession(appId: string, windowId?: string): void {
    const sessionId = this.sessionId(appId, windowId)
    if (this.cursorSession === sessionId) {
      document.documentElement.style.cursor = DEFAULT_CURSOR
      document.body.style.cursor = DEFAULT_CURSOR
      this.cursorSession = null
    }
  }

  handleIframeMessage(appId: string, event: MessageEvent, windowId?: string): void {
    const msg = event.data || {}
    if (msg.channel !== 'scp-os' || !msg.id) return

    try {
      const result = this.handleApiRequest(
        { appId, windowId },
        String(msg.type ?? ''),
        msg.payload ?? {}
      )

      ;(event.source as Window | null)?.postMessage(
        { channel: 'scp-os', id: msg.id, ok: true, result },
        event.origin || '*'
      )
    } catch (error) {
      const apiError = this.toStructuredApiError(error, String(msg.type ?? ''))
      ;(event.source as Window | null)?.postMessage(
        {
          channel: 'scp-os',
          id: msg.id,
          ok: false,
          error: apiError,
        },
        event.origin || '*'
      )
    }
  }

  private toStructuredApiError(error: unknown, api: string): StructuredApiError {
    if (error instanceof LocalAppApiError) {
      return {
        code: error.code,
        message: error.message,
        permission: error.permission,
        api: error.api ?? api,
      }
    }

    return {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : String(error),
      api,
    }
  }

  private handleApiRequest(
    context: LocalAppApiContext,
    type: string,
    payload: Record<string, unknown>
  ): LocalAppApiResult {
    this.assertPermission(context.appId, type)

    if (type === 'storage:get') return this.storageGet(context.appId, payload)
    if (type === 'storage:set') return this.storageSet(context.appId, payload)
    if (type === 'storage:remove') return this.storageRemove(context.appId, payload)
    if (type === 'notify') return true
    if (type === 'window:setTitle') return this.windowSetTitle(context, payload)
    if (type === 'window:resize') return this.windowResize(context, payload)
    if (type === 'ui:setCursor') return this.uiSetCursor(context, payload)
    if (type === 'ui:resetCursor') return this.uiResetCursor(context)
    if (type === 'theme:getCurrent') return this.themeGetCurrent()
    if (type === 'theme:setAccent') return this.themeSetAccent(payload)
    if (type === 'theme:resetAccent') return this.themeResetAccent()

    throw new LocalAppApiError('UNSUPPORTED_API', `Unsupported SCP API: ${type}`, type)
  }

  private assertPermission(appId: string, type: string): void {
    const permission = permissionRegistry.forApi(type)
    if (!permission) return

    const app = this.getApp(appId)
    const permissions = app?.manifest.permissions ?? []
    if (!permissions.includes(permission.id)) {
      throw new LocalAppApiError(
        'PERMISSION_DENIED',
        `Permission denied: ${permission.id}`,
        type,
        permission.id
      )
    }
  }

  private storageGet(appId: string, payload: Record<string, unknown>): string | null {
    const key = String(payload.key ?? '')
    return key ? localStorage.getItem(`${storagePrefix(appId)}${key}`) : null
  }

  private storageSet(appId: string, payload: Record<string, unknown>): boolean {
    const key = String(payload.key ?? '')
    if (key) localStorage.setItem(`${storagePrefix(appId)}${key}`, String(payload.value ?? ''))
    return true
  }

  private storageRemove(appId: string, payload: Record<string, unknown>): boolean {
    const key = String(payload.key ?? '')
    if (key) localStorage.removeItem(`${storagePrefix(appId)}${key}`)
    return true
  }

  private windowSetTitle(context: LocalAppApiContext, payload: Record<string, unknown>): boolean {
    if (!context.windowId) {
      throw new LocalAppApiError(
        'CONTEXT_UNAVAILABLE',
        'Window API unavailable in this context',
        'window:setTitle',
        'window.control'
      )
    }
    const title = String(payload.title ?? '').trim()
    if (!title) throw new LocalAppApiError('INVALID_ARGUMENT', 'Window title is required', 'window:setTitle')
    return useWindowManagerStore().updateWindowTitle(context.windowId, title.slice(0, 80))
  }

  private windowResize(context: LocalAppApiContext, payload: Record<string, unknown>): boolean {
    if (!context.windowId) {
      throw new LocalAppApiError(
        'CONTEXT_UNAVAILABLE',
        'Window API unavailable in this context',
        'window:resize',
        'window.control'
      )
    }

    const store = useWindowManagerStore()
    const win = store.getWindow(context.windowId)
    if (!win) throw new LocalAppApiError('NOT_FOUND', 'Window not found', 'window:resize')

    const width = Number(payload.width)
    const height = Number(payload.height)
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      throw new LocalAppApiError(
        'INVALID_ARGUMENT',
        'Window width and height must be finite numbers',
        'window:resize'
      )
    }

    return store.updateWindowDimensions(context.windowId, {
      x: win.position.x,
      y: win.position.y,
      width,
      height,
    })
  }

  private uiSetCursor(context: LocalAppApiContext, payload: Record<string, unknown>): boolean {
    const cursor = String(payload.cursor ?? '').trim()
    if (!this.isAllowedCursor(cursor)) {
      throw new LocalAppApiError('INVALID_ARGUMENT', `Unsupported cursor: ${cursor}`, 'ui:setCursor')
    }

    this.cursorSession = this.sessionId(context.appId, context.windowId)
    document.documentElement.style.cursor = cursor
    document.body.style.cursor = cursor
    return true
  }

  private uiResetCursor(context: LocalAppApiContext): boolean {
    const sessionId = this.sessionId(context.appId, context.windowId)
    if (!this.cursorSession || this.cursorSession === sessionId) {
      document.documentElement.style.cursor = DEFAULT_CURSOR
      document.body.style.cursor = DEFAULT_CURSOR
      this.cursorSession = null
    }
    return true
  }

  private themeGetCurrent(): Record<string, unknown> {
    const themeStore = useThemeStore()
    return {
      id: themeStore.currentThemeId,
      name: themeStore.currentTheme.name,
      isDark: themeStore.currentTheme.isDark,
      accent: themeStore.customAccentColor ?? themeStore.currentTheme.colors.accent,
      customAccent: themeStore.customAccentColor,
      availableThemes: themeStore.availableThemes.map((theme) => ({
        id: theme.id,
        name: theme.name,
        isDark: theme.isDark,
      })),
    }
  }

  private themeSetAccent(payload: Record<string, unknown>): boolean {
    const color = String(payload.color ?? '').trim()
    if (!/^#[0-9a-f]{6}$/i.test(color)) {
      throw new LocalAppApiError('INVALID_ARGUMENT', 'Accent color must be #RRGGBB', 'theme:setAccent')
    }
    useThemeStore().setCustomAccentColor(color)
    return true
  }

  private themeResetAccent(): boolean {
    useThemeStore().setCustomAccentColor(null)
    return true
  }

  private sessionId(appId: string, windowId?: string): string {
    return `${appId}:${windowId ?? 'global'}`
  }

  private isAllowedCursor(cursor: string): boolean {
    return [
      'auto',
      'default',
      'none',
      'context-menu',
      'help',
      'pointer',
      'progress',
      'wait',
      'cell',
      'crosshair',
      'text',
      'vertical-text',
      'alias',
      'copy',
      'move',
      'no-drop',
      'not-allowed',
      'grab',
      'grabbing',
      'all-scroll',
      'col-resize',
      'row-resize',
      'n-resize',
      'e-resize',
      's-resize',
      'w-resize',
      'ne-resize',
      'nw-resize',
      'se-resize',
      'sw-resize',
      'ew-resize',
      'ns-resize',
      'nesw-resize',
      'nwse-resize',
      'zoom-in',
      'zoom-out',
    ].includes(cursor)
  }

  private async readDirectoryPackage(files: FileList): Promise<LocalAppPackageFile[]> {
    const result: LocalAppPackageFile[] = []
    for (const file of Array.from(files)) {
      const path = normalizePackagePath(file.webkitRelativePath || file.name)
      result.push({
        path,
        content: isTextPath(path) ? await readFileAsText(file) : await readFileAsDataUrl(file),
        size: file.size,
      })
    }
    return result
  }

  private async readZipPackage(files: FileList): Promise<LocalAppPackageFile[]> {
    const file = files[0]
    if (!file) throw new Error('No ZIP file selected')

    const bytes = new Uint8Array(await file.arrayBuffer())
    const unzipped = unzipSync(bytes)
    return Object.entries(unzipped)
      .filter(([path]) => !path.endsWith('/'))
      .map(([path, content]) => {
        const normalized = normalizePackagePath(path)
        return {
          path: normalized,
          content: isTextPath(normalized)
            ? strFromU8(content)
            : `data:${mimeForPath(normalized)};base64,${bytesToBase64(content)}`,
          size: content.byteLength,
        }
      })
  }

  private findManifestFile(files: LocalAppPackageFile[]): LocalAppPackageFile | null {
    return files.find((file) => /(^|\/)scp-app\.json$/i.test(file.path)) ?? null
  }

  private assertNoCommandConflicts(manifest: LocalAppManifest): void {
    const seen = new Set<string>()
    for (const command of manifest.commands ?? []) {
      for (const name of [command.name, ...(command.aliases ?? [])]) {
        const normalized = name.trim().toLowerCase()
        if (!normalized) throw new Error('Command name is required')
        if (seen.has(normalized) || commandRegistry.has(normalized)) {
          throw new Error(`Command name conflict: ${normalized}`)
        }
        seen.add(normalized)
      }
    }
  }

  private writePackage(
    manifest: LocalAppManifest,
    files: LocalAppPackageFile[],
    rootPrefix: string,
    source: 'directory' | 'zip'
  ): InstalledLocalApp {
    const rootPath = `${APPS_ROOT}/${manifest.id}`
    if (filesystem.getNodeByPath(rootPath)) filesystem.deleteNode(rootPath)
    ensureDirectory(rootPath)

    for (const file of files) {
      if (!file.path.startsWith(rootPrefix)) continue
      const relativePath = normalizePackagePath(file.path.slice(rootPrefix.length))
      if (!relativePath) continue

      const target = `${rootPath}/${relativePath}`
      const parent = target.split('/').slice(0, -1).join('/')
      ensureDirectory(parent)
      if (filesystem.getNodeByPath(target)) {
        filesystem.writeFile(target, file.content)
      } else {
        filesystem.createFile(target, file.content)
      }
    }

    return {
      manifest,
      rootPath,
      toolId: localToolId(manifest.id),
      source,
      installedAt: Date.now(),
    }
  }

  private async registerRuntime(app: InstalledLocalApp): Promise<void> {
    if (app.manifest.runtime === 'iframe-app') {
      ToolRegistry.register({
        id: app.toolId as ToolType,
        label: app.manifest.name,
        icon: 'code',
        windowConfig: {
          width: app.manifest.window?.width ?? 900,
          height: app.manifest.window?.height ?? 640,
          minWidth: app.manifest.window?.minWidth ?? 420,
          minHeight: app.manifest.window?.minHeight ?? 320,
          resizable: app.manifest.window?.resizable ?? true,
        },
        desktopComponent: AsyncLocalIframeApp,
        mobileComponent: AsyncLocalIframeApp,
      })
      return
    }

    await this.activateCommandModule(app)
  }

  private async activateCommandModule(app: InstalledLocalApp): Promise<void> {
    const entry = filesystem.readFile(`${app.rootPath}/${app.manifest.entry}`)
    if (entry === null) throw new Error(`Entry file not found: ${app.manifest.entry}`)

    const blobUrl = URL.createObjectURL(new Blob([entry], { type: 'text/javascript' }))
    try {
      const mod = await import(/* @vite-ignore */ blobUrl)
      const activate = mod.activate || mod.default?.activate || mod.default
      if (typeof activate !== 'function') {
        throw new Error('Command module must export activate(ctx)')
      }

      const ctx: LocalAppCommandContext = {
        commands: {
          register: (command) => {
            commandRegistry.register({
              name: command.name,
              aliases: command.aliases,
              description: command.description,
              usage: command.usage,
              permissions: command.permissions,
              source: 'plugin',
              pluginId: app.manifest.id,
              handler: command.handler as CommandHandler,
            })
          },
        },
        storage: {
          get: (key) => localStorage.getItem(`${storagePrefix(app.manifest.id)}${key}`),
          set: (key, value) => localStorage.setItem(`${storagePrefix(app.manifest.id)}${key}`, value),
          remove: (key) => localStorage.removeItem(`${storagePrefix(app.manifest.id)}${key}`),
        },
        permissions: app.manifest.permissions ?? [],
      }

      await activate(ctx)
    } finally {
      URL.revokeObjectURL(blobUrl)
    }
  }

  private createDesktopShortcut(app: InstalledLocalApp): void {
    const shortcutPath = `${DESKTOP_ROOT}/${app.manifest.id}.desktop`
    const content = serializeDesktopFile({
      name: app.manifest.name,
      type: 'Application',
      tool: app.toolId,
      icon: app.manifest.icon || 'code',
      x: 440,
      y: 180,
    })
    if (filesystem.getNodeByPath(shortcutPath)) {
      filesystem.writeFile(shortcutPath, content)
    } else {
      filesystem.createFile(shortcutPath, content)
    }
  }

  private isExternalAsset(value: string): boolean {
    return /^(https?:|data:|blob:|#|mailto:|tel:)/i.test(value)
  }

  private readAppAsset(app: InstalledLocalApp, assetPath: string): string | null {
    return filesystem.readFile(`${app.rootPath}/${normalizePackagePath(assetPath)}`)
  }

  private inlineLocalAssets(app: InstalledLocalApp, html: string): string {
    const withStyles = html.replace(/<link\b([^>]*?)\bhref=["']([^"']+)["']([^>]*)>/gi, (full, before, href, after) => {
      const attrs = `${before} ${after}`
      if (!/\brel=["'][^"']*\bstylesheet\b[^"']*["']/i.test(attrs)) return full
      if (this.isExternalAsset(href)) return full

      const content = this.readAppAsset(app, href)
      if (content === null) return full
      return `<style>${content.replace(/<\/style/gi, '<\\/style')}</style>`
    })

    return withStyles.replace(
      /<script\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi,
      (full, before, src, after) => {
        if (this.isExternalAsset(src)) return full

        const content = this.readAppAsset(app, src)
        if (content === null) return full
        return `<script${before}${after}>${content.replace(/<\/script/gi, '<\\/script')}</script>`
      }
    )
  }

  private rewriteAssetUrls(app: InstalledLocalApp, html: string): string {
    const urls = new Map<string, string>()
    const makeUrl = (assetPath: string): string => {
      const normalized = normalizePackagePath(assetPath)
      const cacheKey = `${app.manifest.id}:${normalized}`
      const cached = this.objectUrls.get(cacheKey)
      if (cached) return cached

      const content = filesystem.readFile(`${app.rootPath}/${normalized}`)
      if (content === null) return assetPath

      const url = URL.createObjectURL(contentToBlob(normalized, content))
      this.objectUrls.set(cacheKey, url)
      urls.set(assetPath, url)
      return url
    }

    return html.replace(/\b(src|href)=["']([^"']+)["']/gi, (full, attr, value) => {
      if (this.isExternalAsset(value)) return full
      return `${attr}="${makeUrl(value)}"`
    })
  }

  private dispatchChanged(): void {
    window.dispatchEvent(new CustomEvent('app-catalog-changed'))
  }
}

export const localAppManager = new LocalAppManager()
