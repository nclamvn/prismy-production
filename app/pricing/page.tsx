'use client'

import { PricingErrorBoundary } from '@/components/ErrorBoundary'
import PricingPage from '@/components/pricing/PricingPage'

export default function PricingRoute() {
  return (
    <PricingErrorBoundary>
      <PricingPage />
    </PricingErrorBoundary>
  )
}
