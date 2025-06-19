import PricingPage from '@/components/pricing/PricingPage'
import { createServerComponentClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export default async function Pricing() {
  const supabase = createServerComponentClient({ cookies })
  
  // Get user session for personalized pricing
  const { data: { session } } = await supabase.auth.getSession()
  
  return <PricingPage />
}

export const metadata = {
  title: 'Pricing - Prismy',
  description: 'Choose the perfect translation plan for your needs. Start free and upgrade as you grow.',
}