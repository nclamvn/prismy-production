/**
 * PRISMY NATIVE MOBILE APIS
 * Integration with modern web APIs for native mobile experience
 */

import React from 'react'

export interface ShareData {
  title?: string
  text?: string
  url?: string
  files?: File[]
}

export interface ContactInfo {
  name?: string[]
  email?: string[]
  tel?: string[]
  address?: any[]
  icon?: Blob[]
  url?: string[]
}

export interface BackgroundSyncConfig {
  tag: string
  minInterval?: number
  requiredNetworkType?: 'any' | 'wifi' | 'cellular'
}

export interface PushNotificationConfig {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export interface FileSystemAccess {
  read: boolean
  write: boolean
  create: boolean
}

export interface DeviceCapabilities {
  share: boolean
  fileSystemAccess: boolean
  backgroundSync: boolean
  pushNotifications: boolean
  contacts: boolean
  clipboard: boolean
  webHID: boolean
  gamepad: boolean
  geolocation: boolean
  deviceMemory?: number
  hardwareConcurrency: number
}

class NativeMobileAPIs {
  private capabilities: DeviceCapabilities | null = null
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null

  constructor() {
    this.initialize()
  }

  /**
   * Initialize native APIs
   */
  private async initialize(): Promise<void> {
    if (typeof window === 'undefined') return

    // Detect device capabilities
    this.capabilities = this.detectCapabilities()
    
    // Initialize service worker for background features
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready
        console.log('[Native APIs] Service worker ready')
      } catch (error) {
        console.error('[Native APIs] Service worker registration failed:', error)
      }
    }

    console.log('[Native APIs] Initialized with capabilities:', this.capabilities)
  }

  /**
   * Get device capabilities
   */
  public getCapabilities(): DeviceCapabilities {
    return this.capabilities || this.detectCapabilities()
  }

  /**
   * Web Share API - Share content natively
   */
  public async share(data: ShareData): Promise<boolean> {
    if (!this.canShare(data)) {
      return this.fallbackShare(data)
    }

    try {
      await navigator.share(data)
      console.log('[Native APIs] Content shared successfully')
      return true
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('[Native APIs] Share cancelled by user')
        return false
      }
      console.error('[Native APIs] Share failed:', error)
      return this.fallbackShare(data)
    }
  }

  /**
   * Check if content can be shared
   */
  public canShare(data?: ShareData): boolean {
    if (!navigator.share) return false
    if (!data) return true
    
    return navigator.canShare ? navigator.canShare(data) : true
  }

  /**
   * File System Access API - Read/write files
   */
  public async pickFile(options: {
    types?: Array<{
      description: string
      accept: Record<string, string[]>
    }>
    multiple?: boolean
    excludeAcceptAllOption?: boolean
  } = {}): Promise<FileSystemFileHandle[]> {
    if (!('showOpenFilePicker' in window)) {
      throw new Error('File System Access API not supported')
    }

    try {
      const fileHandles = await (window as any).showOpenFilePicker({
        multiple: options.multiple || false,
        excludeAcceptAllOption: options.excludeAcceptAllOption || false,
        types: options.types || [{
          description: 'All files',
          accept: { '*/*': ['*'] }
        }]
      })

      console.log('[Native APIs] Files picked:', fileHandles.length)
      return fileHandles
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('[Native APIs] File picker cancelled')
        return []
      }
      throw error
    }
  }

  /**
   * Save file using File System Access API
   */
  public async saveFile(
    content: string | Blob,
    suggestedName?: string,
    types?: Array<{
      description: string
      accept: Record<string, string[]>
    }>
  ): Promise<FileSystemFileHandle | null> {
    if (!('showSaveFilePicker' in window)) {
      // Fallback to download
      this.fallbackDownload(content, suggestedName)
      return null
    }

    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: types || [{
          description: 'Text files',
          accept: { 'text/plain': ['.txt'] }
        }]
      })

      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()

      console.log('[Native APIs] File saved successfully')
      return fileHandle
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('[Native APIs] Save cancelled')
        return null
      }
      throw error
    }
  }

  /**
   * Background Sync - Sync data when connection is restored
   */
  public async registerBackgroundSync(config: BackgroundSyncConfig): Promise<boolean> {
    if (!this.serviceWorkerRegistration || !('sync' in this.serviceWorkerRegistration)) {
      console.warn('[Native APIs] Background Sync not supported')
      return false
    }

    try {
      await this.serviceWorkerRegistration.sync.register(config.tag)
      console.log('[Native APIs] Background sync registered:', config.tag)
      return true
    } catch (error) {
      console.error('[Native APIs] Background sync registration failed:', error)
      return false
    }
  }

  /**
   * Push Notifications - Send notifications to users
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported')
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    const permission = await Notification.requestPermission()
    console.log('[Native APIs] Notification permission:', permission)
    return permission
  }

  /**
   * Show local notification
   */
  public async showNotification(config: PushNotificationConfig): Promise<void> {
    const permission = await this.requestNotificationPermission()
    
    if (permission !== 'granted') {
      throw new Error('Notification permission denied')
    }

    if (this.serviceWorkerRegistration) {
      // Use service worker for better reliability
      await this.serviceWorkerRegistration.showNotification(config.title, {
        body: config.body,
        icon: config.icon || '/icon-192x192.png',
        badge: config.badge || '/badge-72x72.png',
        tag: config.tag,
        data: config.data,
        actions: config.actions
      })
    } else {
      // Fallback to basic notification
      new Notification(config.title, {
        body: config.body,
        icon: config.icon || '/icon-192x192.png'
      })
    }

    console.log('[Native APIs] Notification shown:', config.title)
  }

  /**
   * Clipboard API - Read/write clipboard
   */
  public async writeToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        console.log('[Native APIs] Text copied to clipboard')
        return true
      }
      
      // Fallback for older browsers
      return this.fallbackCopyToClipboard(text)
    } catch (error) {
      console.error('[Native APIs] Clipboard write failed:', error)
      return this.fallbackCopyToClipboard(text)
    }
  }

  /**
   * Read from clipboard
   */
  public async readFromClipboard(): Promise<string | null> {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText()
        console.log('[Native APIs] Text read from clipboard')
        return text
      }
    } catch (error) {
      console.error('[Native APIs] Clipboard read failed:', error)
    }
    return null
  }

  /**
   * Contact Picker API - Access device contacts
   */
  public async pickContacts(properties: string[] = ['name', 'email']): Promise<ContactInfo[]> {
    if (!('contacts' in navigator) || !(navigator as any).contacts) {
      throw new Error('Contact Picker API not supported')
    }

    try {
      const contacts = await (navigator as any).contacts.select(properties, { multiple: true })
      console.log('[Native APIs] Contacts picked:', contacts.length)
      return contacts
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('[Native APIs] Contact picker cancelled')
        return []
      }
      throw error
    }
  }

  /**
   * Geolocation API - Get device location
   */
  public async getCurrentLocation(options: PositionOptions = {}): Promise<GeolocationPosition> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported')
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('[Native APIs] Location obtained')
          resolve(position)
        },
        (error) => {
          console.error('[Native APIs] Location error:', error)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
          ...options
        }
      )
    })
  }

  /**
   * Wake Lock API - Keep screen awake
   */
  public async requestWakeLock(): Promise<WakeLockSentinel | null> {
    if (!('wakeLock' in navigator)) {
      console.warn('[Native APIs] Wake Lock API not supported')
      return null
    }

    try {
      const wakeLock = await (navigator as any).wakeLock.request('screen')
      console.log('[Native APIs] Wake lock acquired')
      
      wakeLock.addEventListener('release', () => {
        console.log('[Native APIs] Wake lock released')
      })
      
      return wakeLock
    } catch (error) {
      console.error('[Native APIs] Wake lock failed:', error)
      return null
    }
  }

  /**
   * Device Memory API - Get device memory info
   */
  public getDeviceMemory(): number | undefined {
    return (navigator as any).deviceMemory
  }

  /**
   * Hardware Concurrency - Get CPU core count
   */
  public getHardwareConcurrency(): number {
    return navigator.hardwareConcurrency || 1
  }

  /**
   * Network Information API - Get connection info
   */
  public getNetworkInfo(): {
    effectiveType?: string
    downlink?: number
    rtt?: number
    saveData?: boolean
  } {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    if (!connection) return {}
    
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    }
  }

  // Private helper methods

  private detectCapabilities(): DeviceCapabilities {
    return {
      share: 'share' in navigator,
      fileSystemAccess: 'showOpenFilePicker' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      pushNotifications: 'Notification' in window && 'serviceWorker' in navigator,
      contacts: 'contacts' in navigator,
      clipboard: 'clipboard' in navigator,
      webHID: 'hid' in navigator,
      gamepad: 'getGamepads' in navigator,
      geolocation: 'geolocation' in navigator,
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency || 1
    }
  }

  private async fallbackShare(data: ShareData): Promise<boolean> {
    // Create a simple share modal or copy URL to clipboard
    const shareText = [data.title, data.text, data.url].filter(Boolean).join('\n')
    
    if (shareText) {
      return this.writeToClipboard(shareText)
    }
    
    return false
  }

  private fallbackCopyToClipboard(text: string): boolean {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      return successful
    } catch (error) {
      console.error('[Native APIs] Fallback copy failed:', error)
      return false
    }
  }

  private fallbackDownload(content: string | Blob, filename?: string): void {
    const blob = content instanceof Blob ? content : new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'download.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// Export singleton instance
export const nativeAPIs = new NativeMobileAPIs()

// Export class for customization
export { NativeMobileAPIs }
export type { 
  ShareData, 
  ContactInfo, 
  BackgroundSyncConfig, 
  PushNotificationConfig, 
  FileSystemAccess, 
  DeviceCapabilities 
}