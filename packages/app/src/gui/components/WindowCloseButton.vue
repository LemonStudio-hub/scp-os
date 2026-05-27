<template>
  <button
    type="button"
    class="window-close-button"
    :class="{ 'window-close-button--caption': caption }"
    :title="title ?? ariaLabel"
    :aria-label="ariaLabel ?? title ?? 'Close'"
    @click.stop="emit('click', $event)"
  ></button>
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
