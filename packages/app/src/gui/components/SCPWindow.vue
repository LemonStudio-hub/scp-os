<template>
  <div
    ref="windowRef"
    :class="[
      'scp-window',
      {
        'scp-window--focused': windowInstance.focused,
        'scp-window--minimized': windowInstance.minimized,
        'scp-window--maximized': windowInstance.maximized,
      },
    ]"
    :style="windowStyle"
    @mousedown="onWindowClick"
  >
    <!-- Title Bar -->
    <div
      ref="titleBarRef"
      :class="['scp-window__header', { 'scp-window__header--dragging': dragState.isDragging }]"
      @mousedown="onTitleBarMouseDown"
    >
      <div class="scp-window__header-title">
        <span class="scp-window__title">{{ windowInstance.config.title }}</span>
      </div>
      <div class="scp-window__header-actions" @mousedown.stop>
        <button
          v-if="windowInstance.config.minimizable"
          class="scp-window__btn scp-window__btn--icon scp-window__btn--minimize"
          :title="t('window.minimize')"
          @click.stop="onMinimize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="2" y="6" width="8" height="1.5" rx="0.75" />
          </svg>
        </button>
        <button
          v-if="windowInstance.config.maximizable"
          class="scp-window__btn scp-window__btn--icon scp-window__btn--maximize"
          :title="windowInstance.maximized ? t('window.restore') : t('window.maximize')"
          @click.stop="onMaximize"
        >
          <svg
            v-if="!windowInstance.maximized"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <rect
              x="2"
              y="2"
              width="8"
              height="8"
              rx="1.5"
              stroke="currentColor"
              stroke-width="1.2"
            />
          </svg>
          <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect
              x="1"
              y="3"
              width="8"
              height="8"
              rx="1.5"
              stroke="currentColor"
              stroke-width="1.2"
            />
            <path
              d="M3 3V2C3 1.45 3.45 1 4 1H11V4L10 3"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            />
          </svg>
        </button>
        <button
          v-if="windowInstance.config.closable !== false"
          class="scp-window__btn scp-window__btn--icon scp-window__btn--close"
          :title="t('window.close')"
          @click.stop="onClose"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 3L9 9M9 3L3 9"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
            />
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
      <div
        class="scp-window__resize scp-window__resize--n"
        @mousedown.stop="onResizeStart('n', $event)"
      />
      <div
        class="scp-window__resize scp-window__resize--s"
        @mousedown.stop="onResizeStart('s', $event)"
      />
      <div
        class="scp-window__resize scp-window__resize--e"
        @mousedown.stop="onResizeStart('e', $event)"
      />
      <div
        class="scp-window__resize scp-window__resize--w"
        @mousedown.stop="onResizeStart('w', $event)"
      />
      <div
        class="scp-window__resize scp-window__resize--ne"
        @mousedown.stop="onResizeStart('ne', $event)"
      />
      <div
        class="scp-window__resize scp-window__resize--nw"
        @mousedown.stop="onResizeStart('nw', $event)"
      />
      <div
        class="scp-window__resize scp-window__resize--se"
        @mousedown.stop="onResizeStart('se', $event)"
      />
      <div
        class="scp-window__resize scp-window__resize--sw"
        @mousedown.stop="onResizeStart('sw', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useDraggable } from '../composables/useDraggable'
import { useResizable } from '../composables/useResizable'
import { useI18n } from '../composables/useI18n'
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

const { t } = useI18n()
const windowManager = useWindowManagerStore()

const windowRef = ref<HTMLElement>()
const TASKBAR_HEIGHT = 48
const WINDOW_MARGIN = 12

const {
  dragState,
  handleMouseDown: startTitleBarDrag,
  stop: stopDrag,
  setInitialPosition,
  setCurrentPosition,
} = useDraggable(windowRef, {
  boundary: getScreenBounds,
  onMove: (x: number, y: number) => {
    windowManager.updateWindowPosition(props.windowInstance.config.id, x, y)
    syncCurrentDragPosition()
    syncCurrentResizeState()
  },
})

const {
  handleMouseDown: onResizeStart,
  stop: stopResize,
  setInitialSize,
} = useResizable(windowRef, {
  minWidth: props.windowInstance.config.minWidth ?? 320,
  minHeight: props.windowInstance.config.minHeight ?? 240,
  maxWidth: Math.max(320, window.innerWidth - WINDOW_MARGIN * 2),
  maxHeight: Math.max(240, window.innerHeight - TASKBAR_HEIGHT - WINDOW_MARGIN * 2),
  onResize: (width: number, height: number, x: number, y: number) => {
    windowManager.updateWindowDimensions(props.windowInstance.config.id, { x, y, width, height })
    syncCurrentResizeState()
  },
})

function getScreenBounds() {
  const { width, height } = props.windowInstance.size

  return {
    minX: WINDOW_MARGIN,
    minY: WINDOW_MARGIN,
    maxX: Math.max(WINDOW_MARGIN, window.innerWidth - width - WINDOW_MARGIN),
    maxY: Math.max(WINDOW_MARGIN, window.innerHeight - TASKBAR_HEIGHT - height - WINDOW_MARGIN),
  }
}

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
      height: `calc(100vh - ${TASKBAR_HEIGHT}px)`,
      zIndex,
    }
  }

  return {
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    maxWidth: `calc(100vw - ${WINDOW_MARGIN * 2}px)`,
    maxHeight: `calc(100vh - ${TASKBAR_HEIGHT + WINDOW_MARGIN * 2}px)`,
    zIndex,
  }
})

function onWindowClick() {
  if (!props.windowInstance.focused) {
    windowManager.focusWindow(props.windowInstance.config.id)
    emit('focus')
  }
}

function onTitleBarMouseDown(event: MouseEvent) {
  const { position, size } = props.windowInstance
  setInitialPosition(position.x, position.y)
  setInitialSize(size.width, size.height, position.x, position.y)
  startTitleBarDrag(event)
}

function getManagedWindow() {
  return windowManager.getWindow(props.windowInstance.config.id) ?? props.windowInstance
}

function syncCurrentDragPosition() {
  const current = getManagedWindow()
  setCurrentPosition(current.position.x, current.position.y)
}

function syncCurrentResizeState() {
  const current = getManagedWindow()
  setInitialSize(current.size.width, current.size.height, current.position.x, current.position.y)
}

function syncInteractionState() {
  const current = getManagedWindow()
  setInitialPosition(current.position.x, current.position.y)
  setInitialSize(current.size.width, current.size.height, current.position.x, current.position.y)
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
  handleWindowResize()
  syncInteractionState()
  window.addEventListener('resize', handleWindowResize)
})

onBeforeUnmount(() => {
  stopDrag()
  stopResize()
  window.removeEventListener('resize', handleWindowResize)
})

function handleWindowResize() {
  if (props.windowInstance.minimized || props.windowInstance.maximized) return

  windowManager.updateWindowDimensions(props.windowInstance.config.id, {
    x: props.windowInstance.position.x,
    y: props.windowInstance.position.y,
    width: props.windowInstance.size.width,
    height: props.windowInstance.size.height,
  })
  syncInteractionState()
}
</script>

<style scoped>
/* ── Window Shell ──────────────────────────────────────────────────── */
.scp-window {
  position: fixed;
  display: flex;
  flex-direction: column;
  background: var(--gui-bg-base, #1c1c1e);
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-xl, 14px);
  overflow: hidden;
  animation: windowOpenSpring 0.4s cubic-bezier(0.32, 0.72, 0, 1) both;
  will-change: transform, opacity;
  transition:
    border-color 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    box-shadow 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: var(--gui-shadow-ios-card, 0 2px 12px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 0, 0, 0.3));
}

@keyframes windowOpenSpring {
  from {
    transform: scale(0.92);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.scp-window--focused {
  border-color: var(--gui-border-strong, rgba(255, 255, 255, 0.12));
  box-shadow: var(
    --gui-shadow-ios-modal,
    0 20px 60px rgba(0, 0, 0, 0.7),
    0 0 1px rgba(255, 255, 255, 0.06)
  );
}

.scp-window:not(.scp-window--focused) {
  opacity: 0.92;
  box-shadow: var(--gui-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.5));
}

.scp-window--minimized {
  display: none !important;
}

.scp-window--maximized {
  border-radius: 0;
  border: none;
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .scp-window {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.light .scp-window--focused {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.light .scp-window:not(.scp-window--focused) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

/* ── Header / Title Bar ────────────────────────────────────────────── */
.scp-window__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 0 0 14px;
  background: var(--gui-glass-bg);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
  transition: background 120ms ease;
}

.scp-window__header:active {
  cursor: grabbing;
}

.scp-window__header--dragging {
  background: var(--gui-bg-surface-raised, #2c2c2e);
}

.scp-window__header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.scp-window__title {
  font-family: var(--gui-font-sans);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #ffffff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0;
}

/* ── Header Actions ────────────────────────────────────────────────── */
.scp-window__header-actions {
  display: flex;
  align-items: center;
  align-self: stretch;
  gap: 0;
  margin-top: -1px;
  margin-right: -1px;
}

.scp-window__btn--icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: calc(100% + 1px);
  background: transparent;
  border: none;
  border-radius: 0;
  color: var(--gui-text-secondary, #8e8e93);
  cursor: pointer;
  transition:
    background 120ms ease,
    color 120ms ease;
  -webkit-tap-highlight-color: transparent;
}

.scp-window__btn--icon:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #ffffff);
}

.scp-window__btn--icon:active {
  background: var(--gui-bg-surface-raised, rgba(255, 255, 255, 0.12));
}

.scp-window__btn--close:hover {
  background: #e81123;
  color: #ffffff;
}

.scp-window__btn--close:active {
  background: #c50f1f;
  color: #ffffff;
}

/* ── Content Area ──────────────────────────────────────────────────── */
.scp-window__content {
  flex: 1;
  overflow: auto;
  background: var(--gui-bg-base, #000000);
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}

/* ── Resize Handles ────────────────────────────────────────────────── */
.scp-window__resize {
  position: absolute;
  z-index: 1;
}

.scp-window__resize--n {
  top: -3px;
  left: 12px;
  right: 12px;
  height: 6px;
  cursor: n-resize;
}
.scp-window__resize--s {
  bottom: -3px;
  left: 12px;
  right: 12px;
  height: 6px;
  cursor: s-resize;
}
.scp-window__resize--e {
  top: 12px;
  right: -3px;
  bottom: 12px;
  width: 6px;
  cursor: e-resize;
}
.scp-window__resize--w {
  top: 12px;
  left: -3px;
  bottom: 12px;
  width: 6px;
  cursor: w-resize;
}
.scp-window__resize--ne {
  top: -3px;
  right: -3px;
  width: 16px;
  height: 16px;
  cursor: ne-resize;
}
.scp-window__resize--nw {
  top: -3px;
  left: -3px;
  width: 16px;
  height: 16px;
  cursor: nw-resize;
}
.scp-window__resize--se {
  bottom: -3px;
  right: -3px;
  width: 16px;
  height: 16px;
  cursor: se-resize;
}
.scp-window__resize--sw {
  bottom: -3px;
  left: -3px;
  width: 16px;
  height: 16px;
  cursor: sw-resize;
}

/* ── Mobile ─────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .scp-window {
    left: 0 !important;
    top: 0 !important;
    width: 100vw !important;
    height: calc(100vh - 48px) !important;
    border-radius: 0;
  }

  .scp-window__resize {
    display: none;
  }

  .scp-window__header {
    height: 44px;
    padding: 0 0 0 12px;
  }
}
</style>
