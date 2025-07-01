#!/usr/bin/env node

// Check all systems for OAuth issues
// Usage: node check-all-systems.js

const https = require('https');

const DEPLOYMENT_URL = 'https://prismy-production-8x7j4enfd-nclamvn-gmailcoms-projects.vercel.app';
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

async function checkAllSystems() {
  console.log('🔧 CHECKING ALL SYSTEMS FOR OAUTH ISSUES');
  console.log('=========================================\n');

  let issues = [];
  let successes = [];

  // Test 1: Check deployment accessibility
  console.log('📊 TEST 1: Deployment Accessibility');
  console.log('─'.repeat(40));
  try {
    const loginTest = await makeRequest(`${DEPLOYMENT_URL}/login`);
    if (loginTest.ok) {
      console.log('✅ Login page accessible');
      successes.push('Login page accessible');
    } else {
      console.log('❌ Login page not accessible:', loginTest.statusCode);
      issues.push(`Login page returns ${loginTest.statusCode}`);
    }
  } catch (error) {
    console.log('❌ Deployment not accessible:', error.message);
    issues.push('Deployment not accessible');
  }

  // Test 2: Check auth debug endpoint
  console.log('\n📊 TEST 2: Auth Debug Endpoint');
  console.log('─'.repeat(40));
  try {
    const debugTest = await makeRequest(`${DEPLOYMENT_URL}/api/auth/debug`);
    if (debugTest.ok) {
      console.log('✅ Auth debug endpoint accessible');
      successes.push('Auth debug endpoint works');
      
      try {
        const debugData = JSON.parse(debugTest.body);
        console.log('   Current auth state:', {
          hasSession: debugData.auth?.hasSession,
          hasUser: debugData.auth?.hasUser,
          cookieStatus: debugData.cookies
        });
      } catch (parseError) {
        console.log('   ⚠️  Could not parse debug response');
      }
    } else {
      console.log('❌ Auth debug endpoint issue:', debugTest.statusCode);
      issues.push('Auth debug endpoint not working');
    }
  } catch (error) {
    console.log('❌ Auth debug endpoint failed:', error.message);
    issues.push('Auth debug endpoint failed');
  }

  // Test 3: Check database table
  console.log('\n📊 TEST 3: Database user_credits Table');
  console.log('─'.repeat(40));
  try {
    const tableTest = await makeRequest(`${SUPABASE_URL}/rest/v1/user_credits?select=count&limit=1`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (tableTest.ok) {
      console.log('✅ user_credits table accessible');
      successes.push('Database table accessible');
    } else if (tableTest.statusCode === 401) {
      console.log('❌ RLS policy blocking access to user_credits table');
      issues.push('RLS policy blocks user_credits access');
    } else {
      console.log('❌ user_credits table issue:', tableTest.statusCode);
      issues.push('Database table not accessible');
    }
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
    issues.push('Database connection failed');
  }

  // Test 4: Check auth callback endpoint
  console.log('\n📊 TEST 4: Auth Callback Endpoint');
  console.log('─'.repeat(40));
  try {
    const callbackTest = await makeRequest(`${DEPLOYMENT_URL}/auth/callback?error=test_mode`);
    if (callbackTest.statusCode === 302 || callbackTest.statusCode === 307) {
      console.log('✅ Auth callback endpoint working');
      successes.push('Auth callback endpoint works');
      
      const location = callbackTest.headers.location;
      if (location && location.includes('/login?error=test_mode')) {
        console.log('   ✅ Error handling works correctly');
      }
    } else {
      console.log('❌ Auth callback endpoint issue:', callbackTest.statusCode);
      issues.push('Auth callback endpoint not working');
    }
  } catch (error) {
    console.log('❌ Auth callback test failed:', error.message);
    issues.push('Auth callback endpoint failed');
  }

  // Test 5: Check Supabase auth endpoint
  console.log('\n📊 TEST 5: Supabase Auth Endpoint');
  console.log('─'.repeat(40));
  try {
    const authTest = await makeRequest(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    
    if (authTest.ok) {
      console.log('✅ Supabase auth endpoint accessible');
      successes.push('Supabase auth works');
      
      try {
        const authSettings = JSON.parse(authTest.body);
        console.log('   External providers enabled:', authSettings.external?.google ? 'YES' : 'NO');
        console.log('   Site URL configured:', authSettings.site_url ? 'YES' : 'NO');
      } catch (parseError) {
        console.log('   ⚠️  Could not parse auth settings');
      }
    } else {
      console.log('❌ Supabase auth endpoint issue:', authTest.statusCode);
      issues.push('Supabase auth not accessible');
    }
  } catch (error) {
    console.log('❌ Supabase auth test failed:', error.message);
    issues.push('Supabase auth failed');
  }

  // Summary
  console.log('\n🎯 SYSTEM CHECK SUMMARY');
  console.log('======================');
  
  console.log('\n✅ WORKING COMPONENTS:');
  successes.forEach(success => console.log(`   • ${success}`));
  
  console.log('\n❌ ISSUES FOUND:');
  if (issues.length === 0) {
    console.log('   🎉 No major issues found!');
  } else {
    issues.forEach(issue => console.log(`   • ${issue}`));
  }

  console.log('\n📋 RECOMMENDED ACTIONS:');
  console.log('─'.repeat(30));
  
  if (issues.includes('RLS policy blocks user_credits access')) {
    console.log('🔧 CRITICAL: Apply database migration for RLS policies');
    console.log('   Run this SQL in Supabase SQL Editor:');
    console.log('   ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;');
    console.log('   CREATE POLICY "Users can manage own credits" ON user_credits');
    console.log('   FOR ALL USING (auth.uid() = user_id);');
  }
  
  if (issues.includes('Auth callback endpoint not working')) {
    console.log('🔧 CRITICAL: Fix auth callback route implementation');
  }
  
  if (issues.includes('Supabase auth not accessible')) {
    console.log('🔧 CRITICAL: Check Supabase project status and keys');
  }
  
  if (issues.length === 0) {
    console.log('🧪 Since all systems check out, the issue is likely:');
    console.log('   1. Google Console OAuth configuration mismatch');
    console.log('   2. Browser cache/cookies interference');
    console.log('   3. Specific OAuth flow timing issue');
    console.log('');
    console.log('   Try OAuth in INCOGNITO mode with fresh session');
  }
  
  console.log('\n📞 NEXT STEP:');
  console.log('If systems check out, test OAuth flow and report exact error message!');
}

checkAllSystems().catch(console.error);