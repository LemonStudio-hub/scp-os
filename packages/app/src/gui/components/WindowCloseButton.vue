<template>
  <button
    type="button"
    class="window-close-button"
    :class="{ 'window-close-button--caption': caption }"
    :title="title ?? ariaLabel"
    :aria-label="ariaLabel ?? title ?? 'Close'"
    @click.stop="emit('click', $event)"
  >
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
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
  width: 10px;
  height: 10px;
  pointer-events: none;
}
</style>
