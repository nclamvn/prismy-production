import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// Singleton client-side Supabase client to prevent multiple instances
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export const createClientComponentClient = () => {
  if (typeof window === 'undefined') {
    // Server-side: always create new instance
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  // Client-side: use singleton pattern
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  return browserClient
}

// Server-side Supabase client for API routes
export const createRouteHandlerClient = ({
  cookies: cookieStore,
}: {
  cookies: () => any
}) => {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore().get(name)?.value
      },
      set(name: string, value: string, options: Record<string, any>) {
        cookieStore().set({ name, value, ...options })
      },
      remove(name: string, options: Record<string, any>) {
        cookieStore().set({ name, value: '', ...options })
      },
    },
  })
}

// Server-side Supabase client for Server Components
export const createServerComponentClient = ({
  cookies: cookieStore,
}: {
  cookies: () => any
}) => {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore().get(name)?.value
      },
    },
  })
}

// Service role client for admin operations
export const createServiceRoleClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey)
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
