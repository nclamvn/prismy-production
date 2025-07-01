import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'

// Environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables')
}

// Optimized client configuration
const clientConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
  },
  global: {
    headers: {
      'x-client-info': 'prismy-web@2.0.0',
    },
  },
  // Disable realtime for better performance and CSP compliance
  realtime: {
    enabled: false,
  },
}

// Browser client - singleton pattern for client-side usage
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Only create client on browser side
  if (typeof window === 'undefined') {
    throw new Error('createClient() should only be called on the client side')
  }

  // Return existing client if available (singleton)
  if (browserClient) {
    return browserClient
  }

  // Create new browser client
  browserClient = createBrowserClient(supabaseUrl!, supabaseAnonKey!, clientConfig)

  return browserClient
}

// Server client for API routes
export function createServerClient(cookieStore: () => any) {
  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    ...clientConfig,
    cookies: {
      get(name: string) {
        return cookieStore().get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore().set({ name, value, ...options })
        } catch (error) {
          // Silent fail for cookie setting issues
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore().set({ name, value: '', ...options })
        } catch (error) {
          // Silent fail for cookie removal issues
        }
      },
    },
  })
}

// Service role client for admin operations
let serviceClient: ReturnType<typeof createClient> | null = null

export function createServiceClient() {
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  // Return existing service client if available
  if (serviceClient) {
    return serviceClient
  }

  // Create new service client
  serviceClient = createClient(supabaseUrl!, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-client-info': 'prismy-service@2.0.0',
      },
    },
  })

  return serviceClient
}

// Database types for type safety
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'standard' | 'premium' | 'enterprise'
          usage_limit: number
          usage_count: number
          usage_reset_date: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_plan: string | null
          subscription_current_period_start: string | null
          subscription_current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'standard' | 'premium' | 'enterprise'
          usage_limit?: number
          usage_count?: number
          usage_reset_date?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_plan?: string | null
          subscription_current_period_start?: string | null
          subscription_current_period_end?: string | null
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'standard' | 'premium' | 'enterprise'
          usage_limit?: number
          usage_count?: number
          usage_reset_date?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_plan?: string | null
          subscription_current_period_start?: string | null
          subscription_current_period_end?: string | null
        }
      }
      translation_history: {
        Row: {
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
        Insert: {
          user_id: string
          source_text: string
          translated_text: string
          source_language: string
          target_language: string
          quality_tier: string
          quality_score: number
          character_count: number
        }
        Update: {
          source_text?: string
          translated_text?: string
          source_language?: string
          target_language?: string
          quality_tier?: string
          quality_score?: number
          character_count?: number
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          name: string
          file_type: string
          file_size: number
          original_content: string
          translated_content: string | null
          source_language: string
          target_language: string | null
          processing_status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          file_type: string
          file_size: number
          original_content: string
          translated_content?: string | null
          source_language: string
          target_language?: string | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
        }
        Update: {
          name?: string
          translated_content?: string | null
          target_language?: string | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
        }
      }
      invite_credits: {
        Row: {
          id: string
          user_id: string
          credits_earned: number
          invites_sent: number
          invites_accepted: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          credits_earned?: number
          invites_sent?: number
          invites_accepted?: number
        }
        Update: {
          credits_earned?: number
          invites_sent?: number
          invites_accepted?: number
        }
      }
    }
  }
}

// Typed client exports
export type SupabaseClient = ReturnType<typeof createClient>
export type SupabaseServerClient = ReturnType<typeof createServerClient>
export type SupabaseServiceClient = ReturnType<typeof createServiceClient>