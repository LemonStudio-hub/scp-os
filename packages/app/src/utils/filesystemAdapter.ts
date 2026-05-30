import logger from './logger'
import opfsStorage from './opfsStorage'

export interface FilesystemSnapshot {
  root: unknown
  currentPath: string[]
}

export interface FilesystemStorageAdapter {
  init(): Promise<void>
  load(): Promise<FilesystemSnapshot | null>
  save(data: FilesystemSnapshot): Promise<void>
  saveImmediate(data: FilesystemSnapshot): Promise<void>
  isAvailable(): boolean
  getBackendName(): string
}

class OPFSFilesystemAdapter implements FilesystemStorageAdapter {
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return
    await opfsStorage.init()
    this.initialized = true
    logger.info('[OPFSAdapter] Initialized')
  }

  async load(): Promise<FilesystemSnapshot | null> {
    await this.init()
    try {
      const data = await opfsStorage.loadMeta()
      if (data) {
        logger.info('[OPFSAdapter] Loaded filesystem snapshot from OPFS')
      }
      return data as FilesystemSnapshot | null
    } catch (error) {
      logger.error('[OPFSAdapter] Failed to load from OPFS:', error)
      return null
    }
  }

  async save(data: FilesystemSnapshot): Promise<void> {
    await this.init()
    try {
      await opfsStorage.saveMeta(data)
      logger.debug('[OPFSAdapter] Saved filesystem snapshot to OPFS')
    } catch (error) {
      logger.error('[OPFSAdapter] Failed to save to OPFS:', error)
      throw error
    }
  }

  async saveImmediate(data: FilesystemSnapshot): Promise<void> {
    await this.init()
    try {
      await opfsStorage.saveMetaImmediate(data)
      logger.debug('[OPFSAdapter] Saved filesystem snapshot to OPFS (immediate)')
    } catch (error) {
      logger.error('[OPFSAdapter] Failed to save to OPFS (immediate):', error)
      throw error
    }
  }

  isAvailable(): boolean {
    return Boolean(navigator.storage && navigator.storage.getDirectory)
  }

  getBackendName(): string {
    return 'OPFS'
  }
}

class IndexedDBFilesystemAdapter implements FilesystemStorageAdapter {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.db) return
    if (this.initPromise) return this.initPromise
    this.initPromise = this.openDB()
    return this.initPromise
  }

  private getDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('[IndexedDBAdapter] Database not initialized')
    }
    return this.db
  }

  private openDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('scp-terminal-db', 5)
      request.onerror = () => {
        this.initPromise = null
        reject(request.error)
      }
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      request.onblocked = () => {
        this.initPromise = null
        reject(new Error('IndexedDB blocked'))
      }
    })
  }

  async load(): Promise<FilesystemSnapshot | null> {
    await this.init()
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['filesystem'], 'readonly')
      const store = tx.objectStore('filesystem')
      const request = store.get('filesystem')
      request.onsuccess = () => {
        const data = request.result
        resolve(data ? { root: data.root, currentPath: data.currentPath } : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async save(data: FilesystemSnapshot): Promise<void> {
    await this.init()
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['filesystem'], 'readwrite')
      const store = tx.objectStore('filesystem')
      const request = store.put({
        key: 'filesystem',
        root: data.root,
        currentPath: data.currentPath,
        updatedAt: Date.now(),
      })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async saveImmediate(data: FilesystemSnapshot): Promise<void> {
    return this.save(data)
  }

  isAvailable(): boolean {
    return typeof indexedDB !== 'undefined'
  }

  getBackendName(): string {
    return 'IndexedDB'
  }
}

const STORAGE_PREF_KEY = 'scp_fs_backend'

function getPreferredBackend(): string {
  try {
    return localStorage.getItem(STORAGE_PREF_KEY) || 'opfs'
  } catch {
    return 'opfs'
  }
}

function setPreferredBackend(name: string): void {
  try {
    localStorage.setItem(STORAGE_PREF_KEY, name)
  } catch {
    logger.warn('[FileSystemAdapter] Failed to save storage preference')
  }
}

export function createStorageAdapter(): FilesystemStorageAdapter {
  const preferred = getPreferredBackend()
  const opfsAdapter = new OPFSFilesystemAdapter()
  const idbAdapter = new IndexedDBFilesystemAdapter()

  if (preferred === 'opfs' && opfsAdapter.isAvailable()) {
    return opfsAdapter
  }

  if (idbAdapter.isAvailable()) {
    return idbAdapter
  }

  return opfsAdapter
}

export async function migrateToOPFS(): Promise<boolean> {
  const opfsAdapter = new OPFSFilesystemAdapter()
  const idbAdapter = new IndexedDBFilesystemAdapter()

  if (!opfsAdapter.isAvailable()) {
    logger.warn('[Migration] OPFS not available, skipping migration')
    return false
  }

  try {
    const opfsData = await opfsAdapter.load()
    if (opfsData) {
      logger.info('[Migration] OPFS data already exists, skipping migration')
      setPreferredBackend('opfs')
      return true
    }

    await idbAdapter.init()
    const idbData = await idbAdapter.load()
    if (!idbData) {
      logger.info('[Migration] No IndexedDB data to migrate')
      setPreferredBackend('opfs')
      return true
    }

    await opfsAdapter.init()
    await opfsAdapter.saveImmediate(idbData)

    setPreferredBackend('opfs')
    logger.info('[Migration] Successfully migrated from IndexedDB to OPFS')
    return true
  } catch (error) {
    logger.error('[Migration] Failed to migrate to OPFS:', error)
    setPreferredBackend('indexeddb')
    return false
  }
}

export { OPFSFilesystemAdapter, IndexedDBFilesystemAdapter }
