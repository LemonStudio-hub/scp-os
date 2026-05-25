import type { Env } from './types'
import { all, first, run } from './db'

interface SocketMeta {
  userId: string
  username: string
  roomId: number
}

export class ChatRoomDO {
  private sockets = new Map<WebSocket, SocketMeta>()
  private closedSockets = new Set<WebSocket>()

  constructor(private readonly state: DurableObjectState, private readonly env: Env) {}

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 426 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id') || ''
    const username = url.searchParams.get('username') || 'Anonymous'
    const roomId = Number(url.searchParams.get('room_id')) || 1

    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]
    server.accept()
    this.sockets.set(server, { userId, username, roomId })

    // Send recent history for the room
    this.sendHistory(server, roomId)

    // Broadcast user joined
    this.broadcast(
      JSON.stringify({
        type: 'user_joined',
        data: { user_id: userId, username, count: this.sockets.size },
      }),
      roomId,
    )

    server.addEventListener('message', async (event) => {
      try {
        const msg = JSON.parse(event.data as string)
        await this.handleMessage(server, msg, userId, username, roomId)
      } catch {
        this.broadcast(event.data, roomId)
      }
    })

    server.addEventListener('close', () => {
      if (this.closedSockets.has(server)) return
      this.closedSockets.add(server)
      this.sockets.delete(server)
      this.broadcast(
        JSON.stringify({
          type: 'user_left',
          data: { user_id: userId, username, count: this.sockets.size },
        }),
        roomId,
      )
    })

    server.addEventListener('error', () => {
      if (this.closedSockets.has(server)) return
      this.closedSockets.add(server)
      this.sockets.delete(server)
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  private async handleMessage(
    server: WebSocket,
    msg: { type: string; data?: Record<string, unknown> },
    userId: string,
    username: string,
    roomId: number,
  ): Promise<void> {
    switch (msg.type) {
      case 'chat_message': {
        const content = String(msg.data?.content || '').trim()
        const tempId = msg.data?.temp_id as string | undefined
        if (!content || content.length > 1000) {
          server.send(
            JSON.stringify({
              type: 'error',
              data: { code: 'VALIDATION_ERROR', message: 'Invalid message' },
            }),
          )
          return
        }
        try {
          const result = await run(
            this.env.SCP_DB,
            'INSERT INTO chat_messages (user_id, username, content, room_id, is_broadcast) VALUES (?, ?, ?, ?, 0)',
            [userId, username, content, roomId],
          )
          const id = (result.meta as { last_row_id?: number })?.last_row_id || 0
          this.broadcast(
            JSON.stringify({
              type: 'chat_message',
              data: {
                id,
                user_id: userId,
                username,
                content,
                room_id: roomId,
                created_at: new Date().toISOString(),
                tempId,
              },
            }),
            roomId,
          )
        } catch {
          server.send(
            JSON.stringify({
              type: 'error',
              data: { code: 'DB_ERROR', message: 'Failed to save message' },
            }),
          )
        }
        break
      }
      case 'switch_room': {
        const newRoomId = Number(msg.data?.room_id) || roomId
        const meta = this.sockets.get(server)
        if (meta) meta.roomId = newRoomId
        this.sendHistory(server, newRoomId)
        server.send(
          JSON.stringify({
            type: 'room_info',
            data: { room_id: newRoomId },
          }),
        )
        break
      }
      case 'heartbeat': {
        server.send(JSON.stringify({ type: 'heartbeat', data: {} }))
        break
      }
      case 'rename': {
        const newName = String(msg.data?.username || username)
        const meta = this.sockets.get(server)
        if (meta) meta.username = newName
        this.broadcast(
          JSON.stringify({
            type: 'user_renamed',
            data: { user_id: userId, old_name: username, new_name: newName },
          }),
          roomId,
        )
        break
      }
      case 'edit_message': {
        const messageId = Number(msg.data?.message_id)
        const newContent = String(msg.data?.content || '').trim()
        if (!messageId || !newContent || newContent.length > 1000) {
          server.send(
            JSON.stringify({
              type: 'error',
              data: { code: 'VALIDATION_ERROR', message: 'Invalid edit' },
            }),
          )
          return
        }
        try {
          const row = await first<{ user_id: string }>(
            this.env.SCP_DB,
            'SELECT user_id FROM chat_messages WHERE id = ? AND room_id = ?',
            [messageId, roomId],
          )
          if (!row) {
            server.send(
              JSON.stringify({
                type: 'error',
                data: { code: 'NOT_FOUND', message: 'Message not found' },
              }),
            )
            return
          }
          if (row.user_id !== userId) {
            server.send(
              JSON.stringify({
                type: 'error',
                data: { code: 'FORBIDDEN', message: 'Cannot edit others message' },
              }),
            )
            return
          }
          const updateResult = await run(
            this.env.SCP_DB,
            'UPDATE chat_messages SET content = ?, edited = 1 WHERE id = ? AND room_id = ?',
            [newContent, messageId, roomId],
          )
          if ((updateResult.meta as { changes?: number })?.changes === 0) {
            server.send(
              JSON.stringify({
                type: 'error',
                data: { code: 'NOT_FOUND', message: 'Message was deleted concurrently' },
              }),
            )
            return
          }
          this.broadcast(
            JSON.stringify({
              type: 'message_edited',
              data: { id: messageId, content: newContent, user_id: userId, room_id: roomId },
            }),
            roomId,
          )
        } catch {
          server.send(
            JSON.stringify({
              type: 'error',
              data: { code: 'DB_ERROR', message: 'Failed to edit message' },
            }),
          )
        }
        break
      }
      case 'delete_message': {
        const messageId = Number(msg.data?.message_id)
        if (!messageId) {
          server.send(
            JSON.stringify({
              type: 'error',
              data: { code: 'VALIDATION_ERROR', message: 'Invalid delete' },
            }),
          )
          return
        }
        try {
          const row = await first<{ user_id: string }>(
            this.env.SCP_DB,
            'SELECT user_id FROM chat_messages WHERE id = ? AND room_id = ?',
            [messageId, roomId],
          )
          if (!row) {
            server.send(
              JSON.stringify({
                type: 'error',
                data: { code: 'NOT_FOUND', message: 'Message not found' },
              }),
            )
            return
          }
          if (row.user_id !== userId) {
            server.send(
              JSON.stringify({
                type: 'error',
                data: { code: 'FORBIDDEN', message: 'Cannot delete others message' },
              }),
            )
            return
          }
          const deleteResult = await run(
            this.env.SCP_DB,
            'DELETE FROM chat_messages WHERE id = ? AND room_id = ?',
            [messageId, roomId],
          )
          if ((deleteResult.meta as { changes?: number })?.changes === 0) {
            server.send(
              JSON.stringify({
                type: 'error',
                data: { code: 'NOT_FOUND', message: 'Message was deleted concurrently' },
              }),
            )
            return
          }
          this.broadcast(
            JSON.stringify({
              type: 'message_deleted',
              data: { id: messageId, user_id: userId, room_id: roomId },
            }),
            roomId,
          )
        } catch {
          server.send(
            JSON.stringify({
              type: 'error',
              data: { code: 'DB_ERROR', message: 'Failed to delete message' },
            }),
          )
        }
        break
      }
    }
  }

  private async sendHistory(server: WebSocket, roomId: number): Promise<void> {
    try {
      const rows = await all<Record<string, unknown>>(
        this.env.SCP_DB,
        'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at DESC LIMIT 50',
        [roomId],
      )
      const seen = new Set<string>()
      const users: { user_id: string; username: string }[] = []
      for (const meta of this.sockets.values()) {
        if (meta.roomId === roomId && !seen.has(meta.userId)) {
          seen.add(meta.userId)
          users.push({ user_id: meta.userId, username: meta.username })
        }
      }
      server.send(
        JSON.stringify({
          type: 'history',
          data: {
            messages: rows.reverse().map((row) => ({
              id: row.id,
              user_id: row.user_id,
              username: row.username,
              content: row.content,
              room_id: row.room_id,
              created_at: row.created_at,
              edited: row.edited === 1,
            })),
            users,
            count: users.length,
          },
        }),
      )
    } catch {
      // ignore
    }
  }

  private broadcast(data: string | ArrayBuffer, roomId?: number): void {
    const dead: WebSocket[] = []
    for (const [socket, meta] of this.sockets) {
      if (roomId !== undefined && meta.roomId !== roomId) continue
      try {
        socket.send(data)
      } catch {
        dead.push(socket)
      }
    }
    for (const socket of dead) this.sockets.delete(socket)
  }
}