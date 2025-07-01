// 🚨 ULTRA DATABASE HEALTH CHECK
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://ziyereoasqiqhjvedgit.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppeWVyZW9hc3FpcWhqdmVkZ2l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU5MTc4NSwiZXhwIjoyMDY2MTY3Nzg1fQ.7vzfrq6nTyOxJrGJclXjuWYucIUaCMiN5zhsldxNr6U' // service role key
)

async function checkDatabaseHealth() {
  console.log('🚨 [DATABASE HEALTH] Starting comprehensive check...')
  console.log('Timestamp:', new Date().toISOString())
  
  try {
    // 1. Check if user_credits table exists
    console.log('\n📋 [CHECK 1] user_credits table structure:')
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_credits')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ user_credits table error:', tableError)
    } else {
      console.log('✅ user_credits table exists, sample structure:', tableInfo)
    }
    
    // 2. Check RLS policies
    console.log('\n🔒 [CHECK 2] RLS policies on user_credits:')
    let policies, policyError
    try {
      const result = await supabase.rpc('get_table_policies', { table_name: 'user_credits' })
      policies = result.data
      policyError = result.error
    } catch (err) {
      console.log('⚠️ get_table_policies function not available, checking manually...')
      policies = null
      policyError = { message: 'Function not found' }
    }
    
    if (policyError) {
      console.log('⚠️ Could not check RLS policies:', policyError.message)
    } else {
      console.log('✅ RLS policies found:', policies)
    }
    
    // 3. Test user creation simulation
    console.log('\n👤 [CHECK 3] Test user creation (simulation):')
    const testUserId = 'test-user-' + Date.now()
    
    try {
      const { data: insertResult, error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: testUserId,
          credits_left: 20,
          credits_used: 0,
          tier: 'free'
        })
        .select()
      
      if (insertError) {
        console.error('❌ Test insert failed:', insertError)
      } else {
        console.log('✅ Test insert successful:', insertResult)
        
        // Clean up test data
        await supabase
          .from('user_credits')
          .delete()
          .eq('user_id', testUserId)
        console.log('🧹 Test data cleaned up')
      }
    } catch (insertErr) {
      console.error('❌ Insert test exception:', insertErr)
    }
    
    // 4. Check auth.users table access
    console.log('\n🔐 [CHECK 4] Auth users table access:')
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        console.error('❌ Cannot access auth.users:', authError)
      } else {
        console.log('✅ Auth users accessible, count:', authUsers.users?.length || 0)
        console.log('Recent users:', authUsers.users?.slice(0, 3).map(u => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at
        })))
      }
    } catch (authErr) {
      console.error('❌ Auth access exception:', authErr)
    }
    
    // 5. Test auth trigger function
    console.log('\n⚡ [CHECK 5] Auth trigger function test:')
    try {
      let triggerResult, triggerError
      try {
        const result = await supabase.rpc('handle_new_user')
        triggerResult = result.data
        triggerError = result.error
      } catch (err) {
        triggerResult = null
        triggerError = { message: 'Function not found' }
      }
      
      if (triggerError) {
        console.log('⚠️ Auth trigger function not found or accessible:', triggerError.message)
      } else {
        console.log('✅ Auth trigger function exists:', triggerResult)
      }
    } catch (triggerErr) {
      console.error('❌ Trigger function test exception:', triggerErr)
    }
    
    console.log('\n🎯 [DATABASE HEALTH] Check completed!')
    
  } catch (error) {
    console.error('💥 [DATABASE HEALTH] Fatal error:', error)
  }
}

checkDatabaseHealth()