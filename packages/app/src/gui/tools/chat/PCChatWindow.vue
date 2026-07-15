<!-- eslint-disable @typescript-eslint/no-explicit-any -->

<!-- eslint-disable @typescript-eslint/no-explicit-any -->

<template>
  <PCWindow :window-instance="windowInstance" @close="$emit('close')">
    <div class="pc-chat" :style="chatThemeStyles">
      <!-- Sidebar: Room List -->
      <div class="pc-chat__sidebar">
        <div class="pc-chat__sidebar-header">
          <h2 class="pc-chat__sidebar-title">{{ t('chat.title') }}</h2>
          <button
            class="pc-chat__add-room-btn"
            :title="t('chat.createRoom')"
            @click="showCreateRoom = true"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 3v12M3 9h12"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        <div class="pc-chat__search">
          <svg class="pc-chat__search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5" />
            <path
              d="M10.5 10.5L14 14"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          <input
            v-model="roomSearchQuery"
            type="text"
            class="pc-chat__search-input"
            :placeholder="t('chat.searchRooms')"
          />
        </div>

        <div class="pc-chat__room-list">
          <div v-if="loadingRooms" class="pc-chat__room-loading">
            <div class="pc-chat__loading-dot" />
            <div class="pc-chat__loading-dot" />
            <div class="pc-chat__loading-dot" />
          </div>
          <template v-else>
            <!-- DEBUG: rooms count -->
            <div
              v-if="rooms.length === 0"
              style="padding: 16px; color: var(--gui-error, #ff3b30); font-size: 12px"
            >
              DEBUG: rooms.length = {{ rooms.length }}<br />
              query = "{{ roomSearchQuery }}"<br />
              filtered = {{ filteredRooms.length }}
            </div>
            <div
              v-for="room in rooms"
              :key="room.id"
              class="pc-chat__room-item"
              :class="{ 'pc-chat__room-item--active': currentRoomId === room.id }"
              @click="switchRoom(room.id)"
            >
              <div class="pc-chat__room-avatar">{{ room.name.charAt(0).toUpperCase() }}</div>
              <div class="pc-chat__room-body">
                <div class="pc-chat__room-top">
                  <span class="pc-chat__room-name">{{ room.name }}</span>
                  <span class="pc-chat__room-time">{{
                    formatRoomTime(room.last_message_time)
                  }}</span>
                </div>
                <div class="pc-chat__room-bottom">
                  <span class="pc-chat__room-preview">
                    <template v-if="room.last_message">
                      <span class="pc-chat__room-sender">{{ room.last_message_sender }}: </span>
                      {{ truncateMessage(room.last_message) }}
                    </template>
                    <template v-else>{{ t('chat.emptyState') }}</template>
                  </span>
                  <span v-if="getUnreadCount(room.id) > 0" class="pc-chat__room-badge">{{
                    getUnreadCount(room.id)
                  }}</span>
                </div>
              </div>
              <button
                v-if="room.created_by === userId"
                class="pc-chat__room-settings"
                @click.stop="openRoomSettings(room)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path
                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 5 15.34a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.66 9 1.65 1.65 0 0 0 4.33 7.18l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.66a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.34 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                  />
                </svg>
              </button>
            </div>
          </template>
        </div>

        <button class="pc-chat__nickname-btn" @click="openNicknameDialog">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="6" r="4" stroke="currentColor" stroke-width="1.3" />
            <path
              d="M2 14c0-3 2.5-5 6-5s6 2 6 5"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linecap="round"
            />
          </svg>
          <span class="pc-chat__nickname-text">{{
            authStore.nickname || t('chat.setNickname')
          }}</span>
        </button>
      </div>

      <!-- Main: Chat Area -->
      <div class="pc-chat__main">
        <template v-if="currentRoom">
          <div class="pc-chat__chat-header">
            <div class="pc-chat__chat-room-info">
              <span class="pc-chat__chat-room-name">{{ currentRoom.name }}</span>
              <span class="pc-chat__chat-room-members"
                >{{ currentRoom.member_count || 0 }} {{ t('chat.members') }}</span
              >
            </div>
          </div>

          <div ref="messagesRef" class="pc-chat__messages">
            <div
              v-if="messages.length > 0 || loading"
              style="
                padding: 4px 8px;
                font-size: 10px;
                color: var(--gui-text-tertiary, #666);
                background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.05));
                border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.1));
              "
            >
              DEBUG: 房间={{ currentRoomId }} 消息数={{ messages.length }} 最后ID={{
                messages[messages.length - 1]?.id || '?'
              }}
            </div>
            <div v-if="messages.length === 0 && !loading" class="pc-chat__empty">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path
                  d="M24 44c11 0 20-8 20-18S35 8 24 8 4 16 4 26s9 18 20 18z"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <circle cx="16" cy="24" r="2" fill="currentColor" />
                <circle cx="24" cy="24" r="2" fill="currentColor" />
                <circle cx="32" cy="24" r="2" fill="currentColor" />
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
              @contextmenu.prevent="onMessageRightClick($event, msg)"
            >
              <div class="chat-bubble__header">
                <span class="chat-bubble__username">{{ msg.username }}</span>
                <span class="chat-bubble__time"
                  >{{ formatTime(msg.created_at) }} #{{ msg.id || '?' }}
                  <span v-if="msg.edited" class="chat-bubble__edited">{{ t('chat.edited') }}</span>
                </span>
              </div>
              <div class="chat-bubble__content">{{ msg.content }}</div>
              <div v-if="msg.sending" class="chat-bubble__status">
                <span class="chat-bubble__status-dot" />
                {{ t('chat.sending') }}
              </div>
              <div
                v-else-if="msg.error"
                class="chat-bubble__status chat-bubble__status--error"
                @click="retryMessage(msg)"
              >
                {{ msg.error }} ·
                <span class="chat-bubble__retry">{{ t('chat.retry') }}</span>
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

          <div
            class="pc-chat__ws-status"
            :class="`pc-chat__ws-status--${ws.connectionState.value}`"
          >
            <span class="pc-chat__ws-dot" />
            <span class="pc-chat__ws-text">{{ wsStatusLabel }}</span>
          </div>

          <div class="pc-chat__input-bar">
            <div v-if="editingMessageId" class="pc-chat__edit-hint">
              <span>{{ t('chat.editing') }}</span>
              <button class="pc-chat__edit-cancel" @click="cancelEdit">
                {{ t('common.cancel') }}
              </button>
            </div>
            <textarea
              ref="inputRef"
              v-model="inputContent"
              class="pc-chat__input"
              :placeholder="t('chat.placeholder')"
              :disabled="sending || rateLimited"
              rows="1"
              @keydown.enter.exact.prevent="sendOrEditMessage"
              @keydown.esc="cancelEdit"
              @input="autoResizeInput"
            />
            <button
              class="pc-chat__send-btn"
              :disabled="!inputContent.trim() || sending || rateLimited"
              @click="sendOrEditMessage"
            >
              <svg v-if="!sending" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 10L17 3L10 17L9 11L3 10Z" fill="currentColor" />
              </svg>
              <div v-else class="pc-chat__spinner" />
            </button>
          </div>
        </template>

        <div v-else class="pc-chat__no-room">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect
              x="8"
              y="12"
              width="48"
              height="36"
              rx="4"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M20 28h24M20 36h16"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          <p>{{ t('chat.selectRoom') }}</p>
        </div>
      </div>

      <!-- Context Menu -->
      <Transition name="gui-ios-fade">
        <div
          v-if="showContextMenu"
          class="pc-chat__context-overlay"
          @click.self="showContextMenu = false"
          @contextmenu.prevent
        >
          <div
            class="pc-chat__context-menu"
            :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
          >
            <button class="pc-chat__context-item" @click="startEdit(contextMenuMsg)">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {{ t('chat.edit') }}
            </button>
            <button
              class="pc-chat__context-item pc-chat__context-item--danger"
              @click="startDelete(contextMenuMsg)"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="3 6 5 6 21 6" />
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                />
              </svg>
              {{ t('chat.delete') }}
            </button>
          </div>
        </div>
      </Transition>

      <!-- Create Room Dialog -->
      <Transition name="gui-ios-fade">
        <div
          v-if="showCreateRoom"
          class="pc-chat__dialog-overlay"
          @click.self="showCreateRoom = false"
        >
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
              :placeholder="t('chat.descriptionOptional')"
              maxlength="200"
              rows="3"
            />
            <div class="pc-chat__dialog-checkbox">
              <input
                id="room-public"
                v-model="newRoomPublic"
                type="checkbox"
                class="pc-chat__dialog-checkbox-input"
              />
              <label for="room-public" class="pc-chat__dialog-checkbox-label">{{
                t('chat.publicRoom')
              }}</label>
            </div>
            <div class="pc-chat__dialog-actions">
              <button
                class="pc-chat__dialog-btn"
                :disabled="creatingRoom"
                @click="showCreateRoom = false"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                class="pc-chat__dialog-btn pc-chat__dialog-btn--primary"
                :disabled="creatingRoom"
                @click="createRoom"
              >
                <div v-if="creatingRoom" class="pc-chat__dialog-spinner" />
                <span v-else>{{ t('common.create') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Room Settings Dialog -->
      <Transition name="gui-ios-fade">
        <div
          v-if="showRoomSettings"
          class="pc-chat__dialog-overlay"
          @click.self="showRoomSettings = false"
        >
          <div class="pc-chat__dialog pc-chat__dialog--settings">
            <h3 class="pc-chat__dialog-title">{{ t('chat.roomSettings') }}</h3>
            <div class="pc-chat__dialog-section">
              <input
                v-model="editRoomName"
                type="text"
                class="pc-chat__dialog-input"
                :placeholder="t('chat.roomName')"
                maxlength="50"
              />
              <textarea
                v-model="editRoomDescription"
                class="pc-chat__dialog-textarea"
                :placeholder="t('chat.description')"
                maxlength="200"
                rows="3"
              />
              <div class="pc-chat__dialog-checkbox">
                <input
                  id="edit-room-public"
                  v-model="editRoomPublic"
                  type="checkbox"
                  class="pc-chat__dialog-checkbox-input"
                />
                <label for="edit-room-public" class="pc-chat__dialog-checkbox-label">{{
                  t('chat.publicRoom')
                }}</label>
              </div>
            </div>
            <div class="pc-chat__dialog-section">
              <button
                class="pc-chat__dialog-danger-btn"
                :disabled="deletingRoom || savingSettings"
                @click="deleteRoom"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3.5 3.5h9M3.5 3.5v9.5a.5.5 0 00.5.5h8a.5.5 0 00.5-.5V3.5m-10-1a.5.5 0 01.5-.5h10a.5.5 0 01.5.5M7.5 7.5v3M8.5 7.5v3"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
                <span>Delete Room</span>
              </button>
            </div>
            <div class="pc-chat__dialog-actions">
              <button
                class="pc-chat__dialog-btn"
                :disabled="savingSettings || deletingRoom"
                @click="showRoomSettings = false"
              >
                Cancel
              </button>
              <button
                class="pc-chat__dialog-btn pc-chat__dialog-btn--primary"
                :disabled="savingSettings || deletingRoom"
                @click="saveRoomSettings"
              >
                <div v-if="savingSettings" class="pc-chat__dialog-spinner" />
                <span v-else>Save</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Nickname Dialog -->
      <Transition name="gui-ios-fade">
        <div
          v-if="showNicknameDialog"
          class="pc-chat__dialog-overlay"
          @click.self="showNicknameDialog = false"
        >
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
            <div v-if="nicknameCheckStatus === 'taken'" class="pc-chat__dialog-error">
              Nickname already taken
            </div>
            <div v-if="nicknameCheckStatus === 'checking'" class="pc-chat__dialog-hint">
              Checking...
            </div>
            <div v-if="nicknameCheckStatus === 'available'" class="pc-chat__dialog-success">
              Available
            </div>
            <div v-if="nicknameSaveError" class="pc-chat__dialog-error">
              {{ nicknameSaveError }}
            </div>
            <div class="pc-chat__dialog-actions">
              <button
                class="pc-chat__dialog-btn"
                :disabled="savingNickname"
                @click="showNicknameDialog = false"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                class="pc-chat__dialog-btn pc-chat__dialog-btn--primary"
                :disabled="
                  !newNickname.trim() ||
                  savingNickname ||
                  nicknameCheckStatus === 'taken' ||
                  nicknameCheckStatus === 'checking'
                "
                @click="saveNickname"
              >
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import PCWindow from '../../components/PCWindow.vue'
import { useThemeStore } from '../../stores/themeStore'
import { useI18n } from '../../composables/useI18n'
import { useChatWebSocket, type WSChatMessage } from '../../composables/useChatWebSocket'
import { useAuthStore } from '../../../stores/authStore'
import { config } from '../../../config'
import indexedDBService from '../../../utils/indexedDB'
import type { WindowInstance } from '../../types'

interface Props {
  visible?: boolean
  windowInstance?: WindowInstance
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
  edited?: boolean
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
const editingMessageId = ref<number | null>(null)
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuMsg = ref<ChatMessage | null>(null)
const creatingRoom = ref(false)
const savingSettings = ref(false)
const deletingRoom = ref(false)
const showNicknameDialog = ref(false)
const newNickname = ref('')
const savingNickname = ref(false)
const nicknameCheckStatus = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
const nicknameSaveError = ref('')
let nicknameCheckTimer: number | null = null
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

const ws = useChatWebSocket({
  apiUrl: API_BASE,
  userId: '',
  username: '',
  roomId: 1,
  onMessage: (msg: WSChatMessage) => {
    const chatMsg: ChatMessage = {
      ...msg,
      isSelf: msg.user_id === userId,
    }
    // 优先使用 tempId 匹配，避免内容编码导致匹配失败
    const existingIdx = msg.tempId
      ? messages.findIndex((m) => m.sending && m.tempId === msg.tempId)
      : messages.findIndex(
          (m) => m.sending && m.content === msg.content && m.user_id === msg.user_id
        )
    if (existingIdx !== -1) {
      // 保留 tempId 避免 Vue key 变化导致 DOM 闪烁，使用 splice 确保响应式追踪
      messages.splice(existingIdx, 1, {
        ...chatMsg,
        tempId: messages[existingIdx].tempId,
      })
    } else {
      const alreadyExists = messages.some((m) => m.id === msg.id && !m.tempId)
      if (!alreadyExists) {
        messages.push(chatMsg)
      }
    }
    nextTick(() => scrollToBottom())
  },
  onHistory: (msgs: WSChatMessage[]) => {
    // Preserve optimistic (sending) messages that haven't been confirmed yet
    const pending = messages.filter((m) => m.sending && m.tempId)
    messages.splice(0, messages.length)
    for (const msg of msgs) {
      messages.push({
        ...msg,
        isSelf: msg.user_id === userId,
      })
    }
    // Re-append pending optimistic messages not yet in history
    for (const p of pending) {
      if (!messages.some((m) => m.tempId === p.tempId || (m.content === p.content && m.user_id === p.user_id))) {
        messages.push(p)
      }
    }
    loading.value = false
    nextTick(() => scrollToBottom())
  },
  onUsersUpdate: (_users: any, count: any) => {
    if (currentRoom.value) {
      currentRoom.value.member_count = count
    }
  },
  onUserJoined: (data: any) => {
    if (currentRoom.value) {
      currentRoom.value.member_count = data.count
    }
  },
  onUserLeft: (data: any) => {
    if (currentRoom.value) {
      currentRoom.value.member_count = data.count
    }
  },
  onMessageEdited: (data: any) => {
    const idx = messages.findIndex((m) => m.id === data.id)
    if (idx !== -1) {
      messages.splice(idx, 1, { ...messages[idx], content: data.content, edited: true })
    }
  },
  onMessageDeleted: (data: any) => {
    const idx = messages.findIndex((m) => m.id === data.id)
    if (idx !== -1) messages.splice(idx, 1)
  },
  onError: (error: any) => {
    if (error === 'RATE_LIMIT') {
      rateLimitWarning.value = 'Rate limit exceeded. Please wait.'
      rateLimited.value = true
      setTimeout(() => {
        rateLimited.value = false
        rateLimitWarning.value = ''
      }, 60000)
    }
  },
})

const displayMessages = computed(() => messages)

const filteredRooms = computed(() => {
  const query = roomSearchQuery.value.trim().toLowerCase()
  return rooms.filter((r) => !query || r.name.toLowerCase().includes(query))
})

const currentRoom = computed(() => rooms.find((r) => r.id === currentRoomId.value) || null)

const wsStatusLabel = computed(() => {
  const state = ws.connectionState.value
  if (state === 'connected') return '已连接'
  if (state === 'connecting') return '连接中...'
  if (state === 'reconnecting') return '重连中...'
  return ws.lastError.value || '已断开'
})

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
  userId = authStore.userId || (await indexedDBService.getUserId())
  await loadRooms()
  await loadUnreadCounts()
  if (rooms.length > 0) {
    currentRoomId.value = rooms[0].id
  }
  ws.setCredentials(userId, authStore.nickname || 'Anonymous')
  if (currentRoomId.value) {
    ws.switchRoom(currentRoomId.value)
    loadHistoryFromAPI(currentRoomId.value)
  } else {
    ws.connect()
  }
})

watch(
  () => authStore.userId,
  (newUserId) => {
    if (newUserId) userId = newUserId
  }
)

async function loadUnreadCounts() {
  try {
    const stored = await indexedDBService.loadSetting('chat_unread_counts')
    if (stored) unreadCounts.value = stored as Record<number, number>
  } catch {}
}

async function loadRooms() {
  loadingRooms.value = true
  try {
    const url = `${API_BASE}/chat/rooms?t=${Date.now()}`
    // eslint-disable-next-line no-console
    console.log('[Chat] Loading rooms from:', url)
    const response = await fetch(url, {
      cache: 'no-cache',
    })
    const data = await response.json()
    // eslint-disable-next-line no-console
    console.log('[Chat] Rooms response:', JSON.stringify(data).slice(0, 500))
    if (data.success && data.data) {
      const oldRooms = new Map(rooms.map((r) => [r.id, r]))
      rooms.splice(0, rooms.length)
      for (const room of data.data) {
        const oldRoom = oldRooms.get(room.id)
        if (
          oldRoom &&
          room.message_count > oldRoom.message_count &&
          room.id !== currentRoomId.value
        ) {
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
      // eslint-disable-next-line no-console
      console.log('[Chat] Rooms loaded:', rooms.length)
    } else {
      console.warn('[Chat] Rooms load failed or empty:', data)
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
    const effectiveUserId = authStore.userId || userId || (await indexedDBService.getUserId())
    const response = await authStore.authFetch(`${API_BASE}/chat/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newRoomName.value.trim(),
        description: newRoomDescription.value.trim(),
        created_by: effectiveUserId,
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
  messages.splice(0, messages.length)
  markRoomAsRead(roomId)
  ws.switchRoom(roomId)
  loadHistoryFromAPI(roomId)
}

async function loadHistoryFromAPI(roomId: number) {
  if (messages.length > 0) return
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/chat/messages?limit=50&room_id=${roomId}`)
    const data = await response.json()
    if (data.success && data.data && data.data.length > 0 && messages.length === 0) {
      for (const msg of data.data) {
        messages.push({
          ...msg,
          isSelf: msg.user_id === userId,
        })
      }
      nextTick(() => scrollToBottom())
    }
  } catch {
  } finally {
    loading.value = false
  }
}

function sendOrEditMessage() {
  if (editingMessageId.value) {
    confirmEdit()
  } else {
    sendMessage()
  }
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

  const sent = ws.sendMessage(content, tempId)
  if (!sent) {
    const idx = messages.findIndex((m) => m.tempId === tempId)
    if (idx !== -1) {
      messages.splice(idx, 1, {
        ...messages[idx],
        sending: false,
        error: 'Failed to send (not connected)',
      })
    }
  }
  sending.value = false
}

function onMessageRightClick(event: MouseEvent, msg: ChatMessage) {
  if (!msg.isSelf || msg.sending || !msg.id) return
  contextMenuMsg.value = msg
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  showContextMenu.value = true
}

function startEdit(msg: ChatMessage | null) {
  showContextMenu.value = false
  if (!msg || !msg.id) return
  editingMessageId.value = msg.id
  inputContent.value = msg.content
  nextTick(() => inputRef.value?.focus())
}

function cancelEdit() {
  editingMessageId.value = null
  inputContent.value = ''
}

function confirmEdit() {
  if (!editingMessageId.value) return
  const content = inputContent.value.trim()
  if (!content) return
  const sent = ws.editMessage(editingMessageId.value, content)
  if (sent) {
    editingMessageId.value = null
    inputContent.value = ''
  }
}

function startDelete(msg: ChatMessage | null) {
  showContextMenu.value = false
  if (!msg || !msg.id) return
  if (!confirm(t('chat.confirmDelete'))) return
  ws.deleteMessage(msg.id)
}

async function retryMessage(msg: ChatMessage) {
  if (!msg.tempId || !msg.error) return
  if ((msg.retryCount || 0) >= MAX_RETRY) return

  const idx = messages.findIndex((m) => m.tempId === msg.tempId)
  if (idx === -1) return

  const updated = {
    ...messages[idx],
    sending: true,
    error: undefined,
    retryCount: (msg.retryCount || 0) + 1,
  }
  messages.splice(idx, 1, updated)

  const sent = ws.sendMessage(msg.content)
  if (!sent) {
    messages.splice(idx, 1, { ...updated, sending: false, error: t('chat.networkError') })
  } else {
    messages.splice(idx, 1, { ...updated, sending: false })
  }
}

function autoResizeInput() {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px'
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
  const roomIndex = rooms.findIndex((r) => r.id === currentRoom.value?.id)
  const originalRoom = roomIndex !== -1 ? { ...rooms[roomIndex] } : null
  try {
    const response = await authStore.authFetch(`${API_BASE}/chat/rooms/${currentRoom.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editRoomName.value,
        description: editRoomDescription.value,
        is_public: editRoomPublic.value ? 1 : 0,
      }),
    })
    const data = await response.json()
    if (data.success && roomIndex !== -1) {
      rooms[roomIndex] = {
        ...rooms[roomIndex],
        name: editRoomName.value,
        description: editRoomDescription.value,
        is_public: editRoomPublic.value ? 1 : 0,
      }
      showRoomSettings.value = false
    } else {
      alert(data.error || 'Failed to save room settings')
      if (originalRoom && roomIndex !== -1) {
        rooms[roomIndex] = originalRoom
      }
    }
  } catch (error) {
    console.error('[Chat] Failed to save room settings:', error)
    alert('Failed to save room settings. Please try again.')
    if (originalRoom && roomIndex !== -1) {
      rooms[roomIndex] = originalRoom
    }
  } finally {
    savingSettings.value = false
  }
}

async function deleteRoom() {
  if (!currentRoom.value) return
  if (!confirm('Are you sure you want to delete this room?')) return
  deletingRoom.value = true
  const roomIndex = rooms.findIndex((r) => r.id === currentRoom.value?.id)
  const deletedRoom = roomIndex !== -1 ? rooms[roomIndex] : null
  try {
    const response = await authStore.authFetch(`${API_BASE}/chat/rooms/${currentRoom.value.id}`, {
      method: 'DELETE',
    })
    const data = await response.json()
    if (data.success && roomIndex !== -1) {
      rooms.splice(roomIndex, 1)
      if (currentRoomId.value === deletedRoom?.id && rooms.length > 0) {
        currentRoomId.value = rooms[0].id
        messages.splice(0, messages.length)
        ws.switchRoom(rooms[0]?.id || 1)
      }
      showRoomSettings.value = false
    } else {
      alert(data.error || 'Failed to delete room')
    }
  } catch (error) {
    console.error('[Chat] Failed to delete room:', error)
    alert('Failed to delete room. Please try again.')
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
  background: var(--chat-bg, #1c1c1e);
  position: relative;
}

/* ── Sidebar ──────────────────────────────────────────────────────── */
.pc-chat__sidebar {
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  background: var(--chat-surface, #2c2c2e);
  border-right: 0.5px solid var(--chat-border, #38383a);
}

.pc-chat__sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 0.5px solid var(--chat-border, #38383a);
}

.pc-chat__sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--chat-text-primary, #ffffff);
  margin: 0;
}

.pc-chat__add-room-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: var(--chat-accent, #007aff);
  color: var(--gui-text-primary, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;
}

.pc-chat__add-room-btn:hover {
  opacity: 0.85;
}

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
  background: var(--chat-bg, #1c1c1e);
  color: var(--chat-text-primary, #ffffff);
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
  scrollbar-color: var(--chat-border, #38383a) transparent;
}

.pc-chat__room-list::-webkit-scrollbar {
  width: 4px;
}
.pc-chat__room-list::-webkit-scrollbar-track {
  background: transparent;
}
.pc-chat__room-list::-webkit-scrollbar-thumb {
  background-color: var(--chat-border, #38383a);
  border-radius: 2px;
}

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
  background: var(--chat-surface-hover, #3a3a3c);
}

.pc-chat__room-item--active {
  background: var(--chat-accent, #007aff);
}

.pc-chat__room-item--active:hover {
  background: var(--chat-accent, #007aff);
  opacity: 0.9;
}

.pc-chat__room-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--chat-surface-hover, #3a3a3c);
  color: var(--chat-text-primary, #ffffff);
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

.light .pc-chat__room-item--active .pc-chat__room-avatar {
  background: rgba(0, 0, 0, 0.1);
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
  color: var(--chat-text-primary, #ffffff);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-chat__room-item--active .pc-chat__room-name {
  color: var(--gui-text-primary, #ffffff);
}

.pc-chat__room-time {
  font-size: 11px;
  color: var(--chat-text-tertiary, #636366);
  flex-shrink: 0;
}

.pc-chat__room-item--active .pc-chat__room-time {
  color: var(--gui-text-secondary, rgba(255, 255, 255, 0.7));
}

.pc-chat__room-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pc-chat__room-preview {
  font-size: 12px;
  color: var(--chat-text-secondary, #8e8e93);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.pc-chat__room-item--active .pc-chat__room-preview {
  color: var(--gui-text-primary, rgba(255, 255, 255, 0.8));
}

.pc-chat__room-sender {
  font-weight: 600;
}

.pc-chat__room-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--chat-error, #ff3b30);
  color: var(--gui-text-primary, #ffffff);
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
  transition:
    opacity 0.15s,
    background 0.15s;
}

.pc-chat__room-item:hover .pc-chat__room-settings {
  opacity: 1;
}
.pc-chat__room-settings:hover {
  background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.1));
}

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
  color: var(--chat-text-secondary, #8e8e93);
  cursor: pointer;
  border-top: 0.5px solid var(--chat-border, #38383a);
  transition: background 0.15s;
  width: 100%;
  text-align: left;
}

.pc-chat__nickname-btn:hover {
  background: var(--chat-surface-hover, #3a3a3c);
}

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
  background: var(--chat-surface, #2c2c2e);
  border-bottom: 0.5px solid var(--chat-border, #38383a);
}

.pc-chat__chat-room-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pc-chat__chat-room-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--chat-text-primary, #ffffff);
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
  scrollbar-color: var(--chat-border, #38383a) var(--chat-bg, #1c1c1e);
}

.pc-chat__messages::-webkit-scrollbar {
  width: 8px;
}
.pc-chat__messages::-webkit-scrollbar-track {
  background: var(--chat-bg, #1c1c1e);
}
.pc-chat__messages::-webkit-scrollbar-thumb {
  background-color: var(--chat-border, #38383a);
  border-radius: 4px;
}

.pc-chat__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--chat-text-tertiary, #636366);
  gap: 12px;
}

.pc-chat__empty p {
  font-size: 14px;
  margin: 0;
}

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
  color: var(--chat-text-secondary, #8e8e93);
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
  background: var(--chat-surface, #2c2c2e);
  color: var(--chat-text-primary, #ffffff);
}

.chat-bubble--self .chat-bubble__content {
  background: var(--chat-accent, #007aff);
  color: var(--gui-text-primary, #ffffff);
  border-bottom-right-radius: 4px;
}

.chat-bubble:not(.chat-bubble--self) .chat-bubble__content {
  border-bottom-left-radius: 4px;
}

.chat-bubble--sending {
  opacity: 0.7;
}

.chat-bubble--error .chat-bubble__content {
  border: 1px solid var(--chat-error, #ff3b30);
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
  background: var(--chat-accent, #007aff);
  animation: chat-pulse 1.5s ease-in-out infinite;
}

.chat-bubble__status--error {
  color: var(--chat-error, #ff3b30);
  cursor: pointer;
}

.chat-bubble__retry {
  text-decoration: underline;
  font-weight: 600;
}

@keyframes chat-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes chat-pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}

/* ── Rate Warning ─────────────────────────────────────────────────── */
.pc-chat__rate-warning {
  padding: 8px 12px;
  background: var(--chat-error, #ff3b30);
  color: var(--gui-text-primary, #ffffff);
  font-size: 12px;
  text-align: center;
}

.pc-chat__ws-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px 12px;
  font-size: 11px;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.03));
  border-top: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.04));
}

.pc-chat__ws-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.pc-chat__ws-status--connected .pc-chat__ws-dot {
  background: var(--gui-success, #34c759);
  box-shadow: 0 0 6px var(--gui-success-bg, rgba(52, 199, 89, 0.5));
}
.pc-chat__ws-status--connecting .pc-chat__ws-dot {
  background: var(--gui-warning, #ff9500);
  animation: wsPulse 1s ease-in-out infinite;
}
.pc-chat__ws-status--reconnecting .pc-chat__ws-dot {
  background: var(--gui-warning, #ff9500);
  animation: wsPulse 1s ease-in-out infinite;
}
.pc-chat__ws-status--disconnected .pc-chat__ws-dot {
  background: var(--gui-error, #ff3b30);
}

.pc-chat__ws-text {
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.4));
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
}

.pc-chat__ws-status--connected .pc-chat__ws-text {
  color: rgba(52, 199, 89, 0.7);
}
.pc-chat__ws-status--disconnected .pc-chat__ws-text {
  color: rgba(255, 59, 48, 0.7);
}

@keyframes wsPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
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
  background: var(--chat-accent, #007aff);
  animation: chat-bounce 1.2s ease-in-out infinite;
}

.pc-chat__loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.pc-chat__loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes chat-bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
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

.pc-chat__no-room p {
  font-size: 14px;
  margin: 0;
}

/* ── Input Bar ────────────────────────────────────────────────────── */
.pc-chat__input-bar {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background: var(--chat-surface, #2c2c2e);
  border-top: 0.5px solid var(--chat-border, #38383a);
}

.pc-chat__input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 20px;
  border: none;
  background: var(--chat-bg, #1c1c1e);
  color: var(--chat-text-primary, #ffffff);
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
  background: var(--chat-accent, #007aff);
  color: var(--gui-text-primary, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    opacity 0.15s,
    transform 0.1s;
  flex-shrink: 0;
}

.pc-chat__send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.pc-chat__send-btn:not(:disabled):hover {
  opacity: 0.9;
}
.pc-chat__send-btn:not(:disabled):active {
  transform: scale(0.95);
}

.pc-chat__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--gui-border-strong, rgba(255, 255, 255, 0.3));
  border-top-color: var(--gui-text-primary, #ffffff);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Dialogs ──────────────────────────────────────────────────────── */
.pc-chat__dialog-overlay {
  position: absolute;
  inset: 0;
  background: var(--gui-backdrop-bg, rgba(0, 0, 0, 0.5));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}

.pc-chat__dialog {
  width: 100%;
  max-width: 320px;
  background: var(--chat-surface, #2c2c2e);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.pc-chat__dialog--settings {
  max-width: 400px;
}

.pc-chat__dialog-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--chat-text-primary, #ffffff);
  margin: 0 0 16px;
}

.pc-chat__dialog-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 0.5px solid var(--chat-border, #38383a);
  background: var(--chat-bg, #1c1c1e);
  color: var(--chat-text-primary, #ffffff);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 12px;
}

.pc-chat__dialog-textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 0.5px solid var(--chat-border, #38383a);
  background: var(--chat-bg, #1c1c1e);
  color: var(--chat-text-primary, #ffffff);
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

.pc-chat__dialog-checkbox-input {
  accent-color: var(--chat-accent, #007aff);
}

.pc-chat__dialog-checkbox-label {
  font-size: 14px;
  color: var(--chat-text-secondary, #8e8e93);
}

.pc-chat__dialog-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 0.5px solid var(--chat-border, #38383a);
}

.pc-chat__dialog-danger-btn {
  width: 100%;
  height: 40px;
  border-radius: 10px;
  border: 0.5px solid var(--chat-error, #ff3b30);
  background: transparent;
  color: var(--chat-error, #ff3b30);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s;
}

.pc-chat__dialog-danger-btn:hover {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.1));
}

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
  background: var(--chat-surface-hover, #3a3a3c);
  color: var(--chat-text-primary, #ffffff);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.pc-chat__dialog-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pc-chat__dialog-btn--primary {
  background: var(--chat-accent, #007aff);
}

.pc-chat__dialog-error {
  font-size: 12px;
  color: var(--chat-error, #ff3b30);
  margin-bottom: 8px;
}

.pc-chat__dialog-hint {
  font-size: 12px;
  color: var(--chat-text-tertiary, #636366);
  margin-bottom: 8px;
}

.pc-chat__dialog-success {
  font-size: 12px;
  color: var(--gui-success, #34c759);
  margin-bottom: 8px;
}

.pc-chat__dialog-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--gui-border-strong, rgba(255, 255, 255, 0.3));
  border-top-color: var(--gui-text-primary, #ffffff);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

.pc-chat__edit-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 8px;
  font-size: 11px;
  color: var(--chat-accent, #007aff);
  background: var(--chat-bg, #1c1c1e);
  border-radius: 6px;
  margin-bottom: 4px;
  width: 100%;
}

.pc-chat__edit-cancel {
  background: none;
  border: none;
  color: var(--chat-text-secondary, #8e8e93);
  font-size: 11px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.pc-chat__edit-cancel:hover {
  color: var(--chat-text-primary, #ffffff);
  background: var(--chat-surface-hover, #3a3a3c);
}

.chat-bubble__edited {
  margin-left: 6px;
  font-size: 10px;
  color: var(--chat-text-tertiary, #636366);
  font-style: italic;
}

.pc-chat__context-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
}

.pc-chat__context-menu {
  position: absolute;
  min-width: 140px;
  background: var(--chat-surface, #2c2c2e);
  border-radius: 10px;
  border: 0.5px solid var(--chat-border, #38383a);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pc-chat__context-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--chat-text-primary, #ffffff);
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.1s;
}

.pc-chat__context-item:hover {
  background: var(--chat-surface-hover, #3a3a3c);
}

.pc-chat__context-item--danger {
  color: var(--chat-error, #ff3b30);
}

.pc-chat__context-item--danger:hover {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.1));
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

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .pc-chat__container {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}
.light .pc-chat__emoji-picker {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.light .pc-chat__dialog {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
.light .pc-chat__ws-status--connected .pc-chat__ws-dot {
  box-shadow: 0 0 6px rgba(52, 199, 89, 0.3);
}
.light .pc-chat__ws-status--connected .pc-chat__ws-text {
  color: rgba(52, 199, 89, 0.8);
}
.light .pc-chat__ws-status--disconnected .pc-chat__ws-text {
  color: rgba(255, 59, 48, 0.8);
}
.light .pc-chat__dialog-btn {
  background: var(--chat-surface-hover, rgba(0, 0, 0, 0.06));
  color: var(--chat-text-primary, #000000);
}
.light .pc-chat__add-room-btn {
  background: var(--chat-accent-soft, rgba(99, 99, 102, 0.15));
  color: var(--chat-accent, #636366);
}
.light .pc-chat__add-room-btn:hover {
  background: rgba(99, 99, 102, 0.2);
}
.light .pc-chat__room-item--active {
  background: var(--chat-accent-soft, rgba(99, 99, 102, 0.15));
}
.light .pc-chat__room-item--active:hover {
  background: rgba(99, 99, 102, 0.2);
  opacity: 1;
}
.light .pc-chat__room-item--active .pc-chat__room-name {
  color: var(--chat-accent, #636366);
}
.light .pc-chat__room-item--active .pc-chat__room-time {
  color: var(--chat-text-secondary, #6e6e73);
}
.light .pc-chat__room-item--active .pc-chat__room-preview {
  color: var(--chat-text-secondary, #6e6e73);
}
.light .chat-bubble--self .chat-bubble__content {
  background: var(--chat-accent-soft, rgba(99, 99, 102, 0.15));
  color: var(--chat-accent, #636366);
}
.light .chat-bubble__status-dot {
  background: var(--chat-accent, #636366);
}
.light .pc-chat__loading-dot {
  background: var(--chat-accent, #636366);
}
.light .pc-chat__dialog-btn--primary {
  background: var(--chat-accent-soft, rgba(99, 99, 102, 0.15));
  color: var(--chat-accent, #636366);
}
.light .pc-chat__send-btn {
  background: var(--chat-accent-soft, rgba(99, 99, 102, 0.15));
  color: var(--chat-accent, #636366);
}
.light .pc-chat__action-btn {
  color: var(--chat-text-secondary, #6e6e73);
}
.light .pc-chat__action-btn:hover {
  background: rgba(0, 0, 0, 0.06);
}
.light .pc-chat__edit-hint {
  background: var(--chat-bg, #f2f2f7);
}
.light .pc-chat__edit-cancel:hover {
  background: rgba(0, 0, 0, 0.06);
  color: var(--chat-text-primary, #000000);
}
.light .pc-chat__context-menu {
  background: var(--chat-surface, #ffffff);
  border-color: var(--chat-border, #e5e5ea);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.light .pc-chat__context-item {
  color: var(--chat-text-primary, #000000);
}
.light .pc-chat__context-item:hover {
  background: var(--chat-surface-hover, rgba(0, 0, 0, 0.06));
}
</style>
