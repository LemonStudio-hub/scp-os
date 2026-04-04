<template>
  <div class="scp-status-bar">
    <div class="scp-status-bar__left">
      <span v-for="(item, i) in leftItems" :key="i" class="scp-status-bar__item">{{ item }}</span>
    </div>
    <div class="scp-status-bar__right">
      <span v-for="(item, i) in rightItems" :key="i" class="scp-status-bar__item">{{ item }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  leftItems?: string[]
  rightItems?: string[]
}

withDefaults(defineProps<Props>(), {
  leftItems: () => [],
  rightItems: () => [],
})
</script>

<style scoped>
.scp-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 26px;
  padding: 0 var(--gui-spacing-md, 12px);
  background: var(--gui-bg-surface, #0c0c0c);
  border-top: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-tertiary, #6a6a6a);
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.scp-status-bar__left,
.scp-status-bar__right {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-md, 12px);
}

.scp-status-bar__item {
  white-space: nowrap;
}
</style>
