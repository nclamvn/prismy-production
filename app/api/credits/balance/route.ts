import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getUserCreditStatus } from '@/lib/credit-manager'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Optimized: Reduced logging for production performance
    if (process.env.NODE_ENV === 'development') {
      console.log('💰 Credit balance API called')
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get comprehensive credit status using credit manager (optimized)
    const creditStatus = await getUserCreditStatus(supabase, user.id)

    // Defensive check for creditStatus
    if (!creditStatus) {
      console.error('Failed to get credit status for user:', user.id)
      return NextResponse.json(
        { error: 'Failed to fetch credit status' },
        { status: 500 }
      )
    }

    // Also get raw balance for backwards compatibility
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

    // Format response to match CreditData interface expected by CreditDisplay
    const formattedResponse = {
      success: true,
      credits: {
        current: creditStatus.creditsLeft || balance,
        total_earned: creditStatus.totalEarned || 0,
        total_spent: creditStatus.totalSpent || 0,
        trial_credits: 0, // TODO: Add to getUserCreditStatus if needed
        purchased_credits: 0, // TODO: Add to getUserCreditStatus if needed
        estimated_days_remaining: creditStatus.creditsLeft
          ? Math.ceil(creditStatus.creditsLeft / 10)
          : 0, // Rough estimate
      },
      status: {
        needsInvite: creditStatus.needsInvite,
        hasActiveCredits: creditStatus.hasCredits,
        trialExpired: creditStatus.trialExpired,
        accountType: creditStatus.accountType as
          | 'none'
          | 'trial'
          | 'trial_expired'
          | 'paid',
      },
      usage: {
        today: 0, // TODO: Implement usage tracking if needed
        week: 0, // TODO: Implement usage tracking if needed
        month: 0, // TODO: Implement usage tracking if needed
      },
      // Keep legacy fields for backwards compatibility
      balance,
      user_id: user.id,
    }

    // Optimized: Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Credit status fetched successfully', {
        userId: user.id,
        balance: creditStatus.creditsLeft,
        needsInvite: creditStatus.needsInvite,
        accountType: creditStatus.accountType,
      })
    }

    return NextResponse.json(formattedResponse, {
      headers: {
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
      },
    })
  } catch (error) {
    console.error('❌ Credit balance API error:', error)

    return NextResponse.json(
      {
        error: 'Credit balance API failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    )
  }
}
