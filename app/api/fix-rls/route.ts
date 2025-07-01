import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('[fix-rls] Starting RLS policy fix')
    
    // Check environment variables
    const envCheck = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
    
    if (!envCheck.hasUrl || !envCheck.hasServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        environment: envCheck
      }, { status: 500 })
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('[fix-rls] Created Supabase client')

    // The problem: RLS policies are blocking service role access
    // Solution: Update policies to allow service role bypass OR disable RLS for service role
    
    const fixSteps = [
      // Step 1: Drop existing restrictive policies
      `DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;`,
      `DROP POLICY IF EXISTS "Users can view own jobs" ON translation_jobs;`,
      `DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;`,
      
      // Step 2: Create new permissive policies for service role
      `CREATE POLICY "Service role can manage credits" ON user_credits
        FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);`,
        
      `CREATE POLICY "Service role can manage jobs" ON translation_jobs
        FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);`,
        
      `CREATE POLICY "Service role can manage messages" ON chat_messages
        FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);`,
      
      // Step 3: Create user-specific policies
      `CREATE POLICY "Users can view own credits" ON user_credits
        FOR ALL 
        TO authenticated, anon
        USING (
          auth.uid() = user_id OR 
          auth.uid() IS NULL
        );`,
        
      `CREATE POLICY "Users can view own jobs" ON translation_jobs
        FOR ALL 
        TO authenticated, anon
        USING (
          auth.uid() = user_id OR 
          auth.uid() IS NULL
        );`,
        
      `CREATE POLICY "Users can view own chat messages" ON chat_messages
        FOR ALL 
        TO authenticated, anon
        USING (
          EXISTS (
            SELECT 1 FROM translation_jobs j 
            WHERE j.id = chat_messages.job_id 
              AND (j.user_id = auth.uid() OR auth.uid() IS NULL)
          )
        );`
    ]

    const results = []
    
    // We can't execute DDL through the Supabase client easily
    // But we can provide the SQL to run manually
    
    const sqlToRun = fixSteps.join('\n\n')
    
    return NextResponse.json({
      success: true,
      message: "RLS policy fix SQL generated. Please run this in Supabase SQL Editor:",
      sql: sqlToRun,
      instructions: [
        "1. Go to Supabase Dashboard → SQL Editor",
        "2. Create a new query", 
        "3. Copy and paste the SQL above",
        "4. Run the query to fix RLS policies",
        "5. Test upload functionality again"
      ],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[fix-rls] Critical error:', error)
    return NextResponse.json({
      error: 'RLS fix failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}