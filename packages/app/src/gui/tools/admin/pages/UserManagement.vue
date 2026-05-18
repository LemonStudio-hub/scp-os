<template>
  <div class="user-mgmt">
    <div class="user-mgmt__toolbar">
      <div class="user-mgmt__filters">
        <div class="user-mgmt__search">
          <svg
            class="user-mgmt__search-icon"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.2" />
            <path
              d="M9.5 9.5L12.5 12.5"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            />
          </svg>
          <input
            v-model="searchQuery"
            class="user-mgmt__search-input"
            type="text"
            :placeholder="t('admin.users.searchPlaceholder')"
            @input="onSearchDebounce"
          />
        </div>
        <select v-model="banFilter" class="user-mgmt__select" @change="onFilterChange">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <div class="user-mgmt__actions-right">
        <div class="user-mgmt__export-wrap">
          <button
            class="user-mgmt__btn user-mgmt__btn--secondary"
            @click="showExportMenu = !showExportMenu"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 2V9M7 9L4 6M7 9L10 6M3 11H11"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            {{ t('admin.users.export') }}
          </button>
          <Transition name="dropdown">
            <div v-if="showExportMenu" class="user-mgmt__dropdown">
              <button class="user-mgmt__dropdown-item" @click="handleExport('csv')">
                {{ t('admin.users.exportCsv') }}
              </button>
              <button class="user-mgmt__dropdown-item" @click="handleExport('json')">
                {{ t('admin.users.exportJson') }}
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="users"
      :loading="loading"
      :selected-ids="selectedIds"
      @select="selectedIds = $event"
    >
      <template #cell-is_banned="{ row }">
        <span
          class="user-mgmt__badge"
          :class="row.is_banned ? 'user-mgmt__badge--banned' : 'user-mgmt__badge--active'"
        >
          {{ row.is_banned ? t('admin.users.statusBanned') : t('admin.users.statusActive') }}
        </span>
      </template>
      <template #cell-created_at="{ value }">
        {{ formatDate(value) }}
      </template>
      <template #cell-actions="{ row }">
        <div class="user-mgmt__cell-actions">
          <button
            v-if="!row.is_banned"
            class="user-mgmt__action-btn user-mgmt__action-btn--warn"
            @click.stop="openBanModal(row)"
          >
            {{ t('admin.users.ban') }}
          </button>
          <button
            v-else
            class="user-mgmt__action-btn user-mgmt__action-btn--success"
            @click.stop="handleUnban(row)"
          >
            {{ t('admin.users.unban') }}
          </button>
          <button
            v-if="adminStore.isSuperAdmin"
            class="user-mgmt__action-btn user-mgmt__action-btn--danger"
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

    <BatchActionBar
      :selected-count="selectedIds.length"
      :actions="batchActions"
      @action="handleBatchAction"
      @clear="selectedIds = []"
    />

    <Modal
      :visible="banModalVisible"
      :title="t('admin.users.banTitle')"
      width="420px"
      @close="banModalVisible = false"
    >
      <div class="user-mgmt__modal-body">
        <div class="user-mgmt__modal-field">
          <label class="user-mgmt__modal-label">{{ t('admin.users.userLabel') }}</label>
          <span class="user-mgmt__modal-value"
            >{{ banTarget?.nickname }} ({{ banTarget?.user_id }})</span
          >
        </div>
        <div class="user-mgmt__modal-field">
          <label class="user-mgmt__modal-label">{{ t('admin.users.banReason') }}</label>
          <textarea
            v-model="banReason"
            class="user-mgmt__textarea"
            rows="3"
            :placeholder="t('admin.users.banReasonPlaceholder')"
          ></textarea>
        </div>
      </div>
      <template #footer>
        <button class="user-mgmt__btn user-mgmt__btn--ghost" @click="banModalVisible = false">
          {{ t('common.cancel') }}
        </button>
        <button class="user-mgmt__btn user-mgmt__btn--danger" @click="handleBan">
          {{ t('admin.users.confirmBan') }}
        </button>
      </template>
    </Modal>

    <ConfirmDialog
      :visible="deleteConfirmVisible"
      :title="t('admin.users.deleteTitle')"
      :message="t('admin.users.deleteMessage')"
      type="danger"
      @confirm="handleDelete"
      @cancel="deleteConfirmVisible = false"
    />

    <ConfirmDialog
      :visible="batchConfirmVisible"
      :title="batchConfirmTitle"
      :message="batchConfirmMessage"
      type="danger"
      @confirm="executeBatchAction"
      @cancel="batchConfirmVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { DataTable, BatchActionBar, Pagination, ConfirmDialog, Modal } from '../components'
import type { BatchAction } from '../components'
import { useToast } from '../composables/useToast'
import { useAdminStore } from '../stores/adminStore'
import { useI18n } from '../../../composables/useI18n'
import * as adminApi from '../services/adminApi'

const toast = useToast()
const adminStore = useAdminStore()
const { t } = useI18n()

const columns = computed(() => [
  { key: 'id', label: 'ID', width: '70px' },
  { key: 'user_id', label: t('admin.users.userId'), width: '120px' },
  { key: 'nickname', label: t('admin.users.nickname') },
  { key: 'created_at', label: t('admin.users.regTime'), sortable: true },
  { key: 'is_banned', label: t('admin.users.status'), width: '100px' },
  { key: 'actions', label: t('admin.users.actions'), width: '160px' },
])

const users = ref<Record<string, any>[]>([])
const loading = ref(false)
const searchQuery = ref('')
const banFilter = ref('')
const currentPage = ref(1)
const totalItems = ref(0)
const pageSize = 20
const selectedIds = ref<number[]>([])
const showExportMenu = ref(false)

const banModalVisible = ref(false)
const banTarget = ref<Record<string, any> | null>(null)
const banReason = ref('')
const deleteConfirmVisible = ref(false)
const deleteTarget = ref<Record<string, any> | null>(null)
const batchConfirmVisible = ref(false)
const batchConfirmTitle = ref('')
const batchConfirmMessage = ref('')
const pendingBatchAction = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))

const batchActions = computed<BatchAction[]>(() => [
  { key: 'ban', label: t('admin.users.batchBan'), icon: 'archive', type: 'warning' },
  { key: 'unban', label: t('admin.users.batchUnban'), icon: 'archive', type: 'default' },
  { key: 'delete', label: t('admin.users.batchDelete'), icon: 'delete', type: 'danger' },
])

const statusOptions = computed(() => [
  { value: '', label: t('admin.users.allStatus') },
  { value: '0', label: t('admin.users.statusActive') },
  { value: '1', label: t('admin.users.statusBanned') },
])

let searchTimer: ReturnType<typeof setTimeout> | null = null

function onSearchDebounce() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchUsers()
  }, 400)
}

function onFilterChange() {
  currentPage.value = 1
  fetchUsers()
}

async function fetchUsers() {
  const token = adminStore.token
  if (!token) return
  loading.value = true
  try {
    const params: Record<string, any> = {
      limit: pageSize,
      offset: (currentPage.value - 1) * pageSize,
    }
    if (searchQuery.value) params.search = searchQuery.value
    if (banFilter.value !== '') params.is_banned = Number(banFilter.value)
    const res = await adminApi.getAdminUsers(token, params)
    if (res.success) {
      users.value = res.data || []
      totalItems.value = res.total ?? users.value.length
    } else {
      toast.error(res.error || t('admin.users.fetchError'))
    }
  } catch {
    toast.error(t('admin.users.fetchError'))
  } finally {
    loading.value = false
    selectedIds.value = []
  }
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
  })
}

function openBanModal(row: Record<string, any>) {
  banTarget.value = row
  banReason.value = ''
  banModalVisible.value = true
}

async function handleBan() {
  const token = adminStore.token
  if (!token || !banTarget.value) return
  try {
    const res = await adminApi.banUser(token, banTarget.value.id, banReason.value || undefined)
    if (res.success) {
      toast.success(t('admin.users.bannedSuccess'))
      banModalVisible.value = false
      fetchUsers()
    } else {
      toast.error(res.error || t('admin.users.banError'))
    }
  } catch {
    toast.error(t('admin.users.banActionError'))
  }
}

async function handleUnban(row: Record<string, any>) {
  const token = adminStore.token
  if (!token) return
  try {
    const res = await adminApi.unbanUser(token, row.id)
    if (res.success) {
      toast.success(t('admin.users.unbannedSuccess'))
      fetchUsers()
    } else {
      toast.error(res.error || t('admin.users.unbanError'))
    }
  } catch {
    toast.error(t('admin.users.unbanActionError'))
  }
}

function openDeleteConfirm(row: Record<string, any>) {
  deleteTarget.value = row
  deleteConfirmVisible.value = true
}

async function handleDelete() {
  const token = adminStore.token
  if (!token || !deleteTarget.value) return
  try {
    const res = await adminApi.deleteAdminUser(token, deleteTarget.value.id)
    if (res.success) {
      toast.success(t('admin.users.deletedSuccess'))
      deleteConfirmVisible.value = false
      fetchUsers()
    } else {
      toast.error(res.error || t('admin.users.deleteError'))
    }
  } catch {
    toast.error(t('admin.users.deleteActionError'))
  }
}

function handleBatchAction(key: string) {
  pendingBatchAction.value = key
  const actionLabels: Record<string, string> = {
    ban: t('admin.users.batchBan'),
    unban: t('admin.users.batchUnban'),
    delete: t('admin.users.batchDelete'),
  }
  batchConfirmTitle.value = actionLabels[key] || t('admin.users.batchOperation')
  batchConfirmMessage.value = t('admin.users.batchConfirmMessage', {
    count: selectedIds.value.length,
    action: actionLabels[key],
  })
  batchConfirmVisible.value = true
}

async function executeBatchAction() {
  const token = adminStore.token
  if (!token) return
  try {
    const res = await adminApi.batchUserOperation(
      token,
      pendingBatchAction.value,
      selectedIds.value
    )
    if (res.success) {
      toast.success(t('admin.users.batchSuccess'))
      batchConfirmVisible.value = false
      selectedIds.value = []
      fetchUsers()
    } else {
      toast.error(res.error || t('admin.users.batchError'))
    }
  } catch {
    toast.error(t('admin.users.batchError'))
  }
}

async function handleExport(format: 'csv' | 'json') {
  showExportMenu.value = false
  const token = adminStore.token
  if (!token) return
  try {
    const res = await adminApi.exportUsers(token, format)
    if (res.success && (format === 'csv' || res.data)) {
      const content = format === 'json' ? JSON.stringify(res.data, null, 2) : res.data
      const blob = new Blob([content], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users_export.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t('admin.users.exportSuccess'))
    } else {
      toast.error(res.error || t('admin.users.exportError'))
    }
  } catch {
    toast.error(t('admin.users.exportError'))
  }
}

watch(currentPage, fetchUsers)
onMounted(fetchUsers)
</script>

<style scoped>
.user-mgmt {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-mgmt__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.user-mgmt__filters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-mgmt__search {
  position: relative;
  display: flex;
  align-items: center;
}

.user-mgmt__search-icon {
  position: absolute;
  left: 10px;
  color: var(--gui-text-tertiary, #6a6a6a);
  pointer-events: none;
}

.user-mgmt__search-input {
  width: 260px;
  padding: 7px 10px 7px 32px;
  background: var(--gui-bg-surface-raised, #1a1a1a);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 8px;
  color: var(--gui-text-primary, #e0e0e0);
  font-size: 13px;
  outline: none;
  transition: border-color 150ms ease;
}

.user-mgmt__search-input:focus {
  border-color: var(--gui-error, #e94560);
}

.user-mgmt__search-input::placeholder {
  color: var(--gui-text-disabled, #4a4a4a);
}

.user-mgmt__select {
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

.user-mgmt__select:focus {
  border-color: var(--gui-error, #e94560);
}

.user-mgmt__actions-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-mgmt__export-wrap {
  position: relative;
}

.user-mgmt__dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--gui-bg-surface-raised, #1a1a1a);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 8px;
  overflow: hidden;
  z-index: 20;
  min-width: 130px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.user-mgmt__dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 14px;
  background: none;
  border: none;
  color: var(--gui-text-secondary, #a0a0a0);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 120ms ease;
}

.user-mgmt__dropdown-item:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #e0e0e0);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 150ms ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.user-mgmt__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
}

.user-mgmt__btn:active {
  transform: scale(0.96);
}

.user-mgmt__btn--secondary {
  background: var(--gui-bg-surface-raised, #242424);
  color: var(--gui-text-secondary, #a0a0a0);
}

.user-mgmt__btn--secondary:hover {
  background: var(--gui-bg-surface-hover, #303030);
  color: var(--gui-text-primary, #e0e0e0);
}

.user-mgmt__btn--danger {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.15));
  color: var(--gui-error, #ff3b30);
}

.user-mgmt__btn--danger:hover {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.25));
}

.user-mgmt__btn--ghost {
  background: var(--gui-bg-surface-raised, #242424);
  color: var(--gui-text-secondary, #a0a0a0);
  border: 1px solid var(--gui-border-default, #2a2a2a);
}

.user-mgmt__btn--ghost:hover {
  background: var(--gui-bg-surface-hover, #303030);
  color: var(--gui-text-primary, #e0e0e0);
}

.user-mgmt__badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.user-mgmt__badge--active {
  background: rgba(52, 199, 89, 0.12);
  color: var(--gui-success, #34c759);
}

.user-mgmt__badge--banned {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.12));
  color: var(--gui-error, #ff3b30);
}

.user-mgmt__cell-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-mgmt__action-btn {
  padding: 4px 10px;
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 5px;
  background: var(--gui-bg-surface-raised, #242424);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
}

.user-mgmt__action-btn:hover {
  background: var(--gui-bg-surface-hover, #303030);
}

.user-mgmt__action-btn--warn {
  color: var(--gui-warning, #ffcc00);
  border-color: rgba(255, 204, 0, 0.2);
}

.user-mgmt__action-btn--warn:hover {
  background: var(--gui-warning-bg, rgba(255, 204, 0, 0.12));
}

.user-mgmt__action-btn--success {
  color: var(--gui-success, #34c759);
  border-color: rgba(52, 199, 89, 0.2);
}

.user-mgmt__action-btn--success:hover {
  background: rgba(52, 199, 89, 0.12);
}

.user-mgmt__action-btn--danger {
  color: var(--gui-error, #ff3b30);
  border-color: rgba(255, 59, 48, 0.2);
}

.user-mgmt__action-btn--danger:hover {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.12));
}

.user-mgmt__modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-mgmt__modal-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-mgmt__modal-label {
  font-size: 12px;
  color: var(--gui-text-tertiary, #6a6a6a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-mgmt__modal-value {
  font-size: 14px;
  color: var(--gui-text-primary, #e0e0e0);
}

.user-mgmt__textarea {
  width: 100%;
  padding: 8px 12px;
  background: var(--gui-bg-surface, #0f0f0f);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 8px;
  color: var(--gui-text-primary, #e0e0e0);
  font-size: 13px;
  resize: vertical;
  outline: none;
  font-family: inherit;
  transition: border-color 150ms ease;
}

.user-mgmt__textarea:focus {
  border-color: var(--gui-error, #e94560);
}

.user-mgmt__textarea::placeholder {
  color: var(--gui-text-disabled, #4a4a4a);
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .user-mgmt__search-input,
.light .user-mgmt__select,
.light .user-mgmt__textarea {
  background: var(--gui-bg-surface, #ffffff);
  border-color: var(--gui-border-default, #d1d1d6);
}
.light .user-mgmt__dropdown {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
.light .user-mgmt__action-btn {
  border-color: var(--gui-border-default, #d1d1d6);
  background: var(--gui-bg-surface, #ffffff);
}
.light .user-mgmt__action-btn:hover {
  background: var(--gui-bg-surface-hover, #f0f0f0);
}
</style>
