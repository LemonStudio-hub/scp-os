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
      :class="['scp-input', { 'scp-input--sm': size === 'sm', 'scp-input--lg': size === 'lg' }]"
      @input="onInput"
      @focus="isFocused = true"
      @blur="isFocused = false"
      @keydown="$emit('keydown', $event)"
    />
    <button v-if="clearable && modelValue" class="scp-input__clear" @click="onClear" tabindex="-1">×</button>
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

const props = withDefaults(defineProps<Props>(), {
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
const inputId = props.id || `scp-input-${Math.random().toString(36).slice(2, 9)}`

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
.scp-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--gui-color-bg-secondary, #111111);
  border: 1px solid var(--gui-color-border-default, #2a2a2a);
  border-radius: var(--gui-radius-base, 6px);
  padding: 0 12px;
  transition: all var(--gui-transition-fast, 150ms ease);
}

.scp-input-wrapper--focus {
  border-color: var(--gui-color-border-active, #e94560);
  box-shadow: 0 0 0 2px rgba(233, 69, 96, 0.15);
}

.scp-input-wrapper--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.scp-input__label {
  font-size: var(--gui-font-sm, 12px);
  color: var(--gui-color-text-secondary, #a0a0a0);
  font-weight: var(--gui-font-weight-medium, 500);
}

.scp-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--gui-color-text-primary, #e0e0e0);
  font-family: inherit;
  font-size: var(--gui-font-base, 13px);
  padding: 8px 0;
}

.scp-input::placeholder {
  color: var(--gui-color-text-muted, #666666);
}

.scp-input:disabled {
  cursor: not-allowed;
}

.scp-input--sm {
  font-size: var(--gui-font-xs, 11px);
  padding: 6px 0;
}

.scp-input--lg {
  font-size: var(--gui-font-lg, 16px);
  padding: 10px 0;
}

.scp-input__prefix,
.scp-input__suffix {
  color: var(--gui-color-text-secondary, #a0a0a0);
  font-size: var(--gui-font-sm, 12px);
  user-select: none;
}

.scp-input__clear {
  background: none;
  border: none;
  color: var(--gui-color-text-secondary, #a0a0a0);
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  transition: color var(--gui-transition-fast, 150ms ease);
}

.scp-input__clear:hover {
  color: var(--gui-color-text-primary, #e0e0e0);
}
</style>
