<template>
  <div class="pc-notification fixed top-4 right-4 z-[300] max-w-md">
    <div
      v-for="notification in notifications"
      :key="notification.id"
      :class="[
        'pc-notification__item backdrop-blur-[20px] rounded-[8px] p-4 mb-3 transform transition-all duration-300 ease-in-out',
        {
          'opacity-0 translate-y-4': notification.removing,
          'opacity-100 translate-y-0': !notification.removing,
        },
      ]"
    >
      <div class="flex items-start gap-3">
        <!-- Icon -->
        <div class="pc-notification__icon flex-shrink-0 mt-0.5">
          <GUIIcon :name="notification.icon || 'info'" :size="20" />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <h4 class="pc-notification__title text-sm font-medium mb-1">
            {{ notification.title }}
          </h4>
          <p class="pc-notification__message text-sm">{{ notification.message }}</p>
        </div>

        <!-- Close Button -->
        <button
          class="pc-notification__close flex-shrink-0 p-1 rounded-full transition-colors duration-200"
          @click="removeNotification(notification.id)"
        >
          <GUIIcon name="x" :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GUIIcon from './ui/GUIIcon.vue'
import { useNotification } from '../composables/useNotification'

const { notifications, removeNotification } = useNotification()
</script>

<style scoped>
.pc-notification {
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
}

.pc-notification__item {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0) translateY(0);
  }
}

.pc-notification__item {
  background: var(--gui-glass-bg-strong, rgba(44, 44, 46, 0.95));
  border: 0.5px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  box-shadow: var(--gui-shadow-ios-card, 0 4px 12px rgba(0, 0, 0, 0.3));
}

.pc-notification__title {
  line-height: 1.2;
  color: var(--gui-text-primary, #ffffff);
}

.pc-notification__message {
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: var(--gui-text-secondary, #a1a1aa);
}

.pc-notification__close {
  color: var(--gui-text-secondary, #8e8e93);
}

.pc-notification__close:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  color: var(--gui-text-primary, #ffffff);
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .pc-notification__item {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
