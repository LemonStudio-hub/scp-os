/** Shared R2 usage helpers for files + sync routes. */

export const CLOUD_QUOTA_BYTES = 512 * 1024 * 1024

export async function listAllObjects(bucket: R2Bucket, prefix: string): Promise<R2Object[]> {
  const objects: R2Object[] = []
  let cursor: string | undefined
  do {
    const listResult = await bucket.list({ prefix, limit: 1000, cursor })
    objects.push(...listResult.objects)
    cursor = listResult.truncated ? listResult.cursor : undefined
  } while (cursor)
  return objects
}

export async function cloudUsage(
  bucket: R2Bucket,
  userId: string,
): Promise<{ used: number; count: number }> {
  const objects = await listAllObjects(bucket, `users/${userId}/`)
  return {
    used: objects.reduce((sum, obj) => sum + obj.size, 0),
    count: objects.length,
  }
}
