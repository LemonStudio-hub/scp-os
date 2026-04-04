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
  background: var(--gui-bg-surface, #2C2C2E);
  border: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-md, 10px);
  padding: 0 var(--gui-spacing-md, 12px);
  transition: border-color 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
              background 150ms ease,
              transform 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1);
  will-change: border-color, box-shadow;
}

.scp-input-wrapper--focus {
  border-color: var(--gui-accent, #8E8E93);
  box-shadow: 0 0 0 3px var(--gui-accent-soft, rgba(142, 142, 147, 0.12));
  background: var(--gui-bg-surface-raised, #3A3A3C);
}

.scp-input-wrapper:active {
  transform: scale(0.99);
}

.scp-input-wrapper--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Label ─────────────────────────────────────────────────────────── */
.scp-input__label {
  font-family: var(--gui-font-sans);
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-secondary, #8E8E93);
  font-weight: var(--gui-font-weight-medium, 500);
  margin-bottom: 4px;
  display: block;
  transition: color 150ms ease;
}

.scp-input-wrapper--focus + .scp-input__label,
.scp-input-wrapper--focus ~ .scp-input__label {
  color: var(--gui-accent, #8E8E93);
}

/* ── Input ─────────────────────────────────────────────────────────── */
.scp-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--gui-text-primary, #FFFFFF);
  font-family: var(--gui-font-sans);
  font-size: var(--gui-font-base, 13px);
  padding: var(--gui-spacing-sm, 8px) 0;
  transition: color 150ms ease;
}

.scp-input::placeholder {
  color: var(--gui-text-tertiary, #636366);
  transition: color 150ms ease;
}

.scp-input:focus::placeholder {
  color: var(--gui-text-disabled, #48484A);
}

.scp-input:disabled {
  cursor: not-allowed;
}

/* ── Prefix / Suffix ───────────────────────────────────────────────── */
.scp-input__prefix,
.scp-input__suffix {
  color: var(--gui-text-tertiary, #636366);
  font-size: var(--gui-font-xs, 11px);
  user-select: none;
  flex-shrink: 0;
  transition: color 150ms ease;
}

/* ── Clear Button ──────────────────────────────────────────────────── */
.scp-input__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--gui-text-tertiary, #636366);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--gui-radius-full, 999px);
  transition: all 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1);
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.scp-input__clear:hover {
  color: var(--gui-text-secondary, #8E8E93);
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.scp-input__clear:active {
  transform: scale(0.85);
}
</style>
