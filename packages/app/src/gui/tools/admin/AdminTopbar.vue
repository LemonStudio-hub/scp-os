<script setup lang="ts">
import { computed } from 'vue'
import { useAdminStore } from './stores/adminStore'
import { useI18n } from '../../composables/useI18n'

const emit = defineEmits<{ logout: [] }>()
const adminStore = useAdminStore()
const { t } = useI18n()

const roleLabel = computed(() => {
  if (adminStore.admin?.role === 'super_admin') return t('admin.role.superAdmin')
  return t('admin.role.admin')
})
</script>

<template>
  <header class="admin-topbar">
    <div class="admin-topbar__title">
      <slot name="title">
        <span class="admin-topbar__page-title">{{ t('admin.title') }}</span>
      </slot>
    </div>

    <div class="admin-topbar__right">
      <div class="admin-topbar__user">
        <span class="admin-topbar__username">{{ adminStore.admin?.username || 'Admin' }}</span>
        <span class="admin-topbar__role">{{ roleLabel }}</span>
      </div>
      <button class="admin-topbar__logout" :title="t('admin.logout')" @click="emit('logout')">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: var(--gui-bg-surface, #1c1c1e);
  border-bottom: 1px solid var(--gui-border-subtle, #1a1a1a);
  flex-shrink: 0;
}

.admin-topbar__title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-topbar__page-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--gui-text-primary, #ffffff);
  letter-spacing: -0.01em;
}

.admin-topbar__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-topbar__user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-topbar__username {
  font-size: 13px;
  font-weight: 500;
  color: var(--gui-text-secondary, #cccccc);
}

.admin-topbar__role {
  font-size: 11px;
  font-weight: 500;
  color: var(--gui-error, #e94560);
  background: rgba(233, 69, 96, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.02em;
}

.admin-topbar__logout {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--gui-text-tertiary, #666666);
  cursor: pointer;
  transition: all 0.15s ease;
}

.admin-topbar__logout:hover {
  background: rgba(233, 69, 96, 0.1);
  color: var(--gui-error, #e94560);
}
</style>
