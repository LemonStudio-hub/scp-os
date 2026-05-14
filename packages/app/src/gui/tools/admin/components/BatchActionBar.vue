<template>
  <Transition name="batch-bar">
    <div v-if="selectedCount > 0" class="admin-batch-bar">
      <div class="admin-batch-bar__info">
        <span class="admin-batch-bar__count">已选择 {{ selectedCount }} 项</span>
        <button class="admin-batch-bar__clear" @click="$emit('clear')">清除选择</button>
      </div>
      <div class="admin-batch-bar__actions">
        <button
          v-for="action in actions"
          :key="action.key"
          class="admin-batch-bar__action"
          :class="action.type ? `admin-batch-bar__action--${action.type}` : ''"
          @click="$emit('action', action.key)"
        >
          <svg
            v-if="action.icon === 'delete'"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M2 4H12M5 4V3C5 2.44772 5.44772 2 6 2H8C8.55228 2 9 2.44772 9 3V4M11 4V11C11 11.5523 10.5523 12 10 12H4C3.44772 12 3 11.5523 3 11V4"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            />
          </svg>
          <svg
            v-else-if="action.icon === 'download'"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M7 2V9M7 9L4 6M7 9L10 6M3 11H11"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <svg
            v-else-if="action.icon === 'archive'"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M2 4H12M3 4V11C3 11.5523 3.44772 12 4 12H10C10.5523 12 11 11.5523 11 11V4M5 7H9"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            />
          </svg>
          {{ action.label }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
export interface BatchAction {
  key: string
  label: string
  icon?: string
  type?: 'danger' | 'warning' | 'default'
}

interface Props {
  selectedCount: number
  actions: BatchAction[]
}

defineProps<Props>()

defineEmits<{
  action: [key: string]
  clear: []
}>()
</script>

<style scoped>
.admin-batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px;
  background: var(--gui-bg-surface-raised, #1a1a1a);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 10px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
}

.admin-batch-bar__info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-batch-bar__count {
  font-size: 13px;
  font-weight: 500;
  color: var(--gui-error, #e94560);
  white-space: nowrap;
}

.admin-batch-bar__clear {
  font-size: 12px;
  color: var(--gui-text-tertiary, #6a6a6a);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 120ms ease;
  white-space: nowrap;
}

.admin-batch-bar__clear:hover {
  color: var(--gui-text-secondary, #a0a0a0);
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.admin-batch-bar__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.admin-batch-bar__action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 6px;
  background: var(--gui-bg-surface-raised, #242424);
  color: var(--gui-text-secondary, #a0a0a0);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
}

.admin-batch-bar__action:hover {
  background: var(--gui-bg-surface-hover, #303030);
  color: var(--gui-text-primary, #e0e0e0);
}

.admin-batch-bar__action:active {
  transform: scale(0.96);
}

.admin-batch-bar__action--danger {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.1));
  border-color: rgba(255, 59, 48, 0.2);
  color: var(--gui-error, #ff3b30);
}

.admin-batch-bar__action--danger:hover {
  background: rgba(255, 59, 48, 0.2);
  color: #ff453a;
}

.admin-batch-bar__action--warning {
  background: var(--gui-warning-bg, rgba(255, 204, 0, 0.1));
  border-color: rgba(255, 204, 0, 0.2);
  color: var(--gui-warning, #ffcc00);
}

.admin-batch-bar__action--warning:hover {
  background: rgba(255, 204, 0, 0.2);
  color: #ffd60a;
}

.batch-bar-enter-active {
  transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.batch-bar-leave-active {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.batch-bar-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.batch-bar-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .admin-batch-bar {
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  background: var(--gui-bg-surface, #ffffff);
  border-color: var(--gui-border-default, #e5e5ea);
}
.light .admin-batch-bar__clear:hover {
  color: var(--gui-text-secondary, #666);
}
.light .admin-batch-bar__action {
  color: var(--gui-text-secondary, #666);
}
.light .admin-batch-bar__action:hover {
  background: var(--gui-bg-surface-hover, #f0f0f0);
  color: var(--gui-text-primary, #000);
}
</style>
