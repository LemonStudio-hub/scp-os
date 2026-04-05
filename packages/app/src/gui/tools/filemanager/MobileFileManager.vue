<template>
  <MobileWindow
    :visible="visible"
    :title="currentFolderName"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="mobile-file-manager">
      <!-- Header with Breadcrumbs and Actions -->
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
            <svg v-if="i < breadcrumbSegments.length - 1" width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <!-- Actions -->
        <div class="mobile-file-manager__actions">
          <input
            ref="fileInputRef"
            type="file"
            multiple
            class="mobile-file-manager__file-input"
            @change="onFileUpload"
          />
          <button class="mobile-file-manager__action-btn" @click="triggerUpload" :title="t('fm.dropFiles')">
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
          <span>{{ t('fm.dropFiles') }}</span>
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
              <!-- Folder Icon -->
              <svg v-if="file.isDirectory" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M4 8h10l4-4h10v20H4z"/>
                <path d="M4 8l4-4h10"/>
              </svg>
              <!-- Image Icon -->
              <svg v-else-if="isImageFile(file)" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="4" y="6" width="24" height="20" rx="2"/>
                <circle cx="12" cy="14" r="3"/>
                <path d="M4 22l8-6 4 3 12-9"/>
              </svg>
              <!-- Text Icon -->
              <svg v-else-if="isTextFile(file)" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 4H8a2 2 0 00-2 2v20a2 2 0 002 2h16a2 2 0 002-2V8z"/>
                <path d="M20 4v4h4"/>
                <path d="M10 16h12M10 22h8"/>
              </svg>
              <!-- Code Icon -->
              <svg v-else-if="isCodeFile(file)" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 4H8a2 2 0 00-2 2v20a2 2 0 002 2h16a2 2 0 002-2V8z"/>
                <path d="M20 4v4h4"/>
                <path d="M12 16l-3 3 3 3M20 16l3 3-3 3"/>
              </svg>
              <!-- Default File Icon -->
              <svg v-else width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 4H8a2 2 0 00-2 2v20a2 2 0 002 2h16a2 2 0 002-2V8z"/>
                <path d="M20 4v4h4"/>
              </svg>
            </div>
            <span class="mobile-file-manager__item-name" :title="file.name">{{ file.name }}</span>
            <span class="mobile-file-manager__item-meta">
              {{ file.isDirectory ? t('fm.folder') : formatSize(file.size) }}
            </span>
          </button>
        </div>

        <!-- Empty State -->
        <div v-if="fmStore.sortedFiles.length === 0" class="mobile-file-manager__empty">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 16h14l6-8h20v36H8z"/>
            <path d="M20 28h16M20 36h10"/>
          </svg>
          <p class="mobile-file-manager__empty-title">{{ t('fm.emptyFolder') }}</p>
          <p class="mobile-file-manager__empty-hint">
            {{ t('fm.emptyHint') }}
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
          <span>{{ action.label }}</span>
        </button>
      </div>
    </MobileBottomSheet>

    <!-- Dialog Modal -->
    <DialogModal
      v-model:visible="dialogVisible"
      :type="dialogType"
      :title="dialogTitle"
      :message="dialogMessage"
      :placeholder="dialogPlaceholder"
      :default-value="dialogDefault"
      :confirm-text="dialogConfirmText"
      :danger="dialogDanger"
      @confirm="onDialogConfirm"
    />

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
import { useI18n } from '../../composables/useI18n'
import MobileWindow from '../../components/MobileWindow.vue'
import MobileBottomSheet from '../../components/MobileBottomSheet.vue'
import DialogModal from './DialogModal.vue'
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
  danger?: boolean
  fn: () => void
}

defineProps<Props>()
defineEmits<{ close: [] }>()

const { t } = useI18n()
const fmStore = useFileManagerStore()
const currentFolderName = computed(() => {
  const parts = fmStore.currentPath.split('/').filter(Boolean)
  return parts.length > 0 ? parts[parts.length - 1] : t('fm.files')
})

// Breadcrumbs
const breadcrumbSegments = computed(() => {
  const segments = fmStore.currentPath.split('/').filter(Boolean)
  return [
    { label: t('fm.root'), path: '/' },
    ...segments.map((seg, i) => ({
      label: seg,
      path: '/' + segments.slice(0, i + 1).join('/'),
    })),
  ]
})

function onBreadcrumbClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  const btn = target.closest('.mobile-file-manager__breadcrumb-btn')
  if (btn) {
    const index = parseInt(btn.getAttribute('data-index') || '0')
    const segment = breadcrumbSegments.value[index]
    if (segment) {
      fmStore.loadDirectory(segment.path)
    }
  }
}

// Dialog state
const dialogVisible = ref(false)
const dialogType = ref<'input' | 'confirm'>('input')
const dialogTitle = ref('')
const dialogMessage = ref('')
const dialogPlaceholder = ref('')
const dialogDefault = ref('')
const dialogConfirmText = ref('Confirm')
const dialogDanger = ref(false)
let dialogCallback: ((value: string | true) => void) | null = null

function showDialog(options: {
  type?: 'input' | 'confirm'
  title: string
  message?: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
  danger?: boolean
}): Promise<string | true> {
  return new Promise((resolve) => {
    dialogType.value = options.type || 'input'
    dialogTitle.value = options.title
    dialogMessage.value = options.message || ''
    dialogPlaceholder.value = options.placeholder || ''
    dialogDefault.value = options.defaultValue || ''
    dialogConfirmText.value = options.confirmText || t('common.confirm')
    dialogDanger.value = options.danger || false
    dialogCallback = resolve
    dialogVisible.value = true
  })
}

function onDialogConfirm(value: string | true) {
  if (dialogCallback) {
    dialogCallback(value)
    dialogCallback = null
  }
}

// Text Editor
const textEditorVisible = ref(false)
const editingFile = ref<any>(null)

// Image Viewer
const imageViewerVisible = ref(false)
const viewingImageFile = ref<any>(null)

// Context Menu State
const contextSheetVisible = ref(false)
const contextSheetTitle = ref('')
const contextActions = ref<ContextAction[]>([])
const contextTargetFile = ref<any>(null)
const listRef = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)

// File type detection helpers
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico']
const TEXT_EXTS = ['txt', 'md', 'log']
const CODE_EXTS = ['js', 'ts', 'css', 'html', 'json', 'xml', 'yml', 'yaml']

function getFileExt(file: any): string {
  return file.name.split('.').pop()?.toLowerCase() || ''
}

function isImageFile(file: any): boolean {
  return IMAGE_EXTS.includes(getFileExt(file))
}

function isTextFile(file: any): boolean {
  return TEXT_EXTS.includes(getFileExt(file))
}

function isCodeFile(file: any): boolean {
  return CODE_EXTS.includes(getFileExt(file))
}

function getIconClass(file: any): string {
  if (file.isDirectory) return 'mobile-file-manager__item-icon--folder'
  const ext = getFileExt(file)
  if (IMAGE_EXTS.includes(ext)) return 'mobile-file-manager__item-icon--image'
  if (CODE_EXTS.includes(ext)) return 'mobile-file-manager__item-icon--code'
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
    const path = fmStore.currentPath === '/' ? '/' + file.name : fmStore.currentPath + '/' + file.name
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    
    // Check if it's a text-like file or binary file
    const textExts = ['txt', 'md', 'log', 'json', 'xml', 'yml', 'yaml', 'js', 'ts', 'css', 'html', 'vue', 'csv', 'sh']
    
    try {
      if (textExts.includes(ext)) {
        // Text file: decode as UTF-8
        const content = new TextDecoder().decode(buffer)
        filesystem.writeFile(path, content)
      } else {
        // Binary file (images, etc): convert to base64 data URL
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const base64 = btoa(binary)
        const mimeType = file.type || 'application/octet-stream'
        const dataUrl = `data:${mimeType};base64,${base64}`
        filesystem.writeFile(path, dataUrl)
      }
    } catch (error) {
      console.error('[FileManager] Failed to upload file:', error)
    }
  }

  fmStore.loadDirectory(fmStore.currentPath)
  input.value = ''
}

async function createNewFile() {
  const name = await showDialog({
    type: 'input',
    title: t('fm.newFile'),
    placeholder: t('fm.enterFileName'),
    defaultValue: t('fm.untitled'),
    confirmText: t('fm.create'),
  })
  
  if (name && typeof name === 'string' && name.trim()) {
    const path = fmStore.currentPath === '/' ? '/' + name : fmStore.currentPath + '/' + name
    try {
      filesystem.writeFile(path, '')
      fmStore.loadDirectory(fmStore.currentPath)
    } catch (error) {
      console.error('[FileManager] Failed to create file:', error)
    }
  }
}

async function createNewFolder() {
  const name = await showDialog({
    type: 'input',
    title: t('fm.newFolder'),
    placeholder: t('fm.enterFolderName'),
    defaultValue: t('fm.newFolderDefault'),
    confirmText: t('fm.create'),
  })
  
  if (name && typeof name === 'string' && name.trim()) {
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
      label: t('common.edit'),

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
      label: t('fm.viewImage'),

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
      label: t('common.rename'),

      fn: async () => {
        const newName = await showDialog({
          type: 'input',
          title: t('common.rename'),
          placeholder: t('fm.enterNewName'),
          defaultValue: file.name,
          confirmText: t('common.rename'),
        })
        
        if (newName && typeof newName === 'string' && newName !== file.name) {
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
      label: t('common.delete'),

      danger: true,
      fn: async () => {
        const confirmed = await showDialog({
          type: 'confirm',
          title: t('common.delete'),
          message: t('fm.deleteConfirm', { name: file.name }),
          confirmText: t('common.delete'),
          danger: true,
        })
        
        if (confirmed) {
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
  contextSheetTitle.value = t('fm.folderActions')
  contextActions.value = [
    {
      id: 'new-file',
      label: t('fm.newFile'),

      fn: () => {
        createNewFile()
        contextSheetVisible.value = false
      },
    },
    {
      id: 'new-folder',
      label: t('fm.newFolder'),

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

  const textExts = ['txt', 'md', 'log', 'json', 'xml', 'yml', 'yaml', 'js', 'ts', 'css', 'html', 'vue', 'csv', 'sh']

  for (const file of files) {
    const buffer = await file.arrayBuffer()
    const path = fmStore.currentPath === '/' ? '/' + file.name : fmStore.currentPath + '/' + file.name
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    
    try {
      if (textExts.includes(ext)) {
        const content = new TextDecoder().decode(buffer)
        filesystem.writeFile(path, content)
      } else {
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const base64 = btoa(binary)
        const mimeType = file.type || 'application/octet-stream'
        const dataUrl = `data:${mimeType};base64,${base64}`
        filesystem.writeFile(path, dataUrl)
      }
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
  gap: 8px;
  padding: 10px 14px;
  background: var(--gui-bg-surface, #2C2C2E);
  border-bottom: 0.5px solid var(--gui-border-subtle, #38383A);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* ── Breadcrumbs ────────────────────────────────────────────────────── */
.mobile-file-manager__breadcrumbs {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.mobile-file-manager__breadcrumbs::-webkit-scrollbar {
  display: none;
}

.mobile-file-manager__breadcrumb-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background: none;
  border: none;
  color: var(--gui-text-secondary, #8E8E93);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}

.mobile-file-manager__breadcrumb-btn:last-child {
  color: var(--gui-text-primary, #FFFFFF);
  font-weight: 600;
}

.mobile-file-manager__breadcrumb-btn:active {
  background: var(--gui-bg-surface-hover, #3A3A3C);
}

.mobile-file-manager__breadcrumb-btn svg {
  opacity: 0.4;
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
