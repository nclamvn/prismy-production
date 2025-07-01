/**
 * Browser-only Supabase Client Singleton
 * Prevents multiple GoTrueClient instances in the same browser context
 */

import { createBrowserClient, type SupabaseClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Strict singleton - only one client instance ever created
let supabaseInstance: SupabaseClient | null = null
let isCreating = false

// Global window marker to prevent any other code from creating clients
declare global {
  interface Window {
    __PRISMY_SUPABASE_CLIENT__?: SupabaseClient
    __PRISMY_SUPABASE_CREATED__?: boolean
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

  // Check global window singleton first
  if (window.__PRISMY_SUPABASE_CLIENT__) {
    supabaseInstance = window.__PRISMY_SUPABASE_CLIENT__
    return supabaseInstance
  }

  // Prevent concurrent creation with a more sophisticated check
  if (isCreating) {
    // Wait for the current creation to complete
    let attempts = 0
    const maxAttempts = 10
    const checkInterval = 50 // 50ms
    
    return new Promise<SupabaseClient>((resolve, reject) => {
      const checkForClient = () => {
        attempts++
        if (supabaseInstance || window.__PRISMY_SUPABASE_CLIENT__) {
          resolve(supabaseInstance || window.__PRISMY_SUPABASE_CLIENT__)
        } else if (attempts >= maxAttempts) {
          reject(new Error('Timeout waiting for Supabase client creation'))
        } else {
          setTimeout(checkForClient, checkInterval)
        }
      }
      checkForClient()
    }) as any
  }

  // Check if creation was already attempted in this context
  if (window.__PRISMY_SUPABASE_CREATED__ && !window.__PRISMY_SUPABASE_CLIENT__) {
    console.warn('[Supabase] Client was marked as created but instance not found. Recreating...')
    window.__PRISMY_SUPABASE_CREATED__ = false
  }

  try {
    isCreating = true

    // Create the single client instance with enhanced configuration
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Disable to prevent URL detection conflicts
        flowType: 'pkce',
        storage: window.localStorage,
        storageKey: 'sb-prismy-auth-singleton',
        debug: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'prismy-web-singleton@1.0.0',
          'x-instance-id': 'singleton-' + Date.now(),
        },
      },
      realtime: {
        enabled: false, // Completely disabled to prevent multiple WebSocket connections
        params: {
          eventsPerSecond: 0,
        },
      },
    })

    // Mark as created globally
    window.__PRISMY_SUPABASE_CLIENT__ = supabaseInstance
    window.__PRISMY_SUPABASE_CREATED__ = true

    // Log successful singleton creation
    if (process.env.NODE_ENV === 'production') {
      console.log('🎯 [Supabase] Singleton client created successfully')
    }

    return supabaseInstance

  } finally {
    isCreating = false
  }
}

// Export default instance getter
export default getBrowserClient