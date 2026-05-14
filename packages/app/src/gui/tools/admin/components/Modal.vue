<template>
  <Teleport to="body">
    <Transition name="admin-modal">
      <div
        v-if="visible"
        class="admin-modal-overlay"
        @click.self="onClose"
        @keydown.escape="onClose"
      >
        <div class="admin-modal" :style="{ width }">
          <div class="admin-modal__header">
            <h3 class="admin-modal__title">{{ title }}</h3>
            <button class="admin-modal__close" @click="onClose">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4L12 12M12 4L4 12"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
          <div class="admin-modal__body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="admin-modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  title: string
  width?: string
}

withDefaults(defineProps<Props>(), {
  width: '500px',
})

const emit = defineEmits<{
  close: []
  'update:visible': [value: boolean]
}>()

function onClose() {
  emit('close')
  emit('update:visible', false)
}
</script>

<style scoped>
.admin-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gui-backdrop-bg, rgba(0, 0, 0, 0.5));
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.admin-modal {
  background: var(--gui-bg-surface-raised, #1a1a1a);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 12px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.7),
    0 0 1px rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  overflow: hidden;
}

.admin-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--gui-border-default, #2a2a2a);
  flex-shrink: 0;
}

.admin-modal__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--gui-text-primary, #e0e0e0);
}

.admin-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--gui-text-tertiary, #6a6a6a);
  cursor: pointer;
  transition: all 120ms ease;
}

.admin-modal__close:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #e0e0e0);
}

.admin-modal__body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.admin-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--gui-border-default, #2a2a2a);
  flex-shrink: 0;
}

.admin-modal-enter-active,
.admin-modal-leave-active {
  transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-modal-enter-active .admin-modal,
.admin-modal-leave-active .admin-modal {
  transition:
    transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 200ms ease;
}

.admin-modal-enter-from,
.admin-modal-leave-to {
  opacity: 0;
}

.admin-modal-enter-from .admin-modal {
  transform: scale(0.92);
  opacity: 0;
}

.admin-modal-leave-to .admin-modal {
  transform: scale(0.96);
  opacity: 0;
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .admin-modal-overlay {
  background: rgba(0, 0, 0, 0.3);
}
.light .admin-modal {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
}
</style>
