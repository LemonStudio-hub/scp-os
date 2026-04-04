<template>
  <Teleport to="body">
    <Transition name="ios-sheet">
      <div v-if="visible" class="mobile-bottom-sheet-backdrop fixed inset-0 z-[400] flex items-end justify-center bg-black/40 pb-[env(safe-area-inset-bottom,0px)]" @click.self="onBackdropClick">
        <div
          ref="sheetRef"
          class="mobile-bottom-sheet w-full max-w-[600px] max-h-[85vh] bg-[#2C2C2E] rounded-t-[14px] overflow-hidden flex flex-col shadow-[0_24px_48px_rgba(0,0,0,0.7)]"
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
            <div class="w-9 h-[5px] bg-white/20 rounded-full" />
          </div>

          <!-- Header -->
          <div v-if="title" class="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <h3 class="text-[15px] font-semibold text-white">{{ title }}</h3>
            <button v-if="showClose" class="flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.2] text-white/60 transition-colors" @click="$emit('close')">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5 5L11 11M11 5L5 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch px-4 pb-4" style="padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));">
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
/* Sheet transitions */
.ios-sheet-enter-active {
  animation: ios-sheet-in 0.35s cubic-bezier(0.32, 0.72, 0, 1) both;
}

.ios-sheet-leave-active {
  animation: ios-sheet-out 0.25s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes ios-sheet-in {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes ios-sheet-out {
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
}
</style>
