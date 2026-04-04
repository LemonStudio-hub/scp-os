<template>
  <Teleport to="body">
    <Transition name="ios-sheet">
      <div v-if="visible" class="mobile-bottom-sheet-backdrop fixed inset-0 z-[400] flex items-end justify-center" @click.self="onBackdropClick">
        <div
          ref="sheetRef"
          class="mobile-bottom-sheet w-full max-w-[600px] bg-[var(--gui-bg-surface,#2C2C2E)] rounded-t-[14px] overflow-hidden flex flex-col"
          style="max-height: 85vh; box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5); padding-bottom: env(safe-area-inset-bottom, 0px);"
          :class="{
            'max-h-[40vh]': peek,
            'max-h-[100vh] h-dvh rounded-none': fullHeight,
          }"
        >
          <!-- Handle bar -->
          <div
            class="flex justify-center py-2 pb-1 cursor-grab -webkit-tap-highlight-color-transparent"
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
          >
            <div class="w-9 h-[5px] rounded-full" style="background: var(--gui-handle-bar, rgba(255, 255, 255, 0.2));" />
          </div>

          <!-- Header with title -->
          <div v-if="title" class="flex items-center px-4 pb-3">
            <h3 class="text-[13px] font-semibold text-[var(--gui-text-secondary,#8E8E93)] text-center w-full">{{ title }}</h3>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch" style="padding: 0 0 calc(8px + env(safe-area-inset-bottom, 0px));">
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
  swipeToDismiss?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  peek: false,
  fullHeight: false,
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
  if (!isDragging || !props.swipeToDismiss || !sheetRef.value) return
  currentY = e.touches[0].clientY
  const diff = currentY - startY
  if (diff > 0) {
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
/* Sheet transitions — iOS spring */
.ios-sheet-enter-active {
  animation: ios-sheet-in 0.4s cubic-bezier(0.32, 0.72, 0, 1) both;
}

.ios-sheet-leave-active {
  animation: ios-sheet-out 0.25s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes ios-sheet-in {
  from {
    transform: translateY(100%) scale(0.96);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes ios-sheet-out {
  from {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateY(100%) scale(0.96);
    opacity: 0;
  }
}

/* Backdrop fade */
.mobile-bottom-sheet-backdrop {
  animation: sheetBackdropFadeIn 0.35s cubic-bezier(0.32, 0.72, 0, 1) both;
}

.ios-sheet-leave-active + .mobile-bottom-sheet-backdrop,
.mobile-bottom-sheet-backdrop {
  transition: opacity 0.25s ease;
}

@keyframes sheetBackdropFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Sheet container — iOS style */
.mobile-bottom-sheet {
  transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
  animation: sheetContentSlideUp 0.4s cubic-bezier(0.32, 0.72, 0, 1) both;
}

@keyframes sheetContentSlideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
