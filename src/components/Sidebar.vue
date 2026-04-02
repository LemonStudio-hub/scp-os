<template>
  <div 
    class="sidebar" 
    :class="{ 'sidebar-open': isOpen }"
    @click="handleBackdropClick"
  >
    <div class="sidebar-content" @click.stop>
      <div class="sidebar-header">
        <h2>标签页</h2>
        <button 
          class="btn-icon" 
          @click="handleClose" 
          aria-label="关闭侧边栏"
        >
          ✕
        </button>
      </div>

      <div class="sidebar-actions">
        <button 
          class="btn-primary" 
          @click="handleCreateTab"
          :disabled="tabs.length >= 10"
        >
          + 新建标签页
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
              {{ tab.isLocked ? '🔒' : '📄' }}
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
              aria-label="关闭标签页"
            >
              ✕
            </button>
          </div>
        </div>

        <div v-if="tabs.length === 0" class="empty-state">
          <p>暂无标签页</p>
          <button class="btn-secondary" @click="handleCreateTab">
            创建第一个标签页
          </button>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="tabs-count">
          {{ tabs.length }} / 10 标签页
        </div>
        <button 
          class="btn-secondary btn-small"
          @click="handleCleanup"
          title="清理7天未使用的标签页"
        >
          🧹 清理旧标签
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useTabsStore } from '../stores/tabs'
import type { Tab } from '../stores/tabs'

const tabsStore = useTabsStore()

const isOpen = computed(() => tabsStore.sidebarOpen)
const tabs = computed(() => tabsStore.tabs)

const editingTabId = ref<string>('')
const tempTitle = ref<string>('')
const renameInput = ref<HTMLInputElement>()

// 按创建时间排序的标签页列表
const sortedTabs = computed(() => {
  return [...tabs.value].sort((a, b) => a.createdAt - b.createdAt)
})

// 关闭侧边栏
const handleClose = () => {
  tabsStore.closeSidebar()
}

// 处理背景点击（关闭侧边栏）
const handleBackdropClick = () => {
  handleClose()
}

// 创建新标签页
const handleCreateTab = () => {
  if (tabs.value.length >= 10) {
    return
  }
  tabsStore.createTab()
}

// 切换标签页
const handleTabClick = (tabId: string) => {
  tabsStore.switchTab(tabId)
  handleClose()
}

// 关闭标签页
const handleCloseTab = (tabId: string) => {
  tabsStore.closeTab(tabId)
}

// 开始重命名
const handleRenameStart = (tab: Tab) => {
  editingTabId.value = tab.id
  tempTitle.value = tab.title
  nextTick(() => {
    renameInput.value?.focus()
    renameInput.value?.select()
  })
}

// 完成重命名
const handleRenameComplete = () => {
  if (editingTabId.value && tempTitle.value.trim()) {
    tabsStore.renameTab(editingTabId.value, tempTitle.value.trim())
  }
  editingTabId.value = ''
  tempTitle.value = ''
}

// 取消重命名
const handleRenameCancel = () => {
  editingTabId.value = ''
  tempTitle.value = ''
}

// 清理旧标签页
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
  background: #1a1a2e;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.3);
}

.sidebar-open .sidebar-content {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #333;
  background: #16213e;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  color: #e94560;
  font-weight: 600;
}

.sidebar-actions {
  padding: 15px 20px;
  border-bottom: 1px solid #333;
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
  background: #0f3460;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.tab-item:hover {
  background: #16213e;
  transform: translateX(2px);
}

.tab-active {
  border-color: #e94560;
  background: #16213e;
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
}

.tab-title {
  font-size: 14px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-title-input {
  font-size: 14px;
  padding: 4px 8px;
  background: #1a1a2e;
  border: 1px solid #e94560;
  border-radius: 4px;
  color: #fff;
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
  border-top: 1px solid #333;
  background: #16213e;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tabs-count {
  font-size: 12px;
  color: #888;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #888;
}

.empty-state p {
  margin: 0 0 15px 0;
}

/* 按钮样式 */
.btn-primary {
  width: 100%;
  padding: 10px;
  background: #e94560;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #ff6b6b;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 8px 12px;
  background: #0f3460;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s ease;
}

.btn-secondary:hover {
  background: #16213e;
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.2s ease;
}

.btn-icon:hover {
  background: rgba(233, 69, 96, 0.2);
}

.btn-small {
  width: 28px;
  height: 28px;
  font-size: 14px;
}

/* 滚动条样式 */
.tabs-list::-webkit-scrollbar {
  width: 6px;
}

.tabs-list::-webkit-scrollbar-track {
  background: #1a1a2e;
}

.tabs-list::-webkit-scrollbar-thumb {
  background: #0f3460;
  border-radius: 3px;
}

.tabs-list::-webkit-scrollbar-thumb:hover {
  background: #16213e;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .sidebar-content {
    width: 280px;
  }
}
</style>