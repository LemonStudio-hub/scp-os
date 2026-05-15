<template>
  <SCPWindow :window-instance="windowInstance" @close="onClose">
    <div class="file-manager">
      <!-- Toolbar -->
      <div class="file-manager__toolbar">
        <div class="file-manager__toolbar-nav">
          <SCPButton
            variant="ghost"
            size="sm"
            icon="sidebar"
            title="Toggle sidebar"
            @click="fmStore.toggleSidebar"
          />
          <SCPButton
            variant="ghost"
            size="sm"
            icon="arrow-left"
            title="Go up"
            @click="fmStore.goUp"
          />
        </div>
        <div class="file-manager__toolbar-breadcrumb">
          <SCPBreadcrumbs :segments="fmStore.breadcrumbs" @navigate="fmStore.navigateTo" />
        </div>
        <div class="file-manager__toolbar-actions">
          <SCPButton
            variant="ghost"
            size="sm"
            icon="file"
            :title="t('fm.newFile')"
            @click="promptNewFile"
          />
          <SCPButton
            variant="ghost"
            size="sm"
            icon="folder"
            :title="t('fm.newFolder')"
            @click="promptNewFolder"
          />
          <input
            ref="fileInputRef"
            type="file"
            multiple
            style="display: none"
            @change="onFileUpload"
          />
          <SCPButton
            variant="ghost"
            size="sm"
            icon="document"
            :title="t('fm.upload')"
            @click="fileInputRef?.click()"
          />
          <div class="file-manager__toolbar-divider" />
          <SCPButton
            :variant="fmStore.viewMode === 'grid' ? 'primary' : 'ghost'"
            size="sm"
            icon="grid"
            title="Grid"
            @click="fmStore.setViewMode('grid')"
          />
          <SCPButton
            :variant="fmStore.viewMode === 'list' ? 'primary' : 'ghost'"
            size="sm"
            icon="list"
            title="List"
            @click="fmStore.setViewMode('list')"
          />
          <SCPButton
            :variant="fmStore.viewMode === 'column' ? 'primary' : 'ghost'"
            size="sm"
            icon="column"
            title="Column"
            @click="fmStore.setViewMode('column')"
          />
          <SCPButton
            :variant="fmStore.viewMode === 'detail' ? 'primary' : 'ghost'"
            size="sm"
            icon="detail"
            title="Detail"
            @click="fmStore.setViewMode('detail')"
          />
          <div class="file-manager__toolbar-divider" />
          <label class="file-manager__hidden-toggle">
            <input
              type="checkbox"
              :checked="fmStore.showHidden"
              @change="fmStore.toggleShowHidden"
            />
            <span>{{ t('fm.showHidden') || 'Hidden' }}</span>
          </label>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="file-manager__search">
        <SCPInput v-model="searchText" :placeholder="t('pc.searchFiles')" size="sm" clearable />
      </div>

      <!-- Main Content Area -->
      <div class="file-manager__body">
        <!-- Sidebar -->
        <div v-if="!fmStore.sidebarCollapsed" class="file-manager__sidebar">
          <!-- Quick Access -->
          <div class="file-manager__sidebar-section">
            <div class="file-manager__sidebar-title">Quick Access</div>
            <button
              v-for="item in fmStore.quickAccess"
              :key="item.path"
              class="file-manager__sidebar-item"
              :class="{ 'file-manager__sidebar-item--active': fmStore.currentPath === item.path }"
              @click="fmStore.navigateTo(item.path)"
            >
              <GUIIcon :name="item.icon as IconName" :size="14" />
              <span>{{ item.label }}</span>
            </button>
          </div>

          <!-- Favorites -->
          <div class="file-manager__sidebar-section">
            <div class="file-manager__sidebar-title">Favorites</div>
            <button
              v-for="path in fmStore.favorites"
              :key="path"
              class="file-manager__sidebar-item"
              :class="{ 'file-manager__sidebar-item--active': fmStore.currentPath === path }"
              @click="fmStore.navigateTo(path)"
            >
              <GUIIcon name="star" :size="14" />
              <span>{{ path.split('/').pop() || '/' }}</span>
            </button>
            <button
              class="file-manager__sidebar-item file-manager__sidebar-item--add"
              @click="addCurrentToFavorites"
            >
              <GUIIcon name="plus" :size="14" />
              <span>Add current</span>
            </button>
          </div>

          <!-- Directory Tree -->
          <div class="file-manager__sidebar-section file-manager__sidebar-section--tree">
            <div class="file-manager__sidebar-title">Directory Tree</div>
            <div class="file-manager__tree">
              <div class="file-manager__tree-node">
                <button
                  class="file-manager__tree-btn"
                  :class="{ 'file-manager__tree-btn--active': fmStore.currentPath === '/' }"
                  @click="fmStore.navigateTo('/')"
                >
                  <GUIIcon name="chevron-down" :size="12" />
                  <GUIIcon name="folder" :size="14" />
                  <span>/</span>
                </button>
                <div class="file-manager__tree-children">
                  <button
                    v-for="dir in rootDirs"
                    :key="dir.name"
                    class="file-manager__tree-btn file-manager__tree-btn--child"
                    :class="{
                      'file-manager__tree-btn--active': fmStore.currentPath === '/' + dir.name,
                    }"
                    @click="fmStore.navigateTo('/' + dir.name)"
                  >
                    <GUIIcon name="folder" :size="14" />
                    <span>{{ dir.name }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Area -->
        <div
          class="file-manager__content gui-scrollable"
          :class="{ 'file-manager__content--full': fmStore.sidebarCollapsed }"
          @contextmenu.prevent="onContextMenu($event)"
          @click="fmStore.clearSelection"
        >
          <!-- Grid View -->
          <div v-if="fmStore.viewMode === 'grid'" class="file-manager__grid stagger-children">
            <div
              v-for="file in fmStore.sortedFiles"
              :key="file.name"
              :class="[
                'file-grid-item',
                {
                  'file-grid-item--selected': fmStore.selectedFiles.has(file.name),
                  'file-grid-item--hidden': file.isHidden,
                },
              ]"
              @click.stop="onFileClick(file, $event)"
              @dblclick.stop="onFileDblClick(file)"
              @contextmenu.prevent.stop="onFileContextMenu($event, file.name)"
            >
              <SCPFileIcon
                :name="file.name"
                :is-directory="file.isDirectory"
                :size="32"
                size-class="lg"
              />
              <span class="file-grid-item__name">{{ file.name }}</span>
              <span class="file-grid-item__meta">
                {{ file.isDirectory ? t('fm.folder') : formatSize(file.size) }}
              </span>
            </div>
          </div>

          <!-- List View -->
          <table v-else-if="fmStore.viewMode === 'list'" class="file-manager__list">
            <thead>
              <tr>
                <th @click="fmStore.setSort('name')">{{ t('pc.name') }}</th>
                <th @click="fmStore.setSort('size')">{{ t('pc.size') }}</th>
                <th @click="fmStore.setSort('type')">{{ t('pc.type') }}</th>
                <th @click="fmStore.setSort('modifiedAt')">{{ t('pc.modified') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="file in fmStore.sortedFiles"
                :key="file.name"
                :class="{
                  'file-manager__list-row--selected': fmStore.selectedFiles.has(file.name),
                  'file-manager__list-row--hidden': file.isHidden,
                }"
                @click.stop="onFileClick(file, $event)"
                @dblclick.stop="onFileDblClick(file)"
                @contextmenu.prevent.stop="onFileContextMenu($event, file.name)"
              >
                <td>
                  <div class="file-list-name">
                    <SCPFileIcon
                      :name="file.name"
                      :is-directory="file.isDirectory"
                      :size="16"
                      size-class="sm"
                    />
                    <span>{{ file.name }}</span>
                  </div>
                </td>
                <td>{{ file.isDirectory ? '—' : formatSize(file.size) }}</td>
                <td>
                  {{
                    file.isDirectory
                      ? t('fm.folder')
                      : (file.type || t('common.file')).toUpperCase()
                  }}
                </td>
                <td>{{ formatDate(file.modifiedAt) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Column View -->
          <div v-else-if="fmStore.viewMode === 'column'" class="file-manager__columns">
            <div
              v-for="(col, colIdx) in fmStore.columns"
              :key="col.path"
              class="file-manager__column"
            >
              <div class="file-manager__column-header">
                {{ col.path === '/' ? '/' : col.path.split('/').pop() }}
              </div>
              <div class="file-manager__column-list">
                <button
                  v-for="file in col.files"
                  :key="file.name"
                  :class="[
                    'file-manager__column-item',
                    { 'file-manager__column-item--selected': col.selectedName === file.name },
                    { 'file-manager__column-item--hidden': file.isHidden },
                  ]"
                  @click="onColumnSelect(colIdx, file)"
                  @dblclick.stop="onFileDblClick(file)"
                  @contextmenu.prevent.stop="onFileContextMenu($event, file.name)"
                >
                  <SCPFileIcon
                    :name="file.name"
                    :is-directory="file.isDirectory"
                    :size="16"
                    size-class="sm"
                  />
                  <span class="file-manager__column-item-name">{{ file.name }}</span>
                  <GUIIcon
                    v-if="file.isDirectory"
                    name="chevron-right"
                    :size="12"
                    class="file-manager__column-item-arrow"
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- Detail View -->
          <div v-else-if="fmStore.viewMode === 'detail'" class="file-manager__detail">
            <div class="file-manager__detail-list">
              <table class="file-manager__list">
                <thead>
                  <tr>
                    <th @click="fmStore.setSort('name')">{{ t('pc.name') }}</th>
                    <th @click="fmStore.setSort('size')">{{ t('pc.size') }}</th>
                    <th @click="fmStore.setSort('type')">{{ t('pc.type') }}</th>
                    <th @click="fmStore.setSort('modifiedAt')">{{ t('pc.modified') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="file in fmStore.sortedFiles"
                    :key="file.name"
                    :class="{
                      'file-manager__list-row--selected': fmStore.selectedFiles.has(file.name),
                      'file-manager__list-row--hidden': file.isHidden,
                    }"
                    @click.stop="onDetailSelect(file)"
                    @dblclick.stop="onFileDblClick(file)"
                    @contextmenu.prevent.stop="onFileContextMenu($event, file.name)"
                  >
                    <td>
                      <div class="file-list-name">
                        <SCPFileIcon
                          :name="file.name"
                          :is-directory="file.isDirectory"
                          :size="16"
                          size-class="sm"
                        />
                        <span>{{ file.name }}</span>
                      </div>
                    </td>
                    <td>{{ file.isDirectory ? '—' : formatSize(file.size) }}</td>
                    <td>
                      {{
                        file.isDirectory
                          ? t('fm.folder')
                          : (file.type || t('common.file')).toUpperCase()
                      }}
                    </td>
                    <td>{{ formatDate(file.modifiedAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="fmStore.detailFile" class="file-manager__detail-panel">
              <div class="file-manager__detail-icon">
                <SCPFileIcon
                  :name="fmStore.detailFile.name"
                  :is-directory="fmStore.detailFile.isDirectory"
                  :size="48"
                  size-class="xl"
                />
              </div>
              <div class="file-manager__detail-name">{{ fmStore.detailFile.name }}</div>
              <div class="file-manager__detail-type">
                {{
                  fmStore.detailFile.isDirectory
                    ? 'Folder'
                    : (fmStore.detailFile.type || 'File').toUpperCase()
                }}
              </div>
              <div class="file-manager__detail-info">
                <div class="file-manager__detail-row">
                  <span class="file-manager__detail-label">Size</span>
                  <span>{{
                    fmStore.detailFile.isDirectory ? '—' : formatSize(fmStore.detailFile.size)
                  }}</span>
                </div>
                <div class="file-manager__detail-row">
                  <span class="file-manager__detail-label">Modified</span>
                  <span>{{ formatDate(fmStore.detailFile.modifiedAt) }}</span>
                </div>
                <div class="file-manager__detail-row">
                  <span class="file-manager__detail-label">Path</span>
                  <span class="file-manager__detail-path">{{ fmStore.detailFile.path }}</span>
                </div>
                <div class="file-manager__detail-row">
                  <span class="file-manager__detail-label">Permissions</span>
                  <span>
                    {{ fmStore.detailFile.permissions.read ? 'r' : '-'
                    }}{{ fmStore.detailFile.permissions.write ? 'w' : '-'
                    }}{{ fmStore.detailFile.permissions.execute ? 'x' : '-' }}
                  </span>
                </div>
              </div>
              <div v-if="detailPreview" class="file-manager__detail-preview">
                <div class="file-manager__detail-preview-label">Preview</div>
                <pre class="file-manager__detail-preview-content">{{ detailPreview }}</pre>
              </div>
            </div>
            <div v-else class="file-manager__detail-empty">
              <GUIIcon name="info" :size="32" />
              <p>Select a file to view details</p>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="fmStore.sortedFiles.length === 0" class="file-manager__empty">
            <GUIIcon name="empty-folder" :size="48" class="file-manager__empty-icon" />
            <p>{{ t('fm.emptyFolder') }}</p>
          </div>
        </div>
      </div>

      <!-- Status Bar -->
      <SCPStatusBar
        :left-items="[t('pc.items', { n: fmStore.sortedFiles.length })]"
        :right-items="[fmStore.currentPath]"
      />
    </div>

    <!-- Context Menu -->
    <SCPContextMenu
      v-model:visible="fmStore.contextMenu.visible"
      :x="fmStore.contextMenu.x"
      :y="fmStore.contextMenu.y"
      :items="fmStore.contextMenu.items"
      @select="onContextSelect"
    />

    <!-- Dialog Modal -->
    <DialogModal
      v-model:visible="dialogVisible"
      :type="dialogType"
      :title="dialogTitle"
      :placeholder="dialogPlaceholder"
      :default-value="dialogDefaultValue"
      :confirm-text="dialogConfirmText"
      :message="dialogMessage"
      :danger="dialogDanger"
      @confirm="onDialogConfirm"
      @cancel="onDialogCancel"
    />
  </SCPWindow>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import SCPWindow from '../../components/SCPWindow.vue'
import SCPButton from '../../components/ui/SCPButton.vue'
import GUIIcon from '../../components/ui/GUIIcon.vue'
import SCPInput from '../../components/ui/SCPInput.vue'
import SCPBreadcrumbs from '../../components/ui/SCPBreadcrumbs.vue'
import SCPFileIcon from '../../components/ui/SCPFileIcon.vue'
import SCPContextMenu from '../../components/ui/SCPContextMenu.vue'
import SCPStatusBar from '../../components/ui/SCPStatusBar.vue'
import DialogModal from './DialogModal.vue'
import { useFileManagerStore, setI18n as setFileManagerI18n } from '../../stores/fileManager'
import { useWindowManagerStore } from '../../stores/windowManager'
import type { WindowInstance, FileItem, ContextMenuItem } from '../../types'
import type { IconName } from '../../icons'
import type { ToolType } from '../../types'
import { filesystem } from '../../../utils/filesystem'
import { parseDesktopFile } from '../../../utils/desktopShortcut'

interface Props {
  windowInstance: WindowInstance
}

defineProps<Props>()

const { t } = useI18n()
setFileManagerI18n({ t })
const fmStore = useFileManagerStore()
const wmStore = useWindowManagerStore()
const searchText = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

// Dialog state
const dialogVisible = ref(false)
const dialogType = ref<'input' | 'confirm'>('input')
const dialogTitle = ref('')
const dialogPlaceholder = ref('')
const dialogDefaultValue = ref('')
const dialogConfirmText = ref('')
const dialogMessage = ref('')
const dialogDanger = ref(false)
let dialogResolve: Function | null = null
const contextTargetFile = ref<string>('')

// File type helpers
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico']
const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a']
const VIDEO_EXTS = ['mp4', 'webm', 'avi', 'mov', 'mkv']

// Root directories for tree
const rootDirs = computed(() => {
  return fmStore.files.filter((f) => f.isDirectory && !f.isHidden)
})

// Detail preview
const detailPreview = computed(() => {
  const file = fmStore.detailFile
  if (!file || file.isDirectory) return null
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const textExts = [
    'txt',
    'md',
    'log',
    'json',
    'xml',
    'yml',
    'yaml',
    'js',
    'ts',
    'css',
    'html',
    'vue',
    'py',
    'sh',
    'desktop',
  ]
  if (textExts.includes(ext)) {
    const content = fmStore.readFileContent(file.name)
    if (content) {
      return content.slice(0, 500) + (content.length > 500 ? '\n...' : '')
    }
  }
  return null
})

watch(searchText, (val) => {
  fmStore.setSearch(val)
})

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function onFileClick(file: FileItem, event: MouseEvent): void {
  if (event.ctrlKey || event.metaKey) {
    fmStore.toggleSelect(file.name)
  } else {
    fmStore.clearSelection()
    fmStore.toggleSelect(file.name)
  }
}

function onFileDblClick(file: FileItem): void {
  if (file.isDirectory) {
    fmStore.navigateTo(file.path)
  } else {
    openFile(file)
  }
}

function onColumnSelect(colIdx: number, file: FileItem): void {
  fmStore.selectInColumn(colIdx, file.name)
  if (!file.isDirectory) {
    fmStore.setDetailFile(file)
  }
}

function onDetailSelect(file: FileItem): void {
  fmStore.clearSelection()
  fmStore.toggleSelect(file.name)
  fmStore.setDetailFile(file)
}

function openInEditor(file: FileItem): void {
  const existingEditor = wmStore.getWindowByTool('editor')
  if (existingEditor) {
    wmStore.focusWindow(existingEditor.config.id)
    return
  }

  wmStore.openWindow({
    id: `editor-${Date.now()}`,
    tool: 'editor',
    title: file.name,
    iconName: 'edit',
    width: 700,
    height: 450,
    data: { filePath: file.path },
  })
}

function onContextMenu(event: MouseEvent): void {
  fmStore.showContextMenu(event.clientX, event.clientY)
}

function onFileContextMenu(event: MouseEvent, fileName: string): void {
  contextTargetFile.value = fileName
  fmStore.showContextMenu(event.clientX, event.clientY, fileName)
}

function onContextSelect(item: ContextMenuItem): void {
  switch (item.id) {
    case 'new-file':
      promptNewFile()
      break
    case 'new-folder':
      promptNewFolder()
      break
    case 'rename':
      if (contextTargetFile.value) promptRename(contextTargetFile.value)
      break
    case 'delete':
      if (contextTargetFile.value) promptDelete(contextTargetFile.value)
      break
    case 'refresh':
      fmStore.loadDirectory()
      break
    default:
      item.action?.()
  }
}

function onClose(): void {
  // Window manager handles cleanup
}

function addCurrentToFavorites(): void {
  fmStore.addToFavorites(fmStore.currentPath)
}

// ── Dialog helpers ──────────────────────────────────────────────────

function showInputDialog(opts: {
  title: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
}): Promise<string | null> {
  return new Promise((resolve) => {
    dialogType.value = 'input'
    dialogTitle.value = opts.title
    dialogPlaceholder.value = opts.placeholder || ''
    dialogDefaultValue.value = opts.defaultValue || ''
    dialogConfirmText.value = opts.confirmText || t('common.confirm')
    dialogMessage.value = ''
    dialogDanger.value = false
    dialogResolve = resolve
    dialogVisible.value = true
  })
}

function showConfirmDialog(opts: {
  title: string
  message: string
  confirmText?: string
  danger?: boolean
}): Promise<boolean> {
  return new Promise((resolve) => {
    dialogType.value = 'confirm'
    dialogTitle.value = opts.title
    dialogMessage.value = opts.message
    dialogConfirmText.value = opts.confirmText || t('common.confirm')
    dialogDanger.value = opts.danger || false
    dialogResolve = (val: string | true | null) => resolve(val === true)
    dialogVisible.value = true
  })
}

function onDialogConfirm(value: string | true): void {
  dialogVisible.value = false
  dialogResolve?.(value)
  dialogResolve = null
}

function onDialogCancel(): void {
  dialogVisible.value = false
  dialogResolve?.(null)
  dialogResolve = null
}

// ── File operations with dialog ─────────────────────────────────────

async function promptNewFile(): Promise<void> {
  const name = await showInputDialog({
    title: t('fm.newFile'),
    placeholder: t('fm.enterFileName'),
    defaultValue: t('fm.untitled'),
    confirmText: t('fm.create'),
  })
  if (name) {
    const path = fmStore.currentPath === '/' ? '/' + name : fmStore.currentPath + '/' + name
    filesystem.createFile(path, '')
    fmStore.loadDirectory()
  }
}

async function promptNewFolder(): Promise<void> {
  const name = await showInputDialog({
    title: t('fm.newFolder'),
    placeholder: t('fm.enterFolderName'),
    defaultValue: t('fm.newFolderDefault'),
    confirmText: t('fm.create'),
  })
  if (name) {
    const path = fmStore.currentPath === '/' ? '/' + name : fmStore.currentPath + '/' + name
    filesystem.createDirectory(path)
    fmStore.loadDirectory()
  }
}

async function promptRename(fileName: string): Promise<void> {
  const newName = await showInputDialog({
    title: t('fm.rename'),
    placeholder: t('fm.enterNewName'),
    defaultValue: fileName,
    confirmText: t('fm.rename'),
  })
  if (newName && newName !== fileName) {
    fmStore.renameFile(fileName, newName)
  }
}

async function promptDelete(fileName: string): Promise<void> {
  const confirmed = await showConfirmDialog({
    title: t('fm.delete'),
    message: t('fm.confirmDelete', { name: fileName }),
    confirmText: t('fm.delete'),
    danger: true,
  })
  if (confirmed) {
    fmStore.deleteFile(fileName)
  }
}

// Use these functions to silence TS6133 warnings
promptRename
promptDelete

// ── File upload ─────────────────────────────────────────────────────

async function onFileUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  let successCount = 0
  let failCount = 0

  for (const file of files) {
    const path =
      fmStore.currentPath === '/' ? '/' + file.name : fmStore.currentPath + '/' + file.name
    try {
      const content = await readFileAsLocal(file)
      const existingNode = filesystem.getNodeByPath(path)
      if (existingNode && existingNode.type === 'file') {
        filesystem.writeFile(path, content)
      } else {
        filesystem.createFile(path, content)
      }
      successCount++
    } catch (error) {
      console.error('[FileManager] Failed to store file locally:', error)
      failCount++
    }
  }

  fmStore.loadDirectory()
  input.value = ''

  if (failCount > 0) {
    alert(`Stored ${successCount} file(s) locally, ${failCount} failed.`)
  }
}

function readFileAsLocal(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (
      file.type.startsWith('text/') ||
      /\.(txt|md|json|js|ts|css|html|vue|py|sh|xml|yaml|yml|sql|log|csv|tsv)$/i.test(file.name)
    ) {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    } else {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    }
  })
}

// ── File open with type detection ───────────────────────────────────

function openFile(file: FileItem): void {
  if (file.isDirectory) {
    fmStore.navigateTo(file.path)
    return
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || ''

  if (ext === 'desktop') {
    const content = filesystem.readFile(file.path)
    if (content) {
      const shortcut = parseDesktopFile(content)
      if (shortcut) {
        const wmStore = useWindowManagerStore()
        wmStore.openWindow({
          id: `${shortcut.tool}-${Date.now()}`,
          tool: shortcut.tool as ToolType,
          title: shortcut.name,
        })
        return
      }
    }
  }

  if (IMAGE_EXTS.includes(ext)) {
    openImage(file)
  } else if (VIDEO_EXTS.includes(ext)) {
    openVideo(file)
  } else if (AUDIO_EXTS.includes(ext)) {
    openAudio(file)
  } else {
    openInEditor(file)
  }
}

function openImage(file: FileItem): void {
  const data = filesystem.readFile(file.path)
  if (typeof data === 'string' && (data.startsWith('http') || data.startsWith('data:'))) {
    window.open(data, '_blank')
  } else {
    openInEditor(file)
  }
}

function openVideo(file: FileItem): void {
  const data = filesystem.readFile(file.path)
  if (typeof data === 'string' && (data.startsWith('http') || data.startsWith('data:'))) {
    window.open(data, '_blank')
  } else {
    openInEditor(file)
  }
}

function openAudio(file: FileItem): void {
  const data = filesystem.readFile(file.path)
  if (typeof data === 'string' && (data.startsWith('http') || data.startsWith('data:'))) {
    window.open(data, '_blank')
  } else {
    openInEditor(file)
  }
}
</script>

<style scoped>
/* ── Layout ────────────────────────────────────────────────────────── */
.file-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #060606);
}

/* ── Toolbar ───────────────────────────────────────────────────────── */
.file-manager__toolbar {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  background: var(--gui-bg-surface, #0c0c0c);
}

.file-manager__toolbar-nav {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xxs, 2px);
  flex-shrink: 0;
}

.file-manager__toolbar-breadcrumb {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.file-manager__toolbar-actions {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xxs, 2px);
  flex-shrink: 0;
}

.file-manager__toolbar-divider {
  width: 1px;
  height: 16px;
  background: var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  margin: 0 var(--gui-spacing-xs, 4px);
}

.file-manager__hidden-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-tertiary, #6a6a6a);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: var(--gui-radius-sm, 4px);
  transition: background var(--gui-transition-fast, 120ms ease);
}

.file-manager__hidden-toggle:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.04));
}

.file-manager__hidden-toggle input {
  width: 12px;
  height: 12px;
  accent-color: var(--gui-accent, #e94560);
}

/* ── Search ────────────────────────────────────────────────────────── */
.file-manager__search {
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

/* ── Body ──────────────────────────────────────────────────────────── */
.file-manager__body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ── Sidebar ───────────────────────────────────────────────────────── */
.file-manager__sidebar {
  width: 200px;
  min-width: 200px;
  border-right: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  background: var(--gui-bg-surface, #0c0c0c);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.file-manager__sidebar-section {
  padding: var(--gui-spacing-sm, 8px) 0;
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.03));
}

.file-manager__sidebar-section--tree {
  flex: 1;
  overflow-y: auto;
}

.file-manager__sidebar-title {
  font-size: var(--gui-font-xs, 10px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-tertiary, #6a6a6a);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 var(--gui-spacing-sm, 8px) var(--gui-spacing-xs, 4px);
}

.file-manager__sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  width: 100%;
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  background: none;
  border: none;
  color: var(--gui-text-secondary, #a8a8a8);
  font-size: var(--gui-font-xs, 11px);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
  text-align: left;
}

.file-manager__sidebar-item:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.04));
  color: var(--gui-text-primary, #f0f0f0);
}

.file-manager__sidebar-item--active {
  background: var(--gui-accent-soft, rgba(233, 69, 96, 0.1));
  color: var(--gui-accent, #e94560);
}

.file-manager__sidebar-item--add {
  color: var(--gui-text-tertiary, #6a6a6a);
  font-style: italic;
}

/* ── Directory Tree ────────────────────────────────────────────────── */
.file-manager__tree {
  padding: 0 var(--gui-spacing-xs, 4px);
}

.file-manager__tree-node {
  display: flex;
  flex-direction: column;
}

.file-manager__tree-btn {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xxs, 2px);
  width: 100%;
  padding: 3px var(--gui-spacing-xs, 4px);
  background: none;
  border: none;
  color: var(--gui-text-secondary, #a8a8a8);
  font-size: var(--gui-font-xs, 11px);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
  text-align: left;
  border-radius: var(--gui-radius-sm, 4px);
}

.file-manager__tree-btn:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.04));
  color: var(--gui-text-primary, #f0f0f0);
}

.file-manager__tree-btn--active {
  background: var(--gui-accent-soft, rgba(233, 69, 96, 0.1));
  color: var(--gui-accent, #e94560);
}

.file-manager__tree-btn--child {
  padding-left: calc(var(--gui-spacing-xs, 4px) + 16px);
}

.file-manager__tree-children {
  display: flex;
  flex-direction: column;
}

/* ── Content ───────────────────────────────────────────────────────── */
.file-manager__content {
  flex: 1;
  overflow: auto;
  padding: var(--gui-spacing-base, 16px);
  position: relative;
}

.file-manager__content--full {
  width: 100%;
}

/* ── Grid View ─────────────────────────────────────────────────────── */
.file-manager__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: var(--gui-spacing-sm, 8px);
}

.file-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  padding: var(--gui-spacing-md, 12px) var(--gui-spacing-sm, 8px);
  border-radius: var(--gui-radius-base, 8px);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms cubic-bezier(0.4, 0, 0.2, 1));
  text-align: center;
}

.file-grid-item:hover {
  background: var(--gui-file-hover, rgba(255, 255, 255, 0.04));
}

.file-grid-item--selected {
  background: var(--gui-file-selected, rgba(233, 69, 96, 0.08));
  outline: 1.5px solid var(--gui-accent, #e94560);
  outline-offset: -1px;
}

.file-grid-item--hidden {
  opacity: 0.45;
}

.file-grid-item--hidden:hover {
  opacity: 0.7;
}

.file-grid-item__name {
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-primary, #f0f0f0);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-grid-item__meta {
  font-size: 10px;
  color: var(--gui-text-tertiary, #6a6a6a);
}

/* ── List View ─────────────────────────────────────────────────────── */
.file-manager__list {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--gui-font-sm, 12px);
}

.file-manager__list th {
  text-align: left;
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-md, 12px);
  background: var(--gui-bg-surface, #0c0c0c);
  color: var(--gui-text-tertiary, #6a6a6a);
  font-weight: var(--gui-font-weight-semibold, 600);
  font-size: var(--gui-font-xs, 11px);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  cursor: pointer;
  user-select: none;
  transition: color var(--gui-transition-fast, 120ms ease);
  position: sticky;
  top: 0;
  z-index: 1;
}

.file-manager__list th:hover {
  color: var(--gui-text-primary, #f0f0f0);
}

.file-manager__list tr {
  transition: background var(--gui-transition-fast, 120ms ease);
}

.file-manager__list-row--selected {
  background: var(--gui-file-selected, rgba(233, 69, 96, 0.08));
}

.file-manager__list-row--hidden {
  opacity: 0.45;
}

.file-manager__list-row--hidden:hover {
  opacity: 0.7;
}

.file-manager__list td {
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-md, 12px);
  color: var(--gui-text-primary, #f0f0f0);
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.03));
}

.file-list-name {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
}

/* ── Column View ───────────────────────────────────────────────────── */
.file-manager__columns {
  display: flex;
  height: 100%;
  gap: 1px;
  background: var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.file-manager__column {
  min-width: 180px;
  max-width: 300px;
  flex: 1;
  background: var(--gui-bg-base, #060606);
  display: flex;
  flex-direction: column;
}

.file-manager__column-header {
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-tertiary, #6a6a6a);
  background: var(--gui-bg-surface, #0c0c0c);
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.file-manager__column-list {
  flex: 1;
  overflow-y: auto;
}

.file-manager__column-item {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  width: 100%;
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  background: none;
  border: none;
  color: var(--gui-text-primary, #f0f0f0);
  font-size: var(--gui-font-xs, 11px);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
  text-align: left;
}

.file-manager__column-item:hover {
  background: var(--gui-file-hover, rgba(255, 255, 255, 0.04));
}

.file-manager__column-item--selected {
  background: var(--gui-accent-soft, rgba(233, 69, 96, 0.1));
  color: var(--gui-accent, #e94560);
}

.file-manager__column-item--hidden {
  opacity: 0.45;
}

.file-manager__column-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-manager__column-item-arrow {
  color: var(--gui-text-tertiary, #6a6a6a);
  flex-shrink: 0;
}

/* ── Detail View ───────────────────────────────────────────────────── */
.file-manager__detail {
  display: flex;
  height: 100%;
  gap: 1px;
  background: var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.file-manager__detail-list {
  flex: 1;
  overflow: auto;
  background: var(--gui-bg-base, #060606);
}

.file-manager__detail-panel {
  width: 240px;
  min-width: 240px;
  background: var(--gui-bg-surface, #0c0c0c);
  padding: var(--gui-spacing-base, 16px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
}

.file-manager__detail-icon {
  padding: var(--gui-spacing-md, 12px) 0;
}

.file-manager__detail-name {
  font-size: var(--gui-font-sm, 13px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-primary, #f0f0f0);
  text-align: center;
  word-break: break-all;
}

.file-manager__detail-type {
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-tertiary, #6a6a6a);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.file-manager__detail-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--gui-spacing-xs, 4px);
  padding-top: var(--gui-spacing-sm, 8px);
  border-top: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.file-manager__detail-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-secondary, #a8a8a8);
  padding: 2px 0;
}

.file-manager__detail-label {
  color: var(--gui-text-tertiary, #6a6a6a);
  flex-shrink: 0;
}

.file-manager__detail-path {
  font-family: var(--gui-font-mono, monospace);
  font-size: 10px;
  color: var(--gui-text-tertiary, #6a6a6a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

.file-manager__detail-preview {
  width: 100%;
  padding-top: var(--gui-spacing-sm, 8px);
  border-top: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.file-manager__detail-preview-label {
  font-size: var(--gui-font-xs, 10px);
  color: var(--gui-text-tertiary, #6a6a6a);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--gui-spacing-xs, 4px);
}

.file-manager__detail-preview-content {
  font-family: var(--gui-font-mono, monospace);
  font-size: 10px;
  color: var(--gui-text-secondary, #a8a8a8);
  background: var(--gui-bg-base, #060606);
  padding: var(--gui-spacing-sm, 8px);
  border-radius: var(--gui-radius-sm, 4px);
  overflow: auto;
  max-height: 200px;
  white-space: pre-wrap;
  word-break: break-all;
}

.file-manager__detail-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--gui-spacing-sm, 8px);
  color: var(--gui-text-tertiary, #6a6a6a);
  font-size: var(--gui-font-sm, 12px);
  background: var(--gui-bg-surface, #0c0c0c);
}

/* ── Empty State ───────────────────────────────────────────────────── */
.file-manager__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--gui-spacing-3xl, 48px) var(--gui-spacing-xl, 24px);
  color: var(--gui-text-tertiary, #6a6a6a);
  font-size: var(--gui-font-sm, 12px);
  text-align: center;
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.file-manager__empty-icon {
  font-size: 48px;
  margin-bottom: var(--gui-spacing-base, 16px);
  opacity: 0.5;
}

/* ── Mobile ─────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .file-manager__sidebar {
    display: none;
  }

  .file-manager__grid {
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: var(--gui-spacing-xs, 4px);
  }

  .file-manager__content {
    padding: var(--gui-spacing-sm, 8px);
  }

  .file-manager__toolbar-breadcrumb {
    display: none;
  }
}
</style>
