<template>
  <div class="audit-log">
    <div class="audit-log__toolbar">
      <div class="audit-log__filters">
        <select v-model="actionFilter" class="audit-log__select" @change="onFilterChange">
          <option value="">全部操作</option>
          <option value="login">登录</option>
          <option value="ban_user">封禁用户</option>
          <option value="unban_user">解封用户</option>
          <option value="delete_user">删除用户</option>
          <option value="delete_content">删除内容</option>
          <option value="update_content">更新内容</option>
          <option value="delete_message">删除消息</option>
          <option value="delete_feedback">删除反馈</option>
          <option value="update_settings">更新设置</option>
          <option value="batch_operation">批量操作</option>
        </select>
        <div class="audit-log__date-range">
          <input
            v-model="startDate"
            class="audit-log__date-input"
            type="date"
            @change="onFilterChange"
          />
          <span class="audit-log__date-sep">至</span>
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
import { ref, computed, watch, onMounted } from 'vue'
import { DataTable, Pagination } from '../components'
import type { TableColumn } from '../components'
import { useToast } from '../composables/useToast'
import { useAdminStore } from '../stores/adminStore'
import * as adminApi from '../services/adminApi'

const toast = useToast()
const adminStore = useAdminStore()

const actionLabels: Record<string, string> = {
  login: '登录',
  ban_user: '封禁用户',
  unban_user: '解封用户',
  delete_user: '删除用户',
  delete_content: '删除内容',
  update_content: '更新内容',
  delete_message: '删除消息',
  delete_feedback: '删除反馈',
  update_settings: '更新设置',
  batch_operation: '批量操作',
  export_data: '导出数据',
  import_data: '导入数据',
}

const columns: TableColumn[] = [
  { key: 'id', label: 'ID', width: '70px' },
  { key: 'admin_username', label: '操作者' },
  { key: 'action', label: '操作类型', width: '120px' },
  { key: 'target_type', label: '目标类型', width: '100px' },
  { key: 'target_id', label: '目标ID', width: '90px' },
  { key: 'details', label: '详情' },
  { key: 'ip_address', label: 'IP地址', width: '130px' },
  { key: 'created_at', label: '操作时间' },
]

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
  return actionLabels[action] || action
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
      toast.error(res.error || '获取日志失败')
    }
  } catch {
    toast.error('获取日志失败')
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
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: border-color 150ms ease;
}

.audit-log__select:focus {
  border-color: #e94560;
}

.audit-log__date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.audit-log__date-input {
  padding: 6px 10px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
  transition: border-color 150ms ease;
  color-scheme: dark;
}

.audit-log__date-input:focus {
  border-color: #e94560;
}

.audit-log__date-sep {
  font-size: 12px;
  color: #6a6a6a;
}

.audit-log__action-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(233, 69, 96, 0.1);
  color: #e94560;
}

.audit-log__details {
  display: inline-block;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #6a6a6a;
  font-size: 12px;
}
</style>
