#!/usr/bin/env node

// Deep dive debugging script for OAuth flow
// Usage: node deep-dive-debug.js

const https = require('https');
const fs = require('fs');

const DEPLOYMENT_URL = 'https://prismy-production-9h84ja8m8-nclamvn-gmailcoms-projects.vercel.app';
const SUPABASE_URL = 'https://ziyereoasqiqhjvedgit.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppeWVyZW9hc3FpcWhqdmVkZ2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTE3ODUsImV4cCI6MjA2NjE2Nzc4NX0.fnoWBmvKf8L7dFe3sHHOQKvoGINwHmWdMvgpeli8vuk';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          ok: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function deepDiveDebug() {
  console.log('🔍 DEEP DIVE: OAuth Authentication Debugging');
  console.log('============================================\n');

  // Step 1: Check if Vercel protection is still active
  console.log('📋 STEP 1: Checking Vercel Protection Status');
  console.log('─'.repeat(50));
  
  try {
    const healthCheck = await makeRequest(`${DEPLOYMENT_URL}/api/health`);
    console.log('Health endpoint status:', healthCheck.statusCode);
    
    if (healthCheck.statusCode === 401) {
      console.log('❌ CRITICAL ISSUE: Vercel protection is STILL ACTIVE!');
      console.log('🔧 REQUIRED ACTION: Remove Vercel project protection');
      console.log('   1. Go to https://vercel.com/dashboard');
      console.log('   2. Find project: prismy-production');
      console.log('   3. Settings → Functions → Remove protection');
      console.log('   4. Redeploy the project\n');
      return;
    } else if (healthCheck.ok) {
      console.log('✅ Vercel protection removed - endpoints accessible\n');
    } else {
      console.log('⚠️  Unexpected status code:', healthCheck.statusCode);
      console.log('Response body:', healthCheck.body.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Failed to check health endpoint:', error.message);
  }

  // Step 2: Check database migration
  console.log('📋 STEP 2: Verifying Database Migration');
  console.log('─'.repeat(50));
  
  try {
    const dbCheck = await makeRequest(`${SUPABASE_URL}/rest/v1/rpc/handle_new_user`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    if (dbCheck.statusCode === 404) {
      console.log('❌ Migration NOT applied - handle_new_user function missing');
      console.log('🔧 REQUIRED ACTION: Apply database migration manually');
    } else {
      console.log('✅ Database migration appears to be applied');
    }
  } catch (error) {
    console.log('⚠️  Could not verify migration:', error.message);
  }

  // Step 3: Check user_credits table structure
  console.log('\n📋 STEP 3: Checking user_credits Table');
  console.log('─'.repeat(50));
  
  try {
    const tableCheck = await makeRequest(`${SUPABASE_URL}/rest/v1/user_credits?select=*&limit=1`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    
    if (tableCheck.ok) {
      console.log('✅ user_credits table accessible');
    } else if (tableCheck.statusCode === 401) {
      console.log('❌ CRITICAL: Row Level Security blocking access to user_credits');
      console.log('🔧 REQUIRED ACTION: Check RLS policies');
    } else {
      console.log('⚠️  user_credits table issue:', tableCheck.statusCode);
    }
  } catch (error) {
    console.log('❌ Failed to check user_credits table:', error.message);
  }

  // Step 4: Test OAuth callback endpoint
  console.log('\n📋 STEP 4: Testing OAuth Callback Endpoint');
  console.log('─'.repeat(50));
  
  try {
    const callbackTest = await makeRequest(`${DEPLOYMENT_URL}/auth/callback?error=test_debug`);
    console.log('Callback endpoint status:', callbackTest.statusCode);
    
    if (callbackTest.statusCode === 302 || callbackTest.statusCode === 307) {
      console.log('✅ Callback endpoint working - redirects properly');
      const location = callbackTest.headers.location;
      if (location) {
        console.log('   Redirect location:', location);
      }
    } else {
      console.log('⚠️  Callback endpoint unexpected response:', callbackTest.statusCode);
    }
  } catch (error) {
    console.log('❌ Failed to test callback endpoint:', error.message);
  }

  // Step 5: Check Google OAuth configuration
  console.log('\n📋 STEP 5: Google OAuth Configuration Check');
  console.log('─'.repeat(50));
  console.log('🔧 MANUAL VERIFICATION REQUIRED:');
  console.log('');
  console.log('1. Google Cloud Console (https://console.cloud.google.com):');
  console.log('   - Project: prismy-translate-project (or your OAuth project)');
  console.log('   - APIs & Services → Credentials');
  console.log('   - Find your OAuth 2.0 Client ID');
  console.log('   - Authorized JavaScript origins:');
  console.log('     ✓ https://prismy-production-9h84ja8m8-nclamvn-gmailcoms-projects.vercel.app');
  console.log('     ✓ https://ziyereoasqiqhjvedgit.supabase.co');
  console.log('   - Authorized redirect URIs:');
  console.log('     ✓ https://ziyereoasqiqhjvedgit.supabase.co/auth/v1/callback');
  console.log('');
  console.log('2. Supabase Dashboard (https://supabase.com/dashboard):');
  console.log('   - Project: ziyereoasqiqhjvedgit');
  console.log('   - Authentication → URL Configuration:');
  console.log('     ✓ Site URL: https://prismy-production-9h84ja8m8-nclamvn-gmailcoms-projects.vercel.app');
  console.log('     ✓ Redirect URLs: https://prismy-production-9h84ja8m8-nclamvn-gmailcoms-projects.vercel.app/auth/callback');
  console.log('   - Authentication → Providers → Google:');
  console.log('     ✓ Enabled: true');
  console.log('     ✓ Client ID: [from Google Console]');
  console.log('     ✓ Client Secret: [from Google Console]');

  // Step 6: Check middleware configuration
  console.log('\n📋 STEP 6: Testing Login Page Access');
  console.log('─'.repeat(50));
  
  try {
    const loginTest = await makeRequest(`${DEPLOYMENT_URL}/login`);
    console.log('Login page status:', loginTest.statusCode);
    
    if (loginTest.ok) {
      console.log('✅ Login page accessible');
    } else {
      console.log('❌ Login page issue:', loginTest.statusCode);
    }
  } catch (error) {
    console.log('❌ Failed to test login page:', error.message);
  }

  console.log('\n🎯 DEBUGGING SUMMARY');
  console.log('===================');
  console.log('');
  console.log('🔴 CRITICAL ISSUES TO CHECK:');
  console.log('1. Vercel project protection must be COMPLETELY removed');
  console.log('2. Database migration must be applied successfully');
  console.log('3. Google OAuth URLs must match EXACTLY in both Google Console and Supabase');
  console.log('4. RLS policies must allow user creation and credit access');
  console.log('');
  console.log('📝 NEXT DEBUGGING STEPS:');
  console.log('1. Try login manually: ' + DEPLOYMENT_URL + '/login');
  console.log('2. Open browser DevTools → Console');
  console.log('3. Click "Continue with Google"');
  console.log('4. Check for any console errors');
  console.log('5. Check Network tab for failed requests');
  console.log('6. If redirected to login again = OAuth flow broken');
  console.log('');
  console.log('📞 NEED HELP? Run: vercel logs --follow');
  console.log('   Then try login and watch real-time logs');
}

deepDiveDebug().catch(console.error);