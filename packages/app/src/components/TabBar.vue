<template>
  <div class="tab-bar">
    <div class="tabs-container">
      <div 
        v-for="tab in visibleTabs" 
        :key="tab.id"
        class="tab"
        :class="{ 'tab-active': tab.isActive, 'tab-locked': tab.isLocked }"
        @click="handleTabClick(tab.id)"
      >
        <span class="tab-icon">
          {{ tab.isLocked ? 'Locked' : '' }}
        </span>
        <span class="tab-title" :title="tab.title">
          {{ tab.title }}
        </span>
        <button 
          v-if="!tab.isLocked"
          class="tab-close-btn"
          @click.stop="handleCloseTab(tab.id)"
          aria-label="Close tab"
        >
          &times;
        </button>
      </div>

      <button 
        v-if="tabs.length < 10"
        class="tab-new-btn"
        @click="handleCreateTab"
        aria-label="New tab"
        title="New tab"
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
import indexedDBService from '../utils/indexedDB'

const tabsStore = useTabsStore()

const tabs = computed(() => tabsStore.tabs)
const activeTabId = computed(() => tabsStore.activeTabId)

// Current active tab index
const activeTabIndex = computed(() => {
  return tabs.value.findIndex(tab => tab.id === activeTabId.value)
})

// Visible tabs (max 5, prioritize active tab)
const visibleTabs = computed(() => {
  if (tabs.value.length <= 5) {
    return tabs.value
  }

  const activeIndex = activeTabIndex.value
  const result = [...tabs.value]

  // If active tab is not in first 5, adjust display order
  if (activeIndex >= 5) {
    const activeTab = result.splice(activeIndex, 1)[0]
    result.splice(4, 0, activeTab)
  }

  return result.slice(0, 5)
})

// Switch tab
const handleTabClick = (tabId: string) => {
  tabsStore.switchTab(tabId)
}

// Create new tab
const handleCreateTab = () => {
  tabsStore.createTab()
}

// Close tab
const handleCloseTab = async (tabId: string) => {
  const success = tabsStore.closeTab(tabId)
  
  // Delete terminal state from IndexedDB if tab was closed
  if (success) {
    try {
      await indexedDBService.deleteTerminalState(tabId)
    } catch (error) {
      console.error('[TabBar] Failed to delete terminal state:', error)
    }
  }
}
</script>

<style scoped>
/* ── Tab Bar Container ───────────────────────────────────────────── */
.tab-bar {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: var(--gui-glass-bg, rgba(28, 28, 30, 0.75));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  gap: 8px;
  height: 44px;
  overflow: hidden;
  flex-shrink: 0;
}

.tabs-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.tabs-container::-webkit-scrollbar {
  display: none;
}

/* ── Tab Pills — iOS Safari Style ────────────────────────────────── */
.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--gui-bg-surface-raised, #3A3A3C);
  border: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-lg, 12px);
  cursor: pointer;
  transition: transform 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1),
              background 120ms ease,
              border-color 120ms ease,
              box-shadow 120ms ease;
  min-width: 0;
  max-width: 160px;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
  position: relative;
  overflow: hidden;
}

.tab::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0);
  transition: background 120ms ease;
  border-radius: inherit;
  pointer-events: none;
}

.tab:hover::after {
  background: rgba(255, 255, 255, 0.04);
}

.tab:active {
  transform: scale(0.96);
}

.tab-active {
  background: var(--gui-accent-soft, rgba(142, 142, 147, 0.15));
  border-color: var(--gui-accent, rgba(142, 142, 147, 0.4));
  box-shadow: 0 0 0 0.5px var(--gui-accent, rgba(142, 142, 147, 0.3)),
              0 2px 8px rgba(142, 142, 147, 0.1);
}

.tab-active::after {
  background: rgba(255, 255, 255, 0.06);
}

.tab-locked {
  opacity: 0.6;
}

.tab-icon {
  font-size: 12px;
  flex-shrink: 0;
  color: var(--gui-text-tertiary, #636366);
  opacity: 0.7;
}

.tab-active .tab-icon {
  color: var(--gui-accent, #8E8E93);
  opacity: 1;
}

.tab-title {
  font-size: 13px;
  font-weight: 400;
  color: var(--gui-text-secondary, #8E8E93);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  transition: color 120ms ease;
}

.tab-active .tab-title {
  color: var(--gui-text-primary, #FFFFFF);
  font-weight: 500;
}

/* ── Tab Close Button ────────────────────────────────────────────── */
.tab-close-btn {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  color: var(--gui-text-secondary, #8E8E93);
  border: none;
  border-radius: var(--gui-radius-full, 999px);
  cursor: pointer;
  font-size: 11px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 120ms ease,
              background 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1),
              transform 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1);
  -webkit-tap-highlight-color: transparent;
}

.tab:hover .tab-close-btn {
  opacity: 1;
}

.tab-close-btn:hover {
  background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.12));
}

.tab-close-btn:active {
  transform: scale(0.88);
}

/* ── New Tab Button ──────────────────────────────────────────────── */
.tab-new-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gui-bg-surface-raised, #3A3A3C);
  color: var(--gui-accent, #8E8E93);
  border: 1px dashed var(--gui-border-strong, rgba(255, 255, 255, 0.12));
  border-radius: var(--gui-radius-lg, 12px);
  cursor: pointer;
  font-size: 16px;
  font-weight: 300;
  flex-shrink: 0;
  transition: transform 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1),
              background 120ms ease,
              border-color 120ms ease;
  -webkit-tap-highlight-color: transparent;
}

.tab-new-btn:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  border-color: var(--gui-accent, rgba(142, 142, 147, 0.3));
}

.tab-new-btn:active {
  transform: scale(0.92);
}

/* ── Tab Info ────────────────────────────────────────────────────── */
.tab-info {
  flex-shrink: 0;
  padding-left: 4px;
}

.tab-count {
  font-size: 11px;
  font-weight: 500;
  color: var(--gui-text-tertiary, #636366);
  padding: 4px 8px;
  background: var(--gui-bg-surface-raised, rgba(58, 58, 60, 0.6));
  border-radius: var(--gui-radius-full, 999px);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .tab-bar {
    padding: 6px 8px;
    height: 40px;
  }

  .tab {
    padding: 5px 10px;
    max-width: 130px;
  }

  .tab-title {
    font-size: 12px;
  }

  .tab-close-btn {
    width: 16px;
    height: 16px;
    font-size: 10px;
  }

  .tab-new-btn {
    width: 26px;
    height: 26px;
    font-size: 14px;
  }

  .tab-count {
    font-size: 10px;
    padding: 3px 6px;
  }
}
</style>