import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('💰 Credit balance API called')

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's credit balance using the function
    const { data: balanceData, error: balanceError } = await supabase
      .rpc('get_user_credit_balance', { p_user_id: user.id })
      .single()

    if (balanceError) {
      console.error('Error fetching credit balance:', balanceError)
      return NextResponse.json(
        { error: 'Failed to fetch credit balance' },
        { status: 500 }
      )
    }

    const balance = balanceData?.balance || 0

    console.log('✅ Credit balance fetched successfully', {
      userId: user.id,
      balance
    })

    return NextResponse.json({
      success: true,
      balance,
      user_id: user.id
    })

  } catch (error) {
    console.error('❌ Credit balance API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Credit balance API failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    )
  }
}