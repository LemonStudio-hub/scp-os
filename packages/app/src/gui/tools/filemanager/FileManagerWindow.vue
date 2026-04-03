<template>
  <SCPWindow :window-instance="windowInstance" @close="onClose">
    <div class="file-manager">
      <!-- Toolbar -->
      <div class="file-manager__toolbar">
        <SCPBreadcrumbs :segments="fmStore.breadcrumbs" @navigate="fmStore.navigateTo" />
        <div class="file-manager__toolbar-actions">
          <SCPButton variant="ghost" size="sm" icon="📄" title="New File" @click="fmStore.promptNewFile" />
          <SCPButton variant="ghost" size="sm" icon="📁" title="New Folder" @click="fmStore.promptNewFolder" />
          <SCPButton
            :variant="fmStore.viewMode === 'grid' ? 'primary' : 'ghost'"
            size="sm"
            icon="⊞"
            title="Grid View"
            @click="fmStore.setViewMode('grid')"
          />
          <SCPButton
            :variant="fmStore.viewMode === 'list' ? 'primary' : 'ghost'"
            size="sm"
            icon="☰"
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
        class="file-manager__content"
        @contextmenu.prevent="onContextMenu($event)"
        @click="fmStore.clearSelection"
      >
        <!-- Grid View -->
        <div v-if="fmStore.viewMode === 'grid'" class="file-manager__grid">
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
          <div v-if="fmStore.sortedFiles.length === 0" class="file-manager__empty">
            <span>📂</span>
            <p>This folder is empty</p>
          </div>
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
        <div v-if="fmStore.viewMode === 'list' && fmStore.sortedFiles.length === 0" class="file-manager__empty">
          <span>📂</span>
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
    // Open file in text editor
    openInEditor(file)
  }
}

function openInEditor(file: FileItem): void {
  // Check if editor window is already open
  const existingEditor = wmStore.getWindowByTool('editor')
  if (existingEditor) {
    wmStore.focusWindow(existingEditor.config.id)
    // TODO: Send event to editor to open file
    return
  }

  // Open new editor window
  wmStore.openWindow({
    id: `editor-${Date.now()}`,
    tool: 'editor',
    title: file.name,
    icon: '📝',
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
  // Context menu items have their own action handlers in the store
  console.log('[FileManager] Context menu select:', item.label)
}

function onClose(): void {
  // Window manager handles cleanup
}
</script>

<style scoped>
.file-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-color-window-bg, #0d0d0d);
}

.file-manager__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid var(--gui-color-border-default, #2a2a2a);
}

.file-manager__toolbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.file-manager__search {
  padding: 8px;
  border-bottom: 1px solid var(--gui-color-border-default, #2a2a2a);
}

.file-manager__content {
  flex: 1;
  overflow: auto;
  padding: 12px;
  position: relative;
}

/* Grid View */
.file-manager__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 12px;
}

.file-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: var(--gui-radius-base, 6px);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 150ms ease);
  text-align: center;
}

.file-grid-item:hover {
  background: var(--gui-color-bg-hover, #1e1e1e);
}

.file-grid-item--selected {
  background: var(--gui-color-file-selected, #1e1e2e);
  outline: 1px solid var(--gui-color-border-active, #e94560);
}

.file-grid-item__name {
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-color-text-primary, #e0e0e0);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-grid-item__size {
  font-size: 10px;
  color: var(--gui-color-text-muted, #666666);
}

/* List View */
.file-manager__list {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--gui-font-sm, 12px);
}

.file-manager__list th {
  text-align: left;
  padding: 6px 12px;
  background: var(--gui-color-bg-tertiary, #1a1a1a);
  color: var(--gui-color-text-secondary, #a0a0a0);
  font-weight: var(--gui-font-weight-semibold, 600);
  border-bottom: 1px solid var(--gui-color-border-default, #2a2a2a);
  cursor: pointer;
  user-select: none;
  transition: color var(--gui-transition-fast, 150ms ease);
}

.file-manager__list th:hover {
  color: var(--gui-color-text-primary, #e0e0e0);
}

.file-manager__list tr {
  border-bottom: 1px solid var(--gui-color-border-default, #2a2a2a);
}

.file-manager__list-row--selected {
  background: var(--gui-color-file-selected, #1e1e2e);
}

.file-manager__list td {
  padding: 6px 12px;
  color: var(--gui-color-text-primary, #e0e0e0);
}

.file-list-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Empty State */
.file-manager__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: var(--gui-color-text-muted, #666666);
  font-size: var(--gui-font-sm, 12px);
  text-align: center;
}

.file-manager__empty span {
  font-size: 48px;
  margin-bottom: 12px;
}

/* Mobile */
@media (max-width: 768px) {
  .file-manager__grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 8px;
  }
}
</style>
