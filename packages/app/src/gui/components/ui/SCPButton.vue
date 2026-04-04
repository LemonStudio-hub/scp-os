<template>
  <button
    :class="['gui-btn', `gui-btn--${variant}`, `gui-btn--${size}`, {
      'gui-btn--block': block,
      'gui-btn--disabled': disabled,
      'gui-btn--loading': loading,
    }]"
    :disabled="disabled || loading"
    :title="title"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="gui-btn__spinner">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.5" stroke-dasharray="17" stroke-dashoffset="5" stroke-linecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 7 7" to="360 7 7" dur="0.8s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </span>
    <GUIIcon v-if="iconName && !loading" :name="iconName" :size="iconSize" class="gui-btn__icon" />
    <span v-if="$slots.default" class="gui-btn__label"><slot /></span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import GUIIcon from './GUIIcon.vue'
import type { IconName } from '../../icons'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: IconName
  block?: boolean
  disabled?: boolean
  loading?: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'md',
  icon: undefined,
  block: false,
  disabled: false,
  loading: false,
  title: undefined,
})

const iconName = computed<IconName | undefined>(() => props.icon as IconName | undefined)
const iconSize = computed(() => props.size === 'sm' ? 14 : props.size === 'lg' ? 18 : 16)

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style scoped>
/* ── Base Button ───────────────────────────────────────────────────── */
.gui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--gui-spacing-xs, 4px);
  border: none;
  border-radius: var(--gui-radius-md, 10px);
  font-family: var(--gui-font-sans);
  font-weight: var(--gui-font-weight-medium, 500);
  cursor: pointer;
  transition: transform 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1),
              background 120ms ease,
              box-shadow 120ms ease,
              opacity 120ms ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  will-change: transform;
}

.gui-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0);
  transition: background 120ms ease;
  border-radius: inherit;
  pointer-events: none;
}

.gui-btn:hover::after {
  background: rgba(255, 255, 255, 0.04);
}

.gui-btn:active:not(.gui-btn--disabled) {
  transform: scale(0.96);
}

.gui-btn--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.gui-btn--block {
  width: 100%;
}

/* ── Icon ───────────────────────────────────────────────────────────── */
.gui-btn__icon {
  display: flex;
  align-items: center;
  line-height: 1;
}

.gui-btn__label {
  line-height: 1.2;
}

.gui-btn__spinner {
  display: flex;
  align-items: center;
}

/* ── Variants ───────────────────────────────────────────────────────── */
.gui-btn--primary {
  background: var(--gui-accent, #8E8E93);
  color: var(--gui-text-inverse, #000000);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.gui-btn--primary:hover::after {
  background: rgba(255, 255, 255, 0.1);
}

.gui-btn--secondary {
  background: var(--gui-bg-surface-raised, #3A3A3C);
  color: var(--gui-text-primary, #FFFFFF);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.gui-btn--danger {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.12));
  color: var(--gui-error, #FF3B30);
}

.gui-btn--success {
  background: var(--gui-success-bg, rgba(52, 199, 89, 0.12));
  color: var(--gui-success, #34C759);
}

.gui-btn--ghost {
  background: transparent;
  color: var(--gui-text-secondary, #8E8E93);
}

.gui-btn--ghost:hover::after {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

/* ── Sizes ─────────────────────────────────────────────────────────── */
.gui-btn--sm {
  padding: 5px 10px;
  font-size: var(--gui-font-xs, 11px);
  border-radius: var(--gui-radius-sm, 6px);
  gap: var(--gui-spacing-xxs, 2px);
}

.gui-btn--md {
  padding: 8px 16px;
  font-size: var(--gui-font-base, 13px);
}

.gui-btn--lg {
  padding: 12px 24px;
  font-size: var(--gui-font-lg, 15px);
  border-radius: var(--gui-radius-md, 10px);
}
</style>
