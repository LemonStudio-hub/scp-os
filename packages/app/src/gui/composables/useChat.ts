import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { config } from '../../config'
import { useAuthStore } from '../../stores/authStore'
import indexedDBService from '../../utils/indexedDB'
import { dialogService } from './useDialog'
import { useI18n } from './useI18n'
import { useChatWebSocket, type WSChatMessage } from './useChatWebSocket'
import type { ChatMessage, ChatRoom } from '../types/chat'

const API_BASE = config.api.workerUrl
const MAX_RETRY = 3
const UNREAD_KEY = 'chat_unread_counts'

interface UseChatOptions {
  scrollToBottom?: () => void
  initialView?: 'rooms' | 'chat'
  connectOnMount?: boolean
  selectFirstRoomOnLoad?: boolean
}

export function useChat(options: UseChatOptions = {}) {
  const authStore = useAuthStore()
  const { t } = useI18n()

  const view = ref<'rooms' | 'chat'>(options.initialView || 'rooms')
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

  const userId = ref('')
  let nicknameCheckTimer: number | null = null

  const ws = useChatWebSocket({
    apiUrl: API_BASE,
    userId: '',
    username: '',
    roomId: 1,
    onMessage: handleWsMessage,
    onHistory: handleWsHistory,
    onUsersUpdate: (_users, count) => {
      if (currentRoom.value) currentRoom.value.member_count = count
    },
    onUserJoined: (data) => {
      if (currentRoom.value) currentRoom.value.member_count = data.count
    },
    onUserLeft: (data) => {
      if (currentRoom.value) currentRoom.value.member_count = data.count
    },
    onMessageEdited: (data) => {
      const idx = messages.findIndex((m) => m.id === data.id)
      if (idx !== -1) {
        messages.splice(idx, 1, { ...messages[idx], content: data.content, edited: true })
      }
    },
    onMessageDeleted: (data) => {
      const idx = messages.findIndex((m) => m.id === data.id)
      if (idx !== -1) messages.splice(idx, 1)
    },
    onError: (error) => {
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
    if (ws.connectionState.value === 'connected') return 'Connected'
    if (ws.connectionState.value === 'connecting') return 'Connecting...'
    if (ws.connectionState.value === 'reconnecting') return 'Reconnecting...'
    return ws.lastError.value || 'Disconnected'
  })

  onMounted(async () => {
    userId.value = authStore.userId || (await indexedDBService.getUserId())
    await loadUnreadCounts()
    await loadRooms()
    if (options.selectFirstRoomOnLoad && rooms.length > 0) {
      currentRoomId.value = rooms[0].id
    }
    if (options.connectOnMount !== false) {
      ws.setCredentials(userId.value, authStore.nickname || 'Anonymous')
      if (options.selectFirstRoomOnLoad && currentRoomId.value) {
        ws.switchRoom(currentRoomId.value)
      } else {
        ws.connect()
      }
      void loadHistoryFromAPI(currentRoomId.value)
    }
  })

  onUnmounted(() => {
    if (nicknameCheckTimer) clearTimeout(nicknameCheckTimer)
  })

  watch(
    () => authStore.nickname,
    (nickname) => {
      if (nickname) ws.updateUsername(nickname)
    }
  )

  function handleWsMessage(msg: WSChatMessage): void {
    const chatMsg: ChatMessage = { ...msg, isSelf: msg.user_id === userId.value }
    const existingIdx = msg.tempId
      ? messages.findIndex((m) => m.sending && m.tempId === msg.tempId)
      : messages.findIndex(
          (m) => m.sending && m.content === msg.content && m.user_id === msg.user_id
        )
    if (existingIdx !== -1) {
      messages.splice(existingIdx, 1, { ...chatMsg, tempId: messages[existingIdx].tempId })
    } else if (!messages.some((m) => m.id === msg.id && !m.tempId)) {
      messages.push(chatMsg)
    }
    void nextTick(() => options.scrollToBottom?.())
  }

  function handleWsHistory(msgs: WSChatMessage[]): void {
    const pending = messages.filter((m) => m.sending && m.tempId)
    messages.splice(0, messages.length)
    for (const msg of msgs) {
      messages.push({ ...msg, isSelf: msg.user_id === userId.value })
    }
    for (const pendingMessage of pending) {
      const alreadyExists = messages.some(
        (m) =>
          m.tempId === pendingMessage.tempId ||
          (m.content === pendingMessage.content && m.user_id === pendingMessage.user_id)
      )
      if (!alreadyExists) messages.push(pendingMessage)
    }
    loading.value = false
    void nextTick(() => options.scrollToBottom?.())
  }

  async function loadUnreadCounts(): Promise<void> {
    try {
      await indexedDBService.init()
      const saved = await indexedDBService.loadSetting(UNREAD_KEY)
      unreadCounts.value = saved ? (saved as Record<number, number>) : {}
    } catch {
      unreadCounts.value = {}
    }
  }

  async function persistUnreadCounts(): Promise<void> {
    try {
      await indexedDBService.saveSetting(UNREAD_KEY, unreadCounts.value)
    } catch {
      // ignore
    }
  }

  function getUnreadCount(roomId: number): number {
    return unreadCounts.value[roomId] || 0
  }

  function setUnreadCount(roomId: number, count: number): void {
    unreadCounts.value = { ...unreadCounts.value, [roomId]: count }
    void persistUnreadCounts()
  }

  function markRoomAsRead(roomId: number): void {
    setUnreadCount(roomId, 0)
  }

  async function loadRooms(): Promise<void> {
    loadingRooms.value = true
    try {
      const response = await fetch(`${API_BASE}/chat/rooms?t=${Date.now()}`, { cache: 'no-cache' })
      const data = await response.json()
      if (data.success && data.data) {
        const oldRooms = new Map(rooms.map((r) => [r.id, r]))
        rooms.splice(0, rooms.length)
        for (const room of data.data as ChatRoom[]) {
          const oldRoom = oldRooms.get(room.id)
          if (
            oldRoom &&
            room.message_count > oldRoom.message_count &&
            room.id !== currentRoomId.value
          ) {
            setUnreadCount(
              room.id,
              getUnreadCount(room.id) + room.message_count - oldRoom.message_count
            )
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

  async function createRoom(): Promise<void> {
    if (!newRoomName.value.trim()) return
    creatingRoom.value = true
    try {
      const effectiveUserId =
        authStore.userId || userId.value || (await indexedDBService.getUserId())
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

  async function switchRoom(roomId: number): Promise<void> {
    if (!userId.value) userId.value = authStore.userId || (await indexedDBService.getUserId())
    if (currentRoomId.value === roomId && view.value === 'chat') return
    currentRoomId.value = roomId
    messages.splice(0, messages.length)
    markRoomAsRead(roomId)
    view.value = 'chat'
    ws.setCredentials(userId.value, authStore.nickname || 'Anonymous')
    ws.switchRoom(roomId)
    await loadHistoryFromAPI(roomId)
  }

  const enterRoom = switchRoom

  async function loadHistoryFromAPI(roomId: number): Promise<void> {
    if (messages.length > 0) return
    loading.value = true
    try {
      const response = await fetch(`${API_BASE}/chat/messages?limit=50&room_id=${roomId}`)
      const data = await response.json()
      if (data.success && data.data && data.data.length > 0 && messages.length === 0) {
        for (const msg of data.data) {
          messages.push({ ...msg, isSelf: msg.user_id === userId.value })
        }
        void nextTick(() => options.scrollToBottom?.())
      }
    } catch {
      // WebSocket history is the fallback.
    } finally {
      loading.value = false
    }
  }

  async function sendMessage(): Promise<void> {
    const content = inputContent.value.trim()
    if (!content || sending.value || rateLimited.value) return
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const optimisticMessage: ChatMessage = {
      tempId,
      user_id: userId.value,
      username: authStore.nickname || t('chat.you'),
      content,
      created_at: new Date().toISOString(),
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
    options.scrollToBottom?.()
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

  function editMessage(messageId: number, content: string): boolean {
    return ws.editMessage(messageId, content)
  }

  async function deleteMessage(messageId: number): Promise<void> {
    if (await dialogService.confirm(t('chat.confirmDelete'))) ws.deleteMessage(messageId)
  }

  async function retryMessage(msg: ChatMessage): Promise<void> {
    if (!msg.tempId || !msg.error || (msg.retryCount || 0) >= MAX_RETRY) return
    const idx = messages.findIndex((m) => m.tempId === msg.tempId)
    if (idx === -1) return
    const updated = {
      ...messages[idx],
      sending: true,
      error: undefined,
      retryCount: (msg.retryCount || 0) + 1,
    }
    messages.splice(idx, 1, updated)
    const sent = ws.sendMessage(msg.content, msg.tempId)
    messages.splice(idx, 1, {
      ...updated,
      sending: false,
      error: sent ? undefined : t('chat.networkError'),
    })
  }

  function openRoomSettings(room: ChatRoom): void {
    editRoomName.value = room.name
    editRoomDescription.value = room.description || ''
    editRoomPublic.value = room.is_public === 1
    currentRoomId.value = room.id
    showRoomSettings.value = true
  }

  async function saveRoomSettings(): Promise<void> {
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
        if (originalRoom && roomIndex !== -1) rooms[roomIndex] = originalRoom
      }
    } catch (error) {
      console.error('[Chat] Failed to save room settings:', error)
      alert('Failed to save room settings. Please try again.')
      if (originalRoom && roomIndex !== -1) rooms[roomIndex] = originalRoom
    } finally {
      savingSettings.value = false
    }
  }

  async function deleteRoom(): Promise<void> {
    if (!currentRoom.value) return
    if (!(await dialogService.confirm('Are you sure you want to delete this room?'))) return
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

  function openNicknameDialog(): void {
    newNickname.value = authStore.nickname || ''
    nicknameCheckStatus.value = 'idle'
    nicknameSaveError.value = ''
    showNicknameDialog.value = true
  }

  async function checkNicknameAvailability(): Promise<void> {
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

  function onNicknameInput(): void {
    if (nicknameCheckTimer) clearTimeout(nicknameCheckTimer)
    nicknameCheckStatus.value = 'idle'
    nicknameSaveError.value = ''
    nicknameCheckTimer = window.setTimeout(() => {
      void checkNicknameAvailability()
    }, 500)
  }

  async function saveNickname(): Promise<void> {
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

  function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatRoomTime(dateStr?: string): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    if (diff < 60000) return t('chat.justNow')
    if (diff < 3600000) return t('chat.minAgo', { n: Math.floor(diff / 60000) })
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  function truncateMessage(message: string, maxLength = 20): string {
    return message.length > maxLength ? message.slice(0, maxLength) + '...' : message
  }

  return {
    authStore,
    view,
    inputContent,
    messages,
    displayMessages,
    rooms,
    currentRoomId,
    currentRoom,
    loading,
    sending,
    rateLimitWarning,
    rateLimited,
    loadingRooms,
    creatingRoom,
    savingSettings,
    deletingRoom,
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
    newRoomPublic,
    showRoomSettings,
    editRoomName,
    editRoomDescription,
    editRoomPublic,
    unreadCounts,
    ws,
    wsStatusLabel,
    userId,
    getUnreadCount,
    setUnreadCount,
    markRoomAsRead,
    loadUnreadCounts,
    loadRooms,
    createRoom,
    switchRoom,
    enterRoom,
    loadHistoryFromAPI,
    sendMessage,
    editMessage,
    deleteMessage,
    retryMessage,
    openRoomSettings,
    saveRoomSettings,
    deleteRoom,
    openNicknameDialog,
    checkNicknameAvailability,
    onNicknameInput,
    saveNickname,
    formatTime,
    formatRoomTime,
    truncateMessage,
  }
}
