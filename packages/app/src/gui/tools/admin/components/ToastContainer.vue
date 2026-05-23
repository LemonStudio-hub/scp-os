<template>
  <Teleport to="body">
    <div class="admin-toast-container">
      <TransitionGroup name="admin-toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="admin-toast"
          :class="`admin-toast--${toast.type}`"
          @click="removeToast(toast.id)"
        >
          <div class="admin-toast__icon">
            <svg
              v-if="toast.type === 'success'"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 8L7 11L12 5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg
              v-else-if="toast.type === 'error'"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <svg
              v-else-if="toast.type === 'warning'"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M8 5V8M8 11H8.01"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 5V8M8 11H8.01"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <span class="admin-toast__message">{{ toast.message }}</span>
          <button class="admin-toast__close" @click.stop="removeToast(toast.id)">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 3L9 9M9 3L3 9"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<style scoped>
.admin-toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 600;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  max-width: 380px;
}

.admin-toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--gui-bg-surface-raised, #1a1a1a);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 10px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 1px rgba(255, 255, 255, 0.06);
  pointer-events: auto;
  cursor: pointer;
  max-width: 100%;
}

.admin-toast__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  flex-shrink: 0;
}

.admin-toast--success .admin-toast__icon {
  background: rgba(52, 199, 89, 0.12);
  color: var(--gui-success, #34c759);
}

.admin-toast--error .admin-toast__icon {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.12));
  color: var(--gui-error, #ff3b30);
}

.admin-toast--warning .admin-toast__icon {
  background: var(--gui-warning-bg, rgba(255, 204, 0, 0.12));
  color: var(--gui-warning, #ffcc00);
}

.admin-toast--info .admin-toast__icon {
  background: rgba(10, 132, 255, 0.12);
  color: var(--gui-info, #0a84ff);
}

.admin-toast__message {
  font-size: 13px;
  color: var(--gui-text-primary, #e0e0e0);
  line-height: 1.4;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.admin-toast__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--gui-text-tertiary, #6a6a6a);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 100ms ease;
}

.admin-toast__close:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-secondary, #a0a0a0);
}

.admin-toast-enter-active {
  transition: all 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.admin-toast-leave-active {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.admin-toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

.admin-toast-move {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
