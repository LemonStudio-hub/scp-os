/**
 * Tab Memory Repository
 * Memory implementation for tab repository
 */

import type { ITabRepository, TabQueryOptions } from '../../domain/repositories'
import { TabEntity, TabCollection } from '../../domain/entities'
import type { TabType, TabStatus } from '../../domain/entities'
import { MemoryBaseRepository } from './memory-base.repository'

/**
 * Tab Memory Repository
 */
export class TabMemoryRepository
  extends MemoryBaseRepository<TabEntity>
  implements ITabRepository
{
  private collection = new TabCollection()
  private activeTabId: string | null = null

  /**
   * Get tab collection
   */
  async getCollection(): Promise<TabCollection> {
    // Rebuild collection from current entities
    const entities = await this.findAll()
    this.collection = new TabCollection()
    entities.forEach(entity => this.collection.add(entity))

    // Set active tab
    if (this.activeTabId) {
      try {
        this.collection.setActive(this.activeTabId)
      } catch (error) {
        console.warn(`[TabRepository] Failed to set active tab: ${error}`)
      }
    }

    return this.collection
  }

  /**
   * Get active tab
   */
  async getActive(): Promise<TabEntity | null> {
    if (!this.activeTabId) {
      return null
    }
    return this.findById(this.activeTabId)
  }

  /**
   * Set active tab
   */
  async setActive(tabId: string): Promise<void> {
    this.activeTabId = tabId
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
    let filters: ((entity: TabEntity) => boolean)[] = []

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
    if (this.activeTabId === tabId) {
      const remaining = await this.findAll()
      if (remaining.length > 0) {
        await this.setActive(remaining[remaining.length - 1].id)
      } else {
        this.activeTabId = null
      }
    }
  }

  /**
   * Close all tabs
   */
  async closeAll(): Promise<void> {
    await this.clear()
    this.collection.clear()
    this.activeTabId = null
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
}