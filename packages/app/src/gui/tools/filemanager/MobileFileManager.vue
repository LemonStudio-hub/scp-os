<template>
  <MobileWindow
    :visible="visible"
    :title="currentFolderName"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="mobile-file-manager">
      <!-- Header with Upload -->
      <div class="mobile-file-manager__header">
        <div class="mobile-file-manager__path">
          <span class="mobile-file-manager__path-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M1 4h4l2-2h6v9H1z"/>
            </svg>
          </span>
          <span class="mobile-file-manager__path-text">{{ currentPath }}</span>
        </div>
        <div class="mobile-file-manager__actions">
          <input
            ref="fileInputRef"
            type="file"
            multiple
            class="mobile-file-manager__file-input"
            @change="onFileUpload"
          />
          <button class="mobile-file-manager__action-btn" @click="triggerUpload" title="Upload files">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 12V3M9 3L6 6M9 3l3 3"/>
              <path d="M3 12v3a2 2 0 002 2h8a2 2 0 002-2v-3"/>
            </svg>
          </button>
          <button class="mobile-file-manager__action-btn" @click="createNewFile" title="New file">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M10 1H4a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V5z"/>
              <path d="M10 1v4h4"/>
              <path d="M9 9v6M6 12h6"/>
            </svg>
          </button>
          <button class="mobile-file-manager__action-btn" @click="createNewFolder" title="New folder">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M1 5V15h16V5H1z"/>
              <path d="M1 5l3-3h6l2 2"/>
              <path d="M9 9v6M6 12h6"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- File List -->
      <div
        ref="listRef"
        class="mobile-file-manager__list"
        :class="{ 'is-drag-over': isDragOver }"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop"
        @contextmenu.prevent="onListContextMenu"
      >
        <!-- Drag overlay -->
        <div v-if="isDragOver" class="mobile-file-manager__drag-overlay">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M24 32V16M24 16l-8 8M24 16l8 8"/>
            <path d="M8 36v4a4 4 0 004 4h24a4 4 0 004-4v-4"/>
          </svg>
          <span>Drop files to upload</span>
        </div>

        <!-- File Items -->
        <div class="mobile-file-manager__grid">
          <button
            v-for="file in fmStore.sortedFiles"
            :key="file.name"
            class="mobile-file-manager__item"
            :class="{ 'mobile-file-manager__item--selected': fmStore.selectedFiles.has(file.name) }"
            @click="onFileTap(file)"
            @contextmenu.prevent="onFileContextMenu($event, file)"
          >
            <div class="mobile-file-manager__item-icon" :class="getIconClass(file)">
              <component :is="getFileIcon(file)" />
            </div>
            <span class="mobile-file-manager__item-name" :title="file.name">{{ file.name }}</span>
            <span class="mobile-file-manager__item-meta">
              {{ file.isDirectory ? 'Folder' : formatSize(file.size) }}
            </span>
          </button>
        </div>

        <!-- Empty State -->
        <div v-if="fmStore.sortedFiles.length === 0" class="mobile-file-manager__empty">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 16h14l6-8h20v36H8z"/>
            <path d="M20 28h16M20 36h10"/>
          </svg>
          <p class="mobile-file-manager__empty-title">This folder is empty</p>
          <p class="mobile-file-manager__empty-hint">
            Tap the + button to create new files or folders
          </p>
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <MobileBottomSheet
      v-model:visible="contextSheetVisible"
      :title="contextSheetTitle"
      swipe-to-dismiss
    >
      <div class="mobile-file-manager__context">
        <button
          v-for="action in contextActions"
          :key="action.id"
          class="mobile-file-manager__context-item"
          :class="{ 'mobile-file-manager__context-item--danger': action.danger }"
          @click="action.fn"
        >
          <component :is="action.icon" />
          <span>{{ action.label }}</span>
        </button>
      </div>
    </MobileBottomSheet>

    <!-- Text Editor Modal -->
    <TextEditorModal
      v-model:visible="textEditorVisible"
      :file="editingFile"
      @save="onSaveTextFile"
    />

    <!-- Image Viewer Modal -->
    <ImageViewerModal
      v-model:visible="imageViewerVisible"
      :file="viewingImageFile"
    />
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
import MobileBottomSheet from '../../components/MobileBottomSheet.vue'
import TextEditorModal from './TextEditorModal.vue'
import ImageViewerModal from './ImageViewerModal.vue'
import { useFileManagerStore } from '../../stores/fileManager'
import { filesystem } from '../../../utils/filesystem'

interface Props {
  visible: boolean
  windowInstance: any
}

interface ContextAction {
  id: string
  label: string
  icon: any
  danger?: boolean
  fn: () => void
}

defineProps<Props>()
defineEmits<{ close: [] }>()

const fmStore = useFileManagerStore()
const currentPath = computed(() => fmStore.currentPath)
const currentFolderName = computed(() => {
  const parts = fmStore.currentPath.split('/').filter(Boolean)
  return parts.length > 0 ? parts[parts.length - 1] : 'Files'
})

// State
const contextSheetVisible = ref(false)
const contextSheetTitle = ref('')
const contextActions = ref<ContextAction[]>([])
const contextTargetFile = ref<any>(null)
const listRef = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)

// Text Editor
const textEditorVisible = ref(false)
const editingFile = ref<any>(null)

// Image Viewer
const imageViewerVisible = ref(false)
const viewingImageFile = ref<any>(null)

// SVG Icons
const FolderIcon = {
  template: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8h10l4-4h10v20H4z"/><path d="M4 8l4-4h10"/></svg>`,
}

const FileIcon = {
  template: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 4H8a2 2 0 00-2 2v20a2 2 0 002 2h16a2 2 0 002-2V8z"/><path d="M20 4v4h4"/></svg>`,
}

const ImageIcon = {
  template: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="6" width="24" height="20" rx="2"/><circle cx="12" cy="14" r="3"/><path d="M4 22l8-6 4 3 12-9"/></svg>`,
}

const TextIcon = {
  template: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 4H8a2 2 0 00-2 2v20a2 2 0 002 2h16a2 2 0 002-2V8z"/><path d="M20 4v4h4"/><path d="M10 16h12M10 22h8"/></svg>`,
}

const CodeIcon = {
  template: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 4H8a2 2 0 00-2 2v20a2 2 0 002 2h16a2 2 0 002-2V8z"/><path d="M20 4v4h4"/><path d="M12 16l-3 3 3 3M20 16l3 3-3 3"/></svg>`,
}

// File type detection
function getFileIcon(file: any) {
  if (file.isDirectory) return FolderIcon
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) return ImageIcon
  if (['txt', 'md', 'log'].includes(ext)) return TextIcon
  if (['js', 'ts', 'css', 'html', 'json', 'xml', 'yml', 'yaml'].includes(ext)) return CodeIcon
  return FileIcon
}

function getIconClass(file: any) {
  if (file.isDirectory) return 'mobile-file-manager__item-icon--folder'
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) return 'mobile-file-manager__item-icon--image'
  if (['js', 'ts', 'css', 'html', 'json', 'xml', 'yml', 'yaml'].includes(ext)) return 'mobile-file-manager__item-icon--code'
  return 'mobile-file-manager__item-icon--file'
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function onFileTap(file: any) {
  if (file.isDirectory) {
    fmStore.navigateTo(fmStore.currentPath === '/' ? '/' + file.name : fmStore.currentPath + '/' + file.name)
  } else {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const textExts = ['txt', 'md', 'log', 'json', 'xml', 'yml', 'yaml']
    const codeExts = ['js', 'ts', 'css', 'html', 'vue']
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico']
    
    if (imageExts.includes(ext)) {
      viewingImageFile.value = file
      imageViewerVisible.value = true
    } else if (textExts.includes(ext) || codeExts.includes(ext)) {
      editingFile.value = file
      textEditorVisible.value = true
    } else {
      // Try to open as text anyway
      editingFile.value = file
      textEditorVisible.value = true
    }
  }
}

function triggerUpload() {
  fileInputRef.value?.click()
}

async function onFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  for (const file of files) {
    const buffer = await file.arrayBuffer()
    const content = new TextDecoder().decode(buffer)
    const path = fmStore.currentPath === '/' ? '/' + file.name : fmStore.currentPath + '/' + file.name
    try {
      filesystem.writeFile(path, content)
    } catch (error) {
      console.error('[FileManager] Failed to upload file:', error)
    }
  }
  
  fmStore.loadDirectory(fmStore.currentPath)
  input.value = ''
}

function createNewFile() {
  const name = prompt('Enter file name:', 'untitled.txt')
  if (name) {
    const path = fmStore.currentPath === '/' ? '/' + name : fmStore.currentPath + '/' + name
    try {
      filesystem.writeFile(path, '')
      fmStore.loadDirectory(fmStore.currentPath)
    } catch (error) {
      console.error('[FileManager] Failed to create file:', error)
    }
  }
}

function createNewFolder() {
  const name = prompt('Enter folder name:', 'New Folder')
  if (name) {
    const path = fmStore.currentPath === '/' ? '/' + name : fmStore.currentPath + '/' + name
    try {
      filesystem.createDirectory(path)
      fmStore.loadDirectory(fmStore.currentPath)
    } catch (error) {
      console.error('[FileManager] Failed to create folder:', error)
    }
  }
}

function onFileContextMenu(_event: MouseEvent, file: any) {
  contextTargetFile.value = file
  contextSheetTitle.value = file.name
  
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)
  const isText = ['txt', 'md', 'log', 'json', 'xml', 'yml', 'yaml', 'js', 'ts', 'css', 'html', 'vue'].includes(ext)
  
  contextActions.value = []
  
  if (isText) {
    contextActions.value.push({
      id: 'edit',
      label: 'Edit',
      icon: CodeIcon,
      fn: () => {
        editingFile.value = file
        textEditorVisible.value = true
        contextSheetVisible.value = false
      },
    })
  }
  
  if (isImage) {
    contextActions.value.push({
      id: 'view',
      label: 'View Image',
      icon: ImageIcon,
      fn: () => {
        viewingImageFile.value = file
        imageViewerVisible.value = true
        contextSheetVisible.value = false
      },
    })
  }
  
  contextActions.value.push(
    {
      id: 'rename',
      label: 'Rename',
      icon: FileIcon,
      fn: () => {
        const newName = prompt('New name:', file.name)
        if (newName && newName !== file.name) {
          const oldPath = fmStore.currentPath === '/' ? '/' + file.name : fmStore.currentPath + '/' + file.name
          const newPath = fmStore.currentPath === '/' ? '/' + newName : fmStore.currentPath + '/' + newName
          try {
            filesystem.moveNode(oldPath, newPath)
            fmStore.loadDirectory(fmStore.currentPath)
          } catch (error) {
            console.error('[FileManager] Failed to rename:', error)
          }
        }
        contextSheetVisible.value = false
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: FileIcon,
      danger: true,
      fn: () => {
        if (confirm(`Delete "${file.name}"?`)) {
          const path = fmStore.currentPath === '/' ? '/' + file.name : fmStore.currentPath + '/' + file.name
          try {
            filesystem.deleteNode(path)
            fmStore.loadDirectory(fmStore.currentPath)
          } catch (error) {
            console.error('[FileManager] Failed to delete:', error)
          }
        }
        contextSheetVisible.value = false
      },
    }
  )
  
  contextSheetVisible.value = true
}

function onListContextMenu(_event: MouseEvent) {
  contextSheetTitle.value = 'Folder Actions'
  contextActions.value = [
    {
      id: 'new-file',
      label: 'New File',
      icon: FileIcon,
      fn: () => {
        createNewFile()
        contextSheetVisible.value = false
      },
    },
    {
      id: 'new-folder',
      label: 'New Folder',
      icon: FolderIcon,
      fn: () => {
        createNewFolder()
        contextSheetVisible.value = false
      },
    },
  ]
  contextSheetVisible.value = true
}

function onSaveTextFile(data: { name: string; content: string }) {
  const path = fmStore.currentPath === '/' ? '/' + data.name : fmStore.currentPath + '/' + data.name
  try {
    filesystem.writeFile(path, data.content)
    fmStore.loadDirectory(fmStore.currentPath)
  } catch (error) {
    console.error('[FileManager] Failed to save file:', error)
  }
}

// Drag & Drop
function onDragOver() {
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

async function onDrop(event: DragEvent) {
  isDragOver.value = false
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  for (const file of files) {
    const buffer = await file.arrayBuffer()
    const content = new TextDecoder().decode(buffer)
    const path = fmStore.currentPath === '/' ? '/' + file.name : fmStore.currentPath + '/' + file.name
    try {
      filesystem.writeFile(path, content)
    } catch (error) {
      console.error('[FileManager] Failed to upload dropped file:', error)
    }
  }
  
  fmStore.loadDirectory(fmStore.currentPath)
}

onMounted(() => {
  fmStore.loadDirectory(fmStore.currentPath)
})
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────── */
.mobile-file-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #0A0A0A);
}

/* ── Header ─────────────────────────────────────────────────────────── */
.mobile-file-manager__header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--gui-bg-surface, #2C2C2E);
  border-bottom: 0.5px solid var(--gui-border-subtle, #38383A);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.mobile-file-manager__path {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--gui-text-secondary, #8E8E93);
}

.mobile-file-manager__path-icon {
  display: flex;
  align-items: center;
  color: var(--gui-accent, #007AFF);
}

.mobile-file-manager__path-text {
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-file-manager__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-file-manager__file-input {
  display: none;
}

.mobile-file-manager__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: var(--gui-bg-surface-hover, #3A3A3C);
  color: var(--gui-text-primary, #FFFFFF);
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-file-manager__action-btn:active {
  transform: scale(0.92);
}

/* ── File List ──────────────────────────────────────────────────────── */
.mobile-file-manager__list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

.mobile-file-manager__drag-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 122, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--gui-accent, #007AFF);
  font-size: 16px;
  font-weight: 600;
  animation: fm-fade-in 0.2s ease;
}

@keyframes fm-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ── Grid ───────────────────────────────────────────────────────────── */
.mobile-file-manager__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 16px;
}

@media (max-width: 380px) {
  .mobile-file-manager__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.mobile-file-manager__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: var(--gui-bg-surface, #2C2C2E);
  border-radius: 14px;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-file-manager__item:active {
  transform: scale(0.95);
}

.mobile-file-manager__item--selected {
  border-color: var(--gui-accent, #007AFF);
  background: var(--gui-bg-surface-hover, #3A3A3C);
}

.mobile-file-manager__item-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-file-manager__item-icon--folder {
  color: #FF9500;
}

.mobile-file-manager__item-icon--image {
  color: #FF3B30;
}

.mobile-file-manager__item-icon--code {
  color: #5AC8FA;
}

.mobile-file-manager__item-icon--file {
  color: var(--gui-text-secondary, #8E8E93);
}

.mobile-file-manager__item-name {
  width: 100%;
  font-size: 12px;
  font-weight: 500;
  color: var(--gui-text-primary, #FFFFFF);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-file-manager__item-meta {
  font-size: 10px;
  color: var(--gui-text-tertiary, #636366);
}

/* ── Empty State ────────────────────────────────────────────────────── */
.mobile-file-manager__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--gui-text-tertiary, #636366);
  text-align: center;
}

.mobile-file-manager__empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--gui-text-secondary, #8E8E93);
  margin: 12px 0 8px;
}

.mobile-file-manager__empty-hint {
  font-size: 13px;
}

/* ── Context Menu ───────────────────────────────────────────────────── */
.mobile-file-manager__context {
  padding: 8px 0;
}

.mobile-file-manager__context-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: none;
  border: none;
  color: var(--gui-text-primary, #FFFFFF);
  font-size: 15px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-file-manager__context-item:active {
  background: var(--gui-bg-surface-hover, #3A3A3C);
}

.mobile-file-manager__context-item--danger {
  color: #FF3B30;
}
</style>
