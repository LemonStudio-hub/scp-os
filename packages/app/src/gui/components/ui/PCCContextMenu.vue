<template>
  <Teleport to="body">
    <Transition name="context-menu">
      <div
        v-if="visible"
        class="pcc-context-menu"
        :style="{ left: `${x}px`, top: `${y}px` }"
        @click.stop
        @keydown="handleKeydown"
        ref="menuRef"
        tabindex="-1"
      >
        <template v-for="(item, index) in items" :key="item.id || index">
          <div v-if="item.divider" class="pcc-context-menu__divider" />
          <div
            v-else
            :class="['pcc-context-menu__item', { 'pcc-context-menu__item--disabled': item.disabled, 'pcc-context-menu__item--has-children': item.children && item.children.length > 0 }]"
            :disabled="item.disabled"
            @click="onItemClick(item)"
            @mouseenter="openSubmenu(item, $event)"
            @mouseleave="closeSubmenu"
          >
            <GUIIcon v-if="item.icon" :name="item.icon" :size="16" class="pcc-context-menu__icon" />
            <span class="pcc-context-menu__label">{{ item.label }}</span>
            <span v-if="item.children && item.children.length > 0" class="pcc-context-menu__arrow">▸</span>
            
            <!-- Submenu -->
            <div
              v-if="item.children && item.children.length > 0 && submenuOpen === item.id"
              class="pcc-context-menu__submenu"
              :style="getSubmenuStyle()"
            >
              <template v-for="(child, childIndex) in item.children" :key="child.id || childIndex">
                <div v-if="child.divider" class="pcc-context-menu__divider" />
                <div
                  v-else
                  :class="['pcc-context-menu__item', { 'pcc-context-menu__item--disabled': child.disabled }]"
                  :disabled="child.disabled"
                  @click="onItemClick(child)"
                >
                  <GUIIcon v-if="child.icon" :name="child.icon" :size="16" class="pcc-context-menu__icon" />
                  <span class="pcc-context-menu__label">{{ child.label }}</span>
                </div>
              </template>
            </div>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import GUIIcon from './GUIIcon.vue'
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

const menuRef = ref<HTMLElement>()
const submenuOpen = ref<string | null>(null)
const submenuTimer = ref<number | null>(null)

function onItemClick(item: ContextMenuItem) {
  if (item.disabled) return
  emit('select', item)
  item.action?.()
  emit('update:visible', false)
  submenuOpen.value = null
}

function openSubmenu(item: ContextMenuItem, _event: MouseEvent) {
  // Clear any existing timer
  if (submenuTimer.value) {
    clearTimeout(submenuTimer.value)
  }
  
  // Open submenu after a short delay
  submenuTimer.value = window.setTimeout(() => {
    submenuOpen.value = item.id
  }, 200)
}

function closeSubmenu() {
  // Clear any existing timer
  if (submenuTimer.value) {
    clearTimeout(submenuTimer.value)
  }
  
  // Close submenu after a short delay
  submenuTimer.value = window.setTimeout(() => {
    submenuOpen.value = null
  }, 100)
}

function getSubmenuStyle() {
  return {
    left: `100%`,
    top: `0px`
  }
}

function handleKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'Escape':
      emit('update:visible', false)
      submenuOpen.value = null
      break
    case 'ArrowUp':
      // Implement keyboard navigation
      break
    case 'ArrowDown':
      // Implement keyboard navigation
      break
    case 'ArrowRight':
      // Open submenu
      break
    case 'ArrowLeft':
      // Close submenu
      submenuOpen.value = null
      break
  }
}

function handleClickOutside(event: MouseEvent) {
  if (props.visible && menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('update:visible', false)
    submenuOpen.value = null
  }
}

function handleContextMenu(event: MouseEvent) {
  // Prevent default context menu
  event.preventDefault()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('contextmenu', handleContextMenu)
  
  // Focus the menu when it becomes visible
  if (props.visible && menuRef.value) {
    menuRef.value.focus()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('contextmenu', handleContextMenu)
  
  // Clear any existing timer
  if (submenuTimer.value) {
    clearTimeout(submenuTimer.value)
  }
})
</script>

<style scoped>
/* ── Context Menu ───────────────────────────────────────────────────── */
.pcc-context-menu {
  position: fixed;
  min-width: 200px;
  padding: 2px 0;
  background: var(--gui-bg-surface, #2d2d2d);
  border: 1px solid var(--gui-border, #444444);
  border-radius: var(--gui-radius-md, 6px);
  box-shadow: var(--gui-shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.3));
  z-index: var(--gui-z-context-menu, 500);
  max-height: 80vh;
  overflow-y: auto;
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
}

/* ── Menu Item ─────────────────────────────────────────────────────── */
.pcc-context-menu__item {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  width: 100%;
  padding: 6px 12px;
  background: none;
  border: none;
  border-radius: 0;
  color: var(--gui-text-primary, #f0f0f0);
  font-size: var(--gui-font-sm, 12px);
  cursor: pointer;
  transition: background var(--gui-transition-fast, 120ms ease);
  text-align: left;
  position: relative;
}

.pcc-context-menu__item:hover:not(.pcc-context-menu__item--disabled) {
  background: var(--gui-bg-surface-hover, #3a3a3a);
}

.pcc-context-menu__item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pcc-context-menu__divider {
  height: 1px;
  background: var(--gui-border-subtle, #444444);
  margin: 2px 0;
}

.pcc-context-menu__icon {
  display: flex;
  align-items: center;
  width: 16px;
  height: 16px;
  color: var(--gui-text-secondary, #a8a8a8);
  flex-shrink: 0;
}

.pcc-context-menu__label {
  flex: 1;
}

.pcc-context-menu__arrow {
  font-size: 10px;
  color: var(--gui-text-secondary, #a8a8a8);
  margin-left: auto;
}

/* ── Submenu ─────────────────────────────────────────────────────── */
.pcc-context-menu__submenu {
  position: absolute;
  top: 0;
  left: 100%;
  min-width: 180px;
  padding: 2px 0;
  background: var(--gui-bg-surface, #2d2d2d);
  border: 1px solid var(--gui-border, #444444);
  border-radius: var(--gui-radius-md, 6px);
  box-shadow: var(--gui-shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.3));
  z-index: var(--gui-z-context-menu, 500);
  max-height: 80vh;
  overflow-y: auto;
}

/* ── Animations ───────────────────────────────────────────────────── */
.context-menu-enter-active {
  animation: contextMenuFadeIn 0.15s ease both;
}

.context-menu-leave-active {
  animation: contextMenuFadeOut 0.1s ease both;
}

@keyframes contextMenuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes contextMenuFadeOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

/* ── Scrollbar ───────────────────────────────────────────────────── */
.pcc-context-menu::-webkit-scrollbar {
  width: 8px;
}

.pcc-context-menu::-webkit-scrollbar-track {
  background: transparent;
}

.pcc-context-menu::-webkit-scrollbar-thumb {
  background: var(--gui-bg-surface-hover, #3a3a3a);
  border-radius: 4px;
}

.pcc-context-menu::-webkit-scrollbar-thumb:hover {
  background: var(--gui-border, #444444);
}
</style>