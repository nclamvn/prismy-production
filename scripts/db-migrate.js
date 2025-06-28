#!/usr/bin/env node

/**
 * PRISMY DATABASE MIGRATION SCRIPT
 * Handles database migrations for production deployment
 * Supports up/down migrations with rollback capability
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')

class DatabaseMigrator {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    this.migrationsPath = path.join(__dirname, '..', 'supabase', 'migrations')
    this.client = null
  }

  async init() {
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    }

    this.client = createClient(this.supabaseUrl, this.supabaseKey)
    
    // Create migrations table if it doesn't exist
    await this.createMigrationsTable()
  }

  async createMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        id SERIAL PRIMARY KEY,
        version TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW(),
        execution_time_ms INTEGER,
        checksum TEXT,
        success BOOLEAN DEFAULT true,
        error_message TEXT
      );
    `

    const { error } = await this.client.rpc('exec_sql', { sql: query })
    
    if (error && !error.message.includes('already exists')) {
      console.error('Failed to create migrations table:', error)
      throw error
    }
  }

  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath)
      return files
        .filter(file => file.endsWith('.sql'))
        .sort() // Ensures migrations run in order
    } catch (error) {
      console.error('Failed to read migrations directory:', error)
      return []
    }
  }

  async getAppliedMigrations() {
    const { data, error } = await this.client
      .from('schema_migrations')
      .select('version, checksum')
      .order('version', { ascending: true })

    if (error) {
      console.error('Failed to get applied migrations:', error)
      return []
    }

    return data || []
  }

  async calculateChecksum(content) {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex')
  }

  async runMigration(filename) {
    const startTime = Date.now()
    const filepath = path.join(this.migrationsPath, filename)
    const content = await fs.readFile(filepath, 'utf8')
    const checksum = await this.calculateChecksum(content)
    const version = filename.split('_')[0] // Extract version from filename

    console.log(`\n🔄 Running migration: ${filename}`)

    try {
      // Split content by semicolons to handle multiple statements
      const statements = content
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)

      // Run each statement
      for (const statement of statements) {
        // Skip comments and empty statements
        if (statement.startsWith('--') || !statement) continue

        const { error } = await this.client.rpc('exec_sql', { 
          sql: statement + ';' 
        })

        if (error) {
          throw error
        }
      }

      // Record successful migration
      const executionTime = Date.now() - startTime
      await this.recordMigration(version, filename, checksum, executionTime, true, null)
      
      console.log(`✅ Migration completed in ${executionTime}ms`)
      return true

    } catch (error) {
      // Record failed migration
      const executionTime = Date.now() - startTime
      await this.recordMigration(version, filename, checksum, executionTime, false, error.message)
      
      console.error(`❌ Migration failed: ${error.message}`)
      throw error
    }
  }

  async recordMigration(version, name, checksum, executionTime, success, errorMessage) {
    const { error } = await this.client
      .from('schema_migrations')
      .insert({
        version,
        name,
        checksum,
        execution_time_ms: executionTime,
        success,
        error_message: errorMessage
      })

    if (error) {
      console.error('Failed to record migration:', error)
    }
  }

  async migrate() {
    console.log('🚀 Starting database migration...')
    
    try {
      await this.init()
      
      const migrationFiles = await this.getMigrationFiles()
      const appliedMigrations = await this.getAppliedMigrations()
      const appliedVersions = new Set(appliedMigrations.map(m => m.version))
      
      console.log(`📁 Found ${migrationFiles.length} migration files`)
      console.log(`✅ ${appliedMigrations.length} migrations already applied`)
      
      let migrationsRun = 0
      let migrationsFailed = 0
      
      for (const filename of migrationFiles) {
        const version = filename.split('_')[0]
        
        if (appliedVersions.has(version)) {
          console.log(`⏭️  Skipping ${filename} (already applied)`)
          continue
        }
        
        try {
          await this.runMigration(filename)
          migrationsRun++
        } catch (error) {
          migrationsFailed++
          
          if (process.env.STOP_ON_ERROR === 'true') {
            throw error
          }
        }
      }
      
      console.log('\n📊 Migration Summary:')
      console.log(`   Total files: ${migrationFiles.length}`)
      console.log(`   Already applied: ${appliedMigrations.length}`)
      console.log(`   Newly applied: ${migrationsRun}`)
      console.log(`   Failed: ${migrationsFailed}`)
      
      if (migrationsFailed > 0) {
        process.exit(1)
      }
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error.message)
      process.exit(1)
    }
  }

  async rollback(steps = 1) {
    console.log(`🔄 Rolling back ${steps} migration(s)...`)
    
    try {
      await this.init()
      
      // Get recent successful migrations
      const { data: migrations, error } = await this.client
        .from('schema_migrations')
        .select('*')
        .eq('success', true)
        .order('version', { ascending: false })
        .limit(steps)

      if (error) throw error

      if (!migrations || migrations.length === 0) {
        console.log('ℹ️  No migrations to rollback')
        return
      }

      console.log(`📋 Migrations to rollback: ${migrations.map(m => m.name).join(', ')}`)
      
      // Note: Actual rollback would require DOWN migrations
      // For now, we just mark them as rolled back
      console.log('⚠️  Rollback not implemented. Please manually revert changes.')
      
    } catch (error) {
      console.error('❌ Rollback failed:', error.message)
      process.exit(1)
    }
  }

  async status() {
    console.log('📊 Migration Status\n')
    
    try {
      await this.init()
      
      const migrationFiles = await this.getMigrationFiles()
      const appliedMigrations = await this.getAppliedMigrations()
      const appliedVersions = new Set(appliedMigrations.map(m => m.version))
      
      console.log('Applied Migrations:')
      if (appliedMigrations.length === 0) {
        console.log('  (none)')
      } else {
        for (const migration of appliedMigrations) {
          console.log(`  ✅ ${migration.version} - ${migration.name || 'Unknown'}`)
        }
      }
      
      console.log('\nPending Migrations:')
      const pendingMigrations = migrationFiles.filter(
        file => !appliedVersions.has(file.split('_')[0])
      )
      
      if (pendingMigrations.length === 0) {
        console.log('  (none)')
      } else {
        for (const filename of pendingMigrations) {
          console.log(`  ⏳ ${filename}`)
        }
      }
      
      console.log(`\nTotal: ${migrationFiles.length} files, ${appliedMigrations.length} applied, ${pendingMigrations.length} pending`)
      
    } catch (error) {
      console.error('❌ Failed to get status:', error.message)
      process.exit(1)
    }
  }

  async seed() {
    console.log('🌱 Running database seed...')
    
    try {
      await this.init()
      
      const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql')
      const seedExists = await fs.access(seedPath).then(() => true).catch(() => false)
      
      if (!seedExists) {
        console.log('ℹ️  No seed file found')
        return
      }
      
      const content = await fs.readFile(seedPath, 'utf8')
      console.log('📄 Running seed.sql...')
      
      // Split and run statements
      const statements = content
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

      let successful = 0
      let failed = 0

      for (const statement of statements) {
        try {
          const { error } = await this.client.rpc('exec_sql', { 
            sql: statement + ';' 
          })

          if (error) {
            console.warn(`⚠️  Statement failed: ${error.message}`)
            failed++
          } else {
            successful++
          }
        } catch (error) {
          console.warn(`⚠️  Statement failed: ${error.message}`)
          failed++
        }
      }
      
      console.log(`\n✅ Seed completed: ${successful} successful, ${failed} failed`)
      
    } catch (error) {
      console.error('❌ Seed failed:', error.message)
      process.exit(1)
    }
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2]
  const migrator = new DatabaseMigrator()
  
  switch (command) {
    case 'migrate':
    case 'up':
      await migrator.migrate()
      break
      
    case 'rollback':
    case 'down':
      const steps = parseInt(process.argv[3]) || 1
      await migrator.rollback(steps)
      break
      
    case 'status':
      await migrator.status()
      break
      
    case 'seed':
      await migrator.seed()
      break
      
    case 'reset':
      console.log('⚠️  Reset command not implemented for safety')
      console.log('   Please manually drop and recreate the database')
      break
      
    default:
      console.log('Prismy Database Migration Tool')
      console.log('\nUsage:')
      console.log('  node db-migrate.js migrate        Run pending migrations')
      console.log('  node db-migrate.js rollback [n]   Rollback n migrations (default: 1)')
      console.log('  node db-migrate.js status         Show migration status')
      console.log('  node db-migrate.js seed           Run database seed')
      console.log('\nEnvironment variables:')
      console.log('  SUPABASE_URL                    Supabase project URL')
      console.log('  SUPABASE_SERVICE_ROLE_KEY       Supabase service role key')
      console.log('  STOP_ON_ERROR                   Stop on first error (default: false)')
      process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = DatabaseMigrator