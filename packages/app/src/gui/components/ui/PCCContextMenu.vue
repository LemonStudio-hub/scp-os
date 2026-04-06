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
/* ── Context Menu - iOS Frosted Glass Style ────────────────────────── */
.pcc-context-menu {
  position: fixed;
  min-width: 220px;
  padding: var(--gui-spacing-xxs, 2px);
  background: var(--gui-glass-bg-strong, rgba(44, 44, 46, 0.95));
  backdrop-filter: blur(30px) saturate(200%);
  -webkit-backdrop-filter: blur(30px) saturate(200%);
  border: 0.5px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-lg, 12px);
  box-shadow: var(--gui-shadow-ios-dropdown, 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.08));
  z-index: var(--gui-z-context-menu, 500);
  max-height: 80vh;
  overflow-y: auto;
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  animation: contextMenuSpringIn 0.3s var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1)) both;
}

@keyframes contextMenuSpringIn {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ── Menu Item ─────────────────────────────────────────────────────── */
.pcc-context-menu__item {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  width: 100%;
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-base, 16px);
  background: none;
  border: none;
  border-radius: var(--gui-radius-sm, 6px);
  color: var(--gui-text-primary, #FFFFFF);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
  text-align: left;
  position: relative;
  margin: 1px 2px;
  -webkit-tap-highlight-color: transparent;
}

.pcc-context-menu__item:hover:not(.pcc-context-menu__item--disabled) {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
}

.pcc-context-menu__item:active:not(.pcc-context-menu__item--disabled) {
  transform: scale(0.98);
  opacity: 0.8;
}

.pcc-context-menu__item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pcc-context-menu__divider {
  height: 0.5px;
  background: var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  margin: 4px 8px;
}

.pcc-context-menu__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--gui-text-secondary, #8E8E93);
  flex-shrink: 0;
}

.pcc-context-menu__label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pcc-context-menu__arrow {
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
  margin-left: auto;
  font-weight: var(--gui-font-weight-medium, 500);
}

/* ── Submenu ─────────────────────────────────────────────────────── */
.pcc-context-menu__submenu {
  position: absolute;
  top: 0;
  left: calc(100% + 4px);
  min-width: 200px;
  padding: var(--gui-spacing-xxs, 2px);
  background: var(--gui-glass-bg-strong, rgba(44, 44, 46, 0.95));
  backdrop-filter: blur(30px) saturate(200%);
  -webkit-backdrop-filter: blur(30px) saturate(200%);
  border: 0.5px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-lg, 12px);
  box-shadow: var(--gui-shadow-ios-dropdown, 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.08));
  z-index: var(--gui-z-context-menu, 500);
  max-height: 80vh;
  overflow-y: auto;
  animation: submenuFadeIn 0.2s var(--gui-transition-base, 200ms ease) both;
}

@keyframes submenuFadeIn {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ── Animations ───────────────────────────────────────────────────── */
.context-menu-enter-active {
  animation: contextMenuSpringIn 0.3s var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1)) both;
}

.context-menu-leave-active {
  animation: contextMenuFadeOut 0.15s var(--gui-transition-fast, 120ms ease) both;
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
.pcc-context-menu::-webkit-scrollbar,
.pcc-context-menu__submenu::-webkit-scrollbar {
  width: 6px;
}

.pcc-context-menu::-webkit-scrollbar-track,
.pcc-context-menu__submenu::-webkit-scrollbar-track {
  background: transparent;
}

.pcc-context-menu::-webkit-scrollbar-thumb,
.pcc-context-menu__submenu::-webkit-scrollbar-thumb {
  background: var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-sm, 6px);
}

.pcc-context-menu::-webkit-scrollbar-thumb:hover,
.pcc-context-menu__submenu::-webkit-scrollbar-thumb:hover {
  background: var(--gui-border-strong, rgba(255, 255, 255, 0.12));
}
</style>