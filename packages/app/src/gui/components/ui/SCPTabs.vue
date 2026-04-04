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
      <span v-if="tab.dirty" class="scp-tabs__dirty" />
      <button
        v-if="closable"
        class="scp-tabs__close"
        title="Close"
        @click.stop="$emit('close', tab.id)"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </button>
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
  background: var(--gui-bg-surface, #2C2C2E);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.scp-tabs::-webkit-scrollbar {
  display: none;
}

/* ── Tab ───────────────────────────────────────────────────────────── */
.scp-tabs__tab {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 6px);
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-md, 12px);
  background: none;
  border: none;
  border-right: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.04));
  color: var(--gui-text-tertiary, #636366);
  font-family: var(--gui-font-sans);
  font-size: var(--gui-font-xs, 11px);
  cursor: pointer;
  transition: color 120ms ease,
              background 120ms ease,
              transform 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1);
  white-space: nowrap;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.scp-tabs__tab:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.04));
  color: var(--gui-text-secondary, #8E8E93);
}

.scp-tabs__tab:active {
  transform: scale(0.97);
}

.scp-tabs__tab--active {
  background: var(--gui-bg-surface-raised, #3A3A3C);
  color: var(--gui-text-primary, #FFFFFF);
  font-weight: var(--gui-font-weight-medium, 500);
}

.scp-tabs__tab--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: var(--gui-spacing-sm, 8px);
  right: var(--gui-spacing-sm, 8px);
  height: 2px;
  background: var(--gui-accent, #8E8E93);
  border-radius: var(--gui-radius-full, 9999px);
  animation: tabBarIndicatorIn 0.3s cubic-bezier(0.32, 0.72, 0, 1) both;
}

@keyframes tabBarIndicatorIn {
  from {
    transform: scaleX(0.3);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

/* ── Dirty Indicator ───────────────────────────────────────────────── */
.scp-tabs__dirty {
  width: 6px;
  height: 6px;
  background: var(--gui-warning, #FFCC00);
  border-radius: var(--gui-radius-full, 9999px);
  flex-shrink: 0;
  animation: dirtyPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes dirtyPop {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

/* ── Close Button ──────────────────────────────────────────────────── */
.scp-tabs__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: none;
  border: none;
  border-radius: var(--gui-radius-full, 999px);
  color: var(--gui-text-tertiary, #636366);
  cursor: pointer;
  transition: all 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1);
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.scp-tabs__close:hover {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.15));
  color: var(--gui-error, #FF3B30);
}

.scp-tabs__close:active {
  transform: scale(0.85);
}
</style>
