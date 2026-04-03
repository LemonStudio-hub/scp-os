<template>
  <MobileWindow
    :visible="visible"
    :title="currentFolderName"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="mobile-file-manager">
      <!-- Search -->
      <div class="mobile-file-manager__search">
        <input
          v-model="searchText"
          type="text"
          placeholder="Search files..."
          class="mobile-file-manager__input"
        />
      </div>

      <!-- File List (iOS Settings style) -->
      <div class="mobile-file-manager__list">
        <!-- Parent directory -->
        <button
          v-if="fmStore.currentPath !== '/'"
          class="mobile-file-manager__row"
          @click="fmStore.navigateTo('/')"
        >
          <span class="mobile-file-manager__row-icon">📁</span>
          <span class="mobile-file-manager__row-label">..</span>
          <svg class="mobile-file-manager__chevron" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3L9 7L5 11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- Files and folders -->
        <button
          v-for="file in fmStore.sortedFiles"
          :key="file.name"
          class="mobile-file-manager__row"
          @click="onFileTap(file)"
          @touchstart="onTouchStart(file)"
          @touchend="onTouchEnd(file)"
          @contextmenu.prevent="onLongPress(file)"
        >
          <SCPFileIcon :name="file.name" :is-directory="file.isDirectory" :size="20" />
          <span class="mobile-file-manager__row-label">{{ file.name }}</span>
          <span class="mobile-file-manager__row-meta">{{ file.isDirectory ? '' : formatSize(file.size) }}</span>
          <svg class="mobile-file-manager__chevron" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3L9 7L5 11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- Empty state -->
        <div v-if="fmStore.sortedFiles.length === 0" class="mobile-file-manager__empty">
          <span>📂</span>
          <p>This folder is empty</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mobile-file-manager__actions">
        <button class="mobile-file-manager__action-btn" @click="fmStore.promptNewFile">
          <span>📄</span> New File
        </button>
        <button class="mobile-file-manager__action-btn" @click="fmStore.promptNewFolder">
          <span>📁</span> New Folder
        </button>
      </div>
    </div>

    <!-- Context Menu Bottom Sheet -->
    <MobileBottomSheet
      v-model:visible="contextSheetVisible"
      :title="contextSheetTitle"
      swipe-to-dismiss
    >
      <div class="mobile-file-manager__context">
        <button v-for="action in contextActions" :key="action.id" class="mobile-file-manager__context-item" @click="action.fn">
          <span>{{ action.icon }}</span>
          <span>{{ action.label }}</span>
        </button>
      </div>
    </MobileBottomSheet>
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
import MobileBottomSheet from '../../components/MobileBottomSheet.vue'
import SCPFileIcon from '../../components/ui/SCPFileIcon.vue'
import { useFileManagerStore } from '../../stores/fileManager'
import type { FileItem } from '../../types'

interface Props {
  visible: boolean
}

defineProps<Props>()
defineEmits<{
  close: []
  openEditor: [file: FileItem]
}>()

const fmStore = useFileManagerStore()
const searchText = ref('')
const contextSheetVisible = ref(false)
const contextSheetTitle = ref('')
const contextActions = ref<{ id: string; icon: string; label: string; fn: () => void }[]>([])

let longPressTimer: ReturnType<typeof setTimeout> | null = null

const currentFolderName = computed(() => {
  const path = fmStore.currentPath
  if (path === '/') return 'Root'
  return path.split('/').filter(Boolean).pop() || 'Files'
})

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function onFileTap(file: FileItem): void {
  if (file.isDirectory) {
    fmStore.navigateTo(file.path)
  } else {
    // emit to open in editor
  }
}

function onTouchStart(file: FileItem): void {
  longPressTimer = setTimeout(() => {
    onLongPress(file)
  }, 500)
}

function onTouchEnd(_file: FileItem): void {
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
  contextSheetTitle.value = file.name
  contextActions.value = [
    { id: 'open', icon: '📝', label: 'Open', fn: () => openFile(file) },
    { id: 'rename', icon: '✏️', label: 'Rename', fn: () => {} },
    { id: 'delete', icon: '🗑️', label: 'Delete', fn: () => deleteFile(file) },
  ]
  contextSheetVisible.value = true
}

function openFile(_file: FileItem): void {
  contextSheetVisible.value = false
}

function deleteFile(file: FileItem): void {
  contextSheetVisible.value = false
  fmStore.toggleSelect(file.name)
  fmStore.deleteSelected()
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────── */
.mobile-file-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #060606);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
}

/* ── Search ─────────────────────────────────────────────────────────── */
.mobile-file-manager__search {
  padding: var(--gui-spacing-sm, 8px);
}

.mobile-file-manager__input {
  width: 100%;
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-md, 12px);
  background: var(--gui-bg-surface, #0c0c0c);
  border: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-lg, 12px);
  color: var(--gui-text-primary, #f0f0f0);
  font-size: var(--gui-font-base, 13px);
  outline: none;
  transition: border-color var(--gui-transition-fast, 120ms ease);
}

.mobile-file-manager__input::placeholder {
  color: var(--gui-text-tertiary, #6a6a6a);
}

.mobile-file-manager__input:focus {
  border-color: var(--gui-accent, #e94560);
}

/* ── File List (iOS Settings Style) ─────────────────────────────────── */
.mobile-file-manager__list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 var(--gui-spacing-sm, 8px);
}

.mobile-file-manager__row {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  width: 100%;
  padding: var(--gui-spacing-md, 12px) var(--gui-spacing-sm, 8px);
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

.mobile-file-manager__row:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.mobile-file-manager__row-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--gui-font-base, 13px);
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
  color: var(--gui-text-tertiary, #6a6a6a);
  font-size: var(--gui-font-sm, 12px);
  text-align: center;
}

.mobile-file-manager__empty span {
  font-size: 48px;
  margin-bottom: var(--gui-spacing-base, 16px);
  opacity: 0.5;
}

/* ── Action Buttons ─────────────────────────────────────────────────── */
.mobile-file-manager__actions {
  display: flex;
  gap: var(--gui-spacing-sm, 8px);
  padding: var(--gui-spacing-base, 16px);
  padding-bottom: calc(var(--gui-spacing-base, 16px) + env(safe-area-inset-bottom, 0px));
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.mobile-file-manager__action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--gui-spacing-xs, 4px);
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-md, 12px);
  background: var(--gui-bg-surface-raised, #111111);
  border: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-primary, #f0f0f0);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background var(--gui-transition-fast, 120ms ease);
}

.mobile-file-manager__action-btn:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
}

/* ── Context Sheet ─────────────────────────────────────────────────── */
.mobile-file-manager__context {
  display: flex;
  flex-direction: column;
  gap: var(--gui-spacing-xs, 4px);
}

.mobile-file-manager__context-item {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  padding: var(--gui-spacing-md, 12px);
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
</style>
