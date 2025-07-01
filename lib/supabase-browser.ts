/**
 * ULTIMATE Supabase Browser Client Singleton
 * Multi-layered protection against multiple GoTrueClient instances
 */

import { createBrowserClient, type SupabaseClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Multi-level singleton protection
let supabaseInstance: SupabaseClient | null = null
let isCreating = false
let creationPromise: Promise<SupabaseClient> | null = null

// Global markers and locks
declare global {
  interface Window {
    __PRISMY_SUPABASE_CLIENT__?: SupabaseClient
    __PRISMY_SUPABASE_CREATED__?: boolean
    __PRISMY_SUPABASE_LOCK__?: boolean
    __PRISMY_CREATION_TIMESTAMP__?: number
  }
}

// Storage-based tracking
const STORAGE_KEY = 'prismy-supabase-instance-id'
const CREATION_LOCK_KEY = 'prismy-supabase-lock'

class SupabaseSingleton {
  private static instanceId: string | null = null
  
  static generateInstanceId(): string {
    return `prismy-${Date.now()}-${Math.random().toString(36).substring(2)}`
  }

  static isLocked(): boolean {
    try {
      const lockValue = localStorage.getItem(CREATION_LOCK_KEY)
      if (!lockValue) return false
      
      const lockData = JSON.parse(lockValue)
      const now = Date.now()
      
      // Lock expires after 5 seconds
      if (now - lockData.timestamp > 5000) {
        localStorage.removeItem(CREATION_LOCK_KEY)
        return false
      }
      
      return lockData.locked === true
    } catch {
      return false
    }
  }

  static acquireLock(): boolean {
    try {
      if (this.isLocked()) return false
      
      const lockData = {
        locked: true,
        timestamp: Date.now(),
        instanceId: this.generateInstanceId()
      }
      
      localStorage.setItem(CREATION_LOCK_KEY, JSON.stringify(lockData))
      window.__PRISMY_SUPABASE_LOCK__ = true
      return true
    } catch {
      return false
    }
  }

  static releaseLock(): void {
    try {
      localStorage.removeItem(CREATION_LOCK_KEY)
      window.__PRISMY_SUPABASE_LOCK__ = false
    } catch {
      // Ignore errors
    }
  }

  static hasExistingInstance(): boolean {
    return !!(
      supabaseInstance ||
      window.__PRISMY_SUPABASE_CLIENT__ ||
      window.__PRISMY_SUPABASE_CREATED__
    )
  }
}

export const getBrowserClient = (): SupabaseClient => {
  // Server-side protection
  if (typeof window === 'undefined') {
    throw new Error('getBrowserClient() can only be called in browser environment')
  }

  // Return existing instance immediately
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Check global window singleton
  if (window.__PRISMY_SUPABASE_CLIENT__) {
    supabaseInstance = window.__PRISMY_SUPABASE_CLIENT__
    return supabaseInstance
  }

  // If creation is in progress, wait for it
  if (creationPromise) {
    throw creationPromise // This will be caught and handled by React
  }

  // Check if another instance is being created
  if (isCreating || SupabaseSingleton.isLocked()) {
    // Wait for existing creation to complete
    let attempts = 0
    const maxAttempts = 50 // 500ms total wait
    
    while (attempts < maxAttempts && !SupabaseSingleton.hasExistingInstance()) {
      attempts++
      // Synchronous wait
      const start = Date.now()
      while (Date.now() - start < 10) {
        // 10ms busy wait
      }
    }
    
    if (window.__PRISMY_SUPABASE_CLIENT__) {
      supabaseInstance = window.__PRISMY_SUPABASE_CLIENT__
      return supabaseInstance
    }
  }

  // Acquire creation lock
  if (!SupabaseSingleton.acquireLock()) {
    throw new Error('Failed to acquire Supabase creation lock')
  }

  try {
    isCreating = true
    
    // Double-check after acquiring lock
    if (window.__PRISMY_SUPABASE_CLIENT__) {
      supabaseInstance = window.__PRISMY_SUPABASE_CLIENT__
      return supabaseInstance
    }

    // Generate unique instance ID
    const instanceId = SupabaseSingleton.generateInstanceId()
    SupabaseSingleton.instanceId = instanceId

    // Create the ultimate singleton instance
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Prevent URL conflicts
        flowType: 'pkce',
        storage: window.localStorage,
        storageKey: `sb-prismy-auth-${instanceId}`, // Unique storage key
        debug: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': `prismy-ultimate-singleton@2.0.0`,
          'x-instance-id': instanceId,
          'x-creation-timestamp': Date.now().toString(),
        },
      },
      realtime: {
        enabled: false,
      },
    })

    // Triple-lock the instance globally
    window.__PRISMY_SUPABASE_CLIENT__ = supabaseInstance
    window.__PRISMY_SUPABASE_CREATED__ = true
    window.__PRISMY_CREATION_TIMESTAMP__ = Date.now()
    
    // Store instance tracking
    localStorage.setItem(STORAGE_KEY, instanceId)

    console.log(`🔒 [Supabase] ULTIMATE singleton created: ${instanceId}`)
    return supabaseInstance

  } catch (error) {
    console.error('Supabase singleton creation failed:', error)
    throw error
  } finally {
    isCreating = false
    SupabaseSingleton.releaseLock()
  }
}

// Export default instance getter
export default getBrowserClient