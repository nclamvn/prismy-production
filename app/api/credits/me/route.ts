import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user credits using RLS-enabled query
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (creditsError) {
      console.error('Error fetching user credits:', creditsError)

      // If no credits found, this might be a new user
      if (creditsError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Credits not found. Please try logging out and back in.' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to fetch credits' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      credits: {
        credits_left: credits.credits_left,
        credits_used: credits.credits_used,
        tier: credits.tier,
        created_at: credits.created_at,
        updated_at: credits.updated_at,
      },
    })
  } catch (error) {
    console.error('Credits fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
