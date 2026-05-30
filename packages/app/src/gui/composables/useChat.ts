import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { config } from '../../config'
import indexedDBService from '../../utils/indexedDB'
import { useI18n } from './useI18n'
import { useAuthStore } from '../../stores/authStore'
import { useChatWebSocket, type WSChatMessage } from './useChatWebSocket'
import type { ChatMessage, ChatRoom } from '../types/chat'

export function useChat() {
  const { t } = useI18n()
  const authStore = useAuthStore()

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
      const existingIdx = msg.tempId
        ? messages.findIndex((m) => m.sending && m.tempId === msg.tempId)
        : messages.findIndex(
            (m) => m.sending && m.content === msg.content && m.user_id === msg.user_id
          )
      if (existingIdx !== -1) {
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
      messages.splice(0, messages.length)
      for (const msg of msgs) {
        messages.push({
          ...msg,
          isSelf: msg.user_id === userId,
        })
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

  onMounted(async () => {
    userId = authStore.userId || (await indexedDBService.getUserId())
    await loadRooms()
    await loadUnreadCounts()
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
      if (stored) unreadCounts.value = stored
    } catch {}
  }

  async function loadRooms() {
    loadingRooms.value = true
    try {
      const url = `${API_BASE}/chat/rooms?t=${Date.now()}`
      const response = await fetch(url, {
        cache: 'no-cache',
      })
      const data = await response.json()
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

  async function enterRoom(roomId: number) {
    if (!userId) {
      userId = authStore.userId || (await indexedDBService.getUserId())
    }
    currentRoomId.value = roomId
    messages.splice(0, messages.length)
    markRoomAsRead(roomId)
    ws.setCredentials(userId, authStore.nickname || 'Anonymous')
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

  function autoResizeInput() {
    if (inputRef.value) {
      inputRef.value.style.height = 'auto'
      inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px'
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

    const sent = ws.sendMessage(msg.content, msg.tempId)
    if (!sent) {
      messages.splice(idx, 1, { ...updated, sending: false, error: t('chat.networkError') })
    } else {
      messages.splice(idx, 1, { ...updated, sending: false })
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
      const roomIndex = rooms.findIndex((r) => r.id === currentRoom.value?.id)
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
      const roomIndex = rooms.findIndex((r) => r.id === currentRoom.value?.id)
      if (roomIndex !== -1) {
        rooms.splice(roomIndex, 1)
        if (currentRoomId.value === currentRoom.value?.id && rooms.length > 0) {
          currentRoomId.value = rooms[0].id
          messages.splice(0, messages.length)
          ws.switchRoom(rooms[0]?.id || 1)
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

  return {
    messagesRef,
    inputRef,
    inputContent,
    messages,
    rooms,
    currentRoomId,
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
    showCreateRoom,
    newRoomName,
    newRoomDescription,
    newRoomPublic,
    showRoomSettings,
    editRoomName,
    editRoomDescription,
    editRoomPublic,
    unreadCounts,
    filteredRooms,
    currentRoom,
    wsStatusLabel,
    ws,
    getUnreadCount,
    setUnreadCount,
    markRoomAsRead,
    loadRooms,
    createRoom,
    switchRoom,
    enterRoom,
    loadHistoryFromAPI,
    autoResizeInput,
    sendMessage,
    retryMessage,
    scrollToBottom,
    formatTime,
    formatRoomTime,
    truncateMessage,
    openRoomSettings,
    saveRoomSettings,
    deleteRoom,
    openNicknameDialog,
    onNicknameInput,
    saveNickname,
  }
}
