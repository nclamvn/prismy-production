import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'
import { checkAdmin } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { count = 1, credits = 500, metadata = {} } = await request.json()

    // Validate input
    if (count < 1 || count > 100) {
      return NextResponse.json(
        { success: false, error: 'Count must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (credits < 10 || credits > 10000) {
      return NextResponse.json(
        { success: false, error: 'Credits must be between 10 and 10000' },
        { status: 400 }
      )
    }

    const supabase = createServerComponentClient()
    const generatedCodes: string[] = []
    const insertData = []

    // Generate unique invite codes
    for (let i = 0; i < count; i++) {
      // Generate a secure random code
      const code = generateInviteCode()
      const codeHash = crypto.createHash('sha256').update(code).digest('hex')
      const codePreview = code.substring(0, 4)
      
      generatedCodes.push(code)
      insertData.push({
        code_hash: codeHash,
        code_preview: codePreview,
        credits_initial: credits,
        created_by: adminCheck.userId,
        metadata: {
          ...metadata,
          batch_id: crypto.randomUUID(),
          generated_at: new Date().toISOString()
        }
      })
    }

    // Insert all invite codes
    const { data, error } = await supabase
      .from('invites')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Error generating invites:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to generate invite codes' },
        { status: 500 }
      )
    }

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_id: adminCheck.userId,
      action: 'generate_invites',
      details: {
        count,
        credits,
        metadata,
        generated_codes: generatedCodes.length
      }
    })

    return NextResponse.json({
      success: true,
      codes: generatedCodes,
      count: generatedCodes.length,
      message: `Successfully generated ${generatedCodes.length} invite codes`
    })
  } catch (error) {
    console.error('Error in invite generation:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Generate a secure invite code
function generateInviteCode(): string {
  const prefix = 'PRISMY'
  const randomPart = crypto.randomBytes(8).toString('base64')
    .replace(/[+\/]/g, '') // Remove problematic characters
    .substring(0, 10)
    .toUpperCase()
  
  return `${prefix}-${randomPart}`
}