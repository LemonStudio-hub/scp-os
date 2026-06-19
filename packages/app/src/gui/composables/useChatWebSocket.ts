import { ref, onUnmounted } from 'vue'
import { useI18n } from './useI18n'

export interface WSChatMessage {
  id?: number
  tempId?: string
  user_id: string
  username: string
  content: string
  room_id: number
  created_at: string
  is_broadcast?: number
  broadcast_count?: number
  isSelf?: boolean
  sending?: boolean
  error?: string
  retryCount?: number
}

export interface WSUser {
  user_id: string
  username: string
}

export type WSConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

interface WSIncomingMessage {
  type:
    | 'auth'
    | 'chat_message'
    | 'message'
    | 'history'
    | 'users'
    | 'heartbeat'
    | 'error'
    | 'room_info'
    | 'user_joined'
    | 'user_left'
  data?: any
}

interface UseChatWebSocketOptions {
  apiUrl: string
  userId: string
  username: string
  roomId: number
  maxReconnectAttempts?: number
  reconnectBaseDelay?: number
  heartbeatInterval?: number
  onMessage?: (msg: WSChatMessage) => void
  onHistory?: (msgs: WSChatMessage[]) => void
  onUsersUpdate?: (users: WSUser[], count: number) => void
  onUserJoined?: (data: { user_id: string; username: string; count: number }) => void
  onUserLeft?: (data: { user_id: string; username: string; count: number }) => void
  onError?: (error: string) => void
}

export function useChatWebSocket(options: UseChatWebSocketOptions) {
  const { t } = useI18n()
  const {
    apiUrl,
    userId,
    username,
    roomId,
    maxReconnectAttempts = 5,
    reconnectBaseDelay = 1000,
    heartbeatInterval = 30000,
    onMessage,
    onHistory,
    onUsersUpdate,
    onUserJoined,
    onUserLeft,
    onError,
  } = options

  const connectionState = ref<WSConnectionState>('disconnected')
  const onlineUsers = ref<WSUser[]>([])
  const onlineCount = ref(0)
  const lastError = ref<string>('')

  let ws: WebSocket | null = null
  let reconnectAttempts = 0
  let reconnectTimer: number | null = null
  let heartbeatTimer: number | null = null
  let heartbeatTimeoutTimer: number | null = null
  let currentRoomId = roomId
  let currentUserId = userId
  let currentUsername = username

  function getWsUrl(): string {
    // In dev mode, connect to the local wrangler server to avoid Cloudflare tunnel issues
    if (import.meta.env.DEV) {
      return `ws://localhost:8787/chat/ws?user_id=${encodeURIComponent(currentUserId)}&username=${encodeURIComponent(currentUsername)}&room_id=${currentRoomId}`
    }
    const base = apiUrl.startsWith('https')
      ? apiUrl.replace(/^https/, 'wss')
      : apiUrl.replace(/^http/, 'ws')
    return `${base.replace(/\/$/, '')}/chat/ws?user_id=${encodeURIComponent(currentUserId)}&username=${encodeURIComponent(currentUsername)}&room_id=${currentRoomId}`
  }

  function connect(): void {
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      return
    }

    connectionState.value = 'connecting'
    lastError.value = ''

    try {
      ws = new WebSocket(getWsUrl())
    } catch {
      connectionState.value = 'disconnected'
      lastError.value = t('chat.wsConnectFailed')
      scheduleReconnect()
      return
    }

    ws.onopen = () => {
      connectionState.value = 'connected'
      reconnectAttempts = 0
      startHeartbeat()
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg: WSIncomingMessage = JSON.parse(event.data)
        handleIncomingMessage(msg)
      } catch {}
    }

    ws.onclose = (event: CloseEvent) => {
      connectionState.value = 'disconnected'
      stopHeartbeat()

      if (event.code !== 1000 && event.code !== 4001) {
        scheduleReconnect()
      }
    }

    ws.onerror = () => {
      lastError.value = t('chat.wsError')
      connectionState.value = 'disconnected'
      onError?.(t('chat.wsError'))
    }
  }

  function disconnect(): void {
    reconnectAttempts = maxReconnectAttempts
    stopHeartbeat()
    clearReconnectTimer()

    if (ws) {
      ws.onclose = null
      ws.onerror = null
      ws.onmessage = null
      ws.close(1000, 'Client disconnect')
      ws = null
    }

    connectionState.value = 'disconnected'
  }

  function switchRoom(newRoomId: number): void {
    currentRoomId = newRoomId
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(
          JSON.stringify({
            type: 'switch_room',
            data: { room_id: newRoomId },
          })
        )
        return
      } catch {
        // fallback to reconnect
      }
    }
    disconnect()
    reconnectAttempts = 0
    connect()
  }

  function sendMessage(content: string, tempId?: string): boolean {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      lastError.value = t('chat.notConnected')
      return false
    }

    if (!content.trim()) {
      lastError.value = t('chat.emptyMessage')
      return false
    }

    if (content.length > 1000) {
      lastError.value = t('chat.messageTooLong')
      return false
    }

    try {
      ws.send(
        JSON.stringify({
          type: 'chat_message',
          data: { content: content.trim(), temp_id: tempId },
        })
      )
      return true
    } catch {
      lastError.value = t('chat.sendFailed')
      return false
    }
  }

  function updateUsername(newUsername: string): void {
    currentUsername = newUsername
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    try {
      ws.send(
        JSON.stringify({
          type: 'rename',
          data: { username: newUsername },
        })
      )
    } catch {}
  }

  function setCredentials(newUserId: string, newUsername: string): void {
    currentUserId = newUserId
    currentUsername = newUsername
  }

  function handleIncomingMessage(msg: WSIncomingMessage): void {
    switch (msg.type) {
      case 'auth':
        break

      case 'chat_message':
      case 'message':
        onMessage?.(msg.data as WSChatMessage)
        break

      case 'history':
        onHistory?.(msg.data?.messages || [])
        if (msg.data?.users) {
          onlineUsers.value = msg.data.users
          onlineCount.value = msg.data.users.length
        }
        break

      case 'users':
        onlineUsers.value = msg.data?.users || []
        onlineCount.value = msg.data?.count || 0
        onUsersUpdate?.(onlineUsers.value, onlineCount.value)
        break

      case 'user_joined':
        onUserJoined?.(msg.data)
        break

      case 'user_left':
        onUserLeft?.(msg.data)
        break

      case 'heartbeat':
        resetHeartbeatTimeout()
        break

      case 'error':
        lastError.value = msg.data?.message || 'Unknown error'
        onError?.(msg.data?.message || 'Unknown error')

        if (msg.data?.code === 'RATE_LIMIT') {
          onError?.('RATE_LIMIT')
        }
        break
    }
  }

  function startHeartbeat(): void {
    stopHeartbeat()
    heartbeatTimer = window.setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'heartbeat' }))
        } catch {}
        heartbeatTimeoutTimer = window.setTimeout(() => {
          if (ws) {
            ws.close(4000, 'Heartbeat timeout')
          }
        }, 10000)
      }
    }, heartbeatInterval)
  }

  function stopHeartbeat(): void {
    if (heartbeatTimer !== null) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    resetHeartbeatTimeout()
  }

  function resetHeartbeatTimeout(): void {
    if (heartbeatTimeoutTimer !== null) {
      clearTimeout(heartbeatTimeoutTimer)
      heartbeatTimeoutTimer = null
    }
  }

  function scheduleReconnect(): void {
    if (reconnectAttempts >= maxReconnectAttempts) {
      connectionState.value = 'disconnected'
      const msg = import.meta.env.DEV ? t('chat.serverUnavailableDev') : t('chat.serverUnavailable')
      lastError.value = msg
      onError?.(msg)
      return
    }

    connectionState.value = 'reconnecting'
    const delay = Math.min(reconnectBaseDelay * Math.pow(2, reconnectAttempts), 30000)
    reconnectAttempts++

    clearReconnectTimer()
    reconnectTimer = window.setTimeout(() => {
      connect()
    }, delay)
  }

  function clearReconnectTimer(): void {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    connectionState,
    onlineUsers,
    onlineCount,
    lastError,
    connect,
    disconnect,
    switchRoom,
    sendMessage,
    updateUsername,
    setCredentials,
  }
}
