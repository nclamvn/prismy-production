#!/usr/bin/env node

// Real-time OAuth debugging with detailed analysis
// Usage: node debug-oauth-real-time.js

const https = require('https');

const DEPLOYMENT_URL = 'https://prismy-production-9h84ja8m8-nclamvn-gmailcoms-projects.vercel.app';

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
    req.end();
  });
}

async function debugOAuthRealTime() {
  console.log('🔍 REAL-TIME OAUTH DEBUGGING');
  console.log('============================\n');

  // Test 1: Check auth debug endpoint
  console.log('📋 STEP 1: Testing Auth Debug Endpoint');
  console.log('─'.repeat(50));
  
  try {
    const authDebug = await makeRequest(`${DEPLOYMENT_URL}/api/auth/debug`);
    console.log('Auth debug status:', authDebug.statusCode);
    
    if (authDebug.ok) {
      const debugData = JSON.parse(authDebug.body);
      console.log('✅ Auth debug accessible');
      console.log('Auth state:', {
        hasSession: debugData.auth?.hasSession,
        hasUser: debugData.auth?.hasUser,
        userId: debugData.auth?.userId,
        userEmail: debugData.auth?.userEmail
      });
      
      if (debugData.auth?.hasUser) {
        console.log('🚨 FOUND ISSUE: User exists but still redirecting to login!');
        console.log('This suggests middleware or AuthLayout logic issue');
      }
    } else {
      console.log('❌ Auth debug not accessible:', authDebug.statusCode);
    }
  } catch (error) {
    console.log('❌ Auth debug failed:', error.message);
  }

  // Test 2: Simulate auth callback with test parameters
  console.log('\n📋 STEP 2: Testing Auth Callback Flow');
  console.log('─'.repeat(50));
  
  try {
    const callbackTest = await makeRequest(`${DEPLOYMENT_URL}/auth/callback?code=test_code_123&next=/app`);
    console.log('Callback test status:', callbackTest.statusCode);
    
    if (callbackTest.statusCode === 302 || callbackTest.statusCode === 307) {
      const location = callbackTest.headers.location;
      console.log('Redirect location:', location);
      
      if (location && location.includes('/login')) {
        console.log('🚨 CRITICAL ISSUE: Callback redirects back to login!');
        console.log('This means OAuth code exchange is failing');
      } else if (location && location.includes('/app')) {
        console.log('✅ Callback would redirect to app (good)');
      }
    }
  } catch (error) {
    console.log('❌ Callback test failed:', error.message);
  }

  // Test 3: Check app page accessibility
  console.log('\n📋 STEP 3: Testing App Page Protection');
  console.log('─'.repeat(50));
  
  try {
    const appTest = await makeRequest(`${DEPLOYMENT_URL}/app`);
    console.log('App page status:', appTest.statusCode);
    
    if (appTest.statusCode === 302 || appTest.statusCode === 307) {
      const location = appTest.headers.location;
      console.log('App page redirects to:', location);
      
      if (location && location.includes('/login')) {
        console.log('✅ App page properly protected (redirects to login)');
      }
    } else if (appTest.ok) {
      console.log('⚠️  App page accessible without auth (check middleware)');
    }
  } catch (error) {
    console.log('❌ App page test failed:', error.message);
  }

  console.log('\n🔍 DETAILED DEBUGGING INSTRUCTIONS');
  console.log('==================================');
  
  console.log('\n🚨 IMMEDIATE ACTIONS:');
  console.log('1. Open browser Developer Tools (F12)');
  console.log('2. Go to Network tab');
  console.log('3. Clear network logs');
  console.log('4. Go to: ' + DEPLOYMENT_URL + '/login');
  console.log('5. Click "Continue with Google"');
  console.log('6. Complete OAuth flow');
  console.log('7. Watch Network tab for EVERY request');
  console.log('');
  
  console.log('📊 LOOK FOR THESE SPECIFIC REQUESTS:');
  console.log('─'.repeat(40));
  console.log('1. Initial Google OAuth redirect');
  console.log('   URL: accounts.google.com/oauth/...');
  console.log('   Status: Should be 302/307 redirect');
  console.log('');
  console.log('2. OAuth callback request');
  console.log('   URL: .../auth/callback?code=...');
  console.log('   Status: Should be 302/307 redirect');
  console.log('   Location header: Should point to /app');
  console.log('');
  console.log('3. Final destination');
  console.log('   URL: Should be /app page');
  console.log('   Status: Should be 200 OK');
  console.log('');
  
  console.log('🚨 COMMON FAILURE PATTERNS:');
  console.log('─'.repeat(40));
  console.log('Pattern 1: OAuth callback returns 302 → /login');
  console.log('  ↳ Cause: Code exchange failed (check logs)');
  console.log('  ↳ Fix: Check Supabase OAuth provider config');
  console.log('');
  console.log('Pattern 2: OAuth callback returns 500 error');
  console.log('  ↳ Cause: Database/RLS error during user creation');
  console.log('  ↳ Fix: Check migration and RLS policies');
  console.log('');
  console.log('Pattern 3: /app page immediately redirects to /login');
  console.log('  ↳ Cause: Middleware not recognizing session');
  console.log('  ↳ Fix: Check cookie setting in callback');
  console.log('');

  console.log('💡 ADVANCED DEBUGGING:');
  console.log('─'.repeat(40));
  console.log('Check browser Application tab → Cookies:');
  console.log('- Look for sb-access-token cookie');
  console.log('- Look for sb-refresh-token cookie');
  console.log('- Cookies should be set after OAuth');
  console.log('');
  console.log('Check Console tab for errors:');
  console.log('- Any Supabase client errors');
  console.log('- Network request failures');
  console.log('- JavaScript errors');

  console.log('\n📞 GET VERCEL LOGS:');
  console.log('vercel logs ' + DEPLOYMENT_URL.split('://')[1]);
  console.log('');
  console.log('Then try OAuth and watch for auth callback logs');
}

debugOAuthRealTime().catch(console.error);