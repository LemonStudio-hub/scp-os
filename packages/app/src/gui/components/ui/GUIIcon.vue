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
}

const props = withDefaults(defineProps<Props>(), {
  size: 20,
})

const svg = computed(() => icon(props.name, props.size))
const className = computed(() => `gui-icon--${props.name}`)
</script>

<style scoped>
.gui-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
  flex-shrink: 0;
  line-height: 1;
}

.gui-icon :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
