import type { ChatMessage, WSUser } from '../shared/types'

interface WebSocketConnection {
  ws: WebSocket
  userId: string
  username: string
  roomId: number
  connectionId: string
}

interface RateLimitEntry {
  count: number
  timestamp: number
}

interface IncomingMessage {
  type: string
  data?: any
}

export class ChatRoomDO {
  private connections: Map<string, WebSocketConnection> = new Map()
  private messages: ChatMessage[] = []
  private rateLimits: Map<string, RateLimitEntry> = new Map()
  private static readonly MAX_MESSAGES = 1000
  private static readonly RATE_LIMIT = 10
  private static readonly RATE_LIMIT_WINDOW = 60000

  constructor(private state: DurableObjectState, private env: { SCP_DB: D1Database }) {
    this.state.getWebSockets().forEach(ws => {
      const tags = ws.deserializeAttachment() as { userId: string; username: string; roomId: number; connectionId: string } | null
      if (tags) {
        this.connections.set(tags.connectionId, { ws, ...tags })
      }
    })
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/chat/ws' || url.pathname === '/ws') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426 })
      }

      const userId = url.searchParams.get('user_id')
      const username = url.searchParams.get('username') || 'Anonymous'
      const roomId = parseInt(url.searchParams.get('room_id') || '1', 10)

      if (!userId) {
        return new Response('Missing user_id', { status: 400 })
      }

      const webSocketPair = new WebSocketPair()
      const [client, server] = [webSocketPair[0], webSocketPair[1]]

      const connectionId = `${userId}-${Date.now()}`

      this.connections.set(connectionId, { ws: server, userId, username, roomId, connectionId })

      server.serializeAttachment({ userId, username, roomId, connectionId })

      this.state.acceptWebSocket(server)

      await this.loadMessages(roomId)
      await this.sendHistory(server, roomId)
      await this.broadcastUserJoined(userId, username, roomId)

      return new Response(null, {
        status: 101,
        webSocket: client,
      })
    }

    return new Response('Not found', { status: 404 })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const tags = ws.deserializeAttachment() as { userId: string; username: string; roomId: number; connectionId: string } | null
    if (!tags) return

    try {
      const msg: IncomingMessage = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message))
      await this.handleIncomingMessage(msg, tags.userId, tags.username, tags.roomId)
    } catch {
      console.error('[ChatRoomDO] Failed to parse message')
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    const tags = ws.deserializeAttachment() as { userId: string; username: string; roomId: number; connectionId: string } | null
    if (!tags) return

    this.connections.delete(tags.connectionId)
    await this.broadcastUserLeft(tags.userId, tags.username, tags.roomId)
  }

  private async loadMessages(roomId: number): Promise<void> {
    try {
      const result = await this.env.SCP_DB.prepare(
        'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at DESC LIMIT ?'
      ).bind(roomId, ChatRoomDO.MAX_MESSAGES).all<ChatMessage>()

      this.messages = (result.results || []).reverse()
    } catch (error) {
      console.error('[ChatRoomDO] Failed to load messages:', error)
    }
  }

  private async sendHistory(ws: WebSocket, roomId: number): Promise<void> {
    const roomMessages = this.messages.filter(m => m.room_id === roomId)
    const users = this.getOnlineUsers(roomId)

    try {
      ws.send(JSON.stringify({
        type: 'history',
        data: {
          messages: roomMessages,
          users,
        },
      }))
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

  private async handleIncomingMessage(message: IncomingMessage, userId: string, username: string, roomId: number): Promise<void> {
    switch (message.type) {
      case 'message': {
        if (!this.checkRateLimit(userId)) {
          this.sendError(userId, 'RATE_LIMIT', 'Rate limit exceeded')
          return
        }

        const content = message.data?.content?.trim()
        if (!content || content.length > 1000) {
          this.sendError(userId, 'INVALID_MESSAGE', 'Invalid message')
          return
        }

        await this.saveAndBroadcastMessage(userId, username, content, roomId)
        break
      }

      case 'heartbeat': {
        const conn = this.findConnectionByUserId(userId)
        if (conn) {
          try {
            conn.ws.send(JSON.stringify({ type: 'heartbeat' }))
          } catch {
            console.error('[ChatRoomDO] Failed to send heartbeat response')
          }
        }
        break
      }

      case 'auth': {
        const newUsername = message.data?.username
        if (newUsername && newUsername.length <= 30) {
          await this.updateUsername(userId, newUsername, roomId)
        }
        break
      }
    }
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now()
    const entry = this.rateLimits.get(userId)

    if (!entry || now - entry.timestamp > ChatRoomDO.RATE_LIMIT_WINDOW) {
      this.rateLimits.set(userId, { count: 1, timestamp: now })
      return true
    }

    if (entry.count >= ChatRoomDO.RATE_LIMIT) {
      return false
    }

    entry.count++
    return true
  }

  private sendError(userId: string, code: string, errorMsg: string): void {
    const conn = this.findConnectionByUserId(userId)
    if (conn) {
      try {
        conn.ws.send(JSON.stringify({
          type: 'error',
          data: { code, message: errorMsg },
        }))
      } catch {
        console.error('[ChatRoomDO] Failed to send error')
      }
    }
  }

  private findConnectionByUserId(userId: string): WebSocketConnection | undefined {
    for (const [, conn] of this.connections) {
      if (conn.userId === userId) {
        return conn
      }
    }
    return undefined
  }

  private async saveAndBroadcastMessage(userId: string, username: string, content: string, roomId: number): Promise<void> {
    const now = new Date().toISOString()

    let message: ChatMessage

    try {
      const result = await this.env.SCP_DB.prepare(
        'INSERT INTO chat_messages (user_id, username, content, room_id) VALUES (?, ?, ?, ?)'
      ).bind(userId, username, content, roomId).run()

      message = {
        id: result.meta?.last_row_id as number || Date.now(),
        user_id: userId,
        username,
        content,
        room_id: roomId,
        created_at: now,
        is_broadcast: 0,
        broadcast_count: 0,
      }
    } catch {
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
    if (this.messages.length > ChatRoomDO.MAX_MESSAGES) {
      this.messages.shift()
    }

    await this.broadcastMessage(message)
  }

  private async broadcastMessage(message: ChatMessage): Promise<void> {
    const roomConnections = Array.from(this.connections.values()).filter(c => c.roomId === message.room_id)

    for (const conn of roomConnections) {
      try {
        conn.ws.send(JSON.stringify({
          type: 'message',
          data: message,
        }))
      } catch {
        console.error('[ChatRoomDO] Failed to broadcast message')
      }
    }
  }

  private async broadcastUserJoined(userId: string, username: string, roomId: number): Promise<void> {
    const users = this.getOnlineUsers(roomId)
    const roomConnections = Array.from(this.connections.values()).filter(c => c.roomId === roomId)

    for (const conn of roomConnections) {
      try {
        conn.ws.send(JSON.stringify({
          type: 'user_joined',
          data: { user_id: userId, username, count: users.length },
        }))
      } catch {
        console.error('[ChatRoomDO] Failed to broadcast user joined')
      }
    }
  }

  private async broadcastUserLeft(userId: string, username: string, roomId: number): Promise<void> {
    const users = this.getOnlineUsers(roomId)
    const roomConnections = Array.from(this.connections.values()).filter(c => c.roomId === roomId)

    for (const conn of roomConnections) {
      try {
        conn.ws.send(JSON.stringify({
          type: 'user_left',
          data: { user_id: userId, username, count: users.length },
        }))
      } catch {
        console.error('[ChatRoomDO] Failed to broadcast user left')
      }
    }
  }

  private async updateUsername(userId: string, newUsername: string, roomId: number): Promise<void> {
    for (const [, conn] of this.connections) {
      if (conn.userId === userId) {
        conn.username = newUsername
        conn.ws.serializeAttachment({ ...conn.ws.deserializeAttachment(), username: newUsername })
      }
    }

    try {
      await this.env.SCP_DB.prepare(
        'INSERT OR REPLACE INTO user_settings (key, value, updatedAt) VALUES (?, ?, ?)'
      ).bind(`nickname_${userId}`, newUsername, new Date().toISOString()).run()
    } catch {
      console.error('[ChatRoomDO] Failed to save nickname to DB')
    }

    const users = this.getOnlineUsers(roomId)
    const roomConnections = Array.from(this.connections.values()).filter(c => c.roomId === roomId)

    for (const conn of roomConnections) {
      try {
        conn.ws.send(JSON.stringify({
          type: 'users',
          data: { users, count: users.length },
        }))
      } catch {
        console.error('[ChatRoomDO] Failed to broadcast users update')
      }
    }
  }
}