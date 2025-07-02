require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testPKCE() {
  console.log('🔍 Testing Supabase PKCE Implementation')
  console.log('='.repeat(50))
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  // Test what happens when we initiate OAuth
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://prismy.in/auth/callback',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  })
  
  if (error) {
    console.error('❌ OAuth initiation failed:', error)
  } else {
    console.log('✅ OAuth URL generated')
    console.log('📍 Redirect URL:', data.url)
    
    // Extract the URL components
    const url = new URL(data.url)
    console.log('\n🔑 OAuth Parameters:')
    console.log(`  Provider: ${data.provider}`)
    url.searchParams.forEach((value, key) => {
      console.log(`  ${key}: ${value.substring(0, 50)}...`)
    })
  }
  
  console.log('\n💡 Cookie Pattern Expected:')
  console.log('  sb-<project-ref>-auth-token')
  console.log('  sb-<project-ref>-auth-token-code-verifier')
  console.log('\n  Your project ref: prismy')
  console.log('  Expected pattern: sb-prismy-auth-*')
}

testPKCE().catch(console.error)