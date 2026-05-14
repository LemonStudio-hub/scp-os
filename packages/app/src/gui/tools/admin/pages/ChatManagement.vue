<template>
  <div class="chat-mgmt">
    <div class="chat-mgmt__tabs">
      <button
        class="chat-mgmt__tab"
        :class="{ 'chat-mgmt__tab--active': activeSection === 'messages' }"
        @click="activeSection = 'messages'"
      >
        消息管理
      </button>
      <button
        class="chat-mgmt__tab"
        :class="{ 'chat-mgmt__tab--active': activeSection === 'rooms' }"
        @click="activeSection = 'rooms'"
      >
        房间管理
      </button>
    </div>

    <div v-if="activeSection === 'messages'" class="chat-mgmt__section">
      <div class="chat-mgmt__toolbar">
        <select v-model="roomFilter" class="chat-mgmt__select" @change="onRoomFilterChange">
          <option value="">全部房间</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
        </select>
      </div>

      <DataTable
        :columns="messageColumns"
        :data="messages"
        :loading="messagesLoading"
        :selectable="false"
      >
        <template #cell-content="{ row }">
          <span class="chat-mgmt__msg-content">{{ row.content }}</span>
        </template>
        <template #cell-created_at="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #cell-actions="{ row }">
          <button
            class="chat-mgmt__action-btn chat-mgmt__action-btn--danger"
            @click.stop="openDeleteMsgConfirm(row)"
          >
            删除
          </button>
        </template>
      </DataTable>

      <Pagination
        :current-page="msgPage"
        :total-pages="msgTotalPages"
        :total-items="msgTotalItems"
        @page-change="msgPage = $event"
      />
    </div>

    <div v-else class="chat-mgmt__section">
      <DataTable :columns="roomColumns" :data="rooms" :loading="roomsLoading" :selectable="false">
        <template #cell-is_public="{ row }">
          <span
            class="chat-mgmt__badge"
            :class="row.is_public ? 'chat-mgmt__badge--public' : 'chat-mgmt__badge--private'"
          >
            {{ row.is_public ? '公开' : '私有' }}
          </span>
        </template>
        <template #cell-created_at="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #cell-actions="{ row }">
          <div class="chat-mgmt__cell-actions">
            <button
              class="chat-mgmt__action-btn chat-mgmt__action-btn--edit"
              @click.stop="openEditRoomModal(row)"
            >
              编辑
            </button>
            <button
              class="chat-mgmt__action-btn chat-mgmt__action-btn--danger"
              @click.stop="openDeleteRoomConfirm(row)"
            >
              删除
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <Modal
      :visible="editRoomVisible"
      title="编辑房间"
      width="420px"
      @close="editRoomVisible = false"
    >
      <div class="chat-mgmt__modal-body">
        <div class="chat-mgmt__modal-field">
          <label class="chat-mgmt__modal-label">房间名称</label>
          <input
            v-model="editRoomForm.name"
            class="chat-mgmt__input"
            type="text"
            placeholder="房间名称"
          />
        </div>
        <div class="chat-mgmt__modal-field">
          <label class="chat-mgmt__modal-label">描述</label>
          <textarea
            v-model="editRoomForm.description"
            class="chat-mgmt__textarea"
            rows="3"
            placeholder="房间描述"
          ></textarea>
        </div>
        <div class="chat-mgmt__modal-field">
          <label class="chat-mgmt__modal-label">是否公开</label>
          <label class="chat-mgmt__toggle-wrap">
            <button
              class="chat-mgmt__toggle"
              :class="{ 'chat-mgmt__toggle--on': editRoomForm.is_public === 1 }"
              @click="editRoomForm.is_public = editRoomForm.is_public === 1 ? 0 : 1"
            >
              <span class="chat-mgmt__toggle-knob" />
            </button>
            <span class="chat-mgmt__toggle-label">{{
              editRoomForm.is_public === 1 ? '公开' : '私有'
            }}</span>
          </label>
        </div>
      </div>
      <template #footer>
        <button class="chat-mgmt__btn chat-mgmt__btn--ghost" @click="editRoomVisible = false">
          取消
        </button>
        <button class="chat-mgmt__btn chat-mgmt__btn--primary" @click="handleSaveRoom">保存</button>
      </template>
    </Modal>

    <ConfirmDialog
      :visible="deleteMsgVisible"
      title="删除消息"
      message="确定要删除此条消息吗？此操作不可撤销。"
      type="danger"
      @confirm="handleDeleteMsg"
      @cancel="deleteMsgVisible = false"
    />

    <ConfirmDialog
      :visible="deleteRoomVisible"
      title="删除房间"
      message="确定要删除此房间吗？房间内所有消息也将被删除。此操作不可撤销。"
      type="danger"
      @confirm="handleDeleteRoom"
      @cancel="deleteRoomVisible = false"
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

const activeSection = ref<'messages' | 'rooms'>('messages')

const messageColumns: TableColumn[] = [
  { key: 'id', label: 'ID', width: '70px' },
  { key: 'room_id', label: '房间ID', width: '80px' },
  { key: 'nickname', label: '发送者' },
  { key: 'content', label: '消息内容' },
  { key: 'created_at', label: '发送时间' },
  { key: 'actions', label: '操作', width: '100px' },
]

const roomColumns: TableColumn[] = [
  { key: 'id', label: 'ID', width: '70px' },
  { key: 'name', label: '房间名称' },
  { key: 'description', label: '描述' },
  { key: 'is_public', label: '类型', width: '80px' },
  { key: 'created_at', label: '创建时间' },
  { key: 'actions', label: '操作', width: '140px' },
]

const messages = ref<Record<string, any>[]>([])
const messagesLoading = ref(false)
const roomFilter = ref('')
const msgPage = ref(1)
const msgTotalItems = ref(0)
const msgPageSize = 20

const rooms = ref<Record<string, any>[]>([])
const roomsLoading = ref(false)

const editRoomVisible = ref(false)
const editRoomTarget = ref<Record<string, any> | null>(null)
const editRoomForm = ref({ name: '', description: '', is_public: 1 })

const deleteMsgVisible = ref(false)
const deleteMsgTarget = ref<Record<string, any> | null>(null)
const deleteRoomVisible = ref(false)
const deleteRoomTarget = ref<Record<string, any> | null>(null)

const msgTotalPages = computed(() => Math.max(1, Math.ceil(msgTotalItems.value / msgPageSize)))

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

function onRoomFilterChange() {
  msgPage.value = 1
  fetchMessages()
}

async function fetchMessages() {
  const token = adminStore.token
  if (!token) return
  messagesLoading.value = true
  try {
    const params: Record<string, any> = {
      limit: msgPageSize,
      offset: (msgPage.value - 1) * msgPageSize,
    }
    if (roomFilter.value) params.room_id = Number(roomFilter.value)
    const res = await adminApi.getAdminChatMessages(token, params)
    if (res.success) {
      messages.value = res.data || []
      msgTotalItems.value = res.total ?? messages.value.length
    } else {
      toast.error(res.error || '获取消息列表失败')
    }
  } catch {
    toast.error('获取消息列表失败')
  } finally {
    messagesLoading.value = false
  }
}

async function fetchRooms() {
  const token = adminStore.token
  if (!token) return
  roomsLoading.value = true
  try {
    const res = await adminApi.getAdminChatRooms(token)
    if (res.success) {
      rooms.value = res.data || []
    } else {
      toast.error(res.error || '获取房间列表失败')
    }
  } catch {
    toast.error('获取房间列表失败')
  } finally {
    roomsLoading.value = false
  }
}

function openDeleteMsgConfirm(row: Record<string, any>) {
  deleteMsgTarget.value = row
  deleteMsgVisible.value = true
}

async function handleDeleteMsg() {
  const token = adminStore.token
  if (!token || !deleteMsgTarget.value) return
  try {
    const res = await adminApi.deleteAdminChatMessage(token, deleteMsgTarget.value.id)
    if (res.success) {
      toast.success('消息已删除')
      deleteMsgVisible.value = false
      fetchMessages()
    } else {
      toast.error(res.error || '删除失败')
    }
  } catch {
    toast.error('删除操作失败')
  }
}

function openEditRoomModal(row: Record<string, any>) {
  editRoomTarget.value = row
  editRoomForm.value = {
    name: row.name || '',
    description: row.description || '',
    is_public: row.is_public ?? 1,
  }
  editRoomVisible.value = true
}

async function handleSaveRoom() {
  const token = adminStore.token
  if (!token || !editRoomTarget.value) return
  try {
    const res = await adminApi.updateAdminChatRoom(
      token,
      editRoomTarget.value.id,
      editRoomForm.value
    )
    if (res.success) {
      toast.success('房间已更新')
      editRoomVisible.value = false
      fetchRooms()
    } else {
      toast.error(res.error || '更新失败')
    }
  } catch {
    toast.error('更新操作失败')
  }
}

function openDeleteRoomConfirm(row: Record<string, any>) {
  deleteRoomTarget.value = row
  deleteRoomVisible.value = true
}

async function handleDeleteRoom() {
  const token = adminStore.token
  if (!token || !deleteRoomTarget.value) return
  try {
    const res = await adminApi.deleteAdminChatRoom(token, deleteRoomTarget.value.id)
    if (res.success) {
      toast.success('房间已删除')
      deleteRoomVisible.value = false
      fetchRooms()
    } else {
      toast.error(res.error || '删除失败')
    }
  } catch {
    toast.error('删除操作失败')
  }
}

watch(msgPage, fetchMessages)
watch(activeSection, (val) => {
  if (val === 'rooms' && rooms.value.length === 0) {
    fetchRooms()
  }
})

onMounted(() => {
  fetchMessages()
  fetchRooms()
})
</script>

<style scoped>
.chat-mgmt {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-mgmt__tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--gui-bg-surface, #141414);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 10px;
  padding: 3px;
  width: fit-content;
}

.chat-mgmt__tab {
  padding: 7px 20px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--gui-text-tertiary, #6a6a6a);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.chat-mgmt__tab:hover {
  color: var(--gui-text-secondary, #a0a0a0);
}

.chat-mgmt__tab--active {
  background: var(--gui-bg-surface-raised, #1a1a1a);
  color: var(--gui-text-primary, #e0e0e0);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.chat-mgmt__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-mgmt__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-mgmt__select {
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

.chat-mgmt__select:focus {
  border-color: var(--gui-error, #e94560);
}

.chat-mgmt__msg-content {
  display: inline-block;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-mgmt__badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.chat-mgmt__badge--public {
  background: rgba(52, 199, 89, 0.12);
  color: var(--gui-success, #34c759);
}

.chat-mgmt__badge--private {
  background: var(--gui-warning-bg, rgba(255, 204, 0, 0.12));
  color: var(--gui-warning, #ffcc00);
}

.chat-mgmt__cell-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-mgmt__action-btn {
  padding: 4px 10px;
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 5px;
  background: var(--gui-bg-surface-raised, #242424);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
}

.chat-mgmt__action-btn:hover {
  background: var(--gui-bg-surface-hover, #303030);
}

.chat-mgmt__action-btn--edit {
  color: var(--gui-info, #0a84ff);
  border-color: rgba(10, 132, 255, 0.2);
}

.chat-mgmt__action-btn--edit:hover {
  background: rgba(10, 132, 255, 0.12);
}

.chat-mgmt__action-btn--danger {
  color: var(--gui-error, #ff3b30);
  border-color: rgba(255, 59, 48, 0.2);
}

.chat-mgmt__action-btn--danger:hover {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.12));
}

.chat-mgmt__btn {
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

.chat-mgmt__btn:active {
  transform: scale(0.96);
}

.chat-mgmt__btn--primary {
  background: rgba(233, 69, 96, 0.15);
  color: var(--gui-error, #e94560);
  border-color: rgba(233, 69, 96, 0.2);
}

.chat-mgmt__btn--primary:hover {
  background: rgba(233, 69, 96, 0.25);
}

.chat-mgmt__btn--ghost {
  background: var(--gui-bg-surface-raised, #242424);
  color: var(--gui-text-secondary, #a0a0a0);
  border: 1px solid var(--gui-border-default, #2a2a2a);
}

.chat-mgmt__btn--ghost:hover {
  background: var(--gui-bg-surface-hover, #303030);
  color: var(--gui-text-primary, #e0e0e0);
}

.chat-mgmt__modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chat-mgmt__modal-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-mgmt__modal-label {
  font-size: 12px;
  color: var(--gui-text-tertiary, #6a6a6a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chat-mgmt__input {
  padding: 8px 12px;
  background: var(--gui-bg-surface, #0f0f0f);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 8px;
  color: var(--gui-text-primary, #e0e0e0);
  font-size: 13px;
  outline: none;
  transition: border-color 150ms ease;
}

.chat-mgmt__input:focus {
  border-color: var(--gui-error, #e94560);
}

.chat-mgmt__input::placeholder {
  color: var(--gui-text-disabled, #4a4a4a);
}

.chat-mgmt__textarea {
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

.chat-mgmt__textarea:focus {
  border-color: var(--gui-error, #e94560);
}

.chat-mgmt__textarea::placeholder {
  color: var(--gui-text-disabled, #4a4a4a);
}

.chat-mgmt__toggle-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.chat-mgmt__toggle {
  position: relative;
  width: 40px;
  height: 22px;
  border: none;
  border-radius: 11px;
  background: var(--gui-border-default, #2a2a2a);
  cursor: pointer;
  transition: background 200ms ease;
  padding: 0;
}

.chat-mgmt__toggle--on {
  background: #e94560;
}

.chat-mgmt__toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--gui-bg-surface, #ffffff);
  transition: transform 200ms ease;
}

.chat-mgmt__toggle--on .chat-mgmt__toggle-knob {
  transform: translateX(18px);
}

.chat-mgmt__toggle-label {
  font-size: 13px;
  color: var(--gui-text-secondary, #a0a0a0);
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .chat-mgmt__tabs {
  background: var(--gui-bg-surface-hover, #e8e8ed);
  border-color: var(--gui-border-default, #d1d1d6);
}
.light .chat-mgmt__tab--active {
  background: var(--gui-bg-surface, #ffffff);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.light .chat-mgmt__select {
  background: var(--gui-bg-surface, #ffffff);
  border-color: var(--gui-border-default, #d1d1d6);
}
.light .chat-mgmt__action-btn {
  border-color: var(--gui-border-default, #d1d1d6);
  background: var(--gui-bg-surface, #ffffff);
}
.light .chat-mgmt__action-btn:hover {
  background: var(--gui-bg-surface-hover, #f0f0f0);
}
.light .chat-mgmt__input,
.light .chat-mgmt__textarea {
  background: var(--gui-bg-surface, #ffffff);
  border-color: var(--gui-border-default, #d1d1d6);
}
.light .chat-mgmt__toggle-label {
  color: var(--gui-text-secondary, #6e6e73);
}
</style>
