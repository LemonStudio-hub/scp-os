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
            <svg
              v-if="i < breadcrumbSegments.length - 1"
              width="10"
              height="10"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M4 2L8 6L4 10"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
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
          <button
            class="mobile-file-manager__action-btn"
            :title="t('fm.dropFiles')"
            @click="triggerUpload"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M9 12V3M9 3L6 6M9 3l3 3" />
              <path d="M3 12v3a2 2 0 002 2h8a2 2 0 002-2v-3" />
            </svg>
          </button>
          <button
            class="mobile-file-manager__action-btn"
            :title="t('fm.newFile')"
            @click="createNewFile"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M10 1H4a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V5z" />
              <path d="M10 1v4h4" />
              <path d="M9 9v6M6 12h6" />
            </svg>
          </button>
          <button
            class="mobile-file-manager__action-btn"
            :title="t('fm.newFolder')"
            @click="createNewFolder"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M1 5V15h16V5H1z" />
              <path d="M1 5l3-3h6l2 2" />
              <path d="M9 9v6M6 12h6" />
            </svg>
          </button>
          <button
            class="mobile-file-manager__action-btn"
            :class="{ 'mobile-file-manager__action-btn--active': fmStore.showHidden }"
            :title="fmStore.showHidden ? 'Hide hidden files' : 'Show hidden files'"
            @click="fmStore.toggleShowHidden"
          >
            <svg
              v-if="!fmStore.showHidden"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg
              v-else
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
              />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </button>
          <button
            class="mobile-file-manager__action-btn"
            :title="mobileViewMode === 'grid' ? 'List view' : 'Grid view'"
            @click="mobileViewMode = mobileViewMode === 'grid' ? 'list' : 'grid'"
          >
            <svg
              v-if="mobileViewMode === 'grid'"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M2 4h14M2 9h14M2 14h14" />
            </svg>
            <svg
              v-else
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <rect x="2" y="2" width="5" height="5" rx="1" />
              <rect x="11" y="2" width="5" height="5" rx="1" />
              <rect x="2" y="11" width="5" height="5" rx="1" />
              <rect x="11" y="11" width="5" height="5" rx="1" />
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
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M24 32V16M24 16l-8 8M24 16l8 8" />
            <path d="M8 36v4a4 4 0 004 4h24a4 4 0 004-4v-4" />
          </svg>
          <span>{{ t('fm.dropFiles') }}</span>
        </div>

        <!-- File Items: Grid View -->
        <div v-if="mobileViewMode === 'grid'" class="mobile-file-manager__grid">
          <button
            v-for="file in fmStore.sortedFiles"
            :key="file.name"
            class="mobile-file-manager__item"
            :class="{
              'mobile-file-manager__item--selected': fmStore.selectedFiles.has(file.name),
              'mobile-file-manager__item--hidden': file.isHidden,
            }"
            @click="onFileTap(file)"
            @contextmenu.prevent="onFileContextMenu($event, file)"
          >
            <div class="mobile-file-manager__item-icon">
              <SCPFileIcon
                :name="file.name"
                :is-directory="file.isDirectory"
                :size="32"
                size-class="xl"
              />
            </div>
            <span class="mobile-file-manager__item-name" :title="file.name">{{ file.name }}</span>
            <span class="mobile-file-manager__item-meta">
              {{ file.isDirectory ? t('fm.folder') : formatSize(file.size) }}
            </span>
          </button>
        </div>

        <!-- File Items: List View -->
        <div v-else class="mobile-file-manager__list-view">
          <button
            v-for="file in fmStore.sortedFiles"
            :key="file.name"
            class="mobile-file-manager__list-item"
            :class="{
              'mobile-file-manager__list-item--selected': fmStore.selectedFiles.has(file.name),
              'mobile-file-manager__list-item--hidden': file.isHidden,
            }"
            @click="onFileTap(file)"
            @contextmenu.prevent="onFileContextMenu($event, file)"
          >
            <SCPFileIcon
              :name="file.name"
              :is-directory="file.isDirectory"
              :size="20"
              size-class="md"
            />
            <div class="mobile-file-manager__list-item-info">
              <span class="mobile-file-manager__list-item-name">{{ file.name }}</span>
              <span class="mobile-file-manager__list-item-meta">
                {{ file.isDirectory ? t('fm.folder') : formatSize(file.size) }}
              </span>
            </div>
          </button>
        </div>

        <!-- Empty State -->
        <div v-if="fmStore.sortedFiles.length === 0" class="mobile-file-manager__empty">
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M8 16h14l6-8h20v36H8z" />
            <path d="M20 28h16M20 36h10" />
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

    <!-- Audio Player Modal -->
    <AudioPlayerModal v-model:visible="audioPlayerVisible" :file="playingAudioFile" />

    <!-- Video Player Modal -->
    <VideoPlayerModal v-model:visible="videoPlayerVisible" :file="playingVideoFile" />

    <!-- Text Editor Modal -->
    <TextEditorModal
      v-model:visible="textEditorVisible"
      :file="editingFile"
      @save="onSaveTextFile"
    />

    <!-- Image Viewer Modal -->
    <ImageViewerModal v-model:visible="imageViewerVisible" :file="viewingImageFile" />
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
import MobileBottomSheet from '../../components/MobileBottomSheet.vue'
import SCPFileIcon from '../../components/ui/SCPFileIcon.vue'
import DialogModal from './DialogModal.vue'
import AudioPlayerModal from './AudioPlayerModal.vue'
import VideoPlayerModal from './VideoPlayerModal.vue'
import TextEditorModal from './TextEditorModal.vue'
import ImageViewerModal from './ImageViewerModal.vue'
import { setI18n as setFileManagerI18n } from '../../stores/fileManager'
import { filesystem } from '../../../utils/filesystem'
import {
  useFileManagerOps,
  isImageFile,
  isAudioFile,
  isVideoFile,
  isTextFile,
} from '../../composables/useFileManagerOps'

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

const {
  t,
  fmStore,
  fileInputRef,
  formatSize,
  triggerUpload,
  onFileUpload: baseOnFileUpload,
  createFile,
  createFolder,
  renameFile,
  deleteFile,
} = useFileManagerOps()

// Suppress TypeScript warning - fileInputRef is used in template
void fileInputRef

setFileManagerI18n({ t })

const mobileViewMode = ref<'grid' | 'list'>('grid')
const currentFolderName = computed(() => {
  const parts = fmStore.currentPath.split('/').filter(Boolean)
  return parts.length > 0 ? parts[parts.length - 1] : t('fm.files')
})

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

const textEditorVisible = ref(false)
const editingFile = ref<any>(null)
const imageViewerVisible = ref(false)
const viewingImageFile = ref<any>(null)
const audioPlayerVisible = ref(false)
const playingAudioFile = ref<any>(null)
const videoPlayerVisible = ref(false)
const playingVideoFile = ref<any>(null)

const contextSheetVisible = ref(false)
const contextSheetTitle = ref('')
const contextActions = ref<ContextAction[]>([])
const contextTargetFile = ref<any>(null)
const isDragOver = ref(false)

function onFileTap(file: any) {
  if (file.isDirectory) {
    fmStore.navigateTo(
      fmStore.currentPath === '/' ? '/' + file.name : fmStore.currentPath + '/' + file.name
    )
  } else {
    if (isImageFile(file.name)) {
      viewingImageFile.value = file
      imageViewerVisible.value = true
    } else if (isAudioFile(file.name)) {
      playingAudioFile.value = file
      audioPlayerVisible.value = true
    } else if (isVideoFile(file.name)) {
      playingVideoFile.value = file
      videoPlayerVisible.value = true
    } else if (isTextFile(file.name)) {
      editingFile.value = file
      textEditorVisible.value = true
    } else {
      editingFile.value = file
      textEditorVisible.value = true
    }
  }
}

async function onFileUpload(event: Event) {
  const result = await baseOnFileUpload(event)
  if (result.fail > 0) {
    alert(`Stored ${result.success} file(s) locally, ${result.fail} failed.`)
  }
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
    createFile(name.trim())
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
    createFolder(name.trim())
  }
}

function onFileContextMenu(_event: MouseEvent, file: any) {
  contextTargetFile.value = file
  contextSheetTitle.value = file.name

  contextActions.value = []

  if (isTextFile(file.name)) {
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

  if (isImageFile(file.name)) {
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

  if (isAudioFile(file.name)) {
    contextActions.value.push({
      id: 'play-audio',
      label: 'Play Audio',
      fn: () => {
        playingAudioFile.value = file
        audioPlayerVisible.value = true
        contextSheetVisible.value = false
      },
    })
  }

  if (isVideoFile(file.name)) {
    contextActions.value.push({
      id: 'play-video',
      label: 'Play Video',
      fn: () => {
        playingVideoFile.value = file
        videoPlayerVisible.value = true
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
          renameFile(file.name, newName)
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
          deleteFile(file.name)
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

  let successCount = 0
  let failCount = 0

  for (const file of files) {
    const path =
      fmStore.currentPath === '/' ? '/' + file.name : fmStore.currentPath + '/' + file.name

    try {
      const { readFileAsLocal } = await import('../../composables/useFileManagerOps')
      const content = await readFileAsLocal(file)
      const existingNode = filesystem.getNodeByPath(path)
      if (existingNode && existingNode.type === 'file') {
        filesystem.writeFile(path, content)
      } else {
        filesystem.createFile(path, content)
      }
      successCount++
    } catch (error) {
      console.error('[FileManager] Failed to store dropped file locally:', error)
      failCount++
    }
  }

  fmStore.loadDirectory(fmStore.currentPath)

  if (failCount > 0) {
    alert(`Stored ${successCount} file(s) locally, ${failCount} failed.`)
  }
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
  background: var(--gui-bg-base, #0a0a0a);
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
  background: var(--gui-bg-surface, #1c1c1e);
  border-bottom: 0.5px solid var(--gui-border-subtle, #38383a);
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
  color: var(--gui-text-secondary, #8e8e93);
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
  color: var(--gui-text-primary, #ffffff);
  font-weight: 600;
}

.mobile-file-manager__breadcrumb-btn:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
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
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #ffffff);
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
  color: var(--gui-accent, #007aff);
  font-size: 16px;
  font-weight: 600;
  animation: fm-fade-in 0.2s ease;
}

@keyframes fm-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
  background: var(--gui-bg-surface, #1c1c1e);
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
  border-color: var(--gui-accent, #007aff);
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.mobile-file-manager__item--hidden {
  opacity: 0.45;
}

.mobile-file-manager__item--hidden:active {
  opacity: 0.7;
}

.mobile-file-manager__item-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-file-manager__item-name {
  width: 100%;
  font-size: 12px;
  font-weight: 500;
  color: var(--gui-text-primary, #ffffff);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-file-manager__item-meta {
  font-size: 10px;
  color: var(--gui-text-tertiary, #636366);
}

/* ── List View ─────────────────────────────────────────────────────── */
.mobile-file-manager__list-view {
  display: flex;
  flex-direction: column;
  padding: 8px;
}

.mobile-file-manager__list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--gui-bg-surface, #1c1c1e);
  border-radius: 10px;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  margin-bottom: 4px;
}

.mobile-file-manager__list-item:active {
  transform: scale(0.98);
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.mobile-file-manager__list-item--selected {
  border-color: var(--gui-accent, #007aff);
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.mobile-file-manager__list-item--hidden {
  opacity: 0.45;
}

.mobile-file-manager__list-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mobile-file-manager__list-item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--gui-text-primary, #ffffff);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-file-manager__list-item-meta {
  font-size: 11px;
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
  color: var(--gui-text-secondary, #8e8e93);
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
  color: var(--gui-text-primary, #ffffff);
  font-size: 15px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-file-manager__context-item:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.mobile-file-manager__context-item--danger {
  color: var(--gui-error, #ff3b30);
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .mobile-file-manager__context-menu {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
.light .mobile-file-manager__sheet {
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.08);
}
</style>
