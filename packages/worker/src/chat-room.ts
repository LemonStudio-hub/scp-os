import type { Env } from './types'

export class ChatRoomDO {
  private sockets = new Set<WebSocket>()

  constructor(private readonly state: DurableObjectState, private readonly env: Env) {}

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 426 })
    }
    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]
    server.accept()
    this.sockets.add(server)
    server.addEventListener('message', (event) => this.broadcast(event.data))
    server.addEventListener('close', () => this.sockets.delete(server))
    server.addEventListener('error', () => this.sockets.delete(server))
    return new Response(null, { status: 101, webSocket: client })
  }

  private broadcast(data: string | ArrayBuffer): void {
    for (const socket of this.sockets) {
      try {
        socket.send(data)
      } catch {
        this.sockets.delete(socket)
      }
    }
  }
}
