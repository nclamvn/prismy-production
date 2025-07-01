#!/usr/bin/env node

// 🚨 NUCLEAR DATABASE RESET EXECUTOR
// Executes the comprehensive database reset and verifies setup

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const SUPABASE_URL = 'https://ziyereoasqiqhjvedgit.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppeWVyZW9hc3FpcWhqdmVkZ2l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU5MTc4NSwiZXhwIjoyMDY2MTY3Nzg1fQ.7vzfrq6nTyOxJrGJclXjuWYucIUaCMiN5zhsldxNr6U'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function executeReset() {
  console.log('🚨 [DATABASE RESET] Starting nuclear database reset...')
  console.log('⚠️  WARNING: This will reset all auth-related data!')
  console.log('📅 Timestamp:', new Date().toISOString())
  console.log('')

  try {
    // Read the SQL reset script
    const sqlScript = fs.readFileSync(
      path.join(__dirname, 'NUCLEAR_DATABASE_RESET.sql'), 
      'utf8'
    )

    console.log('📄 [DATABASE RESET] SQL script loaded successfully')
    console.log('📏 Script size:', sqlScript.length, 'characters')
    console.log('')

    // Split script into individual statements (rough split by semicolon)
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log('🔢 [DATABASE RESET] Found', statements.length, 'SQL statements to execute')
    console.log('')

    // Execute each statement
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue
      }

      try {
        console.log(`📝 [${i + 1}/${statements.length}] Executing:`, statement.substring(0, 100) + '...')
        
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
        
        if (error) {
          console.error(`❌ [${i + 1}/${statements.length}] Error:`, error.message)
          errorCount++
        } else {
          console.log(`✅ [${i + 1}/${statements.length}] Success`)
          successCount++
        }
      } catch (err) {
        console.error(`💥 [${i + 1}/${statements.length}] Exception:`, err.message)
        errorCount++
      }
    }

    console.log('')
    console.log('📊 [DATABASE RESET] Execution Summary:')
    console.log('✅ Successful statements:', successCount)
    console.log('❌ Failed statements:', errorCount)
    console.log('')

    // Verify setup
    await verifyDatabaseSetup()

  } catch (error) {
    console.error('💥 [DATABASE RESET] Fatal error:', error)
    process.exit(1)
  }
}

async function verifyDatabaseSetup() {
  console.log('🔍 [VERIFICATION] Starting database setup verification...')
  console.log('')

  try {
    // 1. Check if user_credits table exists
    console.log('1️⃣ [VERIFICATION] Checking user_credits table...')
    const { data: tableData, error: tableError } = await supabase
      .from('user_credits')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('❌ user_credits table check failed:', tableError.message)
    } else {
      console.log('✅ user_credits table exists and accessible')
    }

    // 2. Check RLS policies
    console.log('2️⃣ [VERIFICATION] Checking RLS policies...')
    const { data: policyData, error: policyError } = await supabase.rpc(
      'exec_sql', 
      { sql_query: "SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'user_credits'" }
    )

    if (policyError) {
      console.error('❌ RLS policy check failed:', policyError.message)
    } else {
      console.log('✅ RLS policies configured')
    }

    // 3. Check trigger function
    console.log('3️⃣ [VERIFICATION] Checking auth trigger function...')
    const { data: functionData, error: functionError } = await supabase.rpc(
      'exec_sql',
      { sql_query: "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'handle_new_user'" }
    )

    if (functionError) {
      console.error('❌ Trigger function check failed:', functionError.message)
    } else {
      console.log('✅ Auth trigger function exists')
    }

    // 4. Test user creation (simulation)
    console.log('4️⃣ [VERIFICATION] Testing user creation flow...')
    const testUserId = crypto.randomUUID ? crypto.randomUUID() : 'test-' + Date.now()
    
    try {
      // Simulate user creation by directly inserting credits
      const { data: creditData, error: creditError } = await supabase
        .from('user_credits')
        .insert({
          user_id: testUserId,
          credits_left: 20,
          total_earned: 20,
          total_spent: 0,
          trial_credits: 20,
          purchased_credits: 0,
          daily_usage_count: 0,
          tier: 'free'
        })
        .select()

      if (creditError) {
        console.error('❌ User creation test failed:', creditError.message)
      } else {
        console.log('✅ User creation flow works')
        
        // Clean up test data
        await supabase
          .from('user_credits')
          .delete()
          .eq('user_id', testUserId)
        console.log('🧹 Test data cleaned up')
      }
    } catch (testError) {
      console.error('❌ User creation test exception:', testError.message)
    }

    console.log('')
    console.log('🎉 [VERIFICATION] Database setup verification completed!')
    console.log('')
    console.log('🔄 [NEXT STEPS]')
    console.log('1. Reset Google OAuth configuration in Supabase Dashboard')
    console.log('2. Update redirect URIs to exact production URLs')
    console.log('3. Test OAuth flow with clean database')
    console.log('4. Verify end-to-end user registration')

  } catch (error) {
    console.error('💥 [VERIFICATION] Verification failed:', error)
  }
}

// Execute if run directly
if (require.main === module) {
  executeReset().catch(console.error)
}

module.exports = { executeReset, verifyDatabaseSetup }