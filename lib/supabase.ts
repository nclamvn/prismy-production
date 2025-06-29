import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// Advanced Supabase client configuration for optimal performance
const supabaseClientConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const, // Enhanced security
    debug: process.env.NODE_ENV === 'development',
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
    enabled: false, // Disabled for production stability - prevents WebSocket loops
    params: {
      eventsPerSecond: 0,
    },
  },
}

// Connection pool for optimized performance
const connectionPool = new Map<string, any>()
const MAX_POOL_SIZE = 10
const CONNECTION_TIMEOUT = 300000 // 5 minutes for connection pool cleanup
// Enhanced global singleton registry to prevent multiple GoTrueClient instances
const globalClientRegistry = (() => {
  if (typeof window !== 'undefined') {
    // Use window object to ensure truly global singleton
    if (!(window as any).__supabase_client_registry__) {
      ;(window as any).__supabase_client_registry__ = {
        browserClient: null,
        initialized: false,
        createdAt: Date.now(),
        instanceCount: 0,
        lastAccess: Date.now(),
      }

      // Debug monitoring for multiple instances
      if (process.env.NODE_ENV === 'development') {
        console.log(
          '🔐 [Supabase Registry] Global singleton registry initialized'
        )
      }
    }
    return (window as any).__supabase_client_registry__
  }
  return {
    browserClient: null,
    initialized: false,
    createdAt: Date.now(),
    instanceCount: 0,
    lastAccess: Date.now(),
  }
})()

export const createClientComponentClient = () => {
  if (typeof window === 'undefined') {
    // Server-side: always create new instance with optimizations
    return createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
      supabaseClientConfig
    )
  }

  // Update access tracking
  globalClientRegistry.lastAccess = Date.now()
  globalClientRegistry.instanceCount++

  // Client-side: use truly global singleton pattern
  // Only create a new client if we don't have one yet
  if (
    !globalClientRegistry.browserClient ||
    !globalClientRegistry.initialized
  ) {
    // Development debugging with instance tracking
    if (process.env.NODE_ENV === 'development') {
      if (globalClientRegistry.browserClient) {
        console.warn(
          `🔄 [Supabase Singleton] Recreating client (instance #${globalClientRegistry.instanceCount}) - this should only happen once`
        )
      } else {
        console.log(
          `🚀 [Supabase Singleton] Creating initial client instance #${globalClientRegistry.instanceCount}`
        )
      }
    }

    // Force cleanup any existing clients to prevent conflicts
    if (globalClientRegistry.browserClient) {
      try {
        globalClientRegistry.browserClient.removeAllChannels()
        // Additional cleanup for GoTrueClient
        if (globalClientRegistry.browserClient.auth) {
          globalClientRegistry.browserClient.auth.stopAutoRefresh()
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '🧹 [Supabase Cleanup] Error during client cleanup:',
            error
          )
        }
      }
    }

    globalClientRegistry.browserClient = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        ...supabaseClientConfig,
        // Enhanced auth configuration to prevent conflicts
        auth: {
          ...supabaseClientConfig.auth,
          storage:
            typeof window !== 'undefined' ? window.localStorage : undefined,
          storageKey: 'supabase.auth.token', // Use specific key to prevent conflicts
          debug: process.env.NODE_ENV === 'development',
        },
      }
    )
    globalClientRegistry.initialized = true
    globalClientRegistry.createdAt = Date.now()

    // Development debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ [Supabase Singleton] Client #${globalClientRegistry.instanceCount} created successfully`
      )
    }
  } else {
    // Log repeated access in development
    if (
      process.env.NODE_ENV === 'development' &&
      globalClientRegistry.instanceCount > 1
    ) {
      console.log(
        `♻️ [Supabase Singleton] Reusing existing client (access #${globalClientRegistry.instanceCount})`
      )
    }
  }

  return globalClientRegistry.browserClient
}

// Server-side Supabase client for API routes with connection pooling
export const createRouteHandlerClient = ({
  cookies: cookieStore,
}: {
  cookies: () => any
}) => {
  const poolKey = 'route-handler'

  // Check connection pool first
  if (connectionPool.has(poolKey) && connectionPool.size < MAX_POOL_SIZE) {
    const cached = connectionPool.get(poolKey)
    if (cached && Date.now() - cached.created < CONNECTION_TIMEOUT) {
      return cached.client
    }
  }

  // Create new optimized client
  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    ...supabaseClientConfig,
    cookies: {
      get(name: string) {
        return cookieStore().get(name)?.value
      },
      set(name: string, value: string, options: Record<string, any>) {
        try {
          cookieStore().set({ name, value, ...options })
        } catch (error) {
          // Silent fail for cookie setting in some contexts
        }
      },
      remove(name: string, options: Record<string, any>) {
        try {
          cookieStore().set({ name, value: '', ...options })
        } catch (error) {
          // Silent fail for cookie removal in some contexts
        }
      },
    },
  })

  // Add to connection pool
  connectionPool.set(poolKey, {
    client,
    created: Date.now(),
  })

  return client
}

// Server-side Supabase client for Server Components with caching
export const createServerComponentClient = ({
  cookies: cookieStore,
}: {
  cookies: () => any
}) => {
  const poolKey = 'server-component'

  // Check connection pool first
  if (connectionPool.has(poolKey) && connectionPool.size < MAX_POOL_SIZE) {
    const cached = connectionPool.get(poolKey)
    if (cached && Date.now() - cached.created < CONNECTION_TIMEOUT) {
      return cached.client
    }
  }

  // Create new optimized read-only client
  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    ...supabaseClientConfig,
    cookies: {
      get(name: string) {
        try {
          return cookieStore().get(name)?.value
        } catch (error) {
          // Silent fail for cookie reading in some contexts
          return undefined
        }
      },
    },
  })

  // Add to connection pool
  connectionPool.set(poolKey, {
    client,
    created: Date.now(),
  })

  return client
}

// Service role client for admin operations with connection pooling
let serviceRoleClient: ReturnType<typeof createClient> | null = null
let serviceRoleLastUsed = Date.now()

export const createServiceRoleClient = () => {
  const now = Date.now()

  // Reuse service role client with timeout management
  if (!serviceRoleClient || now - serviceRoleLastUsed > CONNECTION_TIMEOUT) {
    serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey, {
      ...supabaseClientConfig,
      auth: {
        autoRefreshToken: false, // Service role doesn't need auth refresh
        persistSession: false,
      },
    })
  }

  serviceRoleLastUsed = now
  return serviceRoleClient
}

// Query optimization helpers
export const withQueryOptimization = <T>(queryBuilder: any): Promise<T> => {
  return queryBuilder
    .limit(1000) // Prevent accidental large queries
    .timeout(10000) // 10 second query timeout
}

// Batch query helper for multiple operations
export const batchQueries = async <T>(
  queries: Array<() => Promise<T>>,
  batchSize = 5
): Promise<T[]> => {
  const results: T[] = []

  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(query => query()))
    results.push(...batchResults)
  }

  return results
}

// Connection cleanup utility
export const cleanupConnections = () => {
  const now = Date.now()

  // Clean up connection pool entries
  for (const [key, value] of connectionPool.entries()) {
    if (now - value.created > CONNECTION_TIMEOUT) {
      connectionPool.delete(key)
    }
  }

  // Development debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`🧹 [Supabase Cleanup] Pool size: ${connectionPool.size}`)
  }
}

// Development utility to check for multiple client instances
export const debugClientInstances = () => {
  if (process.env.NODE_ENV !== 'development') return

  const registry = globalClientRegistry
  console.group('📊 [Supabase Debug] Client Instance Status')
  console.log('Initialized:', registry.initialized)
  console.log('Has Client:', !!registry.browserClient)
  console.log('Created At:', new Date(registry.createdAt).toISOString())
  console.log('Pool Size:', connectionPool.size)

  // Check if there are multiple instances by looking at window properties
  if (typeof window !== 'undefined') {
    const windowProps = Object.keys(window).filter(
      key => key.includes('supabase') || key.includes('gotrue')
    )
    if (windowProps.length > 1) {
      console.warn(
        '⚠️ Multiple Supabase-related properties detected:',
        windowProps
      )
    }
  }

  console.groupEnd()
}

// Make debug function available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).debugSupabaseClients = debugClientInstances
}

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupConnections, 300000)
}

// Session validation and retry helpers for 401 error handling
export const validateAndRefreshSession = async (client: any) => {
  try {
    const {
      data: { session },
      error,
    } = await client.auth.getSession()

    if (error) {
      console.warn('Session validation error:', error.message)
      return null
    }

    if (!session) {
      console.warn('No active session found')
      return null
    }

    // Check if session is close to expiry (within 5 minutes)
    const expiresAt = session.expires_at
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = expiresAt ? expiresAt - now : 0

    if (timeUntilExpiry < 300) {
      // Less than 5 minutes
      console.log('Session close to expiry, refreshing...')
      const { data: refreshData, error: refreshError } =
        await client.auth.refreshSession()

      if (refreshError) {
        console.error('Session refresh failed:', refreshError.message)
        return null
      }

      return refreshData.session
    }

    return session
  } catch (error) {
    console.error('Session validation failed:', error)
    return null
  }
}

export const withAuthRetry = async <T>(
  operation: () => Promise<T>,
  client: any,
  maxRetries: number = 2
): Promise<T> => {
  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Validate session before operation
      if (attempt > 0) {
        await validateAndRefreshSession(client)
      }

      return await operation()
    } catch (error: any) {
      lastError = error

      // Check if it's a 401 error and we can retry
      if (error?.status === 401 && attempt < maxRetries) {
        console.warn(`Auth error on attempt ${attempt + 1}, retrying...`)
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1))) // Exponential backoff
        continue
      }

      // If not a 401 or max retries reached, throw the error
      throw error
    }
  }

  throw lastError
}

// Note: Legacy client removed to prevent multiple GoTrueClient instances
// Use createClientComponentClient() instead

// Database types
export interface User {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
  created_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  subscription_tier: 'free' | 'standard' | 'premium' | 'enterprise'
  usage_limit: number
  usage_count: number
  usage_reset_date: string
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  subscription_status?: string | null
  subscription_plan?: string | null
  subscription_current_period_start?: string | null
  subscription_current_period_end?: string | null
  created_at: string
  updated_at: string
}

export interface TranslationHistory {
  id: string
  user_id: string
  source_text: string
  translated_text: string
  source_language: string
  target_language: string
  quality_tier: string
  quality_score: number
  character_count: number
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at'>>
      }
      translation_history: {
        Row: TranslationHistory
        Insert: Omit<TranslationHistory, 'id' | 'created_at'>
        Update: Partial<
          Omit<TranslationHistory, 'id' | 'user_id' | 'created_at'>
        >
      }
    }
  }
}
