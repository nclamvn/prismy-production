import Stripe from 'stripe'

// Server-side Stripe instance with environment check
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null

// Client-side Stripe configuration with environment check
export const getStripe = async () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn('Stripe publishable key not configured')
    return null
  }
  const { loadStripe } = await import('@stripe/stripe-js')
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '10 translations per month',
      'Basic translation quality',
      'Text translation only',
      'Community support',
    ],
    limits: {
      translations: 10,
      documents: 0,
      characters: 10000,
    },
  },
  standard: {
    name: 'Standard',
    price: 9.99,
    priceId: process.env.STRIPE_STANDARD_PRICE_ID,
    features: [
      '50 translations per month',
      'Enhanced accuracy',
      'Document translation',
      'Email support',
      'Translation history',
    ],
    limits: {
      translations: 50,
      documents: 10,
      characters: 50000,
    },
  },
  premium: {
    name: 'Premium',
    price: 29.99,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    features: [
      '200 translations per month',
      'Professional quality',
      'Unlimited documents',
      'Priority support',
      'Advanced analytics',
      'Team collaboration',
    ],
    limits: {
      translations: 200,
      documents: -1, // unlimited
      characters: 200000,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 99.99,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      '1000 translations per month',
      'Maximum precision',
      'Unlimited everything',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
    limits: {
      translations: 1000,
      documents: -1, // unlimited
      characters: 1000000,
    },
  },
} as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS

// Helper functions
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

export const getPlanByPriceId = (priceId: string): SubscriptionPlan | null => {
  for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (plan.priceId === priceId) {
      return key as SubscriptionPlan
    }
  }
  return null
}

export const createCheckoutSession = async (
  priceId: string,
  userId: string,
  userEmail: string,
  successUrl: string,
  cancelUrl: string
) => {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      metadata: {
        userId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })

    return { sessionId: session.id, url: session.url }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

export const createBillingPortalSession = async (
  customerId: string,
  returnUrl: string
) => {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return { url: session.url }
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    throw error
  }
}

export const getCustomerSubscriptions = async (customerId: string) => {
  if (!stripe) {
    return { data: [] }
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10,
    })

    return subscriptions.data
  } catch (error) {
    console.error('Error fetching customer subscriptions:', error)
    throw error
  }
}
