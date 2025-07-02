import {
  createClient,
  createServerClient,
  createServiceClient,
} from '@/lib/supabase-client'
import type { Database } from '@/lib/supabase-client'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export class AuthService {
  private client: ReturnType<typeof createClient>

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.client = createClient()
    }
  }

  // Client-side authentication methods
  async signUp(email: string, password: string, metadata?: any) {
    if (typeof window === 'undefined') {
      throw new Error('signUp can only be called on the client side')
    }

    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async signIn(email: string, password: string) {
    if (typeof window === 'undefined') {
      throw new Error('signIn can only be called on the client side')
    }

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async signOut() {
    if (typeof window === 'undefined') {
      throw new Error('signOut can only be called on the client side')
    }

    const { error } = await this.client.auth.signOut()

    if (error) {
      throw new Error(error.message)
    }
  }

  async getSession() {
    if (typeof window === 'undefined') {
      throw new Error('getSession can only be called on the client side')
    }

    const { data, error } = await this.client.auth.getSession()

    if (error) {
      throw new Error(error.message)
    }

    return data.session
  }

  async getUser() {
    if (typeof window === 'undefined') {
      throw new Error('getUser can only be called on the client side')
    }

    const { data, error } = await this.client.auth.getUser()

    if (error) {
      throw new Error(error.message)
    }

    return data.user
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (typeof window === 'undefined') {
      throw new Error('onAuthStateChange can only be called on the client side')
    }

    return this.client.auth.onAuthStateChange(callback)
  }
}

// Server-side auth service for API routes
export class ServerAuthService {
  private client: ReturnType<typeof createServerClient>

  constructor(cookieStore: () => any) {
    this.client = createServerClient(cookieStore)
  }

  async getSession() {
    const { data, error } = await this.client.auth.getSession()

    if (error) {
      throw new Error(error.message)
    }

    return data.session
  }

  async getUser() {
    const { data, error } = await this.client.auth.getUser()

    if (error) {
      throw new Error(error.message)
    }

    return data.user
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.client
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw new Error(error.message)
    }

    return data
  }

  async createUserProfile(profile: UserProfileInsert): Promise<UserProfile> {
    const { data, error } = await this.client
      .from('user_profiles')
      .insert(profile)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async updateUserProfile(
    userId: string,
    updates: UserProfileUpdate
  ): Promise<UserProfile> {
    const { data, error } = await this.client
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async incrementUsageCount(userId: string): Promise<UserProfile> {
    const { data, error } = await this.client
      .from('user_profiles')
      .update({
        usage_count: this.client.sql`usage_count + 1`,
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async checkUsageLimit(
    userId: string
  ): Promise<{ allowed: boolean; usage: UserProfile }> {
    const profile = await this.getUserProfile(userId)

    if (!profile) {
      throw new Error('User profile not found')
    }

    const allowed = profile.usage_count < profile.usage_limit

    return { allowed, usage: profile }
  }
}

// Service role auth service for admin operations
export class AdminAuthService {
  private client: ReturnType<typeof createServiceClient>

  constructor() {
    this.client = createServiceClient()
  }

  async getUserById(userId: string) {
    const { data, error } = await this.client.auth.admin.getUserById(userId)

    if (error) {
      throw new Error(error.message)
    }

    return data.user
  }

  async listUsers(page = 1, perPage = 50) {
    const { data, error } = await this.client.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async deleteUser(userId: string) {
    const { error } = await this.client.auth.admin.deleteUser(userId)

    if (error) {
      throw new Error(error.message)
    }
  }

  async createUserProfile(profile: UserProfileInsert): Promise<UserProfile> {
    const { data, error } = await this.client
      .from('user_profiles')
      .insert(profile)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async updateUserSubscription(
    userId: string,
    subscription: {
      tier: 'free' | 'standard' | 'premium' | 'enterprise'
      limit: number
      stripeCustomerId?: string
      stripeSubscriptionId?: string
      status?: string
      plan?: string
      currentPeriodStart?: string
      currentPeriodEnd?: string
    }
  ): Promise<UserProfile> {
    const updates: UserProfileUpdate = {
      subscription_tier: subscription.tier,
      usage_limit: subscription.limit,
      stripe_customer_id: subscription.stripeCustomerId,
      stripe_subscription_id: subscription.stripeSubscriptionId,
      subscription_status: subscription.status,
      subscription_plan: subscription.plan,
      subscription_current_period_start: subscription.currentPeriodStart,
      subscription_current_period_end: subscription.currentPeriodEnd,
    }

    const { data, error } = await this.client
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }
}

// Singleton instances
export const authService = new AuthService()
export const createServerAuthService = (cookieStore: () => any) =>
  new ServerAuthService(cookieStore)
export const adminAuthService = new AdminAuthService()
