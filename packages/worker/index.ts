import { createApp } from './src/app'
import { ChatRoomDO } from './src/chat-room'
import type { Env } from './src/types'
import { isChatSocket } from './src/http'
import { all, run } from './src/db'

export { ChatRoomDO }

const app = createApp()

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
    if (isChatSocket(request)) {
      const stub = env.CHAT_ROOM_DO.get(env.CHAT_ROOM_DO.idFromName('global-v4'))
      return stub.fetch(request)
    }
    return app.fetch(request, env, ctx)
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const rows = await all(env.SCP_DB, 'SELECT id FROM chat_messages WHERE is_broadcast = 0')
    if (rows.length) {
      await run(env.SCP_DB, 'UPDATE chat_messages SET is_broadcast = 1, broadcast_count = broadcast_count + 1 WHERE is_broadcast = 0')
    }
  },
}
