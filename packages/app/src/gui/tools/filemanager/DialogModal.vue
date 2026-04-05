<template>
  <Transition name="fm-dialog">
    <div v-if="visible" class="fm-dialog-overlay" @click.self="onCancel">
      <div class="fm-dialog">
        <div class="fm-dialog__header">{{ title }}</div>
        
        <!-- Input type -->
        <div v-if="type === 'input'" class="fm-dialog__body">
          <input
            ref="inputRef"
            v-model="inputValue"
            class="fm-dialog__input"
            :placeholder="placeholder"
            @keydown.enter="onConfirm"
            @keydown.escape="onCancel"
          />
        </div>
        
        <!-- Confirm type -->
        <div v-else-if="type === 'confirm'" class="fm-dialog__body">
          <p class="fm-dialog__message">{{ message }}</p>
        </div>

        <!-- Actions -->
        <div class="fm-dialog__actions">
          <button
            v-if="type === 'confirm'"
            class="fm-dialog__btn fm-dialog__btn--cancel"
            @click="onCancel"
          >
            {{ effectiveCancelText }}
          </button>
          <button
            class="fm-dialog__btn fm-dialog__btn--confirm"
            :class="{ 'fm-dialog__btn--danger': danger }"
            @click="onConfirm"
          >
            {{ effectiveConfirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useI18n } from '../../composables/useI18n'

export type DialogType = 'input' | 'confirm'

interface Props {
  visible: boolean
  type?: DialogType
  title?: string
  message?: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', value: string | true): void
  (e: 'cancel'): void
}

const { t } = useI18n()

const props = withDefaults(defineProps<Props>(), {
  type: 'input',
  title: '',
  message: '',
  placeholder: '',
  defaultValue: '',
  confirmText: '',
  cancelText: '',
  danger: false,
})

const emit = defineEmits<Emits>()

const effectiveConfirmText = computed(() => props.confirmText || t('common.confirm'))
const effectiveCancelText = computed(() => props.cancelText || t('common.cancel'))

const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref(props.defaultValue)

watch(() => props.visible, async (val) => {
  if (val) {
    inputValue.value = props.defaultValue
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.select()
  }
})

function onConfirm() {
  if (props.type === 'input') {
    emit('confirm', inputValue.value)
  } else {
    emit('confirm', true)
  }
  emit('update:visible', false)
}

function onCancel() {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
/* ── Overlay ────────────────────────────────────────────────────────── */
.fm-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.fm-dialog {
  width: 270px;
  background: var(--gui-bg-surface, #2C2C2E);
  border-radius: 14px;
  overflow: hidden;
  animation: fm-dialog-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes fm-dialog-pop {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* ── Header ─────────────────────────────────────────────────────────── */
.fm-dialog__header {
  padding: 16px 16px 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
  text-align: center;
}

/* ── Body ───────────────────────────────────────────────────────────── */
.fm-dialog__body {
  padding: 8px 16px 16px;
}

.fm-dialog__input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  border: 0.5px solid var(--gui-border-subtle, #38383A);
  background: var(--gui-bg-base, #0A0A0A);
  color: var(--gui-text-primary, #FFFFFF);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.fm-dialog__input:focus {
  border-color: var(--gui-accent, #007AFF);
}

.fm-dialog__input::placeholder {
  color: var(--gui-text-tertiary, #636366);
}

.fm-dialog__message {
  font-size: 14px;
  color: var(--gui-text-secondary, #8E8E93);
  text-align: center;
  margin: 0;
  line-height: 1.4;
}

/* ── Actions ────────────────────────────────────────────────────────── */
.fm-dialog__actions {
  display: flex;
  border-top: 0.5px solid var(--gui-border-subtle, #38383A);
}

.fm-dialog__btn {
  flex: 1;
  height: 44px;
  background: none;
  border: none;
  color: var(--gui-accent, #007AFF);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.fm-dialog__btn:active {
  background: var(--gui-bg-surface-hover, #3A3A3C);
}

.fm-dialog__btn + .fm-dialog__btn {
  border-left: 0.5px solid var(--gui-border-subtle, #38383A);
}

.fm-dialog__btn--danger {
  color: #FF3B30;
}

/* ── Transition ─────────────────────────────────────────────────────── */
.fm-dialog-enter-active,
.fm-dialog-leave-active {
  transition: opacity 0.2s ease;
}

.fm-dialog-enter-from,
.fm-dialog-leave-to {
  opacity: 0;
}
</style>
