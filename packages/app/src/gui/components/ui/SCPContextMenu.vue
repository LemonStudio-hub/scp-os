<template>
  <Teleport to="body">
    <Transition name="context-menu">
      <div
        v-if="visible"
        class="scp-context-menu"
        :style="{ left: `${x}px`, top: `${y}px` }"
        @click.stop
      >
        <template v-for="item in items" :key="item.id">
          <div v-if="item.divider" class="scp-context-menu__divider" />
          <button
            v-else
            :class="['scp-context-menu__item', { 'scp-context-menu__item--disabled': item.disabled }]"
            :disabled="item.disabled"
            @click="onItemClick(item)"
          >
            <span v-if="item.icon" class="scp-context-menu__icon">{{ item.icon }}</span>
            <span class="scp-context-menu__label">{{ item.label }}</span>
          </button>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import type { ContextMenuItem } from '../../types'

interface Props {
  visible: boolean
  x: number
  y: number
  items: ContextMenuItem[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select': [item: ContextMenuItem]
}>()

function onItemClick(item: ContextMenuItem) {
  if (item.disabled) return
  emit('select', item)
  item.action?.()
  emit('update:visible', false)
}

function handleClickOutside() {
  if (props.visible) {
    emit('update:visible', false)
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* ── Glass Panel ───────────────────────────────────────────────────── */
.scp-context-menu {
  position: fixed;
  min-width: 180px;
  padding: var(--gui-spacing-xs, 4px);
  background: var(--gui-glass-bg, rgba(16, 16, 16, 0.75));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--gui-glass-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-lg, 12px);
  box-shadow: var(--gui-glass-shadow, 0 8px 32px rgba(0, 0, 0, 0.5));
  z-index: var(--gui-z-context-menu, 500);
  max-height: 80vh;
  overflow-y: auto;
}

/* ── Menu Item ─────────────────────────────────────────────────────── */
.scp-context-menu__item {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  width: 100%;
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-md, 12px);
  background: none;
  border: none;
  border-radius: var(--gui-radius-sm, 6px);
  color: var(--gui-text-primary, #f0f0f0);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--gui-font-sm, 12px);
  cursor: pointer;
  transition: background var(--gui-transition-fast, 120ms ease);
  text-align: left;
}

.scp-context-menu__item:hover:not(.scp-context-menu__item--disabled) {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
}

.scp-context-menu__item--disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.scp-context-menu__divider {
  height: 1px;
  background: var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  margin: var(--gui-spacing-xxs, 2px) var(--gui-spacing-xs, 4px);
}

.scp-context-menu__icon {
  font-size: 14px;
  line-height: 1;
  width: 16px;
  text-align: center;
}

.scp-context-menu__label {
  flex: 1;
}

/* ── Animations ─────────────────────────────────────────────────────── */
.context-menu-enter-active {
  animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.context-menu-leave-active {
  animation: slideUp 0.15s cubic-bezier(0.16, 1, 0.3, 1) reverse both;
}
</style>
