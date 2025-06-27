import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await checkAdmin()
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      isAdmin: true,
      userId: adminCheck.userId
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 401 }
    )
  }
}