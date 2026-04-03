<template>
  <div class="mobile-dock">
    <div class="mobile-dock__inner">
      <button
        v-for="item in items"
        :key="item.id"
        :class="['mobile-dock__item', {
          'mobile-dock__item--active': activeTools.includes(item.tool),
        }]"
        :disabled="item.disabled"
        @click="onTap(item)"
        @touchstart="onTouchStart"
      >
        <GUIIcon :name="item.iconName" :size="24" class="mobile-dock__icon" />
        <span class="mobile-dock__label">{{ item.label }}</span>
        <span v-if="activeTools.includes(item.tool)" class="mobile-dock__dot" />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import type { ToolType } from '../types'
import type { IconName } from '../icons'

export interface MobileDockItem {
  id: string
  tool: ToolType
  label: string
  iconName: IconName
  disabled?: boolean
}

export const defaultMobileDockItems: MobileDockItem[] = [
  { id: 'terminal', tool: 'terminal', label: 'Terminal', iconName: 'terminal' },
  { id: 'files', tool: 'filemanager', label: 'Files', iconName: 'folder' },
  { id: 'editor', tool: 'editor', label: 'Editor', iconName: 'edit' },
]
</script>

<script setup lang="ts">
import GUIIcon from './ui/GUIIcon.vue'
interface Props {
  items?: MobileDockItem[]
  activeTools?: ToolType[]
}

withDefaults(defineProps<Props>(), {
  items: () => defaultMobileDockItems,
  activeTools: () => [],
})

const emit = defineEmits<{
  launch: [item: MobileDockItem]
}>()

function onTap(item: MobileDockItem) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10)
  }
  emit('launch', item)
}

function onTouchStart() {
  // Subtle scale on touch
}
</script>

<style scoped>
/* ── iOS-style Dock ────────────────────────────────────────────────── */
.mobile-dock {
  position: fixed;
  bottom: env(safe-area-inset-bottom, 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--gui-z-toolbar, 200);
}

.mobile-dock__inner {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-base, 16px);
  padding-bottom: calc(var(--gui-spacing-sm, 8px) + env(safe-area-inset-bottom, 0px));
  background: var(--gui-glass-bg, rgba(16, 16, 16, 0.72));
  backdrop-filter: blur(30px) saturate(200%);
  -webkit-backdrop-filter: blur(30px) saturate(200%);
  border: 0.5px solid var(--gui-glass-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--gui-radius-2xl, 20px);
  box-shadow: var(--gui-shadow-lg, 0 16px 40px rgba(0, 0, 0, 0.6));
}

/* ── Dock Item ─────────────────────────────────────────────────────── */
.mobile-dock__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-xxs, 2px);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  border-radius: var(--gui-radius-lg, 12px);
  transition: all var(--gui-transition-fast, 120ms var(--ios-spring, cubic-bezier(0.32, 0.72, 0, 1)));
  -webkit-tap-highlight-color: transparent;
}

.mobile-dock__item:active {
  transform: scale(0.88);
}

.mobile-dock__item--active {
  background: var(--gui-accent-soft, rgba(233, 69, 96, 0.1));
}

.mobile-dock__item:disabled {
  opacity: 0.3;
  pointer-events: none;
}

/* ── Icon ──────────────────────────────────────────────────────────── */
.mobile-dock__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  font-size: 28px;
  line-height: 1;
  background: var(--gui-bg-surface-raised, #111111);
  border-radius: var(--gui-radius-xl, 16px);
  transition: transform var(--gui-transition-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
  box-shadow: var(--gui-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.3));
}

.mobile-dock__item:hover .mobile-dock__icon {
  transform: scale(1.08);
}

.mobile-dock__item--active .mobile-dock__icon {
  box-shadow: var(--gui-shadow-glow, 0 0 12px rgba(233, 69, 96, 0.3));
}

/* ── Label ─────────────────────────────────────────────────────────── */
.mobile-dock__label {
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--gui-font-xs, 10px);
  color: var(--gui-text-secondary, #a8a8a8);
  font-weight: var(--gui-font-weight-medium, 500);
  white-space: nowrap;
  letter-spacing: 0.02em;
}

/* ── Active Dot ─────────────────────────────────────────────────────── */
.mobile-dock__dot {
  position: absolute;
  bottom: 2px;
  width: 4px;
  height: 4px;
  background: var(--gui-accent, #e94560);
  border-radius: var(--gui-radius-full, 9999px);
}
</style>
