<template>
  <Teleport to="body">
    <Transition name="gui-ios-sheet">
      <div v-if="visible" class="mobile-bottom-sheet-backdrop" @click.self="onBackdropClick">
        <div
          ref="sheetRef"
          class="mobile-bottom-sheet"
          :class="{
            'mobile-bottom-sheet--peek': peek,
            'mobile-bottom-sheet--full': fullHeight,
          }"
        >
          <!-- Handle bar -->
          <div
            class="mobile-bottom-sheet__handle"
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
          >
            <div class="mobile-bottom-sheet__handle-bar" />
          </div>

          <!-- Header -->
          <div v-if="title" class="mobile-bottom-sheet__header">
            <h3 class="mobile-bottom-sheet__title">{{ title }}</h3>
            <button v-if="showClose" class="mobile-bottom-sheet__close" @click="$emit('close')">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="var(--gui-handle-bar, rgba(255,255,255,0.2))"/>
                <path d="M5 5L11 11M11 5L5 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="mobile-bottom-sheet__content">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  visible: boolean
  title?: string
  peek?: boolean
  fullHeight?: boolean
  showClose?: boolean
  swipeToDismiss?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  peek: false,
  fullHeight: false,
  showClose: true,
  swipeToDismiss: true,
})

const emit = defineEmits<{
  close: []
  'update:visible': [value: boolean]
}>()

const sheetRef = ref<HTMLDivElement | null>(null)
let startY = 0
let currentY = 0
let isDragging = false

function onTouchStart(e: TouchEvent) {
  if (!props.swipeToDismiss) return
  startY = e.touches[0].clientY
  isDragging = true
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging || !props.swipeToDismiss) return
  currentY = e.touches[0].clientY
  const diff = currentY - startY
  if (diff > 0 && sheetRef.value) {
    sheetRef.value.style.transform = `translateY(${diff}px)`
  }
}

function onTouchEnd() {
  if (!isDragging || !props.swipeToDismiss) return
  isDragging = false
  const diff = currentY - startY

  if (diff > 100) {
    emit('update:visible', false)
    emit('close')
  }

  if (sheetRef.value) {
    sheetRef.value.style.transform = ''
  }
  startY = 0
  currentY = 0
}

function onBackdropClick() {
  emit('update:visible', false)
  emit('close')
}
</script>

<style scoped>
/* ── Backdrop ──────────────────────────────────────────────────────── */
.mobile-bottom-sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--gui-z-modal, 400);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: var(--gui-backdrop-bg, rgba(0, 0, 0, 0.4));
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* ── Sheet ─────────────────────────────────────────────────────────── */
.mobile-bottom-sheet {
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  background: var(--gui-bg-surface-raised, #111111);
  border-radius: var(--gui-radius-xl, 14px) var(--gui-radius-xl, 14px) 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--gui-shadow-xl, 0 24px 48px rgba(0, 0, 0, 0.7));
}

.mobile-bottom-sheet--peek {
  max-height: 40vh;
}

.mobile-bottom-sheet--full {
  max-height: 100vh;
  height: 100dvh;
  border-radius: 0;
}

/* ── Handle Bar ────────────────────────────────────────────────────── */
.mobile-bottom-sheet__handle {
  display: flex;
  justify-content: center;
  padding: var(--gui-spacing-sm, 8px) 0 var(--gui-spacing-xs, 4px);
  cursor: grab;
  -webkit-tap-highlight-color: transparent;
}

.mobile-bottom-sheet__handle-bar {
  width: var(--gui-dim-handle-bar-width, 36px);
  height: var(--gui-dim-handle-bar-height, 5px);
  background: var(--gui-handle-bar, rgba(255, 255, 255, 0.2));
  border-radius: var(--gui-dim-handle-bar-radius, 100px);
}

/* ── Header ────────────────────────────────────────────────────────── */
.mobile-bottom-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-base, 16px) var(--gui-spacing-md, 12px);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.mobile-bottom-sheet__title {
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--gui-font-lg, 15px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-primary, #f0f0f0);
  margin: 0;
}

.mobile-bottom-sheet__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  color: var(--gui-text-secondary, #a8a8a8);
  cursor: pointer;
  border-radius: var(--gui-radius-full, 9999px);
  transition: background var(--gui-transition-fast, 120ms ease);
}

.mobile-bottom-sheet__close:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
}

/* ── Content ───────────────────────────────────────────────────────── */
.mobile-bottom-sheet__content {
  flex: 1;
  overflow-y: auto;
  padding: var(--gui-spacing-base, 16px);
  padding-bottom: calc(var(--gui-spacing-base, 16px) + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
}
</style>
