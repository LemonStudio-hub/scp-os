<!-- eslint-disable @typescript-eslint/no-explicit-any -->

<template>
  <div class="audit-log">
    <div class="audit-log__toolbar">
      <div class="audit-log__filters">
        <select v-model="actionFilter" class="audit-log__select" @change="onFilterChange">
          <option value="">{{ t('admin.logs.allActions') }}</option>
          <option value="login">{{ t('admin.logs.actionLogin') }}</option>
          <option value="ban_user">{{ t('admin.logs.actionBanUser') }}</option>
          <option value="unban_user">{{ t('admin.logs.actionUnbanUser') }}</option>
          <option value="delete_user">{{ t('admin.logs.actionDeleteUser') }}</option>
          <option value="delete_content">{{ t('admin.logs.actionDeleteContent') }}</option>
          <option value="update_content">{{ t('admin.logs.actionUpdateContent') }}</option>
          <option value="delete_message">{{ t('admin.logs.actionDeleteMessage') }}</option>
          <option value="delete_feedback">{{ t('admin.logs.actionDeleteFeedback') }}</option>
          <option value="update_settings">{{ t('admin.logs.actionUpdateSettings') }}</option>
          <option value="batch_operation">{{ t('admin.logs.actionBatchOperation') }}</option>
        </select>
        <div class="audit-log__date-range">
          <input
            v-model="startDate"
            class="audit-log__date-input"
            type="date"
            @change="onFilterChange"
          />
          <span class="audit-log__date-sep">{{ t('admin.logs.to') }}</span>
          <input
            v-model="endDate"
            class="audit-log__date-input"
            type="date"
            @change="onFilterChange"
          />
        </div>
      </div>
    </div>

    <DataTable :columns="columns" :data="logs" :loading="loading" :selectable="false">
      <template #cell-action="{ row }">
        <span class="audit-log__action-badge">{{ formatAction(row.action) }}</span>
      </template>
      <template #cell-details="{ value }">
        <span class="audit-log__details" :title="value">{{ truncateDetails(value) }}</span>
      </template>
      <template #cell-created_at="{ value }">
        {{ formatDate(value) }}
      </template>
    </DataTable>

    <Pagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="totalItems"
      @page-change="currentPage = $event"
    />
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed, watch, onMounted } from 'vue'
import { DataTable, Pagination } from '../components'
import type { TableColumn } from '../components'
import { useToast } from '../composables/useToast'
import { useAdminStore } from '../stores/adminStore'
import { useI18n } from '../../../composables/useI18n'
import * as adminApi from '../services/adminApi'

const toast = useToast()
const adminStore = useAdminStore()
const { t } = useI18n()

const actionLabels = computed<Record<string, string>>(() => ({
  login: t('admin.logs.actionLogin'),
  ban_user: t('admin.logs.actionBanUser'),
  unban_user: t('admin.logs.actionUnbanUser'),
  delete_user: t('admin.logs.actionDeleteUser'),
  delete_content: t('admin.logs.actionDeleteContent'),
  update_content: t('admin.logs.actionUpdateContent'),
  delete_message: t('admin.logs.actionDeleteMessage'),
  delete_feedback: t('admin.logs.actionDeleteFeedback'),
  update_settings: t('admin.logs.actionUpdateSettings'),
  batch_operation: t('admin.logs.actionBatchOperation'),
  export_data: t('admin.logs.actionExportData'),
  import_data: t('admin.logs.actionImportData'),
}))

const columns = computed<TableColumn[]>(() => [
  { key: 'id', label: 'ID', width: '70px' },
  { key: 'admin_username', label: t('admin.logs.colOperator') },
  { key: 'action', label: t('admin.logs.colActionType'), width: '120px' },
  { key: 'target_type', label: t('admin.logs.colTargetType'), width: '100px' },
  { key: 'target_id', label: t('admin.logs.colTargetId'), width: '90px' },
  { key: 'details', label: t('admin.logs.colDetails') },
  { key: 'ip_address', label: t('admin.logs.colIp'), width: '130px' },
  { key: 'created_at', label: t('admin.logs.colTime') },
])

const logs = ref<Record<string, any>[]>([])
const loading = ref(false)
const actionFilter = ref('')
const startDate = ref('')
const endDate = ref('')
const currentPage = ref(1)
const totalItems = ref(0)
const pageSize = 20

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))

function formatAction(action: string): string {
  return actionLabels.value[action] || action
}

function truncateDetails(val: string): string {
  if (!val) return '-'
  if (val.length > 60) return val.slice(0, 60) + '...'
  return val
}

function formatDate(val: string | number) {
  if (!val) return '-'
  const d = new Date(typeof val === 'number' ? val * 1000 : val)
  if (isNaN(d.getTime())) return String(val)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function onFilterChange() {
  currentPage.value = 1
  fetchLogs()
}

async function fetchLogs() {
  const token = adminStore.token
  if (!token) return
  loading.value = true
  try {
    const params: Record<string, any> = {
      limit: pageSize,
      offset: (currentPage.value - 1) * pageSize,
    }
    if (actionFilter.value) params.action = actionFilter.value
    if (startDate.value) params.start_date = startDate.value
    if (endDate.value) params.end_date = endDate.value
    const res = await adminApi.getAdminLogs(token, params)
    if (res.success) {
      logs.value = res.data || []
      totalItems.value = res.total ?? logs.value.length
    } else {
      toast.error(res.error || t('admin.logs.fetchError'))
    }
  } catch {
    toast.error(t('admin.logs.fetchError'))
  } finally {
    loading.value = false
  }
}

watch(currentPage, fetchLogs)
onMounted(fetchLogs)
</script>

<style scoped>
.audit-log {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.audit-log__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.audit-log__filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.audit-log__select {
  padding: 7px 12px;
  background: var(--gui-bg-surface-raised, #1a1a1a);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 8px;
  color: var(--gui-text-primary, #e0e0e0);
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: border-color 150ms ease;
}

.audit-log__select:focus {
  border-color: var(--gui-error, #e94560);
}

.audit-log__date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.audit-log__date-input {
  padding: 6px 10px;
  background: var(--gui-bg-surface-raised, #1a1a1a);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 8px;
  color: var(--gui-text-primary, #e0e0e0);
  font-size: 13px;
  outline: none;
  transition: border-color 150ms ease;
  color-scheme: dark;
}

.light .audit-log__date-input {
  color-scheme: light;
}

.audit-log__date-input:focus {
  border-color: var(--gui-error, #e94560);
}

.audit-log__date-sep {
  font-size: 12px;
  color: var(--gui-text-tertiary, #6a6a6a);
}

.audit-log__action-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(233, 69, 96, 0.1);
  color: var(--gui-error, #e94560);
}

.audit-log__details {
  display: inline-block;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--gui-text-tertiary, #6a6a6a);
  font-size: 12px;
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .audit-log__select,
.light .audit-log__date-input {
  background: var(--gui-bg-surface, #ffffff);
  border-color: var(--gui-border-default, #d1d1d6);
}
</style>
