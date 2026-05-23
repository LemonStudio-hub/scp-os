import { describe, expect, it } from 'vitest'
import worker from '../index'
import type { Env } from '../src/types'

function db(): D1Database {
  return {
    prepare: () => ({
      bind: () => ({
        first: async () => null,
        all: async () => ({ results: [] }),
        run: async () => ({ success: true, meta: {} }),
      }),
      first: async () => null,
      all: async () => ({ results: [] }),
      run: async () => ({ success: true, meta: {} }),
    }),
    dump: async () => new ArrayBuffer(0),
    batch: async () => [],
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database
}

const env = {
  SCP_DB: db(),
  SCP_READER_DB: db(),
  CHAT_ROOM_DO: {} as DurableObjectNamespace,
  SCP_FILES: {} as R2Bucket,
  JWT_SECRET: 'test-secret',
  ADMIN_JWT_SECRET: 'admin-secret',
} satisfies Env

describe('rewritten worker contract', () => {
  it('keeps the root response format', async () => {
    const response = await worker.fetch(new Request('https://api.example/'), env, {} as ExecutionContext)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ name: 'SCP Scraper Worker', status: 'online' })
  })

  it('keeps json 404s', async () => {
    const response = await worker.fetch(new Request('https://api.example/nope'), env, {} as ExecutionContext)
    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ code: 'INTERNAL_ERROR', message: 'Not found' })
  })

  it('keeps CORS preflight behavior', async () => {
    const response = await worker.fetch(new Request('https://api.example/list', { method: 'OPTIONS' }), env, {} as ExecutionContext)
    expect(response.status).toBe(204)
  })
})
