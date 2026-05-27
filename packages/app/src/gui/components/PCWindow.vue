<template>
  <div
    ref="windowRef"
    :class="[
      'pc-window',
      {
        'pc-window--focused': win.focused,
        'pc-window--minimized': win.minimized,
        'pc-window--maximized': win.maximized,
      },
    ]"
    :style="windowStyle"
    :data-theme="themeStore.currentTheme.id"
    @mousedown="onWindowClick"
  >
    <!-- Title Bar -->
    <div
      ref="titleBarRef"
      :class="['pc-window__header', { 'pc-window__header--dragging': dragState.isDragging }]"
      @mousedown="onTitleBarMouseDown"
    >
      <div class="pc-window__header-title">
        <span class="pc-window__title">{{ win.config.title }}</span>
      </div>
      <WindowCaptionControls
        :minimizable="win.config.minimizable !== false"
        :maximizable="win.config.maximizable !== false"
        :closable="win.config.closable !== false"
        :maximized="win.maximized"
        :minimize-title="t('pc.minimize')"
        :maximize-title="t('pc.maximize')"
        :restore-title="t('pc.restore')"
        :close-title="t('pc.close')"
        with-left-margin
        @minimize="onMinimize"
        @maximize="onMaximize"
        @close="onClose"
      />
    </div>

    <!-- Content Area -->
    <div class="pc-window__content">
      <slot />
    </div>

    <!-- Resize Handles -->
    <template v-if="win.config.resizable !== false && !win.maximized">
      <div
        class="pc-window__resize pc-window__resize--n"
        @mousedown.stop="onResizeStart('n', $event)"
      />
      <div
        class="pc-window__resize pc-window__resize--s"
        @mousedown.stop="onResizeStart('s', $event)"
      />
      <div
        class="pc-window__resize pc-window__resize--e"
        @mousedown.stop="onResizeStart('e', $event)"
      />
      <div
        class="pc-window__resize pc-window__resize--w"
        @mousedown.stop="onResizeStart('w', $event)"
      />
      <div
        class="pc-window__resize pc-window__resize--ne"
        @mousedown.stop="onResizeStart('ne', $event)"
      />
      <div
        class="pc-window__resize pc-window__resize--nw"
        @mousedown.stop="onResizeStart('nw', $event)"
      />
      <div
        class="pc-window__resize pc-window__resize--se"
        @mousedown.stop="onResizeStart('se', $event)"
      />
      <div
        class="pc-window__resize pc-window__resize--sw"
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
import { useThemeStore } from '../stores/themeStore'
import WindowCaptionControls from './WindowCaptionControls.vue'

const { t } = useI18n()
const themeStore = useThemeStore()

interface Props {
  windowInstance?: WindowInstance
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  minimize: []
  maximize: []
  focus: []
}>()

// Safe window instance with defaults for standalone usage
const win = computed(
  () =>
    props.windowInstance ??
    ({
      config: {
        id: '',
        title: '',
        minimizable: true,
        maximizable: true,
        closable: true,
        resizable: true,
      },
      position: { x: 0, y: 0 },
      size: { width: 800, height: 600 },
      zIndex: 100,
      focused: true,
      minimized: false,
      maximized: false,
    } as WindowInstance)
)

const windowManager = useWindowManagerStore()

const windowRef = ref<HTMLElement>()
const TASKBAR_HEIGHT = 48
const EDGE_SLOP = 96
const MIN_VISIBLE = 80

// ── Screen Boundaries (reactive) ──────────────────────────────────────
const getScreenBounds = () => {
  return {
    minX: -EDGE_SLOP,
    minY: -EDGE_SLOP,
    maxX: Math.max(-EDGE_SLOP, window.innerWidth - MIN_VISIBLE),
    maxY: Math.max(-EDGE_SLOP, window.innerHeight - MIN_VISIBLE),
  }
}

// ── Draggable ────────────────────────────────────────────────────────
const {
  dragState,
  handleMouseDown: startTitleBarDrag,
  stop: stopDrag,
  setInitialPosition,
  setCurrentPosition,
} = useDraggable(windowRef, {
  boundary: getScreenBounds,
  onMove: (x: number, y: number) => {
    windowManager.updateWindowPosition(win.value.config.id, Math.round(x), Math.round(y))
    syncCurrentDragPosition()
    syncCurrentResizeState()
  },
})

// ── Resizable ────────────────────────────────────────────────────────
const {
  handleMouseDown: onResizeStart,
  stop: stopResize,
  setInitialSize,
} = useResizable(windowRef, {
  minWidth: win.value.config.minWidth ?? 320,
  minHeight: win.value.config.minHeight ?? 240,
  maxWidth: Math.max(320, window.innerWidth + EDGE_SLOP),
  maxHeight: Math.max(240, window.innerHeight + EDGE_SLOP),
  onResize: (width: number, height: number, x: number, y: number) => {
    windowManager.updateWindowDimensions(win.value.config.id, {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    })
    syncCurrentResizeState()
  },
})

// ── Window Style (Single Source of Truth) ────────────────────────────
const windowStyle = computed(() => {
  const { position, size, zIndex, minimized, maximized } = win.value

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
    maxWidth: `calc(100vw + ${EDGE_SLOP}px)`,
    maxHeight: `calc(100vh + ${EDGE_SLOP}px)`,
    zIndex,
  }
})

// ── Event Handlers ───────────────────────────────────────────────────
function onWindowClick() {
  if (!win.value.focused) {
    windowManager.focusWindow(win.value.config.id)
    emit('focus')
  }
}

function onTitleBarMouseDown(event: MouseEvent) {
  const { position, size } = win.value
  setInitialPosition(position.x, position.y)
  setInitialSize(size.width, size.height, position.x, position.y)
  startTitleBarDrag(event)
}

function getManagedWindow() {
  return windowManager.getWindow(win.value.config.id) ?? win.value
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
  windowManager.closeWindow(win.value.config.id)
  emit('close')
}

function onMinimize() {
  windowManager.minimizeWindow(win.value.config.id)
  emit('minimize')
}

function onMaximize() {
  windowManager.maximizeWindow(win.value.config.id)
  emit('maximize')
}

// ── Lifecycle ────────────────────────────────────────────────────────
onMounted(() => {
  // Initialize theme store
  themeStore.init()

  // Set initial position/size in composables
  handleWindowResize()
  syncInteractionState()

  // Listen for window resize to update boundaries
  window.addEventListener('resize', handleWindowResize)
})

onBeforeUnmount(() => {
  // Properly cleanup event listeners
  stopDrag()
  stopResize()
  window.removeEventListener('resize', handleWindowResize)
})

function handleWindowResize() {
  if (win.value.minimized || win.value.maximized) return

  windowManager.updateWindowDimensions(win.value.config.id, {
    x: win.value.position.x,
    y: win.value.position.y,
    width: win.value.size.width,
    height: win.value.size.height,
  })
  syncInteractionState()
}
</script>

<style scoped>
/* ── Window Shell - iOS-Style Window ───────────────────────────────── */
.pc-window {
  position: fixed;
  display: flex;
  flex-direction: column;
  background: var(--gui-bg-surface);
  border: 0.5px solid var(--gui-window-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-xl, 14px);
  overflow: hidden;
  animation: windowOpenSpring 0.45s
    var(--gui-transition-ios-spring, 400ms cubic-bezier(0.32, 0.72, 0, 1)) both;
  will-change: transform, opacity, box-shadow;
  box-shadow: var(--gui-shadow-ios-card, 0 2px 12px rgba(0, 0, 0, 0.4));
  transition:
    border-color var(--gui-transition-base, 200ms ease),
    box-shadow var(--gui-transition-base, 200ms ease),
    transform var(--gui-transition-base, 200ms ease);
}

.pc-window:hover {
  box-shadow: var(--gui-shadow-ios-modal, 0 12px 40px rgba(0, 0, 0, 0.6));
  transform: translateY(-2px);
}

@keyframes windowOpenSpring {
  from {
    transform: scale(0.94) translateY(8px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.pc-window--focused {
  border-color: var(--gui-window-border-active, rgba(255, 255, 255, 0.12));
  box-shadow: var(--gui-shadow-ios-modal, 0 20px 60px rgba(0, 0, 0, 0.7));
}

.pc-window:not(.pc-window--focused) {
  opacity: 0.95;
  box-shadow: var(--gui-shadow-ios-card, 0 2px 12px rgba(0, 0, 0, 0.4));
}

.pc-window--minimized {
  display: none !important;
}

.pc-window--maximized {
  border-radius: 0;
  border: none;
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .pc-window {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.light .pc-window:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.light .pc-window--focused {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.light .pc-window:not(.pc-window--focused) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* ── Header / Title Bar - iOS Frosted Glass ────────────────────────── */
.pc-window__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 0 0 var(--gui-spacing-base, 16px);
  background: var(--gui-glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
  transition:
    background var(--gui-transition-fast, 120ms ease),
    box-shadow var(--gui-transition-fast, 120ms ease);
}

.pc-window__header:hover {
  background: var(--gui-glass-bg-strong, rgba(44, 44, 46, 0.8));
}

.pc-window__header:active {
  cursor: grabbing;
}

.pc-window__header--dragging {
  background: var(--gui-glass-bg-strong, rgba(44, 44, 46, 0.85));
}

.pc-window__header-title {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  min-width: 0;
  flex: 1;
}

.pc-window__title {
  font-family: var(--gui-font-sans);
  font-size: var(--gui-font-base, 13px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-primary, #ffffff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0;
  transition: color var(--gui-transition-base, 200ms ease);
}

/* Ensure title is visible in light mode */
.pc-window[data-theme='light'] .pc-window__title,
.pc-window[data-theme='claude'] .pc-window__title {
  color: var(--gui-text-primary, #000000);
}

/* ── Content Area ──────────────────────────────────────────────────── */
.pc-window__content {
  flex: 1;
  overflow: auto;
  background: var(--gui-bg-base, #000000);
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}

/* ── Scrollbar Styling ─────────────────────────────────────────────── */
.pc-window__content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.pc-window__content::-webkit-scrollbar-track {
  background: transparent;
}

.pc-window__content::-webkit-scrollbar-thumb {
  background: var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-sm, 6px);
}

.pc-window__content::-webkit-scrollbar-thumb:hover {
  background: var(--gui-border-strong, rgba(255, 255, 255, 0.12));
}

/* ── Resize Handles ────────────────────────────────────────────────── */
.pc-window__resize {
  position: absolute;
  z-index: 1;
}

.pc-window__resize--n {
  top: -4px;
  left: 16px;
  right: 16px;
  height: 8px;
  cursor: n-resize;
}
.pc-window__resize--s {
  bottom: -4px;
  left: 16px;
  right: 16px;
  height: 8px;
  cursor: s-resize;
}
.pc-window__resize--e {
  top: 16px;
  right: -4px;
  bottom: 16px;
  width: 8px;
  cursor: e-resize;
}
.pc-window__resize--w {
  top: 16px;
  left: -4px;
  bottom: 16px;
  width: 8px;
  cursor: w-resize;
}
.pc-window__resize--ne {
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  cursor: ne-resize;
}
.pc-window__resize--nw {
  top: -4px;
  left: -4px;
  width: 20px;
  height: 20px;
  cursor: nw-resize;
}
.pc-window__resize--se {
  bottom: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  cursor: se-resize;
}
.pc-window__resize--sw {
  bottom: -4px;
  left: -4px;
  width: 20px;
  height: 20px;
  cursor: sw-resize;
}

/* ── PC Specific Styles ────────────────────────────────────────────── */
@media (min-width: 769px) {
  .pc-window {
    border-radius: var(--gui-radius-xl, 14px);
  }

  .pc-window__header {
    height: 44px;
    padding: 0 0 0 var(--gui-spacing-base, 16px);
  }

  .pc-window__resize {
    display: block;
  }
}

@media (max-width: 768px) {
  .pc-window__header {
    height: 48px;
    padding: 0 0 0 var(--gui-spacing-sm, 8px);
  }

  .pc-window__resize {
    display: none;
  }
}
</style>
