#!/usr/bin/env node

// Quick auth flow debugging script
// Usage: node debug-auth-flow.js

const DEPLOYMENT_URL = 'https://prismy-production-9h84ja8m8-nclamvn-gmailcoms-projects.vercel.app';

async function testAuthDebug() {
  console.log('🔍 Testing auth debug endpoint...\n');
  
  try {
    const response = await fetch(`${DEPLOYMENT_URL}/api/auth/debug`);
    const data = await response.json();
    
    console.log('📊 Auth Debug Results:');
    console.log('===================');
    console.log(`✅ Success: ${data.success}`);
    console.log(`📅 Timestamp: ${data.timestamp}`);
    
    if (data.auth) {
      console.log('\n🔐 Authentication:');
      console.log(`   Has Session: ${data.auth.hasSession}`);
      console.log(`   Has User: ${data.auth.hasUser}`);
      console.log(`   User ID: ${data.auth.userId || 'None'}`);
      console.log(`   User Email: ${data.auth.userEmail || 'None'}`);
      console.log(`   Provider: ${data.auth.provider || 'None'}`);
      
      if (data.auth.sessionError) {
        console.log(`   ❌ Session Error: ${data.auth.sessionError}`);
      }
      if (data.auth.userError) {
        console.log(`   ❌ User Error: ${data.auth.userError}`);
      }
    }
    
    if (data.cookies) {
      console.log('\n🍪 Cookies:');
      console.log(`   Has Access Token: ${data.cookies.hasAccessToken}`);
      console.log(`   Has Refresh Token: ${data.cookies.hasRefreshToken}`);
    }
    
    if (data.credits) {
      console.log('\n💰 Credits:');
      console.log(`   Credits Exist: ${data.credits.exists}`);
      if (data.credits.data) {
        console.log(`   Credits Left: ${data.credits.data.credits_left}`);
        console.log(`   Credits Used: ${data.credits.data.credits_used}`);
        console.log(`   Tier: ${data.credits.data.tier}`);
      }
    }
    
    if (data.environment) {
      console.log('\n🌍 Environment:');
      console.log(`   Supabase URL: ${data.environment.supabaseUrl}`);
      console.log(`   Has Anon Key: ${data.environment.hasAnonKey}`);
      console.log(`   Has Service Key: ${data.environment.hasServiceKey}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to test auth debug:', error.message);
  }
}

async function testHealthCheck() {
  console.log('\n🏥 Testing health endpoint...\n');
  
  try {
    const response = await fetch(`${DEPLOYMENT_URL}/api/health`);
    const data = await response.json();
    
    console.log('📊 Health Check Results:');
    console.log('=====================');
    console.log(`✅ Status: ${data.status}`);
    console.log(`📅 Timestamp: ${data.timestamp}`);
    console.log(`🆔 Request ID: ${data.requestId}`);
    
  } catch (error) {
    console.error('❌ Failed to test health check:', error.message);
  }
}

async function main() {
  console.log('🚀 Prismy Auth Flow Debug Tool');
  console.log('==============================');
  console.log(`🌐 Testing: ${DEPLOYMENT_URL}\n`);
  
  await testHealthCheck();
  await testAuthDebug();
  
  console.log('\n📋 Next Steps:');
  console.log('=============');
  console.log(`1. Try logging in with Google at: ${DEPLOYMENT_URL}/login`);
  console.log('2. Check browser console for errors');
  console.log('3. Run: vercel logs --follow');
  console.log('4. Check Supabase Dashboard for OAuth configuration');
  console.log('5. Apply database migration if needed');
  
  console.log('\n🔗 Quick Links:');
  console.log(`   Login: ${DEPLOYMENT_URL}/login`);
  console.log(`   Debug: ${DEPLOYMENT_URL}/api/auth/debug`);
  console.log(`   Health: ${DEPLOYMENT_URL}/api/health`);
}

main().catch(console.error);