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
  background: var(--gui-bg-surface, #0c0c0c);
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
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
  border-right: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.04));
  color: var(--gui-text-tertiary, #6a6a6a);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--gui-font-xs, 11px);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
  white-space: nowrap;
  position: relative;
}

.scp-tabs__tab:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.04));
  color: var(--gui-text-secondary, #a8a8a8);
}

.scp-tabs__tab--active {
  background: var(--gui-bg-surface-raised, #111111);
  color: var(--gui-text-primary, #f0f0f0);
  font-weight: var(--gui-font-weight-medium, 500);
}

.scp-tabs__tab--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: var(--gui-spacing-sm, 8px);
  right: var(--gui-spacing-sm, 8px);
  height: 2px;
  background: var(--gui-accent, #e94560);
  border-radius: var(--gui-radius-full, 9999px);
}

/* ── Dirty Indicator ───────────────────────────────────────────────── */
.scp-tabs__dirty {
  width: 6px;
  height: 6px;
  background: var(--gui-warning, #fbbf24);
  border-radius: var(--gui-radius-full, 9999px);
  flex-shrink: 0;
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
  border-radius: var(--gui-radius-xs, 4px);
  color: var(--gui-text-tertiary, #6a6a6a);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
  flex-shrink: 0;
}

.scp-tabs__close:hover {
  background: var(--gui-error-bg, rgba(248, 113, 113, 0.15));
  color: var(--gui-error, #f87171);
}
</style>
