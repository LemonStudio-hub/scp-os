<template>
  <Teleport to="body">
    <Transition name="context-menu">
      <div
        v-if="visible"
        ref="menuRef"
        class="pcc-context-menu"
        :style="menuStyle"
        tabindex="-1"
        @click.stop
        @keydown="handleKeydown"
      >
        <template v-for="(item, index) in items" :key="item.id || index">
          <div v-if="item.divider" class="pcc-context-menu__divider" />
          <div v-else-if="item.header" class="pcc-context-menu__header">
            <GUIIcon
              v-if="item.icon"
              :name="item.icon"
              :size="20"
              class="pcc-context-menu__header-icon"
            />
            <div class="pcc-context-menu__header-text">
              <span class="pcc-context-menu__header-label">{{ item.label }}</span>
              <span v-if="item.sublabel" class="pcc-context-menu__header-sublabel">{{
                item.sublabel
              }}</span>
            </div>
          </div>
          <div
            v-else
            :ref="(el) => setItemRef(item.id, el as HTMLElement)"
            :class="[
              'pcc-context-menu__item',
              {
                'pcc-context-menu__item--disabled': item.disabled,
                'pcc-context-menu__item--has-children': item.children && item.children.length > 0,
                'pcc-context-menu__item--checked': item.checked,
              },
            ]"
            :disabled="item.disabled"
            @click="onItemClick(item)"
            @mouseenter="openSubmenu(item)"
            @mouseleave="closeSubmenu"
          >
            <span class="pcc-context-menu__leading">
              <svg
                v-if="item.checked"
                class="pcc-context-menu__check"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <GUIIcon
                v-else-if="item.icon"
                :name="item.icon"
                :size="16"
                class="pcc-context-menu__icon"
              />
            </span>
            <span class="pcc-context-menu__label">{{ item.label }}</span>
            <span v-if="item.children && item.children.length > 0" class="pcc-context-menu__arrow"
              >▸</span
            >
          </div>
        </template>
      </div>
    </Transition>

    <Transition name="submenu">
      <div
        v-if="submenuItem"
        ref="submenuRef"
        class="pcc-context-menu pcc-context-menu__submenu"
        :style="submenuStyle"
        @mouseenter="onSubmenuEnter"
        @mouseleave="onSubmenuLeave"
        @click.stop
      >
        <template v-for="(child, childIndex) in submenuItem.children" :key="child.id || childIndex">
          <div v-if="child.divider" class="pcc-context-menu__divider" />
          <div
            v-else
            :class="[
              'pcc-context-menu__item',
              { 'pcc-context-menu__item--disabled': child.disabled },
            ]"
            :disabled="child.disabled"
            @click="onItemClick(child)"
          >
            <GUIIcon
              v-if="child.icon"
              :name="child.icon"
              :size="16"
              class="pcc-context-menu__icon"
            />
            <span class="pcc-context-menu__label">{{ child.label }}</span>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
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
  select: [item: ContextMenuItem]
}>()

const menuRef = ref<HTMLElement>()
const submenuRef = ref<HTMLElement>()
const submenuOpenId = ref<string | null>(null)
const submenuTimer = ref<number | null>(null)
const itemRefs = new Map<string, HTMLElement>()

function setItemRef(id: string | undefined, el: HTMLElement) {
  if (id && el) {
    itemRefs.set(id, el)
  }
}

const submenuItem = computed(() => {
  if (!submenuOpenId.value) return null
  return (
    props.items.find((i) => i.id === submenuOpenId.value && i.children && i.children.length > 0) ||
    null
  )
})

function onItemClick(item: ContextMenuItem) {
  if (item.disabled || item.header || item.divider) return
  emit('select', item)
  item.action?.()
  emit('update:visible', false)
  submenuOpenId.value = null
}

function openSubmenu(item: ContextMenuItem) {
  if (!item.children || item.children.length === 0) return
  if (submenuTimer.value) {
    clearTimeout(submenuTimer.value)
    submenuTimer.value = null
  }
  submenuTimer.value = window.setTimeout(() => {
    submenuOpenId.value = item.id ?? null
  }, 150)
}

function closeSubmenu() {
  if (submenuTimer.value) {
    clearTimeout(submenuTimer.value)
    submenuTimer.value = null
  }
  submenuTimer.value = window.setTimeout(() => {
    submenuOpenId.value = null
  }, 150)
}

function onSubmenuEnter() {
  if (submenuTimer.value) {
    clearTimeout(submenuTimer.value)
    submenuTimer.value = null
  }
}

function onSubmenuLeave() {
  closeSubmenu()
}

const adjustedPos = ref({ x: 0, y: 0 })
const isPositioned = ref(false)

const menuStyle = computed(() => ({
  left: `${adjustedPos.value.x}px`,
  top: `${adjustedPos.value.y}px`,
  visibility: isPositioned.value ? ('visible' as const) : ('hidden' as const),
}))

const submenuStyle = computed(() => {
  if (!submenuOpenId.value || !submenuItem.value) return { display: 'none' }
  const parentEl = itemRefs.get(submenuOpenId.value)
  if (!parentEl) return { display: 'none' }
  const rect = parentEl.getBoundingClientRect()
  const vw = window.innerWidth
  const padding = 12
  const submenuWidth = 200
  const left = rect.right + 4
  const flip = left + submenuWidth > vw - padding
  return {
    left: flip ? `${rect.left - submenuWidth - 4}px` : `${left}px`,
    top: `${rect.top}px`,
  }
})

function adjustPosition() {
  if (!menuRef.value) return
  const rect = menuRef.value.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const padding = 12
  let x = props.x
  let y = props.y

  if (y + rect.height + padding > vh) {
    y = y - rect.height - padding
  }
  if (x + rect.width + padding > vw) {
    x = x - rect.width - padding
  }
  if (x < padding) {
    x = padding
  }
  if (y < padding) {
    y = padding
  }

  adjustedPos.value = { x, y }
  isPositioned.value = true
}

function handleKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'Escape':
      emit('update:visible', false)
      submenuOpenId.value = null
      break
    case 'ArrowUp':
      break
    case 'ArrowDown':
      break
    case 'ArrowRight':
      break
    case 'ArrowLeft':
      submenuOpenId.value = null
      break
  }
}

function handleClickOutside(event: MouseEvent) {
  if (!props.visible) return
  const target = event.target as Node
  const inMenu = menuRef.value?.contains(target)
  const inSubmenu = submenuRef.value?.contains(target)
  if (!inMenu && !inSubmenu) {
    emit('update:visible', false)
    submenuOpenId.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  if (props.visible && menuRef.value) {
    menuRef.value.focus()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  if (submenuTimer.value) {
    clearTimeout(submenuTimer.value)
  }
})

watch(
  () => [props.visible, props.x, props.y],
  () => {
    isPositioned.value = false
    submenuOpenId.value = null
    adjustedPos.value = { x: props.x, y: props.y }
    if (!props.visible) return
    nextTick(() => {
      requestAnimationFrame(adjustPosition)
    })
  }
)
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
  box-shadow: var(
    --gui-shadow-ios-dropdown,
    0 8px 32px rgba(0, 0, 0, 0.6),
    0 0 1px rgba(255, 255, 255, 0.08)
  );
  z-index: var(--gui-z-context-menu, 500);
  max-height: 80vh;
  overflow-y: auto;
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
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
  color: var(--gui-text-primary, #ffffff);
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

.pcc-context-menu__leading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--gui-text-secondary, #8e8e93);
}

.pcc-context-menu__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: inherit;
}

.pcc-context-menu__check {
  color: var(--gui-accent, #8e8e93);
}

.pcc-context-menu__item--checked .pcc-context-menu__label {
  font-weight: var(--gui-font-weight-semibold, 600);
}

/* ── Header row (non-interactive, identifies the target) ───────────── */
.pcc-context-menu__header {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-base, 12px);
  margin: 1px 2px 4px;
  border-radius: var(--gui-radius-sm, 6px);
  background: linear-gradient(
    180deg,
    var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06)) 0%,
    transparent 100%
  );
  pointer-events: none;
  user-select: none;
}

.pcc-context-menu__header + .pcc-context-menu__item,
.pcc-context-menu__header + .pcc-context-menu__divider {
  margin-top: 0;
}

.pcc-context-menu__header-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--gui-accent, #8e8e93);
}

.pcc-context-menu__header-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pcc-context-menu__header-label {
  font-size: var(--gui-font-base, 13px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-primary, #ffffff);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pcc-context-menu__header-sublabel {
  margin-top: 2px;
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-tertiary, #636366);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  min-width: 200px;
  z-index: calc(var(--gui-z-context-menu, 500) + 1);
}

/* ── Animations ───────────────────────────────────────────────────── */
.context-menu-enter-active {
  animation: contextMenuSpringIn 0.3s
    var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1)) both;
}

.context-menu-leave-active {
  animation: contextMenuFadeOut 0.15s var(--gui-transition-fast, 120ms ease) both;
}

.submenu-enter-active {
  animation: submenuSlideIn 0.2s var(--gui-transition-base, 200ms ease) both;
}

.submenu-leave-active {
  animation: submenuFadeOut 0.12s var(--gui-transition-fast, 120ms ease) both;
}

@keyframes submenuSlideIn {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes submenuFadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
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

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .pcc-context-menu {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.light .pcc-context-menu__submenu {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
</style>
