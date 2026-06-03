import logger from './logger'

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
    if (!this.db) throw new Error('[IndexedDBAdapter] Database not initialized')
    return this.db
  }

  private openDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('scp-terminal-db', 5)
      request.onerror = () => { this.initPromise = null; reject(request.error) }
      request.onsuccess = () => { this.db = request.result; resolve() }
      request.onblocked = () => { this.initPromise = null; reject(new Error('IndexedDB blocked')) }
    })
  }

  async load(): Promise<FilesystemSnapshot | null> {
    await this.init()
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['filesystem'], 'readonly')
      const request = tx.objectStore('filesystem').get('filesystem')
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
      const request = tx.objectStore('filesystem').put({
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

  isAvailable(): boolean { return typeof indexedDB !== 'undefined' }
  getBackendName(): string { return 'IndexedDB' }
}

export function createStorageAdapter(): FilesystemStorageAdapter {
  return new IndexedDBFilesystemAdapter()
}

// One-time migration: if OPFS has filesystem data and IDB doesn't, copy it over
export async function migrateFromOPFS(): Promise<void> {
  try {
    if (!navigator.storage?.getDirectory) return
    const opfsRoot = await navigator.storage.getDirectory()
    let metaFile: FileSystemFileHandle | null = null
    try {
      metaFile = await opfsRoot.getFileHandle('meta.json')
    } catch {
      return // no OPFS data
    }
    if (!metaFile) return

    const idbAdapter = new IndexedDBFilesystemAdapter()
    await idbAdapter.init()
    const existing = await idbAdapter.load()
    if (existing) {
      logger.info('[Migration] IDB filesystem already has data, skipping OPFS migration')
      return
    }

    const file = await metaFile.getFile()
    const text = await file.text()
    const snapshot = JSON.parse(text) as FilesystemSnapshot
    await idbAdapter.save(snapshot)
    logger.info('[Migration] Migrated filesystem from OPFS to IndexedDB')

    // Clear the OPFS meta file so we don't re-migrate
    try { await opfsRoot.removeEntry('meta.json') } catch { /* ignore */ }
  } catch (err) {
    logger.warn('[Migration] OPFS→IDB migration failed (non-fatal):', err)
  }
}
