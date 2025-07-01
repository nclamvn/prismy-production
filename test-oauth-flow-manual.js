#!/usr/bin/env node

// Manual OAuth flow testing script
// Usage: node test-oauth-flow-manual.js

const DEPLOYMENT_URL = 'https://prismy-production-9h84ja8m8-nclamvn-gmailcoms-projects.vercel.app';

function testOAuthFlow() {
  console.log('🧪 MANUAL OAUTH TESTING GUIDE');
  console.log('==============================\n');

  console.log('🔗 TESTING URLs:');
  console.log('─'.repeat(30));
  console.log(`📱 Login Page: ${DEPLOYMENT_URL}/login`);
  console.log(`🏠 App Page: ${DEPLOYMENT_URL}/app`);
  console.log(`🔧 Debug API: ${DEPLOYMENT_URL}/api/auth/debug`);
  console.log(`💚 Health Check: ${DEPLOYMENT_URL}/api/health`);
  console.log('');

  console.log('📋 STEP-BY-STEP TESTING:');
  console.log('─'.repeat(30));
  console.log('1. 🌐 Open browser and go to login page');
  console.log('2. 🔍 Open Developer Tools (F12)');
  console.log('3. 📺 Go to Console tab');
  console.log('4. 🔄 Clear console (Ctrl+L)');
  console.log('5. 🎯 Click "Continue with Google" button');
  console.log('6. 📝 Watch console for any errors');
  console.log('7. 🚀 Complete Google OAuth flow');
  console.log('8. 📊 Check what happens after OAuth');
  console.log('');

  console.log('🔍 THINGS TO WATCH FOR:');
  console.log('─'.repeat(30));
  console.log('✅ GOOD SIGNS:');
  console.log('  • Redirected to Google OAuth page');
  console.log('  • Can select Google account');
  console.log('  • Redirected back to your app');
  console.log('  • Lands on /app page with user info');
  console.log('');
  console.log('❌ BAD SIGNS:');
  console.log('  • Console errors (red text)');
  console.log('  • Redirected back to /login page');
  console.log('  • Stuck on loading screen');
  console.log('  • Network requests failing (red in Network tab)');
  console.log('');

  console.log('🚨 IF OAUTH FAILS:');
  console.log('─'.repeat(30));
  console.log('1. Check browser console for specific error messages');
  console.log('2. Go to Network tab, look for failed requests');
  console.log('3. Check these specific things:');
  console.log('   • /auth/callback request status');
  console.log('   • Any 401, 403, 500 errors');
  console.log('   • Cookie setting issues');
  console.log('');

  console.log('🔧 COMMON ISSUES & FIXES:');
  console.log('─'.repeat(30));
  console.log('Issue: "Access Denied" on Google');
  console.log('Fix: Check Google Console OAuth configuration');
  console.log('');
  console.log('Issue: Redirected back to login immediately');
  console.log('Fix: Check Supabase Authentication URL config');
  console.log('');
  console.log('Issue: Console error about "failed to create user"');
  console.log('Fix: Apply database migration (RLS/trigger issue)');
  console.log('');

  console.log('🎯 IMMEDIATE ACTION NEEDED:');
  console.log('─'.repeat(30));
  console.log('1. ✅ Apply database migration step-by-step');
  console.log('   (Use fix-migration-step-by-step.sql)');
  console.log('');
  console.log('2. ✅ Update Supabase Authentication URLs:');
  console.log('   Site URL: ' + DEPLOYMENT_URL);
  console.log('   Redirect: ' + DEPLOYMENT_URL + '/auth/callback');
  console.log('');
  console.log('3. ✅ Update Google Console OAuth URLs:');
  console.log('   Authorized origins: ' + DEPLOYMENT_URL);
  console.log('   Authorized origins: https://ziyereoasqiqhjvedgit.supabase.co');
  console.log('   Redirect URIs: https://ziyereoasqiqhjvedgit.supabase.co/auth/v1/callback');

  console.log('\n📞 REAL-TIME MONITORING:');
  console.log('─'.repeat(30));
  console.log('Open terminal and run:');
  console.log('vercel logs --follow');
  console.log('');
  console.log('Then try OAuth flow and watch logs in real-time');
  console.log('Look for auth callback logs and any errors');
}

testOAuthFlow();