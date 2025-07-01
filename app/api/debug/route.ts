import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('[debug] Starting debug endpoint')
    
    // Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('[debug] Environment check:', { hasUrl, hasServiceKey, hasAnonKey })
    
    if (!hasUrl || !hasServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        details: { hasUrl, hasServiceKey, hasAnonKey }
      }, { status: 500 })
    }

    const cookieStore = cookies()
    
    // Test with service role key
    const supabaseService = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    // Test database connection
    console.log('[debug] Testing database connection')
    const { data: dbTest, error: dbError } = await supabaseService
      .from('user_credits')
      .select('count')
      .limit(1)

    console.log('[debug] Database test result:', { dbTest, dbError })

    // Test storage connection
    console.log('[debug] Testing storage connection')
    const { data: buckets, error: bucketsError } = await supabaseService.storage.listBuckets()
    
    console.log('[debug] Storage buckets:', { buckets, bucketsError })

    // Test specific documents bucket
    if (buckets) {
      const documentsBucket = buckets.find(b => b.name === 'documents')
      console.log('[debug] Documents bucket:', documentsBucket)
    }

    return NextResponse.json({
      success: true,
      environment: { hasUrl, hasServiceKey, hasAnonKey },
      database: { success: !dbError, error: dbError?.message },
      storage: { 
        success: !bucketsError, 
        error: bucketsError?.message,
        buckets: buckets?.map(b => b.name) || []
      }
    })

  } catch (error) {
    console.error('[debug] Critical error:', error)
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}