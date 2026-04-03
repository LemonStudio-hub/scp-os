<template>
  <Transition name="ios-slide" appear>
    <div
      v-if="visible"
      ref="windowRef"
      class="mobile-window"
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
import { useHammer } from '../composables/useHammer'

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

// Hammer.js: swipe-down from top to dismiss
const { setCallbacks } = useHammer(windowRef, {
  swipeThreshold: 80,
  swipeVelocity: 0.5,
  directions: ['swipe', 'pan'],
})

function onBack() {
  emit('back')
  emit('close')
}

setCallbacks({
  onSwipeDown: () => {
    emit('close')
  },
})
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
