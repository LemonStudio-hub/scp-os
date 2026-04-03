<template>
  <Teleport to="body">
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
          <span v-if="item.icon" class="scp-context-menu__icon" v-html="item.icon"></span>
          <span class="scp-context-menu__label">{{ item.label }}</span>
        </button>
      </template>
    </div>
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
.scp-context-menu {
  position: fixed;
  min-width: 180px;
  background: var(--gui-color-bg-secondary, #111111);
  border: 1px solid var(--gui-color-border-default, #2a2a2a);
  border-radius: var(--gui-radius-md, 8px);
  box-shadow: var(--gui-shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.6));
  z-index: var(--gui-z-context-menu, 500);
  padding: var(--gui-spacing-xs, 4px);
  max-height: 80vh;
  overflow-y: auto;
}

.scp-context-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  background: none;
  border: none;
  border-radius: var(--gui-radius-sm, 4px);
  color: var(--gui-color-text-primary, #e0e0e0);
  font-family: inherit;
  font-size: var(--gui-font-sm, 12px);
  cursor: pointer;
  transition: background var(--gui-transition-fast, 150ms ease);
  text-align: left;
}

.scp-context-menu__item:hover:not(.scp-context-menu__item--disabled) {
  background: var(--gui-color-bg-hover, #1e1e1e);
}

.scp-context-menu__item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.scp-context-menu__divider {
  height: 1px;
  background: var(--gui-color-border-default, #2a2a2a);
  margin: var(--gui-spacing-xs, 4px) 0;
}

.scp-context-menu__icon {
  display: flex;
  align-items: center;
  width: 16px;
  justify-content: center;
}
</style>
