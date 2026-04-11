/**
 * Tab IndexedDB Repository
 * IndexedDB implementation for tab repository
 */

import type { ITabRepository, TabQueryOptions } from '../../domain/repositories'
import { TabEntity, TabCollection } from '../../domain/entities'
import type { TabType, TabStatus } from '../../domain/entities'
import { IndexedDBBaseRepository } from './indexeddb-base.repository'
import logger from '../../utils/logger'

/**
 * Tab IndexedDB Repository
 */
export class TabIndexedDBRepository
  extends IndexedDBBaseRepository<TabEntity>
  implements ITabRepository
{
  private static readonly METADATA_KEY = '_metadata'

  constructor() {
    super('tabs')
  }

  /**
   * Handle database upgrade
   */
  protected onUpgradeNeeded(db: IDBDatabase): void {
    if (!db.objectStoreNames.contains(this.storeName)) {
      const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
      store.createIndex('type', 'type', { unique: false })
      store.createIndex('status', 'status', { unique: false })
      store.createIndex('createdAt', 'createdAt', { unique: false })
      store.createIndex('updatedAt', 'updatedAt', { unique: false })
      logger.info(`[IndexedDB] Created ${this.storeName} store`)
    }
  }

  /**
   * Convert entity to DB format
   */
  protected toDB(entity: TabEntity): any {
    return entity.toJSON()
  }

  /**
   * Convert DB format to entity
   */
  protected fromDB(data: any): TabEntity {
    return TabEntity.fromJSON(data)
  }

  /**
   * Get tab collection
   */
  async getCollection(): Promise<TabCollection> {
    const entities = await this.findAll()
    const collection = new TabCollection()
    entities.forEach(entity => collection.add(entity))

    // Set active tab from metadata
    const metadata = await this.getMetadata()
    if (metadata.activeTabId) {
      try {
        collection.setActive(metadata.activeTabId)
      } catch (error) {
        logger.warn(`[TabRepository] Failed to set active tab: ${error}`)
      }
    }

    return collection
  }

  /**
   * Get active tab
   */
  async getActive(): Promise<TabEntity | null> {
    const metadata = await this.getMetadata()
    if (!metadata.activeTabId) {
      return null
    }
    return this.findById(metadata.activeTabId)
  }

  /**
   * Set active tab
   */
  async setActive(tabId: string): Promise<void> {
    await this.saveMetadata({ activeTabId: tabId })
  }

  /**
   * Find tabs by type
   */
  async findByType(type: TabType): Promise<TabEntity[]> {
    const result = await this.find({
      filter: entity => entity.type === type
    })
    return result.data
  }

  /**
   * Find tabs by status
   */
  async findByStatus(status: TabStatus): Promise<TabEntity[]> {
    const result = await this.find({
      filter: entity => entity.status === status
    })
    return result.data
  }

  /**
   * Find with query options
   */
  async findWithQuery(options: TabQueryOptions): Promise<TabEntity[]> {
    const filters: ((entity: TabEntity) => boolean)[] = []

    if (options.filter) {
      filters.push(options.filter)
    }

    if (options.type) {
      filters.push(entity => entity.type === options.type)
    }

    if (options.status) {
      filters.push(entity => entity.status === options.status)
    }

    const combinedFilter = filters.length > 0
      ? (entity: TabEntity) => filters.every(f => f(entity))
      : undefined

    const result = await super.find({
      ...options,
      filter: combinedFilter
    })
    return result.data
  }

  /**
   * Get tab count by type
   */
  async getCountByType(): Promise<Record<TabType, number>> {
    const entities = await this.findAll()
    const counts: Record<string, number> = {}

    entities.forEach(entity => {
      counts[entity.type] = (counts[entity.type] || 0) + 1
    })

    return counts as Record<TabType, number>
  }

  /**
   * Get tab count by status
   */
  async getCountByStatus(): Promise<Record<TabStatus, number>> {
    const entities = await this.findAll()
    const counts: Record<string, number> = {}

    entities.forEach(entity => {
      counts[entity.status] = (counts[entity.status] || 0) + 1
    })

    return counts as Record<TabStatus, number>
  }

  /**
   * Close tab
   */
  async close(tabId: string): Promise<void> {
    const tab = await this.findById(tabId)
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`)
    }

    if (!tab.closable) {
      throw new Error(`Tab ${tabId} is not closable`)
    }

    await this.delete(tabId)

    // Update active tab if needed
    const metadata = await this.getMetadata()
    if (metadata.activeTabId === tabId) {
      const remaining = await this.findAll()
      if (remaining.length > 0) {
        await this.setActive(remaining[remaining.length - 1].id)
      } else {
        await this.saveMetadata({ activeTabId: null })
      }
    }
  }

  /**
   * Close all tabs
   */
  async closeAll(): Promise<void> {
    await this.clear()
    await this.saveMetadata({ activeTabId: null })
  }

  /**
   * Close inactive tabs
   */
  async closeInactive(): Promise<void> {
    const inactiveTabs = await this.findByStatus('inactive')
    for (const tab of inactiveTabs) {
      if (tab.closable) {
        await this.delete(tab.id)
      }
    }
  }

  /**
   * Get all tabs
   */
  async getAll(): Promise<TabEntity[]> {
    return this.findAll()
  }

  /**
   * Update tab status
   */
  async updateStatus(tabId: string, status: TabStatus): Promise<void> {
    const tab = await this.findById(tabId)
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`)
    }

    const json = tab.toJSON()
    const updated = new TabEntity({
      ...json,
      status,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date()
    })

    await this.save(updated)
  }

  /**
   * Update tab title
   */
  async updateTitle(tabId: string, title: string): Promise<void> {
    const tab = await this.findById(tabId)
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`)
    }

    const json = tab.toJSON()
    const updated = new TabEntity({
      ...json,
      title,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date()
    })

    await this.save(updated)
  }

  /**
   * Update tab data
   */
  async updateData(tabId: string, key: string, value: any): Promise<void> {
    const tab = await this.findById(tabId)
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`)
    }

    const json = tab.toJSON()
    const updated = new TabEntity({
      ...json,
      data: {
        ...tab.data,
        [key]: value
      },
      createdAt: new Date(json.createdAt),
      updatedAt: new Date()
    })

    await this.save(updated)
  }

  /**
   * Get metadata
   */
  private async getMetadata(): Promise<{ activeTabId: string | null }> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(TabIndexedDBRepository.METADATA_KEY)

      request.onsuccess = () => {
        const data = request.result
        resolve({
          activeTabId: data?.activeTabId || null
        })
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Save metadata
   */
  private async saveMetadata(metadata: { activeTabId: string | null }): Promise<void> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      const data = {
        id: TabIndexedDBRepository.METADATA_KEY,
        ...metadata,
        updatedAt: Date.now()
      }

      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}