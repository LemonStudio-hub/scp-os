<template>
  <div class="scp-toolbar">
    <div class="scp-toolbar__inner">
      <button
        v-for="item in items"
        :key="item.id"
        :class="['scp-toolbar__item', {
          'scp-toolbar__item--active': activeTools.includes(item.tool),
          'scp-toolbar__item--disabled': item.disabled,
        }]"
        :disabled="item.disabled"
        :title="item.label"
        @click="$emit('launch', item)"
      >
        <span class="scp-toolbar__icon">{{ item.icon }}</span>
        <span class="scp-toolbar__label">{{ item.label }}</span>
        <span v-if="item.badge && item.badge > 0" class="scp-toolbar__badge">{{ item.badge }}</span>
      </button>

      <div class="scp-toolbar__separator" />

      <!-- System status -->
      <div class="scp-toolbar__status">
        <span class="scp-toolbar__status-dot" :class="`scp-toolbar__status-dot--${status}`"></span>
        <span class="scp-toolbar__status-text">{{ statusText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolType } from '../types'

export interface ToolbarItemDef {
  id: string
  tool: ToolType
  label: string
  icon: string
  badge?: number
  disabled?: boolean
}

interface Props {
  items?: ToolbarItemDef[]
  activeTools?: ToolType[]
  status?: 'online' | 'offline' | 'warning'
  statusText?: string
}

withDefaults(defineProps<Props>(), {
  items: () => defaultItems,
  activeTools: () => [],
  status: 'online',
  statusText: 'System Online',
})

defineEmits<{
  launch: [item: ToolbarItemDef]
}>()

const defaultItems: ToolbarItemDef[] = [
  { id: 'terminal', tool: 'terminal', label: 'Terminal', icon: '⬛' },
  { id: 'files', tool: 'filemanager', label: 'Files', icon: '📁' },
  { id: 'editor', tool: 'editor', label: 'Editor', icon: '📝' },
]
</script>

<style scoped>
.scp-toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--gui-z-toolbar, 200);
  background: var(--gui-color-toolbar-bg, #0a0a0a);
  border-top: 1px solid var(--gui-color-border-default, #2a2a2a);
  backdrop-filter: blur(10px);
}

.scp-toolbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 12px;
  max-width: 1200px;
  margin: 0 auto;
}

.scp-toolbar__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--gui-color-toolbar-item-bg, #1a1a1a);
  border: 1px solid var(--gui-color-border-default, #2a2a2a);
  border-radius: var(--gui-radius-base, 6px);
  color: var(--gui-color-text-primary, #e0e0e0);
  font-family: inherit;
  font-size: var(--gui-font-sm, 12px);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 150ms ease);
  position: relative;
}

.scp-toolbar__item:hover:not(.scp-toolbar__item--disabled) {
  background: var(--gui-color-toolbar-item-hover, #252525);
  border-color: var(--gui-color-border-hover, #3a3a3a);
}

.scp-toolbar__item--active {
  background: var(--gui-color-scp-red, #8b0000);
  border-color: var(--gui-color-scp-red-bright, #e94560);
  color: #fff;
}

.scp-toolbar__item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.scp-toolbar__icon {
  font-size: 14px;
  line-height: 1;
}

.scp-toolbar__label {
  white-space: nowrap;
}

.scp-toolbar__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--gui-color-error, #ff4444);
  border-radius: var(--gui-radius-full, 9999px);
  font-size: 9px;
  font-weight: var(--gui-font-weight-bold, 700);
  color: #fff;
}

.scp-toolbar__separator {
  width: 1px;
  height: 24px;
  background: var(--gui-color-border-default, #2a2a2a);
}

.scp-toolbar__status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-color-text-secondary, #a0a0a0);
}

.scp-toolbar__status-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--gui-radius-full, 9999px);
}

.scp-toolbar__status-dot--online {
  background: var(--gui-color-success, #00ff00);
  box-shadow: 0 0 4px var(--gui-color-success, #00ff00);
}

.scp-toolbar__status-dot--offline {
  background: var(--gui-color-error, #ff4444);
}

.scp-toolbar__status-dot--warning {
  background: var(--gui-color-warning, #ffff00);
  box-shadow: 0 0 4px var(--gui-color-warning, #ffff00);
}

/* Mobile */
@media (max-width: 768px) {
  .scp-toolbar__label {
    display: none;
  }

  .scp-toolbar__item {
    padding: 8px 10px;
  }

  .scp-toolbar__icon {
    font-size: 18px;
  }
}
</style>
