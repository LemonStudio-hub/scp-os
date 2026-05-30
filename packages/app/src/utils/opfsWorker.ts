const FS_DIR = '__scp_fs'
const META_FILE = '__fs_meta.json'
const CONTENT_DIR = '__content'
const MAX_HANDLE_CACHE = 20

interface WorkerRequest {
  id: string
  type: 'init' | 'saveMeta' | 'loadMeta' | 'saveFile' | 'loadFile' | 'deleteFile' | 'hasFile' | 'flush' | 'reset' | 'estimate' | 'destroy'
  payload?: unknown
}

interface WorkerResponse {
  id: string
  success: boolean
  data?: unknown
  error?: string
}

let fsDir: FileSystemDirectoryHandle | null = null
let contentDir: FileSystemDirectoryHandle | null = null
let metaHandle: FileSystemSyncAccessHandle | null = null
const handleCache = new Map<string, { handle: FileSystemSyncAccessHandle; lastAccess: number }>()
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function post(response: WorkerResponse): void {
  self.postMessage(response)
}

function getContentDir(): FileSystemDirectoryHandle {
  if (!contentDir) {
    throw new Error('[OPFS Worker] Content directory not initialized')
  }
  return contentDir
}

function getFsDir(): FileSystemDirectoryHandle {
  if (!fsDir) {
    throw new Error('[OPFS Worker] Filesystem directory not initialized')
  }
  return fsDir
}

function getHandleCacheKey(fileName: string): string {
  return fileName
}

function evictOldestHandle(): void {
  let oldestKey: string | null = null
  let oldestTime = Infinity
  for (const [key, entry] of handleCache) {
    if (entry.lastAccess < oldestTime) {
      oldestTime = entry.lastAccess
      oldestKey = key
    }
  }
  if (oldestKey) {
    const entry = handleCache.get(oldestKey)
    if (entry) {
      try { entry.handle.close() } catch { /* ignore */ }
      handleCache.delete(oldestKey)
    }
  }
}

async function getFileHandle(fileName: string): Promise<FileSystemSyncAccessHandle> {
  const key = getHandleCacheKey(fileName)
  const cached = handleCache.get(key)
  if (cached) {
    cached.lastAccess = Date.now()
    return cached.handle
  }

  if (handleCache.size >= MAX_HANDLE_CACHE) {
    evictOldestHandle()
  }

  const fileHandle = await getContentDir().getFileHandle(fileName, { create: true })
  const handle = await fileHandle.createSyncAccessHandle()
  handleCache.set(key, { handle, lastAccess: Date.now() })
  return handle
}

function closeFileHandle(fileName: string): void {
  const key = getHandleCacheKey(fileName)
  const entry = handleCache.get(key)
  if (entry) {
    try { entry.handle.close() } catch { /* ignore */ }
    handleCache.delete(key)
  }
}

function getContentPath(virtualPath: string): string {
  const normalized = virtualPath.replace(/^\/+/, '').replace(/\/+$/, '')
  return normalized.replace(/\//g, '__')
}

async function handleInit(): Promise<void> {
  if (fsDir && contentDir) return

  const root = await navigator.storage.getDirectory()
  fsDir = await root.getDirectoryHandle(FS_DIR, { create: true })
  contentDir = await fsDir.getDirectoryHandle(CONTENT_DIR, { create: true })

  const metaFileHandle = await fsDir.getFileHandle(META_FILE, { create: true })
  metaHandle = await metaFileHandle.createSyncAccessHandle()
}

async function handleSaveMeta(payload: { root: unknown; currentPath: string[] }): Promise<void> {
  if (!metaHandle) {
    const metaFileHandle = await getFsDir().getFileHandle(META_FILE, { create: true })
    metaHandle = await metaFileHandle.createSyncAccessHandle()
  }

  const json = JSON.stringify(payload, null, 0)
  const encoded = textEncoder.encode(json)

  metaHandle.truncate(0)
  metaHandle.write(encoded, { at: 0 })
  metaHandle.flush()
}

async function handleLoadMeta(): Promise<{ root: unknown; currentPath: string[] } | null> {
  if (!metaHandle) {
    const metaFileHandle = await getFsDir().getFileHandle(META_FILE, { create: true })
    metaHandle = await metaFileHandle.createSyncAccessHandle()
  }

  const size = metaHandle.getSize()
  if (size === 0) return null

  const buffer = new Uint8Array(size)
  metaHandle.read(buffer, { at: 0 })
  const text = textDecoder.decode(buffer)
  return JSON.parse(text)
}

async function handleSaveFile(payload: { path: string; content: string }): Promise<void> {
  const fileName = getContentPath(payload.path)
  const handle = await getFileHandle(fileName)
  const encoded = textEncoder.encode(payload.content)

  handle.truncate(0)
  handle.write(encoded, { at: 0 })
  handle.flush()
}

async function handleLoadFile(payload: { path: string }): Promise<string | null> {
  const fileName = getContentPath(payload.path)

  try {
    const fileHandle = await getContentDir().getFileHandle(fileName)
    const handle = await fileHandle.createSyncAccessHandle()
    const size = handle.getSize()

    if (size === 0) {
      handle.close()
      return ''
    }

    const buffer = new Uint8Array(size)
    handle.read(buffer, { at: 0 })
    handle.close()
    return textDecoder.decode(buffer)
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return null
    }
    throw error
  }
}

async function handleDeleteFile(payload: { path: string }): Promise<void> {
  const fileName = getContentPath(payload.path)
  closeFileHandle(fileName)

  try {
    await getContentDir().removeEntry(fileName)
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return
    }
    throw error
  }
}

async function handleHasFile(payload: { path: string }): Promise<boolean> {
  const fileName = getContentPath(payload.path)
  const key = getHandleCacheKey(fileName)
  if (handleCache.has(key)) return true

  try {
    await getContentDir().getFileHandle(fileName)
    return true
  } catch {
    return false
  }
}

async function handleFlush(): Promise<void> {
  if (metaHandle) {
    metaHandle.flush()
  }
  for (const [, entry] of handleCache) {
    try { entry.handle.flush() } catch { /* ignore */ }
  }
}

async function handleReset(): Promise<void> {
  if (metaHandle) {
    try { metaHandle.close() } catch { /* ignore */ }
    metaHandle = null
  }

  for (const [, entry] of handleCache) {
    try { entry.handle.close() } catch { /* ignore */ }
  }
  handleCache.clear()

  if (fsDir) {
    try {
      await fsDir.removeEntry(META_FILE)
    } catch { /* ignore */ }

    try {
      const contentHandle = await fsDir.getDirectoryHandle(CONTENT_DIR)
      const entries = contentHandle as unknown as AsyncIterable<[string, FileSystemHandle]>
      for await (const [name] of entries) {
        await contentHandle.removeEntry(name)
      }
    } catch { /* ignore */ }
  }
}

async function handleEstimate(): Promise<{ usage: number; quota: number; usagePercent: number } | null> {
  try {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage ?? 0
    const quota = estimate.quota ?? 0
    return {
      usage,
      quota,
      usagePercent: quota > 0 ? (usage / quota) * 100 : 0,
    }
  } catch {
    return null
  }
}

function handleDestroy(): void {
  if (metaHandle) {
    try { metaHandle.close() } catch { /* ignore */ }
    metaHandle = null
  }

  for (const [, entry] of handleCache) {
    try { entry.handle.close() } catch { /* ignore */ }
  }
  handleCache.clear()

  fsDir = null
  contentDir = null
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = event.data

  try {
    let data: unknown

    switch (type) {
      case 'init':
        await handleInit()
        data = undefined
        break
      case 'saveMeta':
        await handleSaveMeta(payload as { root: unknown; currentPath: string[] })
        data = undefined
        break
      case 'loadMeta':
        data = await handleLoadMeta()
        break
      case 'saveFile':
        await handleSaveFile(payload as { path: string; content: string })
        data = undefined
        break
      case 'loadFile':
        data = await handleLoadFile(payload as { path: string })
        break
      case 'deleteFile':
        await handleDeleteFile(payload as { path: string })
        data = undefined
        break
      case 'hasFile':
        data = await handleHasFile(payload as { path: string })
        break
      case 'flush':
        await handleFlush()
        data = undefined
        break
      case 'reset':
        await handleReset()
        data = undefined
        break
      case 'estimate':
        data = await handleEstimate()
        break
      case 'destroy':
        handleDestroy()
        data = undefined
        break
      default:
        throw new Error(`[OPFS Worker] Unknown operation: ${type}`)
    }

    post({ id, success: true, data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    post({ id, success: false, error: message })
  }
}
