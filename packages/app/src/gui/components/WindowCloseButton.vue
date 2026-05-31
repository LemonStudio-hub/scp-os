<template>
  <button
    type="button"
    class="window-close-button"
    :class="{ 'window-close-button--caption': caption }"
    :title="title ?? ariaLabel"
    :aria-label="ariaLabel ?? title ?? 'Close'"
    @click.stop="emit('click', $event)"
  >
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-linecap="round"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    ariaLabel?: string
    caption?: boolean
  }>(),
  {
    title: undefined,
    ariaLabel: 'Close',
    caption: false,
  }
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style scoped>
.window-close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: calc(100% + 1px);
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--gui-text-secondary, #8e8e93);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    background var(--gui-transition-fast, 120ms ease),
    color var(--gui-transition-fast, 120ms ease);
}

.window-close-button:hover {
  background: var(--gui-error, #ff3b30);
  color: #fff;
}

.window-close-button:active {
  background: var(--gui-error, #ff3b30);
  opacity: 0.8;
}

.window-close-button svg {
  width: 12px;
  height: 12px;
  pointer-events: none;
}

.window-close-button--caption:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  color: var(--gui-text-primary, #ffffff);
}

.window-close-button--caption:active {
  background: var(--gui-bg-surface-raised, rgba(255, 255, 255, 0.12));
  opacity: 1;
}
</style>
