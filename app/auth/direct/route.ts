import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('🚀 DIRECT AUTH - Bypass PKCE completely')

  try {
    const requestUrl = new URL(request.url)

    // Try to create auth session directly using Supabase Admin API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceKey) {
      return NextResponse.json(
        { error: 'Service key not configured' },
        { status: 500 }
      )
    }

    // Create admin client
    const supabase = createServerClient(supabaseUrl, serviceKey, {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(_name: string, _value: string, _options: any) {
          // No-op for service role
        },
        remove(_name: string, _options: any) {
          // No-op for service role
        },
      },
    })

    // Test: Create a test user session manually
    const testEmail = 'test@prismy.com'

    console.log('🚀 Creating test user session...')

    // First check if user exists
    const { data: existingUser } =
      await supabase.auth.admin.getUserByEmail(testEmail)

    let userId
    if (existingUser.user) {
      userId = existingUser.user.id
      console.log('🚀 Using existing test user:', userId)
    } else {
      // Create test user
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: testEmail,
          email_confirm: true,
          user_metadata: { test: true },
        })

      if (createError) {
        return NextResponse.json(
          {
            error: 'Failed to create test user',
            details: createError.message,
          },
          { status: 500 }
        )
      }

      userId = newUser.user?.id
      console.log('🚀 Created new test user:', userId)
    }

    if (!userId) {
      return NextResponse.json({ error: 'No user ID' }, { status: 500 })
    }

    // Create credits for user
    const { error: creditsError } = await supabase.from('user_credits').upsert({
      user_id: userId,
      credits_left: 20,
      total_earned: 20,
      total_spent: 0,
      trial_credits: 20,
      purchased_credits: 0,
      daily_usage_count: 0,
      daily_usage_reset: new Date().toISOString().split('T')[0],
      tier: 'free',
    })

    if (creditsError) {
      console.error('Credits error:', creditsError)
    } else {
      console.log('✅ Credits created/updated for user')
    }

    // Generate session token (manual approach)
    const redirectUrl = new URL('/app', requestUrl.origin)
    redirectUrl.searchParams.set('test_user', userId)
    redirectUrl.searchParams.set('auth_bypass', 'true')

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('🚀 Direct auth error:', error)
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
