<template>
  <button
    :class="['scp-button', `scp-button--${variant}`, {
      'scp-button--sm': size === 'sm',
      'scp-button--lg': size === 'lg',
      'scp-button--block': block,
      'scp-button--disabled': disabled,
    }]"
    :disabled="disabled"
    :title="title"
    @click="$emit('click', $event)"
  >
    <span v-if="icon" class="scp-button__icon" v-html="icon"></span>
    <span v-if="$slots.default" class="scp-button__label"><slot /></span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  block?: boolean
  disabled?: boolean
  title?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'md',
  icon: undefined,
  block: false,
  disabled: false,
  title: undefined,
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style scoped>
.scp-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--gui-color-border-default, #2a2a2a);
  border-radius: var(--gui-radius-base, 6px);
  font-family: inherit;
  font-size: var(--gui-font-base, 13px);
  font-weight: var(--gui-font-weight-medium, 500);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 150ms ease);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}

.scp-button:hover:not(.scp-button--disabled) {
  border-color: var(--gui-color-border-hover, #3a3a3a);
  background: var(--gui-color-bg-hover, #1e1e1e);
}

.scp-button:active:not(.scp-button--disabled) {
  transform: scale(0.98);
}

.scp-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variants */
.scp-button--primary {
  background: var(--gui-color-scp-red-bright, #e94560);
  color: #fff;
  border-color: var(--gui-color-scp-red-bright, #e94560);
}

.scp-button--primary:hover:not(.scp-button--disabled) {
  background: #d13a52;
  border-color: #d13a52;
}

.scp-button--secondary {
  background: var(--gui-color-bg-tertiary, #1a1a1a);
  color: var(--gui-color-text-primary, #e0e0e0);
}

.scp-button--danger {
  background: var(--gui-color-error, #ff4444);
  color: #fff;
  border-color: var(--gui-color-error, #ff4444);
}

.scp-button--success {
  background: var(--gui-color-success, #00ff00);
  color: #000;
  border-color: var(--gui-color-success, #00ff00);
}

.scp-button--ghost {
  background: transparent;
  color: var(--gui-color-text-secondary, #a0a0a0);
  border-color: transparent;
}

.scp-button--ghost:hover:not(.scp-button--disabled) {
  background: var(--gui-color-bg-hover, #1e1e1e);
  color: var(--gui-color-text-primary, #e0e0e0);
}

.scp-button--icon {
  padding: 6px;
  min-width: 32px;
}

/* Sizes */
.scp-button--sm {
  padding: 4px 10px;
  font-size: var(--gui-font-xs, 11px);
  border-radius: var(--gui-radius-sm, 4px);
}

.scp-button--md {
  padding: 6px 14px;
}

.scp-button--lg {
  padding: 10px 20px;
  font-size: var(--gui-font-lg, 16px);
}

.scp-button--block {
  width: 100%;
}

.scp-button__icon {
  display: flex;
  align-items: center;
  line-height: 1;
}

.scp-button__label {
  line-height: 1;
}
</style>
