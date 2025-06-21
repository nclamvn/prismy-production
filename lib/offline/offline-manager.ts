/**
 * Offline Manager for PWA Capabilities
 * Handles offline detection, data sync, and offline operations
 */

import { logger } from '@/lib/logger'

export interface OfflineOperation {
  id: string
  type: 'translation' | 'document' | 'user_action'
  data: any
  timestamp: number
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  retryCount: number
  maxRetries: number
}

export interface OfflineStorageItem {
  key: string
  value: any
  timestamp: number
  ttl?: number
}

export class OfflineManager {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  private syncQueue: OfflineOperation[] = []
  private subscribers = new Set<(isOnline: boolean) => void>()
  private dbName = 'prismy-offline'
  private dbVersion = 1
  private db: IDBDatabase | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeIndexedDB()
      this.setupOnlineDetection()
      this.setupPeriodicSync()
      this.loadSyncQueue()
    }
  }

  // IndexedDB initialization
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        logger.error('Failed to open IndexedDB', { error: request.error })
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        logger.info('IndexedDB initialized successfully')
        resolve()
      }

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains('operations')) {
          const operationsStore = db.createObjectStore('operations', {
            keyPath: 'id',
          })
          operationsStore.createIndex('type', 'type', { unique: false })
          operationsStore.createIndex('status', 'status', { unique: false })
          operationsStore.createIndex('timestamp', 'timestamp', {
            unique: false,
          })
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' })
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains('translations')) {
          const translationsStore = db.createObjectStore('translations', {
            keyPath: 'id',
          })
          translationsStore.createIndex('hash', 'hash', { unique: true })
          translationsStore.createIndex('timestamp', 'timestamp', {
            unique: false,
          })
        }

        logger.info('IndexedDB schema updated')
      }
    })
  }

  // Online detection setup
  private setupOnlineDetection(): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined')
      return

    this.isOnline = navigator.onLine

    const updateOnlineStatus = () => {
      const wasOnline = this.isOnline
      this.isOnline = navigator.onLine

      if (wasOnline !== this.isOnline) {
        logger.info('Online status changed', { isOnline: this.isOnline })
        this.notifySubscribers()

        if (this.isOnline) {
          this.syncPendingOperations()
        }
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Periodic connectivity check
    setInterval(() => {
      this.checkConnectivity()
    }, 30000) // Check every 30 seconds
  }

  private async checkConnectivity(): Promise<void> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      })

      const isConnected = response.ok
      if (this.isOnline !== isConnected) {
        this.isOnline = isConnected
        this.notifySubscribers()

        if (isConnected) {
          this.syncPendingOperations()
        }
      }
    } catch (error) {
      if (this.isOnline) {
        this.isOnline = false
        this.notifySubscribers()
      }
    }
  }

  // Subscription management
  subscribeToOnlineStatus(callback: (isOnline: boolean) => void): () => void {
    this.subscribers.add(callback)

    // Immediately call with current status
    callback(this.isOnline)

    return () => {
      this.subscribers.delete(callback)
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.isOnline)
      } catch (error) {
        logger.error('Offline status callback error', { error })
      }
    })
  }

  // Offline operations management
  async addOfflineOperation(
    type: OfflineOperation['type'],
    data: any,
    maxRetries: number = 3
  ): Promise<string> {
    const operation: OfflineOperation = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      maxRetries,
    }

    this.syncQueue.push(operation)
    await this.storeOperation(operation)

    logger.info('Added offline operation', {
      id: operation.id,
      type: operation.type,
    })

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncOperation(operation)
    }

    return operation.id
  }

  private async storeOperation(operation: OfflineOperation): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readwrite')
      const store = transaction.objectStore('operations')
      const request = store.put(operation)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readonly')
      const store = transaction.objectStore('operations')
      const index = store.index('status')
      const request = index.getAll('pending')

      request.onsuccess = () => {
        this.syncQueue = request.result
        logger.info('Loaded sync queue', { count: this.syncQueue.length })
        resolve()
      }

      request.onerror = () => reject(request.error)
    })
  }

  // Sync operations
  private setupPeriodicSync(): void {
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncPendingOperations()
      }
    }, 60000) // Check every minute
  }

  private async syncPendingOperations(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return

    logger.info('Starting sync of pending operations', {
      count: this.syncQueue.length,
    })

    const pendingOperations = this.syncQueue.filter(
      op => op.status === 'pending'
    )

    for (const operation of pendingOperations) {
      await this.syncOperation(operation)
    }
  }

  private async syncOperation(operation: OfflineOperation): Promise<void> {
    try {
      operation.status = 'syncing'
      await this.storeOperation(operation)

      let success = false

      switch (operation.type) {
        case 'translation':
          success = await this.syncTranslation(operation.data)
          break
        case 'document':
          success = await this.syncDocument(operation.data)
          break
        case 'user_action':
          success = await this.syncUserAction(operation.data)
          break
        default:
          logger.warn('Unknown operation type', { type: operation.type })
      }

      if (success) {
        operation.status = 'synced'
        this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id)
        await this.removeOperation(operation.id)

        logger.info('Operation synced successfully', {
          id: operation.id,
          type: operation.type,
        })
      } else {
        await this.handleSyncFailure(operation)
      }
    } catch (error) {
      logger.error('Sync operation failed', {
        id: operation.id,
        error,
      })
      await this.handleSyncFailure(operation)
    }
  }

  private async handleSyncFailure(operation: OfflineOperation): Promise<void> {
    operation.retryCount++

    if (operation.retryCount >= operation.maxRetries) {
      operation.status = 'failed'
      logger.error('Operation failed permanently', {
        id: operation.id,
        retryCount: operation.retryCount,
      })
    } else {
      operation.status = 'pending'
      logger.warn('Operation retry scheduled', {
        id: operation.id,
        retryCount: operation.retryCount,
      })
    }

    await this.storeOperation(operation)
  }

  private async syncTranslation(data: any): Promise<boolean> {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  private async syncDocument(data: any): Promise<boolean> {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  private async syncUserAction(data: any): Promise<boolean> {
    try {
      const response = await fetch('/api/user/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  private async removeOperation(id: string): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readwrite')
      const store = transaction.objectStore('operations')
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Cache management
  async cacheItem(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.db) return

    const item: OfflineStorageItem = {
      key,
      value,
      timestamp: Date.now(),
      ttl,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      const request = store.put(item)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCachedItem(key: string): Promise<any | null> {
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly')
      const store = transaction.objectStore('cache')
      const request = store.get(key)

      request.onsuccess = () => {
        const item = request.result as OfflineStorageItem

        if (!item) {
          resolve(null)
          return
        }

        // Check TTL
        if (item.ttl && Date.now() - item.timestamp > item.ttl) {
          // Expired, remove it
          this.removeCachedItem(key)
          resolve(null)
          return
        }

        resolve(item.value)
      }

      request.onerror = () => reject(request.error)
    })
  }

  async removeCachedItem(key: string): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Translation cache
  async cacheTranslation(
    sourceText: string,
    sourceLang: string,
    targetLang: string,
    result: any
  ): Promise<void> {
    const hash = this.createTranslationHash(sourceText, sourceLang, targetLang)

    const translation = {
      id: hash,
      hash,
      sourceText,
      sourceLang,
      targetLang,
      result,
      timestamp: Date.now(),
    }

    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['translations'], 'readwrite')
      const store = transaction.objectStore('translations')
      const request = store.put(translation)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCachedTranslation(
    sourceText: string,
    sourceLang: string,
    targetLang: string
  ): Promise<any | null> {
    const hash = this.createTranslationHash(sourceText, sourceLang, targetLang)

    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['translations'], 'readonly')
      const store = transaction.objectStore('translations')
      const request = store.get(hash)

      request.onsuccess = () => {
        const translation = request.result
        resolve(translation ? translation.result : null)
      }

      request.onerror = () => reject(request.error)
    })
  }

  private createTranslationHash(
    sourceText: string,
    sourceLang: string,
    targetLang: string
  ): string {
    const combined = `${sourceText}|${sourceLang}|${targetLang}`
    return btoa(combined).replace(/[/+=]/g, '')
  }

  // Status methods
  getOnlineStatus(): boolean {
    return this.isOnline
  }

  getPendingOperationsCount(): number {
    return this.syncQueue.filter(op => op.status === 'pending').length
  }

  getFailedOperationsCount(): number {
    return this.syncQueue.filter(op => op.status === 'failed').length
  }

  async getStorageUsage(): Promise<{
    operations: number
    cache: number
    translations: number
  }> {
    if (!this.db) {
      return { operations: 0, cache: 0, translations: 0 }
    }

    const counts = { operations: 0, cache: 0, translations: 0 }

    const storeNames = ['operations', 'cache', 'translations'] as const

    for (const storeName of storeNames) {
      const count = await new Promise<number>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        const request = store.count()

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      counts[storeName] = count
    }

    return counts
  }

  // Cleanup methods
  async clearExpiredCache(): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(['cache'], 'readwrite')
    const store = transaction.objectStore('cache')
    const index = store.index('timestamp')

    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days ago
    const range = IDBKeyRange.upperBound(cutoff)

    const request = index.openCursor(range)

    request.onsuccess = event => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        const item = cursor.value as OfflineStorageItem
        if (item.ttl && Date.now() - item.timestamp > item.ttl) {
          cursor.delete()
        }
        cursor.continue()
      }
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) return

    const storeNames = ['operations', 'cache', 'translations']

    for (const storeName of storeNames) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.clear()

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }

    this.syncQueue = []
    logger.info('All offline data cleared')
  }
}

// Singleton instance
export const offlineManager = new OfflineManager()
