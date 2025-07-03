#!/usr/bin/env node

const { chromium } = require('playwright');

async function testOAuthPipeline() {
  console.log('🧪 Manual OAuth Pipeline Test\n');
  console.log('Testing on http://localhost:3001\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  try {
    // Test 1: Landing Page
    console.log('1️⃣ Testing Landing Page...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    console.log('✅ Landing page loaded');
    
    // Test 2: Navigate to Login
    console.log('\n2️⃣ Testing Login Navigation...');
    const signInButton = page.locator('button:has-text("Sign"), a:has-text("Sign")').first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      console.log('✅ Found and clicked sign in button');
    } else {
      console.log('⚠️  No sign in button found on landing, trying /login directly');
      await page.goto('http://localhost:3001/login');
    }
    
    // Test 3: Check for Google OAuth
    console.log('\n3️⃣ Checking Google OAuth Button...');
    await page.waitForLoadState('networkidle');
    const googleButton = page.locator('button:has-text("Google"), button:has(svg)').filter({ hasText: /Google/i }).first();
    if (await googleButton.isVisible()) {
      console.log('✅ Google OAuth button found');
      console.log('   Button text:', await googleButton.textContent());
    } else {
      console.log('❌ Google OAuth button not found');
    }
    
    // Test 4: Check App Route Protection
    console.log('\n4️⃣ Testing App Route Protection...');
    await page.goto('http://localhost:3001/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for potential redirects
    
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('✅ App route protected - redirected to login');
    } else if (currentUrl.includes('/app')) {
      console.log('⚠️  App route accessible without auth');
    }
    
    // Test 5: Check Layout Isolation
    console.log('\n5️⃣ Testing Layout Isolation...');
    await page.goto('http://localhost:3001');
    const hasMarketingLayout = await page.locator('.layout-root-marketing').isVisible();
    console.log(`   Marketing layout: ${hasMarketingLayout ? '✅' : '❌'}`);
    
    await page.goto('http://localhost:3001/app');
    await page.waitForTimeout(1000);
    const hasWorkspaceLayout = await page.locator('.layout-root-workspace').isVisible();
    console.log(`   Workspace layout: ${hasWorkspaceLayout ? '✅' : '❌'}`);
    
    console.log('\n📊 Test Complete!');
    console.log('Please review the browser window for visual verification.');
    console.log('Press Ctrl+C to close the browser.');
    
    // Keep browser open for manual inspection
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testOAuthPipeline().catch(console.error);