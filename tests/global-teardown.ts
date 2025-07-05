/**
 * Global teardown for Playwright E2E tests
 * 
 * Cleans up test environment and removes test data
 */

import { FullConfig } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { rmSync, existsSync } from 'fs'
import { join } from 'path'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...')
  
  // Remove fixtures directory
  const fixturesDir = join(__dirname, 'e2e', 'fixtures')
  if (existsSync(fixturesDir)) {
    rmSync(fixturesDir, { recursive: true, force: true })
  }
  
  // Initialize Supabase client for cleanup
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase credentials not found, skipping test data cleanup')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Clean up test data
    await cleanupTestData(supabase)
    
    // Remove test users (optional - might want to keep for debugging)
    if (process.env.CLEANUP_TEST_USERS === 'true') {
      await cleanupTestUsers(supabase)
    }
    
    console.log('✅ E2E test environment cleanup complete')
    
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error)
  }
}

async function cleanupTestData(supabase: any) {
  console.log('🗑️ Removing test data...')
  
  try {
    // Clean up test files from storage
    const { data: files } = await supabase.storage
      .from('documents')
      .list('uploads/test-')
    
    if (files && files.length > 0) {
      const filePaths = files.map(file => `uploads/${file.name}`)
      await supabase.storage
        .from('documents')
        .remove(filePaths)
      
      console.log(`✓ Removed ${files.length} test files from storage`)
    }
    
    // Clean up test documents
    const { error: docsError } = await supabase
      .from('documents')
      .delete()
      .or('filename.like.%test%,filename.like.%fixture%')
    
    if (docsError) {
      console.warn('Failed to cleanup test documents:', docsError)
    }
    
    // Clean up test translations
    const { error: translationsError } = await supabase
      .from('translations')
      .delete()
      .or('document_id.like.%test%,result_path.like.%test%')
    
    if (translationsError) {
      console.warn('Failed to cleanup test translations:', translationsError)
    }
    
    // Clean up test OCR jobs
    const { error: ocrError } = await supabase
      .from('ocr_jobs')
      .delete()
      .or('id.like.%test%,payload->>filePath.like.%test%')
    
    if (ocrError) {
      console.warn('Failed to cleanup test OCR jobs:', ocrError)
    }
    
    // Clean up test admin settings history
    const { error: historyError } = await supabase
      .from('admin_settings_history')
      .delete()
      .eq('admin_user_id', 'test-system')
    
    if (historyError) {
      console.warn('Failed to cleanup admin settings history:', historyError)
    }
    
    console.log('✓ Test data cleanup complete')
    
  } catch (error) {
    console.warn('Failed to cleanup test data:', error)
  }
}

async function cleanupTestUsers(supabase: any) {
  console.log('👤 Removing test users...')
  
  const testEmails = [
    'admin@test.com',
    'user@test.com'
  ]
  
  for (const email of testEmails) {
    try {
      // Get user by email
      const { data: users, error: getUserError } = await supabase.auth.admin.listUsers()
      
      if (getUserError) {
        console.warn(`Failed to list users: ${getUserError.message}`)
        continue
      }
      
      const testUser = users.users?.find(user => user.email === email)
      
      if (testUser) {
        // Delete user profile
        await supabase
          .from('users')
          .delete()
          .eq('id', testUser.id)
        
        // Delete auth user
        const { error: deleteError } = await supabase.auth.admin.deleteUser(testUser.id)
        
        if (deleteError) {
          console.warn(`Failed to delete user ${email}:`, deleteError)
        } else {
          console.log(`✓ Removed test user: ${email}`)
        }
      }
      
    } catch (error) {
      console.warn(`Failed to cleanup user ${email}:`, error)
    }
  }
}

export default globalTeardown