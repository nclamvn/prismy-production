#!/usr/bin/env node

// Quick test để check tất cả auth endpoints
// Usage: node quick-auth-test.js

const https = require('https');

const CURRENT_URL = 'https://prismy-production-l05nx0orj-nclamvn-gmailcoms-projects.vercel.app';

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
          body: data.substring(0, 500), // First 500 chars
          ok: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function quickAuthTest() {
  console.log('🧪 QUICK AUTH ENDPOINTS TEST');
  console.log('============================\n');
  console.log('Testing URL:', CURRENT_URL);
  console.log('');

  const tests = [
    { name: 'Health Check', url: '/api/health' },
    { name: 'Auth Debug', url: '/api/auth/debug' },
    { name: 'Login Page', url: '/login' },
    { name: 'App Page (should redirect)', url: '/app' },
    { name: 'Callback Test', url: '/auth/callback?error=test' },
  ];

  for (const test of tests) {
    try {
      console.log(`📊 Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const result = await makeRequest(CURRENT_URL + test.url);
      console.log(`   Status: ${result.statusCode}`);
      
      if (result.headers.location) {
        console.log(`   Redirects to: ${result.headers.location}`);
      }
      
      if (result.statusCode >= 400) {
        console.log(`   Error body: ${result.body.substring(0, 200)}...`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('🔍 MANUAL TESTING REQUIRED');
  console.log('=========================');
  console.log('');
  console.log('Bây giờ hãy test manually trong browser:');
  console.log('');
  console.log('1. Mở: ' + CURRENT_URL + '/login');
  console.log('2. Mở Developer Tools (F12)');
  console.log('3. Vào tab Network');
  console.log('4. Click "Continue with Google"');
  console.log('5. Hoàn thành OAuth flow');
  console.log('6. Xem Network tab để tìm lỗi');
  console.log('');
  console.log('🚨 THÔNG TIN CẦN REPORT:');
  console.log('- Callback request URL và status code');
  console.log('- Any error parameters trong URL');
  console.log('- Console errors (tab Console)');
  console.log('- Final page sau OAuth (login hay app)');
  console.log('');
  console.log('📞 Với thông tin này, tôi sẽ fix được vấn đề!');
}

quickAuthTest().catch(console.error);