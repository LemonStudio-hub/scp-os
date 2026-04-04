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
  border-radius: var(--gui-radius-base, 8px);
  font-family: var(--gui-font-sans);
  font-weight: var(--gui-font-weight-medium, 500);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms cubic-bezier(0.4, 0, 0.2, 1));
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}

.gui-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0);
  transition: background var(--gui-transition-fast, 120ms ease);
  border-radius: inherit;
}

.gui-btn:hover::after {
  background: rgba(255, 255, 255, 0.04);
}

.gui-btn:active::after {
  background: rgba(0, 0, 0, 0.08);
}

.gui-btn:active:not(.gui-btn--disabled) {
  transform: scale(0.97);
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
  background: var(--gui-accent, #e94560);
  color: var(--gui-text-inverse, #ffffff);
}

.gui-btn--primary:hover::after {
  background: rgba(255, 255, 255, 0.1);
}

.gui-btn--secondary {
  background: var(--gui-bg-surface-raised, #111111);
  color: var(--gui-text-primary, #f0f0f0);
}

.gui-btn--danger {
  background: var(--gui-error-bg, rgba(248, 113, 113, 0.1));
  color: var(--gui-error, #f87171);
}

.gui-btn--success {
  background: var(--gui-success-bg, rgba(52, 211, 153, 0.1));
  color: var(--gui-success, #34d399);
}

.gui-btn--ghost {
  background: transparent;
  color: var(--gui-text-secondary, #a0a0a0);
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
  padding: 7px 14px;
  font-size: var(--gui-font-base, 13px);
}

.gui-btn--lg {
  padding: 10px 20px;
  font-size: var(--gui-font-lg, 15px);
  border-radius: var(--gui-radius-md, 10px);
}
</style>
