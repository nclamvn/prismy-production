import { chromium, expect, FullConfig } from '@playwright/test';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  const { baseURL, storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    await page.goto(baseURL || 'http://localhost:3000');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    
    // Check if we need to authenticate
    const isLoginPage = await page.locator('[data-testid="login-form"]').isVisible();
    
    if (isLoginPage || page.url().includes('/login')) {
      console.log('🔐 Authenticating test user...');
      
      // Create test user account or login with existing credentials
      const testEmail = process.env.TEST_USER_EMAIL || 'test@prismy.com';
      const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';
      
      // Fill login form
      await page.fill('[data-testid="email-input"]', testEmail);
      await page.fill('[data-testid="password-input"]', testPassword);
      await page.click('[data-testid="login-button"]');
      
      // Wait for successful login (redirect to dashboard)
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      
      // Verify we're logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      
      console.log('✅ Authentication successful');
    } else {
      console.log('ℹ️ Already authenticated or no auth required');
    }
    
    // Save the authentication state
    const authDir = path.dirname(storageState as string);
    await page.context().storageState({ path: storageState as string });
    
    console.log('💾 Saved authentication state');
    
    // Setup test data if needed
    await setupTestData(page);
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed');
}

async function setupTestData(page: any) {
  console.log('📊 Setting up test data...');
  
  try {
    // Create a test project for translations
    await page.goto('/dashboard/projects');
    
    // Check if test project already exists
    const existingProject = await page.locator('[data-testid="project-item"]').first().isVisible();
    
    if (!existingProject) {
      // Create new project
      await page.click('[data-testid="create-project-button"]');
      await page.fill('[data-testid="project-name-input"]', 'E2E Test Project');
      await page.fill('[data-testid="project-description-input"]', 'Project for end-to-end testing');
      await page.click('[data-testid="create-project-submit"]');
      
      // Wait for project creation
      await page.waitForSelector('[data-testid="project-item"]');
      console.log('✅ Test project created');
    } else {
      console.log('ℹ️ Test project already exists');
    }
    
    // Setup test translations
    await setupTestTranslations(page);
    
    // Setup test billing data (if applicable)
    await setupTestBilling(page);
    
  } catch (error) {
    console.warn('⚠️ Test data setup failed (continuing anyway):', error);
  }
}

async function setupTestTranslations(page: any) {
  try {
    // Navigate to translations
    await page.goto('/dashboard/translate');
    
    // Check if we have existing translations
    const hasTranslations = await page.locator('[data-testid="translation-item"]').count() > 0;
    
    if (!hasTranslations) {
      // Create a test translation
      await page.click('[data-testid="new-translation-button"]');
      
      // Fill in test content
      await page.fill('[data-testid="source-text-input"]', 'Hello, world! This is a test translation.');
      await page.selectOption('[data-testid="source-language-select"]', 'en');
      await page.selectOption('[data-testid="target-language-select"]', 'es');
      
      // Submit translation
      await page.click('[data-testid="translate-button"]');
      
      // Wait for translation to complete
      await page.waitForSelector('[data-testid="translation-result"]', { timeout: 30000 });
      
      console.log('✅ Test translation created');
    }
  } catch (error) {
    console.warn('⚠️ Translation setup failed:', error);
  }
}

async function setupTestBilling(page: any) {
  try {
    // Check if user has billing setup
    await page.goto('/dashboard/billing');
    
    const needsBilling = await page.locator('[data-testid="setup-billing-button"]').isVisible();
    
    if (needsBilling && process.env.SETUP_TEST_BILLING === 'true') {
      // Setup test billing (use test mode)
      console.log('ℹ️ Setting up test billing...');
      
      await page.click('[data-testid="setup-billing-button"]');
      
      // Fill in test card details (Stripe test card)
      await page.fill('[data-testid="card-number-input"]', '4242424242424242');
      await page.fill('[data-testid="card-expiry-input"]', '12/34');
      await page.fill('[data-testid="card-cvc-input"]', '123');
      await page.fill('[data-testid="cardholder-name-input"]', 'Test User');
      
      // Submit billing setup
      await page.click('[data-testid="save-payment-method"]');
      
      // Wait for success
      await page.waitForSelector('[data-testid="billing-success"]');
      
      console.log('✅ Test billing setup completed');
    }
  } catch (error) {
    console.warn('⚠️ Billing setup failed:', error);
  }
}

export default globalSetup;