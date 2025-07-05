/**
 * Global setup for Playwright E2E tests
 * 
 * Prepares test environment, creates test users, and sets up test data
 */

import { chromium, FullConfig } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { mkdirSync, existsSync } from 'fs'
import { join } from 'path'

async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up E2E test environment...')
  
  // Create fixtures directory
  const fixturesDir = join(__dirname, 'e2e', 'fixtures')
  if (!existsSync(fixturesDir)) {
    mkdirSync(fixturesDir, { recursive: true })
  }
  
  // Initialize Supabase client for test data setup
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase credentials not found, skipping test data setup')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Create test users
    await createTestUsers(supabase)
    
    // Set up test admin settings
    await setupTestAdminSettings(supabase)
    
    // Clean up any existing test data
    await cleanupTestData(supabase)
    
    console.log('✅ E2E test environment setup complete')
    
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error)
    throw error
  }
}

async function createTestUsers(supabase: any) {
  console.log('👥 Creating test users...')
  
  const testUsers = [
    {
      email: 'admin@test.com',
      password: 'test-admin-123',
      role: 'admin',
      permissions: ['admin_settings', 'user_management']
    },
    {
      email: 'user@test.com',
      password: 'test-user-123',
      role: 'user',
      permissions: []
    }
  ]
  
  for (const user of testUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      })
      
      if (authError && !authError.message.includes('already registered')) {
        throw authError
      }
      
      const userId = authData?.user?.id
      if (userId) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            created_at: new Date().toISOString()
          })
        
        if (profileError) {
          console.warn(`Failed to create profile for ${user.email}:`, profileError)
        }
      }
      
      console.log(`✓ Created test user: ${user.email}`)
      
    } catch (error) {
      console.warn(`Failed to create user ${user.email}:`, error)
    }
  }
}

async function setupTestAdminSettings(supabase: any) {
  console.log('⚙️ Setting up test admin settings...')
  
  const testSettings = {
    upload: {
      maxFileSize: 1024 * 1024 * 1024, // 1GB
      maxFileSizeEdge: 50 * 1024 * 1024, // 50MB
      maxFileSizeQueue: 500 * 1024 * 1024, // 500MB
      allowedFileTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown'
      ],
      chunkedUploadThreshold: 50 * 1024 * 1024, // 50MB
      defaultChunkSize: 5 * 1024 * 1024 // 5MB
    },
    ocr: {
      queueThreshold: 50 * 1024 * 1024, // 50MB
      maxProcessingTime: 30 * 60, // 30 minutes
      concurrentJobs: 2, // Reduced for testing
      engines: {
        tesseract: { enabled: true, priority: 1 }
      }
    },
    translation: {
      maxTextLength: 100000, // Reduced for testing
      maxChunks: 50, // Reduced for testing
      concurrentTranslations: 2 // Reduced for testing
    }
  }
  
  try {
    // Deactivate existing settings
    await supabase
      .from('admin_settings')
      .update({ active: false })
      .eq('active', true)
    
    // Insert test settings
    const { error } = await supabase
      .from('admin_settings')
      .insert({
        settings: testSettings,
        updated_by: 'test-system',
        active: true,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.warn('Failed to setup admin settings:', error)
    } else {
      console.log('✓ Test admin settings configured')
    }
    
  } catch (error) {
    console.warn('Failed to setup admin settings:', error)
  }
}

async function cleanupTestData(supabase: any) {
  console.log('🧹 Cleaning up existing test data...')
  
  try {
    // Clean up test documents
    await supabase
      .from('documents')
      .delete()
      .like('filename', 'test-%')
    
    // Clean up test translations
    await supabase
      .from('translations')
      .delete()
      .like('document_id', 'test-%')
    
    // Clean up test OCR jobs
    await supabase
      .from('ocr_jobs')
      .delete()
      .like('id', 'test-%')
    
    console.log('✓ Test data cleanup complete')
    
  } catch (error) {
    console.warn('Failed to cleanup test data:', error)
  }
}

export default globalSetup