#!/usr/bin/env tsx

/**
 * Database Migration Runner for Prismy v2
 * 
 * Executes SQL migration files in order against Supabase database
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations')

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

interface MigrationFile {
  filename: string
  filepath: string
  order: number
}

/**
 * Gets all migration files sorted by order
 */
function getMigrationFiles(): MigrationFile[] {
  try {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .map(filename => {
        const filepath = join(MIGRATIONS_DIR, filename)
        const stats = statSync(filepath)
        
        // Extract order from filename (e.g., "001_initial_schema.sql" -> 1)
        const match = filename.match(/^(\d+)_/)
        const order = match ? parseInt(match[1], 10) : 999
        
        return {
          filename,
          filepath,
          order
        }
      })
      .sort((a, b) => a.order - b.order)
    
    return files
  } catch (error) {
    console.error('❌ Failed to read migrations directory:', error)
    process.exit(1)
  }
}

/**
 * Creates migrations tracking table if it doesn't exist
 */
async function createMigrationsTable() {
  console.log('📋 Creating migrations tracking table...')
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      create table if not exists public.migrations (
        id serial primary key,
        filename text unique not null,
        executed_at timestamptz default now(),
        checksum text
      );
    `
  })
  
  if (error) {
    console.error('❌ Failed to create migrations table:', error)
    process.exit(1)
  }
}

/**
 * Gets list of already executed migrations
 */
async function getExecutedMigrations(): Promise<string[]> {
  const { data, error } = await supabase
    .from('migrations')
    .select('filename')
  
  if (error) {
    console.error('❌ Failed to fetch executed migrations:', error)
    process.exit(1)
  }
  
  return data?.map(row => row.filename) || []
}

/**
 * Executes a single migration file
 */
async function executeMigration(migration: MigrationFile): Promise<boolean> {
  try {
    console.log(`🔄 Executing migration: ${migration.filename}`)
    
    const sql = readFileSync(migration.filepath, 'utf8')
    
    // Calculate checksum for integrity check
    const checksum = Buffer.from(sql).toString('base64').slice(0, 32)
    
    // Execute the migration SQL
    const { error: execError } = await supabase.rpc('exec_sql', { sql })
    
    if (execError) {
      console.error(`❌ Failed to execute migration ${migration.filename}:`, execError)
      return false
    }
    
    // Record the migration as executed
    const { error: recordError } = await supabase
      .from('migrations')
      .insert({
        filename: migration.filename,
        checksum
      })
    
    if (recordError) {
      console.error(`❌ Failed to record migration ${migration.filename}:`, recordError)
      return false
    }
    
    console.log(`✅ Migration ${migration.filename} executed successfully`)
    return true
    
  } catch (error) {
    console.error(`❌ Error executing migration ${migration.filename}:`, error)
    return false
  }
}

/**
 * Validates database connection
 */
async function validateConnection() {
  console.log('🔗 Validating database connection...')
  
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .limit(1)
  
  if (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
  
  console.log('✅ Database connection validated')
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log('🚀 Starting database migrations...')
  console.log(`📍 Database: ${SUPABASE_URL}`)
  console.log(`📁 Migrations directory: ${MIGRATIONS_DIR}`)
  
  // Validate connection
  await validateConnection()
  
  // Create migrations tracking table
  await createMigrationsTable()
  
  // Get migration files
  const migrationFiles = getMigrationFiles()
  console.log(`📋 Found ${migrationFiles.length} migration files`)
  
  // Get already executed migrations
  const executedMigrations = await getExecutedMigrations()
  console.log(`📋 ${executedMigrations.length} migrations already executed`)
  
  // Filter out already executed migrations
  const pendingMigrations = migrationFiles.filter(
    migration => !executedMigrations.includes(migration.filename)
  )
  
  if (pendingMigrations.length === 0) {
    console.log('✅ No pending migrations to execute')
    return
  }
  
  console.log(`🔄 Executing ${pendingMigrations.length} pending migrations...`)
  
  // Execute pending migrations
  let successCount = 0
  for (const migration of pendingMigrations) {
    const success = await executeMigration(migration)
    if (success) {
      successCount++
    } else {
      console.error(`❌ Migration failed: ${migration.filename}`)
      process.exit(1)
    }
  }
  
  console.log(`✅ Successfully executed ${successCount} migrations`)
  console.log('🎉 Database migrations completed!')
}

/**
 * Rollback last migration (development only)
 */
async function rollbackMigration() {
  console.log('🔄 Rolling back last migration...')
  
  const { data, error } = await supabase
    .from('migrations')
    .select('filename')
    .order('executed_at', { ascending: false })
    .limit(1)
  
  if (error || !data || data.length === 0) {
    console.log('❌ No migrations to rollback')
    return
  }
  
  const lastMigration = data[0].filename
  console.log(`🔄 Rolling back migration: ${lastMigration}`)
  
  // Remove from migrations table
  const { error: deleteError } = await supabase
    .from('migrations')
    .delete()
    .eq('filename', lastMigration)
  
  if (deleteError) {
    console.error('❌ Failed to remove migration record:', deleteError)
    return
  }
  
  console.log('⚠️  Migration record removed. Manual cleanup may be required.')
  console.log('✅ Rollback completed')
}

/**
 * Show migration status
 */
async function showStatus() {
  console.log('📋 Migration Status')
  console.log('==================')
  
  const migrationFiles = getMigrationFiles()
  const executedMigrations = await getExecutedMigrations()
  
  console.log(`Total migrations: ${migrationFiles.length}`)
  console.log(`Executed: ${executedMigrations.length}`)
  console.log(`Pending: ${migrationFiles.length - executedMigrations.length}`)
  console.log('')
  
  migrationFiles.forEach(migration => {
    const executed = executedMigrations.includes(migration.filename)
    const status = executed ? '✅' : '⏳'
    console.log(`${status} ${migration.filename}`)
  })
}

// CLI interface
const command = process.argv[2]

switch (command) {
  case 'up':
  case 'run':
    runMigrations()
    break
  case 'rollback':
    rollbackMigration()
    break
  case 'status':
    showStatus()
    break
  default:
    console.log('Usage: tsx run-migrations.ts [up|rollback|status]')
    console.log('')
    console.log('Commands:')
    console.log('  up, run    - Execute pending migrations')
    console.log('  rollback   - Rollback last migration')
    console.log('  status     - Show migration status')
    process.exit(1)
}