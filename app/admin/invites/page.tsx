/**
 * PRISMY ADMIN - INVITE MANAGEMENT PAGE
 * Admin interface for managing invite codes and beta users
 */

import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase'
import InviteManagementDashboard from '@/components/admin/InviteManagementDashboard'

export const metadata: Metadata = {
  title: 'Invite Management - Prismy Admin',
  description: 'Manage invite codes for Prismy private beta',
  robots: 'noindex, nofollow' // Don't index admin pages
}

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'

export default async function AdminInvitesPage() {
  // Check authentication and admin privileges
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  
  if (authError || !session) {
    redirect('/auth/login?redirect=/admin/invites')
  }

  // Check if user is admin (enterprise tier)
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('subscription_tier, full_name')
    .eq('user_id', session.user.id)
    .single()

  if (profileError || !profile) {
    redirect('/workspace?error=profile_not_found')
  }

  // Only enterprise tier users can access admin features
  if (profile.subscription_tier !== 'enterprise') {
    redirect('/workspace?error=insufficient_privileges')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.svg" alt="Prismy" className="h-8 w-auto mr-3" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Prismy Admin</h1>
                <p className="text-sm text-gray-500">Invite Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {profile.full_name || session.user.email}
              </span>
              <a
                href="/workspace"
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Workspace
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <a
              href="/admin/invites"
              className="border-b-2 border-blue-500 text-blue-600 py-4 px-1 text-sm font-medium"
            >
              Invite Management
            </a>
            <a
              href="/admin/users"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium transition-colors"
            >
              User Management
            </a>
            <a
              href="/admin/analytics"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium transition-colors"
            >
              Analytics
            </a>
            <a
              href="/admin/settings"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium transition-colors"
            >
              Settings
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <InviteManagementDashboard />
      </main>
    </div>
  )
}