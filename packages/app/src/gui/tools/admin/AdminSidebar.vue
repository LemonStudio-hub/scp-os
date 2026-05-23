<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'

const props = defineProps<{
  currentPage: string
  collapsed: boolean
}>()

const emit = defineEmits<{
  navigate: [page: string]
  toggleCollapse: []
}>()

const { t } = useI18n()

const navItems = computed(() => [
  { id: 'dashboard', label: t('admin.nav.dashboard'), icon: 'grid' },
  { id: 'users', label: t('admin.nav.users'), icon: 'users' },
  { id: 'content', label: t('admin.nav.content'), icon: 'document' },
  { id: 'chat', label: t('admin.nav.chat'), icon: 'chat' },
  { id: 'feedback', label: t('admin.nav.feedback'), icon: 'message' },
  { id: 'settings', label: t('admin.nav.settings'), icon: 'cog' },
  { id: 'logs', label: t('admin.nav.logs'), icon: 'clipboard' },
])

function getIconSvg(icon: string): string {
  const icons: Record<string, string> = {
    grid: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    users:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
    document:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    chat: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>',
    message:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    cog: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    clipboard:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
  }
  return icons[icon] || ''
}
</script>

<template>
  <aside class="admin-sidebar" :class="{ 'admin-sidebar--collapsed': collapsed }">
    <div class="admin-sidebar__header">
      <div class="admin-sidebar__logo">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <span v-if="!collapsed" class="admin-sidebar__brand">Admin</span>
      <button class="admin-sidebar__toggle" @click="emit('toggleCollapse')">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline v-if="!collapsed" points="11 17 6 12 11 7" />
          <polyline v-else points="13 7 18 12 13 17" />
        </svg>
      </button>
    </div>

    <nav class="admin-sidebar__nav">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="admin-sidebar__item"
        :class="{ 'admin-sidebar__item--active': currentPage === item.id }"
        :title="collapsed ? item.label : undefined"
        @click="emit('navigate', item.id)"
      >
        <span class="admin-sidebar__icon" v-html="getIconSvg(item.icon)"></span>
        <span v-if="!collapsed" class="admin-sidebar__label">{{ item.label }}</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.admin-sidebar {
  width: 240px;
  height: 100%;
  background: var(--gui-bg-surface, #0f0f0f);
  border-right: 1px solid var(--gui-border-subtle, #1a1a1a);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.admin-sidebar--collapsed {
  width: 64px;
}

.admin-sidebar__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid var(--gui-border-subtle, #1a1a1a);
  height: 56px;
  box-sizing: border-box;
}

.admin-sidebar__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--gui-error-bg, rgba(233, 69, 96, 0.1));
  color: var(--gui-error, #e94560);
  flex-shrink: 0;
}

.admin-sidebar__brand {
  font-size: 14px;
  font-weight: 700;
  color: var(--gui-text-primary, #ffffff);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.admin-sidebar__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--gui-text-tertiary, #666666);
  cursor: pointer;
  margin-left: auto;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.admin-sidebar__toggle:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-secondary, #aaaaaa);
}

.admin-sidebar__nav {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.admin-sidebar__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--gui-text-tertiary, #888888);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.admin-sidebar__item:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.04));
  color: var(--gui-text-secondary, #cccccc);
}

.admin-sidebar__item--active {
  background: var(--gui-error-bg, rgba(233, 69, 96, 0.1));
  color: var(--gui-error, #e94560);
}

.admin-sidebar__item--active:hover {
  background: rgba(233, 69, 96, 0.15);
  color: var(--gui-error, #e94560);
}

.admin-sidebar__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.admin-sidebar__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-sidebar--collapsed .admin-sidebar__item {
  justify-content: center;
  padding: 10px;
}

.admin-sidebar--collapsed .admin-sidebar__toggle {
  margin-left: 0;
}
</style>
