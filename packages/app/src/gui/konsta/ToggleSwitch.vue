<template>
  <div
    :class="['k-ios-toggle', { 'k-ios-toggle--on': active }]"
    @click="$emit('update:active', !active)"
  >
    <div class="k-ios-toggle__track" />
    <div class="k-ios-toggle__thumb" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  active: boolean
}

defineProps<Props>()
defineEmits<{
  'update:active': [value: boolean]
}>()
</script>
