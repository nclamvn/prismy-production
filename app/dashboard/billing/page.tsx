import { createServerComponentClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BillingPage from '@/components/billing/BillingPage'

export default async function Billing() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Get user profile with subscription info
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  return <BillingPage profile={profile} />
}

export const metadata = {
  title: 'Billing - Dashboard - Prismy',
  description: 'Manage your subscription and billing information.',
}