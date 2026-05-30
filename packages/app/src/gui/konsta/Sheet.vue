<template>
  <Teleport to="body">
    <Transition name="k-ios-backdrop">
      <div v-if="visible" class="k-ios-sheet__backdrop" @click="$emit('update:visible', false)" />
    </Transition>
    <Transition name="k-ios-sheet">
      <div v-if="visible" class="k-ios-sheet">
        <div class="k-ios-sheet__handle">
          <div class="k-ios-sheet__handle-bar" />
        </div>
        <div class="k-ios-sheet__content">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
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
.k-ios-sheet__backdrop {
  position: fixed;
  inset: 0;
  z-index: 998;
  background: rgba(0, 0, 0, 0.4);
}

.k-ios-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background: var(--gui-bg-surface, #1c1c1e);
  border-radius: 16px 16px 0 0;
}

.k-ios-sheet__content {
  padding: var(--k-ios-padding-md, 12px) var(--k-ios-padding-h, 16px);
  padding-bottom: calc(var(--k-ios-padding-h, 16px) + env(safe-area-inset-bottom, 0px));
}

/* Backdrop transition */
.k-ios-backdrop-enter-active,
.k-ios-backdrop-leave-active {
  transition: opacity 0.25s ease;
}

.k-ios-backdrop-enter-from,
.k-ios-backdrop-leave-to {
  opacity: 0;
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
