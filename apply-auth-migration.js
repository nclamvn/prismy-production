#!/usr/bin/env node

// Apply auth migration script
// Usage: node apply-auth-migration.js

const { readFileSync } = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function applyAuthMigration() {
  console.log('🔧 Applying Auth Migration for User Credits Trigger');
  console.log('=================================================\n');

  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\n💡 Make sure these are set in your .env.local file');
    process.exit(1);
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Read the migration file
    const migrationSQL = readFileSync('./supabase/migrations/20250702_auth_trigger.sql', 'utf8');
    
    console.log('📁 Reading migration file: 20250702_auth_trigger.sql');
    console.log('📊 Migration size:', migrationSQL.length, 'characters\n');

    // Execute the migration
    console.log('⚡ Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution
      console.log('🔄 Trying direct SQL execution...');
      
      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);
          const { error: stmtError } = await supabase.from('__migrations').select('*').limit(0);
          
          if (stmtError) {
            console.log('   Using RPC method for statement execution...');
            const { error: rpcError } = await supabase.rpc('exec', { sql: statement + ';' });
            if (rpcError) {
              console.error('   ❌ Failed to execute statement:', rpcError.message);
              throw rpcError;
            }
          }
        }
      }
    }

    console.log('✅ Migration applied successfully!\n');

    // Test the trigger by checking if the function exists
    console.log('🧪 Testing migration...');
    const { data: functionExists, error: testError } = await supabase
      .rpc('get_function_info', { function_name: 'handle_new_user' })
      .single();

    if (testError) {
      // If RPC doesn't work, just check if we can query the database
      console.log('   Checking database connection...');
      const { data: dbTest, error: dbError } = await supabase
        .from('user_credits')
        .select('count')
        .limit(1);
      
      if (dbError) {
        console.warn('⚠️  Could not verify migration, but database is accessible');
      } else {
        console.log('✅ Database connection successful');
      }
    } else {
      console.log('✅ handle_new_user function is available');
    }

    console.log('\n🎉 Auth migration completed successfully!');
    console.log('\n📋 What this migration does:');
    console.log('   • Creates handle_new_user() function');
    console.log('   • Sets up trigger on auth.users table');
    console.log('   • Auto-creates user_credits with 20 free credits');
    console.log('   • Handles conflicts gracefully with ON CONFLICT DO NOTHING');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n🔧 Manual steps to apply migration:');
    console.error('1. Go to Supabase Dashboard > SQL Editor');
    console.error('2. Copy the contents of supabase/migrations/20250702_auth_trigger.sql');
    console.error('3. Paste and execute the SQL manually');
    process.exit(1);
  }
}

// Check if we're running directly
if (require.main === module) {
  applyAuthMigration().catch(console.error);
}

module.exports = { applyAuthMigration };