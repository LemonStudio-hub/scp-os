<template>
  <SCPWindow :window-instance="windowInstance" @close="onClose">
    <div class="file-manager">
      <!-- Toolbar -->
      <div class="file-manager__toolbar">
        <SCPBreadcrumbs :segments="fmStore.breadcrumbs" @navigate="fmStore.navigateTo" />
        <div class="file-manager__toolbar-actions">
          <SCPButton variant="ghost" size="sm" icon="file" title="New File" @click="fmStore.promptNewFile" />
          <SCPButton variant="ghost" size="sm" icon="folder" title="New Folder" @click="fmStore.promptNewFolder" />
          <SCPButton
            :variant="fmStore.viewMode === 'grid' ? 'primary' : 'ghost'"
            size="sm"
            icon="grid"
            title="Grid View"
            @click="fmStore.setViewMode('grid')"
          />
          <SCPButton
            :variant="fmStore.viewMode === 'list' ? 'primary' : 'ghost'"
            size="sm"
            icon="list"
            title="List View"
            @click="fmStore.setViewMode('list')"
          />
        </div>
      </div>

      <!-- Search Bar -->
      <div class="file-manager__search">
        <SCPInput
          v-model="searchText"
          placeholder="Search files..."
          size="sm"
          clearable
        />
      </div>

      <!-- File Grid/List View -->
      <div
        class="file-manager__content gui-scrollable"
        @contextmenu.prevent="onContextMenu($event)"
        @click="fmStore.clearSelection"
      >
        <!-- Grid View -->
        <div v-if="fmStore.viewMode === 'grid'" class="file-manager__grid stagger-children">
          <div
            v-for="file in fmStore.sortedFiles"
            :key="file.name"
            :class="['file-grid-item', { 'file-grid-item--selected': fmStore.selectedFiles.has(file.name) }]"
            @click.stop="onFileClick(file, $event)"
            @dblclick.stop="onFileDblClick(file)"
            @contextmenu.prevent.stop="onFileContextMenu($event, file.name)"
          >
            <SCPFileIcon :name="file.name" :is-directory="file.isDirectory" :size="file.size" />
            <span class="file-grid-item__name">{{ file.name }}</span>
            <span class="file-grid-item__size">{{ formatSize(file.size) }}</span>
          </div>
        </div>

        <!-- Empty state for grid -->
        <div v-if="fmStore.viewMode === 'grid' && fmStore.sortedFiles.length === 0" class="file-manager__empty">
          <GUIIcon name="empty-folder" :size="48" class="file-manager__empty-icon" />
          <p>This folder is empty</p>
        </div>

        <!-- List View -->
        <table v-else class="file-manager__list">
          <thead>
            <tr>
              <th @click="fmStore.setSort('name')">Name</th>
              <th @click="fmStore.setSort('size')">Size</th>
              <th @click="fmStore.setSort('type')">Type</th>
              <th @click="fmStore.setSort('modifiedAt')">Modified</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="file in fmStore.sortedFiles"
              :key="file.name"
              :class="{ 'file-manager__list-row--selected': fmStore.selectedFiles.has(file.name) }"
              @click.stop="onFileClick(file, $event)"
              @dblclick.stop="onFileDblClick(file)"
              @contextmenu.prevent.stop="onFileContextMenu($event, file.name)"
            >
              <td>
                <div class="file-list-name">
                  <SCPFileIcon :name="file.name" :is-directory="file.isDirectory" :size="16" />
                  <span>{{ file.name }}</span>
                </div>
              </td>
              <td>{{ file.isDirectory ? '—' : formatSize(file.size) }}</td>
              <td>{{ file.isDirectory ? 'Folder' : (file.type || 'File').toUpperCase() }}</td>
              <td>{{ formatDate(file.modifiedAt) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Empty state for list -->
        <div v-if="fmStore.viewMode === 'list' && fmStore.sortedFiles.length === 0" class="file-manager__empty">
          <GUIIcon name="empty-folder" :size="48" class="file-manager__empty-icon" />
          <p>This folder is empty</p>
        </div>
      </div>

      <!-- Status Bar -->
      <SCPStatusBar
        :left-items="[`${fmStore.sortedFiles.length} items`]"
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
  </SCPWindow>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import SCPWindow from '../../components/SCPWindow.vue'
import SCPButton from '../../components/ui/SCPButton.vue'
import GUIIcon from '../../components/ui/GUIIcon.vue'
import SCPInput from '../../components/ui/SCPInput.vue'
import SCPBreadcrumbs from '../../components/ui/SCPBreadcrumbs.vue'
import SCPFileIcon from '../../components/ui/SCPFileIcon.vue'
import SCPContextMenu from '../../components/ui/SCPContextMenu.vue'
import SCPStatusBar from '../../components/ui/SCPStatusBar.vue'
import { useFileManagerStore } from '../../stores/fileManager'
import { useWindowManagerStore } from '../../stores/windowManager'
import type { WindowInstance, FileItem, ContextMenuItem } from '../../types'

interface Props {
  windowInstance: WindowInstance
}

defineProps<Props>()

const fmStore = useFileManagerStore()
const wmStore = useWindowManagerStore()
const searchText = ref('')

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
    openInEditor(file)
  }
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
  })
}

function onContextMenu(event: MouseEvent): void {
  fmStore.showContextMenu(event.clientX, event.clientY)
}

function onFileContextMenu(event: MouseEvent, fileName: string): void {
  fmStore.showContextMenu(event.clientX, event.clientY, fileName)
}

function onContextSelect(item: ContextMenuItem): void {
  console.log('[FileManager] Context menu select:', item.label)
}

function onClose(): void {
  // Window manager handles cleanup
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

.file-manager__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gui-spacing-sm, 8px);
  padding: var(--gui-spacing-sm, 8px);
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  background: var(--gui-bg-surface, #0c0c0c);
}

.file-manager__toolbar-actions {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xxs, 2px);
  flex-shrink: 0;
}

.file-manager__search {
  padding: var(--gui-spacing-sm, 8px);
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.file-manager__content {
  flex: 1;
  overflow: auto;
  padding: var(--gui-spacing-base, 16px);
  position: relative;
}

/* ── Grid View ──────────────────────────────────────────────────────── */
.file-manager__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
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

.file-grid-item__name {
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-primary, #f0f0f0);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-grid-item__size {
  font-size: 10px;
  color: var(--gui-text-tertiary, #6a6a6a);
}

/* ── List View ──────────────────────────────────────────────────────── */
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

/* ── Empty State ────────────────────────────────────────────────────── */
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
  .file-manager__grid {
    grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
    gap: var(--gui-spacing-xs, 4px);
  }

  .file-manager__content {
    padding: var(--gui-spacing-sm, 8px);
  }
}
</style>
