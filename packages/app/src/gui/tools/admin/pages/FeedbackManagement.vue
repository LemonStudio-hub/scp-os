<template>
  <div class="feedback-mgmt">
    <div class="feedback-mgmt__toolbar">
      <div class="feedback-mgmt__filters">
        <select v-model="statusFilter" class="feedback-mgmt__select" @change="onFilterChange">
          <option value="">{{ t('admin.feedback.allStatus') }}</option>
          <option value="pending">{{ t('admin.feedback.statusPending') }}</option>
          <option value="in_progress">{{ t('admin.feedback.statusInProgress') }}</option>
          <option value="resolved">{{ t('admin.feedback.statusResolved') }}</option>
          <option value="rejected">{{ t('admin.feedback.statusRejected') }}</option>
        </select>
        <select v-model="categoryFilter" class="feedback-mgmt__select" @change="onFilterChange">
          <option value="">{{ t('admin.feedback.allCategories') }}</option>
          <option value="bug">BUG</option>
          <option value="feature">{{ t('admin.feedback.catFeature') }}</option>
          <option value="content">{{ t('admin.feedback.catContent') }}</option>
          <option value="other">{{ t('admin.feedback.catOther') }}</option>
        </select>
      </div>
    </div>

    <DataTable :columns="columns" :data="feedbackList" :loading="loading" :selectable="false">
      <template #cell-status="{ row }">
        <select
          class="feedback-mgmt__status-select"
          :class="`feedback-mgmt__status--${row.status}`"
          :value="row.status"
          @change="handleStatusChange(row, ($event.target as HTMLSelectElement).value)"
          @click.stop
        >
          <option value="pending">{{ t('admin.feedback.statusPending') }}</option>
          <option value="in_progress">{{ t('admin.feedback.statusInProgress') }}</option>
          <option value="resolved">{{ t('admin.feedback.statusResolved') }}</option>
          <option value="rejected">{{ t('admin.feedback.statusRejected') }}</option>
        </select>
      </template>
      <template #cell-upvotes="{ value }">
        <span class="feedback-mgmt__vote feedback-mgmt__vote--up">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 3L9 7H3L6 3Z" fill="currentColor" />
          </svg>
          {{ value ?? 0 }}
        </span>
      </template>
      <template #cell-downvotes="{ value }">
        <span class="feedback-mgmt__vote feedback-mgmt__vote--down">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 9L3 5H9L6 9Z" fill="currentColor" />
          </svg>
          {{ value ?? 0 }}
        </span>
      </template>
      <template #cell-created_at="{ value }">
        {{ formatDate(value) }}
      </template>
      <template #cell-actions="{ row }">
        <div class="feedback-mgmt__cell-actions">
          <button
            class="feedback-mgmt__action-btn feedback-mgmt__action-btn--view"
            @click.stop="openDetailModal(row)"
          >
            {{ t('admin.feedback.view') }}
          </button>
          <button
            class="feedback-mgmt__action-btn feedback-mgmt__action-btn--danger"
            @click.stop="openDeleteConfirm(row)"
          >
            {{ t('common.delete') }}
          </button>
        </div>
      </template>
    </DataTable>

    <Pagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="totalItems"
      @page-change="currentPage = $event"
    />

    <Modal
      :visible="detailVisible"
      :title="t('admin.feedback.detailTitle')"
      width="520px"
      @close="detailVisible = false"
    >
      <div v-if="detailTarget" class="feedback-mgmt__detail">
        <div class="feedback-mgmt__detail-row">
          <span class="feedback-mgmt__detail-label">{{ t('admin.feedback.colTitle') }}</span>
          <span class="feedback-mgmt__detail-value">{{ detailTarget.title }}</span>
        </div>
        <div class="feedback-mgmt__detail-row">
          <span class="feedback-mgmt__detail-label">{{ t('admin.feedback.colSubmitter') }}</span>
          <span class="feedback-mgmt__detail-value">{{ detailTarget.nickname }}</span>
        </div>
        <div class="feedback-mgmt__detail-row">
          <span class="feedback-mgmt__detail-label">{{ t('admin.feedback.colCategory') }}</span>
          <span class="feedback-mgmt__detail-value">{{ detailTarget.category }}</span>
        </div>
        <div class="feedback-mgmt__detail-row">
          <span class="feedback-mgmt__detail-label">{{ t('admin.feedback.colStatus') }}</span>
          <span class="feedback-mgmt__detail-value">{{
            statusLabels.value[detailTarget.status] ?? detailTarget.status
          }}</span>
        </div>
        <div class="feedback-mgmt__detail-row">
          <span class="feedback-mgmt__detail-label">{{ t('admin.feedback.colTime') }}</span>
          <span class="feedback-mgmt__detail-value">{{ formatDate(detailTarget.created_at) }}</span>
        </div>
        <div class="feedback-mgmt__detail-row feedback-mgmt__detail-row--full">
          <span class="feedback-mgmt__detail-label">{{ t('admin.feedback.colContent') }}</span>
          <p class="feedback-mgmt__detail-content">
            {{ detailTarget.content || detailTarget.description || t('admin.feedback.noContent') }}
          </p>
        </div>
      </div>
    </Modal>

    <ConfirmDialog
      :visible="deleteVisible"
      :title="t('admin.feedback.deleteTitle')"
      :message="t('admin.feedback.deleteMessage')"
      type="danger"
      @confirm="handleDelete"
      @cancel="deleteVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed, watch, onMounted } from 'vue'
import { DataTable, Pagination, ConfirmDialog, Modal } from '../components'
import type { TableColumn } from '../components'
import { useToast } from '../composables/useToast'
import { useAdminStore } from '../stores/adminStore'
import { useI18n } from '../../../composables/useI18n'
import * as adminApi from '../services/adminApi'

const toast = useToast()
const adminStore = useAdminStore()
const { t } = useI18n()

const statusLabels = computed<Record<string, string>>(() => ({
  pending: t('admin.feedback.statusPending'),
  in_progress: t('admin.feedback.statusInProgress'),
  resolved: t('admin.feedback.statusResolved'),
  rejected: t('admin.feedback.statusRejected'),
}))

const columns = computed<TableColumn[]>(() => [
  { key: 'id', label: 'ID', width: '70px' },
  { key: 'title', label: t('admin.feedback.colTitle') },
  { key: 'nickname', label: t('admin.feedback.colSubmitter') },
  { key: 'category', label: t('admin.feedback.colCategory'), width: '100px' },
  { key: 'status', label: t('admin.feedback.colStatus'), width: '120px' },
  { key: 'upvotes', label: t('admin.feedback.colUpvotes'), width: '80px' },
  { key: 'downvotes', label: t('admin.feedback.colDownvotes'), width: '80px' },
  { key: 'created_at', label: t('admin.feedback.colCreated') },
  { key: 'actions', label: t('admin.feedback.colActions'), width: '130px' },
])

const feedbackList = ref<Record<string, any>[]>([])
const loading = ref(false)
const statusFilter = ref('')
const categoryFilter = ref('')
const currentPage = ref(1)
const totalItems = ref(0)
const pageSize = 20

const detailVisible = ref(false)
const detailTarget = ref<Record<string, any> | null>(null)
const deleteVisible = ref(false)
const deleteTarget = ref<Record<string, any> | null>(null)

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))

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
  })
}

function onFilterChange() {
  currentPage.value = 1
  fetchFeedback()
}

async function fetchFeedback() {
  const token = adminStore.token
  if (!token) return
  loading.value = true
  try {
    const params: Record<string, any> = {
      limit: pageSize,
      offset: (currentPage.value - 1) * pageSize,
    }
    if (statusFilter.value) params.status = statusFilter.value
    if (categoryFilter.value) params.category = categoryFilter.value
    const res = await adminApi.getAdminFeedback(token, params)
    if (res.success) {
      feedbackList.value = res.data || []
      totalItems.value = res.total ?? feedbackList.value.length
    } else {
      toast.error(res.error || t('admin.feedback.fetchError'))
    }
  } catch {
    toast.error(t('admin.feedback.fetchError'))
  } finally {
    loading.value = false
  }
}

async function handleStatusChange(row: Record<string, any>, newStatus: string) {
  const token = adminStore.token
  if (!token) return
  try {
    const res = await adminApi.updateFeedbackStatus(token, row.id, newStatus)
    if (res.success) {
      toast.success(t('admin.feedback.statusUpdated'))
      row.status = newStatus
    } else {
      toast.error(res.error || t('admin.feedback.statusUpdateError'))
    }
  } catch {
    toast.error(t('admin.feedback.statusUpdateError'))
  }
}

function openDetailModal(row: Record<string, any>) {
  detailTarget.value = row
  detailVisible.value = true
}

function openDeleteConfirm(row: Record<string, any>) {
  deleteTarget.value = row
  deleteVisible.value = true
}

async function handleDelete() {
  const token = adminStore.token
  if (!token || !deleteTarget.value) return
  try {
    const res = await adminApi.deleteAdminFeedback(token, deleteTarget.value.id)
    if (res.success) {
      toast.success(t('admin.feedback.deletedSuccess'))
      deleteVisible.value = false
      fetchFeedback()
    } else {
      toast.error(res.error || t('admin.feedback.deleteError'))
    }
  } catch {
    toast.error(t('admin.feedback.deleteActionError'))
  }
}

watch(currentPage, fetchFeedback)
onMounted(fetchFeedback)
</script>

<style scoped>
.feedback-mgmt {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feedback-mgmt__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.feedback-mgmt__filters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.feedback-mgmt__select {
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

.feedback-mgmt__select:focus {
  border-color: var(--gui-error, #e94560);
}

.feedback-mgmt__status-select {
  padding: 3px 8px;
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 5px;
  background: var(--gui-bg-surface-raised, #242424);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  transition: all 150ms ease;
}

.feedback-mgmt__status--pending {
  color: var(--gui-warning, #ffcc00);
  border-color: rgba(255, 204, 0, 0.3);
}

.feedback-mgmt__status--in_progress {
  color: var(--gui-info, #0a84ff);
  border-color: rgba(10, 132, 255, 0.3);
}

.feedback-mgmt__status--resolved {
  color: var(--gui-success, #34c759);
  border-color: rgba(52, 199, 89, 0.3);
}

.feedback-mgmt__status--rejected {
  color: var(--gui-error, #ff3b30);
  border-color: rgba(255, 59, 48, 0.3);
}

.feedback-mgmt__vote {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.feedback-mgmt__vote--up {
  color: var(--gui-success, #34c759);
}

.feedback-mgmt__vote--down {
  color: var(--gui-error, #ff3b30);
}

.feedback-mgmt__cell-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.feedback-mgmt__action-btn {
  padding: 4px 10px;
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 5px;
  background: var(--gui-bg-surface-raised, #242424);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
}

.feedback-mgmt__action-btn:hover {
  background: var(--gui-bg-surface-hover, #303030);
}

.feedback-mgmt__action-btn--view {
  color: var(--gui-info, #0a84ff);
  border-color: rgba(10, 132, 255, 0.2);
}

.feedback-mgmt__action-btn--view:hover {
  background: rgba(10, 132, 255, 0.12);
}

.feedback-mgmt__action-btn--danger {
  color: var(--gui-error, #ff3b30);
  border-color: rgba(255, 59, 48, 0.2);
}

.feedback-mgmt__action-btn--danger:hover {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.12));
}

.feedback-mgmt__detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feedback-mgmt__detail-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.feedback-mgmt__detail-row--full {
  flex-direction: column;
  gap: 6px;
}

.feedback-mgmt__detail-label {
  font-size: 12px;
  color: var(--gui-text-tertiary, #6a6a6a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 60px;
  flex-shrink: 0;
}

.feedback-mgmt__detail-value {
  font-size: 14px;
  color: var(--gui-text-primary, #e0e0e0);
}

.feedback-mgmt__detail-content {
  margin: 0;
  font-size: 14px;
  color: var(--gui-text-secondary, #a0a0a0);
  line-height: 1.6;
  padding: 12px;
  background: var(--gui-bg-surface, #0f0f0f);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
