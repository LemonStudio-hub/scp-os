<template>
  <MobileWindow
    :visible="visible"
    :title="t('chat.title')"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="chat-app k-ios-page" :class="{ 'k-ios-page--dark': themeStore.currentTheme.isDark }" :style="chatThemeStyles">
      <!-- Room Selector -->
      <div class="chat-app__room-selector">
        <div class="chat-app__rooms">
          <!-- 加载状态 -->
          <div v-if="loadingRooms" class="chat-app__loading-rooms">
            <div class="chat-app__loading-dot"></div>
            <div class="chat-app__loading-dot"></div>
            <div class="chat-app__loading-dot"></div>
          </div>
          <!-- 聊天室列表 -->
          <template v-else>
            <div
              v-for="room in rooms"
              :key="room.id"
              class="chat-app__room-item"
              :class="{ 'chat-app__room-item--active': currentRoomId === room.id }"
            >
              <div class="chat-app__room-header" @click="switchRoom(room.id)">
                <div class="chat-app__room-info">
                  <span class="chat-app__room-name">{{ room.name }}</span>
                  <span class="chat-app__room-meta">
                    <span class="chat-app__room-members">{{ room.member_count }} 人</span>
                    <span v-if="getUnreadCount(room.id) > 0" class="chat-app__room-badge">{{ getUnreadCount(room.id) }}</span>
                  </span>
                </div>
                <div v-if="room.last_message" class="chat-app__room-last-message">
                  <span class="chat-app__room-last-sender">{{ room.last_message_sender }}: </span>
                  <span class="chat-app__room-last-content">{{ truncateMessage(room.last_message) }}</span>
                </div>
              </div>
              <!-- 室长设置按钮 -->
              <button
                v-if="room.created_by === userId"
                class="chat-app__room-settings-btn"
                @click.stop="openRoomSettings(room)"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 1.66667C5.46 1.66667 1.66667 5.46 1.66667 10C1.66667 14.54 5.46 18.3333 10 18.3333C14.54 18.3333 18.3333 14.54 18.3333 10C18.3333 5.46 14.54 1.66667 10 1.66667ZM10 16.6667C6.43 16.6667 3.33333 13.57 3.33333 10C3.33333 6.43 6.43 3.33333 10 3.33333C13.57 3.33333 16.6667 6.43 16.6667 10C16.6667 13.57 13.57 16.6667 10 16.6667ZM10 8.33333C10.46 8.33333 10.8333 8.70667 10.8333 9.16667V10.8333C10.8333 11.2933 10.46 11.6667 10 11.6667C9.54 11.6667 9.16667 11.2933 9.16667 10.8333V9.16667C9.16667 8.70667 9.54 8.33333 10 8.33333Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            <button class="chat-app__room-tab chat-app__room-tab--add" @click="showCreateRoom = true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </template>
        </div>
        <button class="chat-app__nickname-btn" @click="showNicknameDialog = true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="6" r="4" stroke="currentColor" stroke-width="1.3"/>
            <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <span class="chat-app__nickname-text">{{ nickname || t('chat.setNickname') }}</span>
        </button>
      </div>

      <!-- Messages List -->
      <div ref="messagesRef" class="chat-app__messages gui-scrollable">
        <div v-if="messages.length === 0 && !loading" class="chat-app__empty">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M24 44c11 0 20-8 20-18S35 8 24 8 4 16 4 26s9 18 20 18z" stroke="currentColor" stroke-width="2"/>
            <path d="M24 44l4-8h6l-6-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="16" cy="24" r="2" fill="currentColor"/>
            <circle cx="24" cy="24" r="2" fill="currentColor"/>
            <circle cx="32" cy="24" r="2" fill="currentColor"/>
          </svg>
          <p>{{ t('chat.emptyState') }}</p>
        </div>

        <div
          v-for="msg in displayMessages"
          :key="msg.tempId || msg.id"
          class="chat-bubble"
          :class="{
            'chat-bubble--self': msg.isSelf,
            'chat-bubble--sending': msg.sending,
          }"
        >
          <div class="chat-bubble__header">
            <span class="chat-bubble__username">{{ msg.username }}</span>
            <span class="chat-bubble__time">{{ formatTime(msg.created_at) }}</span>
          </div>
          <div class="chat-bubble__content">{{ msg.content }}</div>
          <div v-if="msg.sending" class="chat-bubble__status">{{ t('chat.sending') }}</div>
          <div v-else-if="msg.error" class="chat-bubble__status chat-bubble__status--error">{{ msg.error }}</div>
        </div>

        <!-- Loading Indicator -->
        <div v-if="loading" class="chat-app__loading">
          <div class="chat-app__loading-dot" />
          <div class="chat-app__loading-dot" />
          <div class="chat-app__loading-dot" />
        </div>
      </div>

      <!-- Rate Limit Warning -->
      <div v-if="rateLimitWarning" class="chat-app__rate-warning">
        {{ rateLimitWarning }}
      </div>

      <!-- Input Bar -->
      <div class="chat-app__input-bar">
        <input
          v-model="inputContent"
          type="text"
          class="chat-app__input"
          :placeholder="t('chat.placeholder')"
          :disabled="sending || rateLimited"
          @keyup.enter="sendMessage"
        />
        <button
          class="chat-app__send-btn"
          :disabled="!inputContent.trim() || sending || rateLimited"
          @click="sendMessage"
        >
          <svg v-if="!sending" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 10L17 3L10 17L9 11L3 10Z" fill="currentColor"/>
          </svg>
          <div v-else class="chat-app__spinner" />
        </button>
      </div>

      <!-- Create Room Dialog -->
      <Transition name="gui-ios-fade">
        <div v-if="showCreateRoom" class="chat-app__dialog-overlay" @click.self="closeCreateRoomDialog">
          <div class="chat-app__dialog">
            <h3 class="chat-app__dialog-title">{{ t('chat.createRoom') }}</h3>
            <input
              v-model="newRoomName"
              type="text"
              class="chat-app__dialog-input"
              :placeholder="t('chat.roomPlaceholder')"
              maxlength="50"
              :disabled="creatingRoom"
            />
            <textarea
              v-model="newRoomDescription"
              class="chat-app__dialog-textarea"
              :placeholder="t('chat.roomDescriptionPlaceholder')"
              maxlength="200"
              :disabled="creatingRoom"
            ></textarea>
            <div class="chat-app__dialog-toggle">
              <span class="chat-app__dialog-toggle-label">{{ t('chat.privateRoom') }}</span>
              <label class="chat-app__toggle">
                <input
                  v-model="newRoomPrivate"
                  type="checkbox"
                  :disabled="creatingRoom"
                />
                <span class="chat-app__toggle-slider"></span>
              </label>
            </div>
            <div v-if="createRoomError" class="chat-app__dialog-error">{{ createRoomError }}</div>
            <div class="chat-app__dialog-actions">
              <button class="chat-app__dialog-btn" :disabled="creatingRoom" @click="closeCreateRoomDialog">{{ t('common.cancel') }}</button>
              <button class="chat-app__dialog-btn chat-app__dialog-btn--primary" :disabled="!newRoomName.trim() || creatingRoom" @click="createRoom">
                <span v-if="!creatingRoom">{{ t('common.create') }}</span>
                <div v-else class="chat-app__spinner"></div>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Nickname Dialog -->
      <Transition name="gui-ios-fade">
        <div v-if="showNicknameDialog" class="chat-app__dialog-overlay" @click.self="showNicknameDialog = false">
          <div class="chat-app__dialog">
            <h3 class="chat-app__dialog-title">{{ t('chat.setNickname') }}</h3>
            <input
              v-model="newNickname"
              type="text"
              class="chat-app__dialog-input"
              :placeholder="t('chat.nicknamePlaceholder')"
              maxlength="30"
              @keyup.enter="saveNickname"
            />
            <div class="chat-app__dialog-actions">
              <button class="chat-app__dialog-btn" @click="showNicknameDialog = false">{{ t('common.cancel') }}</button>
              <button class="chat-app__dialog-btn chat-app__dialog-btn--primary" @click="saveNickname">{{ t('common.save') }}</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Room Settings Dialog -->
      <Transition name="gui-ios-fade">
        <div v-if="showRoomSettings" class="chat-app__dialog-overlay" @click.self="closeRoomSettingsDialog">
          <div class="chat-app__dialog">
            <h3 class="chat-app__dialog-title">{{ t('chat.roomSettings') }}</h3>
            <input
              v-model="editRoomName"
              type="text"
              class="chat-app__dialog-input"
              :placeholder="t('chat.roomPlaceholder')"
              maxlength="50"
              :disabled="savingRoomSettings"
            />
            <textarea
              v-model="editRoomDescription"
              class="chat-app__dialog-textarea"
              :placeholder="t('chat.roomDescriptionPlaceholder')"
              maxlength="200"
              :disabled="savingRoomSettings"
            ></textarea>
            <div class="chat-app__dialog-toggle">
              <span class="chat-app__dialog-toggle-label">{{ t('chat.privateRoom') }}</span>
              <label class="chat-app__toggle">
                <input
                  v-model="editRoomPrivate"
                  type="checkbox"
                  :disabled="savingRoomSettings"
                />
                <span class="chat-app__toggle-slider"></span>
              </label>
            </div>
            <div v-if="roomSettingsError" class="chat-app__dialog-error">{{ roomSettingsError }}</div>
            <div class="chat-app__dialog-actions">
              <button class="chat-app__dialog-btn" :disabled="savingRoomSettings || deletingRoom" @click="closeRoomSettingsDialog">{{ t('common.cancel') }}</button>
              <button class="chat-app__dialog-btn chat-app__dialog-btn--primary" :disabled="!editRoomName.trim() || savingRoomSettings || deletingRoom" @click="saveRoomSettings">
                <span v-if="!savingRoomSettings">{{ t('common.save') }}</span>
                <div v-else class="chat-app__spinner"></div>
              </button>
            </div>
            <div class="chat-app__dialog-divider"></div>
            <button class="chat-app__dialog-btn chat-app__dialog-btn--danger" :disabled="savingRoomSettings || deletingRoom" @click="deleteRoom">
              <span v-if="!deletingRoom">{{ t('chat.deleteRoom') }}</span>
              <div v-else class="chat-app__spinner"></div>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
import { useThemeStore } from '../../stores/themeStore'
import { useI18n } from '../../composables/useI18n'
import { config } from '../../../config'
import indexedDBService from '../../../utils/indexedDB'

interface Props {
  visible: boolean
}

interface ChatMessage {
  id?: number
  tempId?: string
  user_id: string
  username: string
  content: string
  created_at: string
  isSelf: boolean
  sending?: boolean
  error?: string
  room_id?: number
}

interface ChatRoom {
  id: number
  name: string
  description: string
  message_count: number
  member_count: number
  last_message: string
  last_message_sender: string
  last_message_time: string
  created_by: string
  is_private?: boolean
}

defineProps<Props>()
defineEmits<{
  (e: 'close'): void
}>()

const themeStore = useThemeStore()
themeStore.init()

const { t } = useI18n()

const API_BASE = config.api.workerUrl
const POLL_INTERVAL = 30000 // 30 seconds
const MAX_MESSAGES = 100

const messagesRef = ref<HTMLElement>()
const inputContent = ref('')
const messages = reactive<ChatMessage[]>([])
const rooms = reactive<ChatRoom[]>([])
const currentRoomId = ref(1)
const loading = ref(false)
const loadingRooms = ref(false)
const sending = ref(false)
const nickname = ref('')
const rateLimitWarning = ref('')
const rateLimited = ref(false)
let pollTimer: number | null = null
let userId = ''

// Dialogs
const showCreateRoom = ref(false)
const showNicknameDialog = ref(false)
const showRoomSettings = ref(false)
const editingRoomId = ref<number | null>(null)
const editRoomName = ref('')
const editRoomDescription = ref('')
const editRoomPrivate = ref(false)
const savingRoomSettings = ref(false)
const roomSettingsError = ref('')
const deletingRoom = ref(false)
const newRoomName = ref('')
const newRoomDescription = ref('')
const newRoomPrivate = ref(false)
const creatingRoom = ref(false)
const createRoomError = ref('')
const newNickname = ref('')

// 未读消息追踪
const unreadCounts = ref<Record<number, number>>({})

const displayMessages = computed(() => messages)

// 获取房间未读消息数
function getUnreadCount(roomId: number): number {
  return unreadCounts.value[roomId] || 0
}

// 设置房间未读消息数
function setUnreadCount(roomId: number, count: number) {
  unreadCounts.value[roomId] = count
}

// 标记房间为已读（清除未读计数）
function markRoomAsRead(roomId: number) {
  setUnreadCount(roomId, 0)
  // 保存到 IndexedDB
  indexedDBService.saveSetting('chat_unread_counts', unreadCounts.value).catch((error) => {
    console.error('[Chat] Failed to save unread counts:', error)
  })
}

// Theme-reactive computed styles
const chatThemeStyles = computed(() => ({
  '--chat-bg': themeStore.currentTheme.colors.bgBase || '#1C1C1E',
  '--chat-surface': themeStore.currentTheme.colors.bgSurface || '#2C2C2E',
  '--chat-surface-hover': themeStore.currentTheme.colors.bgSurfaceHover || '#3A3A3C',
  '--chat-border': themeStore.currentTheme.colors.borderSubtle || '#38383A',
  '--chat-text-primary': themeStore.currentTheme.colors.textPrimary || '#FFFFFF',
  '--chat-text-secondary': themeStore.currentTheme.colors.textSecondary || '#8E8E93',
  '--chat-text-tertiary': themeStore.currentTheme.colors.textTertiary || '#636366',
  '--chat-accent': themeStore.currentTheme.colors.accent || '#007AFF',
  '--chat-error': '#FF3B30',
}))

onMounted(async () => {
  userId = await indexedDBService.getUserId()
  await loadRooms()
  await loadNickname()
  await loadUnreadCounts()
  await loadMessages()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

async function loadUnreadCounts() {
  try {
    const stored = await indexedDBService.loadSetting('chat_unread_counts')
    if (stored) {
      unreadCounts.value = stored
    }
  } catch (error) {
    console.error('[Chat] Failed to load unread counts:', error)
  }
}

async function loadRooms() {
  loadingRooms.value = true
  try {
    const response = await fetch(`${API_BASE}/chat/rooms`)
    const data = await response.json()
    if (data.success && data.data) {
      const oldRooms = new Map(rooms.map(r => [r.id, r]))
      
      rooms.length = 0
      for (const room of data.data) {
        const oldRoom = oldRooms.get(room.id)
        // 如果房间消息数增加且不是当前房间，增加未读计数
        if (oldRoom && room.message_count > oldRoom.message_count && room.id !== currentRoomId.value) {
          const delta = room.message_count - oldRoom.message_count
          setUnreadCount(room.id, getUnreadCount(room.id) + delta)
        }
        rooms.push(room)
      }
    }
  } catch (error) {
    console.error('[Chat] Failed to load rooms:', error)
  } finally {
    loadingRooms.value = false
  }
}

async function loadNickname() {
  try {
    const stored = await indexedDBService.loadSetting('chat_nickname')
    if (stored) {
      nickname.value = stored
    }
  } catch (error) {
    console.error('[Chat] Failed to load nickname:', error)
  }
}

async function saveNickname() {
  if (!newNickname.value.trim()) return

  try {
    const response = await fetch(`${API_BASE}/chat/nickname`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, nickname: newNickname.value.trim() }),
    })

    const data = await response.json()
    if (data.success) {
      nickname.value = newNickname.value.trim()
      await indexedDBService.saveSetting('chat_nickname', nickname.value)
      showNicknameDialog.value = false
    }
  } catch (error) {
    console.error('[Chat] Failed to save nickname:', error)
  }
}

function closeCreateRoomDialog() {
  showCreateRoom.value = false
  newRoomName.value = ''
  newRoomDescription.value = ''
  newRoomPrivate.value = false
  createRoomError.value = ''
  creatingRoom.value = false
}

function openRoomSettings(room: ChatRoom) {
  editingRoomId.value = room.id
  editRoomName.value = room.name
  editRoomDescription.value = room.description
  editRoomPrivate.value = room.is_private || false
  roomSettingsError.value = ''
  showRoomSettings.value = true
}

function closeRoomSettingsDialog() {
  showRoomSettings.value = false
  editingRoomId.value = null
  editRoomName.value = ''
  editRoomDescription.value = ''
  editRoomPrivate.value = false
  roomSettingsError.value = ''
  savingRoomSettings.value = false
  deletingRoom.value = false
}

async function saveRoomSettings() {
  if (!editingRoomId.value || !editRoomName.value.trim()) return

  savingRoomSettings.value = true
  roomSettingsError.value = ''

  try {
    const response = await fetch(`${API_BASE}/chat/rooms/${editingRoomId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editRoomName.value.trim(),
        description: editRoomDescription.value.trim(),
        is_private: editRoomPrivate.value,
        created_by: userId,
      }),
    })

    const data = await response.json()
    if (data.success) {
      await loadRooms()
      closeRoomSettingsDialog()
    } else {
      roomSettingsError.value = data.error || t('chat.failedSaveSettings')
    }
  } catch (error) {
    console.error('[Chat] Failed to save room settings:', error)
    roomSettingsError.value = t('chat.networkError')
  } finally {
    savingRoomSettings.value = false
  }
}

async function deleteRoom() {
  if (!editingRoomId.value) return

  if (!confirm(t('chat.confirmDeleteRoom'))) return

  deletingRoom.value = true

  try {
    const response = await fetch(`${API_BASE}/chat/rooms/${editingRoomId.value}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ created_by: userId }),
    })

    const data = await response.json()
    if (data.success) {
      await loadRooms()
      // 如果删除的是当前房间，切换到第一个可用房间
      if (currentRoomId.value === editingRoomId.value && rooms.length > 0) {
        switchRoom(rooms[0].id)
      } else if (rooms.length === 0) {
        currentRoomId.value = 0
        messages.length = 0
      }
      closeRoomSettingsDialog()
    } else {
      roomSettingsError.value = data.error || t('chat.failedDeleteRoom')
    }
  } catch (error) {
    console.error('[Chat] Failed to delete room:', error)
    roomSettingsError.value = t('chat.networkError')
  } finally {
    deletingRoom.value = false
  }
}

async function createRoom() {
  if (!newRoomName.value.trim()) return

  creatingRoom.value = true
  createRoomError.value = ''

  try {
    const response = await fetch(`${API_BASE}/chat/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newRoomName.value.trim(),
        description: newRoomDescription.value.trim(),
        is_private: newRoomPrivate.value,
        created_by: userId,
      }),
    })

    const data = await response.json()
    if (data.success) {
      await loadRooms()
      closeCreateRoomDialog()
    } else {
      // 处理创建限制错误
      if (data.error && data.error.includes('maximum number of rooms')) {
        createRoomError.value = t('chat.maxRoomsReached')
      } else {
        createRoomError.value = data.error || t('chat.failedCreateRoom')
      }
    }
  } catch (error) {
    console.error('[Chat] Failed to create room:', error)
    createRoomError.value = t('chat.networkError')
  } finally {
    creatingRoom.value = false
  }
}

function switchRoom(roomId: number) {
  if (currentRoomId.value === roomId) return
  currentRoomId.value = roomId
  messages.length = 0
  markRoomAsRead(roomId)
  loadMessages()
}

async function loadMessages() {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/chat/messages?limit=${MAX_MESSAGES}&room_id=${currentRoomId.value}`)
    const data = await response.json()

    if (data.success && data.data) {
      const serverMessages = (data.data as ChatMessage[]).map(msg => ({
        ...msg,
        isSelf: msg.user_id === userId,
      }))

      const localPending = messages.filter(m => m.tempId && !m.error)
      const merged = mergeMessages(serverMessages, localPending)
      
      messages.length = 0
      messages.push(...merged)
      
      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    console.error('[Chat] Failed to load messages:', error)
  } finally {
    loading.value = false
  }
}

function mergeMessages(server: ChatMessage[], local: ChatMessage[]): ChatMessage[] {
  const serverIds = new Set(server.map(m => m.id))
  const nonDuplicateLocal = local.filter(m => !serverIds.has(m.id))
  
  const all = [...server, ...nonDuplicateLocal]
  return all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

async function sendMessage() {
  const content = inputContent.value.trim()
  if (!content || sending.value || rateLimited.value) return

  const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const now = new Date().toISOString()

  // Optimistic update
  const optimisticMessage: ChatMessage = {
    tempId,
    user_id: userId,
    username: nickname.value || t('chat.you'),
    content,
    created_at: now,
    isSelf: true,
    sending: true,
  }

  messages.push(optimisticMessage)
  inputContent.value = ''
  sending.value = true
  rateLimitWarning.value = ''

  await nextTick()
  scrollToBottom()

  try {
    const response = await fetch(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        nickname: nickname.value || undefined,
        content,
        room_id: currentRoomId.value,
      }),
    })

    const data = await response.json()

    if (data.success && data.data) {
      const idx = messages.findIndex(m => m.tempId === tempId)
      if (idx !== -1) {
        messages[idx] = {
          ...data.data,
          isSelf: true,
        }
      }
    } else {
      const idx = messages.findIndex(m => m.tempId === tempId)
      if (idx !== -1) {
        messages[idx].sending = false
        messages[idx].error = data.error || t('chat.failedSend')
        
        // Check for rate limit
        if (data.error && data.error.includes('Rate limit')) {
          rateLimitWarning.value = data.error
          rateLimited.value = true
          setTimeout(() => {
            rateLimited.value = false
            rateLimitWarning.value = ''
          }, 60000)
        }
      }
    }
  } catch (error) {
    console.error('[Chat] Failed to send message:', error)
    const idx = messages.findIndex(m => m.tempId === tempId)
    if (idx !== -1) {
      messages[idx].sending = false
      messages[idx].error = t('chat.networkError')
    }
  } finally {
    sending.value = false
  }
}

function startPolling() {
  stopPolling()
  pollTimer = window.setInterval(() => {
    loadMessages()
    loadRooms() // Update room message counts
  }, POLL_INTERVAL)
}

function stopPolling() {
  if (pollTimer !== null) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function truncateMessage(message: string, maxLength: number = 20): string {
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength) + '...'
}
</script>

<style scoped>
.chat-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--chat-bg, var(--gui-bg-base, #1C1C1E));
}

/* Room Selector */
.chat-app__room-selector {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10px 12px;
  padding-top: max(10px, env(safe-area-inset-top, 10px));
  background: var(--chat-surface, var(--gui-bg-surface, #2C2C2E));
  border-bottom: 0.5px solid var(--chat-border, var(--gui-border-subtle, #38383A));
  gap: 8px;
}

.chat-app__rooms {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  scrollbar-width: none;
  flex: 1;
  max-height: 300px;
  -webkit-overflow-scrolling: touch;
}

.chat-app__rooms::-webkit-scrollbar {
  display: none;
}

.chat-app__room-item {
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--chat-surface-hover, var(--gui-bg-surface-hover, #3A3A3C));
  cursor: pointer;
  transition: background 150ms ease, transform 100ms ease;
  -webkit-tap-highlight-color: transparent;
}

.chat-app__room-item:active {
  transform: scale(0.98);
}

.chat-app__room-item--active {
  background: var(--chat-accent, #007AFF);
}

.chat-app__room-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-app__room-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-app__room-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--chat-text-primary, var(--gui-text-primary, #FFFFFF));
}

.chat-app__room-item--active .chat-app__room-name {
  color: #FFFFFF;
}

.chat-app__room-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-app__room-members {
  font-size: 12px;
  color: var(--chat-text-secondary, var(--gui-text-secondary, #8E8E93));
}

.chat-app__room-item--active .chat-app__room-members {
  color: rgba(255, 255, 255, 0.8);
}

.chat-app__room-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--chat-error, #FF3B30);
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
}

.chat-app__room-last-message {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--chat-text-secondary, var(--gui-text-secondary, #8E8E93));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-app__room-item--active .chat-app__room-last-message {
  color: rgba(255, 255, 255, 0.8);
}

.chat-app__room-last-sender {
  font-weight: 500;
  flex-shrink: 0;
}

.chat-app__room-last-content {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-app__room-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 16px;
  border: none;
  background: transparent;
  color: var(--chat-text-secondary, var(--gui-text-secondary, #8E8E93));
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 150ms ease, color 150ms ease, transform 100ms ease;
  -webkit-tap-highlight-color: transparent;
}

.chat-app__room-tab:active {
  transform: scale(0.96);
}

.chat-app__room-tab--add {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--chat-accent, #007AFF);
  color: #FFFFFF;
  border-radius: 50%;
  margin-top: 8px;
}

.chat-app__room-settings-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: var(--chat-surface, var(--gui-bg-surface, #2C2C2E));
  color: var(--chat-text-secondary, var(--gui-text-secondary, #8E8E93));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 150ms ease, transform 100ms ease;
  -webkit-tap-highlight-color: transparent;
  z-index: 1;
}

.chat-app__room-settings-btn:active {
  transform: scale(0.95);
}

.chat-app__room-item {
  position: relative;
}

.chat-app__loading-rooms {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 24px 0;
}

.chat-app__loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--chat-accent, #007AFF);
  animation: ios-bounce 1.2s ease-in-out infinite;
}

.chat-app__loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.chat-app__loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

.chat-app__dialog-divider {
  height: 0.5px;
  background: var(--chat-border, var(--gui-border-subtle, #38383A));
  margin: 16px 0;
}

.chat-app__dialog-btn--danger {
  background: var(--chat-error, #FF3B30);
  color: #FFFFFF;
  width: 100%;
}

.chat-app__dialog-btn--danger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chat-app__nickname-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 16px;
  border: none;
  background: var(--chat-surface-hover, var(--gui-bg-surface-hover, #3A3A3C));
  color: var(--chat-text-secondary, var(--gui-text-secondary, #8E8E93));
  font-size: 12px;
  cursor: pointer;
  transition: background 150ms ease;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.chat-app__nickname-btn:active {
  background: var(--chat-border, var(--gui-border-subtle, #38383A));
}

.chat-app__nickname-btn svg {
  flex-shrink: 0;
}

.chat-app__nickname-text {
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Messages */
.chat-app__messages {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.chat-app__messages::-webkit-scrollbar {
  display: none;
}

.chat-app__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--chat-text-tertiary, var(--gui-text-tertiary, #636366));
  gap: 12px;
}

.chat-app__empty p {
  font-size: 14px;
  margin: 0;
}

.chat-bubble {
  margin-bottom: 12px;
  animation: ios-fade-in 200ms ease;
}

.chat-bubble--self {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.chat-bubble__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  padding: 0 4px;
}

.chat-bubble__username {
  font-size: 11px;
  font-weight: 600;
  color: var(--chat-text-secondary, var(--gui-text-secondary, #8E8E93));
}

.chat-bubble__time {
  font-size: 10px;
  color: var(--chat-text-tertiary, var(--gui-text-tertiary, #636366));
}

.chat-bubble__content {
  max-width: 85%;
  padding: 8px 12px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  background: var(--chat-surface, var(--gui-bg-surface, #2C2C2E));
  color: var(--chat-text-primary, var(--gui-text-primary, #FFFFFF));
}

.chat-bubble--self .chat-bubble__content {
  background: var(--chat-accent, #007AFF);
  color: #FFFFFF;
  border-bottom-right-radius: 4px;
}

.chat-bubble:not(.chat-bubble--self) .chat-bubble__content {
  border-bottom-left-radius: 4px;
}

.chat-bubble--sending {
  opacity: 0.6;
}

.chat-bubble__status {
  font-size: 10px;
  color: var(--chat-text-tertiary, var(--gui-text-tertiary, #636366));
  margin-top: 2px;
  padding: 0 4px;
}

.chat-bubble__status--error {
  color: var(--chat-error, #FF3B30);
}

/* Rate Limit Warning */
.chat-app__rate-warning {
  padding: 8px 12px;
  background: var(--chat-error, #FF3B30);
  color: #FFFFFF;
  font-size: 12px;
  text-align: center;
}

/* Loading */
.chat-app__loading {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 12px 0;
}

.chat-app__loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--chat-accent, #007AFF);
  animation: ios-bounce 1.2s ease-in-out infinite;
}

.chat-app__loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.chat-app__loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* Input Bar */
.chat-app__input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  background: var(--chat-surface, var(--gui-bg-surface, #2C2C2E));
  border-top: 0.5px solid var(--chat-border, var(--gui-border-subtle, #38383A));
}

.chat-app__input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border-radius: 18px;
  border: none;
  background: var(--chat-surface-hover, var(--gui-bg-surface-hover, #3A3A3C));
  color: var(--chat-text-primary, var(--gui-text-primary, #FFFFFF));
  font-size: 14px;
  outline: none;
}

.chat-app__input::placeholder {
  color: var(--chat-text-tertiary, var(--gui-text-tertiary, #636366));
}

.chat-app__send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--chat-accent, #007AFF);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 150ms ease, transform 100ms ease;
}

.chat-app__send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chat-app__send-btn:not(:disabled):active {
  transform: scale(0.95);
}

.chat-app__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Dialogs */
.chat-app__dialog-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}

.chat-app__dialog {
  width: 100%;
  max-width: 300px;
  background: var(--chat-surface, var(--gui-bg-surface, #2C2C2E));
  border-radius: 14px;
  padding: 20px;
}

.chat-app__dialog-title {
  margin: 0 0 16px;
  font-size: 17px;
  font-weight: 600;
  color: var(--chat-text-primary, var(--gui-text-primary, #FFFFFF));
  text-align: center;
}

.chat-app__dialog-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border-radius: 8px;
  border: 0.5px solid var(--chat-border, var(--gui-border-subtle, #38383A));
  background: var(--chat-surface-hover, var(--gui-bg-surface-hover, #3A3A3C));
  color: var(--chat-text-primary, var(--gui-text-primary, #FFFFFF));
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 12px;
}

.chat-app__dialog-textarea {
  width: 100%;
  height: 80px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 0.5px solid var(--chat-border, var(--gui-border-subtle, #38383A));
  background: var(--chat-surface-hover, var(--gui-bg-surface-hover, #3A3A3C));
  color: var(--chat-text-primary, var(--gui-text-primary, #FFFFFF));
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  resize: none;
  margin-bottom: 12px;
}

.chat-app__dialog-textarea::placeholder {
  color: var(--chat-text-tertiary, var(--gui-text-tertiary, #636366));
}

.chat-app__dialog-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.chat-app__dialog-toggle-label {
  font-size: 14px;
  color: var(--chat-text-primary, var(--gui-text-primary, #FFFFFF));
}

.chat-app__toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.chat-app__toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.chat-app__toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--chat-surface-hover, var(--gui-bg-surface-hover, #3A3A3C));
  transition: .3s;
  border-radius: 24px;
}

.chat-app__toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

.chat-app__toggle input:checked + .chat-app__toggle-slider {
  background-color: var(--chat-accent, #007AFF);
}

.chat-app__toggle input:checked + .chat-app__toggle-slider:before {
  transform: translateX(20px);
}

.chat-app__dialog-error {
  color: var(--chat-error, #FF3B30);
  font-size: 12px;
  margin-bottom: 12px;
  text-align: center;
}

.chat-app__dialog-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.chat-app__dialog-btn {
  flex: 1;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: var(--chat-surface-hover, var(--gui-bg-surface-hover, #3A3A3C));
  color: var(--chat-text-primary, var(--gui-text-primary, #FFFFFF));
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.chat-app__dialog-btn--primary {
  background: var(--chat-accent, #007AFF);
  color: #FFFFFF;
}

/* Animations */
@keyframes ios-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ios-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
