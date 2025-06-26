'use client'

// Modern Product Launch Community Design
import MainLayout from '@/components/layouts/MainLayout'
import ModernHero from '@/components/sections/ModernHero'
import CommunityProof from '@/components/sections/CommunityProof'
import ProductShowcase from '@/components/sections/ProductShowcase'
import TrustSignals from '@/components/sections/TrustSignals'

export default function Home() {
  return (
    <MainLayout>
      {/* Modern Hero Section */}
      <ModernHero />

      {/* Community Social Proof */}
      <CommunityProof />

      {/* Interactive Product Showcase */}
      <ProductShowcase />

      {/* Trust & Credibility Signals */}
      <TrustSignals />
    </MainLayout>
  )
}