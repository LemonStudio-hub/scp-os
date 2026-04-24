<template>
  <MobileWindow
    :visible="visible"
    :title="view === 'rooms' ? t('chat.title') : currentRoom?.name || ''"
    :show-back="view === 'chat'"
    @close="$emit('close')"
    @back="view = 'rooms'"
  >
    <div class="mobile-chat" :style="chatThemeStyles">

      <!-- View: Room List -->
      <div v-if="view === 'rooms'" class="mobile-chat__rooms-view">
        <div class="mobile-chat__search-bar">
          <svg class="mobile-chat__search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input
            v-model="roomSearchQuery"
            type="text"
            class="mobile-chat__search-input"
            :placeholder="t('chat.searchRooms') || 'Search rooms...'"
          />
        </div>

        <div class="mobile-chat__room-list">
          <div v-if="loadingRooms" class="mobile-chat__loading">
            <div class="mobile-chat__loading-dot" />
            <div class="mobile-chat__loading-dot" />
            <div class="mobile-chat__loading-dot" />
          </div>

          <template v-else>
            <div
              v-for="room in filteredRooms"
              :key="room.id"
              class="mobile-chat__room-item"
              @click="enterRoom(room.id)"
            >
              <div class="mobile-chat__room-avatar">{{ room.name.charAt(0).toUpperCase() }}</div>
              <div class="mobile-chat__room-body">
                <div class="mobile-chat__room-top">
                  <span class="mobile-chat__room-name">{{ room.name }}</span>
                  <span class="mobile-chat__room-time">{{ formatRoomTime(room.last_message_time) }}</span>
                </div>
                <div class="mobile-chat__room-bottom">
                  <span class="mobile-chat__room-preview">
                    <template v-if="room.last_message">
                      <span class="mobile-chat__room-sender">{{ room.last_message_sender }}: </span>
                      {{ truncateMessage(room.last_message) }}
                    </template>
                    <template v-else>{{ t('chat.emptyState') }}</template>
                  </span>
                  <span v-if="getUnreadCount(room.id) > 0" class="mobile-chat__room-badge">{{ getUnreadCount(room.id) }}</span>
                </div>
              </div>
            </div>

            <button class="mobile-chat__add-room-btn" @click="showCreateRoom = true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>{{ t('chat.createRoom') }}</span>
            </button>
          </template>
        </div>

        <button class="mobile-chat__nickname-btn" @click="openNicknameDialog">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="6" r="4" stroke="currentColor" stroke-width="1.3"/>
            <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <span>{{ authStore.nickname || t('chat.setNickname') }}</span>
        </button>
      </div>

      <!-- View: Chat -->
      <div v-else class="mobile-chat__chat-view">
        <div ref="messagesRef" class="mobile-chat__messages">
          <div v-if="messages.length === 0 && !loading" class="mobile-chat__empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 44c11 0 20-8 20-18S35 8 24 8 4 16 4 26s9 18 20 18z" stroke="currentColor" stroke-width="2"/>
              <circle cx="16" cy="24" r="2" fill="currentColor"/>
              <circle cx="24" cy="24" r="2" fill="currentColor"/>
              <circle cx="32" cy="24" r="2" fill="currentColor"/>
            </svg>
            <p>{{ t('chat.emptyState') }}</p>
          </div>

          <div
            v-for="msg in messages"
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

          <div v-if="loading" class="mobile-chat__loading">
            <div class="mobile-chat__loading-dot" />
            <div class="mobile-chat__loading-dot" />
            <div class="mobile-chat__loading-dot" />
          </div>
        </div>

        <div v-if="rateLimitWarning" class="mobile-chat__rate-warning">
          {{ rateLimitWarning }}
        </div>

        <div class="mobile-chat__input-bar">
          <textarea
            ref="inputRef"
            v-model="inputContent"
            class="mobile-chat__input"
            :placeholder="t('chat.placeholder')"
            :disabled="sending || rateLimited"
            rows="1"
            @keydown.enter.exact.prevent="sendMessage"
            @input="autoResizeInput"
          />
          <button
            class="mobile-chat__send-btn"
            :disabled="!inputContent.trim() || sending || rateLimited"
            @click="sendMessage"
          >
            <svg v-if="!sending" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 10L17 3L10 17L9 11L3 10Z" fill="currentColor"/>
            </svg>
            <div v-else class="mobile-chat__spinner" />
          </button>
        </div>
      </div>

      <!-- Create Room Dialog -->
      <Transition name="mobile-fade">
        <div v-if="showCreateRoom" class="mobile-chat__dialog-overlay" @click.self="showCreateRoom = false">
          <div class="mobile-chat__dialog">
            <h3 class="mobile-chat__dialog-title">{{ t('chat.createRoom') }}</h3>
            <input v-model="newRoomName" type="text" class="mobile-chat__dialog-input" :placeholder="t('chat.roomPlaceholder')" maxlength="50" />
            <textarea v-model="newRoomDescription" class="mobile-chat__dialog-textarea" placeholder="Description (optional)" maxlength="200" rows="3" />
            <div class="mobile-chat__dialog-actions">
              <button class="mobile-chat__dialog-btn" @click="showCreateRoom = false">{{ t('common.cancel') }}</button>
              <button class="mobile-chat__dialog-btn mobile-chat__dialog-btn--primary" :disabled="creatingRoom" @click="createRoom">
                <div v-if="creatingRoom" class="mobile-chat__dialog-spinner" />
                <span v-else>{{ t('common.create') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Nickname Dialog -->
      <Transition name="mobile-fade">
        <div v-if="showNicknameDialog" class="mobile-chat__dialog-overlay" @click.self="showNicknameDialog = false">
          <div class="mobile-chat__dialog">
            <h3 class="mobile-chat__dialog-title">{{ t('chat.setNickname') }}</h3>
            <input v-model="newNickname" type="text" class="mobile-chat__dialog-input" :placeholder="t('chat.nicknamePlaceholder')" maxlength="30" @input="onNicknameInput" @keyup.enter="saveNickname" />
            <div v-if="nicknameCheckStatus === 'taken'" class="mobile-chat__dialog-error">Nickname already taken</div>
            <div v-if="nicknameCheckStatus === 'checking'" class="mobile-chat__dialog-hint">Checking...</div>
            <div v-if="nicknameCheckStatus === 'available'" class="mobile-chat__dialog-success">Available</div>
            <div v-if="nicknameSaveError" class="mobile-chat__dialog-error">{{ nicknameSaveError }}</div>
            <div class="mobile-chat__dialog-actions">
              <button class="mobile-chat__dialog-btn" :disabled="savingNickname" @click="showNicknameDialog = false">{{ t('common.cancel') }}</button>
              <button class="mobile-chat__dialog-btn mobile-chat__dialog-btn--primary" :disabled="!newNickname.trim() || savingNickname || nicknameCheckStatus === 'taken' || nicknameCheckStatus === 'checking'" @click="saveNickname">
                <div v-if="savingNickname" class="mobile-chat__dialog-spinner" />
                <span v-else>{{ t('common.save') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
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

const view = ref<'rooms' | 'chat'>('rooms')
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

const unreadCounts = ref<Record<number, number>>({})

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
  indexedDBService.saveSetting('chat_unread_counts', unreadCounts.value).catch(() => {})
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
        is_public: 1,
      }),
    })
    const data = await response.json()
    if (data.success) {
      await loadRooms()
      newRoomName.value = ''
      newRoomDescription.value = ''
      showCreateRoom.value = false
    } else {
      alert(data.error || 'Failed to create room')
    }
  } catch (error) {
    console.error('[Chat] Failed to create room:', error)
  } finally {
    creatingRoom.value = false
  }
}

function enterRoom(roomId: number) {
  currentRoomId.value = roomId
  messages.length = 0
  markRoomAsRead(roomId)
  view.value = 'chat'
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
        messages[idx] = { ...data.data, isSelf: true }
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
  } catch (error) {
    messages[idx].sending = false
    messages[idx].error = t('chat.networkError')
  }
}

function autoResizeInput() {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 100) + 'px'
  }
}

function startPolling() {
  stopPolling()
  pollTimer = window.setInterval(() => {
    if (view.value === 'chat') loadMessages()
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
.mobile-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--chat-bg, #1C1C1E);
  position: relative;
}

/* ── Rooms View ────────────────────────────────────────────────────── */
.mobile-chat__rooms-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mobile-chat__search-bar {
  position: relative;
  padding: 8px 12px;
  background: var(--chat-surface, #2C2C2E);
  border-bottom: 0.5px solid var(--chat-border, #38383A);
}

.mobile-chat__search-icon {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--chat-text-tertiary, #636366);
  pointer-events: none;
}

.mobile-chat__search-input {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 36px;
  border-radius: 10px;
  border: none;
  background: var(--chat-bg, #1C1C1E);
  color: var(--chat-text-primary, #FFFFFF);
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
}

.mobile-chat__search-input::placeholder { color: var(--chat-text-tertiary, #636366); }

/* ── Room List ─────────────────────────────────────────────────────── */
.mobile-chat__room-list {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--chat-border, #38383A) transparent;
  -webkit-overflow-scrolling: touch;
}

.mobile-chat__room-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;
  min-height: 72px;
}

.mobile-chat__room-item:active { background: var(--chat-surface-hover, #3A3A3C); }

.mobile-chat__room-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--chat-surface-hover, #3A3A3C);
  color: var(--chat-text-primary, #FFFFFF);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
}

.mobile-chat__room-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mobile-chat__room-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mobile-chat__room-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--chat-text-primary, #FFFFFF);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-chat__room-time {
  font-size: 12px;
  color: var(--chat-text-tertiary, #636366);
  flex-shrink: 0;
}

.mobile-chat__room-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mobile-chat__room-preview {
  font-size: 14px;
  color: var(--chat-text-secondary, #8E8E93);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.mobile-chat__room-sender { font-weight: 600; }

.mobile-chat__room-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--chat-error, #FF3B30);
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mobile-chat__add-room-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: calc(100% - 32px);
  margin: 12px 16px;
  padding: 14px;
  border-radius: 12px;
  border: 1px dashed var(--chat-border, #38383A);
  background: transparent;
  color: var(--chat-text-secondary, #8E8E93);
  font-size: 15px;
  cursor: pointer;
  transition: background 0.15s;
  min-height: 48px;
}

.mobile-chat__add-room-btn:active { background: var(--chat-surface-hover, #3A3A3C); }

.mobile-chat__nickname-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border: none;
  background: transparent;
  color: var(--chat-text-secondary, #8E8E93);
  cursor: pointer;
  border-top: 0.5px solid var(--chat-border, #38383A);
  width: 100%;
  text-align: left;
  font-size: 14px;
  min-height: 48px;
}

.mobile-chat__nickname-btn:active { background: var(--chat-surface-hover, #3A3A3C); }

/* ── Chat View ─────────────────────────────────────────────────────── */
.mobile-chat__chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mobile-chat__messages {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--chat-border, #38383A) var(--chat-bg, #1C1C1E);
  -webkit-overflow-scrolling: touch;
}

.mobile-chat__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--chat-text-tertiary, #636366);
  gap: 12px;
}

.mobile-chat__empty p { font-size: 15px; margin: 0; }

/* ── Chat Bubbles ──────────────────────────────────────────────────── */
.chat-bubble {
  margin-bottom: 10px;
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
  gap: 6px;
  margin-bottom: 3px;
  padding: 0 4px;
}

.chat-bubble__username {
  font-size: 12px;
  font-weight: 600;
  color: var(--chat-text-secondary, #8E8E93);
}

.chat-bubble__time {
  font-size: 11px;
  color: var(--chat-text-tertiary, #636366);
}

.chat-bubble__content {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 15px;
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
  font-size: 11px;
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

/* ── Rate Warning ──────────────────────────────────────────────────── */
.mobile-chat__rate-warning {
  padding: 8px 12px;
  background: var(--chat-error, #FF3B30);
  color: #FFFFFF;
  font-size: 13px;
  text-align: center;
}

/* ── Loading ───────────────────────────────────────────────────────── */
.mobile-chat__loading {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 20px 0;
}

.mobile-chat__loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--chat-accent, #007AFF);
  animation: chat-bounce 1.2s ease-in-out infinite;
}

.mobile-chat__loading-dot:nth-child(2) { animation-delay: 0.2s; }
.mobile-chat__loading-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes chat-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* ── Input Bar ─────────────────────────────────────────────────────── */
.mobile-chat__input-bar {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px;
  background: var(--chat-surface, #2C2C2E);
  border-top: 0.5px solid var(--chat-border, #38383A);
  padding-bottom: max(10px, env(safe-area-inset-bottom));
}

.mobile-chat__input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 20px;
  border: none;
  background: var(--chat-bg, #1C1C1E);
  color: var(--chat-text-primary, #FFFFFF);
  font-size: 16px;
  outline: none;
  resize: none;
  font-family: inherit;
  line-height: 1.4;
  max-height: 100px;
  min-height: 44px;
  box-sizing: border-box;
}

.mobile-chat__input::placeholder { color: var(--chat-text-tertiary, #636366); }

.mobile-chat__send-btn {
  width: 44px;
  height: 44px;
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

.mobile-chat__send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.mobile-chat__send-btn:not(:disabled):active { transform: scale(0.95); }

.mobile-chat__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Dialogs ───────────────────────────────────────────────────────── */
.mobile-chat__dialog-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}

.mobile-chat__dialog {
  width: 100%;
  max-width: 320px;
  background: var(--chat-surface, #2C2C2E);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.mobile-chat__dialog-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--chat-text-primary, #FFFFFF);
  margin: 0 0 16px;
}

.mobile-chat__dialog-input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  border: 0.5px solid var(--chat-border, #38383A);
  background: var(--chat-bg, #1C1C1E);
  color: var(--chat-text-primary, #FFFFFF);
  font-size: 16px;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 12px;
}

.mobile-chat__dialog-textarea {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 0.5px solid var(--chat-border, #38383A);
  background: var(--chat-bg, #1C1C1E);
  color: var(--chat-text-primary, #FFFFFF);
  font-size: 16px;
  outline: none;
  resize: none;
  font-family: inherit;
  box-sizing: border-box;
  margin-bottom: 12px;
}

.mobile-chat__dialog-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.mobile-chat__dialog-btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: none;
  background: var(--chat-surface-hover, #3A3A3C);
  color: var(--chat-text-primary, #FFFFFF);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.mobile-chat__dialog-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mobile-chat__dialog-btn--primary { background: var(--chat-accent, #007AFF); }

.mobile-chat__dialog-error {
  font-size: 13px;
  color: var(--chat-error, #FF3B30);
  margin-bottom: 8px;
}

.mobile-chat__dialog-hint {
  font-size: 13px;
  color: var(--chat-text-tertiary, #636366);
  margin-bottom: 8px;
}

.mobile-chat__dialog-success {
  font-size: 13px;
  color: #34C759;
  margin-bottom: 8px;
}

.mobile-chat__dialog-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

/* ── Transitions ───────────────────────────────────────────────────── */
.mobile-fade-enter-active,
.mobile-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mobile-fade-enter-from,
.mobile-fade-leave-to {
  opacity: 0;
}
</style>