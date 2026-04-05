<template>
  <div class="pc-notification fixed top-4 right-4 z-[300] max-w-md">
    <div 
      v-for="notification in notifications" 
      :key="notification.id"
      :class="[
        'pc-notification__item bg-[rgba(44,44,46,0.95)] backdrop-blur-[20px] border border-white/[0.08] rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.3)] p-4 mb-3 transform transition-all duration-300 ease-in-out',
        { 'opacity-0 translate-y-4': notification.removing, 'opacity-100 translate-y-0': !notification.removing }
      ]"
    >
      <div class="flex items-start gap-3">
        <!-- Icon -->
        <div class="pc-notification__icon flex-shrink-0 mt-0.5">
          <GUIIcon :name="notification.icon || 'info'" :size="20" />
        </div>
        
        <!-- Content -->
        <div class="flex-1 min-w-0">
          <h4 class="pc-notification__title text-sm font-medium text-white mb-1">{{ notification.title }}</h4>
          <p class="pc-notification__message text-sm text-gray-300">{{ notification.message }}</p>
        </div>
        
        <!-- Close Button -->
        <button 
          class="pc-notification__close flex-shrink-0 p-1 rounded-full hover:bg-white/[0.1] transition-colors duration-200"
          @click="removeNotification(notification.id)"
        >
          <GUIIcon name="xmark" :size="16" />
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
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
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

.pc-notification__title {
  line-height: 1.2;
}

.pc-notification__message {
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>