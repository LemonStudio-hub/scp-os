<template>
  <div class="content-mgmt">
    <div class="content-mgmt__header">
      <div class="content-mgmt__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="content-mgmt__tab"
          :class="{ 'content-mgmt__tab--active': activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="content-mgmt__header-actions">
        <button
          class="content-mgmt__btn content-mgmt__btn--secondary"
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
          {{ t('admin.content.export') }}
        </button>
        <Transition name="dropdown">
          <div v-if="showExportMenu" class="content-mgmt__dropdown">
            <button class="content-mgmt__dropdown-item" @click="handleExport('csv')">
              {{ t('admin.content.exportCsv') }}
            </button>
            <button class="content-mgmt__dropdown-item" @click="handleExport('json')">
              {{ t('admin.content.exportJson') }}
            </button>
          </div>
        </Transition>
        <button class="content-mgmt__btn content-mgmt__btn--secondary" @click="openImportModal">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 9V2M7 2L4 5M7 2L10 5M3 12H11"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {{ t('admin.content.import') }}
        </button>
      </div>
    </div>

    <div class="content-mgmt__search-bar">
      <div class="content-mgmt__search">
        <svg
          class="content-mgmt__search-icon"
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
          class="content-mgmt__search-input"
          type="text"
          :placeholder="t('admin.content.searchPlaceholder')"
          @input="onSearchDebounce"
        />
      </div>
    </div>

    <DataTable
      :columns="activeColumns"
      :data="contentList"
      :loading="loading"
      :selected-ids="selectedIds"
      @select="selectedIds = $event"
    >
      <template #cell-created_at="{ value }">
        {{ formatDate(value) }}
      </template>
      <template #cell-actions="{ row }">
        <div class="content-mgmt__cell-actions">
          <button
            class="content-mgmt__action-btn content-mgmt__action-btn--edit"
            @click.stop="openEditModal(row)"
          >
            {{ t('common.edit') }}
          </button>
          <button
            class="content-mgmt__action-btn content-mgmt__action-btn--danger"
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
      :visible="editModalVisible"
      :title="t('admin.content.editTitle')"
      width="520px"
      @close="editModalVisible = false"
    >
      <div class="content-mgmt__modal-body">
        <div v-for="field in editableFields" :key="field.key" class="content-mgmt__modal-field">
          <label class="content-mgmt__modal-label">{{ field.label }}</label>
          <input
            v-model="editForm[field.key]"
            class="content-mgmt__input"
            type="text"
            :placeholder="field.label"
          />
        </div>
      </div>
      <template #footer>
        <button
          class="content-mgmt__btn content-mgmt__btn--ghost"
          @click="editModalVisible = false"
        >
          {{ t('common.cancel') }}
        </button>
        <button class="content-mgmt__btn content-mgmt__btn--primary" @click="handleSave">
          {{ t('common.save') }}
        </button>
      </template>
    </Modal>

    <Modal
      :visible="importModalVisible"
      :title="t('admin.content.importTitle')"
      width="420px"
      @close="importModalVisible = false"
    >
      <div class="content-mgmt__modal-body">
        <div class="content-mgmt__modal-field">
          <label class="content-mgmt__modal-label">{{ t('admin.content.importLabel') }}</label>
          <textarea
            v-model="importData"
            class="content-mgmt__textarea"
            rows="8"
            :placeholder="t('admin.content.importPlaceholder')"
          ></textarea>
        </div>
      </div>
      <template #footer>
        <button
          class="content-mgmt__btn content-mgmt__btn--ghost"
          @click="importModalVisible = false"
        >
          {{ t('common.cancel') }}
        </button>
        <button class="content-mgmt__btn content-mgmt__btn--primary" @click="handleImport">
          {{ t('admin.content.import') }}
        </button>
      </template>
    </Modal>

    <ConfirmDialog
      :visible="deleteConfirmVisible"
      :title="t('admin.content.deleteTitle')"
      :message="t('admin.content.deleteMessage')"
      type="danger"
      @confirm="handleDelete"
      @cancel="deleteConfirmVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { DataTable, BatchActionBar, Pagination, ConfirmDialog, Modal } from '../components'
import type { TableColumn, BatchAction } from '../components'
import { useToast } from '../composables/useToast'
import { useAdminStore } from '../stores/adminStore'
import { useI18n } from '../../../composables/useI18n'
import * as adminApi from '../services/adminApi'

const toast = useToast()
const adminStore = useAdminStore()
const { t } = useI18n()

interface ContentTab {
  key: string
  label: string
  columns: TableColumn[]
  editFields: { key: string; label: string }[]
}

const tabs = computed<ContentTab[]>(() => [
  {
    key: 'scp_items',
    label: t('admin.content.tabScp'),
    columns: [
      { key: 'id', label: 'ID', width: '70px' },
      { key: 'item_number', label: t('admin.content.colNumber') },
      { key: 'title', label: t('admin.content.colTitle') },
      { key: 'object_class', label: t('admin.content.colClass') },
      { key: 'created_at', label: t('admin.content.colCreated') },
      { key: 'actions', label: t('admin.content.colActions'), width: '140px' },
    ],
    editFields: [
      { key: 'item_number', label: t('admin.content.colNumber') },
      { key: 'title', label: t('admin.content.colTitle') },
      { key: 'object_class', label: t('admin.content.colClass') },
    ],
  },
  {
    key: 'tales',
    label: t('admin.content.tabTales'),
    columns: [
      { key: 'id', label: 'ID', width: '70px' },
      { key: 'title', label: t('admin.content.colTitle') },
      { key: 'author', label: t('admin.content.colAuthor') },
      { key: 'rating', label: t('admin.content.colRating') },
      { key: 'created_at', label: t('admin.content.colCreated') },
      { key: 'actions', label: t('admin.content.colActions'), width: '140px' },
    ],
    editFields: [
      { key: 'title', label: t('admin.content.colTitle') },
      { key: 'author', label: t('admin.content.colAuthor') },
    ],
  },
  {
    key: 'goi',
    label: t('admin.content.tabGoi'),
    columns: [
      { key: 'id', label: 'ID', width: '70px' },
      { key: 'name', label: t('admin.content.colName') },
      { key: 'acronym', label: t('admin.content.colAcronym') },
      { key: 'created_at', label: t('admin.content.colCreated') },
      { key: 'actions', label: t('admin.content.colActions'), width: '140px' },
    ],
    editFields: [
      { key: 'name', label: t('admin.content.colName') },
      { key: 'acronym', label: t('admin.content.colAcronym') },
    ],
  },
  {
    key: 'hubs',
    label: t('admin.content.tabHubs'),
    columns: [
      { key: 'id', label: 'ID', width: '70px' },
      { key: 'title', label: t('admin.content.colTitle') },
      { key: 'description', label: t('admin.content.colDesc') },
      { key: 'created_at', label: t('admin.content.colCreated') },
      { key: 'actions', label: t('admin.content.colActions'), width: '140px' },
    ],
    editFields: [
      { key: 'title', label: t('admin.content.colTitle') },
      { key: 'description', label: t('admin.content.colDesc') },
    ],
  },
])

const activeTab = ref('scp_items')
const searchQuery = ref('')
const currentPage = ref(1)
const totalItems = ref(0)
const pageSize = 20
const contentList = ref<Record<string, any>[]>([])
const loading = ref(false)
const selectedIds = ref<number[]>([])
const showExportMenu = ref(false)

const editModalVisible = ref(false)
const editTarget = ref<Record<string, any> | null>(null)
const editForm = ref<Record<string, string>>({})
const importModalVisible = ref(false)
const importData = ref('')
const deleteConfirmVisible = ref(false)
const deleteTarget = ref<Record<string, any> | null>(null)

const activeTabConfig = computed(() => tabs.value.find((t) => t.key === activeTab.value)!)
const activeColumns = computed(() => activeTabConfig.value.columns)
const editableFields = computed(() => activeTabConfig.value.editFields)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))

const batchActions = computed<BatchAction[]>(() => [
  { key: 'delete', label: t('admin.content.batchDelete'), icon: 'delete', type: 'danger' },
])

let searchTimer: ReturnType<typeof setTimeout> | null = null

function switchTab(key: string) {
  activeTab.value = key
  currentPage.value = 1
  searchQuery.value = ''
  selectedIds.value = []
  fetchContent()
}

function onSearchDebounce() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchContent()
  }, 400)
}

async function fetchContent() {
  const token = adminStore.token
  if (!token) return
  loading.value = true
  try {
    const params: Record<string, any> = {
      limit: pageSize,
      offset: (currentPage.value - 1) * pageSize,
    }
    if (searchQuery.value) params.search = searchQuery.value
    const res = await adminApi.getAdminContent(token, activeTab.value, params)
    if (res.success) {
      contentList.value = res.data || []
      totalItems.value = res.total ?? contentList.value.length
    } else {
      toast.error(res.error || t('admin.content.fetchError'))
    }
  } catch {
    toast.error(t('admin.content.fetchError'))
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

function openEditModal(row: Record<string, any>) {
  editTarget.value = row
  const form: Record<string, string> = {}
  for (const field of editableFields.value) {
    form[field.key] = String(row[field.key] ?? '')
  }
  editForm.value = form
  editModalVisible.value = true
}

async function handleSave() {
  const token = adminStore.token
  if (!token || !editTarget.value) return
  try {
    const res = await adminApi.updateAdminContent(
      token,
      activeTab.value,
      editTarget.value.id,
      editForm.value
    )
    if (res.success) {
      toast.success(t('admin.content.saveSuccess'))
      editModalVisible.value = false
      fetchContent()
    } else {
      toast.error(res.error || t('admin.content.saveError'))
    }
  } catch {
    toast.error(t('admin.content.saveActionError'))
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
    const res = await adminApi.deleteAdminContent(token, activeTab.value, deleteTarget.value.id)
    if (res.success) {
      toast.success(t('admin.content.deleteSuccess'))
      deleteConfirmVisible.value = false
      fetchContent()
    } else {
      toast.error(res.error || t('admin.content.deleteError'))
    }
  } catch {
    toast.error(t('admin.content.deleteActionError'))
  }
}

async function handleBatchAction(key: string) {
  if (key === 'delete') {
    const token = adminStore.token
    if (!token) return
    try {
      const res = await adminApi.batchContentOperation(
        token,
        activeTab.value,
        'delete',
        selectedIds.value
      )
      if (res.success) {
        toast.success(t('admin.content.batchDeleteSuccess'))
        selectedIds.value = []
        fetchContent()
      } else {
        toast.error(res.error || t('admin.content.batchDeleteError'))
      }
    } catch {
      toast.error(t('admin.content.batchDeleteError'))
    }
  }
}

async function handleExport(format: 'csv' | 'json') {
  showExportMenu.value = false
  const token = adminStore.token
  if (!token) return
  try {
    const res = await adminApi.exportContent(token, activeTab.value, format)
    if (res.success && res.data) {
      const content = format === 'json' ? JSON.stringify(res.data, null, 2) : res.data
      const blob = new Blob([content], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${activeTab.value}_export.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t('admin.content.exportSuccess'))
    } else {
      toast.error(res.error || t('admin.content.exportError'))
    }
  } catch {
    toast.error(t('admin.content.exportError'))
  }
}

function openImportModal() {
  importData.value = ''
  importModalVisible.value = true
}

async function handleImport() {
  const token = adminStore.token
  if (!token) return
  try {
    const parsed = JSON.parse(importData.value)
    if (!Array.isArray(parsed)) {
      toast.error(t('admin.content.importInvalid'))
      return
    }
    const res = await adminApi.importContent(token, activeTab.value, parsed)
    if (res.success) {
      toast.success(t('admin.content.importSuccess'))
      importModalVisible.value = false
      fetchContent()
    } else {
      toast.error(res.error || t('admin.content.importError'))
    }
  } catch {
    toast.error(t('admin.content.importJsonError'))
  }
}

watch(currentPage, fetchContent)
onMounted(fetchContent)
</script>

<style scoped>
.content-mgmt {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content-mgmt__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.content-mgmt__tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--gui-bg-surface, #141414);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 10px;
  padding: 3px;
}

.content-mgmt__tab {
  padding: 7px 18px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--gui-text-tertiary, #6a6a6a);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.content-mgmt__tab:hover {
  color: var(--gui-text-secondary, #a0a0a0);
}

.content-mgmt__tab--active {
  background: var(--gui-bg-surface-raised, #1a1a1a);
  color: var(--gui-text-primary, #e0e0e0);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.content-mgmt__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.content-mgmt__search-bar {
  width: 100%;
}

.content-mgmt__search {
  position: relative;
  display: flex;
  align-items: center;
}

.content-mgmt__search-icon {
  position: absolute;
  left: 10px;
  color: var(--gui-text-tertiary, #6a6a6a);
  pointer-events: none;
}

.content-mgmt__search-input {
  width: 100%;
  max-width: 320px;
  padding: 7px 10px 7px 32px;
  background: var(--gui-bg-surface-raised, #1a1a1a);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 8px;
  color: var(--gui-text-primary, #e0e0e0);
  font-size: 13px;
  outline: none;
  transition: border-color 150ms ease;
}

.content-mgmt__search-input:focus {
  border-color: var(--gui-error, #e94560);
}

.content-mgmt__search-input::placeholder {
  color: var(--gui-text-disabled, #4a4a4a);
}

.content-mgmt__btn {
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

.content-mgmt__btn:active {
  transform: scale(0.96);
}

.content-mgmt__btn--secondary {
  background: var(--gui-bg-surface-raised, #242424);
  color: var(--gui-text-secondary, #a0a0a0);
}

.content-mgmt__btn--secondary:hover {
  background: var(--gui-bg-surface-hover, #303030);
  color: var(--gui-text-primary, #e0e0e0);
}

.content-mgmt__btn--primary {
  background: rgba(233, 69, 96, 0.15);
  color: var(--gui-error, #e94560);
  border-color: rgba(233, 69, 96, 0.2);
}

.content-mgmt__btn--primary:hover {
  background: rgba(233, 69, 96, 0.25);
}

.content-mgmt__btn--ghost {
  background: var(--gui-bg-surface-raised, #242424);
  color: var(--gui-text-secondary, #a0a0a0);
  border: 1px solid var(--gui-border-default, #2a2a2a);
}

.content-mgmt__btn--ghost:hover {
  background: var(--gui-bg-surface-hover, #303030);
  color: var(--gui-text-primary, #e0e0e0);
}

.content-mgmt__dropdown {
  position: absolute;
  top: 100%;
  right: 80px;
  margin-top: 4px;
  background: var(--gui-bg-surface-raised, #1a1a1a);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 8px;
  overflow: hidden;
  z-index: 20;
  min-width: 130px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.content-mgmt__dropdown-item {
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

.content-mgmt__dropdown-item:hover {
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

.content-mgmt__cell-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.content-mgmt__action-btn {
  padding: 4px 10px;
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 5px;
  background: var(--gui-bg-surface-raised, #242424);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
}

.content-mgmt__action-btn:hover {
  background: var(--gui-bg-surface-hover, #303030);
}

.content-mgmt__action-btn--edit {
  color: var(--gui-info, #0a84ff);
  border-color: rgba(10, 132, 255, 0.2);
}

.content-mgmt__action-btn--edit:hover {
  background: rgba(10, 132, 255, 0.12);
}

.content-mgmt__action-btn--danger {
  color: var(--gui-error, #ff3b30);
  border-color: rgba(255, 59, 48, 0.2);
}

.content-mgmt__action-btn--danger:hover {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.12));
}

.content-mgmt__modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.content-mgmt__modal-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.content-mgmt__modal-label {
  font-size: 12px;
  color: var(--gui-text-tertiary, #6a6a6a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.content-mgmt__input {
  padding: 8px 12px;
  background: var(--gui-bg-surface, #0f0f0f);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 8px;
  color: var(--gui-text-primary, #e0e0e0);
  font-size: 13px;
  outline: none;
  transition: border-color 150ms ease;
}

.content-mgmt__input:focus {
  border-color: var(--gui-error, #e94560);
}

.content-mgmt__input::placeholder {
  color: var(--gui-text-disabled, #4a4a4a);
}

.content-mgmt__textarea {
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

.content-mgmt__textarea:focus {
  border-color: var(--gui-error, #e94560);
}

.content-mgmt__textarea::placeholder {
  color: var(--gui-text-disabled, #4a4a4a);
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .content-mgmt__tabs {
  background: var(--gui-bg-surface-hover, #e8e8ed);
  border-color: var(--gui-border-default, #d1d1d6);
}
.light .content-mgmt__tab--active {
  background: var(--gui-bg-surface, #ffffff);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.light .content-mgmt__search-input,
.light .content-mgmt__input,
.light .content-mgmt__textarea {
  background: var(--gui-bg-surface, #ffffff);
  border-color: var(--gui-border-default, #d1d1d6);
}
.light .content-mgmt__action-btn {
  border-color: var(--gui-border-default, #d1d1d6);
  background: var(--gui-bg-surface, #ffffff);
}
.light .content-mgmt__action-btn:hover {
  background: var(--gui-bg-surface-hover, #f0f0f0);
}
.light .content-mgmt__dropdown {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
</style>
