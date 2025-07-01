import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('[apply-migration] Starting database migration')
    
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

    console.log('[apply-migration] Created Supabase client')

    // First, let's create a simple SQL execution function
    const createSQLFunction = `
      CREATE OR REPLACE FUNCTION execute_migration_sql(sql_text text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_text;
        RETURN 'SUCCESS';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR: ' || SQLERRM;
      END;
      $$;
    `
    
    console.log('[apply-migration] Creating SQL execution function...')
    try {
      await supabase.rpc('exec', { sql: createSQLFunction })
    } catch (funcError) {
      console.log('[apply-migration] Function creation failed, trying alternative approach')
    }

    // Migration SQL (essential parts only)
    const migrationSteps = [
      // Step 1: Enable UUID extension
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
      
      // Step 2: Create user_credits table
      `CREATE TABLE IF NOT EXISTS user_credits (
        id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        session_id     text,
        credits_left   int DEFAULT 20,
        credits_used   int DEFAULT 0,
        tier           text DEFAULT 'free',
        created_at     timestamptz DEFAULT now(),
        updated_at     timestamptz DEFAULT now()
      )`,
      
      // Step 3: Create translation_jobs table
      `CREATE TABLE IF NOT EXISTS translation_jobs (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id    text,
        user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        filename      text NOT NULL,
        original_name text NOT NULL,
        file_size     bigint NOT NULL,
        mime_type     text NOT NULL,
        storage_path  text NOT NULL,
        pages         int DEFAULT 0,
        status        text DEFAULT 'queued',
        progress      int DEFAULT 0,
        output_path   text,
        error_message text,
        credits_cost  int DEFAULT 0,
        translation_service text DEFAULT 'google',
        source_lang   text DEFAULT 'auto',
        target_lang   text DEFAULT 'en',
        created_at    timestamptz DEFAULT now(),
        updated_at    timestamptz DEFAULT now(),
        completed_at  timestamptz
      )`,
      
      // Step 4: Create chat_messages table
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id      uuid REFERENCES translation_jobs(id) ON DELETE CASCADE,
        role        text NOT NULL,
        content     text NOT NULL,
        tokens      int DEFAULT 0,
        credits_cost int DEFAULT 0,
        created_at  timestamptz DEFAULT now()
      )`
    ]

    const results = []
    
    for (let i = 0; i < migrationSteps.length; i++) {
      const sql = migrationSteps[i]
      console.log(`[apply-migration] Executing step ${i + 1}/${migrationSteps.length}`)
      
      try {
        // Try different ways to execute SQL
        let result = null
        let error = null
        
        try {
          result = await supabase.rpc('execute_migration_sql', { sql_text: sql })
          error = result.data?.includes('ERROR:') ? result.data : null
        } catch (rpcError) {
          // If RPC fails, try direct approach (this won't work but gives us info)
          console.log('[apply-migration] RPC failed, trying fallback approach')
          error = 'RPC function not available'
        }
        
        results.push({
          step: i + 1,
          success: !error,
          error: error,
          sql: sql.substring(0, 100) + '...'
        })
        
        if (error) {
          console.error(`[apply-migration] Step ${i + 1} failed:`, error)
        } else {
          console.log(`[apply-migration] Step ${i + 1} completed successfully`)
        }
        
      } catch (stepError) {
        console.error(`[apply-migration] Step ${i + 1} exception:`, stepError)
        results.push({
          step: i + 1,
          success: false,
          error: stepError instanceof Error ? stepError.message : 'Unknown error',
          sql: sql.substring(0, 100) + '...'
        })
      }
    }
    
    // Verify tables were created
    console.log('[apply-migration] Verifying table creation...')
    const verificationResults = {}
    
    for (const tableName of ['user_credits', 'translation_jobs', 'chat_messages']) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count', { count: 'exact', head: true })
        
        verificationResults[tableName] = {
          exists: !error,
          error: error?.message || null
        }
      } catch (verifyError) {
        verificationResults[tableName] = {
          exists: false,
          error: verifyError instanceof Error ? verifyError.message : 'Unknown error'
        }
      }
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      migration: {
        steps_executed: results.length,
        results: results
      },
      verification: verificationResults,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[apply-migration] Critical error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}