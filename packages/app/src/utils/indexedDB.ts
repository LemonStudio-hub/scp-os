/**
 * IndexedDB Service for storing terminal data
 * Provides persistent storage for tabs and terminal content
 */

import { v4 as uuidv4 } from 'uuid'
import logger from './logger'

const DB_NAME = 'scp-terminal-db'
const DB_VERSION = 4
const STORES = {
  TABS: 'tabs',
  TERMINAL_STATES: 'terminal_states',
  FILESYSTEM: 'filesystem',
  GUI_WINDOWS: 'gui_windows',
  USER_SETTINGS: 'user_settings'
}

class IndexedDBService {
  private db: IDBDatabase | null = null

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        logger.error('[IndexedDB] Failed to open database:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        logger.info('[IndexedDB] Database opened successfully')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create tabs store
        if (!db.objectStoreNames.contains(STORES.TABS)) {
          const tabsStore = db.createObjectStore(STORES.TABS, { keyPath: 'id' })
          tabsStore.createIndex('isActive', 'isActive', { unique: false })
          tabsStore.createIndex('isLocked', 'isLocked', { unique: false })
          tabsStore.createIndex('createdAt', 'createdAt', { unique: false })
          tabsStore.createIndex('lastActiveAt', 'lastActiveAt', { unique: false })
          logger.info('[IndexedDB] Created tabs store')
        }

        // Create terminal states store
        if (!db.objectStoreNames.contains(STORES.TERMINAL_STATES)) {
          const terminalStore = db.createObjectStore(STORES.TERMINAL_STATES, { keyPath: 'tabId' })
          terminalStore.createIndex('updatedAt', 'updatedAt', { unique: false })
          logger.info('[IndexedDB] Created terminal states store')
        }

        // Create filesystem store
        if (!db.objectStoreNames.contains(STORES.FILESYSTEM)) {
          const fsStore = db.createObjectStore(STORES.FILESYSTEM, { keyPath: 'key' })
          fsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
          logger.info('[IndexedDB] Created filesystem store')
        }

        // Create GUI windows store
        if (!db.objectStoreNames.contains(STORES.GUI_WINDOWS)) {
          const guiStore = db.createObjectStore(STORES.GUI_WINDOWS, { keyPath: 'config.id' })
          guiStore.createIndex('tool', 'config.tool', { unique: false })
          guiStore.createIndex('createdAt', 'createdAt', { unique: false })
          logger.info('[IndexedDB] Created GUI windows store')
        }

        // Create user settings store
        if (!db.objectStoreNames.contains(STORES.USER_SETTINGS)) {
          const userStore = db.createObjectStore(STORES.USER_SETTINGS, { keyPath: 'key' })
          userStore.createIndex('updatedAt', 'updatedAt', { unique: false })
          logger.info('[IndexedDB] Created user settings store')
        }
      }
    })
  }

  /**
   * Get database instance
   */
  private getDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('[IndexedDB] Database not initialized. Call init() first.')
    }
    return this.db
  }

  /**
   * Save tabs data
   */
  async saveTabs(tabs: any[], activeTabId: string, sidebarOpen: boolean): Promise<void> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TABS], 'readwrite')
      const store = transaction.objectStore(STORES.TABS)

      // Clear existing tabs
      const clearRequest = store.clear()

      clearRequest.onsuccess = () => {
        // Add all tabs
      const addRequests = tabs.map(tab => {
        return new Promise<void>((addResolve, addReject) => {
          // Convert tab to plain object to avoid DataCloneError
          const plainTab = JSON.parse(JSON.stringify(tab))
          const request = store.add(plainTab)
          request.onsuccess = () => addResolve()
          request.onerror = () => addReject(request.error)
        })
      })

        Promise.all(addRequests)
          .then(() => {
            // Save metadata
            const metadataStore = transaction.objectStore(STORES.TABS)
            const metadata = {
              id: '_metadata',
              activeTabId,
              sidebarOpen,
              updatedAt: Date.now()
            }
            const metaRequest = metadataStore.add(metadata)
            metaRequest.onsuccess = () => resolve()
            metaRequest.onerror = () => reject(metaRequest.error)
          })
          .catch(reject)
      }

      clearRequest.onerror = () => reject(clearRequest.error)
    })
  }

  /**
   * Load tabs data
   */
  async loadTabs(): Promise<{ tabs: any[], activeTabId: string, sidebarOpen: boolean }> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TABS], 'readonly')
      const store = transaction.objectStore(STORES.TABS)

      const request = store.getAll()

      request.onsuccess = () => {
        const allData = request.result
        const tabs = allData.filter((item: any) => item.id !== '_metadata')
        const metadata = allData.find((item: any) => item.id === '_metadata')

        resolve({
          tabs,
          activeTabId: metadata?.activeTabId || '',
          sidebarOpen: metadata?.sidebarOpen || false
        })
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Save terminal state for a specific tab
   */
  async saveTerminalState(tabId: string, content: string | string[]): Promise<void> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TERMINAL_STATES], 'readwrite')
      const store = transaction.objectStore(STORES.TERMINAL_STATES)

      const data = {
        tabId,
        content,
        updatedAt: Date.now()
      }

      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Load terminal state for a specific tab
   */
  async loadTerminalState(tabId: string): Promise<string | string[] | null> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TERMINAL_STATES], 'readonly')
      const store = transaction.objectStore(STORES.TERMINAL_STATES)

      const request = store.get(tabId)

      request.onsuccess = () => {
        const data = request.result
        resolve(data?.content || null)
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Load all terminal states
   */
  async loadAllTerminalStates(): Promise<Record<string, string | string[]>> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TERMINAL_STATES], 'readonly')
      const store = transaction.objectStore(STORES.TERMINAL_STATES)

      const request = store.getAll()

      request.onsuccess = () => {
        const states: Record<string, string | string[]> = {}
        request.result.forEach((item: any) => {
          states[item.tabId] = item.content
        })
        resolve(states)
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete terminal state for a specific tab
   */
  async deleteTerminalState(tabId: string): Promise<void> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TERMINAL_STATES], 'readwrite')
      const store = transaction.objectStore(STORES.TERMINAL_STATES)

      const request = store.delete(tabId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TABS, STORES.TERMINAL_STATES], 'readwrite')

      const tabsStore = transaction.objectStore(STORES.TABS)
      const terminalStore = transaction.objectStore(STORES.TERMINAL_STATES)

      const tabsClear = tabsStore.clear()
      const terminalClear = terminalStore.clear()

      let cleared = 0
      const checkComplete = () => {
        cleared++
        if (cleared === 2) {
          resolve()
        }
      }

      tabsClear.onsuccess = checkComplete
      tabsClear.onerror = () => reject(tabsClear.error)

      terminalClear.onsuccess = checkComplete
      terminalClear.onerror = () => reject(terminalClear.error)
    })
  }

  /**
   * Get database size estimate
   */
  async getStorageSize(): Promise<number> {
    const db = this.getDB()
    return new Promise((resolve) => {
      const transaction = db.transaction([STORES.TABS, STORES.TERMINAL_STATES, STORES.FILESYSTEM], 'readonly')

      let totalSize = 0
      let completed = 0
      const totalStores = 3

      const checkComplete = () => {
        completed++
        if (completed === totalStores) {
          resolve(totalSize)
        }
      }

      const estimateSize = (storeName: string) => {
        const store = transaction.objectStore(storeName)
        const request = store.getAllKeys()
        
        request.onsuccess = () => {
          const keys = request.result
          
          if (keys.length === 0) {
            checkComplete()
            return
          }

          let keyCount = 0
          
          keys.forEach((key) => {
            const getReq = store.get(key)
            getReq.onsuccess = () => {
              const data = getReq.result
              if (data) {
                totalSize += JSON.stringify(data).length
              }
              keyCount++
              if (keyCount === keys.length) {
                checkComplete()
              }
            }
            getReq.onerror = () => {
              keyCount++
              if (keyCount === keys.length) {
                checkComplete()
              }
            }
          })
        }

        request.onerror = () => {
          checkComplete()
        }
      }

      estimateSize(STORES.TABS)
      estimateSize(STORES.TERMINAL_STATES)
      estimateSize(STORES.FILESYSTEM)
    })
  }

  /**
   * Save filesystem data
   */
  async saveFilesystem(root: any, currentPath: string[]): Promise<void> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.FILESYSTEM], 'readwrite')
      const store = transaction.objectStore(STORES.FILESYSTEM)

      const data = {
        key: 'filesystem',
        root,
        currentPath,
        updatedAt: Date.now()
      }

      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Load filesystem data
   */
  async loadFilesystem(): Promise<{ root: any, currentPath: string[] } | null> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.FILESYSTEM], 'readonly')
      const store = transaction.objectStore(STORES.FILESYSTEM)

      const request = store.get('filesystem')

      request.onsuccess = () => {
        const data = request.result
        if (data) {
          resolve({
            root: data.root,
            currentPath: data.currentPath
          })
        } else {
          resolve(null)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  // ── GUI Windows Store ──────────────────────────────────────────────

  async saveGUIWindowState(windowData: any): Promise<void> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.GUI_WINDOWS], 'readwrite')
      const store = transaction.objectStore(STORES.GUI_WINDOWS)

      const data = {
        ...windowData,
        updatedAt: Date.now()
      }

      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async deleteGUIWindowState(windowId: string): Promise<void> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.GUI_WINDOWS], 'readwrite')
      const store = transaction.objectStore(STORES.GUI_WINDOWS)

      const request = store.delete(windowId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async loadGUIWindowStates(): Promise<any[]> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.GUI_WINDOWS], 'readonly')
      const store = transaction.objectStore(STORES.GUI_WINDOWS)

      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => reject(request.error)
    })
  }

  // ==================== User ID Management ====================

  /**
   * 获取用户 ID，如果不存在则自动生成并存储
   */
  async getUserId(): Promise<string> {
    try {
      await this.init()
      const savedId = await this.loadSetting('user_id')
      if (savedId) {
        logger.info('[IndexedDB] Loaded existing user ID:', savedId)
        return savedId
      }

      // 首次访问，使用 uuid 包生成新的用户 ID
      const newUserId = uuidv4()
      await this.saveSetting('user_id', newUserId)
      logger.info('[IndexedDB] Generated new user ID:', newUserId)
      return newUserId
    } catch (error) {
      logger.error('[IndexedDB] Failed to get user ID:', error)
      // 降级方案：使用 uuid 包生成 UUID
      return uuidv4()
    }
  }

  /**
   * 保存设置项
   */
  async saveSetting(key: string, value: any): Promise<void> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.USER_SETTINGS], 'readwrite')
      const store = transaction.objectStore(STORES.USER_SETTINGS)

      const request = store.put({
        key,
        value,
        updatedAt: new Date().toISOString()
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 加载设置项
   */
  async loadSetting(key: string): Promise<any> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.USER_SETTINGS], 'readonly')
      const store = transaction.objectStore(STORES.USER_SETTINGS)

      const request = store.get(key)

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null)
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 删除设置项
   */
  async deleteSetting(key: string): Promise<void> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.USER_SETTINGS], 'readwrite')
      const store = transaction.objectStore(STORES.USER_SETTINGS)

      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 清除所有设置
   */
  async clearUserSettings(): Promise<void> {
    const db = this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.USER_SETTINGS], 'readwrite')
      const store = transaction.objectStore(STORES.USER_SETTINGS)

      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // ==================== User Authentication ====================

  /**
   * 保存用户昵称
   */
  async saveNickname(nickname: string): Promise<void> {
    return this.saveSetting('nickname', nickname)
  }

  /**
   * 获取已保存的昵称
   */
  async getNickname(): Promise<string | null> {
    const value = await this.loadSetting('nickname')
    return value as string | null
  }

  /**
   * 清除用户相关数据（昵称等）
   */
  async clearUserData(): Promise<void> {
    try {
      await this.deleteSetting('nickname')
      logger.info('[IndexedDB] User data cleared')
    } catch (error) {
      logger.error('[IndexedDB] Failed to clear user data:', error)
      throw error
    }
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService()
export default indexedDBService