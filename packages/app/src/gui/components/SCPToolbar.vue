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
        >
          <span class="scp-dock__icon">{{ item.icon }}</span>
          <span class="scp-dock__label">{{ item.label }}</span>
          <span v-if="item.badge && item.badge > 0" class="scp-dock__badge">{{ item.badge }}</span>
          <!-- Active indicator dot -->
          <span v-if="activeTools.includes(item.tool)" class="scp-dock__dot" />
        </button>
      </div>

      <div class="scp-dock__divider" />

      <!-- Status -->
      <div class="scp-dock__status">
        <span class="scp-dock__status-dot" :class="`scp-dock__status-dot--${status}`"></span>
        <span class="scp-dock__status-text">{{ statusText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolType } from '../types'

export interface DockItemDef {
  id: string
  tool: ToolType
  label: string
  icon: string
  badge?: number
  disabled?: boolean
}

interface Props {
  items?: DockItemDef[]
  activeTools?: ToolType[]
  status?: 'online' | 'offline' | 'warning'
  statusText?: string
}

withDefaults(defineProps<Props>(), {
  items: () => defaultItems,
  activeTools: () => [],
  status: 'online',
  statusText: 'SCP-OS',
})

defineEmits<{
  launch: [item: DockItemDef]
}>()

const defaultItems: DockItemDef[] = [
  { id: 'terminal', tool: 'terminal', label: 'Terminal', icon: '⬛' },
  { id: 'files', tool: 'filemanager', label: 'Files', icon: '📁' },
  { id: 'editor', tool: 'editor', label: 'Editor', icon: '📝' },
]
</script>

<style scoped>
/* ── Dock Shell ─────────────────────────────────────────────────────── */
.scp-dock {
  position: fixed;
  bottom: var(--gui-spacing-sm, 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--gui-z-toolbar, 200);
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
}

.scp-dock__inner {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-base, 16px);
  background: var(--gui-dock-bg, rgba(12, 12, 12, 0.85));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--gui-dock-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-2xl, 20px);
  box-shadow: var(--gui-shadow-lg, 0 16px 40px rgba(0, 0, 0, 0.6));
}

/* ── Tool Items ─────────────────────────────────────────────────────── */
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
  transition: all var(--gui-transition-base, 200ms cubic-bezier(0.4, 0, 0.2, 1));
  white-space: nowrap;
}

.scp-dock__item:hover:not(.scp-dock__item--disabled) {
  background: var(--gui-dock-item-hover, rgba(255, 255, 255, 0.08));
  color: var(--gui-text-primary, #f0f0f0);
}

.scp-dock__item:active:not(.scp-dock__item--disabled) {
  transform: scale(0.95);
}

.scp-dock__item--active {
  background: var(--gui-dock-item-active, rgba(233, 69, 96, 0.12));
  color: var(--gui-accent, #e94560);
}

.scp-dock__item--disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ── Icon & Label ──────────────────────────────────────────────────── */
.scp-dock__icon {
  font-size: 16px;
  line-height: 1;
  transition: transform var(--gui-transition-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
}

.scp-dock__item:hover .scp-dock__icon {
  transform: scale(1.15);
}

.scp-dock__label {
  letter-spacing: 0.02em;
}

/* ── Active Dot Indicator ──────────────────────────────────────────── */
.scp-dock__dot {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: var(--gui-accent, #e94560);
  border-radius: var(--gui-radius-full, 9999px);
  animation: dotPulse 2s ease-in-out infinite;
}

/* ── Badge ─────────────────────────────────────────────────────────── */
.scp-dock__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 5px;
  background: var(--gui-error, #f87171);
  border-radius: var(--gui-radius-full, 9999px);
  font-size: 10px;
  font-weight: var(--gui-font-weight-bold, 700);
  color: #fff;
  line-height: 1;
}

/* ── Divider ───────────────────────────────────────────────────────── */
.scp-dock__divider {
  width: 1px;
  height: 20px;
  background: var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

/* ── Status ────────────────────────────────────────────────────────── */
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
  background: var(--gui-success, #34d399);
  box-shadow: 0 0 6px var(--gui-success, #34d399);
  animation: dotPulse 2.5s ease-in-out infinite;
}

.scp-dock__status-dot--offline {
  background: var(--gui-error, #f87171);
}

.scp-dock__status-dot--warning {
  background: var(--gui-warning, #fbbf24);
  box-shadow: 0 0 6px var(--gui-warning, #fbbf24);
}

/* ── Mobile ────────────────────────────────────────────────────────── */
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

  .scp-dock__icon {
    font-size: 20px;
  }

  .scp-dock__status-text {
    display: none;
  }
}
</style>
