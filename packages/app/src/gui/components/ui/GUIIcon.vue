<template>
  <span
    class="gui-icon"
    :class="className"
    :style="{ width: `${size}px`, height: `${size}px` }"
    v-html="svg"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { icon, type IconName } from '../../icons'

interface Props {
  name: IconName
  size?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 20,
  color: undefined,
})

const svg = computed(() => icon(props.name, props.size))
const className = computed(() => `gui-icon--${props.name}`)
</script>

<style scoped>
.gui-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--gui-text-secondary, #a0a0a0);
  flex-shrink: 0;
  line-height: 1;
}

.gui-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

/* Context-specific color overrides */
.gui-icon--folder {
  color: var(--gui-accent, #e94560);
}

.gui-icon--folder-open {
  color: var(--gui-accent, #e94560);
}

.gui-icon--edit {
  color: var(--gui-info, #60a5fa);
}

.gui-icon--trash {
  color: var(--gui-error, #f87171);
}

.gui-icon--refresh {
  color: var(--gui-text-secondary, #a0a0a0);
}

.gui-icon--save {
  color: var(--gui-success, #34d399);
}

.gui-icon--search {
  color: var(--gui-text-secondary, #a0a0a0);
}

.gui-icon--terminal {
  color: var(--gui-accent, #e94560);
}

.gui-icon--settings {
  color: var(--gui-text-secondary, #a0a0a0);
}

.gui-icon--file {
  color: var(--gui-text-secondary, #a0a0a0);
}

.gui-icon--list {
  color: var(--gui-text-secondary, #a0a0a0);
}

.gui-icon--empty-folder {
  color: var(--gui-text-disabled, #444444);
}

.gui-icon--empty-doc {
  color: var(--gui-text-disabled, #444444);
}
</style>
