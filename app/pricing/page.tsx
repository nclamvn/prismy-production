'use client'

import { PricingErrorBoundary } from '@/components/ErrorBoundary'
import PublicLayout from '@/components/layouts/PublicLayout'
import PricingPage from '@/components/pricing/PricingPage'

export default function PricingRoute() {
  return (
    <PublicLayout>
      <PricingErrorBoundary>
        <PricingPage />
      </PricingErrorBoundary>
    </PublicLayout>
  )
}
