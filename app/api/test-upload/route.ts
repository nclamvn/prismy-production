import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[test-upload] Starting test upload')
    
    // Check environment variables
    const envCheck = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    }
    
    console.log('[test-upload] Environment check:', envCheck)
    
    // Try to parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    console.log('[test-upload] File received:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    })
    
    return NextResponse.json({
      success: true,
      environment: envCheck,
      file: file ? {
        name: file.name,
        size: file.size,
        type: file.type
      } : null,
      message: 'Test upload successful - no Supabase calls'
    })
    
  } catch (error) {
    console.error('[test-upload] Error:', error)
    return NextResponse.json({
      error: 'Test upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}