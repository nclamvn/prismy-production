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
    // Log multiple access attempts in production for monitoring
    if (process.env.NODE_ENV === 'production') {
      console.debug('✅ [Supabase] Reusing singleton client instance')
    }
    return supabaseInstance
  }

  // Check global window singleton
  if (window.__PRISMY_SUPABASE_CLIENT__) {
    supabaseInstance = window.__PRISMY_SUPABASE_CLIENT__
    return supabaseInstance
  }

  // Prevent concurrent creation
  if (isCreating) {
    throw new Error('Supabase client is already being created')
  }

  // Mark creation as blocked for other libraries
  if (window.__PRISMY_SUPABASE_CREATED__) {
    throw new Error('Supabase client already exists in this browser context')
  }

  try {
    isCreating = true

    // Create the single client instance
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: window.localStorage,
        storageKey: 'sb-prismy-auth',
        debug: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'prismy-web@1.0.0',
        },
      },
      realtime: {
        enabled: false, // Disabled to prevent WebSocket conflicts
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