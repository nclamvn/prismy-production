#!/usr/bin/env node

// 🔍 COMPREHENSIVE OAUTH CONFIGURATION AUDIT
// This script audits all OAuth-related configurations to identify discrepancies

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

console.log('🔍 OAUTH CONFIGURATION AUDIT')
console.log('='.repeat(50))
console.log(`Timestamp: ${new Date().toISOString()}`)
console.log()

// Environment Variables Audit
console.log('📋 ENVIRONMENT VARIABLES:')
console.log('-'.repeat(30))
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`)
console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
console.log()

// Supabase Configuration Audit
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

console.log('🔧 SUPABASE CLIENT CONFIGURATION:')
console.log('-'.repeat(30))
console.log(`URL Domain: ${new URL(supabaseUrl).hostname}`)
console.log(`Project ID: ${supabaseUrl.match(/https:\/\/([^.]+)/)?.[1]}`)
console.log(`Key Type: ${supabaseKey.startsWith('eyJ') ? 'JWT' : 'Unknown'}`)
console.log()

// Test Supabase Connection
console.log('🔗 SUPABASE CONNECTION TEST:')
console.log('-'.repeat(30))

const supabase = createClient(supabaseUrl, supabaseKey)

async function auditSupabaseConfig() {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('user_credits').select('count').limit(1)
    if (error) {
      console.log(`❌ Database connection failed: ${error.message}`)
    } else {
      console.log('✅ Database connection successful')
    }

    // Test auth configuration
    console.log()
    console.log('🔐 AUTH CONFIGURATION AUDIT:')
    console.log('-'.repeat(30))
    
    // Get auth settings (this might not work with anon key, but worth trying)
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession()
      console.log(`Current session: ${authData.session ? 'Active' : 'None'}`)
    } catch (authErr) {
      console.log(`Auth session check: ${authErr.message}`)
    }

    // Test OAuth provider endpoint
    console.log()
    console.log('🌐 OAUTH PROVIDER ENDPOINTS:')
    console.log('-'.repeat(30))
    
    const googleAuthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google`
    console.log(`Google OAuth URL: ${googleAuthUrl}`)
    
    // Test the endpoint
    try {
      const response = await fetch(googleAuthUrl, { method: 'HEAD' })
      console.log(`Google OAuth endpoint status: ${response.status}`)
      console.log(`Response headers:`)
      response.headers.forEach((value, name) => {
        if (name.toLowerCase().includes('auth') || name.toLowerCase().includes('cors')) {
          console.log(`  ${name}: ${value}`)
        }
      })
    } catch (fetchError) {
      console.log(`❌ OAuth endpoint test failed: ${fetchError.message}`)
    }

  } catch (error) {
    console.error('❌ Audit failed:', error.message)
  }
}

async function auditProjectUrls() {
  console.log()
  console.log('🔗 EXPECTED VS ACTUAL URLS:')
  console.log('-'.repeat(30))
  
  const currentDeploy = 'https://prismy-production-1rrddzrb5-nclamvn-gmailcoms-projects.vercel.app'
  const customDomain = 'https://prismy.in'
  
  console.log(`Current deployment: ${currentDeploy}`)
  console.log(`Custom domain: ${customDomain}`)
  console.log(`Supabase callback: ${supabaseUrl}/auth/v1/callback`)
  console.log()
  console.log(`Expected callback URLs:`)
  console.log(`  ${currentDeploy}/auth/callback`)
  console.log(`  ${customDomain}/auth/callback`)
  console.log()
  
  // Test callback URL accessibility
  for (const baseUrl of [currentDeploy, customDomain]) {
    try {
      const callbackUrl = `${baseUrl}/auth/callback`
      const response = await fetch(callbackUrl, { method: 'HEAD' })
      console.log(`✅ ${callbackUrl} - Status: ${response.status}`)
    } catch (error) {
      console.log(`❌ ${baseUrl}/auth/callback - Error: ${error.message}`)
    }
  }
}

async function auditBrowserCompatibility() {
  console.log()
  console.log('🌐 BROWSER COMPATIBILITY FACTORS:')
  console.log('-'.repeat(30))
  
  // Check for potential CORS/Cookie issues
  const supabaseDomain = new URL(supabaseUrl).hostname
  const isLocalhost = supabaseDomain.includes('localhost')
  const isHttps = supabaseUrl.startsWith('https')
  
  console.log(`Supabase domain: ${supabaseDomain}`)
  console.log(`Is HTTPS: ${isHttps}`)
  console.log(`Is localhost: ${isLocalhost}`)
  console.log()
  
  console.log('Potential cookie issues:')
  console.log(`  Cross-origin: ${!isLocalhost ? 'Yes (requires SameSite=None)' : 'No'}`)
  console.log(`  Secure required: ${isHttps ? 'Yes' : 'No'}`)
  console.log(`  Third-party cookies: May be blocked by browser`)
}

async function runFullAudit() {
  await auditSupabaseConfig()
  await auditProjectUrls()
  await auditBrowserCompatibility()
  
  console.log()
  console.log('📊 AUDIT COMPLETE')
  console.log('='.repeat(50))
  console.log('Next steps:')
  console.log('1. Verify Google OAuth Console settings match callback URLs')
  console.log('2. Check Supabase dashboard OAuth provider configuration')
  console.log('3. Test minimal OAuth implementation')
}

runFullAudit().catch(console.error)