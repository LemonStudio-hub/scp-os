/**
 * IndexedDB Service for storing terminal data
 * Provides persistent storage for tabs and terminal content
 */

const DB_NAME = 'scp-terminal-db'
const DB_VERSION = 2
const STORES = {
  TABS: 'tabs',
  TERMINAL_STATES: 'terminal_states',
  FILESYSTEM: 'filesystem'
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
        console.error('[IndexedDB] Failed to open database:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('[IndexedDB] Database opened successfully')
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
          console.log('[IndexedDB] Created tabs store')
        }

        // Create terminal states store
        if (!db.objectStoreNames.contains(STORES.TERMINAL_STATES)) {
          const terminalStore = db.createObjectStore(STORES.TERMINAL_STATES, { keyPath: 'tabId' })
          terminalStore.createIndex('updatedAt', 'updatedAt', { unique: false })
          console.log('[IndexedDB] Created terminal states store')
        }

        // Create filesystem store
        if (!db.objectStoreNames.contains(STORES.FILESYSTEM)) {
          const fsStore = db.createObjectStore(STORES.FILESYSTEM, { keyPath: 'key' })
          fsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
          console.log('[IndexedDB] Created filesystem store')
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
}

// Export singleton instance
export const indexedDBService = new IndexedDBService()
export default indexedDBService