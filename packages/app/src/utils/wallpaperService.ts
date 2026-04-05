/**
 * Wallpaper Service
 * Manages custom user-uploaded wallpapers stored in IndexedDB
 */

const DB_NAME = 'scp-terminal-db'
const DB_VERSION = 5
const WALLPAPER_STORE = 'wallpapers'

export interface WallpaperInfo {
  id: string
  name: string
  dataUrl: string
  thumbnailUrl: string
  width: number
  height: number
  size: number
  createdAt: number
}

export interface WallpaperServiceState {
  currentWallpaperId: string | null
  wallpapers: WallpaperInfo[]
}

class WallpaperService {
  private db: IDBDatabase | null = null
  private initialized = false

  /**
   * Initialize the database and create wallpaper store if needed
   */
  async init(): Promise<void> {
    if (this.initialized && this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.initialized = true
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create wallpapers store if it doesn't exist
        if (!db.objectStoreNames.contains(WALLPAPER_STORE)) {
          const store = db.createObjectStore(WALLPAPER_STORE, { keyPath: 'id' })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })
  }

  /**
   * Get database instance
   */
  private getDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('[WallpaperService] Database not initialized. Call init() first.')
    }
    return this.db
  }

  /**
   * Save a wallpaper image to IndexedDB
   * @param file File object from input
   * @param name Custom name for the wallpaper
   */
  async saveWallpaper(file: File, name?: string): Promise<WallpaperInfo> {
    await this.init()

    // Read file as data URL
    const dataUrl = await this.readFileAsDataURL(file)

    // Create thumbnail (resize to 200px width)
    const thumbnailUrl = await this.createThumbnail(dataUrl, 200)

    // Get image dimensions
    const { width, height } = await this.getImageDimensions(dataUrl)

    const wallpaper: WallpaperInfo = {
      id: `wp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name || file.name.replace(/\.[^.]+$/, ''),
      dataUrl,
      thumbnailUrl,
      width,
      height,
      size: file.size,
      createdAt: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const db = this.getDB()
      const tx = db.transaction(WALLPAPER_STORE, 'readwrite')
      const store = tx.objectStore(WALLPAPER_STORE)

      const request = store.put(wallpaper)
      request.onsuccess = () => resolve(wallpaper)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all saved wallpapers
   */
  async getAllWallpapers(): Promise<WallpaperInfo[]> {
    await this.init()

    return new Promise((resolve, reject) => {
      const db = this.getDB()
      const tx = db.transaction(WALLPAPER_STORE, 'readonly')
      const store = tx.objectStore(WALLPAPER_STORE)
      const index = store.index('createdAt')

      const request = index.getAll()
      request.onsuccess = () => {
        // Sort by creation date (newest first)
        const results = (request.result as WallpaperInfo[]).sort((a, b) => b.createdAt - a.createdAt)
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get a single wallpaper by ID
   */
  async getWallpaper(id: string): Promise<WallpaperInfo | null> {
    await this.init()

    return new Promise((resolve, reject) => {
      const db = this.getDB()
      const tx = db.transaction(WALLPAPER_STORE, 'readonly')
      const store = tx.objectStore(WALLPAPER_STORE)

      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete a wallpaper by ID
   */
  async deleteWallpaper(id: string): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      const db = this.getDB()
      const tx = db.transaction(WALLPAPER_STORE, 'readwrite')
      const store = tx.objectStore(WALLPAPER_STORE)

      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get current wallpaper ID from localStorage
   */
  getCurrentWallpaperId(): string | null {
    try {
      return localStorage.getItem('scp-os-current-wallpaper')
    } catch {
      return null
    }
  }

  /**
   * Set current wallpaper ID in localStorage
   */
  setCurrentWallpaperId(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem('scp-os-current-wallpaper', id)
      } else {
        localStorage.removeItem('scp-os-current-wallpaper')
      }
    } catch { /* ignore */ }
  }

  /**
   * Get full wallpaper data URL for the current wallpaper
   */
  async getCurrentWallpaper(): Promise<string | null> {
    const id = this.getCurrentWallpaperId()
    if (!id) return null

    try {
      const wallpaper = await this.getWallpaper(id)
      return wallpaper?.dataUrl || null
    } catch {
      return null
    }
  }

  /**
   * Clear all wallpapers
   */
  async clearAll(): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      const db = this.getDB()
      const tx = db.transaction(WALLPAPER_STORE, 'readwrite')
      const store = tx.objectStore(WALLPAPER_STORE)

      const request = store.clear()
      request.onsuccess = () => {
        this.setCurrentWallpaperId(null)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Format file size for display
   */
  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ── Private Helpers ───────────────────────────────────────────────

  private readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  private createThumbnail(dataUrl: string, maxWidth: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = maxWidth / img.width
        canvas.width = maxWidth
        canvas.height = img.height * scale

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(dataUrl)
          return
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    })
  }

  private getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.width, height: img.height })
      img.onerror = () => resolve({ width: 0, height: 0 })
      img.src = dataUrl
    })
  }
}

export const wallpaperService = new WallpaperService()
export default wallpaperService
