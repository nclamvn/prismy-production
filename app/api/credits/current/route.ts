import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Response handled by parent
        },
        remove(name: string, options: any) {
          // Response handled by parent
        },
      },
    }
  )

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user credits
    const { data: credits, error } = await supabase
      .from('user_credits')
      .select('credits_left, trial_credits, purchased_credits, tier')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching credits:', error)
      return NextResponse.json(
        { error: 'Failed to fetch credits' },
        { status: 500 }
      )
    }

    // Calculate remaining and bonus credits
    const remaining = credits?.credits_left || 0
    const bonus = credits?.trial_credits || 0
    const tier = credits?.tier || 'free'

    return NextResponse.json({
      success: true,
      credits: {
        remaining,
        bonus,
        tier,
        total: remaining + bonus,
      },
    })
  } catch (error) {
    console.error('Credits API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}