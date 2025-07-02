import { createServerComponentClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function checkAdmin() {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Get current session
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return { isAdmin: false, userId: null }
    }

    // Check if user is admin
    // For now, we'll use a simple email check - replace with proper role checking
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    const isAdmin = adminEmails.includes(session.user.email || '')

    // Alternative: Check user metadata for admin role
    // const isAdmin = session.user.user_metadata?.role === 'admin'

    return {
      isAdmin,
      userId: session.user.id,
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
    return { isAdmin: false, userId: null }
  }
}
