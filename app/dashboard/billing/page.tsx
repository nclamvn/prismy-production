'use client'

import BillingPage from '@/components/billing/BillingPage'

export default function Billing() {
  return <BillingPage />
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'