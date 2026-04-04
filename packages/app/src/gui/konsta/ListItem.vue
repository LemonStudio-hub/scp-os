<template>
  <div class="k-ios-list__item" @click="$emit('click', $event)">
    <div class="k-ios-list__item-left">
      <slot name="media" />
      <div class="k-ios-list__item-content">
        <div class="k-ios-list__item-label">{{ label }}</div>
        <div v-if="description" class="k-ios-list__item-description">{{ description }}</div>
      </div>
    </div>
    <div class="k-ios-list__item-right">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string
  description?: string
}

defineProps<Props>()
defineEmits<{
  click: [event: MouseEvent]
}>()
</script>
