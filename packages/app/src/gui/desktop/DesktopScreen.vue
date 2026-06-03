<template>
  <div
    ref="desktopRef"
    class="desktop-screen"
    :class="[
      `icon-size-${desktopIconSize}`,
      { 'desktop-screen--grid-visible': isDraggingDesktopIcon && gridSnapEnabled },
    ]"
    :style="desktopThemeStyles"
    @contextmenu="handleDesktopContextMenu"
  >
    <!-- Wallpaper -->
    <div
      class="desktop-screen__wallpaper"
      :class="{ 'has-custom-wallpaper': !!customWallpaperUrl }"
    >
      <!-- Custom wallpaper image -->
      <img
        v-if="customWallpaperUrl"
        :src="customWallpaperUrl"
        class="desktop-screen__wallpaper-image"
        alt="Custom wallpaper"
        fetchpriority="high"
      />
      <!-- Default gradient overlay -->
      <div class="desktop-screen__wallpaper-gradient" />
      <!-- SVG pattern overlay -->
      <div class="desktop-screen__wallpaper-pattern">
        <svg width="100%" height="100%" viewBox="0 0 800 800" fill="none">
          <circle cx="400" cy="400" r="360" :stroke="wallpaperPatternColor1" stroke-width="1" />
          <circle cx="400" cy="400" r="240" :stroke="wallpaperPatternColor2" stroke-width="1" />
          <circle cx="400" cy="400" r="120" :stroke="wallpaperPatternColor3" stroke-width="1" />
          <line
            x1="0"
            y1="400"
            x2="800"
            y2="400"
            :stroke="wallpaperPatternColor3"
            stroke-width="0.5"
          />
          <line
            x1="400"
            y1="0"
            x2="400"
            y2="800"
            :stroke="wallpaperPatternColor3"
            stroke-width="0.5"
          />
        </svg>
      </div>
    </div>

    <!-- Desktop Icons -->
    <div class="desktop-screen__icons" :class="`icon-size-${desktopIconSize}`">
      <div
        v-for="app in apps"
        :key="app.id"
        :ref="(el) => bindAppDrag(el as HTMLElement, app)"
        :data-app-id="app.id"
        class="desktop-screen__icon"
        :style="{ left: `${app.x}px`, top: `${app.y}px` }"
        @mousedown="handleAppMouseDown($event, app)"
        @dblclick="onAppDoubleClick(app)"
        @contextmenu="handleAppContextMenu($event, app)"
      >
        <div class="desktop-screen__icon-content">
          <div
            class="desktop-screen__icon-bg"
            :class="`desktop-screen__icon-bg--${app.id}`"
            :style="desktopIconStyle"
          >
            <div class="desktop-screen__icon-inner">
              <template v-if="app.id === 'terminal'">
                <span class="desktop-screen__icon-text">&gt;_</span>
              </template>
              <template v-else-if="app.id === 'files'">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M4 20h16a2 2 0 002-2V8a2 2 0 00-2-2h-7.93a2 2 0 01-1.66-.9l-.82-1.2A2 2 0 007.93 3H4a2 2 0 00-2 2v13c0 1.1.9 2 2 2Z"
                  />
                </svg>
              </template>
              <template v-else-if="app.id === 'settings'">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 8.6a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                  />
                </svg>
              </template>
              <template v-else-if="app.id === 'appmanager'">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </template>
              <template v-else-if="app.id === 'chat'">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                  />
                </svg>
              </template>
              <template v-else-if="app.id === 'dash'">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
              </template>
              <template v-else-if="app.id === 'feedback'">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="13" x2="13" y2="13" />
                </svg>
              </template>
              <template v-else-if="app.id === 'docs'">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                  <line x1="9" y1="7" x2="15" y2="7" />
                  <line x1="9" y1="11" x2="15" y2="11" />
                </svg>
              </template>
              <template v-else-if="app.id === 'editor'">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                </svg>
              </template>
              <template v-else-if="app.isDirectory">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M4 20h16a2 2 0 002-2V8a2 2 0 00-2-2h-7.93a2 2 0 01-1.66-.9l-.82-1.2A2 2 0 007.93 3H4a2 2 0 00-2 2v13c0 1.1.9 2 2 2Z"
                  />
                </svg>
              </template>
              <template v-else-if="app.isFile">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </template>
              <template v-else>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M12 8v8" />
                  <path d="M8 12h8" />
                </svg>
              </template>
            </div>
          </div>
          <span class="desktop-screen__icon-label">{{ getAppLabel(app) }}</span>
        </div>
      </div>
    </div>

    <!-- PC Taskbar -->
    <PCTaskbar
      ref="startButtonRef"
      :items="taskbarItems"
      :active-tools="activeTools"
      @launch="onTaskbarLaunch"
      @start-click="onStartClick"
      @item-contextmenu="handleTaskbarContextMenu"
    />

    <!-- PC Start Menu -->
    <PCStartMenu
      ref="startMenuRef"
      :is-open="isStartMenuOpen"
      @launch="onStartMenuLaunch"
      @system-action="onSystemAction"
      @power-action="onPowerAction"
    />

    <!-- Context Menu -->
    <PCCContextMenu
      ref="contextMenuRef"
      v-model:visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.items"
      @select="onContextMenuSelect"
    />

    <!-- Input Dialog -->
    <DialogModal
      v-model:visible="dialogVisible"
      type="input"
      :title="dialogTitle"
      :placeholder="dialogPlaceholder"
      @confirm="onDialogConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, reactive } from 'vue'
import { useThemeStore } from '../stores/themeStore'
import { useWindowManagerStore } from '../stores/windowManager'
import { usePreferencesStore } from '../stores/preferencesStore'
import { wallpaperService } from '../../utils/wallpaperService'
import PCTaskbar, { type PCTaskbarItem } from '../components/PCTaskbar.vue'
import PCStartMenu, { type StartMenuApp } from '../components/PCStartMenu.vue'
import PCCContextMenu from '../components/ui/PCCContextMenu.vue'
import DialogModal from '../tools/filemanager/DialogModal.vue'
import { useDraggable } from '../composables/useDraggable'
import { useI18n } from '../composables/useI18n'
import { ToolRegistry } from '../registry/ToolRegistry'
import type { IconName } from '../icons'
import type { ToolType, ContextMenuItem, ContextMenuIcon } from '../types'
import { filesystem } from '../../utils/filesystem'
import { isToolUninstalled } from '../utils/appCatalog'
import {
  parseDesktopFile,
  serializeDesktopFile,
  type DesktopShortcut,
} from '../../utils/desktopShortcut'
import logger from '../../utils/logger'

export interface DesktopApp {
  id: string
  label: string
  tool: string
  color: string
  x?: number
  y?: number
  shortcutFile?: string // path to .desktop file
  filePath?: string // path to regular file/folder
  isFile?: boolean
  isDirectory?: boolean
  data?: Record<string, unknown> // extra data passed to window
}

const { t } = useI18n()
const prefsStore = usePreferencesStore()

const apps = reactive<DesktopApp[]>([])

function loadDesktopApps() {
  const desktopPath = '/home/scp/desktop'
  const nodes = filesystem.listDirectory(desktopPath)
  const loaded: DesktopApp[] = []

  for (const node of nodes) {
    const fullPath = `${desktopPath}/${node.name}`

    if (node.type === 'file' && node.name.endsWith('.desktop')) {
      // .desktop shortcut file
      const content = filesystem.readFile(fullPath)
      if (!content) continue
      const shortcut = parseDesktopFile(content)
      if (!shortcut) continue
      if (isToolUninstalled(shortcut.tool as ToolType)) continue

      loaded.push({
        id: shortcut.tool,
        label: shortcut.name,
        tool: shortcut.tool,
        color: 'var(--gui-accent)',
        x: shortcut.x,
        y: shortcut.y,
        shortcutFile: fullPath,
      })
    } else if (node.type === 'directory') {
      // Directory
      loaded.push({
        id: `dir-${node.name}`,
        label: node.name,
        tool: 'filemanager',
        color: 'var(--gui-accent)',
        x: 0,
        y: 0,
        filePath: fullPath,
        isDirectory: true,
        data: { initialPath: fullPath },
      })
    } else if (node.type === 'file') {
      // Regular file
      loaded.push({
        id: `file-${node.name}`,
        label: node.name,
        tool: 'editor',
        color: 'var(--gui-accent)',
        x: 0,
        y: 0,
        filePath: fullPath,
        isFile: true,
        data: { filePath: fullPath },
      })
    }
  }

  apps.splice(0, apps.length, ...loaded)
  const loadedIds = new Set(loaded.map((app) => app.id))
  for (const [id, dragState] of appDragStates) {
    if (!loadedIds.has(id)) {
      dragState.stop()
      appDragStates.delete(id)
    }
  }

  // Translate known system app labels from legacy English names
  const enToKey: Record<string, string> = {
    Terminal: 'app.terminal',
    Files: 'app.files',
    'File Manager': 'app.fileManager',
    Chat: 'app.chat',
    Dash: 'app.dash',
    Feedback: 'app.feedback',
    Docs: 'app.docs',
    'Docs Reader': 'app.docs',
    Settings: 'app.settings',
    'App Manager': 'app.appManager',
    Editor: 'app.editor',
    'Text Editor': 'app.editor',
  }
  for (const app of apps) {
    const key = enToKey[app.label]
    if (key) {
      const translated = t(key)
      if (translated && translated !== key) app.label = translated
    }
  }
}

function saveDesktopShortcut(app: DesktopApp) {
  if (!app.shortcutFile) return
  const shortcut: DesktopShortcut = {
    name: app.label,
    type: 'Application',
    tool: app.tool,
    icon: app.tool,
    x: app.x ?? 0,
    y: app.y ?? 0,
  }
  filesystem.writeFile(app.shortcutFile, serializeDesktopFile(shortcut))
}

function getAppLabel(app: DesktopApp): string {
  const toolToKey: Record<string, string> = {
    terminal: 'app.terminal',
    filemanager: 'app.files',
    editor: 'app.editor',
    chat: 'app.chat',
    dash: 'app.dash',
    feedback: 'app.feedback',
    docs: 'app.docs',
    settings: 'app.settings',
    appmanager: 'app.appManager',
  }
  const key = toolToKey[app.tool]
  if (key) {
    const translated = t(key)
    if (translated !== key) return translated
  }
  return app.label
}

const DEFAULT_PINNED_TOOLS: ToolType[] = [
  'terminal' as ToolType,
  'filemanager' as ToolType,
  'editor' as ToolType,
]

function loadPinnedTools(): ToolType[] {
  if (prefsStore.ready) {
    const saved = prefsStore.prefs.taskbarPinned
    if (Array.isArray(saved) && saved.length > 0) return saved as ToolType[]
  }
  try {
    const raw = localStorage.getItem('scp-os-taskbar-pinned')
    if (!raw) return [...DEFAULT_PINNED_TOOLS]
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'string')) {
      return parsed as ToolType[]
    }
  } catch {
    // fall through
  }
  return [...DEFAULT_PINNED_TOOLS]
}

const pinnedTools = ref<ToolType[]>(loadPinnedTools())

function persistPinnedTools() {
  prefsStore.set('taskbarPinned', [...pinnedTools.value]).catch(() => {})
}

function reloadPinnedTools(): void {
  pinnedTools.value = loadPinnedTools()
}

const TOOL_LABEL_KEYS: Partial<Record<string, string>> = {
  terminal: 'app.terminal',
  filemanager: 'app.files',
  editor: 'app.editor',
  chat: 'app.chat',
  dash: 'app.dash',
  feedback: 'app.feedback',
  docs: 'app.docs',
  settings: 'app.settings',
  appmanager: 'app.appManager',
}

function resolveToolLabel(tool: ToolType): string {
  const meta = ToolRegistry.get(tool)
  if (meta) {
    const raw = typeof meta.label === 'function' ? meta.label() : meta.label
    if (raw) return raw
  }
  const key = TOOL_LABEL_KEYS[tool as string]
  if (key) {
    const translated = t(key)
    if (translated !== key) return translated
  }
  return tool
}

function resolveToolIcon(tool: ToolType): IconName {
  const meta = ToolRegistry.get(tool)
  return ((meta?.icon as IconName) ?? 'menu') as IconName
}

const wmStore = useWindowManagerStore()
const activeTools = computed<ToolType[]>(() => [
  ...new Set(wmStore.openWindows.map((win) => win.config.tool)),
])

const installedTaskbarTools = computed(
  () =>
    new Set(
      apps
        .filter((app) => !app.isFile && !app.isDirectory && ToolRegistry.has(app.tool as ToolType))
        .map((app) => app.tool as ToolType)
    )
)

function createTaskbarItem(tool: ToolType): PCTaskbarItem {
  return {
    id: tool,
    tool,
    label: resolveToolLabel(tool),
    iconName: resolveToolIcon(tool),
  }
}

const taskbarItems = computed<PCTaskbarItem[]>(() => {
  const pinned = pinnedTools.value.filter(
    (tool) => installedTaskbarTools.value.has(tool) || activeTools.value.includes(tool)
  )
  const temporary = activeTools.value.filter((tool) => !pinned.includes(tool))

  return [...pinned, ...temporary].map(createTaskbarItem)
})

function isToolPinned(tool: ToolType): boolean {
  return pinnedTools.value.includes(tool)
}

function pinToolToTaskbar(tool: ToolType): void {
  if (isToolPinned(tool)) return
  pinnedTools.value = [...pinnedTools.value, tool]
  persistPinnedTools()
}

function unpinToolFromTaskbar(tool: ToolType): void {
  if (!isToolPinned(tool)) return
  pinnedTools.value = pinnedTools.value.filter((t) => t !== tool)
  persistPinnedTools()
}

const isStartMenuOpen = ref(false)

// Grid snap state — drives drop-snap AND visible grid overlay during drag
function loadGridSnap(): boolean {
  if (prefsStore.ready) return prefsStore.prefs.desktopGridSnap
  const saved = localStorage.getItem('scp-os-grid-snap')
  if (saved === 'false') return false
  return true
}

const gridSnapEnabled = ref<boolean>(loadGridSnap())
const isDraggingDesktopIcon = ref(false)

function setGridSnap(enabled: boolean): void {
  gridSnapEnabled.value = enabled
  prefsStore.set('desktopGridSnap', enabled).catch(() => {})
}

function toggleGridSnap(): void {
  setGridSnap(!gridSnapEnabled.value)
}

// Desktop icon size: large | medium | small
const desktopIconSize = ref<'large' | 'medium' | 'small'>('medium')

// Desktop sort order: name | date
const desktopSortBy = ref<'name' | 'date'>('name')

// Load saved icon size
function loadIconSize() {
  if (prefsStore.ready) {
    desktopIconSize.value = prefsStore.prefs.desktopIconSize
    return
  }
  const saved = localStorage.getItem('scp-os-desktop-icon-size')
  if (saved === 'large' || saved === 'medium' || saved === 'small') {
    desktopIconSize.value = saved
  }
}

// Grid layout gap based on icon size
function getGridGap(): number {
  if (desktopIconSize.value === 'large') return 150
  if (desktopIconSize.value === 'small') return 110
  return 130
}

// Arrange apps in grid layout based on current sort and size
function arrangeApps() {
  const cols = 3
  const startX = 50
  const startY = 50
  const gap = getGridGap()

  // Sort apps copy
  const sorted = [...apps].sort((a, b) => {
    if (desktopSortBy.value === 'name') {
      return a.label.localeCompare(b.label)
    }
    return 0
  })

  // Reassign positions
  sorted.forEach((app, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const newX = startX + col * gap
    const newY = startY + row * gap

    // Update reactive app position
    app.x = newX
    app.y = newY

    // Update draggable state if exists
    const dragState = appDragStates.get(app.id)
    if (dragState) {
      dragState.setInitialPosition(newX, newY)
    }

    // Save to filesystem
    saveDesktopShortcut(app)
  })
}

// Save and apply icon size
function setDesktopIconSize(size: 'large' | 'medium' | 'small') {
  desktopIconSize.value = size
  prefsStore.set('desktopIconSize', size).catch(() => {})
  logger.info('Desktop icon size changed to:', size)
  arrangeApps() // Re-arrange with new gap
}

// Load saved sort preference
function loadSortBy() {
  if (prefsStore.ready) {
    desktopSortBy.value = prefsStore.prefs.desktopSortBy
    return
  }
  const saved = localStorage.getItem('scp-os-desktop-sort-by')
  if (saved === 'name' || saved === 'date') {
    desktopSortBy.value = saved
  }
}

function setDesktopSortBy(sort: 'name' | 'date') {
  desktopSortBy.value = sort
  prefsStore.set('desktopSortBy', sort).catch(() => {})
  arrangeApps()
  logger.info('Desktop sort changed to:', sort)
}

loadIconSize()
loadSortBy()
// Note: arrangeApps() is called in onMounted after drag states are initialized

// Context menu state
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
  selectedApp: null as DesktopApp | null,
})

// Dialog state
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogPlaceholder = ref('')
const dialogMode = ref<'folder' | 'file'>('folder')

const emit = defineEmits<{
  launch: [app: DesktopApp]
  'start-click': []
}>()

const customWallpaperUrl = ref<string | null>(null)
const themeStore = useThemeStore()
themeStore.init()

// Desktop app drag states
const appDragStates = new Map<string, ReturnType<typeof useDraggable>>()
let nextZIndex = 1
const lastLaunchByApp = new Map<string, number>()

function launchDesktopApp(app: DesktopApp) {
  const now = Date.now()
  const lastLaunch = lastLaunchByApp.get(app.id) ?? 0
  if (now - lastLaunch < 250) return
  lastLaunchByApp.set(app.id, now)
  emit('launch', app)
}

const GRID_ORIGIN_X = 50
const GRID_ORIGIN_Y = 50

function snapToGrid(x: number, y: number): { x: number; y: number } {
  if (!gridSnapEnabled.value) return { x, y }
  const gap = getGridGap()
  const col = Math.max(0, Math.round((x - GRID_ORIGIN_X) / gap))
  const row = Math.max(0, Math.round((y - GRID_ORIGIN_Y) / gap))
  return {
    x: GRID_ORIGIN_X + col * gap,
    y: GRID_ORIGIN_Y + row * gap,
  }
}

function bindAppDrag(el: HTMLElement | null, app: DesktopApp) {
  if (!el || appDragStates.has(app.id)) return
  const state = useDraggable(ref(el), {
    boundary: {
      minX: 0,
      minY: 0,
      maxX: window.innerWidth - 100,
      maxY: window.innerHeight - 150,
    },
    onClick: () => launchDesktopApp(app),
    onStart: () => {
      el?.classList.add('is-dragging')
      isDraggingDesktopIcon.value = true
      // Increment z-index so dragged icon is always on top
      nextZIndex++
      if (el) {
        el.style.zIndex = String(nextZIndex)
      }
    },
    onMove: (x, y) => {
      app.x = x
      app.y = y
    },
    onEnd: (x, y) => {
      const snapped = snapToGrid(x, y)
      app.x = snapped.x
      app.y = snapped.y
      state.setInitialPosition(snapped.x, snapped.y)
      el?.classList.remove('is-dragging')
      isDraggingDesktopIcon.value = false
      saveDesktopShortcut(app)
      // Keep the elevated z-index so overlapping icons stay stacked by last-used
    },
  })
  state.setInitialPosition(app.x ?? 0, app.y ?? 0)
  appDragStates.set(app.id, state)
}

function handleAppMouseDown(e: MouseEvent, app: DesktopApp) {
  appDragStates.get(app.id)?.handleMouseDown(e)
}

// Handle app double click
const onAppDoubleClick = (app: DesktopApp) => {
  launchDesktopApp(app)
}

// Handle taskbar app launch
const onTaskbarLaunch = (item: PCTaskbarItem) => {
  const app = apps.find((a) => a.tool === item.tool)
  if (app) {
    emit('launch', app)
  }
}

// Handle start button click
const onStartClick = () => {
  isStartMenuOpen.value = !isStartMenuOpen.value
}

// Handle start menu app launch
const onStartMenuLaunch = (app: StartMenuApp) => {
  const desktopApp = apps.find((a) => a.tool === app.tool) || {
    id: app.id,
    label: app.label,
    tool: app.tool,
    color: 'var(--gui-accent)',
    x: 50,
    y: 50,
  }
  emit('launch', desktopApp)
  isStartMenuOpen.value = false
}

// Handle system actions
const onSystemAction = (action: string) => {
  logger.info('System action:', action)
  // Implement system action handling here
  isStartMenuOpen.value = false
}

// Handle power actions
const onPowerAction = (action: string) => {
  logger.info('Power action:', action)
  // Implement power action handling here
  isStartMenuOpen.value = false
}

// Handle desktop context menu
const handleDesktopContextMenu = (event: MouseEvent) => {
  event.preventDefault()

  // Only show desktop menu on empty areas (not on app icons or taskbar)
  const target = event.target as HTMLElement
  if (target.closest('.desktop-screen__icon') || target.closest('.pc-taskbar')) {
    return
  }

  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    items: [
      {
        id: 'new-folder',
        label: t('fm.newFolder'),
        icon: 'folder',
        action: () => {
          dialogMode.value = 'folder'
          dialogTitle.value = t('fm.newFolder')
          dialogPlaceholder.value = t('fm.newFolder')
          dialogVisible.value = true
        },
      },
      {
        id: 'new-text-file',
        label: t('pc.newTextFile'),
        icon: 'file-text',
        action: () => {
          dialogMode.value = 'file'
          dialogTitle.value = t('pc.newTextFile')
          dialogPlaceholder.value = t('pc.newTextFile')
          dialogVisible.value = true
        },
      },
      { id: 'divider-2', label: '', divider: true },
      {
        id: 'view',
        label: t('pc.view'),
        icon: 'eye',
        children: [
          {
            id: 'view-large-icons',
            label: t('pc.largeIcons'),
            action: () => setDesktopIconSize('large'),
          },
          {
            id: 'view-medium-icons',
            label: t('pc.mediumIcons'),
            action: () => setDesktopIconSize('medium'),
          },
          {
            id: 'view-small-icons',
            label: t('pc.smallIcons'),
            action: () => setDesktopIconSize('small'),
          },
        ],
      },
      {
        id: 'sort-by',
        label: t('pc.sortBy'),
        icon: 'sort',
        children: [
          {
            id: 'sort-by-name',
            label: t('pc.name'),
            action: () => setDesktopSortBy('name'),
          },
          {
            id: 'sort-by-date',
            label: t('pc.dateModified'),
            action: () => setDesktopSortBy('date'),
          },
        ],
      },
      {
        id: 'align-to-grid',
        label: t('pc.alignToGrid'),
        icon: 'sort',
        checked: gridSnapEnabled.value,
        action: () => toggleGridSnap(),
      },
      { id: 'divider-2', label: '', divider: true },
      {
        id: 'personalize',
        label: t('pc.personalize'),
        icon: 'settings',
        action: () => {
          logger.info('Open personalization settings')
          // Implement personalization settings
        },
      },
    ],
    selectedApp: null,
  }
}

// Handle app context menu
const handleAppContextMenu = (event: MouseEvent, app: DesktopApp) => {
  event.preventDefault()
  event.stopPropagation()

  const appTool = app.tool as ToolType
  const canPin = ToolRegistry.has(appTool) && !app.isFile && !app.isDirectory
  const pinned = canPin && isToolPinned(appTool)

  const items: ContextMenuItem[] = [
    {
      id: 'open',
      label: t('pc.open'),
      icon: 'play',
      action: () => {
        emit('launch', app)
      },
    },
  ]

  if (canPin) {
    items.push({
      id: pinned ? 'unpin-from-taskbar' : 'pin-to-taskbar',
      label: pinned ? t('pc.unpinTaskbar') : t('pc.pinTaskbar'),
      icon: 'pin',
      action: () => {
        if (pinned) {
          unpinToolFromTaskbar(appTool)
        } else {
          pinToolToTaskbar(appTool)
        }
      },
    })
  }

  items.push(
    { id: 'divider-3', label: '', divider: true },
    {
      id: 'properties',
      label: t('pc.properties'),
      icon: 'info',
      action: () => {
        logger.info('Properties:', app.id)
        // Implement properties dialog
      },
    }
  )

  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    items,
    selectedApp: app,
  }
}

// Handle taskbar item context menu (right-click on a pinned app button)
const handleTaskbarContextMenu = (event: MouseEvent, item: PCTaskbarItem) => {
  event.preventDefault()

  const tool = item.tool
  const wins = wmStore.openWindows.filter((win) => win.config.tool === tool)
  const headerSublabel =
    wins.length === 0
      ? t('pc.notRunning')
      : wins.length === 1
        ? t('pc.oneWindowOpen')
        : t('pc.nWindowsOpen', { n: wins.length })

  const items: ContextMenuItem[] = [
    {
      id: 'header',
      header: true,
      label: item.label,
      sublabel: headerSublabel,
      icon: (item.iconName as ContextMenuIcon | undefined) ?? 'play',
    },
    {
      id: 'open-new',
      label: wins.length > 0 ? t('pc.openNewWindow') : t('pc.open'),
      icon: 'play',
      action: () => emit('launch', findOrCreateAppForTool(tool, item.label)),
    },
  ]

  if (wins.length > 0) {
    items.push({
      id: 'close-windows',
      label: wins.length > 1 ? `${t('pc.closeAllWindows')} (${wins.length})` : t('pc.close'),
      icon: 'x',
      action: () => {
        wins.forEach((win) => wmStore.closeWindow(win.config.id))
      },
    })
  }

  items.push({ id: 'taskbar-div', label: '', divider: true })

  if (isToolPinned(tool)) {
    items.push({
      id: 'unpin-from-taskbar',
      label: t('pc.unpinTaskbar'),
      icon: 'pin',
      action: () => unpinToolFromTaskbar(tool),
    })
  } else {
    items.push({
      id: 'pin-to-taskbar',
      label: t('pc.pinTaskbar'),
      icon: 'pin',
      action: () => pinToolToTaskbar(tool),
    })
  }

  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    items,
    selectedApp: null,
  }
}

function findOrCreateAppForTool(tool: ToolType, label: string): DesktopApp {
  const existing = apps.find((a) => a.tool === tool)
  if (existing) return existing
  return {
    id: tool,
    label,
    tool,
    color: 'var(--gui-accent)',
    x: 50,
    y: 50,
  }
}

// Handle context menu selection
const onContextMenuSelect = (item: ContextMenuItem) => {
  logger.info('Context menu selected:', item.id)
  // Additional handling if needed
}

// Handle dialog confirm
const onDialogConfirm = (value: string | true) => {
  const name = typeof value === 'string' ? value.trim() : ''
  if (!name) return
  const desktopPath = '/home/scp/desktop'

  if (dialogMode.value === 'folder') {
    const existing = filesystem.listDirectory(desktopPath).some((n) => n.name === name)
    if (existing) return
    filesystem.createDirectory(`${desktopPath}/${name}`)
  } else {
    const fileName = name.endsWith('.txt') ? name : `${name}.txt`
    const existing = filesystem.listDirectory(desktopPath).some((n) => n.name === fileName)
    if (existing) return
    filesystem.writeFile(`${desktopPath}/${fileName}`, '')
  }

  loadDesktopApps()
  arrangeApps()
}

function reloadDesktopApps(): void {
  loadDesktopApps()
}

// Close start menu when clicking outside
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const startMenuRef = ref<any>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const startButtonRef = ref<any>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const contextMenuRef = ref<any>(null)

function handleClickOutside(event: MouseEvent) {
  const startMenuEl = startMenuRef.value?.$el ?? startMenuRef.value
  const startButtonEl = startButtonRef.value?.$el ?? startButtonRef.value
  const contextMenuEl = contextMenuRef.value?.$el ?? contextMenuRef.value

  if (
    startMenuEl &&
    !startMenuEl.contains(event.target as Node) &&
    startButtonEl &&
    !startButtonEl.contains(event.target as Node)
  ) {
    isStartMenuOpen.value = false
  }

  if (contextMenuEl && !contextMenuEl.contains(event.target as Node)) {
    contextMenu.value.visible = false
  }
}

// Computed styles for theme-reactive properties
const desktopThemeStyles = computed(() => ({
  '--desktop-bg': themeStore.currentTheme.colors.bgBase,
  '--desktop-text': themeStore.currentTheme.colors.textPrimary,
  '--desktop-accent': themeStore.currentTheme.colors.accent,
}))

const desktopIconStyle = computed(() => {
  if (themeStore.currentTheme.id === 'claude') {
    return {
      background: '#FAF9F5',
      border: '1.5px solid #D97757',
      color: '#D97757',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.05)',
    }
  }

  return {
    background: `linear-gradient(135deg, ${themeStore.currentTheme.colors.appIconFrom}, ${themeStore.currentTheme.colors.appIconTo})`,
  }
})

// Wallpaper pattern colors
const wallpaperPatternColor1 = computed(() => themeStore.currentTheme.colors.borderSubtle)
const wallpaperPatternColor2 = computed(() => themeStore.currentTheme.colors.borderDefault)
const wallpaperPatternColor3 = computed(() => themeStore.currentTheme.colors.borderStrong)

// Load wallpaper
onMounted(async () => {
  // Load desktop shortcuts from filesystem
  loadDesktopApps()
  // Arrange desktop icons after DOM is ready
  arrangeApps()

  try {
    await wallpaperService.init()
    const url = await wallpaperService.getCurrentWallpaper()
    if (url) customWallpaperUrl.value = url
  } catch {
    // Silently fail
  }

  // Listen for wallpaper changes
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.addEventListener('wallpaper-changed', async (event: any) => {
      try {
        const wallpaperId = event.detail?.wallpaperId
        if (wallpaperId) {
          const wallpaper = await wallpaperService.getWallpaper(wallpaperId)
          customWallpaperUrl.value = wallpaper?.dataUrl || null
        } else {
          customWallpaperUrl.value = null
        }
      } catch {
        // Silently fail
      }
    })

    window.addEventListener('app-catalog-changed', reloadDesktopApps)
    window.addEventListener('taskbar-pins-changed', reloadPinnedTools)

    // Add click outside listener
    document.addEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  // Remove click outside listener
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('app-catalog-changed', reloadDesktopApps)
  window.removeEventListener('taskbar-pins-changed', reloadPinnedTools)

  // Clean up drag states
  appDragStates.forEach((state) => state.stop())
  appDragStates.clear()
})
</script>

<style scoped>
/* Desktop screen uses CSS variables exclusively for theme support */
.desktop-screen {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background: var(--desktop-bg, #000000);
}

/* Grid overlay — visible only while dragging a desktop icon with snap enabled.
   Spacing matches getGridGap() in the script: small=110, medium=130, large=150.
   We use a CSS variable so the grid pitch tracks the icon size. */
.desktop-screen {
  --desktop-grid-pitch: 130px;
}
.desktop-screen.icon-size-large {
  --desktop-grid-pitch: 150px;
}
.desktop-screen.icon-size-small {
  --desktop-grid-pitch: 110px;
}

.desktop-screen--grid-visible::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  background-image:
    linear-gradient(
      to right,
      var(--gui-border-default, rgba(255, 255, 255, 0.18)) 1px,
      transparent 1px
    ),
    linear-gradient(
      to bottom,
      var(--gui-border-default, rgba(255, 255, 255, 0.18)) 1px,
      transparent 1px
    );
  background-size: var(--desktop-grid-pitch) var(--desktop-grid-pitch);
  background-position: 100px 98px;
  opacity: 0.85;
  animation: desktopGridFadeIn 160ms ease-out;
}

@keyframes desktopGridFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.85;
  }
}

/* Wallpaper */
.desktop-screen__wallpaper {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--desktop-bg, #000000);
  overflow: hidden;
}

.desktop-screen__wallpaper-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  opacity: 0.3;
  will-change: opacity;
  transform: translateZ(0);
}

.desktop-screen__wallpaper-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 30%, var(--gui-wallpaper-gradient1) 0%, transparent 60%),
    radial-gradient(ellipse at 30% 70%, var(--gui-wallpaper-gradient2) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, var(--gui-wallpaper-gradient3) 0%, transparent 40%);
}

.desktop-screen__wallpaper-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.3;
  pointer-events: none;
}

/* Desktop Icons */
.desktop-screen__icons {
  position: relative;
  z-index: 5;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.desktop-screen__icon {
  position: absolute;
  z-index: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  width: 100px;
  pointer-events: auto;
  cursor: move;
  -webkit-tap-highlight-color: transparent;
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform;
}

.desktop-screen__icon:hover {
  transform: translateY(-6px);
  z-index: 10;
}

.desktop-screen__icon.is-dragging {
  z-index: 100;
}

.desktop-screen__icon:active {
  transform: scale(0.9);
}

.desktop-screen__icon-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
}

.desktop-screen__icon-bg {
  position: relative;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  --icon-radius: var(--gui-radius-xl, 14px);
  border-radius: var(--icon-radius);
  color: var(--gui-text-inverse, #ffffff);
  /* background set by inline style from theme store */
  box-shadow: var(--gui-shadow-ios-card, 0 2px 12px rgba(0, 0, 0, 0.4));
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  isolation: isolate;
  clip-path: inset(0 round var(--icon-radius));
}

/* Frosted glass overlay effect on icons */
.desktop-screen__icon-bg::after {
  content: '';
  position: absolute;
  z-index: 2;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    transparent 50%,
    rgba(0, 0, 0, 0.1) 100%
  );
  border-radius: inherit;
  pointer-events: none;
}

:global(.light:not(.claude) .desktop-screen__icon-bg) {
  border: 1.5px solid #d1d1d6;
  background: #ffffff !important;
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.04),
    0 1px 4px rgba(0, 0, 0, 0.02);
}

:global(.light:not(.claude) .desktop-screen__icon-bg::after) {
  background: none !important;
}

:global(.light:not(.claude) .desktop-screen__icon-bg svg) {
  stroke: #1c1c1e !important;
}

:global(.light:not(.claude) .desktop-screen__icon-text) {
  color: #1c1c1e !important;
}

:global(.claude .desktop-screen__icon-bg) {
  border: 1.5px solid #d97757;
  background: #faf9f5 !important;
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.08),
    0 1px 4px rgba(0, 0, 0, 0.05);
}

:global(.claude .desktop-screen__icon-bg::after) {
  background: none !important;
}

:global(.claude .desktop-screen__icon-bg svg) {
  stroke: #d97757 !important;
}

:global(.claude .desktop-screen__icon-text) {
  color: #d97757 !important;
}

:global(.claude .desktop-screen__icon-mask) {
  background: #d97757 !important;
}

.desktop-screen__icon-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.desktop-screen__icon-bg svg {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: block;
  overflow: hidden;
  fill: none;
  stroke: var(--gui-text-inverse, #ffffff);
  shape-rendering: crispEdges;
}

/* SVG icon mask — icons rendered as mask-image for opaque fill */
.desktop-screen__icon-mask {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  background: var(--gui-text-inverse, #ffffff);
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}

.desktop-screen__icon-text {
  font-family: var(
    --gui-font-mono,
    'JetBrains Mono',
    'Cascadia Code',
    'Fira Code',
    'SF Mono',
    Consolas,
    monospace
  );
  font-size: 32px;
  font-weight: var(--gui-font-weight-bold, 700);
  color: var(--gui-text-inverse, #ffffff);
  letter-spacing: -1px;
  line-height: 1;
}

.desktop-screen__icon:hover .desktop-screen__icon-bg {
  box-shadow: var(--gui-shadow-lg, 0 16px 40px rgba(0, 0, 0, 0.6));
  transform: scale(1.1);
}

:global(.light:not(.claude) .desktop-screen__icon:hover .desktop-screen__icon-bg),
:global(.claude .desktop-screen__icon:hover .desktop-screen__icon-bg) {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.desktop-screen__icon:active .desktop-screen__icon-bg {
  transform: scale(0.95);
  box-shadow: var(--gui-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.3));
}

:global(.light:not(.claude) .desktop-screen__icon:active .desktop-screen__icon-bg),
:global(.claude .desktop-screen__icon:active .desktop-screen__icon-bg) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.desktop-screen__icon-label {
  width: 100%;
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #ffffff);
  text-align: center;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: var(--gui-backdrop-bg, rgba(0, 0, 0, 0.4));
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 4px 10px;
  border-radius: var(--gui-radius-base, 8px);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.08));
}

:global(.light:not(.claude) .desktop-screen__icon-label) {
  background: #ffffff !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  color: #000000 !important;
  font-weight: 600;
  transition: all var(--gui-transition-base, 200ms ease);
}

:global(.claude .desktop-screen__icon-label) {
  background: var(--gui-glass-bg-strong, rgba(250, 249, 245, 0.96)) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border: 1px solid var(--gui-border-default, rgba(31, 30, 29, 0.1)) !important;
  color: var(--gui-text-secondary, #4e4d49) !important;
  font-weight: 600;
  transition: all var(--gui-transition-base, 200ms ease);
}

.desktop-screen__icon:hover .desktop-screen__icon-label {
  background: var(--gui-backdrop-bg, rgba(0, 0, 0, 0.6));
  border-color: var(--gui-border-default, rgba(255, 255, 255, 0.12));
}

:global(.light:not(.claude) .desktop-screen__icon:hover .desktop-screen__icon-label) {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.15);
}

:global(.claude .desktop-screen__icon:hover .desktop-screen__icon-label) {
  background: var(--gui-bg-surface-raised, #ffffff);
  border-color: var(--gui-border-strong, rgba(31, 30, 29, 0.18));
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .desktop-screen__icon {
    width: 90px;
  }

  .desktop-screen__icon-bg {
    width: 64px;
    height: 64px;
    padding-top: 12px;
  }

  .desktop-screen__icon-bg svg {
    width: 28px;
    height: 28px;
  }

  .desktop-screen__icon-text {
    font-size: 28px;
  }

  .desktop-screen__icon-label {
    font-size: var(--gui-font-xs, 11px);
  }
}

@media (max-width: 768px) {
  .desktop-screen__icon {
    width: 80px;
  }

  .desktop-screen__icon-bg {
    width: 56px;
    height: 56px;
    padding-top: 10px;
  }

  .desktop-screen__icon-bg svg {
    width: 24px;
    height: 24px;
  }

  .desktop-screen__icon-text {
    font-size: 24px;
  }

  .desktop-screen__icon-label {
    font-size: var(--gui-font-xs, 11px);
  }
}

/* ── Icon Size Overrides ─────────────────────────────── */

/* Large icons */
.icon-size-large .desktop-screen__icon {
  width: 120px;
}

.icon-size-large .desktop-screen__icon-bg {
  width: 88px;
  height: 88px;
  --icon-radius: var(--gui-radius-2xl, 18px);
}

.icon-size-large .desktop-screen__icon-bg svg {
  width: 40px;
  height: 40px;
}

.icon-size-large .desktop-screen__icon-text {
  font-size: 40px;
}

.icon-size-large .desktop-screen__icon-label {
  font-size: var(--gui-font-base, 14px);
  padding: 5px 12px;
}

/* Small icons */
.icon-size-small .desktop-screen__icon {
  width: 80px;
}

.icon-size-small .desktop-screen__icon-bg {
  width: 56px;
  height: 56px;
  --icon-radius: var(--gui-radius-lg, 12px);
}

.icon-size-small .desktop-screen__icon-bg svg {
  width: 24px;
  height: 24px;
}

.icon-size-small .desktop-screen__icon-text {
  font-size: 24px;
}

.icon-size-small .desktop-screen__icon-label {
  font-size: var(--gui-font-xs, 11px);
  padding: 3px 8px;
}
</style>
