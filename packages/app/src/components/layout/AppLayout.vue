<template>
  <div class="app-layout">
    <slot name="sidebar" />
    <div class="app-content">
      <slot name="header" />
      <slot name="default" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * App Layout Component
 * Provides a consistent layout structure for the application
 */
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>