<template>
  <div class="feedback-mgmt">
    <div class="feedback-mgmt__toolbar">
      <div class="feedback-mgmt__filters">
        <select v-model="statusFilter" class="feedback-mgmt__select" @change="onFilterChange">
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="in_progress">处理中</option>
          <option value="resolved">已解决</option>
          <option value="rejected">已拒绝</option>
        </select>
        <select v-model="categoryFilter" class="feedback-mgmt__select" @change="onFilterChange">
          <option value="">全部分类</option>
          <option value="bug">BUG</option>
          <option value="feature">功能建议</option>
          <option value="content">内容反馈</option>
          <option value="other">其他</option>
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
          <option value="pending">待处理</option>
          <option value="in_progress">处理中</option>
          <option value="resolved">已解决</option>
          <option value="rejected">已拒绝</option>
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
            查看
          </button>
          <button
            class="feedback-mgmt__action-btn feedback-mgmt__action-btn--danger"
            @click.stop="openDeleteConfirm(row)"
          >
            删除
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

    <Modal :visible="detailVisible" title="反馈详情" width="520px" @close="detailVisible = false">
      <div class="feedback-mgmt__detail" v-if="detailTarget">
        <div class="feedback-mgmt__detail-row">
          <span class="feedback-mgmt__detail-label">标题</span>
          <span class="feedback-mgmt__detail-value">{{ detailTarget.title }}</span>
        </div>
        <div class="feedback-mgmt__detail-row">
          <span class="feedback-mgmt__detail-label">提交者</span>
          <span class="feedback-mgmt__detail-value">{{ detailTarget.nickname }}</span>
        </div>
        <div class="feedback-mgmt__detail-row">
          <span class="feedback-mgmt__detail-label">分类</span>
          <span class="feedback-mgmt__detail-value">{{ detailTarget.category }}</span>
        </div>
        <div class="feedback-mgmt__detail-row">
          <span class="feedback-mgmt__detail-label">状态</span>
          <span class="feedback-mgmt__detail-value">{{
            statusLabels[detailTarget.status] ?? detailTarget.status
          }}</span>
        </div>
        <div class="feedback-mgmt__detail-row">
          <span class="feedback-mgmt__detail-label">时间</span>
          <span class="feedback-mgmt__detail-value">{{ formatDate(detailTarget.created_at) }}</span>
        </div>
        <div class="feedback-mgmt__detail-row feedback-mgmt__detail-row--full">
          <span class="feedback-mgmt__detail-label">内容</span>
          <p class="feedback-mgmt__detail-content">
            {{ detailTarget.content || detailTarget.description || '暂无详细内容' }}
          </p>
        </div>
      </div>
    </Modal>

    <ConfirmDialog
      :visible="deleteVisible"
      title="删除反馈"
      message="确定要删除此反馈吗？此操作不可撤销。"
      type="danger"
      @confirm="handleDelete"
      @cancel="deleteVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { DataTable, Pagination, ConfirmDialog, Modal } from '../components'
import type { TableColumn } from '../components'
import { useToast } from '../composables/useToast'
import { useAdminStore } from '../stores/adminStore'
import * as adminApi from '../services/adminApi'

const toast = useToast()
const adminStore = useAdminStore()

const statusLabels: Record<string, string> = {
  pending: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  rejected: '已拒绝',
}

const columns: TableColumn[] = [
  { key: 'id', label: 'ID', width: '70px' },
  { key: 'title', label: '标题' },
  { key: 'nickname', label: '提交者' },
  { key: 'category', label: '分类', width: '100px' },
  { key: 'status', label: '状态', width: '120px' },
  { key: 'upvotes', label: '赞成', width: '80px' },
  { key: 'downvotes', label: '反对', width: '80px' },
  { key: 'created_at', label: '提交时间' },
  { key: 'actions', label: '操作', width: '130px' },
]

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
      toast.error(res.error || '获取反馈列表失败')
    }
  } catch {
    toast.error('获取反馈列表失败')
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
      toast.success('状态已更新')
      row.status = newStatus
    } else {
      toast.error(res.error || '更新状态失败')
    }
  } catch {
    toast.error('更新状态失败')
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
      toast.success('反馈已删除')
      deleteVisible.value = false
      fetchFeedback()
    } else {
      toast.error(res.error || '删除失败')
    }
  } catch {
    toast.error('删除操作失败')
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
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: border-color 150ms ease;
}

.feedback-mgmt__select:focus {
  border-color: #e94560;
}

.feedback-mgmt__status-select {
  padding: 3px 8px;
  border: 1px solid #2a2a2a;
  border-radius: 5px;
  background: #242424;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  transition: all 150ms ease;
}

.feedback-mgmt__status--pending {
  color: #ffcc00;
  border-color: rgba(255, 204, 0, 0.3);
}

.feedback-mgmt__status--in_progress {
  color: #0a84ff;
  border-color: rgba(10, 132, 255, 0.3);
}

.feedback-mgmt__status--resolved {
  color: #34c759;
  border-color: rgba(52, 199, 89, 0.3);
}

.feedback-mgmt__status--rejected {
  color: #ff3b30;
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
  color: #34c759;
}

.feedback-mgmt__vote--down {
  color: #ff3b30;
}

.feedback-mgmt__cell-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.feedback-mgmt__action-btn {
  padding: 4px 10px;
  border: 1px solid #2a2a2a;
  border-radius: 5px;
  background: #242424;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
}

.feedback-mgmt__action-btn:hover {
  background: #303030;
}

.feedback-mgmt__action-btn--view {
  color: #0a84ff;
  border-color: rgba(10, 132, 255, 0.2);
}

.feedback-mgmt__action-btn--view:hover {
  background: rgba(10, 132, 255, 0.12);
}

.feedback-mgmt__action-btn--danger {
  color: #ff3b30;
  border-color: rgba(255, 59, 48, 0.2);
}

.feedback-mgmt__action-btn--danger:hover {
  background: rgba(255, 59, 48, 0.12);
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
  color: #6a6a6a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 60px;
  flex-shrink: 0;
}

.feedback-mgmt__detail-value {
  font-size: 14px;
  color: #e0e0e0;
}

.feedback-mgmt__detail-content {
  margin: 0;
  font-size: 14px;
  color: #a0a0a0;
  line-height: 1.6;
  padding: 12px;
  background: #0f0f0f;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
