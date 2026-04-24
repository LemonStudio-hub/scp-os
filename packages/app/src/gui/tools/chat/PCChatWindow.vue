<template>
  <PCWindow
    :visible="visible"
    :title="t('chat.title')"
    @close="$emit('close')"
  >
    <div class="pc-chat" :style="chatThemeStyles">
      <!-- Sidebar: Room List -->
      <div class="pc-chat__sidebar">
        <div class="pc-chat__sidebar-header">
          <h2 class="pc-chat__sidebar-title">{{ t('chat.title') }}</h2>
          <button class="pc-chat__add-room-btn" :title="t('chat.createRoom')" @click="showCreateRoom = true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v12M3 9h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="pc-chat__search">
          <svg class="pc-chat__search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input
            v-model="roomSearchQuery"
            type="text"
            class="pc-chat__search-input"
            :placeholder="t('chat.searchRooms') || 'Search rooms...'"
          />
        </div>

        <div class="pc-chat__room-list">
          <div v-if="loadingRooms" class="pc-chat__room-loading">
            <div class="pc-chat__loading-dot" />
            <div class="pc-chat__loading-dot" />
            <div class="pc-chat__loading-dot" />
          </div>
          <template v-else>
            <div
              v-for="room in filteredRooms"
              :key="room.id"
              class="pc-chat__room-item"
              :class="{ 'pc-chat__room-item--active': currentRoomId === room.id }"
              @click="switchRoom(room.id)"
            >
              <div class="pc-chat__room-avatar">{{ room.name.charAt(0).toUpperCase() }}</div>
              <div class="pc-chat__room-body">
                <div class="pc-chat__room-top">
                  <span class="pc-chat__room-name">{{ room.name }}</span>
                  <span class="pc-chat__room-time">{{ formatRoomTime(room.last_message_time) }}</span>
                </div>
                <div class="pc-chat__room-bottom">
                  <span class="pc-chat__room-preview">
                    <template v-if="room.last_message">
                      <span class="pc-chat__room-sender">{{ room.last_message_sender }}: </span>
                      {{ truncateMessage(room.last_message) }}
                    </template>
                    <template v-else>{{ t('chat.emptyState') }}</template>
                  </span>
                  <span v-if="getUnreadCount(room.id) > 0" class="pc-chat__room-badge">{{ getUnreadCount(room.id) }}</span>
                </div>
              </div>
              <button
                v-if="room.created_by === userId"
                class="pc-chat__room-settings"
                @click.stop="openRoomSettings(room)"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 9.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M7 1.5v1M7 11.5v1M1.5 7h1M11.5 7h1M3.1 3.1l.7.7M10.2 10.2l.7.7M3.1 10.9l.7-.7M10.2 3.8l.7-.7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </template>
        </div>

        <button class="pc-chat__nickname-btn" @click="openNicknameDialog">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="6" r="4" stroke="currentColor" stroke-width="1.3"/>
            <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <span class="pc-chat__nickname-text">{{ authStore.nickname || t('chat.setNickname') }}</span>
        </button>
      </div>

      <!-- Main: Chat Area -->
      <div class="pc-chat__main">
        <template v-if="currentRoom">
          <div class="pc-chat__chat-header">
            <div class="pc-chat__chat-room-info">
              <span class="pc-chat__chat-room-name">{{ currentRoom.name }}</span>
              <span class="pc-chat__chat-room-members">{{ currentRoom.member_count || 0 }} members</span>
            </div>
          </div>

          <div ref="messagesRef" class="pc-chat__messages">
            <div v-if="messages.length === 0 && !loading" class="pc-chat__empty">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 44c11 0 20-8 20-18S35 8 24 8 4 16 4 26s9 18 20 18z" stroke="currentColor" stroke-width="2"/>
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
                'chat-bubble--error': msg.error,
              }"
            >
              <div class="chat-bubble__header">
                <span class="chat-bubble__username">{{ msg.username }}</span>
                <span class="chat-bubble__time">{{ formatTime(msg.created_at) }}</span>
              </div>
              <div class="chat-bubble__content">{{ msg.content }}</div>
              <div v-if="msg.sending" class="chat-bubble__status">
                <span class="chat-bubble__status-dot" />
                {{ t('chat.sending') }}
              </div>
              <div v-else-if="msg.error" class="chat-bubble__status chat-bubble__status--error" @click="retryMessage(msg)">
                {{ msg.error }} · <span class="chat-bubble__retry">{{ t('chat.retry') || 'Retry' }}</span>
              </div>
            </div>

            <div v-if="loading" class="pc-chat__loading">
              <div class="pc-chat__loading-dot" />
              <div class="pc-chat__loading-dot" />
              <div class="pc-chat__loading-dot" />
            </div>
          </div>

          <div v-if="rateLimitWarning" class="pc-chat__rate-warning">
            {{ rateLimitWarning }}
          </div>

          <div class="pc-chat__input-bar">
            <textarea
              ref="inputRef"
              v-model="inputContent"
              class="pc-chat__input"
              :placeholder="t('chat.placeholder')"
              :disabled="sending || rateLimited"
              rows="1"
              @keydown.enter.exact.prevent="sendMessage"
              @input="autoResizeInput"
            />
            <button
              class="pc-chat__send-btn"
              :disabled="!inputContent.trim() || sending || rateLimited"
              @click="sendMessage"
            >
              <svg v-if="!sending" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 10L17 3L10 17L9 11L3 10Z" fill="currentColor"/>
              </svg>
              <div v-else class="pc-chat__spinner" />
            </button>
          </div>
        </template>

        <div v-else class="pc-chat__no-room">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="12" width="48" height="36" rx="4" stroke="currentColor" stroke-width="2"/>
            <path d="M20 28h24M20 36h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p>{{ t('chat.selectRoom') || 'Select a room to start chatting' }}</p>
        </div>
      </div>

      <!-- Create Room Dialog -->
      <Transition name="gui-ios-fade">
        <div v-if="showCreateRoom" class="pc-chat__dialog-overlay" @click.self="showCreateRoom = false">
          <div class="pc-chat__dialog">
            <h3 class="pc-chat__dialog-title">{{ t('chat.createRoom') }}</h3>
            <input
              v-model="newRoomName"
              type="text"
              class="pc-chat__dialog-input"
              :placeholder="t('chat.roomPlaceholder')"
              maxlength="50"
              @keyup.enter="createRoom"
            />
            <textarea
              v-model="newRoomDescription"
              class="pc-chat__dialog-textarea"
              :placeholder="'Description (optional)'"
              maxlength="200"
              rows="3"
            />
            <div class="pc-chat__dialog-checkbox">
              <input id="room-public" v-model="newRoomPublic" type="checkbox" class="pc-chat__dialog-checkbox-input" />
              <label for="room-public" class="pc-chat__dialog-checkbox-label">Public Room</label>
            </div>
            <div class="pc-chat__dialog-actions">
              <button class="pc-chat__dialog-btn" :disabled="creatingRoom" @click="showCreateRoom = false">{{ t('common.cancel') }}</button>
              <button class="pc-chat__dialog-btn pc-chat__dialog-btn--primary" :disabled="creatingRoom" @click="createRoom">
                <div v-if="creatingRoom" class="pc-chat__dialog-spinner" />
                <span v-else>{{ t('common.create') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Room Settings Dialog -->
      <Transition name="gui-ios-fade">
        <div v-if="showRoomSettings" class="pc-chat__dialog-overlay" @click.self="showRoomSettings = false">
          <div class="pc-chat__dialog pc-chat__dialog--settings">
            <h3 class="pc-chat__dialog-title">Room Settings</h3>
            <div class="pc-chat__dialog-section">
              <input v-model="editRoomName" type="text" class="pc-chat__dialog-input" placeholder="Room name" maxlength="50" />
              <textarea v-model="editRoomDescription" class="pc-chat__dialog-textarea" placeholder="Description" maxlength="200" rows="3" />
              <div class="pc-chat__dialog-checkbox">
                <input id="edit-room-public" v-model="editRoomPublic" type="checkbox" class="pc-chat__dialog-checkbox-input" />
                <label for="edit-room-public" class="pc-chat__dialog-checkbox-label">Public Room</label>
              </div>
            </div>
            <div class="pc-chat__dialog-section">
              <button class="pc-chat__dialog-danger-btn" :disabled="deletingRoom || savingSettings" @click="deleteRoom">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 3.5h9M3.5 3.5v9.5a.5.5 0 00.5.5h8a.5.5 0 00.5-.5V3.5m-10-1a.5.5 0 01.5-.5h10a.5.5 0 01.5.5M7.5 7.5v3M8.5 7.5v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span>Delete Room</span>
              </button>
            </div>
            <div class="pc-chat__dialog-actions">
              <button class="pc-chat__dialog-btn" :disabled="savingSettings || deletingRoom" @click="showRoomSettings = false">Cancel</button>
              <button class="pc-chat__dialog-btn pc-chat__dialog-btn--primary" :disabled="savingSettings || deletingRoom" @click="saveRoomSettings">
                <div v-if="savingSettings" class="pc-chat__dialog-spinner" />
                <span v-else>Save</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Nickname Dialog -->
      <Transition name="gui-ios-fade">
        <div v-if="showNicknameDialog" class="pc-chat__dialog-overlay" @click.self="showNicknameDialog = false">
          <div class="pc-chat__dialog">
            <h3 class="pc-chat__dialog-title">{{ t('chat.setNickname') }}</h3>
            <input
              v-model="newNickname"
              type="text"
              class="pc-chat__dialog-input"
              :placeholder="t('chat.nicknamePlaceholder')"
              maxlength="30"
              @input="onNicknameInput"
              @keyup.enter="saveNickname"
            />
            <div v-if="nicknameCheckStatus === 'taken'" class="pc-chat__dialog-error">Nickname already taken</div>
            <div v-if="nicknameCheckStatus === 'checking'" class="pc-chat__dialog-hint">Checking...</div>
            <div v-if="nicknameCheckStatus === 'available'" class="pc-chat__dialog-success">Available</div>
            <div v-if="nicknameSaveError" class="pc-chat__dialog-error">{{ nicknameSaveError }}</div>
            <div class="pc-chat__dialog-actions">
              <button class="pc-chat__dialog-btn" :disabled="savingNickname" @click="showNicknameDialog = false">{{ t('common.cancel') }}</button>
              <button class="pc-chat__dialog-btn pc-chat__dialog-btn--primary" :disabled="!newNickname.trim() || savingNickname || nicknameCheckStatus === 'taken' || nicknameCheckStatus === 'checking'" @click="saveNickname">
                <div v-if="savingNickname" class="pc-chat__dialog-spinner" />
                <span v-else>{{ t('common.save') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </PCWindow>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import PCWindow from '../../components/PCWindow.vue'
import { useThemeStore } from '../../stores/themeStore'
import { useI18n } from '../../composables/useI18n'
import { useAuthStore } from '../../../stores/authStore'
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
  retryCount?: number
}

interface ChatRoom {
  id: number
  name: string
  description: string
  message_count: number
  created_by: string
  is_public: number
  member_count?: number
  last_message?: string
  last_message_sender?: string
  last_message_time?: string
}

defineProps<Props>()
defineEmits<{ close: [] }>()

const themeStore = useThemeStore()
themeStore.init()

const authStore = useAuthStore()
const { t } = useI18n()

const API_BASE = config.api.workerUrl
const POLL_INTERVAL = 30000
const MAX_MESSAGES = 100
const MAX_RETRY = 3

const messagesRef = ref<HTMLElement>()
const inputRef = ref<HTMLTextAreaElement>()
const inputContent = ref('')
const messages = reactive<ChatMessage[]>([])
const rooms = reactive<ChatRoom[]>([])
const currentRoomId = ref(1)
const loading = ref(false)
const sending = ref(false)
const rateLimitWarning = ref('')
const rateLimited = ref(false)
const loadingRooms = ref(false)
const creatingRoom = ref(false)
const savingSettings = ref(false)
const deletingRoom = ref(false)
const showNicknameDialog = ref(false)
const newNickname = ref('')
const savingNickname = ref(false)
const nicknameCheckStatus = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
const nicknameSaveError = ref('')
let nicknameCheckTimer: number | null = null
let pollTimer: number | null = null
let userId = ''
const roomSearchQuery = ref('')

const showCreateRoom = ref(false)
const newRoomName = ref('')
const newRoomDescription = ref('')
const newRoomPublic = ref(true)

const showRoomSettings = ref(false)
const editRoomName = ref('')
const editRoomDescription = ref('')
const editRoomPublic = ref(true)

const unreadCounts = ref<Record<number, number>>({})

const displayMessages = computed(() => messages)

const filteredRooms = computed(() => {
  const query = roomSearchQuery.value.trim().toLowerCase()
  if (!query) return rooms
  return rooms.filter(r => r.name.toLowerCase().includes(query))
})

const currentRoom = computed(() => rooms.find(r => r.id === currentRoomId.value) || null)

function getUnreadCount(roomId: number): number {
  return unreadCounts.value[roomId] || 0
}

function setUnreadCount(roomId: number, count: number) {
  unreadCounts.value[roomId] = count
}

function markRoomAsRead(roomId: number) {
  setUnreadCount(roomId, 0)
  indexedDBService.saveSetting('chat_unread_counts', unreadCounts.value).catch(() => undefined)
}

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
  userId = authStore.userId || await indexedDBService.getUserId()
  await loadRooms()
  await loadUnreadCounts()
  if (rooms.length > 0) {
    currentRoomId.value = rooms[0].id
    await loadMessages()
  }
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

watch(() => authStore.userId, (newUserId) => {
  if (newUserId) userId = newUserId
})

async function loadUnreadCounts() {
  try {
    const stored = await indexedDBService.loadSetting('chat_unread_counts')
    if (stored) unreadCounts.value = stored
  } catch {}
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
        if (oldRoom && room.message_count > oldRoom.message_count && room.id !== currentRoomId.value) {
          const delta = room.message_count - oldRoom.message_count
          setUnreadCount(room.id, getUnreadCount(room.id) + delta)
        }
        rooms.push(room)
      }
      rooms.sort((a, b) => {
        const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0
        const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0
        return timeB - timeA
      })
    }
  } catch (error) {
    console.error('[Chat] Failed to load rooms:', error)
  } finally {
    loadingRooms.value = false
  }
}

async function createRoom() {
  if (!newRoomName.value.trim()) return
  creatingRoom.value = true
  try {
    const response = await fetch(`${API_BASE}/chat/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newRoomName.value.trim(),
        description: newRoomDescription.value.trim(),
        created_by: userId,
        is_public: newRoomPublic.value ? 1 : 0,
      }),
    })
    const data = await response.json()
    if (data.success) {
      await loadRooms()
      newRoomName.value = ''
      newRoomDescription.value = ''
      newRoomPublic.value = true
      showCreateRoom.value = false
    } else {
      alert(data.error || 'Failed to create room')
    }
  } catch (error) {
    console.error('[Chat] Failed to create room:', error)
    alert('Failed to create room. Please try again.')
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
  const localTempIds = new Set(local.map(m => m.tempId))
  const nonDuplicateLocal = local.filter(m => !serverIds.has(m.id))
  const nonDuplicateServer = server.filter(m => !localTempIds.has(m.tempId))
  const all = [...nonDuplicateServer, ...nonDuplicateLocal]
  return all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

async function sendMessage() {
  const content = inputContent.value.trim()
  if (!content || sending.value || rateLimited.value) return

  const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const now = new Date().toISOString()

  const optimisticMessage: ChatMessage = {
    tempId,
    user_id: userId,
    username: authStore.nickname || t('chat.you'),
    content,
    created_at: now,
    isSelf: true,
    sending: true,
    room_id: currentRoomId.value,
    retryCount: 0,
  }

  messages.push(optimisticMessage)
  inputContent.value = ''
  sending.value = true
  rateLimitWarning.value = ''

  await nextTick()
  scrollToBottom()
  autoResizeInput()

  try {
    const response = await fetch(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        nickname: authStore.nickname || undefined,
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

async function retryMessage(msg: ChatMessage) {
  if (!msg.tempId || !msg.error) return
  if ((msg.retryCount || 0) >= MAX_RETRY) return

  const idx = messages.findIndex(m => m.tempId === msg.tempId)
  if (idx === -1) return

  messages[idx].sending = true
  messages[idx].error = undefined
  messages[idx].retryCount = (msg.retryCount || 0) + 1

  try {
    const response = await fetch(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        nickname: authStore.nickname || undefined,
        content: msg.content,
        room_id: currentRoomId.value,
      }),
    })

    const data = await response.json()
    if (data.success && data.data) {
      messages[idx] = { ...data.data, isSelf: true }
    } else {
      messages[idx].sending = false
      messages[idx].error = data.error || t('chat.failedSend')
    }
  } catch {
    messages[idx].sending = false
    messages[idx].error = t('chat.networkError')
  }
}

function autoResizeInput() {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px'
  }
}

function startPolling() {
  stopPolling()
  pollTimer = window.setInterval(() => {
    loadMessages()
    loadRooms()
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
    messagesRef.value.scrollTo({
      top: messagesRef.value.scrollHeight,
      behavior: 'smooth',
    })
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatRoomTime(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function truncateMessage(message: string, maxLength: number = 20): string {
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength) + '...'
}

function openRoomSettings(room: ChatRoom) {
  currentRoomId.value = room.id
  editRoomName.value = room.name
  editRoomDescription.value = room.description || ''
  editRoomPublic.value = room.is_public === 1
  showRoomSettings.value = true
}

async function saveRoomSettings() {
  if (!currentRoom.value) return
  savingSettings.value = true
  try {
    const roomIndex = rooms.findIndex(r => r.id === currentRoom.value?.id)
    if (roomIndex !== -1) {
      rooms[roomIndex] = {
        ...rooms[roomIndex],
        name: editRoomName.value,
        description: editRoomDescription.value,
        is_public: editRoomPublic.value ? 1 : 0,
      }
    }
    showRoomSettings.value = false
  } catch (error) {
    console.error('[Chat] Failed to save room settings:', error)
  } finally {
    savingSettings.value = false
  }
}

async function deleteRoom() {
  if (!currentRoom.value) return
  if (!confirm('Are you sure you want to delete this room?')) return
  deletingRoom.value = true
  try {
    const roomIndex = rooms.findIndex(r => r.id === currentRoom.value?.id)
    if (roomIndex !== -1) {
      rooms.splice(roomIndex, 1)
      if (currentRoomId.value === currentRoom.value?.id && rooms.length > 0) {
        currentRoomId.value = rooms[0].id
        messages.length = 0
        loadMessages()
      }
    }
    showRoomSettings.value = false
  } catch (error) {
    console.error('[Chat] Failed to delete room:', error)
  } finally {
    deletingRoom.value = false
  }
}

function openNicknameDialog() {
  newNickname.value = authStore.nickname || ''
  nicknameCheckStatus.value = 'idle'
  nicknameSaveError.value = ''
  showNicknameDialog.value = true
}

async function checkNicknameAvailability() {
  const trimmed = newNickname.value.trim()
  if (!trimmed || trimmed === authStore.nickname) {
    nicknameCheckStatus.value = 'idle'
    return
  }
  nicknameCheckStatus.value = 'checking'
  try {
    const result = await authStore.checkNicknameAvailability(trimmed)
    nicknameCheckStatus.value = result.available ? 'available' : 'taken'
  } catch {
    nicknameCheckStatus.value = 'idle'
  }
}

function onNicknameInput() {
  if (nicknameCheckTimer) clearTimeout(nicknameCheckTimer)
  nicknameCheckStatus.value = 'idle'
  nicknameSaveError.value = ''
  nicknameCheckTimer = window.setTimeout(() => {
    checkNicknameAvailability()
  }, 500)
}

async function saveNickname() {
  const trimmed = newNickname.value.trim()
  if (!trimmed) return
  savingNickname.value = true
  nicknameSaveError.value = ''
  try {
    const result = await authStore.updateNickname(trimmed)
    if (result.success) {
      showNicknameDialog.value = false
    } else {
      nicknameSaveError.value = result.error || 'Failed to save nickname'
      if (result.error === 'Nickname already taken') nicknameCheckStatus.value = 'taken'
    }
  } catch {
    nicknameSaveError.value = 'Failed to save nickname'
  } finally {
    savingNickname.value = false
  }
}
</script>

<style scoped>
.pc-chat {
  display: flex;
  height: 100%;
  background: var(--chat-bg, #1C1C1E);
  position: relative;
}

/* ── Sidebar ──────────────────────────────────────────────────────── */
.pc-chat__sidebar {
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  background: var(--chat-surface, #2C2C2E);
  border-right: 0.5px solid var(--chat-border, #38383A);
}

.pc-chat__sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 0.5px solid var(--chat-border, #38383A);
}

.pc-chat__sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--chat-text-primary, #FFFFFF);
  margin: 0;
}

.pc-chat__add-room-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: var(--chat-accent, #007AFF);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;
}

.pc-chat__add-room-btn:hover { opacity: 0.85; }

/* ── Search ───────────────────────────────────────────────────────── */
.pc-chat__search {
  position: relative;
  padding: 8px 12px;
}

.pc-chat__search-icon {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--chat-text-tertiary, #636366);
  pointer-events: none;
}

.pc-chat__search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px 0 36px;
  border-radius: 10px;
  border: none;
  background: var(--chat-bg, #1C1C1E);
  color: var(--chat-text-primary, #FFFFFF);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

.pc-chat__search-input::placeholder {
  color: var(--chat-text-tertiary, #636366);
}

/* ── Room List ─────────────────────────────────────────────────────── */
.pc-chat__room-list {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--chat-border, #38383A) transparent;
}

.pc-chat__room-list::-webkit-scrollbar { width: 4px; }
.pc-chat__room-list::-webkit-scrollbar-track { background: transparent; }
.pc-chat__room-list::-webkit-scrollbar-thumb { background-color: var(--chat-border, #38383A); border-radius: 2px; }

.pc-chat__room-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}

.pc-chat__room-item:hover {
  background: var(--chat-surface-hover, #3A3A3C);
}

.pc-chat__room-item--active {
  background: var(--chat-accent, #007AFF);
}

.pc-chat__room-item--active:hover {
  background: var(--chat-accent, #007AFF);
  opacity: 0.9;
}

.pc-chat__room-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--chat-surface-hover, #3A3A3C);
  color: var(--chat-text-primary, #FFFFFF);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.pc-chat__room-item--active .pc-chat__room-avatar {
  background: rgba(255, 255, 255, 0.2);
}

.pc-chat__room-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pc-chat__room-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pc-chat__room-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--chat-text-primary, #FFFFFF);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-chat__room-item--active .pc-chat__room-name { color: #FFFFFF; }

.pc-chat__room-time {
  font-size: 11px;
  color: var(--chat-text-tertiary, #636366);
  flex-shrink: 0;
}

.pc-chat__room-item--active .pc-chat__room-time { color: rgba(255, 255, 255, 0.7); }

.pc-chat__room-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pc-chat__room-preview {
  font-size: 12px;
  color: var(--chat-text-secondary, #8E8E93);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.pc-chat__room-item--active .pc-chat__room-preview { color: rgba(255, 255, 255, 0.8); }

.pc-chat__room-sender {
  font-weight: 600;
}

.pc-chat__room-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--chat-error, #FF3B30);
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pc-chat__room-settings {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--chat-text-tertiary, #636366);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
}

.pc-chat__room-item:hover .pc-chat__room-settings { opacity: 1; }
.pc-chat__room-settings:hover { background: rgba(255, 255, 255, 0.1); }

.pc-chat__room-loading {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 40px 0;
}

/* ── Nickname Button ──────────────────────────────────────────────── */
.pc-chat__nickname-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--chat-text-secondary, #8E8E93);
  cursor: pointer;
  border-top: 0.5px solid var(--chat-border, #38383A);
  transition: background 0.15s;
  width: 100%;
  text-align: left;
}

.pc-chat__nickname-btn:hover { background: var(--chat-surface-hover, #3A3A3C); }

.pc-chat__nickname-text {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Main Chat Area ───────────────────────────────────────────────── */
.pc-chat__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pc-chat__chat-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--chat-surface, #2C2C2E);
  border-bottom: 0.5px solid var(--chat-border, #38383A);
}

.pc-chat__chat-room-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pc-chat__chat-room-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--chat-text-primary, #FFFFFF);
}

.pc-chat__chat-room-members {
  font-size: 12px;
  color: var(--chat-text-tertiary, #636366);
}

/* ── Messages ─────────────────────────────────────────────────────── */
.pc-chat__messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--chat-border, #38383A) var(--chat-bg, #1C1C1E);
}

.pc-chat__messages::-webkit-scrollbar { width: 8px; }
.pc-chat__messages::-webkit-scrollbar-track { background: var(--chat-bg, #1C1C1E); }
.pc-chat__messages::-webkit-scrollbar-thumb { background-color: var(--chat-border, #38383A); border-radius: 4px; }

.pc-chat__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--chat-text-tertiary, #636366);
  gap: 12px;
}

.pc-chat__empty p { font-size: 14px; margin: 0; }

.chat-bubble {
  margin-bottom: 12px;
  animation: chat-fade-in 200ms ease;
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
  color: var(--chat-text-secondary, #8E8E93);
}

.chat-bubble__time {
  font-size: 10px;
  color: var(--chat-text-tertiary, #636366);
}

.chat-bubble__content {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  background: var(--chat-surface, #2C2C2E);
  color: var(--chat-text-primary, #FFFFFF);
}

.chat-bubble--self .chat-bubble__content {
  background: var(--chat-accent, #007AFF);
  color: #FFFFFF;
  border-bottom-right-radius: 4px;
}

.chat-bubble:not(.chat-bubble--self) .chat-bubble__content {
  border-bottom-left-radius: 4px;
}

.chat-bubble--sending { opacity: 0.7; }

.chat-bubble--error .chat-bubble__content {
  border: 1px solid var(--chat-error, #FF3B30);
}

.chat-bubble__status {
  font-size: 10px;
  color: var(--chat-text-tertiary, #636366);
  margin-top: 2px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.chat-bubble__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--chat-accent, #007AFF);
  animation: chat-pulse 1.5s ease-in-out infinite;
}

.chat-bubble__status--error {
  color: var(--chat-error, #FF3B30);
  cursor: pointer;
}

.chat-bubble__retry {
  text-decoration: underline;
  font-weight: 600;
}

@keyframes chat-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes chat-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* ── Rate Warning ─────────────────────────────────────────────────── */
.pc-chat__rate-warning {
  padding: 8px 12px;
  background: var(--chat-error, #FF3B30);
  color: #FFFFFF;
  font-size: 12px;
  text-align: center;
}

/* ── Loading ──────────────────────────────────────────────────────── */
.pc-chat__loading {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 12px 0;
}

.pc-chat__loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--chat-accent, #007AFF);
  animation: chat-bounce 1.2s ease-in-out infinite;
}

.pc-chat__loading-dot:nth-child(2) { animation-delay: 0.2s; }
.pc-chat__loading-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes chat-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* ── No Room Selected ─────────────────────────────────────────────── */
.pc-chat__no-room {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--chat-text-tertiary, #636366);
  gap: 16px;
}

.pc-chat__no-room p { font-size: 14px; margin: 0; }

/* ── Input Bar ────────────────────────────────────────────────────── */
.pc-chat__input-bar {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background: var(--chat-surface, #2C2C2E);
  border-top: 0.5px solid var(--chat-border, #38383A);
}

.pc-chat__input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 20px;
  border: none;
  background: var(--chat-bg, #1C1C1E);
  color: var(--chat-text-primary, #FFFFFF);
  font-size: 14px;
  outline: none;
  resize: none;
  font-family: inherit;
  line-height: 1.4;
  max-height: 120px;
  min-height: 40px;
  box-sizing: border-box;
}

.pc-chat__input::placeholder {
  color: var(--chat-text-tertiary, #636366);
}

.pc-chat__send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--chat-accent, #007AFF);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  flex-shrink: 0;
}

.pc-chat__send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pc-chat__send-btn:not(:disabled):hover { opacity: 0.9; }
.pc-chat__send-btn:not(:disabled):active { transform: scale(0.95); }

.pc-chat__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Dialogs ──────────────────────────────────────────────────────── */
.pc-chat__dialog-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}

.pc-chat__dialog {
  width: 100%;
  max-width: 320px;
  background: var(--chat-surface, #2C2C2E);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.pc-chat__dialog--settings { max-width: 400px; }

.pc-chat__dialog-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--chat-text-primary, #FFFFFF);
  margin: 0 0 16px;
}

.pc-chat__dialog-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 0.5px solid var(--chat-border, #38383A);
  background: var(--chat-bg, #1C1C1E);
  color: var(--chat-text-primary, #FFFFFF);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 12px;
}

.pc-chat__dialog-textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 0.5px solid var(--chat-border, #38383A);
  background: var(--chat-bg, #1C1C1E);
  color: var(--chat-text-primary, #FFFFFF);
  font-size: 14px;
  outline: none;
  resize: none;
  font-family: inherit;
  box-sizing: border-box;
  margin-bottom: 12px;
}

.pc-chat__dialog-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.pc-chat__dialog-checkbox-input { accent-color: var(--chat-accent, #007AFF); }

.pc-chat__dialog-checkbox-label {
  font-size: 14px;
  color: var(--chat-text-secondary, #8E8E93);
}

.pc-chat__dialog-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 0.5px solid var(--chat-border, #38383A);
}

.pc-chat__dialog-danger-btn {
  width: 100%;
  height: 40px;
  border-radius: 10px;
  border: 0.5px solid var(--chat-error, #FF3B30);
  background: transparent;
  color: var(--chat-error, #FF3B30);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s;
}

.pc-chat__dialog-danger-btn:hover { background: rgba(255, 59, 48, 0.1); }

.pc-chat__dialog-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.pc-chat__dialog-btn {
  flex: 1;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: var(--chat-surface-hover, #3A3A3C);
  color: var(--chat-text-primary, #FFFFFF);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.pc-chat__dialog-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.pc-chat__dialog-btn--primary { background: var(--chat-accent, #007AFF); }

.pc-chat__dialog-error {
  font-size: 12px;
  color: var(--chat-error, #FF3B30);
  margin-bottom: 8px;
}

.pc-chat__dialog-hint {
  font-size: 12px;
  color: var(--chat-text-tertiary, #636366);
  margin-bottom: 8px;
}

.pc-chat__dialog-success {
  font-size: 12px;
  color: #34C759;
  margin-bottom: 8px;
}

.pc-chat__dialog-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

/* ── Transitions ──────────────────────────────────────────────────── */
.gui-ios-fade-enter-active,
.gui-ios-fade-leave-active {
  transition: opacity 0.2s ease;
}

.gui-ios-fade-enter-from,
.gui-ios-fade-leave-to {
  opacity: 0;
}

/* ── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .pc-chat__sidebar {
    width: 240px;
    min-width: 240px;
  }
}
</style>