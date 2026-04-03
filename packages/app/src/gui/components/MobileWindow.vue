<template>
  <Transition name="ios-slide" appear>
    <div
      v-if="visible"
      ref="windowRef"
      class="mobile-window"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- iOS Navigation Bar -->
      <MobileNavBar
        :show-back="showBack"
        :back-label="backLabel"
        :border="true"
        @back="onBack"
      >
        <span class="mobile-window__title">{{ title }}</span>
        <template #right>
          <slot name="nav-right" />
        </template>
      </MobileNavBar>

      <!-- Content -->
      <div class="mobile-window__content">
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MobileNavBar from './MobileNavBar.vue'

interface Props {
  visible?: boolean
  title: string
  showBack?: boolean
  backLabel?: string
}

withDefaults(defineProps<Props>(), {
  visible: true,
  showBack: false,
  backLabel: '',
})

const emit = defineEmits<{
  back: []
  close: []
}>()

const windowRef = ref<HTMLDivElement | null>(null)
let startY = 0
let isDragging = false

function onBack() {
  emit('back')
  emit('close')
}

function onTouchStart(e: TouchEvent) {
  // Only trigger swipe from top edge
  if (e.touches[0].clientY < 30) {
    startY = e.touches[0].clientY
    isDragging = true
  }
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging || !windowRef.value) return
  const diff = e.touches[0].clientY - startY
  if (diff > 0) {
    windowRef.value.style.transform = `translateY(${diff * 0.4}px)`
    windowRef.value.style.opacity = String(1 - diff * 0.003)
  }
}

function onTouchEnd(e: TouchEvent) {
  if (!isDragging || !windowRef.value) return
  isDragging = false

  const diff = e.changedTouches[0].clientY - startY
  if (diff > 80) {
    emit('close')
  }

  windowRef.value.style.transform = ''
  windowRef.value.style.opacity = ''
  startY = 0
}
</script>

<style scoped>
/* ── iOS Full-Screen Window ────────────────────────────────────────── */
.mobile-window {
  position: fixed;
  inset: 0;
  z-index: var(--gui-z-window, 300);
  background: var(--gui-bg-base, #060606);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  will-change: transform, opacity;
}

.mobile-window__title {
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--gui-font-base, 13px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-primary, #f0f0f0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-window__content {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
}
</style>
