import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Create service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Check if user already has credits
    const { data: existingCredits, error: checkError } = await supabase
      .from('user_credits')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected for new users
      console.error('Error checking existing credits:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing credits' },
        { status: 500 }
      )
    }

    // If user already has credits, return existing record
    if (existingCredits) {
      const { data: credits, error: fetchError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching existing credits:', fetchError)
        return NextResponse.json(
          { error: 'Failed to fetch credits' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        credits,
        message: 'User credits already exist',
      })
    }

    // Create new credits record for the user
    const { data: newCredits, error: insertError } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        session_id: null,
        credits_left: 20,
        credits_used: 0,
        tier: 'free',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user credits:', insertError)
      return NextResponse.json(
        { error: 'Failed to initialize credits' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      credits: newCredits,
      message: 'User credits initialized successfully',
    })
  } catch (error) {
    console.error('Credits init error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
