<template>
  <MobileWindow
    :visible="visible"
    title="Chat"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="chat-app k-ios-page k-ios-page--dark">
      <!-- Messages List -->
      <div class="chat-app__messages gui-scrollable" ref="messagesRef">
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
          <div v-if="msg.sending" class="chat-bubble__status">Sending...</div>
          <div v-else-if="msg.error" class="chat-bubble__status chat-bubble__status--error">{{ msg.error }}</div>
        </div>

        <!-- Loading Indicator -->
        <div v-if="loading" class="chat-app__loading">
          <div class="chat-app__loading-dot" />
          <div class="chat-app__loading-dot" />
          <div class="chat-app__loading-dot" />
        </div>
      </div>

      <!-- Input Bar -->
      <div class="chat-app__input-bar">
        <input
          v-model="inputContent"
          type="text"
          class="chat-app__input"
          placeholder="Type a message..."
          :disabled="sending"
          @keyup.enter="sendMessage"
        />
        <button
          class="chat-app__send-btn"
          :disabled="!inputContent.trim() || sending"
          @click="sendMessage"
        >
          <svg v-if="!sending" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 10L17 3L10 17L9 11L3 10Z" fill="currentColor"/>
          </svg>
          <div v-else class="chat-app__spinner" />
        </button>
      </div>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
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
}

defineProps<Props>()

const API_BASE = config.api.workerUrl
const POLL_INTERVAL = 30000 // 30 seconds
const MAX_MESSAGES = 100

const messagesRef = ref<HTMLElement>()
const inputContent = ref('')
const messages = reactive<ChatMessage[]>([])
const loading = ref(false)
const sending = ref(false)
let pollTimer: number | null = null
let userId = ''

const displayMessages = computed(() => messages)

onMounted(async () => {
  userId = await indexedDBService.getUserId()
  await loadMessages()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

async function loadMessages() {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/chat/messages?limit=${MAX_MESSAGES}`)
    const data = await response.json()

    if (data.success && data.data) {
      const serverMessages = (data.data as ChatMessage[]).map(msg => ({
        ...msg,
        isSelf: msg.user_id === userId,
      }))

      // 合并本地乐观更新的消息和服务器消息
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
  if (!content || sending.value) return

  const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const now = new Date().toISOString()

  // 乐观更新
  const optimisticMessage: ChatMessage = {
    tempId,
    user_id: userId,
    username: 'You',
    content,
    created_at: now,
    isSelf: true,
    sending: true,
  }

  messages.push(optimisticMessage)
  inputContent.value = ''
  sending.value = true

  await nextTick()
  scrollToBottom()

  try {
    const response = await fetch(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        username: 'Anonymous',
        content,
      }),
    })

    const data = await response.json()

    if (data.success && data.data) {
      // 更新乐观消息为服务器返回的真实数据
      const idx = messages.findIndex(m => m.tempId === tempId)
      if (idx !== -1) {
        messages[idx] = {
          ...data.data,
          isSelf: true,
        }
      }
    } else {
      // 标记发送失败
      const idx = messages.findIndex(m => m.tempId === tempId)
      if (idx !== -1) {
        messages[idx].sending = false
        messages[idx].error = data.error || 'Failed to send'
      }
    }
  } catch (error) {
    console.error('[Chat] Failed to send message:', error)
    const idx = messages.findIndex(m => m.tempId === tempId)
    if (idx !== -1) {
      messages[idx].sending = false
      messages[idx].error = 'Network error'
    }
  } finally {
    sending.value = false
  }
}

function startPolling() {
  stopPolling()
  pollTimer = window.setInterval(() => {
    loadMessages()
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
  background: var(--gui-terminal-bg, #1C1C1E);
}

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
  color: var(--gui-text-secondary, #8E8E93);
}

.chat-bubble__time {
  font-size: 10px;
  color: var(--gui-text-tertiary, #636366);
}

.chat-bubble__content {
  max-width: 85%;
  padding: 8px 12px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  background: var(--gui-bg-surface, #2C2C2E);
  color: var(--gui-text-primary, #FFFFFF);
}

.chat-bubble--self .chat-bubble__content {
  background: #007AFF;
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
  color: var(--gui-text-tertiary, #636366);
  margin-top: 2px;
  padding: 0 4px;
}

.chat-bubble__status--error {
  color: #FF3B30;
}

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
  background: var(--gui-accent, #007AFF);
  animation: ios-bounce 1.2s ease-in-out infinite;
}

.chat-app__loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.chat-app__loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

.chat-app__input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  background: var(--gui-bg-surface, #2C2C2E);
  border-top: 0.5px solid var(--gui-border, #38383A);
}

.chat-app__input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border-radius: 18px;
  border: none;
  background: var(--gui-bg-surface-hover, #3A3A3C);
  color: var(--gui-text-primary, #FFFFFF);
  font-size: 14px;
  outline: none;
}

.chat-app__input::placeholder {
  color: var(--gui-text-tertiary, #636366);
}

.chat-app__send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #007AFF;
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
