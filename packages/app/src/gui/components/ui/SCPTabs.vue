<template>
  <div :class="['scp-tabs', `scp-tabs--${size}`]">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      :class="['scp-tabs__tab', { 'scp-tabs__tab--active': tab.id === activeTabId, 'scp-tabs__tab--dirty': tab.dirty }]"
      @click="$emit('activate', tab.id)"
    >
      <span v-if="tab.icon" class="scp-tabs__icon">{{ tab.icon }}</span>
      <span class="scp-tabs__label">{{ tab.label }}</span>
      <span v-if="tab.dirty" class="scp-tabs__dirty">●</span>
      <button
        v-if="closable"
        class="scp-tabs__close"
        title="Close"
        @click.stop="$emit('close', tab.id)"
      >×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TabItem {
  id: string
  label: string
  icon?: string
  dirty?: boolean
}

interface Props {
  tabs: TabItem[]
  activeTabId?: string
  closable?: boolean
  size?: 'sm' | 'md'
}

withDefaults(defineProps<Props>(), {
  activeTabId: undefined,
  closable: false,
  size: 'sm',
})

defineEmits<{
  activate: [id: string]
  close: [id: string]
}>()
</script>

<style scoped>
.scp-tabs {
  display: flex;
  align-items: stretch;
  background: var(--gui-color-bg-tertiary, #1a1a1a);
  border-bottom: 1px solid var(--gui-color-border-default, #2a2a2a);
  overflow-x: auto;
  overflow-y: hidden;
}

.scp-tabs__tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: none;
  border: none;
  border-right: 1px solid var(--gui-color-border-default, #2a2a2a);
  color: var(--gui-color-text-secondary, #a0a0a0);
  font-family: inherit;
  font-size: var(--gui-font-sm, 12px);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 150ms ease);
  white-space: nowrap;
  position: relative;
}

.scp-tabs__tab:hover {
  background: var(--gui-color-bg-hover, #1e1e1e);
  color: var(--gui-color-text-primary, #e0e0e0);
}

.scp-tabs__tab--active {
  background: var(--gui-color-window-bg, #0d0d0d);
  color: var(--gui-color-text-primary, #e0e0e0);
  font-weight: var(--gui-font-weight-medium, 500);
}

.scp-tabs__tab--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gui-color-border-active, #e94560);
}

.scp-tabs__dirty {
  color: var(--gui-color-warning, #ffff00);
  font-size: 10px;
}

.scp-tabs__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: none;
  border: none;
  border-radius: var(--gui-radius-full, 9999px);
  color: var(--gui-color-text-muted, #666666);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--gui-transition-fast, 150ms ease);
}

.scp-tabs__close:hover {
  background: var(--gui-color-error, #ff4444);
  color: #fff;
}
</style>
