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
        <span v-if="windowInstance.config.icon" class="scp-window__icon">{{ windowInstance.config.icon }}</span>
        <span class="scp-window__title">{{ windowInstance.config.title }}</span>
      </div>
      <div class="scp-window__header-actions">
        <button
          v-if="windowInstance.config.minimizable"
          class="scp-window__btn scp-window__btn--minimize"
          title="Minimize"
          @click.stop="onMinimize"
        >
          <span>─</span>
        </button>
        <button
          v-if="windowInstance.config.maximizable"
          class="scp-window__btn scp-window__btn--maximize"
          :title="windowInstance.maximized ? 'Restore' : 'Maximize'"
          @click.stop="onMaximize"
        >
          <span>{{ windowInstance.maximized ? '❐' : '□' }}</span>
        </button>
        <button
          v-if="windowInstance.config.closable !== false"
          class="scp-window__btn scp-window__btn--close"
          title="Close"
          @click.stop="onClose"
        >
          <span>×</span>
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

// Draggable setup
const { dragState, handleMouseDown: onTitleBarMouseDown, handleTouchStart: onTitleBarTouchStart } = useDraggable(
  windowRef,
  {
    boundary: { minX: 0, minY: 0 },
    onMove: (x: number, y: number) => {
      windowManager.updateWindowPosition(props.windowInstance.config.id, x, y)
    },
  }
)

// Resizable setup
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

// Computed style
const windowStyle = computed(() => {
  const { position, size, zIndex, focused, minimized, maximized } = props.windowInstance

  if (minimized) {
    return {
      display: 'none',
    }
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
    boxShadow: focused
      ? '0 8px 32px rgba(233, 69, 96, 0.15), 0 2px 8px rgba(0, 0, 0, 0.4)'
      : '0 2px 8px rgba(0, 0, 0, 0.4)',
    borderColor: focused
      ? 'var(--gui-color-window-border-active, #e94560)'
      : 'var(--gui-color-window-border, #2a2a2a)',
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

// Initialize position from window instance
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
.scp-window {
  position: fixed;
  display: flex;
  flex-direction: column;
  background: var(--gui-color-window-bg, #0d0d0d);
  border: 1px solid var(--gui-color-window-border, #2a2a2a);
  border-radius: var(--gui-radius-md, 8px);
  overflow: hidden;
  transition: box-shadow var(--gui-transition-base, 200ms ease),
              border-color var(--gui-transition-base, 200ms ease);
}

.scp-window--minimized {
  display: none !important;
}

/* Header / Title Bar */
.scp-window__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 12px;
  background: var(--gui-color-window-header-bg, #151515);
  border-bottom: 1px solid var(--gui-color-border-default, #2a2a2a);
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
}

.scp-window__header:active {
  cursor: grabbing;
}

.scp-window__header--dragging {
  cursor: grabbing;
  opacity: 0.9;
}

.scp-window__header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.scp-window__icon {
  font-size: 14px;
  flex-shrink: 0;
}

.scp-window__title {
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-color-text-primary, #e0e0e0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Header Actions */
.scp-window__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.scp-window__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: var(--gui-radius-sm, 4px);
  color: var(--gui-color-text-secondary, #a0a0a0);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--gui-transition-fast, 150ms ease);
  line-height: 1;
}

.scp-window__btn:hover {
  background: var(--gui-color-bg-hover, #1e1e1e);
  color: var(--gui-color-text-primary, #e0e0e0);
}

.scp-window__btn--close:hover {
  background: var(--gui-color-error, #ff4444);
  color: #fff;
}

.scp-window__btn--minimize:hover {
  background: var(--gui-color-warning, #ffff00);
  color: #000;
}

/* Content Area */
.scp-window__content {
  flex: 1;
  overflow: auto;
  background: var(--gui-color-window-bg, #0d0d0d);
  min-height: 0;
}

/* Resize Handles */
.scp-window__resize {
  position: absolute;
  z-index: 1;
}

.scp-window__resize--n {
  top: -3px;
  left: 8px;
  right: 8px;
  height: 6px;
  cursor: n-resize;
}

.scp-window__resize--s {
  bottom: -3px;
  left: 8px;
  right: 8px;
  height: 6px;
  cursor: s-resize;
}

.scp-window__resize--e {
  top: 8px;
  right: -3px;
  bottom: 8px;
  width: 6px;
  cursor: e-resize;
}

.scp-window__resize--w {
  top: 8px;
  left: -3px;
  bottom: 8px;
  width: 6px;
  cursor: w-resize;
}

.scp-window__resize--ne {
  top: -3px;
  right: -3px;
  width: 12px;
  height: 12px;
  cursor: ne-resize;
}

.scp-window__resize--nw {
  top: -3px;
  left: -3px;
  width: 12px;
  height: 12px;
  cursor: nw-resize;
}

.scp-window__resize--se {
  bottom: -3px;
  right: -3px;
  width: 12px;
  height: 12px;
  cursor: se-resize;
}

.scp-window__resize--sw {
  bottom: -3px;
  left: -3px;
  width: 12px;
  height: 12px;
  cursor: sw-resize;
}

/* Mobile adjustments */
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
}
</style>
