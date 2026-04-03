/**
 * Terminal Application Service
 * Manages terminal operations and state
 */

import type { IApplicationService } from './application-service.interface'
import type { ITabRepository } from '../../domain/repositories'
import { TabEntity } from '../../domain/entities'
import type { TabType } from '../../domain/entities'
import { v4 as uuidv4 } from 'uuid'

/**
 * Terminal Application Service
 */
export class TerminalApplicationService implements IApplicationService {
  private readonly _name = 'TerminalApplicationService'
  private tabRepository: ITabRepository

  get name(): string {
    return this._name
  }

  constructor(tabRepository: ITabRepository) {
    this.tabRepository = tabRepository
  }

  /**
   * Create a new terminal tab
   */
  async createTerminalTab(title: string = 'Terminal'): Promise<TabEntity> {
    const tab = new TabEntity({
      id: uuidv4(),
      title,
      type: 'terminal' as TabType,
      status: 'active',
      icon: 'terminal',
      closable: true,
      data: {
        content: '',
        cursorPosition: 0
      }
    })

    await this.tabRepository.save(tab)
    await this.tabRepository.setActive(tab.id)

    return tab
  }

  /**
   * Get active tab
   */
  async getActiveTab(): Promise<TabEntity | null> {
    return this.tabRepository.getActive()
  }

  /**
   * Set active tab
   */
  async setActiveTab(tabId: string): Promise<void> {
    await this.tabRepository.setActive(tabId)
  }

  /**
   * Close tab
   */
  async closeTab(tabId: string): Promise<void> {
    await this.tabRepository.close(tabId)
  }

  /**
   * Get all tabs
   */
  async getAllTabs(): Promise<TabEntity[]> {
    return this.tabRepository.getAll()
  }

  /**
   * Update tab content
   */
  async updateTabContent(tabId: string, content: string): Promise<void> {
    await this.tabRepository.updateData(tabId, 'content', content)
  }

  /**
   * Get tab content
   */
  async getTabContent(tabId: string): Promise<string> {
    const tab = await this.tabRepository.findById(tabId)
    return tab?.getData('content') || ''
  }

  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    // Create initial terminal tab if no tabs exist
    const tabs = await this.tabRepository.getAll()
    if (tabs.length === 0) {
      await this.createTerminalTab()
    }
  }
}