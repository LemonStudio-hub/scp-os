<template>
  <div
    ref="windowRef"
    :class="['scp-window', {
      'scp-window--focused': windowInstance.focused,
      'scp-window--minimized': windowInstance.minimized,
      'scp-window--maximized': windowInstance.maximized,
    }]"
    :style="windowStyle"
    @mousedown="onWindowClick"
  >
    <!-- Title Bar -->
    <div
      ref="titleBarRef"
      :class="['scp-window__header', { 'scp-window__header--dragging': dragState.isDragging }]"
      @mousedown="onTitleBarMouseDown"
      @touchstart.passive="onTitleBarTouchStart"
    >
      <div class="scp-window__header-title">
        <span class="scp-window__title">{{ windowInstance.config.title }}</span>
      </div>
      <div class="scp-window__header-actions">
        <button
          v-if="windowInstance.config.minimizable"
          class="scp-window__btn scp-window__btn--icon scp-window__btn--minimize"
          title="Minimize"
          @click.stop="onMinimize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="6" width="8" height="1.5" rx="0.75"/></svg>
        </button>
        <button
          v-if="windowInstance.config.maximizable"
          class="scp-window__btn scp-window__btn--icon scp-window__btn--maximize"
          :title="windowInstance.maximized ? 'Restore' : 'Maximize'"
          @click.stop="onMaximize"
        >
          <svg v-if="!windowInstance.maximized" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="2" y="2" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="3" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M3 3V2C3 1.45 3.45 1 4 1H11V4L10 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </button>
        <button
          v-if="windowInstance.config.closable !== false"
          class="scp-window__btn scp-window__btn--icon scp-window__btn--close"
          title="Close"
          @click.stop="onClose"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="scp-window__content">
      <slot />
    </div>

    <!-- Resize Handles -->
    <template v-if="windowInstance.config.resizable !== false && !windowInstance.maximized">
      <div class="scp-window__resize scp-window__resize--n" @mousedown.stop="onResizeStart('n', $event)" />
      <div class="scp-window__resize scp-window__resize--s" @mousedown.stop="onResizeStart('s', $event)" />
      <div class="scp-window__resize scp-window__resize--e" @mousedown.stop="onResizeStart('e', $event)" />
      <div class="scp-window__resize scp-window__resize--w" @mousedown.stop="onResizeStart('w', $event)" />
      <div class="scp-window__resize scp-window__resize--ne" @mousedown.stop="onResizeStart('ne', $event)" />
      <div class="scp-window__resize scp-window__resize--nw" @mousedown.stop="onResizeStart('nw', $event)" />
      <div class="scp-window__resize scp-window__resize--se" @mousedown.stop="onResizeStart('se', $event)" />
      <div class="scp-window__resize scp-window__resize--sw" @mousedown.stop="onResizeStart('sw', $event)" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useDraggable } from '../composables/useDraggable'
import { useResizable } from '../composables/useResizable'
import type { WindowInstance } from '../types'
import { useWindowManagerStore } from '../stores/windowManager'

interface Props {
  windowInstance: WindowInstance
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  minimize: []
  maximize: []
  focus: []
}>()

const windowManager = useWindowManagerStore()

const windowRef = ref<HTMLElement>()
const titleBarRef = ref<HTMLElement>()

const { dragState, handleMouseDown: onTitleBarMouseDown, handleTouchStart: onTitleBarTouchStart } = useDraggable(
  windowRef,
  {
    boundary: { minX: 0, minY: 0 },
    onMove: (x: number, y: number) => {
      windowManager.updateWindowPosition(props.windowInstance.config.id, x, y)
    },
  }
)

const { handleMouseDown: onResizeStart } = useResizable(
  windowRef,
  {
    minWidth: props.windowInstance.config.minWidth ?? 320,
    minHeight: props.windowInstance.config.minHeight ?? 240,
    onResize: (width: number, height: number, x: number, y: number) => {
      windowManager.updateWindowDimensions(props.windowInstance.config.id, { x, y, width, height })
    },
  }
)

const windowStyle = computed(() => {
  const { position, size, zIndex, minimized, maximized } = props.windowInstance

  if (minimized) {
    return { display: 'none' as const }
  }

  if (maximized) {
    return {
      left: '0',
      top: '0',
      width: '100vw',
      height: '100vh',
      zIndex,
    }
  }

  return {
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    zIndex,
  }
})

function onWindowClick() {
  if (!props.windowInstance.focused) {
    windowManager.focusWindow(props.windowInstance.config.id)
    emit('focus')
  }
}

function onClose() {
  windowManager.closeWindow(props.windowInstance.config.id)
  emit('close')
}

function onMinimize() {
  windowManager.minimizeWindow(props.windowInstance.config.id)
  emit('minimize')
}

function onMaximize() {
  windowManager.maximizeWindow(props.windowInstance.config.id)
  emit('maximize')
}

onMounted(() => {
  if (windowRef.value && !props.windowInstance.maximized) {
    windowRef.value.style.left = `${props.windowInstance.position.x}px`
    windowRef.value.style.top = `${props.windowInstance.position.y}px`
    windowRef.value.style.width = `${props.windowInstance.size.width}px`
    windowRef.value.style.height = `${props.windowInstance.size.height}px`
  }
})

onBeforeUnmount(() => {
  dragState.value.isDragging = false
})
</script>

<style scoped>
/* ── Window Shell ──────────────────────────────────────────────────── */
.scp-window {
  position: fixed;
  display: flex;
  flex-direction: column;
  background: var(--gui-window-bg, #0e0e0e);
  border: 1px solid var(--gui-window-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-xl, 16px);
  overflow: hidden;
  animation: windowOpen 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
  will-change: transform, opacity;
  transition: border-color var(--gui-transition-base, 200ms cubic-bezier(0.4, 0, 0.2, 1)),
              box-shadow var(--gui-transition-base, 200ms cubic-bezier(0.4, 0, 0.2, 1));
}

.scp-window--focused {
  border-color: var(--gui-window-border-active, rgba(233, 69, 96, 0.4));
  box-shadow: var(--gui-window-shadow-active, 0 16px 48px rgba(0, 0, 0, 0.7), 0 4px 12px rgba(233, 69, 96, 0.1));
}

.scp-window:not(.scp-window--focused) {
  box-shadow: var(--gui-window-shadow, 0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4));
}

.scp-window--minimized {
  display: none !important;
}

/* ── Header / Title Bar ────────────────────────────────────────────── */
.scp-window__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 14px;
  background: var(--gui-window-header-bg, rgba(18, 18, 18, 0.95));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
  transition: background var(--gui-transition-fast, 120ms ease);
}

.scp-window__header:active {
  cursor: grabbing;
}

.scp-window__header--dragging {
  background: var(--gui-bg-surface-raised, #111111);
}

.scp-window__header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.scp-window__title {
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #f0f0f0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.01em;
}

/* ── Header Actions ────────────────────────────────────────────────── */
.scp-window__header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.scp-window__btn--icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-secondary, #a8a8a8);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms cubic-bezier(0.4, 0, 0.2, 1));
}

.scp-window__btn--icon:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  color: var(--gui-text-primary, #f0f0f0);
}

.scp-window__btn--icon:active {
  transform: scale(0.92);
}

.scp-window__btn--close:hover {
  background: var(--gui-error-bg, rgba(248, 113, 113, 0.15));
  color: var(--gui-error, #f87171);
}

.scp-window__btn--minimize:hover {
  background: var(--gui-warning-bg, rgba(251, 191, 36, 0.15));
  color: var(--gui-warning, #fbbf24);
}

/* ── Content Area ──────────────────────────────────────────────────── */
.scp-window__content {
  flex: 1;
  overflow: auto;
  background: var(--gui-window-bg, #0e0e0e);
  min-height: 0;
}

/* ── Resize Handles ────────────────────────────────────────────────── */
.scp-window__resize {
  position: absolute;
  z-index: 1;
}

.scp-window__resize--n {
  top: -3px; left: 12px; right: 12px; height: 6px; cursor: n-resize;
}
.scp-window__resize--s {
  bottom: -3px; left: 12px; right: 12px; height: 6px; cursor: s-resize;
}
.scp-window__resize--e {
  top: 12px; right: -3px; bottom: 12px; width: 6px; cursor: e-resize;
}
.scp-window__resize--w {
  top: 12px; left: -3px; bottom: 12px; width: 6px; cursor: w-resize;
}
.scp-window__resize--ne {
  top: -3px; right: -3px; width: 16px; height: 16px; cursor: ne-resize;
}
.scp-window__resize--nw {
  top: -3px; left: -3px; width: 16px; height: 16px; cursor: nw-resize;
}
.scp-window__resize--se {
  bottom: -3px; right: -3px; width: 16px; height: 16px; cursor: se-resize;
}
.scp-window__resize--sw {
  bottom: -3px; left: -3px; width: 16px; height: 16px; cursor: sw-resize;
}

/* ── Mobile ─────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .scp-window {
    left: 0 !important;
    top: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    border-radius: 0;
  }

  .scp-window__resize {
    display: none;
  }

  .scp-window__header {
    height: 44px;
    padding: 0 12px;
  }
}
</style>
