<template>
  <div class="mobile-dock">
    <div class="mobile-dock__container">
      <div class="mobile-dock__items">
        <button
          v-for="item in items"
          :key="item.id"
          :class="[
            'mobile-dock__item',
            { 'mobile-dock__item--disabled': item.disabled },
            { 'mobile-dock__item--active': activeTools.includes(item.tool) },
          ]"
          :disabled="item.disabled"
          :title="t(item.label)"
          @click="onTap(item)"
          @touchstart="onTap(item)"
        >
          <GUIIcon :name="item.iconName" :size="24" class="mobile-dock__icon" />
          <span class="mobile-dock__label">{{ t(item.label) }}</span>
          <span v-if="item.badge && item.badge > 0" class="mobile-dock__badge">{{
            item.badge
          }}</span>
          <span v-if="activeTools.includes(item.tool)" class="mobile-dock__indicator" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mobile-dock {
  position: fixed;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
}

.mobile-dock__container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px;
  padding-bottom: calc(4px + env(safe-area-inset-bottom, 0px));
  background: var(--gui-dock-bg, rgba(44, 44, 46, 0.85));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 0.5px solid var(--gui-dock-border, rgba(255, 255, 255, 0.08));
  border-radius: 20px;
  box-shadow: var(--gui-shadow-lg, 0 16px 40px rgba(0, 0, 0, 0.6));
}

.mobile-dock__items {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mobile-dock__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: all 400ms cubic-bezier(0.32, 0.72, 0, 1);
}

.mobile-dock__item:hover .mobile-dock__icon {
  transform: scale(1.15);
}

.mobile-dock__item--disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.mobile-dock__item--active {
  background: var(--gui-dock-item-active, rgba(142, 142, 147, 0.15));
}

.mobile-dock__icon {
  transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mobile-dock__label {
  font-size: 11px;
  font-weight: 500;
  color: var(--gui-text-secondary, #8e8e93);
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.mobile-dock__badge {
  position: absolute;
  bottom: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 5px;
  background: var(--gui-error, #ff3b30);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  color: var(--gui-text-inverse, #ffffff);
  line-height: 16px;
  text-align: center;
}

.mobile-dock__indicator {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: var(--gui-accent, #8e8e93);
  border-radius: 999px;
  animation: ios-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes ios-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>

<script setup lang="ts">
import { useI18n } from '../composables/useI18n'
import type { ToolType } from '../types'
import type { IconName } from '../icons'
import GUIIcon from './ui/GUIIcon.vue'

const { t } = useI18n()

export interface MobileDockItem {
  id: string
  tool: ToolType
  label: string
  iconName: IconName
  badge?: number
  disabled?: boolean
}

interface Props {
  items?: MobileDockItem[]
  activeTools?: ToolType[]
}

// Default values are defined INLINE inside the factory function to avoid
// TDZ errors. defineProps() is a compile-time macro that gets hoisted,
// so referencing any <script setup> variable in default factories causes
// a Temporal Dead Zone error at runtime.
withDefaults(defineProps<Props>(), {
  items: () => [
    {
      id: 'terminal',
      tool: 'terminal' as ToolType,
      label: 'app.terminal',
      iconName: 'terminal' as IconName,
    },
    {
      id: 'files',
      tool: 'filemanager' as ToolType,
      label: 'app.files',
      iconName: 'folder' as IconName,
    },
    { id: 'editor', tool: 'editor' as ToolType, label: 'app.editor', iconName: 'edit' as IconName },
  ],
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
</script>
