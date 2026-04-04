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
/* ── Sidebar Backdrop ────────────────────────────────────────────── */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  pointer-events: none;
}

.sidebar-open {
  pointer-events: auto;
}

/* Backdrop fade */
.sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.sidebar-open::before {
  opacity: 1;
}

/* ── Sidebar Panel ───────────────────────────────────────────────── */
.sidebar-content {
  position: relative;
  width: 320px;
  max-width: 85vw;
  height: 100%;
  background: var(--gui-bg-surface, #2C2C2E);
  transform: translateX(-100%);
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  display: flex;
  flex-direction: column;
  box-shadow: var(--gui-shadow-ios-sheet, 0 -10px 40px rgba(0, 0, 0, 0.5));
  will-change: transform;
  overflow: hidden;
}

.sidebar-open .sidebar-content {
  transform: translateX(0);
}

/* Frosted glass header */
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  padding-top: max(16px, env(safe-area-inset-top, 16px));
  background: var(--gui-glass-bg, rgba(44, 44, 46, 0.75));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  flex-shrink: 0;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
  letter-spacing: -0.01em;
}

/* Close button — iOS style */
.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-accent, #8E8E93);
  border: none;
  border-radius: var(--gui-radius-full, 999px);
  cursor: pointer;
  font-size: 20px;
  font-weight: 400;
  transition: transform 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1),
              background 120ms ease,
              opacity 120ms ease;
  -webkit-tap-highlight-color: transparent;
}

.btn-icon:hover {
  background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.1));
}

.btn-icon:active {
  transform: scale(0.9);
}

/* ── Actions Area ────────────────────────────────────────────────── */
.sidebar-actions {
  padding: 16px 20px;
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  flex-shrink: 0;
}

/* ── Tabs List ───────────────────────────────────────────────────── */
.tabs-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  overscroll-behavior: contain;
}

/* Tab item — iOS list style */
.tab-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  margin-bottom: 2px;
  background: var(--gui-bg-surface-raised, #3A3A3C);
  border-radius: var(--gui-radius-md, 10px);
  cursor: pointer;
  transition: transform 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1),
              background 120ms ease;
  border: 1px solid transparent;
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
}

.tab-item:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.tab-item:active {
  transform: scale(0.98);
}

.tab-active {
  background: var(--gui-accent-soft, rgba(142, 142, 147, 0.12));
  border-color: var(--gui-accent, rgba(142, 142, 147, 0.3));
}

.tab-locked {
  opacity: 0.7;
}

.tab-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.tab-icon {
  font-size: 14px;
  flex-shrink: 0;
  color: var(--gui-text-secondary, #8E8E93);
}

.tab-title {
  font-size: 15px;
  font-weight: 400;
  color: var(--gui-text-primary, #FFFFFF);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-title-input {
  font-size: 15px;
  padding: 6px 10px;
  background: var(--gui-bg-base, #1C1C1E);
  border: 1px solid var(--gui-border-strong, rgba(255, 255, 255, 0.12));
  border-radius: var(--gui-radius-sm, 6px);
  color: var(--gui-text-primary, #FFFFFF);
  width: 100%;
  outline: none;
  font-family: var(--gui-font-sans);
  transition: border-color 120ms ease;
}

.tab-title-input:focus {
  border-color: var(--gui-accent, #8E8E93);
}

.tab-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

/* ── Sidebar Footer ──────────────────────────────────────────────── */
.sidebar-footer {
  padding: 16px 20px;
  padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  background: var(--gui-glass-bg, rgba(44, 44, 46, 0.75));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.tabs-count {
  font-size: 13px;
  color: var(--gui-text-secondary, #8E8E93);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: var(--gui-text-secondary, #8E8E93);
}

.empty-state p {
  margin: 0 0 16px 0;
  font-size: 15px;
}

/* ── Button Styles ───────────────────────────────────────────────── */
.btn-primary {
  width: 100%;
  padding: 10px 16px;
  background: var(--gui-accent, #8E8E93);
  color: var(--gui-text-inverse, #000000);
  border: none;
  border-radius: var(--gui-radius-md, 10px);
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: transform 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1),
              opacity 120ms ease;
  -webkit-tap-highlight-color: transparent;
}

.btn-primary:hover:not(:disabled) {
  background: var(--gui-accent-hover, #AEAEB2);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 8px 14px;
  background: var(--gui-bg-surface-raised, #3A3A3C);
  color: var(--gui-accent, #8E8E93);
  border: none;
  border-radius: var(--gui-radius-md, 10px);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: transform 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1),
              background 120ms ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
  -webkit-tap-highlight-color: transparent;
}

.btn-secondary:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.btn-secondary:active {
  transform: scale(0.97);
}

.btn-icon.btn-small {
  width: 28px;
  height: 28px;
  font-size: 16px;
}

/* ── Scrollbar ───────────────────────────────────────────────────── */
.tabs-list::-webkit-scrollbar {
  width: 6px;
}

.tabs-list::-webkit-scrollbar-track {
  background: transparent;
}

.tabs-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: var(--gui-radius-full, 999px);
}

.tabs-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .sidebar-content {
    width: 100%;
    max-width: 100%;
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