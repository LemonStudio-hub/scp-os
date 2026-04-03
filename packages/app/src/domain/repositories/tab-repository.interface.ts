/**
 * Tab Repository Interface
 * Repository interface for tab entities
 */

import type { TabEntity, TabCollection, TabType, TabStatus } from '../entities'
import type { IRepository, QueryOptions } from './repository.interface'

/**
 * Tab Query Options
 */
export interface TabQueryOptions extends QueryOptions<TabEntity> {
  type?: TabType
  status?: TabStatus
}

/**
 * Tab Repository Interface
 */
export interface ITabRepository extends IRepository<TabEntity> {
  /**
   * Get tab collection
   */
  getCollection(): Promise<TabCollection>

  /**
   * Get active tab
   */
  getActive(): Promise<TabEntity | null>

  /**
   * Set active tab
   */
  setActive(tabId: string): Promise<void>

  /**
   * Find tabs by type
   */
  findByType(type: TabType): Promise<TabEntity[]>

  /**
   * Find tabs by status
   */
  findByStatus(status: TabStatus): Promise<TabEntity[]>

  /**
   * Find with query options
   */
  findWithQuery(options: TabQueryOptions): Promise<TabEntity[]>

  /**
   * Get tab count by type
   */
  getCountByType(): Promise<Record<TabType, number>>

  /**
   * Get tab count by status
   */
  getCountByStatus(): Promise<Record<TabStatus, number>>

  /**
   * Close tab
   */
  close(tabId: string): Promise<void>

  /**
   * Close all tabs
   */
  closeAll(): Promise<void>

  /**
   * Close inactive tabs
   */
  closeInactive(): Promise<void>

  /**
   * Get all tabs
   */
  getAll(): Promise<TabEntity[]>

  /**
   * Update tab status
   */
  updateStatus(tabId: string, status: TabStatus): Promise<void>

  /**
   * Update tab title
   */
  updateTitle(tabId: string, title: string): Promise<void>

  /**
   * Update tab data
   */
  updateData(tabId: string, key: string, value: any): Promise<void>
}