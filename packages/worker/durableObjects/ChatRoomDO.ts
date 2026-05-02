import type { ChatMessage, WSUser } from '../shared/types'

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

  constructor(
    private state: DurableObjectState,
    private env: { SCP_DB: D1Database },
  ) {
    try {
      const existingSockets = this.state.getWebSockets()
      for (const ws of existingSockets) {
        try {
          const tags = ws.deserializeAttachment() as {
            userId: string
            username: string
            roomId: number
            connectionId: string
          } | null
          if (tags && tags.userId && tags.connectionId) {
            this.connections.set(tags.connectionId, {
              ws,
              userId: tags.userId,
              username: tags.username || 'Anonymous',
              roomId: tags.roomId || 1,
              connectionId: tags.connectionId,
              lastHeartbeat: Date.now(),
            })
          } else {
            try {
              ws.close(1011, 'Invalid attachment on restart')
            } catch {
              // ignore
            }
          }
        } catch {
          try {
            ws.close(1011, 'Failed to restore connection state')
          } catch {
            // ignore
          }
        }
      }
    } catch (error) {
      console.error('[ChatRoomDO] Constructor error:', error)
    }

    this.state.blockConcurrencyWhile(async () => {
      await this.state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS)
    })
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/chat/ws' || url.pathname === '/ws') {
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

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const tags = ws.deserializeAttachment() as {
      userId: string
      username: string
      roomId: number
      connectionId: string
    } | null
    if (!tags) return

    let msg: IncomingMessage
    try {
      const raw = typeof message === 'string' ? message : new TextDecoder().decode(message)
      msg = JSON.parse(raw)
      if (!msg || typeof msg.type !== 'string') {
        this.sendErrorToAll(tags.userId, 'INVALID_FORMAT', 'Message must have a type field')
        return
      }
    } catch {
      this.sendErrorToAll(tags.userId, 'INVALID_JSON', 'Invalid JSON message')
      return
    }

    const conn = this.connections.get(tags.connectionId)
    if (conn) {
      conn.lastHeartbeat = Date.now()
    }

    try {
      await this.handleIncomingMessage(msg, tags.userId, tags.username, tags.roomId)
    } catch (error) {
      console.error('[ChatRoomDO] Unhandled error in message processing:', error)
      this.sendErrorToAll(tags.userId, 'INTERNAL_ERROR', 'Internal error processing message')
    }
  }

  async webSocketClose(ws: WebSocket, _code: number, _reason: string): Promise<void> {
    const tags = ws.deserializeAttachment() as {
      userId: string
      username: string
      roomId: number
      connectionId: string
    } | null
    if (!tags) return

    this.connections.delete(tags.connectionId)
    try {
      await this.broadcastUserLeft(tags.userId, tags.username, tags.roomId)
    } catch (error) {
      console.error('[ChatRoomDO] Failed to broadcast user left:', error)
    }
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('[ChatRoomDO] WebSocket error:', error)
    try {
      const tags = ws.deserializeAttachment() as {
        userId: string
        username: string
        roomId: number
        connectionId: string
      } | null
      if (tags) {
        this.connections.delete(tags.connectionId)
        await this.broadcastUserLeft(tags.userId, tags.username, tags.roomId)
      }
    } catch {
      // ignore cleanup errors
    }
    try {
      ws.close(1011, 'WebSocket error')
    } catch {
      // already closed
    }
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
    server.accept()

    const connectionId = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    this.connections.set(connectionId, {
      ws: server,
      userId,
      username,
      roomId,
      connectionId,
      lastHeartbeat: Date.now(),
    })

    const attachment = { userId, username, roomId, connectionId }
    server.serializeAttachment(attachment)

    this.state.acceptWebSocket(server)

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
    try {
      const result = await this.env.SCP_DB.prepare(
        'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at DESC LIMIT ?',
      )
        .bind(roomId, MAX_MESSAGES)
        .all<ChatMessage>()

      this.messages = (result.results || []).reverse()
    } catch (error) {
      console.error('[ChatRoomDO] Failed to load messages:', error)
      this.messages = []
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
      console.error('[ChatRoomDO] Failed to send history:', error)
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
  ): Promise<void> {
    switch (message.type) {
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

        await this.saveAndBroadcastMessage(userId, username, content, roomId)
        break
      }

      case 'heartbeat': {
        break
      }

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
  ): Promise<void> {
    const now = new Date().toISOString()
    let message: ChatMessage

    try {
      const result = await this.env.SCP_DB.prepare(
        'INSERT INTO chat_messages (user_id, username, content, room_id) VALUES (?, ?, ?, ?)',
      )
        .bind(userId, username, content, roomId)
        .run()

      message = {
        id: (result.meta?.last_row_id as number) || Date.now(),
        user_id: userId,
        username,
        content,
        room_id: roomId,
        created_at: now,
        is_broadcast: 0,
        broadcast_count: 0,
      }
    } catch (error) {
      console.error('[ChatRoomDO] Failed to persist message to D1:', error)
      message = {
        id: Date.now(),
        user_id: userId,
        username,
        content,
        room_id: roomId,
        created_at: now,
        is_broadcast: 0,
        broadcast_count: 0,
      }
    }

    this.messages.push(message)
    if (this.messages.length > MAX_MESSAGES) {
      this.messages.shift()
    }

    await this.broadcastMessage(message)
  }

  private async broadcastMessage(message: ChatMessage): Promise<void> {
    const payload = JSON.stringify({ type: 'chat_message', data: message })
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
    let roomId = 1
    for (const [, conn] of this.connections) {
      if (conn.userId === userId) {
        conn.username = newUsername
        roomId = conn.roomId
        try {
          const current = conn.ws.deserializeAttachment()
          conn.ws.serializeAttachment({
            ...(current || {}),
            userId: conn.userId,
            username: newUsername,
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
        .bind(`nickname_${userId}`, newUsername, new Date().toISOString())
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
