#!/usr/bin/env node

// Comprehensive OAuth debugging
// Usage: node comprehensive-oauth-debug.js

const DEPLOYMENT_URL = 'https://prismy-production-8x7j4enfd-nclamvn-gmailcoms-projects.vercel.app';

async function comprehensiveDebug() {
  console.log('🔍 COMPREHENSIVE OAUTH DEBUG');
  console.log('============================\n');

  console.log('🚨 CRITICAL DEBUGGING STEPS:');
  console.log('');
  
  console.log('STEP 1: Clear ALL browser data first');
  console.log('  - Open Chrome → Settings → Privacy → Clear browsing data');
  console.log('  - Select "All time" and check ALL boxes');
  console.log('  - Click "Clear data"');
  console.log('');
  
  console.log('STEP 2: Check Supabase Authentication Configuration');
  console.log('  📋 Required settings:');
  console.log('  Site URL: ' + DEPLOYMENT_URL);
  console.log('  Redirect URLs:');
  console.log('    - ' + DEPLOYMENT_URL + '/auth/callback');
  console.log('    - ' + DEPLOYMENT_URL + '/**');
  console.log('  Google Provider: ENABLED');
  console.log('');
  
  console.log('STEP 3: Check Google Console Configuration');
  console.log('  📋 Required settings:');
  console.log('  Authorized JavaScript origins:');
  console.log('    - ' + DEPLOYMENT_URL);
  console.log('    - https://ziyereoasqiqhjvedgit.supabase.co');
  console.log('  Authorized redirect URIs:');
  console.log('    - https://ziyereoasqiqhjvedgit.supabase.co/auth/v1/callback');
  console.log('');
  
  console.log('STEP 4: Test OAuth with fresh browser session');
  console.log('  1. Open INCOGNITO/PRIVATE window');
  console.log('  2. Go to: ' + DEPLOYMENT_URL + '/login');
  console.log('  3. Open Developer Tools (F12)');
  console.log('  4. Go to Console tab');
  console.log('  5. Click "Continue with Google"');
  console.log('  6. Watch console for detailed logs');
  console.log('');
  
  console.log('🔍 WHAT TO LOOK FOR IN CONSOLE:');
  console.log('─'.repeat(40));
  console.log('✅ GOOD SIGNS:');
  console.log('  "Auth callback received: { code: true, error: null }"');
  console.log('  "Attempting code exchange with code: ..."');
  console.log('  "Code exchange result: { hasUser: true, ... }"');
  console.log('  "User authenticated successfully: your-email"');
  console.log('  "Redirecting to: /app?welcome=1"');
  console.log('');
  console.log('❌ BAD SIGNS:');
  console.log('  "Auth callback received: { code: false, error: ... }"');
  console.log('  "Code exchange error: ..."');
  console.log('  "exchangeError: invalid request..."');
  console.log('');
  
  console.log('🚨 SPECIFIC ERRORS TO WATCH FOR:');
  console.log('─'.repeat(40));
  console.log('Error 1: "both auth code and code verifier should be non-empty"');
  console.log('  ↳ Fix: Google Console redirect URI mismatch');
  console.log('');
  console.log('Error 2: "Access denied" on Google page');
  console.log('  ↳ Fix: Check Google OAuth app configuration');
  console.log('');
  console.log('Error 3: "User authenticated successfully" but still redirects to login');
  console.log('  ↳ Fix: Database/RLS policy issue');
  console.log('');
  console.log('Error 4: Network request fails');
  console.log('  ↳ Fix: Middleware or routing issue');
  console.log('');
  
  console.log('📋 COPY THIS EXACT ERROR MESSAGE:');
  console.log('─'.repeat(40));
  console.log('After trying OAuth flow, copy the EXACT error message from:');
  console.log('1. Browser console (red text)');
  console.log('2. The final URL if redirected to login with error');
  console.log('3. Any network request that shows red/failed status');
  console.log('');
  
  console.log('🎯 NEXT DEBUGGING APPROACH:');
  console.log('─'.repeat(40));
  console.log('If OAuth still fails after clearing browser data:');
  console.log('');
  console.log('OPTION A: Try different Google account');
  console.log('OPTION B: Check if Google OAuth app is in "Testing" mode');
  console.log('OPTION C: Verify database user_credits table exists');
  console.log('OPTION D: Check if database migration was actually applied');
  console.log('');
  
  console.log('📞 REPORT EXACT ERROR:');
  console.log('─'.repeat(40));
  console.log('Please copy and send me:');
  console.log('1. Console error message (exact text)');
  console.log('2. Final URL after OAuth (if contains error parameters)');
  console.log('3. What page you end up on (/login or /app)');
  console.log('4. Any network requests that show red status');
  console.log('');
  console.log('With exact error details, I can identify the specific issue!');
}

comprehensiveDebug().catch(console.error);