'use client'

import { PricingErrorBoundary } from '@/components/ErrorBoundary'
import MainLayout from '@/components/layouts/MainLayout'
import PricingPage from '@/components/pricing/PricingPage'

export default function PricingRoute() {
  return (
    <MainLayout>
      <PricingErrorBoundary>
        <PricingPage />
      </PricingErrorBoundary>
    </MainLayout>
  )
}
