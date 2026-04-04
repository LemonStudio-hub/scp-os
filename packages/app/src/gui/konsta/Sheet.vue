<template>
  <Transition name="k-ios-sheet">
    <div v-if="visible" class="k-ios-sheet" @click.self="$emit('update:visible', false)">
      <div class="k-ios-sheet__handle">
        <div class="k-ios-sheet__handle-bar" />
      </div>
      <div class="k-ios-sheet__content">
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
}

defineProps<Props>()
defineEmits<{
  'update:visible': [value: boolean]
}>()
</script>

<style scoped>
.k-ios-sheet__content {
  padding: var(--k-ios-padding-md, 12px) var(--k-ios-padding-h, 16px);
  padding-bottom: calc(var(--k-ios-padding-h, 16px) + env(safe-area-inset-bottom, 0px));
}

/* Sheet transitions */
.k-ios-sheet-enter-active {
  transition: all 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.k-ios-sheet-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.k-ios-sheet-enter-from,
.k-ios-sheet-leave-to {
  transform: translateY(100%);
}
</style>
