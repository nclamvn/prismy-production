#!/usr/bin/env tsx

/**
 * User Seeding Script for Prismy v2
 * 
 * Creates admin and test users for development and testing
 */

import { createClient } from '@supabase/supabase-js'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// User definitions
const SEED_USERS = [
  {
    email: 'admin@prismy.com',
    password: 'admin-prismy-2024',
    full_name: 'Admin User',
    role: 'admin',
    metadata: {
      department: 'Engineering',
      title: 'System Administrator'
    }
  },
  {
    email: 'test@prismy.com', 
    password: 'test-prismy-2024',
    full_name: 'Test User',
    role: 'user',
    metadata: {
      department: 'QA',
      title: 'Test User'
    }
  },
  {
    email: 'demo@prismy.com',
    password: 'demo-prismy-2024',
    full_name: 'Demo User',
    role: 'user',
    metadata: {
      department: 'Sales',
      title: 'Demo Account'
    }
  }
]

// Test users for E2E testing
const TEST_USERS = [
  {
    email: 'admin@test.com',
    password: 'test-admin-123',
    full_name: 'E2E Admin',
    role: 'admin',
    metadata: {
      test_user: true,
      purpose: 'e2e_testing'
    }
  },
  {
    email: 'user@test.com',
    password: 'test-user-123',
    full_name: 'E2E User',
    role: 'user',
    metadata: {
      test_user: true,
      purpose: 'e2e_testing'
    }
  }
]

/**
 * Creates a user with Supabase Auth
 */
async function createUser(userConfig: any) {
  console.log(`👤 Creating user: ${userConfig.email}`)
  
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userConfig.email,
      password: userConfig.password,
      email_confirm: true,
      user_metadata: {
        full_name: userConfig.full_name,
        ...userConfig.metadata
      }
    })
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`⚠️  User already exists: ${userConfig.email}`)
        return true
      }
      throw authError
    }
    
    if (!authData.user) {
      throw new Error('User creation failed - no user returned')
    }
    
    // Update user profile in public.users table
    const { error: profileError } = await supabase
      .from('users')
      .update({
        full_name: userConfig.full_name,
        role: userConfig.role
      })
      .eq('id', authData.user.id)
    
    if (profileError) {
      console.warn(`⚠️  Profile update failed for ${userConfig.email}:`, profileError)
    }
    
    console.log(`✅ User created: ${userConfig.email} (${userConfig.role})`)
    return true
    
  } catch (error) {
    console.error(`❌ Failed to create user ${userConfig.email}:`, error)
    return false
  }
}

/**
 * Creates admin settings for production
 */
async function createProductionSettings() {
  console.log('⚙️  Creating production settings...')
  
  const productionSettings = [
    {
      setting_key: 'system.environment',
      setting_value: JSON.stringify('production'),
      description: 'Current environment'
    },
    {
      setting_key: 'features.mvp_mode',
      setting_value: JSON.stringify(true),
      description: 'MVP mode enabled'
    },
    {
      setting_key: 'features.large_uploads',
      setting_value: JSON.stringify(false),
      description: 'Large file uploads disabled initially'
    },
    {
      setting_key: 'upload.max_file_size_production',
      setting_value: JSON.stringify(52428800),
      description: 'Production file size limit (50MB)'
    },
    {
      setting_key: 'translation.daily_limit',
      setting_value: JSON.stringify(50),
      description: 'Daily translation limit per user'
    },
    {
      setting_key: 'system.launch_date',
      setting_value: JSON.stringify(new Date().toISOString()),
      description: 'Production launch date'
    }
  ]
  
  for (const setting of productionSettings) {
    const { error } = await supabase
      .from('admin_settings')
      .upsert(setting, { onConflict: 'setting_key' })
    
    if (error) {
      console.error(`❌ Failed to create setting ${setting.setting_key}:`, error)
    } else {
      console.log(`✅ Setting created: ${setting.setting_key}`)
    }
  }
}

/**
 * Seeds production users
 */
async function seedProductionUsers() {
  console.log('🌱 Seeding production users...')
  
  let successCount = 0
  for (const user of SEED_USERS) {
    const success = await createUser(user)
    if (success) successCount++
  }
  
  console.log(`✅ Created ${successCount}/${SEED_USERS.length} production users`)
  return successCount === SEED_USERS.length
}

/**
 * Seeds test users for E2E testing
 */
async function seedTestUsers() {
  console.log('🧪 Seeding test users...')
  
  let successCount = 0
  for (const user of TEST_USERS) {
    const success = await createUser(user)
    if (success) successCount++
  }
  
  console.log(`✅ Created ${successCount}/${TEST_USERS.length} test users`)
  return successCount === TEST_USERS.length
}

/**
 * Creates sample data for testing
 */
async function createSampleData() {
  console.log('📄 Creating sample data...')
  
  // Get admin user ID
  const { data: adminUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'admin@prismy.com')
    .single()
  
  if (!adminUser) {
    console.log('⚠️  Admin user not found, skipping sample data creation')
    return
  }
  
  // Create sample document
  const { error: docError } = await supabase
    .from('documents')
    .insert({
      user_id: adminUser.id,
      filename: 'welcome-guide.pdf',
      original_name: 'Welcome Guide.pdf',
      file_size: 1024000,
      mime_type: 'application/pdf',
      storage_path: 'sample/welcome-guide.pdf',
      detected_language: 'en',
      page_count: 5,
      processing_status: 'completed'
    })
  
  if (docError) {
    console.error('❌ Failed to create sample document:', docError)
  } else {
    console.log('✅ Sample document created')
  }
}

/**
 * Shows user information
 */
async function showUsers() {
  console.log('👥 Current Users')
  console.log('================')
  
  const { data: users, error } = await supabase
    .from('users')
    .select('email, full_name, role, created_at')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Failed to fetch users:', error)
    return
  }
  
  if (!users || users.length === 0) {
    console.log('No users found')
    return
  }
  
  users.forEach(user => {
    const roleIcon = user.role === 'admin' ? '👑' : '👤'
    console.log(`${roleIcon} ${user.email} - ${user.full_name} (${user.role})`)
  })
  
  console.log(`\nTotal users: ${users.length}`)
}

/**
 * Validates database connection
 */
async function validateConnection() {
  console.log('🔗 Validating database connection...')
  
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1)
  
  if (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
  
  console.log('✅ Database connection validated')
}

/**
 * Main seeding function
 */
async function main() {
  console.log('🌱 Starting user seeding...')
  console.log(`📍 Database: ${SUPABASE_URL}`)
  
  await validateConnection()
  
  const command = process.argv[2] || 'production'
  
  switch (command) {
    case 'production':
    case 'prod':
      await seedProductionUsers()
      await createProductionSettings()
      await createSampleData()
      break
      
    case 'test':
    case 'e2e':
      await seedTestUsers()
      break
      
    case 'all':
      await seedProductionUsers()
      await seedTestUsers()
      await createProductionSettings()
      await createSampleData()
      break
      
    case 'show':
    case 'list':
      await showUsers()
      break
      
    default:
      console.log('Usage: tsx seed-users.ts [production|test|all|show]')
      console.log('')
      console.log('Commands:')
      console.log('  production, prod - Seed production users')
      console.log('  test, e2e       - Seed test users for E2E testing')
      console.log('  all             - Seed all users')
      console.log('  show, list      - Show existing users')
      process.exit(1)
  }
  
  console.log('🎉 User seeding completed!')
}

// Run the script
main().catch(error => {
  console.error('❌ Seeding failed:', error)
  process.exit(1)
})