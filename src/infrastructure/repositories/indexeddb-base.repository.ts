/**
 * IndexedDB Base Repository
 * Base repository implementation using IndexedDB
 */

import type { IRepository, QueryOptions, QueryResult } from '../../domain/repositories'
import type { Entity } from '../../domain/entities'

/**
 * IndexedDB Base Repository
 */
export abstract class IndexedDBBaseRepository<T extends Entity> implements IRepository<T> {
  protected db: IDBDatabase | null = null
  protected readonly storeName: string
  protected readonly dbName: string
  protected readonly dbVersion: number

  constructor(
    storeName: string,
    dbName: string = 'scp-terminal-db',
    dbVersion: number = 1
  ) {
    this.storeName = storeName
    this.dbName = dbName
    this.dbVersion = dbVersion
  }

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error(`[IndexedDB] Failed to open database:`, request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log(`[IndexedDB] Database opened successfully`)
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        this.onUpgradeNeeded(db)
      }
    })
  }

  /**
   * Handle database upgrade
   * Subclasses should override this to create object stores
   */
  protected abstract onUpgradeNeeded(db: IDBDatabase): void

  /**
   * Get database instance
   */
  protected getDB(): IDBDatabase {
    if (!this.db) {
      throw new Error(`[IndexedDB] Database not initialized. Call initialize() first.`)
    }
    return this.db
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        const data = request.result
        resolve(data ? this.fromDB(data) : null)
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Find all entities
   */
  async findAll(): Promise<T[]> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        const entities = request.result.map((data: any) => this.fromDB(data))
        resolve(entities)
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Find entities with query options
   */
  async find(options: QueryOptions<T>): Promise<QueryResult<T>> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        let entities = request.result.map((data: any) => this.fromDB(data))

        // Apply filter
        if (options.filter) {
          entities = entities.filter(options.filter)
        }

        // Get total before limit/offset
        const total = entities.length

        // Apply sort
        if (options.sort) {
          entities.sort(options.sort)
        }

        // Apply offset
        if (options.offset) {
          entities = entities.slice(options.offset)
        }

        // Apply limit
        const hasMore = options.limit ? entities.length > options.limit : false
        if (options.limit) {
          entities = entities.slice(0, options.limit)
        }

        resolve({
          data: entities,
          total,
          hasMore
        })
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Find one entity matching filter
   */
  async findOne(filter: (entity: T) => boolean): Promise<T | null> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        const entities = request.result.map((data: any) => this.fromDB(data))
        const entity = entities.find(filter)
        resolve(entity || null)
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Save entity (create or update)
   */
  async save(entity: T): Promise<T> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      const data = this.toDB(entity)
      const request = store.put(data)

      request.onsuccess = () => resolve(entity)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<void> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    const entity = await this.findById(id)
    return entity !== null
  }

  /**
   * Count entities
   */
  async count(): Promise<number> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear all entities
   */
  async clear(): Promise<void> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Convert entity to DB format
   * Subclasses should override this
   */
  protected abstract toDB(entity: T): any

  /**
   * Convert DB format to entity
   * Subclasses should override this
   */
  protected abstract fromDB(data: any): T
}