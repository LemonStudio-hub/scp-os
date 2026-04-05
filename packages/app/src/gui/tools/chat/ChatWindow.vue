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
          <button
            v-for="room in rooms"
            :key="room.id"
            class="chat-app__room-tab"
            :class="{ 'chat-app__room-tab--active': currentRoomId === room.id }"
            @click="switchRoom(room.id)"
          >
            <span class="chat-app__room-label">{{ room.name }}</span>
            <span v-if="getUnreadCount(room.id) > 0" class="chat-app__room-badge">{{ getUnreadCount(room.id) }}</span>
          </button>
          <button class="chat-app__room-tab chat-app__room-tab--add" @click="showCreateRoom = true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
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
      <div class="chat-app__messages gui-scrollable" ref="messagesRef">
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
        <div v-if="showCreateRoom" class="chat-app__dialog-overlay" @click.self="showCreateRoom = false">
          <div class="chat-app__dialog">
            <h3 class="chat-app__dialog-title">{{ t('chat.createRoom') }}</h3>
            <input
              v-model="newRoomName"
              type="text"
              class="chat-app__dialog-input"
              :placeholder="t('chat.roomPlaceholder')"
              maxlength="50"
              @keyup.enter="createRoom"
            />
            <div class="chat-app__dialog-actions">
              <button class="chat-app__dialog-btn" @click="showCreateRoom = false">{{ t('common.cancel') }}</button>
              <button class="chat-app__dialog-btn chat-app__dialog-btn--primary" @click="createRoom">{{ t('common.create') }}</button>
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
}

defineProps<Props>()

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
const sending = ref(false)
const nickname = ref('')
const rateLimitWarning = ref('')
const rateLimited = ref(false)
let pollTimer: number | null = null
let userId = ''

// Dialogs
const showCreateRoom = ref(false)
const showNicknameDialog = ref(false)
const newRoomName = ref('')
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
  indexedDBService.saveSetting('chat_unread_counts', unreadCounts.value).catch(() => {})
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

async function createRoom() {
  if (!newRoomName.value.trim()) return

  try {
    const response = await fetch(`${API_BASE}/chat/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newRoomName.value.trim(),
        created_by: userId,
      }),
    })

    const data = await response.json()
    if (data.success) {
      await loadRooms()
      newRoomName.value = ''
      showCreateRoom.value = false
    }
  } catch (error) {
    console.error('[Chat] Failed to create room:', error)
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
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  padding-top: max(10px, env(safe-area-inset-top, 10px));
  background: var(--chat-surface, var(--gui-bg-surface, #2C2C2E));
  border-bottom: 0.5px solid var(--chat-border, var(--gui-border-subtle, #38383A));
  gap: 8px;
}

.chat-app__rooms {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}

.chat-app__rooms::-webkit-scrollbar {
  display: none;
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

.chat-app__room-tab--active {
  background: var(--chat-accent, #007AFF);
  color: #FFFFFF;
}

.chat-app__room-tab--add {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat-app__room-label {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
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
