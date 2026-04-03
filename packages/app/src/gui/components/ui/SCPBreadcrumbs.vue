<template>
  <nav class="scp-breadcrumbs">
    <template v-for="(segment, index) in segments" :key="index">
      <button
        :class="['scp-breadcrumbs__segment', { 'scp-breadcrumbs__segment--active': index === segments.length - 1 }]"
        @click="$emit('navigate', segment.path)"
      >
        <span class="scp-breadcrumbs__label">{{ segment.label }}</span>
      </button>
      <svg v-if="index < segments.length - 1" class="scp-breadcrumbs__chevron" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M5 3L9 7L5 11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </template>
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
  gap: var(--gui-spacing-xxs, 2px);
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--gui-font-xs, 11px);
}

.scp-breadcrumbs__segment {
  display: flex;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  color: var(--gui-text-tertiary, #6a6a6a);
  cursor: pointer;
  padding: var(--gui-spacing-xxs, 2px) var(--gui-spacing-xs, 4px);
  border-radius: var(--gui-radius-xs, 4px);
  transition: all var(--gui-transition-fast, 120ms ease);
}

.scp-breadcrumbs__segment:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-secondary, #a8a8a8);
}

.scp-breadcrumbs__segment--active {
  color: var(--gui-text-primary, #f0f0f0);
  font-weight: var(--gui-font-weight-semibold, 600);
  cursor: default;
}

.scp-breadcrumbs__segment--active:hover {
  background: none;
  color: var(--gui-text-primary, #f0f0f0);
}

.scp-breadcrumbs__chevron {
  color: var(--gui-text-disabled, #444444);
  flex-shrink: 0;
}

.scp-breadcrumbs__label {
  white-space: nowrap;
  letter-spacing: 0.02em;
}
</style>
