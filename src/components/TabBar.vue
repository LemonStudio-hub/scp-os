<template>
  <div class="tab-bar">
    <button 
      class="tab-menu-btn"
      @click="handleOpenSidebar"
      aria-label="打开标签菜单"
      title="查看所有标签"
    >
      ☰
    </button>

    <div class="tabs-container">
      <div 
        v-for="tab in visibleTabs" 
        :key="tab.id"
        class="tab"
        :class="{ 'tab-active': tab.isActive, 'tab-locked': tab.isLocked }"
        @click="handleTabClick(tab.id)"
      >
        <span class="tab-icon">
          {{ tab.isLocked ? '🔒' : '📄' }}
        </span>
        <span class="tab-title" :title="tab.title">
          {{ tab.title }}
        </span>
        <button 
          v-if="!tab.isLocked"
          class="tab-close-btn"
          @click.stop="handleCloseTab(tab.id)"
          aria-label="关闭标签"
        >
          ✕
        </button>
      </div>

      <button 
        v-if="tabs.length < 10"
        class="tab-new-btn"
        @click="handleCreateTab"
        aria-label="新建标签"
        title="新建标签页"
      >
        +
      </button>
    </div>

    <div class="tab-info">
      <span v-if="tabs.length > 0" class="tab-count">
        {{ activeTabIndex + 1 }}/{{ tabs.length }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTabsStore } from '../stores/tabs'

const tabsStore = useTabsStore()

const tabs = computed(() => tabsStore.tabs)
const activeTabId = computed(() => tabsStore.activeTabId)

// 当前活动标签的索引
const activeTabIndex = computed(() => {
  return tabs.value.findIndex(tab => tab.id === activeTabId.value)
})

// 可见的标签（最多显示5个，优先显示活动标签）
const visibleTabs = computed(() => {
  if (tabs.value.length <= 5) {
    return tabs.value
  }

  const activeIndex = activeTabIndex.value
  const result = [...tabs.value]

  // 如果活动标签不在前5个，调整显示顺序
  if (activeIndex >= 5) {
    const activeTab = result.splice(activeIndex, 1)[0]
    result.splice(4, 0, activeTab)
  }

  return result.slice(0, 5)
})

// 打开侧边栏
const handleOpenSidebar = () => {
  tabsStore.openSidebar()
}

// 切换标签页
const handleTabClick = (tabId: string) => {
  tabsStore.switchTab(tabId)
}

// 创建新标签页
const handleCreateTab = () => {
  tabsStore.createTab()
}

// 关闭标签页
const handleCloseTab = (tabId: string) => {
  tabsStore.closeTab(tabId)
}
</script>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: #16213e;
  border-bottom: 2px solid #0f3460;
  gap: 8px;
  height: 44px;
  overflow: hidden;
}

.tab-menu-btn {
  width: 36px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f3460;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.tab-menu-btn:hover {
  background: #1a1a2e;
}

.tabs-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs-container::-webkit-scrollbar {
  display: none;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #0f3460;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 0;
  max-width: 180px;
  flex-shrink: 0;
}

.tab:hover {
  background: #1a1a2e;
  transform: translateY(-1px);
}

.tab-active {
  background: #e94560;
}

.tab-active:hover {
  background: #ff6b6b;
}

.tab-locked {
  opacity: 0.95;
}

.tab-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.tab-title {
  font-size: 13px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.tab-close-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease;
}

.tab:hover .tab-close-btn {
  opacity: 1;
}

.tab-close-btn:hover {
  background: rgba(0, 0, 0, 0.4);
}

.tab-new-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(233, 69, 96, 0.3);
  color: #e94560;
  border: 1px dashed #e94560;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.tab-new-btn:hover {
  background: rgba(233, 69, 96, 0.5);
  transform: scale(1.1);
}

.tab-info {
  flex-shrink: 0;
  padding-left: 8px;
}

.tab-count {
  font-size: 12px;
  color: #888;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .tab-bar {
    padding: 6px 8px;
    height: 40px;
  }

  .tab-menu-btn {
    width: 32px;
    height: 28px;
    font-size: 16px;
  }

  .tab {
    padding: 5px 10px;
    max-width: 140px;
  }

  .tab-title {
    font-size: 12px;
  }

  .tab-close-btn {
    width: 18px;
    height: 18px;
    font-size: 10px;
  }

  .tab-new-btn {
    width: 26px;
    height: 26px;
    font-size: 14px;
  }

  .tab-count {
    font-size: 11px;
    padding: 3px 6px;
  }
}
</style>