<template>
  <div
    class="window-caption-controls"
    :class="{ 'window-caption-controls--with-left-margin': withLeftMargin }"
    @mousedown.stop
  >
    <button
      v-if="minimizable"
      type="button"
      class="window-caption-controls__button window-caption-controls__button--minimize"
      :title="minimizeTitle"
      :aria-label="minimizeTitle ?? 'Minimize'"
      @click.stop="emit('minimize')"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <rect x="2" y="6" width="8" height="1.5" rx="0.75" fill="currentColor" />
      </svg>
    </button>

    <button
      v-if="maximizable"
      type="button"
      class="window-caption-controls__button window-caption-controls__button--maximize"
      :title="maximized ? restoreTitle : maximizeTitle"
      :aria-label="maximized ? (restoreTitle ?? 'Restore') : (maximizeTitle ?? 'Maximize')"
      @click.stop="emit('maximize')"
    >
      <svg
        v-if="!maximized"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2" />
      </svg>
      <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <rect x="1" y="3" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2" />
        <path
          d="M3 3V2C3 1.45 3.45 1 4 1H11V4L10 3"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linecap="round"
        />
      </svg>
    </button>

    <WindowCloseButton
      v-if="closable"
      caption
      :title="closeTitle"
      :aria-label="closeTitle ?? 'Close'"
      @click="emit('close')"
    />
  </div>
</template>

<script setup lang="ts">
import WindowCloseButton from './WindowCloseButton.vue'

withDefaults(
  defineProps<{
    minimizable?: boolean
    maximizable?: boolean
    closable?: boolean
    maximized?: boolean
    minimizeTitle?: string
    maximizeTitle?: string
    restoreTitle?: string
    closeTitle?: string
    withLeftMargin?: boolean
  }>(),
  {
    minimizable: true,
    maximizable: true,
    closable: true,
    maximized: false,
    minimizeTitle: undefined,
    maximizeTitle: undefined,
    restoreTitle: undefined,
    closeTitle: undefined,
    withLeftMargin: false,
  }
)

const emit = defineEmits<{
  minimize: []
  maximize: []
  close: []
}>()
</script>

<style scoped>
.window-caption-controls {
  display: flex;
  align-items: center;
  align-self: stretch;
  gap: 0;
  margin-top: -1px;
  margin-right: -1px;
}

.window-caption-controls--with-left-margin {
  margin-left: var(--gui-spacing-sm, 8px);
}

.window-caption-controls__button {
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

.window-caption-controls__button:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  color: var(--gui-text-primary, #ffffff);
}

.window-caption-controls__button:active {
  background: var(--gui-bg-surface-raised, rgba(255, 255, 255, 0.12));
}

.window-caption-controls__button svg {
  width: 12px;
  height: 12px;
  pointer-events: none;
}
</style>
