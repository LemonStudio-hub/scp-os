<template>
  <div ref="taskbarRef" class="pc-taskbar fixed bottom-0 left-0 right-0 z-[200]">
    <div class="pc-taskbar__container">
      <!-- Start Button -->
      <button
        class="pc-taskbar__start-btn"
        @click="$emit('start-click')"
      >
        <GUIIcon :name="'menu'" :size="20" />
        <span class="pc-taskbar__start-label">{{ t('pc.start') }}</span>
      </button>

      <!-- Pinned Apps -->
      <div class="pc-taskbar__pinned">
        <button
          v-for="item in items"
          :key="item.id"
          :class="[
            'pc-taskbar__app-btn',
            { 'pc-taskbar__app-btn--disabled': item.disabled },
            { 'pc-taskbar__app-btn--active': activeTools.includes(item.tool) },
          ]"
          :disabled="item.disabled"
          :title="item.label"
          @click="onClick(item)"
        >
          <GUIIcon :name="item.iconName" :size="20" />
          <span v-if="activeTools.includes(item.tool)" class="pc-taskbar__indicator" />
        </button>
      </div>

      <!-- System Tray -->
      <div class="pc-taskbar__tray">
        <div class="pc-taskbar__tray-item">
          <GUIIcon :name="'wifi'" :size="16" />
        </div>
        <div class="pc-taskbar__tray-item">
          <GUIIcon :name="'battery'" :size="16" />
        </div>
        <div class="pc-taskbar__tray-item pc-taskbar__time">
          <span class="pc-taskbar__time-text">{{ currentTime }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import type { ToolType } from '../types'
import type { IconName } from '../icons'
import GUIIcon from './ui/GUIIcon.vue'

const { t } = useI18n()

const taskbarRef = ref<HTMLElement | null>(null)

defineExpose({ taskbarRef })

export interface PCTaskbarItem {
  id: string
  tool: ToolType
  label: string
  iconName: IconName
  disabled?: boolean
}

interface Props {
  items?: PCTaskbarItem[]
  activeTools?: ToolType[]
}

// Default values are defined INLINE inside the factory function to avoid
// TDZ errors. defineProps() is a compile-time macro that gets hoisted,
// so referencing any <script setup> variable in default factories causes
// a Temporal Dead Zone error at runtime.
withDefaults(defineProps<Props>(), {
  items: () => [
    { id: 'terminal', tool: 'terminal' as ToolType, label: 'Terminal', iconName: 'terminal' as IconName },
    { id: 'files', tool: 'filemanager' as ToolType, label: 'Files', iconName: 'folder' as IconName },
    { id: 'editor', tool: 'editor' as ToolType, label: 'Editor', iconName: 'edit' as IconName },
  ],
  activeTools: () => [],
})

const emit = defineEmits<{
  launch: [item: PCTaskbarItem]
  'start-click': []
}>()

const currentTime = ref('')
let timeInterval: number | undefined

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function onClick(item: PCTaskbarItem) {
  emit('launch', item)
}

onMounted(() => {
  updateTime()
  timeInterval = window.setInterval(updateTime, 60000) // Update every minute
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
/* ── PC Taskbar - iOS Frosted Glass Style ──────────────────────────── */
.pc-taskbar {
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  background: var(--gui-glass-bg, rgba(44, 44, 46, 0.85));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.4), 0 -2px 8px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: background var(--gui-transition-base, 200ms ease),
              box-shadow var(--gui-transition-base, 200ms ease);
}

.pc-taskbar:hover {
  background: var(--gui-glass-bg-strong, rgba(44, 44, 46, 0.95));
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.5), 0 -4px 12px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.pc-taskbar__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 var(--gui-spacing-base, 16px);
  max-width: 100vw;
  overflow: hidden;
}

/* ── Start Button ──────────────────────────────────────────────────── */
.pc-taskbar__start-btn {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-base, 16px);
  background: transparent;
  border: none;
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-primary, #FFFFFF);
  cursor: pointer;
  user-select: none;
  transition: all var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
  flex-shrink: 0;
}

.pc-taskbar__start-label {
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #FFFFFF);
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.pc-taskbar__start-btn:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  transform: scale(1.02);
}

.pc-taskbar__start-btn:active {
  transform: scale(0.96);
  opacity: 0.8;
}

/* ── Pinned Apps ───────────────────────────────────────────────────── */
.pc-taskbar__pinned {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  flex: 1;
  margin: 0 var(--gui-spacing-xl, 24px);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.pc-taskbar__pinned::-webkit-scrollbar {
  display: none;
}

.pc-taskbar__app-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 52px;
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  background: transparent;
  border: none;
  border-radius: var(--gui-radius-lg, 12px);
  cursor: pointer;
  user-select: none;
  color: var(--gui-text-secondary, #8E8E93);
  transition: all var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
  box-shadow: inset 0 0 0 1px transparent;
}

.pc-taskbar__app-btn:hover {
  background: var(--gui-dock-item-hover, rgba(255, 255, 255, 0.08));
  color: var(--gui-text-primary, #FFFFFF);
  transform: scale(1.08) translateY(-2px);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.pc-taskbar__app-btn:active {
  transform: scale(0.88) translateY(0);
  opacity: 0.7;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}

.pc-taskbar__app-btn--disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.pc-taskbar__app-btn--active {
  background: var(--gui-dock-item-active, rgba(142, 142, 147, 0.15));
  color: var(--gui-text-primary, #FFFFFF);
}

.pc-taskbar__app-btn--active::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: var(--gui-accent, #8E8E93);
  border-radius: var(--radius-full, 999px);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* ── System Tray ───────────────────────────────────────────────────── */
.pc-taskbar__tray {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  flex-shrink: 0;
}

.pc-taskbar__tray-item {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  border-radius: var(--gui-radius-base, 8px);
  cursor: pointer;
  color: var(--gui-text-secondary, #8E8E93);
  transition: all var(--gui-transition-base, 200ms ease);
  -webkit-tap-highlight-color: transparent;
}

.pc-taskbar__tray-item:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  color: var(--gui-text-primary, #FFFFFF);
}

.pc-taskbar__tray-item:active {
  transform: scale(0.92);
  opacity: 0.7;
}

/* ── Time Display ──────────────────────────────────────────────────── */
.pc-taskbar__time {
  padding-left: var(--gui-spacing-sm, 8px);
  border-left: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.pc-taskbar__time-text {
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #FFFFFF);
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
}

/* ── Responsive Adjustments ────────────────────────────────────────── */
@media (max-width: 1024px) {
  .pc-taskbar__container {
    height: 48px;
    padding: 0 var(--gui-spacing-sm, 8px);
  }

  .pc-taskbar__start-btn {
    padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  }

  .pc-taskbar__start-label {
    display: none;
  }

  .pc-taskbar__pinned {
    margin: 0 var(--gui-spacing-sm, 8px);
  }

  .pc-taskbar__app-btn {
    min-width: 48px;
  }
}

@media (max-width: 768px) {
  .pc-taskbar {
    height: 48px;
  }

  .pc-taskbar__tray {
    gap: var(--gui-spacing-xxs, 2px);
  }

  .pc-taskbar__time {
    display: none;
  }
}
</style>