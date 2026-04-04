<script lang="ts">
import type { ToolType } from '../types'

export interface DockItemDef {
  id: string
  tool: ToolType
  label: string
  iconName: string
  badge?: number
  disabled?: boolean
}

export const defaultDockItems: DockItemDef[] = [
  { id: 'terminal', tool: 'terminal', label: 'Terminal', iconName: 'terminal' },
  { id: 'files', tool: 'filemanager', label: 'Files', iconName: 'folder' },
  { id: 'editor', tool: 'editor', label: 'Editor', iconName: 'edit' },
]
</script>

<script setup lang="ts">
import GUIIcon from './ui/GUIIcon.vue'

interface Props {
  items?: DockItemDef[]
  activeTools?: ToolType[]
  status?: 'online' | 'offline' | 'warning'
  statusText?: string
}

withDefaults(defineProps<Props>(), {
  items: () => defaultDockItems,
  activeTools: () => [],
  status: 'online',
  statusText: 'SCP-OS',
})

defineEmits<{
  launch: [item: DockItemDef]
}>()

function onTap(_item: DockItemDef) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10)
  }
}
</script>

<template>
  <div class="scp-dock">
    <div class="scp-dock__inner">
      <div class="scp-dock__group">
        <button
          v-for="item in items"
          :key="item.id"
          :class="['scp-dock__item', {
            'scp-dock__item--active': activeTools.includes(item.tool),
            'scp-dock__item--disabled': item.disabled,
          }]"
          :disabled="item.disabled"
          :title="item.label"
          @click="$emit('launch', item)"
          @touchstart="onTap(item)"
        >
          <GUIIcon :name="item.iconName as any" :size="24" class="scp-dock__icon" />
          <span class="scp-dock__label">{{ item.label }}</span>
          <span v-if="item.badge && item.badge > 0" class="scp-dock__badge">{{ item.badge }}</span>
          <span v-if="activeTools.includes(item.tool)" class="scp-dock__dot" />
        </button>
      </div>

      <div class="scp-dock__divider" />

      <div class="scp-dock__status">
        <span class="scp-dock__status-dot" :class="`scp-dock__status-dot--${status}`"></span>
        <span class="scp-dock__status-text">{{ statusText }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scp-dock {
  position: fixed;
  bottom: var(--gui-spacing-sm, 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--gui-z-toolbar, 200);
  animation: dockFadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
}

@keyframes dockFadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(16px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

.scp-dock__inner {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-base, 16px);
  background: var(--gui-glass-bg-strong, rgba(44, 44, 46, 0.85));
  backdrop-filter: blur(30px) saturate(200%);
  -webkit-backdrop-filter: blur(30px) saturate(200%);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-squircle-2xl, 24px);
  box-shadow: var(--gui-shadow-ios-dropdown, 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.08));
}

.scp-dock__group {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
}

.scp-dock__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 6px);
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  background: transparent;
  border: none;
  border-radius: var(--gui-radius-lg, 12px);
  color: var(--gui-text-secondary, #a8a8a8);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}

.scp-dock__item:hover:not(.scp-dock__item--disabled) {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #f0f0f0);
}

.scp-dock__item:active:not(.scp-dock__item--disabled) {
  transform: scale(0.94);
}

.scp-dock__item--active {
  background: var(--gui-accent-soft, rgba(142, 142, 147, 0.12));
  color: var(--gui-accent, #8E8E93);
}

.scp-dock__item--disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.scp-dock__icon {
  display: flex;
  align-items: center;
  transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  color: currentColor;
  will-change: transform;
}

.scp-dock__item:hover .scp-dock__icon {
  transform: scale(1.12);
}

.scp-dock__item:active .scp-dock__icon {
  transform: scale(0.9);
}

.scp-dock__label {
  letter-spacing: 0.02em;
}

.scp-dock__dot {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: var(--gui-accent, #8E8E93);
  border-radius: var(--gui-radius-full, 9999px);
  animation: dotPulse 2s ease-in-out infinite;
}

@keyframes dotPulse {
  0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
  50% { opacity: 0.5; transform: translateX(-50%) scale(0.75); }
}

.scp-dock__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 5px;
  background: var(--gui-error, #FF3B30);
  border-radius: var(--gui-radius-full, 9999px);
  font-size: 10px;
  font-weight: var(--gui-font-weight-bold, 700);
  color: #fff;
  line-height: 1;
  animation: badgePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes badgePop {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

.scp-dock__divider {
  width: 1px;
  height: 20px;
  background: var(--gui-border-subtle, rgba(255, 255, 255, 0.08));
  margin: 0 4px;
}

.scp-dock__status {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 6px);
  padding: 0 var(--gui-spacing-xs, 4px);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-tertiary, #6a6a6a);
  letter-spacing: 0.03em;
}

.scp-dock__status-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--gui-radius-full, 9999px);
  transition: all var(--gui-transition-base, 200ms ease);
}

.scp-dock__status-dot--online {
  background: var(--gui-success, #34C759);
  box-shadow: 0 0 6px var(--gui-success, #34C759);
  animation: dotPulse 2.5s ease-in-out infinite;
}

.scp-dock__status-dot--offline {
  background: var(--gui-error, #FF3B30);
}

.scp-dock__status-dot--warning {
  background: var(--gui-warning, #FFCC00);
  box-shadow: 0 0 6px var(--gui-warning, #FFCC00);
}

@media (max-width: 768px) {
  .scp-dock {
    bottom: var(--gui-spacing-xs, 4px);
  }

  .scp-dock__inner {
    padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  }

  .scp-dock__label {
    display: none;
  }

  .scp-dock__item {
    padding: var(--gui-spacing-sm, 8px);
  }

  .scp-dock__status-text {
    display: none;
  }
}
</style>
