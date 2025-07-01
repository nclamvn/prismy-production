/**
 * Advanced Billing & Subscription Management
 * Handles complex subscription tiers, usage tracking, and billing automation
 */

import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export interface SubscriptionTier {
  id: string
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: {
    maxDocuments: number
    maxTranslations: number
    maxTeamMembers: number
    maxStorageGB: number
    prioritySupport: boolean
    customBranding: boolean
    apiAccess: boolean
    advancedAnalytics: boolean
    ssoIntegration: boolean
    dedicatedManager: boolean
  }
  usage: {
    documentsIncluded: number
    translationsIncluded: number
    overageRates: {
      perDocument: number
      perTranslation: number
      perGB: number
    }
  }
  stripeProductId: string
  stripePriceId: string
}

export interface UsageMetrics {
  documentsUsed: number
  translationsUsed: number
  storageUsedGB: number
  teamMembers: number
  apiCallsUsed: number
  currentPeriodStart: Date
  currentPeriodEnd: Date
}

export interface BillingEvent {
  type: 'subscription_created' | 'subscription_updated' | 'subscription_cancelled' | 'payment_succeeded' | 'payment_failed' | 'usage_overage'
  userId: string
  organizationId?: string
  subscriptionId: string
  amount?: number
  metadata?: Record<string, any>
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: {
      maxDocuments: 10,
      maxTranslations: 50,
      maxTeamMembers: 1,
      maxStorageGB: 1,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false,
      advancedAnalytics: false,
      ssoIntegration: false,
      dedicatedManager: false
    },
    usage: {
      documentsIncluded: 10,
      translationsIncluded: 50,
      overageRates: {
        perDocument: 0.10,
        perTranslation: 0.02,
        perGB: 5.00
      }
    },
    stripeProductId: '',
    stripePriceId: ''
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    price: 29,
    currency: 'USD',
    interval: 'month',
    features: {
      maxDocuments: 100,
      maxTranslations: 1000,
      maxTeamMembers: 5,
      maxStorageGB: 10,
      prioritySupport: true,
      customBranding: false,
      apiAccess: true,
      advancedAnalytics: true,
      ssoIntegration: false,
      dedicatedManager: false
    },
    usage: {
      documentsIncluded: 100,
      translationsIncluded: 1000,
      overageRates: {
        perDocument: 0.08,
        perTranslation: 0.015,
        perGB: 3.00
      }
    },
    stripeProductId: process.env.STRIPE_PRODUCT_STANDARD!,
    stripePriceId: process.env.STRIPE_PRICE_STANDARD!
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 99,
    currency: 'USD',
    interval: 'month',
    features: {
      maxDocuments: 500,
      maxTranslations: 5000,
      maxTeamMembers: 20,
      maxStorageGB: 50,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
      advancedAnalytics: true,
      ssoIntegration: true,
      dedicatedManager: false
    },
    usage: {
      documentsIncluded: 500,
      translationsIncluded: 5000,
      overageRates: {
        perDocument: 0.05,
        perTranslation: 0.01,
        perGB: 2.00
      }
    },
    stripeProductId: process.env.STRIPE_PRODUCT_PREMIUM!,
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM!
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    currency: 'USD',
    interval: 'month',
    features: {
      maxDocuments: -1, // Unlimited
      maxTranslations: -1, // Unlimited
      maxTeamMembers: -1, // Unlimited
      maxStorageGB: 500,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
      advancedAnalytics: true,
      ssoIntegration: true,
      dedicatedManager: true
    },
    usage: {
      documentsIncluded: -1, // Unlimited
      translationsIncluded: -1, // Unlimited
      overageRates: {
        perDocument: 0.02,
        perTranslation: 0.005,
        perGB: 1.00
      }
    },
    stripeProductId: process.env.STRIPE_PRODUCT_ENTERPRISE!,
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE!
  }
}

export class SubscriptionManager {
  private static instance: SubscriptionManager

  private constructor() {}

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager()
    }
    return SubscriptionManager.instance
  }

  /**
   * Create a new subscription
   */
  async createSubscription(
    userId: string,
    organizationId: string | null,
    tierId: string,
    paymentMethodId?: string
  ): Promise<{ subscriptionId: string; clientSecret?: string }> {
    try {
      const tier = SUBSCRIPTION_TIERS[tierId]
      if (!tier) {
        throw new Error(`Invalid subscription tier: ${tierId}`)
      }

      // Get or create Stripe customer
      const customerId = await this.getOrCreateStripeCustomer(userId, organizationId)

      // Attach payment method if provided
      if (paymentMethodId) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId
        })

        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        })
      }

      // Create Stripe subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: tier.stripePriceId
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId,
          organizationId: organizationId || '',
          tier: tierId
        }
      })

      // Store subscription in database
      await this.storeSubscription(userId, organizationId, subscription, tierId)

      // Log billing event
      await this.logBillingEvent({
        type: 'subscription_created',
        userId,
        organizationId: organizationId || undefined,
        subscriptionId: subscription.id,
        amount: tier.price,
        metadata: { tier: tierId }
      })

      const result: { subscriptionId: string; clientSecret?: string } = {
        subscriptionId: subscription.id
      }

      // If payment requires confirmation, return client secret
      if (subscription.latest_invoice && 
          typeof subscription.latest_invoice === 'object' &&
          subscription.latest_invoice.payment_intent &&
          typeof subscription.latest_invoice.payment_intent === 'object') {
        result.clientSecret = subscription.latest_invoice.payment_intent.client_secret || undefined
      }

      logger.info('Subscription created', { userId, organizationId, tier: tierId })
      return result

    } catch (error) {
      logger.error('Failed to create subscription', { error, userId, tierId })
      throw error
    }
  }

  /**
   * Update existing subscription
   */
  async updateSubscription(
    subscriptionId: string,
    newTierId: string
  ): Promise<void> {
    try {
      const newTier = SUBSCRIPTION_TIERS[newTierId]
      if (!newTier) {
        throw new Error(`Invalid subscription tier: ${newTierId}`)
      }

      // Update Stripe subscription
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
          price: newTier.stripePriceId
        }],
        proration_behavior: 'create_prorations'
      })

      // Update database record
      await supabase
        .from('user_subscriptions')
        .update({
          subscription_tier: newTierId,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId)

      // Log billing event
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('user_id, organization_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

      if (subData) {
        await this.logBillingEvent({
          type: 'subscription_updated',
          userId: subData.user_id,
          organizationId: subData.organization_id,
          subscriptionId,
          amount: newTier.price,
          metadata: { newTier: newTierId }
        })
      }

      logger.info('Subscription updated', { subscriptionId, newTier: newTierId })

    } catch (error) {
      logger.error('Failed to update subscription', { error, subscriptionId, newTierId })
      throw error
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<void> {
    try {
      if (immediately) {
        // Cancel immediately
        await stripe.subscriptions.cancel(subscriptionId)
        
        // Update database
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId)
      } else {
        // Cancel at period end
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        })

        // Update database
        await supabase
          .from('user_subscriptions')
          .update({
            cancel_at_period_end: true,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId)
      }

      // Log billing event
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('user_id, organization_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

      if (subData) {
        await this.logBillingEvent({
          type: 'subscription_cancelled',
          userId: subData.user_id,
          organizationId: subData.organization_id,
          subscriptionId,
          metadata: { immediately }
        })
      }

      logger.info('Subscription cancelled', { subscriptionId, immediately })

    } catch (error) {
      logger.error('Failed to cancel subscription', { error, subscriptionId })
      throw error
    }
  }

  /**
   * Get current usage metrics
   */
  async getUsageMetrics(
    userId: string,
    organizationId?: string
  ): Promise<UsageMetrics> {
    try {
      // Get subscription details
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (!subscription) {
        throw new Error('No active subscription found')
      }

      const periodStart = new Date(subscription.current_period_start)
      const periodEnd = new Date(subscription.current_period_end)

      // Get usage data for current period
      const [documentsCount, translationsCount, storageUsage, teamMembersCount, apiCallsCount] = await Promise.all([
        // Documents count
        supabase
          .from('documents')
          .select('count')
          .eq(organizationId ? 'organization_id' : 'user_id', organizationId || userId)
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString()),

        // Translations count
        supabase
          .from('translations')
          .select('count')
          .eq(organizationId ? 'organization_id' : 'user_id', organizationId || userId)
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString()),

        // Storage usage (sum of document sizes)
        supabase
          .from('documents')
          .select('metadata')
          .eq(organizationId ? 'organization_id' : 'user_id', organizationId || userId),

        // Team members count
        organizationId ? 
          supabase
            .from('organization_members')
            .select('count')
            .eq('organization_id', organizationId)
            .eq('status', 'active') :
          Promise.resolve({ data: [{ count: 1 }] }),

        // API calls count
        supabase
          .from('usage_logs')
          .select('count')
          .eq(organizationId ? 'organization_id' : 'user_id', organizationId || userId)
          .eq('event_type', 'api_call')
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString())
      ])

      // Calculate storage usage in GB
      let storageUsedGB = 0
      if (storageUsage.data) {
        storageUsedGB = storageUsage.data.reduce((total, doc) => {
          const size = doc.metadata?.size || 0
          return total + (size / (1024 * 1024 * 1024)) // Convert bytes to GB
        }, 0)
      }

      return {
        documentsUsed: documentsCount.data?.[0]?.count || 0,
        translationsUsed: translationsCount.data?.[0]?.count || 0,
        storageUsedGB,
        teamMembers: teamMembersCount.data?.[0]?.count || 1,
        apiCallsUsed: apiCallsCount.data?.[0]?.count || 0,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd
      }

    } catch (error) {
      logger.error('Failed to get usage metrics', { error, userId, organizationId })
      throw error
    }
  }

  /**
   * Calculate overage charges
   */
  async calculateOverageCharges(
    userId: string,
    organizationId?: string
  ): Promise<{ amount: number; breakdown: Record<string, number> }> {
    try {
      const [usage, subscription] = await Promise.all([
        this.getUsageMetrics(userId, organizationId),
        supabase
          .from('user_subscriptions')
          .select('subscription_tier')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single()
      ])

      if (!subscription) {
        throw new Error('No active subscription found')
      }

      const tier = SUBSCRIPTION_TIERS[subscription.data.subscription_tier]
      if (!tier) {
        throw new Error('Invalid subscription tier')
      }

      const breakdown: Record<string, number> = {}
      let totalAmount = 0

      // Calculate document overage
      if (tier.usage.documentsIncluded !== -1 && usage.documentsUsed > tier.usage.documentsIncluded) {
        const overage = usage.documentsUsed - tier.usage.documentsIncluded
        breakdown.documents = overage * tier.usage.overageRates.perDocument
        totalAmount += breakdown.documents
      }

      // Calculate translation overage
      if (tier.usage.translationsIncluded !== -1 && usage.translationsUsed > tier.usage.translationsIncluded) {
        const overage = usage.translationsUsed - tier.usage.translationsIncluded
        breakdown.translations = overage * tier.usage.overageRates.perTranslation
        totalAmount += breakdown.translations
      }

      // Calculate storage overage
      if (usage.storageUsedGB > tier.features.maxStorageGB) {
        const overage = usage.storageUsedGB - tier.features.maxStorageGB
        breakdown.storage = overage * tier.usage.overageRates.perGB
        totalAmount += breakdown.storage
      }

      return { amount: totalAmount, breakdown }

    } catch (error) {
      logger.error('Failed to calculate overage charges', { error, userId, organizationId })
      throw error
    }
  }

  /**
   * Process overage billing
   */
  async processOverageBilling(
    userId: string,
    organizationId?: string
  ): Promise<void> {
    try {
      const overageCharges = await this.calculateOverageCharges(userId, organizationId)
      
      if (overageCharges.amount <= 0) {
        return // No overage charges
      }

      // Get subscription details
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (!subscription) {
        throw new Error('No active subscription found')
      }

      // Create invoice item in Stripe
      await stripe.invoiceItems.create({
        customer: subscription.stripe_customer_id,
        amount: Math.round(overageCharges.amount * 100), // Convert to cents
        currency: 'usd',
        description: 'Usage overage charges',
        metadata: {
          userId,
          organizationId: organizationId || '',
          breakdown: JSON.stringify(overageCharges.breakdown)
        }
      })

      // Log billing event
      await this.logBillingEvent({
        type: 'usage_overage',
        userId,
        organizationId,
        subscriptionId: subscription.stripe_subscription_id,
        amount: overageCharges.amount,
        metadata: { breakdown: overageCharges.breakdown }
      })

      logger.info('Overage billing processed', { 
        userId, 
        organizationId, 
        amount: overageCharges.amount,
        breakdown: overageCharges.breakdown
      })

    } catch (error) {
      logger.error('Failed to process overage billing', { error, userId, organizationId })
      throw error
    }
  }

  /**
   * Get or create Stripe customer
   */
  private async getOrCreateStripeCustomer(
    userId: string,
    organizationId?: string | null
  ): Promise<string> {
    try {
      // Check if customer already exists
      const { data: existingCustomer } = await supabase
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .limit(1)
        .single()

      if (existingCustomer?.stripe_customer_id) {
        return existingCustomer.stripe_customer_id
      }

      // Get user details
      const { data: user } = await supabase.auth.admin.getUserById(userId)
      if (!user.user) {
        throw new Error('User not found')
      }

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.user.email,
        metadata: {
          userId,
          organizationId: organizationId || ''
        }
      })

      return customer.id

    } catch (error) {
      logger.error('Failed to get or create Stripe customer', { error, userId })
      throw error
    }
  }

  /**
   * Store subscription in database
   */
  private async storeSubscription(
    userId: string,
    organizationId: string | null,
    subscription: Stripe.Subscription,
    tierId: string
  ): Promise<void> {
    await supabase.from('user_subscriptions').upsert({
      user_id: userId,
      organization_id: organizationId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      subscription_tier: tierId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Log billing event
   */
  private async logBillingEvent(event: BillingEvent): Promise<void> {
    try {
      await supabase.from('billing_records').insert({
        user_id: event.userId,
        organization_id: event.organizationId,
        subscription_id: event.subscriptionId,
        event_type: event.type,
        amount: event.amount || 0,
        currency: 'USD',
        status: 'completed',
        metadata: event.metadata,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      logger.error('Failed to log billing event', { error, event })
    }
  }
}