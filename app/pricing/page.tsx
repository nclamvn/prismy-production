'use client'

import dynamicImport from 'next/dynamic'

// Force client-side rendering to avoid SSR auth issues
const PricingPage = dynamicImport(() => import('@/components/pricing/PricingPage'), {
  ssr: false,
  loading: () => <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
})

export default function Pricing() {
  return <PricingPage />
}