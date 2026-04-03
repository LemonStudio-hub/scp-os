<template>
  <div class="scp-status-bar">
    <div class="scp-status-bar__left">
      <span v-for="(item, i) in leftItems" :key="i" class="scp-status-bar__item">
        {{ item }}
      </span>
    </div>
    <div class="scp-status-bar__right">
      <span v-for="(item, i) in rightItems" :key="i" class="scp-status-bar__item">
        {{ item }}
      </span>
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
  height: 24px;
  padding: 0 12px;
  background: var(--gui-color-bg-tertiary, #1a1a1a);
  border-top: 1px solid var(--gui-color-border-default, #2a2a2a);
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-color-text-secondary, #a0a0a0);
  flex-shrink: 0;
}

.scp-status-bar__left,
.scp-status-bar__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scp-status-bar__item {
  white-space: nowrap;
}
</style>
