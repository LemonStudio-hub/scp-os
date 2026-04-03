<template>
  <nav class="scp-breadcrumbs">
    <button
      v-for="(segment, index) in segments"
      :key="index"
      :class="['scp-breadcrumbs__segment', { 'scp-breadcrumbs__segment--active': index === segments.length - 1 }]"
      @click="$emit('navigate', segment.path)"
    >
      <span class="scp-breadcrumbs__label">{{ segment.label }}</span>
      <span v-if="index < segments.length - 1" class="scp-breadcrumbs__separator">/</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
interface BreadcrumbSegment {
  label: string
  path: string
}

interface Props {
  segments: BreadcrumbSegment[]
}

defineProps<Props>()
defineEmits<{
  navigate: [path: string]
}>()
</script>

<style scoped>
.scp-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  background: var(--gui-color-bg-tertiary, #1a1a1a);
  border-radius: var(--gui-radius-sm, 4px);
  font-size: var(--gui-font-sm, 12px);
}

.scp-breadcrumbs__segment {
  display: flex;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  color: var(--gui-color-text-secondary, #a0a0a0);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: var(--gui-radius-sm, 4px);
  transition: all var(--gui-transition-fast, 150ms ease);
}

.scp-breadcrumbs__segment:hover {
  background: var(--gui-color-bg-hover, #1e1e1e);
  color: var(--gui-color-text-primary, #e0e0e0);
}

.scp-breadcrumbs__segment--active {
  color: var(--gui-color-text-primary, #e0e0e0);
  font-weight: var(--gui-font-weight-medium, 500);
}

.scp-breadcrumbs__separator {
  color: var(--gui-color-text-muted, #666666);
  user-select: none;
}

.scp-breadcrumbs__label {
  white-space: nowrap;
}
</style>
