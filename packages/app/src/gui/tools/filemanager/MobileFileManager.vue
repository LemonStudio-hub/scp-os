<!-- eslint-disable @typescript-eslint/no-explicit-any -->

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
          <!-- Upload -->
          <button
            class="mobile-file-manager__action-btn"
            :title="t('fm.dropFiles')"
            @click="triggerUpload"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 15V4" />
              <path d="M8 8l4-4 4 4" />
              <path d="M4 18h16" />
            </svg>
          </button>
          <!-- Sync from cloud -->
          <button
            class="mobile-file-manager__action-btn"
            :title="t('fm.syncCloud')"
            :disabled="cloudSyncing"
            @click="syncFromCloud"
          >
            <svg
              v-if="!cloudSyncing"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M17.5 8.5A5.5 5.5 0 008.2 7.2 4 4 0 108.5 15H17a3.5 3.5 0 00.5-7z" />
              <path d="M12 21v-7" />
              <path d="M9 17l3 4 3-4" />
            </svg>
            <div v-else class="mobile-file-manager__spinner" />
          </button>
          <!-- New File -->
          <button
            class="mobile-file-manager__action-btn"
            :title="t('fm.newFile')"
            @click="createNewFile"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="12" x2="12" y2="18" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </button>
          <!-- New Folder -->
          <button
            class="mobile-file-manager__action-btn"
            :title="t('fm.newFolder')"
            @click="createNewFolder"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M3 8a2 2 0 012-2h4.17a2 2 0 011.42.59L12 8h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
              <line x1="12" y1="12" x2="12" y2="18" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </button>
          <!-- Show / hide hidden files -->
          <button
            class="mobile-file-manager__action-btn"
            :class="{ 'mobile-file-manager__action-btn--active': fmStore.showHidden }"
            :title="fmStore.showHidden ? '隐藏隐藏文件' : '显示隐藏文件'"
            @click="fmStore.toggleShowHidden"
          >
            <svg
              v-if="!fmStore.showHidden"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg
              v-else
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="3" y1="3" x2="21" y2="21" />
              <path d="M10.6 5.6A9.7 9.7 0 0122 12s-1.7 3.8-4.7 5.8" />
              <path d="M6.1 6.1A10.5 10.5 0 002 12s4 7 10 7a9.7 9.7 0 005.9-2" />
              <path d="M9.2 9.2a3 3 0 004.6 4.6" />
            </svg>
          </button>
          <!-- Grid / List toggle -->
          <button
            class="mobile-file-manager__action-btn"
            :title="mobileViewMode === 'grid' ? t('fm.listView') : t('fm.gridView')"
            @click="mobileViewMode = mobileViewMode === 'grid' ? 'list' : 'grid'"
          >
            <!-- List icon (shown when in grid mode) -->
            <svg
              v-if="mobileViewMode === 'grid'"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            >
              <line x1="9" y1="6" x2="20" y2="6" />
              <line x1="9" y1="12" x2="20" y2="12" />
              <line x1="9" y1="18" x2="20" y2="18" />
              <circle cx="4.5" cy="6" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="4.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="4.5" cy="18" r="1.5" fill="currentColor" stroke="none" />
            </svg>
            <!-- Grid icon (shown when in list mode) -->
            <svg
              v-else
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed, watch } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useFileManagerOps } from '../../composables/useFileManagerOps'
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
import { useAuthStore } from '../../../stores/authStore'
import { config } from '../../../config'

interface Props {
  visible: boolean
  windowInstance?: any
  data?: any
}

interface ContextAction {
  id: string
  label: string
  danger?: boolean
  fn: () => void
}

const props = defineProps<Props>()
defineEmits<{ close: [] }>()

const i18n = useI18n()
const { t } = i18n

// Wire i18n to file manager store
setFileManagerI18n({ t: i18n.t })

const {
  fmStore,
  createFile,
  createFolder,
  deleteFile,
  renameFile,
  writeFile,
  uploadLocalFiles,
  formatSize,
  ensureDirectory,
  isImageFile,
  isAudioFile,
  isVideoFile,
  isTextFile,
} = useFileManagerOps()
const authStore = useAuthStore()

// Navigate to initial path if provided
const initialPath = props.data?.initialPath || props.windowInstance?.config?.data?.initialPath
if (initialPath) {
  fmStore.navigateTo(initialPath)
}

watch(
  () => props.data?.initialPath || props.windowInstance?.config?.data?.initialPath,
  (newPath) => {
    if (newPath) {
      fmStore.navigateTo(newPath)
    }
  }
)
const mobileViewMode = ref<'grid' | 'list'>('grid')
const cloudSyncing = ref(false)
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

// Audio Player
const audioPlayerVisible = ref(false)
const playingAudioFile = ref<any>(null)

// Video Player
const videoPlayerVisible = ref(false)
const playingVideoFile = ref<any>(null)

// Context Menu State
const contextSheetVisible = ref(false)
const contextSheetTitle = ref('')
const contextActions = ref<ContextAction[]>([])
const contextTargetFile = ref<any>(null)
// const listRef = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
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

  const { localSuccess, localFail, files: localFiles } = await uploadLocalFiles(files, true)
  let cloudSuccess = 0
  let cloudFail = 0

  for (const { file, path } of localFiles) {
    try {
      if (authStore.userId) {
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('path', path)
          const response = await authStore.authFetch(`${config.api.workerUrl}/files/upload`, {
            method: 'POST',
            body: formData,
          })
          if (response.ok) {
            cloudSuccess++
          } else {
            const data = await response.json().catch(() => ({}))
            console.error('[FileManager] Cloud upload failed:', data.error || response.statusText)
            cloudFail++
          }
        } catch (err) {
          console.error('[FileManager] Cloud upload error:', err)
          cloudFail++
        }
      }
    } catch (error) {
      console.error('[FileManager] Cloud upload wrapper failed:', error)
    }
  }

  input.value = ''

  const messages: string[] = []
  if (localSuccess > 0) messages.push(`本地 ${localSuccess} 个文件`)
  if (localFail > 0) messages.push(`本地失败 ${localFail} 个`)
  if (cloudSuccess > 0) messages.push(`云端 ${cloudSuccess} 个文件`)
  if (cloudFail > 0) messages.push(`云端失败 ${cloudFail} 个`)
  if (messages.length > 0) {
    alert(messages.join('，'))
  }
}

async function syncFromCloud(): Promise<void> {
  if (!authStore.userId || cloudSyncing.value) return
  cloudSyncing.value = true
  try {
    const response = await authStore.authFetch(`${config.api.workerUrl}/files`)
    if (!response.ok) {
      alert(t('fm.syncFailed') || 'Cloud sync failed')
      return
    }
    const result = await response.json()
    const cloudFiles = result.data || []
    let success = 0
    let fail = 0
    for (const file of cloudFiles) {
      try {
        const downloadRes = await authStore.authFetch(
          `${config.api.workerUrl}/files/${encodeURIComponent(file.key)}`
        )
        if (!downloadRes.ok) {
          fail++
          continue
        }
        const blob = await downloadRes.blob()
        const contentType = file.contentType || ''
        const isText =
          contentType.startsWith('text/') ||
          /\.(txt|md|json|js|ts|css|html|vue|xml|yaml|csv)$/i.test(file.key)
        const content = isText
          ? await blob.text()
          : await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(blob)
            })
        const path = `/home/scp/downloads/${file.key}`
        const dirPath = path.substring(0, path.lastIndexOf('/'))
        if (dirPath && !ensureDirectory(dirPath)) {
          fail++
          continue
        }
        const existingNode = filesystem.getNodeByPath(path)
        let ok = false
        if (existingNode && existingNode.type === 'file') {
          ok = filesystem.writeFile(path, content)
        } else {
          ok = filesystem.createFile(path, content)
        }
        if (ok) {
          success++
        } else {
          fail++
        }
      } catch {
        fail++
      }
    }
    fmStore.loadDirectory(fmStore.currentPath)
    const messages: string[] = []
    if (success > 0) messages.push(`同步成功 ${success} 个文件`)
    if (fail > 0) messages.push(`同步失败 ${fail} 个`)
    if (messages.length > 0) {
      alert(messages.join('，'))
    } else {
      alert(t('fm.syncNoFiles') || 'No cloud files to sync')
    }
  } catch (err) {
    console.error('[FileManager] Cloud sync error:', err)
    alert(t('fm.syncFailed') || 'Cloud sync failed')
  } finally {
    cloudSyncing.value = false
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
    try {
      createFile(name, '')
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
    try {
      createFolder(name)
    } catch (error) {
      console.error('[FileManager] Failed to create folder:', error)
    }
  }
}

function onFileContextMenu(_event: MouseEvent, file: any) {
  contextTargetFile.value = file
  contextSheetTitle.value = file.name

  const isImage = isImageFile(file.name)
  const isAudio = isAudioFile(file.name)
  const isVideo = isVideoFile(file.name)
  const isText = isTextFile(file.name)

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

  if (isAudio) {
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

  if (isVideo) {
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
          try {
            renameFile(file.name, newName)
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
          try {
            deleteFile(file.name)
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
    writeFile(path, data.content)
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

  const { localSuccess, localFail, files: localFiles } = await uploadLocalFiles(files, true)
  let cloudSuccess = 0
  let cloudFail = 0

  for (const { file, path } of localFiles) {
    try {
      if (authStore.userId) {
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('path', path)
          const response = await authStore.authFetch(`${config.api.workerUrl}/files/upload`, {
            method: 'POST',
            body: formData,
          })
          if (response.ok) {
            cloudSuccess++
          } else {
            const data = await response.json().catch(() => ({}))
            console.error('[FileManager] Cloud upload failed:', data.error || response.statusText)
            cloudFail++
          }
        } catch (err) {
          console.error('[FileManager] Cloud upload error:', err)
          cloudFail++
        }
      }
    } catch (error) {
      console.error('[FileManager] Cloud upload wrapper failed:', error)
    }
  }

  const messages: string[] = []
  if (localSuccess > 0) messages.push(`本地 ${localSuccess} 个文件`)
  if (localFail > 0) messages.push(`本地失败 ${localFail} 个`)
  if (cloudSuccess > 0) messages.push(`云端 ${cloudSuccess} 个文件`)
  if (cloudFail > 0) messages.push(`云端失败 ${cloudFail} 个`)
  if (messages.length > 0) {
    alert(messages.join('，'))
  }
}
</script>

<style scoped>
/* ── Spinner ────────────────────────────────────────────────────────── */
.mobile-file-manager__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--gui-border-default, #2a2a2a);
  border-top-color: var(--gui-text-primary, #ffffff);
  border-radius: 50%;
  animation: mobile-fm-spin 0.8s linear infinite;
}
@keyframes mobile-fm-spin {
  to {
    transform: rotate(360deg);
  }
}

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
  min-width: 0;
  overflow: hidden;
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
