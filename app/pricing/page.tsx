'use client'

import dynamicImport from 'next/dynamic'

// ULTRATHINK: Completely disable SSR and static generation
const PricingPageComponent = dynamicImport(
  () => import('@/components/pricing/PricingPage'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }
)

// Force dynamic rendering and disable all static optimization
export const dynamic = 'force-dynamic'

export default function PricingRoute() {
  return <PricingPageComponent />
}