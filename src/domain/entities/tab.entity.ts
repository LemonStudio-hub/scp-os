/**
 * Tab Domain Entity
 * Represents a tab in the terminal interface
 */

import type { Entity } from './entity.interface'

export type TabType = 'terminal' | 'scp-browser' | 'database' | 'settings'

export type TabStatus = 'active' | 'inactive' | 'loading' | 'error'

/**
 * Tab Entity
 */
export class TabEntity implements Entity {
  /**
   * Unique identifier
   */
  readonly id: string

  /**
   * Tab title
   */
  title: string

  /**
   * Tab type
   */
  readonly type: TabType

  /**
   * Tab status
   */
  status: TabStatus

  /**
   * Tab icon
   */
  readonly icon?: string

  /**
   * Whether tab is closable
   */
  readonly closable: boolean

  /**
   * Tab data (custom payload)
   */
  data: Record<string, any>

  /**
   * Creation timestamp
   */
  readonly createdAt: Date

  /**
   * Last update timestamp
   */
  updatedAt: Date

  constructor(data: {
    id: string
    title: string
    type: TabType
    status?: TabStatus
    icon?: string
    closable?: boolean
    data?: Record<string, any>
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.id = data.id
    this.title = data.title
    this.type = data.type
    this.status = data.status ?? 'active'
    this.icon = data.icon
    this.closable = data.closable ?? true
    this.data = data.data ?? {}
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
  }

  /**
   * Update tab status
   */
  setStatus(status: TabStatus): void {
    this.status = status
    this.updatedAt = new Date()
  }

  /**
   * Update tab title
   */
  setTitle(title: string): void {
    this.title = title
    this.updatedAt = new Date()
  }

  /**
   * Update tab data
   */
  setData(key: string, value: any): void {
    this.data[key] = value
    this.updatedAt = new Date()
  }

  /**
   * Get tab data
   */
  getData(key: string): any {
    return this.data[key]
  }

  /**
   * Check if tab is active
   */
  isActive(): boolean {
    return this.status === 'active'
  }

  /**
   * Check if tab is loading
   */
  isLoading(): boolean {
    return this.status === 'loading'
  }

  /**
   * Check if tab has error
   */
  hasError(): boolean {
    return this.status === 'error'
  }

  /**
   * Convert to plain object
   */
  toJSON(): {
    id: string
    title: string
    type: TabType
    status: TabStatus
    icon?: string
    closable: boolean
    data: Record<string, any>
    createdAt: string
    updatedAt: string
  } {
    return {
      id: this.id,
      title: this.title,
      type: this.type,
      status: this.status,
      icon: this.icon,
      closable: this.closable,
      data: this.data,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    }
  }

  /**
   * Create from plain object
   */
  static fromJSON(data: {
    id: string
    title: string
    type: TabType
    status: TabStatus
    icon?: string
    closable: boolean
    data: Record<string, any>
    createdAt?: string
    updatedAt?: string
  }): TabEntity {
    return new TabEntity({
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
    })
  }
}

/**
 * Tab Collection
 * Manages a collection of tabs
 */
export class TabCollection {
  private tabs: Map<string, TabEntity>
  private activeTabId: string | null = null

  constructor() {
    this.tabs = new Map()
  }

  /**
   * Add a tab
   */
  add(tab: TabEntity): void {
    this.tabs.set(tab.id, tab)
    if (!this.activeTabId) {
      this.setActive(tab.id)
    }
  }

  /**
   * Remove a tab
   */
  remove(tabId: string): void {
    const tab = this.tabs.get(tabId)
    if (tab && !tab.closable) {
      throw new Error(`Tab ${tabId} is not closable`)
    }

    this.tabs.delete(tabId)

    // If removed tab was active, set another tab as active
    if (this.activeTabId === tabId) {
      const remainingTabs = Array.from(this.tabs.values())
      if (remainingTabs.length > 0) {
        this.setActive(remainingTabs[remainingTabs.length - 1].id)
      } else {
        this.activeTabId = null
      }
    }
  }

  /**
   * Get tab by ID
   */
  get(tabId: string): TabEntity | undefined {
    return this.tabs.get(tabId)
  }

  /**
   * Get all tabs
   */
  getAll(): TabEntity[] {
    return Array.from(this.tabs.values())
  }

  /**
   * Get active tab
   */
  getActive(): TabEntity | undefined {
    return this.activeTabId ? this.tabs.get(this.activeTabId) : undefined
  }

  /**
   * Set active tab
   */
  setActive(tabId: string): void {
    const tab = this.tabs.get(tabId)
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`)
    }

    // Deactivate all tabs
    for (const t of this.tabs.values()) {
      t.setStatus('inactive')
    }

    // Activate selected tab
    tab.setStatus('active')
    this.activeTabId = tabId
  }

  /**
   * Get active tab ID
   */
  getActiveId(): string | null {
    return this.activeTabId
  }

  /**
   * Clear all tabs
   */
  clear(): void {
    this.tabs.clear()
    this.activeTabId = null
  }

  /**
   * Get tab count
   */
  getCount(): number {
    return this.tabs.size
  }

  /**
   * Check if tab exists
   */
  has(tabId: string): boolean {
    return this.tabs.has(tabId)
  }
}