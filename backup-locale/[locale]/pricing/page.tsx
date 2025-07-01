'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { PricingErrorBoundary } from '@/components/ErrorBoundary'
import MainLayout from '@/components/layouts/MainLayout'

// Dynamic import for heavy pricing component
const PricingPage = dynamic(() => import('@/components/pricing/PricingPage'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Loading pricing information...</p>
      </div>
    </div>
  ),
  ssr: false // Disable SSR for heavy interactive components
})

export default function PricingRoute() {
  return (
    <MainLayout>
      <PricingErrorBoundary>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading pricing...</p>
            </div>
          </div>
        }>
          <PricingPage />
        </Suspense>
      </PricingErrorBoundary>
    </MainLayout>
  )
}
