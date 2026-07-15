<template>
  <div v-if="error" class="error-boundary" :title="error.message">
    <div class="error-boundary__icon">⚠</div>
    <div class="error-boundary__label">{{ label ?? 'Render Error' }}</div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, provide } from 'vue'
import logger from '../../utils/logger'

const props = defineProps<{
  label?: string
}>()

const error = ref<Error | null>(null)

onErrorCaptured((err: Error, _instance, info: string) => {
  error.value = err
  logger.error(`[ErrorBoundary] ${props.label ?? 'Component'}:`, err, info)
  // Stop propagation so the error doesn't bubble up and crash the whole app
  return false
})

// Allow child components to reset the error state
provide('resetError', () => {
  error.value = null
})
</script>

<style scoped>
.error-boundary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  min-width: 120px;
  min-height: 80px;
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.1));
  border: 1px solid var(--gui-error, #ff3b30);
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-error, #ff3b30);
  font-size: var(--gui-font-xs, 11px);
  pointer-events: auto;
}

.error-boundary__icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.error-boundary__label {
  text-align: center;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
