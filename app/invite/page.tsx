/**
 * PRISMY INVITE REDEMPTION PAGE
 * Public page for users to redeem invite codes
 */

import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase'
import InviteRedemptionPage from '@/components/invite/InviteRedemptionPage'

export const metadata: Metadata = {
  title: 'Redeem Invite Code - Prismy',
  description: 'Enter your invite code to get started with Prismy'
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function InvitePage() {
  // Check if user is authenticated
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  
  // Redirect to login if not authenticated
  if (authError || !session) {
    redirect('/auth/login?redirect=/invite')
  }

  // Check if user already has credits
  const { data: credits } = await supabase
    .rpc('get_user_credits', { _user_id: session.user.id })

  // If user already has credits, redirect to workspace
  if (credits?.success && credits.credits_left > 0) {
    redirect('/workspace?message=already_has_credits')
  }

  return <InviteRedemptionPage userEmail={session.user.email} />
}