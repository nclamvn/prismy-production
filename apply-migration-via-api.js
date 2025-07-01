#!/usr/bin/env node

// Apply migration via Supabase API endpoint
// Usage: node apply-migration-via-api.js

const https = require('https');
const fs = require('fs');

async function applyMigrationViaAPI() {
  console.log('🔧 Applying Auth Migration via Supabase API');
  console.log('==========================================\n');

  const supabaseUrl = 'https://ziyereoasqiqhjvedgit.supabase.co';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppeWVyZW9hc3FpcWhqdmVkZ2l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU5MTc4NSwiZXhwIjoyMDY2MTY3Nzg1fQ.7vzfrq6nTyOxJrGJclXjuWYucIUaCMiN5zhsldxNr6U';

  // Read migration file
  const migrationSQL = fs.readFileSync('./supabase/migrations/20250702_auth_trigger.sql', 'utf8');
  
  console.log('📁 Migration SQL loaded');
  console.log('📊 Size:', migrationSQL.length, 'characters\n');

  // Split into individual SQL statements
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    .map(stmt => stmt + ';');

  console.log('📝 Found', statements.length, 'SQL statements\n');

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
    console.log('   SQL:', statement.substring(0, 60) + '...\n');

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          sql: statement
        })
      });

      if (!response.ok) {
        // Try alternative method with direct SQL execution
        console.log('   Trying alternative method...');
        
        const altResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/sql'
          },
          body: statement
        });

        if (!altResponse.ok) {
          console.log('   ⚠️  API method failed, statement will need manual execution');
          console.log('   Statement:', statement);
        } else {
          console.log('   ✅ Statement executed successfully');
        }
      } else {
        console.log('   ✅ Statement executed successfully');
      }
    } catch (error) {
      console.log('   ⚠️  Error:', error.message);
      console.log('   Statement will need manual execution:', statement);
    }
  }

  console.log('\n🎯 Migration application completed!');
  console.log('\n📋 Alternative manual steps if API failed:');
  console.log('1. Go to Supabase Dashboard');
  console.log('2. Navigate: Project → SQL Editor');
  console.log('3. Create a new query');
  console.log('4. Paste and execute this SQL:\n');
  
  console.log('-- COPY AND PASTE THIS SQL --');
  console.log(migrationSQL);
  console.log('-- END OF SQL --\n');

  console.log('🌐 Direct Supabase Dashboard links:');
  console.log('   Dashboard: https://supabase.com/dashboard/project/ziyereoasqiqhjvedgit');
  console.log('   SQL Editor: https://supabase.com/dashboard/project/ziyereoasqiqhjvedgit/sql');
}

// For compatibility with older Node.js versions
if (typeof fetch === 'undefined') {
  console.log('📦 Installing node-fetch...');
  try {
    const fetch = require('node-fetch');
    global.fetch = fetch;
  } catch (error) {
    console.log('⚠️  node-fetch not available, using https module...');
    
    global.fetch = function(url, options) {
      return new Promise((resolve, reject) => {
        const req = https.request(url, {
          method: options.method || 'GET',
          headers: options.headers || {}
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              json: () => Promise.resolve(JSON.parse(data)),
              text: () => Promise.resolve(data)
            });
          });
        });
        
        req.on('error', reject);
        
        if (options.body) {
          req.write(options.body);
        }
        
        req.end();
      });
    };
  }
}

applyMigrationViaAPI().catch(console.error);