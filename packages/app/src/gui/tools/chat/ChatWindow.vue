<template>
  <MobileWindow
    :visible="visible"
    :title="view === 'rooms' ? t('chat.title') : currentRoom?.name || ''"
    :show-back="true"
    @close="$emit('close')"
    @back="view === 'rooms' ? $emit('close') : (view = 'rooms')"
  >
    <div class="mobile-chat" :style="chatThemeStyles">
      <!-- View: Room List -->
      <div v-if="view === 'rooms'" class="mobile-chat__rooms-view">
        <div class="mobile-chat__search-bar">
          <svg
            class="mobile-chat__search-icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
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
            class="mobile-chat__search-input"
            :placeholder="t('chat.searchRooms')"
          />
        </div>

        <div class="mobile-chat__room-list">
          <div v-if="loadingRooms" class="mobile-chat__loading">
            <div class="mobile-chat__loading-dot" />
            <div class="mobile-chat__loading-dot" />
            <div class="mobile-chat__loading-dot" />
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
              class="mobile-chat__room-item"
              @click="enterRoom(room.id)"
            >
              <div class="mobile-chat__room-avatar">{{ room.name.charAt(0).toUpperCase() }}</div>
              <div class="mobile-chat__room-body">
                <div class="mobile-chat__room-top">
                  <span class="mobile-chat__room-name">{{ room.name }}</span>
                  <span class="mobile-chat__room-time">{{
                    formatRoomTime(room.last_message_time)
                  }}</span>
                </div>
                <div class="mobile-chat__room-bottom">
                  <span class="mobile-chat__room-preview">
                    <template v-if="room.last_message">
                      <span class="mobile-chat__room-sender">{{ room.last_message_sender }}: </span>
                      {{ truncateMessage(room.last_message) }}
                    </template>
                    <template v-else>{{ t('chat.emptyState') }}</template>
                  </span>
                  <span v-if="getUnreadCount(room.id) > 0" class="mobile-chat__room-badge">{{
                    getUnreadCount(room.id)
                  }}</span>
                </div>
              </div>
            </div>

            <button class="mobile-chat__add-room-btn" @click="showCreateRoom = true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 4v12M4 10h12"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
              <span>{{ t('chat.createRoom') }}</span>
            </button>
          </template>
        </div>

        <button class="mobile-chat__nickname-btn" @click="openNicknameDialog">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="6" r="4" stroke="currentColor" stroke-width="1.3" />
            <path
              d="M2 14c0-3 2.5-5 6-5s6 2 6 5"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linecap="round"
            />
          </svg>
          <span>{{ authStore.nickname || t('chat.setNickname') }}</span>
        </button>
      </div>

      <!-- View: Chat -->
      <div v-else class="mobile-chat__chat-view">
        <div ref="messagesRef" class="mobile-chat__messages">
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
            DEBUG: 鎴块棿={{ currentRoomId }} 娑堟伅鏁?{{ messages.length }} 鏈€鍚嶪D={{
              messages[messages.length - 1]?.id || '?'
            }}
          </div>
          <div v-if="messages.length === 0 && !loading" class="mobile-chat__empty">
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
            v-for="msg in messages"
            :key="msg.tempId || msg.id"
            class="chat-bubble"
            :class="{
              'chat-bubble--self': msg.isSelf,
              'chat-bubble--sending': msg.sending,
              'chat-bubble--error': msg.error,
            }"
            @touchstart="onMessageTouchStart($event, msg)"
            @touchend="onMessageTouchEnd"
            @touchmove="onMessageTouchEnd"
            @contextmenu.prevent
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
              {{ msg.error }} 路
              <span class="chat-bubble__retry">{{ t('chat.retry') }}</span>
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

        <div
          class="mobile-chat__ws-status"
          :class="`mobile-chat__ws-status--${ws.connectionState.value}`"
        >
          <span class="mobile-chat__ws-dot" />
          <span class="mobile-chat__ws-text">{{ wsStatusLabel }}</span>
        </div>

        <div class="mobile-chat__input-bar">
          <div v-if="editingMessageId" class="mobile-chat__edit-hint">
            <span>{{ t('chat.editing') }}</span>
            <button class="mobile-chat__edit-cancel" @click="cancelEdit">
              {{ t('common.cancel') }}
            </button>
          </div>
          <textarea
            ref="inputRef"
            v-model="inputContent"
            class="mobile-chat__input"
            :placeholder="t('chat.placeholder')"
            :disabled="sending || rateLimited"
            rows="1"
            @keydown.enter.exact.prevent="sendOrEditMessage"
            @input="autoResizeInput"
          />
          <button
            class="mobile-chat__send-btn"
            :disabled="!inputContent.trim() || sending || rateLimited"
            @click="sendOrEditMessage"
          >
            <svg v-if="!sending" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 10L17 3L10 17L9 11L3 10Z" fill="currentColor" />
            </svg>
            <div v-else class="mobile-chat__spinner" />
          </button>
        </div>
      </div>

      <!-- Create Room Dialog -->
      <Transition name="mobile-fade">
        <div
          v-if="showCreateRoom"
          class="mobile-chat__dialog-overlay"
          @click.self="showCreateRoom = false"
        >
          <div class="mobile-chat__dialog">
            <h3 class="mobile-chat__dialog-title">{{ t('chat.createRoom') }}</h3>
            <input
              v-model="newRoomName"
              type="text"
              class="mobile-chat__dialog-input"
              :placeholder="t('chat.roomPlaceholder')"
              maxlength="50"
            />
            <textarea
              v-model="newRoomDescription"
              class="mobile-chat__dialog-textarea"
              :placeholder="t('chat.descriptionOptional')"
              maxlength="200"
              rows="3"
            />
            <div class="mobile-chat__dialog-actions">
              <button class="mobile-chat__dialog-btn" @click="showCreateRoom = false">
                {{ t('common.cancel') }}
              </button>
              <button
                class="mobile-chat__dialog-btn mobile-chat__dialog-btn--primary"
                :disabled="creatingRoom"
                @click="createRoom"
              >
                <div v-if="creatingRoom" class="mobile-chat__dialog-spinner" />
                <span v-else>{{ t('common.create') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Nickname Dialog -->
      <Transition name="mobile-fade">
        <div
          v-if="showNicknameDialog"
          class="mobile-chat__dialog-overlay"
          @click.self="showNicknameDialog = false"
        >
          <div class="mobile-chat__dialog">
            <h3 class="mobile-chat__dialog-title">{{ t('chat.setNickname') }}</h3>
            <input
              v-model="newNickname"
              type="text"
              class="mobile-chat__dialog-input"
              :placeholder="t('chat.nicknamePlaceholder')"
              maxlength="30"
              @input="onNicknameInput"
              @keyup.enter="saveNickname"
            />
            <div v-if="nicknameCheckStatus === 'taken'" class="mobile-chat__dialog-error">
              Nickname already taken
            </div>
            <div v-if="nicknameCheckStatus === 'checking'" class="mobile-chat__dialog-hint">
              Checking...
            </div>
            <div v-if="nicknameCheckStatus === 'available'" class="mobile-chat__dialog-success">
              Available
            </div>
            <div v-if="nicknameSaveError" class="mobile-chat__dialog-error">
              {{ nicknameSaveError }}
            </div>
            <div class="mobile-chat__dialog-actions">
              <button
                class="mobile-chat__dialog-btn"
                :disabled="savingNickname"
                @click="showNicknameDialog = false"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                class="mobile-chat__dialog-btn mobile-chat__dialog-btn--primary"
                :disabled="
                  !newNickname.trim() ||
                  savingNickname ||
                  nicknameCheckStatus === 'taken' ||
                  nicknameCheckStatus === 'checking'
                "
                @click="saveNickname"
              >
                <div v-if="savingNickname" class="mobile-chat__dialog-spinner" />
                <span v-else>{{ t('common.save') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Action Sheet -->
      <Transition name="mobile-fade">
        <div
          v-if="showActionSheet"
          class="mobile-chat__action-overlay"
          @click.self="showActionSheet = false"
        >
          <div class="mobile-chat__action-sheet">
            <button class="mobile-chat__action-item" @click="startEdit(actionSheetMsg)">
              <svg
                width="18"
                height="18"
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
              class="mobile-chat__action-item mobile-chat__action-item--danger"
              @click="startDelete(actionSheetMsg)"
            >
              <svg
                width="18"
                height="18"
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
            <div class="mobile-chat__action-divider" />
            <button class="mobile-chat__action-item" @click="showActionSheet = false">
              {{ t('common.cancel') }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
import { useThemeStore } from '../../stores/themeStore'
import { useChat } from '../../composables/useChat'
import { useI18n } from '../../composables/useI18n'
import type { ChatMessage } from '../../types/chat'

interface Props {
  visible: boolean
}

defineProps<Props>()
defineEmits<{ close: [] }>()

const themeStore = useThemeStore()
themeStore.init()

const { t } = useI18n()
const messagesRef = ref<HTMLElement>()
const inputRef = ref<HTMLTextAreaElement>()
const editingMessageId = ref<number | null>(null)
const showActionSheet = ref(false)
const actionSheetMsg = ref<ChatMessage | null>(null)
let longPressTimer: number | null = null

const {
  authStore,
  view,
  inputContent,
  messages,
  rooms,
  currentRoomId,
  currentRoom,
  loading,
  sending,
  rateLimitWarning,
  rateLimited,
  loadingRooms,
  creatingRoom,
  showNicknameDialog,
  newNickname,
  savingNickname,
  nicknameCheckStatus,
  nicknameSaveError,
  roomSearchQuery,
  filteredRooms,
  showCreateRoom,
  newRoomName,
  newRoomDescription,
  ws,
  wsStatusLabel,
  getUnreadCount,
  createRoom,
  enterRoom,
  sendMessage,
  editMessage,
  deleteMessage,
  retryMessage,
  openNicknameDialog,
  onNicknameInput,
  saveNickname,
  formatTime,
  formatRoomTime,
  truncateMessage,
} = useChat({ scrollToBottom, connectOnMount: false })

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

onUnmounted(() => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
})

function autoResizeInput() {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 100) + 'px'
  }
}

function sendOrEditMessage() {
  if (editingMessageId.value) {
    confirmEdit()
  } else {
    void sendMessage().then(autoResizeInput)
  }
}

function onMessageTouchStart(_event: TouchEvent, msg: ChatMessage) {
  if (!msg.isSelf || msg.sending || !msg.id) return
  if (longPressTimer) clearTimeout(longPressTimer)
  longPressTimer = window.setTimeout(() => {
    actionSheetMsg.value = msg
    showActionSheet.value = true
    longPressTimer = null
  }, 500)
}

function onMessageTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function startEdit(msg: ChatMessage | null) {
  showActionSheet.value = false
  if (!msg || !msg.id) return
  editingMessageId.value = msg.id
  inputContent.value = msg.content
  void nextTick(() => inputRef.value?.focus())
}

function cancelEdit() {
  editingMessageId.value = null
  inputContent.value = ''
  void nextTick(autoResizeInput)
}

function confirmEdit() {
  if (!editingMessageId.value) return
  const content = inputContent.value.trim()
  if (!content) return
  const sent = editMessage(editingMessageId.value, content)
  if (sent) cancelEdit()
}

async function startDelete(msg: ChatMessage | null) {
  showActionSheet.value = false
  if (!msg || !msg.id) return
  await deleteMessage(msg.id)
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTo({
      top: messagesRef.value.scrollHeight,
      behavior: 'smooth',
    })
  }
}
</script>

<style scoped>
.mobile-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--chat-bg, #1c1c1e);
  position: relative;
}

/* 鈹€鈹€ Rooms View 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */
.mobile-chat__rooms-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mobile-chat__search-bar {
  position: relative;
  padding: 8px 12px;
  background: var(--chat-surface, #2c2c2e);
  border-bottom: 0.5px solid var(--chat-border, #38383a);
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
  background: var(--chat-bg, #1c1c1e);
  color: var(--chat-text-primary, #ffffff);
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
}

.mobile-chat__search-input::placeholder {
  color: var(--chat-text-tertiary, #636366);
}

/* 鈹€鈹€ Room List 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */
.mobile-chat__room-list {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--chat-border, #38383a) transparent;
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

.mobile-chat__room-item:active {
  background: var(--chat-surface-hover, #3a3a3c);
}

.mobile-chat__room-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--chat-surface-hover, #3a3a3c);
  color: var(--chat-text-primary, #ffffff);
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
  color: var(--chat-text-primary, #ffffff);
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
  color: var(--chat-text-secondary, #8e8e93);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.mobile-chat__room-sender {
  font-weight: 600;
}

.mobile-chat__room-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--chat-error, #ff3b30);
  color: var(--gui-text-primary, #ffffff);
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
  border: 1px dashed var(--chat-border, #38383a);
  background: transparent;
  color: var(--chat-text-secondary, #8e8e93);
  font-size: 15px;
  cursor: pointer;
  transition: background 0.15s;
  min-height: 48px;
}

.mobile-chat__add-room-btn:active {
  background: var(--chat-surface-hover, #3a3a3c);
}

.mobile-chat__nickname-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border: none;
  background: transparent;
  color: var(--chat-text-secondary, #8e8e93);
  cursor: pointer;
  border-top: 0.5px solid var(--chat-border, #38383a);
  width: 100%;
  text-align: left;
  font-size: 14px;
  min-height: 48px;
}

.mobile-chat__nickname-btn:active {
  background: var(--chat-surface-hover, #3a3a3c);
}

/* 鈹€鈹€ Chat View 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */
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
  scrollbar-color: var(--chat-border, #38383a) var(--chat-bg, #1c1c1e);
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

.mobile-chat__empty p {
  font-size: 15px;
  margin: 0;
}

/* 鈹€鈹€ Chat Bubbles 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */
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
  color: var(--chat-text-secondary, #8e8e93);
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

/* 鈹€鈹€ Rate Warning 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */
.mobile-chat__rate-warning {
  padding: 8px 12px;
  background: var(--chat-error, #ff3b30);
  color: var(--gui-text-primary, #ffffff);
  font-size: 13px;
  text-align: center;
}

.mobile-chat__ws-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 3px 10px;
  font-size: 10px;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.02));
  border-top: 0.5px solid rgba(255, 255, 255, 0.04);
}

.mobile-chat__ws-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.mobile-chat__ws-status--connected .mobile-chat__ws-dot {
  background: var(--gui-success, #34c759);
  box-shadow: 0 0 5px var(--gui-success-bg, rgba(52, 199, 89, 0.5));
}
.mobile-chat__ws-status--connecting .mobile-chat__ws-dot {
  background: var(--gui-warning, #ff9500);
  animation: mwsPulse 1s ease-in-out infinite;
}
.mobile-chat__ws-status--reconnecting .mobile-chat__ws-dot {
  background: var(--gui-warning, #ff9500);
  animation: mwsPulse 1s ease-in-out infinite;
}
.mobile-chat__ws-status--disconnected .mobile-chat__ws-dot {
  background: var(--gui-error, #ff3b30);
}

.mobile-chat__ws-text {
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.35));
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
}

.mobile-chat__ws-status--connected .mobile-chat__ws-text {
  color: rgba(52, 199, 89, 0.6);
}
.mobile-chat__ws-status--disconnected .mobile-chat__ws-text {
  color: rgba(255, 59, 48, 0.6);
}

@keyframes mwsPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* 鈹€鈹€ Loading 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */
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
  background: var(--chat-accent, #007aff);
  animation: chat-bounce 1.2s ease-in-out infinite;
}

.mobile-chat__loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.mobile-chat__loading-dot:nth-child(3) {
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

/* 鈹€鈹€ Input Bar 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */
.mobile-chat__input-bar {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px;
  background: var(--chat-surface, #2c2c2e);
  border-top: 0.5px solid var(--chat-border, #38383a);
  padding-bottom: max(10px, env(safe-area-inset-bottom));
}

.mobile-chat__input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 20px;
  border: none;
  background: var(--chat-bg, #1c1c1e);
  color: var(--chat-text-primary, #ffffff);
  font-size: 16px;
  outline: none;
  resize: none;
  font-family: inherit;
  line-height: 1.4;
  max-height: 100px;
  min-height: 44px;
  box-sizing: border-box;
}

.mobile-chat__input::placeholder {
  color: var(--chat-text-tertiary, #636366);
}

.mobile-chat__send-btn {
  width: 44px;
  height: 44px;
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

.mobile-chat__send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.mobile-chat__send-btn:not(:disabled):active {
  transform: scale(0.95);
}

.mobile-chat__spinner {
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

.mobile-chat__edit-hint {
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

.mobile-chat__edit-cancel {
  background: none;
  border: none;
  color: var(--chat-text-secondary, #8e8e93);
  font-size: 11px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.mobile-chat__edit-cancel:active {
  color: var(--chat-text-primary, #ffffff);
  background: var(--chat-surface-hover, #3a3a3c);
}

.chat-bubble__edited {
  margin-left: 6px;
  font-size: 10px;
  color: var(--chat-text-tertiary, #636366);
  font-style: italic;
}

.mobile-chat__action-overlay {
  position: fixed;
  inset: 0;
  background: var(--gui-backdrop-bg, rgba(0, 0, 0, 0.5));
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 12px 24px;
}

.mobile-chat__action-sheet {
  width: 100%;
  max-width: 400px;
  background: var(--chat-surface, #2c2c2e);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.mobile-chat__action-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: none;
  background: transparent;
  color: var(--chat-text-primary, #ffffff);
  font-size: 16px;
  cursor: pointer;
  transition: background 0.1s;
}

.mobile-chat__action-item:active {
  background: var(--chat-surface-hover, #3a3a3c);
}

.mobile-chat__action-item--danger {
  color: var(--chat-error, #ff3b30);
}

.mobile-chat__action-divider {
  height: 0.5px;
  background: var(--chat-border, #38383a);
}

/* 鈹€鈹€ Dialogs 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */
.mobile-chat__dialog-overlay {
  position: absolute;
  inset: 0;
  background: var(--gui-backdrop-bg, rgba(0, 0, 0, 0.5));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}

.mobile-chat__dialog {
  width: 100%;
  max-width: 320px;
  background: var(--chat-surface, #2c2c2e);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.mobile-chat__dialog-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--chat-text-primary, #ffffff);
  margin: 0 0 16px;
}

.mobile-chat__dialog-input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  border: 0.5px solid var(--chat-border, #38383a);
  background: var(--chat-bg, #1c1c1e);
  color: var(--chat-text-primary, #ffffff);
  font-size: 16px;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 12px;
}

.mobile-chat__dialog-textarea {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 0.5px solid var(--chat-border, #38383a);
  background: var(--chat-bg, #1c1c1e);
  color: var(--chat-text-primary, #ffffff);
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
  background: var(--chat-surface-hover, #3a3a3c);
  color: var(--chat-text-primary, #ffffff);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.mobile-chat__dialog-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.mobile-chat__dialog-btn--primary {
  background: var(--chat-accent, #007aff);
}

.mobile-chat__dialog-error {
  font-size: 13px;
  color: var(--chat-error, #ff3b30);
  margin-bottom: 8px;
}

.mobile-chat__dialog-hint {
  font-size: 13px;
  color: var(--chat-text-tertiary, #636366);
  margin-bottom: 8px;
}

.mobile-chat__dialog-success {
  font-size: 13px;
  color: var(--gui-success, #34c759);
  margin-bottom: 8px;
}

.mobile-chat__dialog-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--gui-border-strong, rgba(255, 255, 255, 0.3));
  border-top-color: var(--gui-text-primary, #ffffff);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

/* 鈹€鈹€ Transitions 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */
.mobile-fade-enter-active,
.mobile-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mobile-fade-enter-from,
.mobile-fade-leave-to {
  opacity: 0;
}

/* 鈹€鈹€ Light Mode Overrides 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */
.light .mobile-chat__emoji-picker {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.light .mobile-chat__action-menu {
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
}
.light .mobile-chat__dialog-btn {
  background: var(--chat-surface-hover, rgba(0, 0, 0, 0.06));
  color: var(--chat-text-primary, #000000);
}
.light .mobile-chat__dialog-btn--primary {
  background: var(--chat-accent-soft, rgba(99, 99, 102, 0.15));
  color: var(--chat-accent, #636366);
}
.light .chat-bubble--self .chat-bubble__content {
  background: var(--chat-accent-soft, rgba(99, 99, 102, 0.15));
  color: var(--chat-accent, #636366);
}
.light .mobile-chat__send-btn {
  background: var(--chat-accent-soft, rgba(99, 99, 102, 0.15));
  color: var(--chat-accent, #636366);
}
.light .mobile-chat__action-btn {
  color: var(--chat-text-secondary, #6e6e73);
}
.light .mobile-chat__action-btn:active {
  background: rgba(0, 0, 0, 0.06);
}
.light .mobile-chat__edit-hint {
  background: var(--chat-bg, #f2f2f7);
}
.light .mobile-chat__edit-cancel:active {
  background: rgba(0, 0, 0, 0.06);
  color: var(--chat-text-primary, #000000);
}
.light .mobile-chat__action-sheet {
  background: var(--chat-surface, #ffffff);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.light .mobile-chat__action-item {
  color: var(--chat-text-primary, #000000);
}
.light .mobile-chat__action-item:active {
  background: var(--chat-surface-hover, rgba(0, 0, 0, 0.06));
}
.light .mobile-chat__action-divider {
  background: var(--chat-border, #e5e5ea);
}
</style>
