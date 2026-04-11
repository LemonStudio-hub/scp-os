<template>
  <PCWindow
    :visible="visible"
    :title="t('chat.title')"
    @close="$emit('close')"
  >
    <div class="pc-chat-app" :class="{ 'k-ios-page--dark': themeStore.currentTheme.isDark }" :style="chatThemeStyles">
      <!-- Room Selector -->
      <div class="pc-chat-app__room-selector">
        <div class="pc-chat-app__rooms">
          <div
            v-for="room in rooms"
            :key="room.id"
            class="pc-chat-app__room-tab"
            :class="{ 'pc-chat-app__room-tab--active': currentRoomId === room.id }"
            @click="switchRoom(room.id)"
          >
            <div class="pc-chat-app__room-info">
              <div class="pc-chat-app__room-header">
                <span class="pc-chat-app__room-label">{{ room.name }}</span>
                <div class="pc-chat-app__room-actions">
                  <button 
                    v-if="room.created_by === userId"
                    class="pc-chat-app__room-setting-btn"
                    :title="'Room Settings'"
                    @click.stop="openRoomSettings(room)"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M12.25 1.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.25.25 0 0 0 .25-.25v-1.5a.25.25 0 0 0-.25-.25h-1.5a.25.25 0 0 0-.25.25v1.5a.25.25 0 0 0 .25.25h1.5zm-10 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.25.25 0 0 0 .25-.25v-1.5a.25.25 0 0 0-.25-.25h-1.5a.25.25 0 0 0-.25.25v1.5a.25.25 0 0 0 .25.25h1.5zm9.5 9.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.25.25 0 0 0 .25-.25v-1.5a.25.25 0 0 0-.25-.25h-1.5a.25.25 0 0 0-.25.25v1.5a.25.25 0 0 0 .25.25h1.5zm-10 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.25.25 0 0 0 .25-.25v-1.5a.25.25 0 0 0-.25-.25h-1.5a.25.25 0 0 0-.25.25v1.5a.25.25 0 0 0 .25.25h1.5zM7.5 12.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.25.25 0 0 0 .25-.25v-1.5a.25.25 0 0 0-.25-.25h-1.5a.25.25 0 0 0-.25.25v1.5a.25.25 0 0 0 .25.25h1.5zM7.5 1.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.25.25 0 0 0 .25-.25v-1.5a.25.25 0 0 0-.25-.25h-1.5a.25.25 0 0 0-.25.25v1.5a.25.25 0 0 0 .25.25h1.5zM12.25 7.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-10a.75.75 0 0 1 0-1.5h10a.25.25 0 0 0 .25-.25v-1.5a.25.25 0 0 0-.25-.25h-10a.25.25 0 0 0-.25.25v1.5a.25.25 0 0 0 .25.25h10z" fill="currentColor"/>
                    </svg>
                  </button>
                  <span v-if="getUnreadCount(room.id) > 0" class="pc-chat-app__room-badge">{{ getUnreadCount(room.id) }}</span>
                </div>
              </div>
              <div class="pc-chat-app__room-details">
                <span class="pc-chat-app__room-member-count">{{ room.member_count || 0 }} members</span>
                <span v-if="room.last_message" class="pc-chat-app__room-last-message">
                  {{ room.last_message_sender }}: {{ truncateMessage(room.last_message) }}
                </span>
                <span v-else class="pc-chat-app__room-last-message pc-chat-app__room-last-message--empty">
                  No messages yet
                </span>
              </div>
            </div>
          </div>
          <button class="pc-chat-app__room-tab pc-chat-app__room-tab--add" @click="showCreateRoom = true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Messages List -->
      <div ref="messagesRef" class="pc-chat-app__messages gui-scrollable">
        <div v-if="messages.length === 0 && !loading" class="pc-chat-app__empty">
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
        <div v-if="loading" class="pc-chat-app__loading">
          <div class="pc-chat-app__loading-dot" />
          <div class="pc-chat-app__loading-dot" />
          <div class="pc-chat-app__loading-dot" />
        </div>
      </div>

      <!-- Rate Limit Warning -->
      <div v-if="rateLimitWarning" class="pc-chat-app__rate-warning">
        {{ rateLimitWarning }}
      </div>

      <!-- Input Bar -->
      <div class="pc-chat-app__input-bar">
        <input
          v-model="inputContent"
          type="text"
          class="pc-chat-app__input"
          :placeholder="t('chat.placeholder')"
          :disabled="sending || rateLimited"
          @keyup.enter="sendMessage"
        />
        <button
          class="pc-chat-app__send-btn"
          :disabled="!inputContent.trim() || sending || rateLimited"
          @click="sendMessage"
        >
          <svg v-if="!sending" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 10L17 3L10 17L9 11L3 10Z" fill="currentColor"/>
          </svg>
          <div v-else class="pc-chat-app__spinner" />
        </button>
      </div>

      <!-- Create Room Dialog -->
      <Transition name="gui-ios-fade">
        <div v-if="showCreateRoom" class="pc-chat-app__dialog-overlay" @click.self="showCreateRoom = false">
          <div class="pc-chat-app__dialog">
            <h3 class="pc-chat-app__dialog-title">{{ t('chat.createRoom') }}</h3>
            <input
              v-model="newRoomName"
              type="text"
              class="pc-chat-app__dialog-input"
              :placeholder="t('chat.roomPlaceholder')"
              maxlength="50"
              @keyup.enter="createRoom"
            />
            <textarea
              v-model="newRoomDescription"
              class="pc-chat-app__dialog-textarea"
              :placeholder="'Description (optional)'"
              maxlength="200"
              rows="3"
            />
            <div class="pc-chat-app__dialog-checkbox">
              <input
                id="room-public"
                v-model="newRoomPublic"
                type="checkbox"
                class="pc-chat-app__dialog-checkbox-input"
              />
              <label for="room-public" class="pc-chat-app__dialog-checkbox-label">
                Public Room (visible to all users)
              </label>
            </div>
            <div class="pc-chat-app__dialog-actions">
              <button class="pc-chat-app__dialog-btn" :disabled="creatingRoom" @click="showCreateRoom = false">{{ t('common.cancel') }}</button>
              <button class="pc-chat-app__dialog-btn pc-chat-app__dialog-btn--primary" :disabled="creatingRoom" @click="createRoom">
                <div v-if="creatingRoom" class="pc-chat-app__dialog-spinner" />
                <span v-else>{{ t('common.create') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Room Settings Dialog -->
      <Transition name="gui-ios-fade">
        <div v-if="showRoomSettings" class="pc-chat-app__dialog-overlay" @click.self="showRoomSettings = false">
          <div class="pc-chat-app__dialog pc-chat-app__dialog--settings">
            <h3 class="pc-chat-app__dialog-title">Room Settings</h3>
            <div class="pc-chat-app__dialog-section">
              <h4 class="pc-chat-app__dialog-section-title">Room Information</h4>
              <input
                v-model="editRoomName"
                type="text"
                class="pc-chat-app__dialog-input"
                placeholder="Room name"
                maxlength="50"
              />
              <textarea
                v-model="editRoomDescription"
                class="pc-chat-app__dialog-textarea"
                placeholder="Description (optional)"
                maxlength="200"
                rows="3"
              />
              <div class="pc-chat-app__dialog-checkbox">
                <input
                  id="edit-room-public"
                  v-model="editRoomPublic"
                  type="checkbox"
                  class="pc-chat-app__dialog-checkbox-input"
                />
                <label for="edit-room-public" class="pc-chat-app__dialog-checkbox-label">
                  Public Room (visible to all users)
                </label>
              </div>
            </div>
            <div class="pc-chat-app__dialog-section">
              <h4 class="pc-chat-app__dialog-section-title">Room Management</h4>
              <button class="pc-chat-app__dialog-danger-btn" :disabled="deletingRoom || savingSettings" @click="deleteRoom">
                <div v-if="deletingRoom" class="pc-chat-app__dialog-spinner pc-chat-app__dialog-spinner--small" />
                <svg v-if="!deletingRoom" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 3.5h9M3.5 3.5v9.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V3.5m-10-1a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5M5.5 3.5v-.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v.5M7.5 7.5v3M8.5 7.5v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span v-if="!deletingRoom">Delete Room</span>
              </button>
            </div>
            <div class="pc-chat-app__dialog-actions">
              <button class="pc-chat-app__dialog-btn" :disabled="savingSettings || deletingRoom" @click="showRoomSettings = false">Cancel</button>
              <button class="pc-chat-app__dialog-btn pc-chat-app__dialog-btn--primary" :disabled="savingSettings || deletingRoom" @click="saveRoomSettings">
                <div v-if="savingSettings" class="pc-chat-app__dialog-spinner" />
                <span v-else>Save Changes</span>
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

defineEmits<{
  close: []
}>()

const themeStore = useThemeStore()
themeStore.init()

const authStore = useAuthStore()
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
const sending = ref(false)
const rateLimitWarning = ref('')
const rateLimited = ref(false)
const loadingRooms = ref(false)
const creatingRoom = ref(false)
const savingSettings = ref(false)
const deletingRoom = ref(false)
let pollTimer: number | null = null
let userId = ''

// Dialogs
const showCreateRoom = ref(false)
const newRoomName = ref('')
const newRoomDescription = ref('')
const newRoomPublic = ref(true)

// Room settings
const showRoomSettings = ref(false)
const currentRoom = ref<ChatRoom | null>(null)
const editRoomName = ref('')
const editRoomDescription = ref('')
const editRoomPublic = ref(true)

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
  userId = authStore.userId || await indexedDBService.getUserId()
  await loadRooms()
  await loadUnreadCounts()
  await loadMessages()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

// 监听 authStore 的 userId 变化
watch(() => authStore.userId, (newUserId) => {
  if (newUserId) {
    userId = newUserId
  }
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
      // 显示错误信息
      if (data.error === 'You can create at most 5 chat rooms') {
        alert('You can create at most 5 chat rooms')
      } else {
        alert(data.error || 'Failed to create room')
      }
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
    username: authStore.nickname || t('chat.you'),
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

// Room settings functions
function openRoomSettings(room: ChatRoom) {
  currentRoom.value = room
  editRoomName.value = room.name
  editRoomDescription.value = room.description || ''
  editRoomPublic.value = room.is_public === 1
  showRoomSettings.value = true
}

async function saveRoomSettings() {
  if (!currentRoom.value) return

  savingSettings.value = true
  try {
    // In a real implementation, this would call an API to update the room
    // For now, we'll just update the local state
    const roomIndex = rooms.findIndex(r => r.id === currentRoom.value?.id)
    if (roomIndex !== -1) {
      rooms[roomIndex] = {
        ...rooms[roomIndex],
        name: editRoomName.value,
        description: editRoomDescription.value,
        is_public: editRoomPublic.value ? 1 : 0
      }
    }
    showRoomSettings.value = false
  } catch (error) {
    console.error('[Chat] Failed to save room settings:', error)
    alert('Failed to save room settings. Please try again.')
  } finally {
    savingSettings.value = false
  }
}

async function deleteRoom() {
  if (!currentRoom.value) return

  if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
    return
  }

  deletingRoom.value = true
  try {
    // In a real implementation, this would call an API to delete the room
    // For now, we'll just remove it from the local state
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
    alert('Failed to delete room. Please try again.')
  } finally {
    deletingRoom.value = false
  }
}
</script>

<style scoped>
.pc-chat-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--chat-bg, var(--gui-bg-base, #1C1C1E));
}

/* Room Selector */
.pc-chat-app__room-selector {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--chat-surface, var(--gui-bg-surface, #2C2C2E));
  border-bottom: 0.5px solid var(--chat-border, var(--gui-border-subtle, #38383A));
  gap: 8px;
  max-height: 120px;
  overflow-y: auto;
}

.pc-chat-app__rooms {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}

.pc-chat-app__rooms::-webkit-scrollbar {
  width: 6px;
}

.pc-chat-app__rooms::-webkit-scrollbar-track {
  background: var(--chat-surface, var(--gui-bg-surface, #2C2C2E));
}

.pc-chat-app__rooms::-webkit-scrollbar-thumb {
  background-color: var(--chat-border, var(--gui-border-subtle, #38383A));
  border-radius: 3px;
}

.pc-chat-app__room-tab {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: var(--chat-text-secondary, var(--gui-text-secondary, #8E8E93));
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background 150ms ease, color 150ms ease, transform 100ms ease;
  -webkit-tap-highlight-color: transparent;
  min-height: 60px;
}

.pc-chat-app__room-tab:hover {
  background: var(--chat-surface-hover, var(--gui-bg-surface-hover, #3A3A3C));
}

.pc-chat-app__room-tab:active {
  transform: scale(0.98);
}

.pc-chat-app__room-tab--active {
  background: var(--chat-accent, #007AFF);
  color: #FFFFFF;
}

.pc-chat-app__room-tab--add {
  min-height: 60px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pc-chat-app__room-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.pc-chat-app__room-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pc-chat-app__room-label {
  font-size: 14px;
  font-weight: 600;
  color: inherit;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-chat-app__room-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pc-chat-app__room-setting-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 150ms ease;
  flex-shrink: 0;
}

.pc-chat-app__room-setting-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.pc-chat-app__room-badge {
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
  flex-shrink: 0;
}

.pc-chat-app__room-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: var(--chat-text-tertiary, var(--gui-text-tertiary, #636366));
}

.pc-chat-app__room-tab--active .pc-chat-app__room-details {
  color: rgba(255, 255, 255, 0.7);
}

.pc-chat-app__room-member-count {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pc-chat-app__room-last-message {
  font-size: 11px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-chat-app__room-last-message--empty {
  font-style: italic;
  opacity: 0.6;
}

/* Messages */
.pc-chat-app__messages {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--chat-border, var(--gui-border-subtle, #38383A)) var(--chat-surface, var(--gui-bg-surface, #2C2C2E));
}

.pc-chat-app__messages::-webkit-scrollbar {
  width: 8px;
}

.pc-chat-app__messages::-webkit-scrollbar-track {
  background: var(--chat-surface, var(--gui-bg-surface, #2C2C2E));
}

.pc-chat-app__messages::-webkit-scrollbar-thumb {
  background-color: var(--chat-border, var(--gui-border-subtle, #38383A));
  border-radius: 4px;
}

.pc-chat-app__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--chat-text-tertiary, var(--gui-text-tertiary, #636366));
  gap: 12px;
}

.pc-chat-app__empty p {
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
.pc-chat-app__rate-warning {
  padding: 8px 12px;
  background: var(--chat-error, #FF3B30);
  color: #FFFFFF;
  font-size: 12px;
  text-align: center;
}

/* Loading */
.pc-chat-app__loading {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 12px 0;
}

.pc-chat-app__loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--chat-accent, #007AFF);
  animation: ios-bounce 1.2s ease-in-out infinite;
}

.pc-chat-app__loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.pc-chat-app__loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* Input Bar */
.pc-chat-app__input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--chat-surface, var(--gui-bg-surface, #2C2C2E));
  border-top: 0.5px solid var(--chat-border, var(--gui-border-subtle, #38383A));
}

.pc-chat-app__input {
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

.pc-chat-app__input::placeholder {
  color: var(--chat-text-tertiary, var(--gui-text-tertiary, #636366));
}

.pc-chat-app__send-btn {
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

.pc-chat-app__send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pc-chat-app__send-btn:not(:disabled):hover {
  opacity: 0.9;
}

.pc-chat-app__send-btn:not(:disabled):active {
  transform: scale(0.95);
}

.pc-chat-app__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Dialogs */
.pc-chat-app__dialog-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}

.pc-chat-app__dialog {
  width: 100%;
  max-width: 300px;
  background: var(--chat-surface, var(--gui-bg-surface, #2C2C2E));
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.pc-chat-app__dialog--settings {
  max-width: 400px;
}

.pc-chat-app__dialog-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 0.5px solid var(--chat-border, var(--gui-border-subtle, #38383A));
}

.pc-chat-app__dialog-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.pc-chat-app__dialog-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--chat-text-primary, var(--gui-text-primary, #FFFFFF));
  margin: 0 0 12px 0;
}

.pc-chat-app__dialog-danger-btn {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  border: 0.5px solid var(--chat-error, #FF3B30);
  background: transparent;
  color: var(--chat-error, #FF3B30);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pc-chat-app__dialog-danger-btn:hover {
  background: var(--chat-error, #FF3B30);
  color: #FFFFFF;
}

.pc-chat-app__dialog-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

.pc-chat-app__dialog-spinner--small {
  width: 12px;
  height: 12px;
  border-width: 1.5px;
}

.pc-chat-app__dialog-title {
  margin: 0 0 16px;
  font-size: 17px;
  font-weight: 600;
  color: var(--chat-text-primary, var(--gui-text-primary, #FFFFFF));
  text-align: center;
}

.pc-chat-app__dialog-input {
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

.pc-chat-app__dialog-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border-radius: 8px;
  border: 0.5px solid var(--chat-border, var(--gui-border-subtle, #38383A));
  background: var(--chat-surface-hover, var(--gui-bg-surface-hover, #3A3A3C));
  color: var(--chat-text-primary, var(--gui-text-primary, #FFFFFF));
  font-size: 14px;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  resize: vertical;
  margin-bottom: 12px;
}

.pc-chat-app__dialog-textarea::placeholder {
  color: var(--chat-text-tertiary, var(--gui-text-tertiary, #636366));
}

.pc-chat-app__dialog-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.pc-chat-app__dialog-checkbox-input {
  width: 16px;
  height: 16px;
  accent-color: var(--chat-accent, #007AFF);
}

.pc-chat-app__dialog-checkbox-label {
  font-size: 14px;
  color: var(--chat-text-primary, var(--gui-text-primary, #FFFFFF));
  cursor: pointer;
}

.pc-chat-app__dialog-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.pc-chat-app__dialog-btn {
  flex: 1;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: var(--chat-surface-hover, var(--gui-bg-surface-hover, #3A3A3C));
  color: var(--chat-text-primary, var(--gui-text-primary, #FFFFFF));
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms ease;
}

.pc-chat-app__dialog-btn:hover {
  background: var(--chat-border, var(--gui-border-subtle, #38383A));
}

.pc-chat-app__dialog-btn--primary {
  background: var(--chat-accent, #007AFF);
  color: #FFFFFF;
}

.pc-chat-app__dialog-btn--primary:hover {
  background: #0056b3;
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