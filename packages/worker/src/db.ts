export async function first<T>(db: D1Database, sql: string, params: unknown[] = []): Promise<T | null> {
  return (await db.prepare(sql).bind(...params).first<T>()) || null
}

export async function all<T>(db: D1Database, sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await db.prepare(sql).bind(...params).all<T>()
  return result.results || []
}

export async function run(db: D1Database, sql: string, params: unknown[] = []): Promise<D1Result> {
  return db.prepare(sql).bind(...params).run()
}

export async function count(db: D1Database, table: string, where = '1=1', params: unknown[] = []): Promise<number> {
  const row = await first<{ total: number }>(db, `SELECT COUNT(*) as total FROM ${table} WHERE ${where}`, params)
  return row?.total || 0
}
