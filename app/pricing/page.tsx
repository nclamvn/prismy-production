import PricingPage from '@/components/pricing/PricingPage'
import { createServerComponentClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export default async function Pricing() {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Get user session for personalized pricing with error handling
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.warn('Supabase session error:', error.message)
    }
    
    return <PricingPage />
  } catch (error) {
    console.error('Pricing page error:', error)
    return <PricingPage />
  }
}

export const metadata = {
  title: 'Pricing - Prismy',
  description: 'Choose the perfect translation plan for your needs. Start free and upgrade as you grow.',
}