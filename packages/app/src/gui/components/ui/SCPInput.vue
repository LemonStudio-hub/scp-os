<template>
  <div :class="['scp-input-wrapper', { 'scp-input-wrapper--focus': isFocused, 'scp-input-wrapper--disabled': disabled }]">
    <label v-if="label" :for="inputId" class="scp-input__label">{{ label }}</label>
    <div v-if="prefix" class="scp-input__prefix">{{ prefix }}</div>
    <input
      :id="inputId"
      ref="inputRef"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :autocomplete="autocomplete"
      class="scp-input"
      @input="onInput"
      @focus="isFocused = true"
      @blur="isFocused = false"
      @keydown="$emit('keydown', $event)"
    />
    <button v-if="clearable && modelValue" class="scp-input__clear" @click="onClear" tabindex="-1">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    </button>
    <div v-if="suffix" class="scp-input__suffix">{{ suffix }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  modelValue?: string
  label?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
  prefix?: string
  suffix?: string
  size?: 'sm' | 'md' | 'lg'
  autocomplete?: string
  id?: string
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: undefined,
  type: 'text',
  placeholder: '',
  disabled: false,
  readonly: false,
  clearable: false,
  prefix: undefined,
  suffix: undefined,
  size: 'md',
  autocomplete: 'off',
  id: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'clear': []
  'keydown': [event: KeyboardEvent]
}>()

const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)
const inputId = `scp-input-${Math.random().toString(36).slice(2, 9)}`

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function onClear() {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<style scoped>
/* ── Wrapper ────────────────────────────────────────────────────────── */
.scp-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  background: var(--gui-bg-surface, #0c0c0c);
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.1));
  border-radius: var(--gui-radius-base, 8px);
  padding: 0 var(--gui-spacing-md, 12px);
  transition: all var(--gui-transition-fast, 120ms cubic-bezier(0.4, 0, 0.2, 1));
}

.scp-input-wrapper--focus {
  border-color: var(--gui-accent, #e94560);
  box-shadow: 0 0 0 3px var(--gui-accent-glow, rgba(233, 69, 96, 0.15));
  background: var(--gui-bg-surface-raised, #111111);
}

.scp-input-wrapper--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Label ─────────────────────────────────────────────────────────── */
.scp-input__label {
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-secondary, #a8a8a8);
  font-weight: var(--gui-font-weight-medium, 500);
}

/* ── Input ─────────────────────────────────────────────────────────── */
.scp-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--gui-text-primary, #f0f0f0);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--gui-font-base, 13px);
  padding: var(--gui-spacing-sm, 8px) 0;
}

.scp-input::placeholder {
  color: var(--gui-text-tertiary, #6a6a6a);
}

.scp-input:disabled {
  cursor: not-allowed;
}

/* ── Prefix / Suffix ───────────────────────────────────────────────── */
.scp-input__prefix,
.scp-input__suffix {
  color: var(--gui-text-tertiary, #6a6a6a);
  font-size: var(--gui-font-xs, 11px);
  user-select: none;
  flex-shrink: 0;
}

/* ── Clear Button ──────────────────────────────────────────────────── */
.scp-input__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--gui-text-tertiary, #6a6a6a);
  cursor: pointer;
  padding: 2px;
  border-radius: var(--gui-radius-xs, 4px);
  transition: all var(--gui-transition-fast, 120ms ease);
  flex-shrink: 0;
}

.scp-input__clear:hover {
  color: var(--gui-text-primary, #f0f0f0);
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}
</style>
