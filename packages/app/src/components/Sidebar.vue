<template>
  <div 
    class="sidebar" 
    :class="{ 'sidebar-open': isOpen }"
    @click="handleBackdropClick"
  >
    <div class="sidebar-content" @click.stop>
      <div class="sidebar-header">
        <h2>Tabs</h2>
        <button 
          class="btn-icon" 
          @click="handleClose" 
          aria-label="Close sidebar"
        >
          &times;
        </button>
      </div>

      <div class="sidebar-actions">
        <button 
          class="btn-primary" 
          @click="handleCreateTab"
          :disabled="tabs.length >= 10"
        >
          + New Tab
        </button>
      </div>

      <div class="tabs-list">
        <div 
          v-for="tab in sortedTabs" 
          :key="tab.id"
          class="tab-item"
          :class="{ 
            'tab-active': tab.isActive, 
            'tab-locked': tab.isLocked 
          }"
          @click="handleTabClick(tab.id)"
        >
          <div class="tab-main">
            <span class="tab-icon">
              {{ tab.isLocked ? 'Locked' : '' }}
            </span>
            <input
              v-if="editingTabId === tab.id"
              v-model="tempTitle"
              @blur="handleRenameComplete"
              @keyup.enter="handleRenameComplete"
              @keyup.esc="handleRenameCancel"
              ref="renameInput"
              class="tab-title-input"
              maxlength="20"
            />
            <span v-else class="tab-title" @dblclick="handleRenameStart(tab)">
              {{ tab.title }}
            </span>
          </div>

          <div class="tab-actions">
            <button 
              v-if="!tab.isLocked"
              class="btn-icon btn-small"
              @click.stop="handleCloseTab(tab.id)"
              aria-label="Close tab"
            >
              &times;
            </button>
          </div>
        </div>

        <div v-if="tabs.length === 0" class="empty-state">
          <p>No tabs</p>
          <button class="btn-secondary" @click="handleCreateTab">
            Create First Tab
          </button>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="tabs-count">
          {{ tabs.length }} / 10 tabs
        </div>
        <button 
          class="btn-secondary btn-small"
          @click="handleCleanup"
          title="Clean up unused tabs (7 days)"
        >
          Cleanup
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useTabsStore } from '../stores/tabs'
import type { Tab } from '../stores/tabs'
import indexedDBService from '../utils/indexedDB'

const tabsStore = useTabsStore()

const isOpen = computed(() => tabsStore.sidebarOpen)
const tabs = computed(() => tabsStore.tabs)

const editingTabId = ref<string>('')
const tempTitle = ref<string>('')
const renameInput = ref<HTMLInputElement>()

// Tabs sorted by creation time
const sortedTabs = computed(() => {
  return [...tabs.value].sort((a, b) => a.createdAt - b.createdAt)
})

// Close sidebar
const handleClose = () => {
  tabsStore.closeSidebar()
}

// Handle backdrop click (close sidebar)
const handleBackdropClick = () => {
  handleClose()
}

// Create new tab
const handleCreateTab = () => {
  if (tabs.value.length >= 10) {
    return
  }
  tabsStore.createTab()
}

// Switch tab
const handleTabClick = (tabId: string) => {
  tabsStore.switchTab(tabId)
  handleClose()
}

// Close tab
const handleCloseTab = async (tabId: string) => {
  const success = tabsStore.closeTab(tabId)
  
  // Delete terminal state from IndexedDB if tab was closed
  if (success) {
    try {
      await indexedDBService.deleteTerminalState(tabId)
    } catch (error) {
      console.error('[Sidebar] Failed to delete terminal state:', error)
    }
  }
}

// Start rename
const handleRenameStart = (tab: Tab) => {
  editingTabId.value = tab.id
  tempTitle.value = tab.title
  nextTick(() => {
    renameInput.value?.focus()
    renameInput.value?.select()
  })
}

// Complete rename
const handleRenameComplete = () => {
  if (editingTabId.value && tempTitle.value.trim()) {
    tabsStore.renameTab(editingTabId.value, tempTitle.value.trim())
  }
  editingTabId.value = ''
  tempTitle.value = ''
}

// Cancel rename
const handleRenameCancel = () => {
  editingTabId.value = ''
  tempTitle.value = ''
}

// Clean up old tabs
const handleCleanup = () => {
  const beforeCount = tabs.value.length
  tabsStore.cleanupOldTabs()
  const afterCount = tabs.value.length
  
  if (beforeCount !== afterCount) {
    console.log(`[Sidebar] Cleaned up ${beforeCount - afterCount} old tabs`)
  }
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.sidebar-open {
  opacity: 1;
  visibility: visible;
}

.sidebar-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 320px;
  height: 100%;
  background: #0a0a0a;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.5);
}

.sidebar-open .sidebar-content {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #2a2a2a;
  background: #1a1a1a;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
  font-weight: 600;
}

.sidebar-actions {
  padding: 15px 20px;
  border-bottom: 1px solid #2a2a2a;
}

.tabs-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.tab-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  margin-bottom: 8px;
  background: #1a1a1a;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.tab-item:hover {
  background: #2a2a2a;
  transform: translateX(2px);
}

.tab-active {
  border-color: #ffffff;
  background: #2a2a2a;
}

.tab-locked {
  opacity: 0.9;
}

.tab-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.tab-icon {
  font-size: 16px;
  flex-shrink: 0;
  color: #ffffff;
}

.tab-title {
  font-size: 14px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-title-input {
  font-size: 14px;
  padding: 4px 8px;
  background: #0a0a0a;
  border: 1px solid #2a2a2a;
  border-radius: 4px;
  color: #ffffff;
  width: 100%;
  outline: none;
}

.tab-actions {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}

.sidebar-footer {
  padding: 15px 20px;
  border-top: 1px solid #2a2a2a;
  background: #1a1a1a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.tabs-count {
  font-size: 12px;
  color: #ffffff;
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #ffffff;
}

.empty-state p {
  margin: 0 0 15px 0;
}

/* Button styles */
.btn-primary {
  width: 100%;
  padding: 10px;
  background: #2a2a2a;
  color: #ffffff;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #3a3a3a;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 8px 12px;
  background: #1a1a1a;
  color: #ffffff;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
}

.btn-secondary:hover {
  background: #2a2a2a;
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.2s ease;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-small {
  width: 28px;
  height: 28px;
  font-size: 14px;
}

/* Scrollbar styles */
.tabs-list::-webkit-scrollbar {
  width: 6px;
}

.tabs-list::-webkit-scrollbar-track {
  background: #0a0a0a;
}

.tabs-list::-webkit-scrollbar-thumb {
  background: #2a2a2a;
  border-radius: 3px;
}

.tabs-list::-webkit-scrollbar-thumb:hover {
  background: #3a3a3a;
}

/* Responsive design */
@media (max-width: 480px) {
  .sidebar-content {
    width: 280px;
  }

  .sidebar-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .tabs-count {
    text-align: center;
  }

  .btn-secondary {
    width: 100%;
    text-align: center;
  }
}
</style>