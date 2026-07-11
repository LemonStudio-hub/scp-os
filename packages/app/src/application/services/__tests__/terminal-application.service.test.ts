/**
 * Unit tests for TerminalApplicationService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TerminalApplicationService } from '../terminal-application.service'
import type { ITabRepository } from '../../../domain/repositories'
import { TabEntity } from '../../../domain/entities'

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-1234'),
}))

describe('TerminalApplicationService', () => {
  let service: TerminalApplicationService
  let mockTabRepository: ITabRepository

  const createMockTabRepository = (): ITabRepository => ({
    getCollection: vi.fn(),
    getActive: vi.fn(),
    setActive: vi.fn(),
    findByType: vi.fn(),
    findByStatus: vi.fn(),
    findWithQuery: vi.fn(),
    getCountByType: vi.fn(),
    getCountByStatus: vi.fn(),
    close: vi.fn(),
    closeAll: vi.fn(),
    closeInactive: vi.fn(),
    getAll: vi.fn(),
    updateStatus: vi.fn(),
    updateTitle: vi.fn(),
    updateData: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
    count: vi.fn(),
    clear: vi.fn(),
  })

  const createSampleTab = (
    overrides?: Partial<ConstructorParameters<typeof TabEntity>[0]>
  ): TabEntity => {
    return new TabEntity({
      id: 'mock-uuid-1234',
      title: 'Terminal',
      type: 'terminal',
      status: 'active',
      icon: 'terminal',
      closable: true,
      data: { content: '', cursorPosition: 0 },
      ...overrides,
    })
  }

  beforeEach(() => {
    mockTabRepository = createMockTabRepository()
    service = new TerminalApplicationService(mockTabRepository)
  })

  describe('name getter', () => {
    it('should return TerminalApplicationService', () => {
      expect(service.name).toBe('TerminalApplicationService')
    })
  })

  describe('createTerminalTab', () => {
    it('should create a tab with correct defaults', async () => {
      vi.mocked(mockTabRepository.save).mockImplementation(async (tab) => tab)
      vi.mocked(mockTabRepository.setActive).mockResolvedValue(undefined)

      const tab = await service.createTerminalTab()

      expect(tab.id).toBe('mock-uuid-1234')
      expect(tab.title).toBe('Terminal')
      expect(tab.type).toBe('terminal')
      expect(tab.status).toBe('active')
      expect(tab.icon).toBe('terminal')
      expect(tab.closable).toBe(true)
      expect(tab.data).toEqual({ content: '', cursorPosition: 0 })
    })

    it('should create a tab with custom title', async () => {
      vi.mocked(mockTabRepository.save).mockImplementation(async (tab) => tab)
      vi.mocked(mockTabRepository.setActive).mockResolvedValue(undefined)

      const tab = await service.createTerminalTab('My Terminal')

      expect(tab.title).toBe('My Terminal')
    })

    it('should save the tab to repository', async () => {
      vi.mocked(mockTabRepository.save).mockImplementation(async (tab) => tab)
      vi.mocked(mockTabRepository.setActive).mockResolvedValue(undefined)

      await service.createTerminalTab()

      expect(mockTabRepository.save).toHaveBeenCalledTimes(1)
      const savedTab = vi.mocked(mockTabRepository.save).mock.calls[0][0]
      expect(savedTab).toBeInstanceOf(TabEntity)
    })

    it('should set the tab as active', async () => {
      vi.mocked(mockTabRepository.save).mockImplementation(async (tab) => tab)
      vi.mocked(mockTabRepository.setActive).mockResolvedValue(undefined)

      await service.createTerminalTab()

      expect(mockTabRepository.setActive).toHaveBeenCalledWith('mock-uuid-1234')
    })
  })

  describe('getActiveTab', () => {
    it('should return active tab from repository', async () => {
      const activeTab = createSampleTab()
      vi.mocked(mockTabRepository.getActive).mockResolvedValue(activeTab)

      const result = await service.getActiveTab()

      expect(result).toEqual(activeTab)
      expect(mockTabRepository.getActive).toHaveBeenCalledTimes(1)
    })

    it('should return null when no active tab', async () => {
      vi.mocked(mockTabRepository.getActive).mockResolvedValue(null)

      const result = await service.getActiveTab()

      expect(result).toBeNull()
    })
  })

  describe('setActiveTab', () => {
    it('should delegate to repository.setActive', async () => {
      vi.mocked(mockTabRepository.setActive).mockResolvedValue(undefined)

      await service.setActiveTab('tab-123')

      expect(mockTabRepository.setActive).toHaveBeenCalledWith('tab-123')
    })
  })

  describe('closeTab', () => {
    it('should delegate to repository.close', async () => {
      vi.mocked(mockTabRepository.close).mockResolvedValue(undefined)

      await service.closeTab('tab-123')

      expect(mockTabRepository.close).toHaveBeenCalledWith('tab-123')
    })
  })

  describe('getAllTabs', () => {
    it('should return all tabs from repository', async () => {
      const tabs = [createSampleTab()]
      vi.mocked(mockTabRepository.getAll).mockResolvedValue(tabs)

      const result = await service.getAllTabs()

      expect(result).toEqual(tabs)
      expect(mockTabRepository.getAll).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when no tabs', async () => {
      vi.mocked(mockTabRepository.getAll).mockResolvedValue([])

      const result = await service.getAllTabs()

      expect(result).toEqual([])
    })
  })

  describe('updateTabContent', () => {
    it('should update content via repository.updateData', async () => {
      vi.mocked(mockTabRepository.updateData).mockResolvedValue(undefined)

      await service.updateTabContent('tab-123', 'new content')

      expect(mockTabRepository.updateData).toHaveBeenCalledWith('tab-123', 'content', 'new content')
    })
  })

  describe('getTabContent', () => {
    it('should return content from tab data', async () => {
      const tab = createSampleTab({ data: { content: 'hello world' } })
      vi.mocked(mockTabRepository.findById).mockResolvedValue(tab)

      const result = await service.getTabContent('tab-123')

      expect(result).toBe('hello world')
      expect(mockTabRepository.findById).toHaveBeenCalledWith('tab-123')
    })

    it('should return empty string when tab not found', async () => {
      vi.mocked(mockTabRepository.findById).mockResolvedValue(null)

      const result = await service.getTabContent('nonexistent')

      expect(result).toBe('')
    })

    it('should return empty string when tab has no content', async () => {
      const tab = createSampleTab({ data: {} })
      vi.mocked(mockTabRepository.findById).mockResolvedValue(tab)

      const result = await service.getTabContent('tab-123')

      expect(result).toBe('')
    })
  })

  describe('initialize', () => {
    it('should create a terminal tab when no tabs exist', async () => {
      vi.mocked(mockTabRepository.getAll).mockResolvedValue([])
      vi.mocked(mockTabRepository.save).mockImplementation(async (tab) => tab)
      vi.mocked(mockTabRepository.setActive).mockResolvedValue(undefined)

      await service.initialize()

      expect(mockTabRepository.getAll).toHaveBeenCalledTimes(1)
      expect(mockTabRepository.save).toHaveBeenCalledTimes(1)
      const savedTab = vi.mocked(mockTabRepository.save).mock.calls[0][0]
      expect(savedTab.type).toBe('terminal')
      expect(savedTab.title).toBe('Terminal')
    })

    it('should skip tab creation when tabs already exist', async () => {
      const existingTabs = [createSampleTab()]
      vi.mocked(mockTabRepository.getAll).mockResolvedValue(existingTabs)

      await service.initialize()

      expect(mockTabRepository.getAll).toHaveBeenCalledTimes(1)
      expect(mockTabRepository.save).not.toHaveBeenCalled()
      expect(mockTabRepository.setActive).not.toHaveBeenCalled()
    })
  })
})
