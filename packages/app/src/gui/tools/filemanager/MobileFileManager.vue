<template>
  <MobileWindow
    :visible="visible"
    :title="currentFolderName"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="mobile-file-manager">
      <!-- Breadcrumb + Actions Bar -->
      <div class="mobile-file-manager__header">
        <!-- Breadcrumbs -->
        <div class="mobile-file-manager__breadcrumbs" @click="onBreadcrumbClick">
          <button
            v-for="(seg, i) in breadcrumbSegments"
            :key="i"
            class="mobile-file-manager__breadcrumb-btn"
            :data-index="i"
          >
            <span>{{ seg.label }}</span>
            <svg v-if="i < breadcrumbSegments.length - 1" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <!-- More actions button -->
        <button class="mobile-file-manager__more-btn" @click="onMoreActions">
          <GUIIcon name="settings" :size="18" />
        </button>
      </div>

      <!-- File List -->
      <div
        ref="listRef"
        class="mobile-file-manager__list"
        @contextmenu.prevent="onListContextMenu"
      >
        <!-- Files and folders -->
        <button
          v-for="file in fmStore.sortedFiles"
          :key="file.name"
          class="mobile-file-manager__row"
          :class="{ 'mobile-file-manager__row--pressed': pressedFile === file.name }"
          @click="onFileTap(file)"
          @touchstart.passive="onTouchStart(file)"
          @touchend.passive="onTouchEnd(file)"
          @touchmove.passive="onTouchMove"
        >
          <SCPFileIcon :name="file.name" :is-directory="file.isDirectory" :size="22" />
          <span class="mobile-file-manager__row-label">{{ file.name }}</span>
          <span class="mobile-file-manager__row-meta">{{ file.isDirectory ? '—' : formatSize(file.size) }}</span>
          <svg class="mobile-file-manager__chevron" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3L9 7L5 11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- Empty state with long-press hint -->
        <div v-if="fmStore.sortedFiles.length === 0" class="mobile-file-manager__empty">
          <GUIIcon name="empty-folder" :size="56" />
          <p class="mobile-file-manager__empty-title">This folder is empty</p>
          <p class="mobile-file-manager__empty-hint">
            Long press to create new files or folders
          </p>
          <div class="mobile-file-manager__empty-actions">
            <button class="mobile-file-manager__empty-btn" @click="fmStore.promptNewFile">
              <GUIIcon name="file" :size="16" /> New File
            </button>
            <button class="mobile-file-manager__empty-btn" @click="fmStore.promptNewFolder">
              <GUIIcon name="folder" :size="16" /> New Folder
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Context Menu Bottom Sheet -->
    <MobileBottomSheet
      v-model:visible="contextSheetVisible"
      :title="contextSheetTitle"
      swipe-to-dismiss
    >
      <div class="mobile-file-manager__context">
        <button
          v-for="action in contextActions"
          :key="action.id"
          :class="['mobile-file-manager__context-item', { 'mobile-file-manager__context-item--danger': action.danger }]"
          @click="action.fn"
        >
          <GUIIcon :name="action.icon" :size="18" class="mobile-file-manager__context-icon" />
          <span class="mobile-file-manager__context-label">{{ action.label }}</span>
        </button>
      </div>
    </MobileBottomSheet>

    <!-- Rename Dialog -->
    <MobileBottomSheet
      v-model:visible="renameSheetVisible"
      title="Rename"
      swipe-to-dismiss
    >
      <div class="mobile-file-manager__rename">
        <input
          v-model="renameInput"
          ref="renameInputRef"
          type="text"
          class="mobile-file-manager__rename-input"
          placeholder="Enter new name"
          @keydown.enter="confirmRename"
        />
        <div class="mobile-file-manager__rename-actions">
          <button class="mobile-file-manager__rename-btn" @click="renameSheetVisible = false">Cancel</button>
          <button class="mobile-file-manager__rename-btn mobile-file-manager__rename-btn--primary" @click="confirmRename">Rename</button>
        </div>
      </div>
    </MobileBottomSheet>

    <!-- File Details Sheet -->
    <MobileBottomSheet
      v-model:visible="detailsSheetVisible"
      :title="detailsSheetTitle"
      swipe-to-dismiss
    >
      <div class="mobile-file-manager__details">
        <div class="mobile-file-manager__detail-row">
          <span class="mobile-file-manager__detail-label">Type</span>
          <span class="mobile-file-manager__detail-value">{{ detailsSheetType }}</span>
        </div>
        <div class="mobile-file-manager__detail-row">
          <span class="mobile-file-manager__detail-label">Size</span>
          <span class="mobile-file-manager__detail-value">{{ detailsSheetSize }}</span>
        </div>
        <div class="mobile-file-manager__detail-row">
          <span class="mobile-file-manager__detail-label">Modified</span>
          <span class="mobile-file-manager__detail-value">{{ detailsSheetModified }}</span>
        </div>
        <div class="mobile-file-manager__detail-row">
          <span class="mobile-file-manager__detail-label">Path</span>
          <span class="mobile-file-manager__detail-value mobile-file-manager__detail-path">{{ detailsSheetPath }}</span>
        </div>
      </div>
    </MobileBottomSheet>
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
import MobileBottomSheet from '../../components/MobileBottomSheet.vue'
import SCPFileIcon from '../../components/ui/SCPFileIcon.vue'
import GUIIcon from '../../components/ui/GUIIcon.vue'
import { useFileManagerStore } from '../../stores/fileManager'
import type { FileItem } from '../../types'
import type { IconName } from '../../icons'

interface Props {
  visible: boolean
}

interface ContextAction {
  id: string
  label: string
  icon: IconName
  danger?: boolean
  fn: () => void
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

const fmStore = useFileManagerStore()
const listRef = ref<HTMLDivElement | null>(null)
const pressedFile = ref<string | null>(null)

// Context sheets
const contextSheetVisible = ref(false)
const contextSheetTitle = ref('')
const contextActions = ref<ContextAction[]>([])

// Rename sheet
const renameSheetVisible = ref(false)
const renameInput = ref('')
const renameTargetFile = ref<FileItem | null>(null)
const renameInputRef = ref<HTMLInputElement | null>(null)

// Details sheet
const detailsSheetVisible = ref(false)
const detailsSheetTitle = ref('')
const detailsSheetType = ref('')
const detailsSheetSize = ref('')
const detailsSheetModified = ref('')
const detailsSheetPath = ref('')

// Long press state
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let isTouchMoving = false

// Breadcrumbs
const breadcrumbSegments = computed(() => {
  const path = fmStore.currentPath
  if (path === '/') return [{ label: 'Root', path: '/' }]
  const segments = path.split('/').filter(Boolean)
  return [
    { label: 'Root', path: '/' },
    ...segments.map((seg, i) => ({
      label: seg,
      path: '/' + segments.slice(0, i + 1).join('/'),
    })),
  ]
})

const currentFolderName = computed(() => {
  const segs = breadcrumbSegments.value
  return segs[segs.length - 1]?.label || 'Files'
})

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function onFileTap(file: FileItem): void {
  if (file.isDirectory) {
    fmStore.navigateTo(file.path)
  } else {
    // Open file in editor or show content
    openFile(file)
  }
}

function onTouchStart(file: FileItem): void {
  isTouchMoving = false
  longPressTimer = setTimeout(() => {
    if (!isTouchMoving) {
      onLongPress(file)
    }
  }, 500)
}

function onTouchEnd(_file: FileItem): void {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  setTimeout(() => {
    pressedFile.value = null
  }, 150)
}

function onTouchMove(): void {
  isTouchMoving = true
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function onLongPress(file: FileItem): void {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  pressedFile.value = file.name

  const actions: ContextAction[] = [
    { id: 'open', label: 'Open', icon: 'file', fn: () => { contextSheetVisible.value = false; openFile(file) } },
    { id: 'details', label: 'Details', icon: 'settings', fn: () => { contextSheetVisible.value = false; showDetails(file) } },
    { id: 'rename', label: 'Rename', icon: 'edit', fn: () => { contextSheetVisible.value = false; promptRename(file) } },
  ]

  if (!file.isDirectory) {
    actions.splice(1, 0, { id: 'read', label: 'Read Content', icon: 'list', fn: () => { contextSheetVisible.value = false; readFileContent(file) } })
  }

  actions.push({ id: 'delete', label: 'Delete', icon: 'trash', danger: true, fn: () => { contextSheetVisible.value = false; deleteFile(file) } })

  contextSheetTitle.value = file.name
  contextActions.value = actions
  contextSheetVisible.value = true
}

function onListContextMenu(_event: MouseEvent): void {
  // Long press on empty area shows create menu
  if (fmStore.sortedFiles.length === 0) {
    contextSheetTitle.value = 'Create New'
    contextActions.value = [
      { id: 'new-file', label: 'New File', icon: 'file', fn: () => { contextSheetVisible.value = false; fmStore.promptNewFile() } },
      { id: 'new-folder', label: 'New Folder', icon: 'folder', fn: () => { contextSheetVisible.value = false; fmStore.promptNewFolder() } },
      { id: 'refresh', label: 'Refresh', icon: 'refresh', fn: () => { contextSheetVisible.value = false; fmStore.loadDirectory() } },
    ]
    contextSheetVisible.value = true
  }
}

function onMoreActions(): void {
  contextSheetTitle.value = 'Actions'
  contextActions.value = [
    { id: 'new-file', label: 'New File', icon: 'file', fn: () => { contextSheetVisible.value = false; fmStore.promptNewFile() } },
    { id: 'new-folder', label: 'New Folder', icon: 'folder', fn: () => { contextSheetVisible.value = false; fmStore.promptNewFolder() } },
    { id: 'refresh', label: 'Refresh', icon: 'refresh', fn: () => { contextSheetVisible.value = false; fmStore.loadDirectory() } },
  ]
  contextSheetVisible.value = true
}

function onBreadcrumbClick(event: MouseEvent): void {
  const btn = (event.target as HTMLElement).closest('.mobile-file-manager__breadcrumb-btn')
  if (!btn) return
  const index = parseInt(btn.getAttribute('data-index') || '0', 10)
  const seg = breadcrumbSegments.value[index]
  if (seg) {
    fmStore.navigateTo(seg.path)
  }
}

function openFile(file: FileItem): void {
  if (file.isDirectory) {
    fmStore.navigateTo(file.path)
  } else {
    readFileContent(file)
  }
}

function readFileContent(file: FileItem): void {
  const content = fmStore.readFileContent(file.name)
  if (content !== null) {
    alert(`Content of ${file.name}:\n\n${content.substring(0, 2000)}${content.length > 2000 ? '\n\n... (truncated)' : ''}`)
  } else {
    alert(`Cannot read ${file.name}`)
  }
}

function deleteFile(file: FileItem): void {
  fmStore.toggleSelect(file.name)
  fmStore.deleteSelected()
}

function promptRename(file: FileItem): void {
  renameTargetFile.value = file
  renameInput.value = file.name
  renameSheetVisible.value = true
  // Focus input after sheet animation
  setTimeout(() => {
    renameInputRef.value?.focus()
    renameInputRef.value?.select()
  }, 300)
}

function confirmRename(): void {
  if (renameTargetFile.value && renameInput.value.trim() && renameInput.value !== renameTargetFile.value.name) {
    fmStore.renameFile(renameTargetFile.value.name, renameInput.value.trim())
  }
  renameSheetVisible.value = false
  renameTargetFile.value = null
}

function showDetails(file: FileItem): void {
  detailsSheetTitle.value = file.name
  detailsSheetType.value = file.isDirectory ? 'Folder' : `${(file.name.split('.').pop() || 'File').toUpperCase()} File`
  detailsSheetSize.value = file.isDirectory ? '—' : formatSize(file.size)
  detailsSheetModified.value = formatDate(file.modifiedAt)
  detailsSheetPath.value = file.path
  detailsSheetVisible.value = true
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────── */
.mobile-file-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #060606);
}

/* ── Header ─────────────────────────────────────────────────────────── */
.mobile-file-manager__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-base, 16px);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  background: var(--gui-bg-surface, #0c0c0c);
}

.mobile-file-manager__breadcrumbs {
  display: flex;
  align-items: center;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
  flex: 1;
  min-width: 0;
}

.mobile-file-manager__breadcrumbs::-webkit-scrollbar {
  display: none;
}

.mobile-file-manager__breadcrumb-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  color: var(--gui-text-secondary, #a0a0a0);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  cursor: pointer;
  padding: var(--gui-spacing-xs, 4px) 2px;
  white-space: nowrap;
  transition: color var(--gui-transition-fast, 120ms ease);
}

.mobile-file-manager__breadcrumb-btn:last-child {
  color: var(--gui-text-primary, #f0f0f0);
  font-weight: var(--gui-font-weight-semibold, 600);
}

.mobile-file-manager__breadcrumb-btn:active {
  color: var(--gui-accent, #e94560);
}

.mobile-file-manager__more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--gui-bg-surface-raised, #111111);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-secondary, #a0a0a0);
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--gui-transition-fast, 120ms ease);
}

.mobile-file-manager__more-btn:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  color: var(--gui-text-primary, #f0f0f0);
}

/* ── File List ──────────────────────────────────────────────────────── */
.mobile-file-manager__list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mobile-file-manager__row {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  width: 100%;
  padding: var(--gui-spacing-md, 12px) var(--gui-spacing-base, 16px);
  background: none;
  border: none;
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.04));
  color: var(--gui-text-primary, #f0f0f0);
  font-size: var(--gui-font-base, 13px);
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  transition: background var(--gui-transition-fast, 120ms ease);
}

.mobile-file-manager__row:active,
.mobile-file-manager__row--pressed {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.mobile-file-manager__row-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-file-manager__row-meta {
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-tertiary, #6a6a6a);
  white-space: nowrap;
}

.mobile-file-manager__chevron {
  color: var(--gui-text-disabled, #444444);
  flex-shrink: 0;
}

/* ── Empty State ────────────────────────────────────────────────────── */
.mobile-file-manager__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--gui-spacing-3xl, 48px) var(--gui-spacing-xl, 24px);
  text-align: center;
}

.mobile-file-manager__empty span {
  margin-bottom: var(--gui-spacing-base, 16px);
}

.mobile-file-manager__empty-title {
  font-size: var(--gui-font-lg, 15px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-primary, #f0f0f0);
  margin: 0 0 var(--gui-spacing-xs, 4px);
}

.mobile-file-manager__empty-hint {
  font-size: var(--gui-font-sm, 12px);
  color: var(--gui-text-tertiary, #6a6a6a);
  margin: 0 0 var(--gui-spacing-lg, 20px);
}

.mobile-file-manager__empty-actions {
  display: flex;
  gap: var(--gui-spacing-sm, 8px);
}

.mobile-file-manager__empty-btn {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-md, 12px);
  background: var(--gui-bg-surface-raised, #111111);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-primary, #f0f0f0);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
}

.mobile-file-manager__empty-btn:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
}

/* ── Context Sheet ─────────────────────────────────────────────────── */
.mobile-file-manager__context {
  display: flex;
  flex-direction: column;
}

.mobile-file-manager__context-item {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-md, 12px);
  padding: var(--gui-spacing-md, 12px) var(--gui-spacing-base, 16px);
  background: none;
  border: none;
  border-radius: var(--gui-radius-sm, 6px);
  color: var(--gui-text-primary, #f0f0f0);
  font-size: var(--gui-font-base, 13px);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background var(--gui-transition-fast, 120ms ease);
}

.mobile-file-manager__context-item:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.mobile-file-manager__context-item--danger {
  color: var(--gui-error, #f87171);
}

.mobile-file-manager__context-icon {
  flex-shrink: 0;
}

/* ── Rename Sheet ───────────────────────────────────────────────────── */
.mobile-file-manager__rename {
  padding: var(--gui-spacing-sm, 8px) 0;
}

.mobile-file-manager__rename-input {
  width: 100%;
  padding: var(--gui-spacing-md, 12px) var(--gui-spacing-base, 16px);
  background: var(--gui-bg-surface, #0c0c0c);
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.1));
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-primary, #f0f0f0);
  font-size: var(--gui-font-base, 13px);
  outline: none;
  transition: border-color var(--gui-transition-fast, 120ms ease);
}

.mobile-file-manager__rename-input:focus {
  border-color: var(--gui-accent, #e94560);
}

.mobile-file-manager__rename-actions {
  display: flex;
  gap: var(--gui-spacing-sm, 8px);
  margin-top: var(--gui-spacing-md, 12px);
  justify-content: flex-end;
}

.mobile-file-manager__rename-btn {
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-md, 12px);
  background: none;
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-secondary, #a0a0a0);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
}

.mobile-file-manager__rename-btn--primary {
  background: var(--gui-accent, #e94560);
  color: var(--gui-text-inverse, #ffffff);
  border-color: var(--gui-accent, #e94560);
}

.mobile-file-manager__rename-btn:active {
  opacity: 0.8;
}

/* ── File Details Sheet ─────────────────────────────────────────────── */
.mobile-file-manager__details {
  padding: var(--gui-spacing-sm, 8px) 0;
}

.mobile-file-manager__detail-row {
  display: flex;
  justify-content: space-between;
  padding: var(--gui-spacing-md, 12px) var(--gui-spacing-base, 16px);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.04));
}

.mobile-file-manager__detail-row:last-child {
  border-bottom: none;
}

.mobile-file-manager__detail-label {
  font-size: var(--gui-font-sm, 12px);
  color: var(--gui-text-secondary, #a0a0a0);
}

.mobile-file-manager__detail-value {
  font-size: var(--gui-font-sm, 12px);
  color: var(--gui-text-primary, #f0f0f0);
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

.mobile-file-manager__detail-path {
  font-family: var(--gui-font-mono, "JetBrains Mono", "Cascadia Code", monospace);
  font-size: var(--gui-font-xs, 11px);
}
</style>
