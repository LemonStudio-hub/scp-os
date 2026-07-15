<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="dialogService.current.value"
        class="g-dialog__overlay"
        @click.self="onOverlayClick"
      >
        <div class="g-dialog__panel" role="dialog" :aria-modal="true">
          <div v-if="dialogService.current.value.title" class="g-dialog__title">
            {{ dialogService.current.value.title }}
          </div>
          <div class="g-dialog__message">{{ dialogService.current.value.message }}</div>

          <input
            v-if="dialogService.current.value.type === 'prompt'"
            ref="promptInput"
            v-model="promptValue"
            class="g-dialog__input"
            type="text"
            @keydown.enter="onConfirm"
            @keydown.esc="onCancel"
          />

          <div class="g-dialog__actions">
            <button
              v-if="dialogService.current.value.type !== 'alert'"
              class="g-dialog__btn g-dialog__btn--cancel"
              @click="onCancel"
            >
              {{ t('common.cancel') }}
            </button>
            <button class="g-dialog__btn g-dialog__btn--confirm" @click="onConfirm">
              {{ t('common.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { dialogService } from '../composables/useDialog'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()
const promptValue = ref('')
const promptInput = ref<HTMLInputElement | null>(null)

watch(
  () => dialogService.current.value,
  (state) => {
    if (!state) return
    promptValue.value = state.defaultValue ?? ''
    if (state.type === 'prompt') {
      nextTick(() => promptInput.value?.focus())
    }
  }
)

function onConfirm() {
  const type = dialogService.current.value?.type
  if (type === 'alert') dialogService.resolve(true)
  else if (type === 'confirm') dialogService.resolve(true)
  else if (type === 'prompt') dialogService.resolve(promptValue.value)
}

function onCancel() {
  const type = dialogService.current.value?.type
  if (type === 'confirm') dialogService.resolve(false)
  else if (type === 'prompt') dialogService.resolve(null)
}

function onOverlayClick() {
  const type = dialogService.current.value?.type
  if (type === 'alert') onConfirm()
}
</script>

<style scoped>
.g-dialog__overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  padding: 24px;
}

.g-dialog__panel {
  width: 100%;
  max-width: 320px;
  background: var(--gui-bg-surface, #1c1c1e);
  border: 0.5px solid var(--gui-border-default, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

.g-dialog__title {
  font-size: var(--gui-font-base, 13px);
  font-weight: 600;
  color: var(--gui-text-primary, #fff);
  text-align: center;
}

.g-dialog__message {
  font-size: var(--gui-font-sm, 12px);
  color: var(--gui-text-secondary, #8e8e93);
  text-align: center;
  line-height: 1.5;
  word-break: break-word;
}

.g-dialog__input {
  width: 100%;
  padding: 8px 12px;
  background: var(--gui-bg-surface-raised, #2c2c2e);
  border: 0.5px solid var(--gui-border-default, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  color: var(--gui-text-primary, #fff);
  font-size: var(--gui-font-sm, 12px);
  outline: none;
  box-sizing: border-box;
}

.g-dialog__input:focus {
  border-color: var(--gui-accent, #0a84ff);
}

.g-dialog__actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.g-dialog__btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 10px;
  font-size: var(--gui-font-sm, 12px);
  font-weight: 500;
  cursor: pointer;
  transition: opacity 100ms ease;
  -webkit-tap-highlight-color: transparent;
}

.g-dialog__btn:active {
  opacity: 0.7;
}

.g-dialog__btn--cancel {
  background: var(--gui-bg-surface-raised, #2c2c2e);
  color: var(--gui-text-secondary, #8e8e93);
}

.g-dialog__btn--confirm {
  background: var(--gui-accent, #0a84ff);
  color: #fff;
}

/* Light mode */
:global(.light) .g-dialog__panel {
  background: #f2f2f7;
  border-color: rgba(0, 0, 0, 0.08);
}

:global(.light) .g-dialog__input {
  background: #fff;
  border-color: rgba(0, 0, 0, 0.1);
  color: #000;
}

:global(.light) .g-dialog__btn--cancel {
  background: #e5e5ea;
  color: #3c3c43;
}

.dialog-fade-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dialog-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>
