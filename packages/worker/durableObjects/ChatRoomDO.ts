import type { ChatMessage, WSUser } from '../shared/types'
import { encodeHtmlEntities } from '../utils/htmlSanitizer'
import { createNotification } from '../api/notification'

interface WebSocketConnection {
  ws: WebSocket
  userId: string
  username: string
  roomId: number
  connectionId: string
  lastHeartbeat: number
}

interface RateLimitEntry {
  count: number
  timestamp: number
}

interface IncomingMessage {
  type: string
  data?: Record<string, unknown>
}

const HEARTBEAT_TIMEOUT_MS = 60000
const ALARM_INTERVAL_MS = 30000
const MAX_MESSAGES = 1000
const MAX_HISTORY_SEND = 100
const RATE_LIMIT = 10
const RATE_LIMIT_WINDOW = 60000
const MAX_MESSAGE_LENGTH = 1000
const MAX_USERNAME_LENGTH = 30

export class ChatRoomDO {
  private connections: Map<string, WebSocketConnection> = new Map()
  private messages: ChatMessage[] = []
  private rateLimits: Map<string, RateLimitEntry> = new Map()

  private messagesLoaded = false
  private loadedRooms = new Set<number>()

  constructor(
    private state: DurableObjectState,
    private env: { SCP_DB: D1Database },
  ) {
    // Old-style WebSocket API - no hibernation restoration needed
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/chat/ws' || url.pathname === '/ws' || /^\/chat\/room\/\d+\/ws$/.test(url.pathname)) {
      return this.handleWebSocketUpgrade(request, url)
    }

    if (url.pathname === '/chat/internal/update-nickname') {
      return this.handleNicknameUpdate(request)
    }

    return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  async alarm(): Promise<void> {
    const now = Date.now()

    for (const [id, conn] of this.connections) {
      if (now - conn.lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
        try {
          conn.ws.close(1001, 'Heartbeat timeout')
        } catch {
          // ignore
        }
        this.connections.delete(id)
        console.log(`[ChatRoomDO] Removed stale connection: ${conn.userId}`)
      }
    }

    for (const [userId, entry] of this.rateLimits) {
      if (now - entry.timestamp > RATE_LIMIT_WINDOW) {
        this.rateLimits.delete(userId)
      }
    }

    await this.state.storage.setAlarm(now + ALARM_INTERVAL_MS)
  }

  private setupWebSocketHandlers(server: WebSocket, connectionId: string, userId: string, username: string, roomId: number): void {
    server.addEventListener('message', async (event: MessageEvent) => {
      const conn = this.connections.get(connectionId)
      if (conn) {
        conn.lastHeartbeat = Date.now()
      }

      let msg: IncomingMessage
      try {
        const raw = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data)
        msg = JSON.parse(raw)
        if (!msg || typeof msg.type !== 'string') {
          this.sendErrorToAll(userId, 'INVALID_FORMAT', 'Message must have a type field')
          return
        }
      } catch {
        this.sendErrorToAll(userId, 'INVALID_JSON', 'Invalid JSON message')
        return
      }

      try {
        const conn = this.connections.get(connectionId)
        const currentRoomId = conn ? conn.roomId : roomId
        await this.handleIncomingMessage(msg, userId, username, currentRoomId, connectionId)
      } catch (error) {
        console.error('[ChatRoomDO] Unhandled error in message processing:', error)
        this.sendErrorToAll(userId, 'INTERNAL_ERROR', 'Internal error processing message')
      }
    })

    server.addEventListener('close', async () => {
      this.connections.delete(connectionId)
      try {
        await this.broadcastUserLeft(userId, username, roomId)
      } catch (error) {
        console.error('[ChatRoomDO] Failed to broadcast user left:', error)
      }
    })

    server.addEventListener('error', async () => {
      console.error('[ChatRoomDO] WebSocket error for connection:', connectionId)
      this.connections.delete(connectionId)
      try {
        await this.broadcastUserLeft(userId, username, roomId)
      } catch {
        // ignore
      }
      try {
        server.close(1011, 'WebSocket error')
      } catch {
        // already closed
      }
    })
  }

  private async handleWebSocketUpgrade(request: Request, url: URL): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response(JSON.stringify({ success: false, error: 'Expected WebSocket upgrade' }), {
        status: 426,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userId = url.searchParams.get('user_id')
    const username = url.searchParams.get('username') || 'Anonymous'
    const roomId = parseInt(url.searchParams.get('room_id') || '1', 10)

    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing user_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { 0: client, 1: server } = new WebSocketPair()

    const connectionId = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    this.connections.set(connectionId, {
      ws: server,
      userId,
      username,
      roomId,
      connectionId,
      lastHeartbeat: Date.now(),
    })

    server.accept()
    this.setupWebSocketHandlers(server, connectionId, userId, username, roomId)

    await this.loadMessages(roomId)
    await this.sendHistory(server, roomId)
    await this.broadcastUserJoined(userId, username, roomId)

    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }

  private async handleNicknameUpdate(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const body = (await request.json()) as { userId?: string; username?: string }
      const { userId, username } = body

      if (!userId || !username || username.length > MAX_USERNAME_LENGTH) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid request' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      for (const [, conn] of this.connections) {
        if (conn.userId === userId) {
          conn.username = username
          try {
            conn.ws.serializeAttachment({
              ...(conn.ws.deserializeAttachment() || {}),
              username,
            })
          } catch {
            // ignore
          }
        }
      }

      try {
        await this.env.SCP_DB.prepare(
          'INSERT OR REPLACE INTO user_settings (key, value, updatedAt) VALUES (?, ?, ?)',
        )
          .bind(`nickname_${userId}`, username, new Date().toISOString())
          .run()
      } catch (error) {
        console.error('[ChatRoomDO] Failed to save nickname:', error)
      }

      return new Response(JSON.stringify({ success: true, data: { userId, username } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  private async loadMessages(roomId: number): Promise<void> {
    if (this.loadedRooms.has(roomId)) return
    await this.refreshMessages(roomId)
  }

  private async refreshMessages(roomId: number): Promise<void> {
    try {
      const result = await this.env.SCP_DB.prepare(
        'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at DESC LIMIT ?',
      )
        .bind(roomId, MAX_MESSAGES)
        .all<ChatMessage>()

      const roomMessages = (result.results || []).reverse()
      this.messages = this.messages.filter((m) => m.room_id !== roomId).concat(roomMessages)
      this.loadedRooms.add(roomId)
      this.messagesLoaded = true
    } catch (error) {
      console.error('[ChatRoomDO] Failed to load messages:', error)
    }
  }

  private async sendHistory(ws: WebSocket, roomId: number): Promise<void> {
    const roomMessages = this.messages
      .filter((m) => m.room_id === roomId)
      .slice(-MAX_HISTORY_SEND)

    const users = this.getOnlineUsers(roomId)

    try {
      ws.send(
        JSON.stringify({
          type: 'history',
          data: {
            messages: roomMessages,
            users,
            totalCount: this.messages.filter((m) => m.room_id === roomId).length,
          },
        }),
      )
    } catch (error) {
      console.error('[ChatRoomDO] Failed to send history (possible bigint):', error)
      // Fallback: sanitize bigint values
      try {
        const safeMessages = roomMessages.map((m) => ({
          ...m,
          id: typeof m.id === 'bigint' ? Number(m.id) : m.id,
          room_id: typeof m.room_id === 'bigint' ? Number(m.room_id) : m.room_id,
          is_broadcast: typeof m.is_broadcast === 'bigint' ? Number(m.is_broadcast) : m.is_broadcast,
          broadcast_count: typeof m.broadcast_count === 'bigint' ? Number(m.broadcast_count) : m.broadcast_count,
        }))
        ws.send(
          JSON.stringify({
            type: 'history',
            data: {
              messages: safeMessages,
              users,
              totalCount: safeMessages.length,
            },
          }),
        )
      } catch (e) {
        console.error('[ChatRoomDO] Failed to send safe history:', e)
      }
    }
  }

  private getOnlineUsers(roomId: number): WSUser[] {
    const users = new Map<string, WSUser>()
    for (const [, conn] of this.connections) {
      if (conn.roomId === roomId) {
        users.set(conn.userId, { user_id: conn.userId, username: conn.username })
      }
    }
    return Array.from(users.values())
  }

  private async handleIncomingMessage(
    message: IncomingMessage,
    userId: string,
    username: string,
    roomId: number,
    connectionId: string,
  ): Promise<void> {
    switch (message.type) {
      case 'switch_room': {
        const newRoomId = typeof message.data?.room_id === 'number'
          ? message.data.room_id
          : parseInt(String(message.data?.room_id), 10)
        if (!newRoomId || isNaN(newRoomId)) {
          this.sendErrorToAll(userId, 'INVALID_ROOM', 'Invalid room ID')
          return
        }

        const conn = this.connections.get(connectionId)
        if (!conn) return

        const oldRoomId = conn.roomId
        if (oldRoomId === newRoomId) break

        await this.broadcastUserLeft(userId, username, oldRoomId)

        conn.roomId = newRoomId

        // 强制刷新该房间消息，确保包含最新数据
        await this.refreshMessages(newRoomId)
        await this.sendHistory(conn.ws, newRoomId)
        await this.broadcastUserJoined(userId, username, newRoomId)
        break
      }

      case 'chat_message': {
        if (!this.checkRateLimit(userId)) {
          this.sendErrorToAll(userId, 'RATE_LIMIT', 'Rate limit exceeded')
          return
        }

        const content = typeof message.data?.content === 'string' ? message.data.content.trim() : ''
        if (!content || content.length > MAX_MESSAGE_LENGTH) {
          this.sendErrorToAll(userId, 'INVALID_MESSAGE', `Message must be 1-${MAX_MESSAGE_LENGTH} characters`)
          return
        }

        const tempId = typeof message.data?.temp_id === 'string' ? message.data.temp_id : undefined
        await this.saveAndBroadcastMessage(userId, username, content, roomId, tempId)
        break
      }

      case 'heartbeat': {
        for (const [, conn] of this.connections) {
          if (conn.userId === userId) {
            try {
              conn.ws.send(JSON.stringify({ type: 'heartbeat', data: { ts: Date.now() } }))
            } catch {
              // ignore send errors
            }
          }
        }
        break
      }

      case 'auth':
      case 'rename': {
        const newUsername = typeof message.data?.username === 'string' ? message.data.username.trim() : ''
        if (!newUsername || newUsername.length > MAX_USERNAME_LENGTH) {
          this.sendErrorToAll(userId, 'INVALID_USERNAME', `Username must be 1-${MAX_USERNAME_LENGTH} characters`)
          return
        }
        await this.updateUsername(userId, newUsername)
        break
      }

      default: {
        this.sendErrorToAll(userId, 'UNKNOWN_TYPE', `Unknown message type: ${message.type}`)
        break
      }
    }
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now()
    const entry = this.rateLimits.get(userId)

    if (!entry || now - entry.timestamp > RATE_LIMIT_WINDOW) {
      this.rateLimits.set(userId, { count: 1, timestamp: now })
      return true
    }

    if (entry.count >= RATE_LIMIT) {
      return false
    }

    entry.count++
    return true
  }

  private sendErrorToAll(userId: string, code: string, errorMsg: string): void {
    const payload = JSON.stringify({
      type: 'error',
      data: { code, message: errorMsg },
    })

    for (const [, conn] of this.connections) {
      if (conn.userId === userId) {
        try {
          conn.ws.send(payload)
        } catch {
          console.error('[ChatRoomDO] Failed to send error to user:', userId)
        }
      }
    }
  }

  private async saveAndBroadcastMessage(
    userId: string,
    username: string,
    content: string,
    roomId: number,
    tempId?: string,
  ): Promise<void> {
    const now = new Date().toISOString()
    const safeUsername = encodeHtmlEntities(username)
    const safeContent = encodeHtmlEntities(content)
    let message: ChatMessage & { tempId?: string }

    try {
      const result = await this.env.SCP_DB.prepare(
        'INSERT INTO chat_messages (user_id, username, content, room_id) VALUES (?, ?, ?, ?)',
      )
        .bind(userId, safeUsername, safeContent, roomId)
        .run()

      const rawLastRowId = result.meta?.last_row_id
      const lastRowId = typeof rawLastRowId === 'bigint' ? Number(rawLastRowId) : (rawLastRowId || 0)

      if (!lastRowId) {
        console.warn('[ChatRoomDO] Warning: last_row_id is missing or zero, meta:', JSON.stringify(result.meta))
      }

      message = {
        id: lastRowId,
        user_id: userId,
        username: safeUsername,
        content: safeContent,
        room_id: roomId,
        created_at: now,
        is_broadcast: 0,
        broadcast_count: 0,
        tempId,
      }
    } catch (error) {
      console.error('[ChatRoomDO] Failed to persist message to D1:', error)
      this.sendErrorToAll(userId, 'DB_ERROR', 'Failed to save message. Please retry.')
      return
    }

    this.messages.push(message)
    if (this.messages.length > MAX_MESSAGES) {
      this.messages.shift()
    }

    await this.broadcastMessage(message)
  }

  private async broadcastMessage(message: ChatMessage): Promise<void> {
    let payload: string
    try {
      payload = JSON.stringify({ type: 'chat_message', data: message })
    } catch (error) {
      console.error('[ChatRoomDO] JSON stringify failed (possible bigint):', error)
      const safeMessage = {
        ...message,
        id: typeof message.id === 'bigint' ? Number(message.id) : message.id,
        room_id: typeof message.room_id === 'bigint' ? Number(message.room_id) : message.room_id,
        is_broadcast: typeof message.is_broadcast === 'bigint' ? Number(message.is_broadcast) : message.is_broadcast,
        broadcast_count: typeof message.broadcast_count === 'bigint' ? Number(message.broadcast_count) : message.broadcast_count,
      }
      payload = JSON.stringify({ type: 'chat_message', data: safeMessage })
    }
    const roomConnections = Array.from(this.connections.values()).filter(
      (c) => c.roomId === message.room_id,
    )

    for (const conn of roomConnections) {
      try {
        conn.ws.send(payload)
      } catch (error) {
        console.error('[ChatRoomDO] Failed to broadcast to connection:', conn.connectionId, error)
        this.connections.delete(conn.connectionId)
      }
    }

    const notifiedUserIds = new Set<string>()
    notifiedUserIds.add(message.user_id)
    for (const conn of roomConnections) {
      if (!notifiedUserIds.has(conn.userId)) {
        notifiedUserIds.add(conn.userId)
        const preview = message.content.length > 50 ? message.content.slice(0, 50) + '...' : message.content
        createNotification(this.env.SCP_DB, {
          recipient_user_id: conn.userId,
          actor_user_id: message.user_id,
          actor_nickname: message.username,
          type: 'chat_message',
          title: `#${message.room_id}`,
          body: preview,
          reference_id: String(message.room_id),
          reference_type: 'chat_room',
        }).catch(() => {})
      }
    }
  }

  private async broadcastUserJoined(userId: string, username: string, roomId: number): Promise<void> {
    const users = this.getOnlineUsers(roomId)
    const payload = JSON.stringify({
      type: 'user_joined',
      data: { user_id: userId, username, count: users.length },
    })
    const roomConnections = Array.from(this.connections.values()).filter(
      (c) => c.roomId === roomId,
    )

    for (const conn of roomConnections) {
      try {
        conn.ws.send(payload)
      } catch (error) {
        console.error('[ChatRoomDO] Failed to broadcast user_joined:', conn.connectionId, error)
        this.connections.delete(conn.connectionId)
      }
    }
  }

  private async broadcastUserLeft(userId: string, username: string, roomId: number): Promise<void> {
    const users = this.getOnlineUsers(roomId)
    const payload = JSON.stringify({
      type: 'user_left',
      data: { user_id: userId, username, count: users.length },
    })
    const roomConnections = Array.from(this.connections.values()).filter(
      (c) => c.roomId === roomId,
    )

    for (const conn of roomConnections) {
      try {
        conn.ws.send(payload)
      } catch (error) {
        console.error('[ChatRoomDO] Failed to broadcast user_left:', conn.connectionId, error)
        this.connections.delete(conn.connectionId)
      }
    }
  }

  private async updateUsername(userId: string, newUsername: string): Promise<void> {
    const safeUsername = encodeHtmlEntities(newUsername)
    let roomId = 1
    for (const [, conn] of this.connections) {
      if (conn.userId === userId) {
        conn.username = safeUsername
        roomId = conn.roomId
        try {
          const current = conn.ws.deserializeAttachment()
          conn.ws.serializeAttachment({
            ...(current || {}),
            userId: conn.userId,
            username: safeUsername,
            roomId: conn.roomId,
            connectionId: conn.connectionId,
          })
        } catch {
          // ignore serialize errors
        }
      }
    }

    try {
      await this.env.SCP_DB.prepare(
        'INSERT OR REPLACE INTO user_settings (key, value, updatedAt) VALUES (?, ?, ?)',
      )
        .bind(`nickname_${userId}`, safeUsername, new Date().toISOString())
        .run()
    } catch (error) {
      console.error('[ChatRoomDO] Failed to save nickname to DB:', error)
    }

    const users = this.getOnlineUsers(roomId)
    const payload = JSON.stringify({
      type: 'users',
      data: { users, count: users.length },
    })
    const roomConnections = Array.from(this.connections.values()).filter(
      (c) => c.roomId === roomId,
    )

    for (const conn of roomConnections) {
      try {
        conn.ws.send(payload)
      } catch (error) {
        console.error('[ChatRoomDO] Failed to broadcast users update:', conn.connectionId, error)
        this.connections.delete(conn.connectionId)
      }
    }
  }
}
