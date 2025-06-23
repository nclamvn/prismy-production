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
    params: {
      eventsPerSecond: 10,
    },
  },
}

// Connection pool for optimized performance
const connectionPool = new Map<string, any>()
const MAX_POOL_SIZE = 10
const CONNECTION_TIMEOUT = 30000 // 30 seconds

// Singleton client-side Supabase client with enhanced performance
let browserClient: ReturnType<typeof createBrowserClient> | null = null
let lastUsed = Date.now()

export const createClientComponentClient = () => {
  if (typeof window === 'undefined') {
    // Server-side: always create new instance with optimizations
    return createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
      supabaseClientConfig
    )
  }

  // Client-side: use optimized singleton pattern with connection reuse
  const now = Date.now()

  // Recreate client if it's been idle for too long (connection freshness)
  if (!browserClient || now - lastUsed > CONNECTION_TIMEOUT) {
    if (browserClient) {
      // Clean up old client
      browserClient.removeAllChannels()
    }
    browserClient = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
      supabaseClientConfig
    )
  }

  lastUsed = now
  return browserClient
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
          console.warn('Cookie setting failed:', error)
        }
      },
      remove(name: string, options: Record<string, any>) {
        try {
          cookieStore().set({ name, value: '', ...options })
        } catch (error) {
          // Silent fail for cookie removal in some contexts
          console.warn('Cookie removal failed:', error)
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
          console.warn('Cookie reading failed:', error)
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

  for (const [key, value] of connectionPool.entries()) {
    if (now - value.created > CONNECTION_TIMEOUT) {
      connectionPool.delete(key)
    }
  }

  // Reset browser client if needed
  if (browserClient && now - lastUsed > CONNECTION_TIMEOUT) {
    browserClient.removeAllChannels()
    browserClient = null
  }
}

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupConnections, 300000)
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
