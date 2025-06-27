/**
 * PRISMY AGENT DATABASE SETUP SCRIPT
 * Sets up the database schema for the autonomous agent system
 * Run this script to initialize the agent persistence layer
 */

import { createServiceRoleClient } from '@/lib/supabase'
import { readFileSync } from 'fs'
import { join } from 'path'

// Use the singleton service role client for consistency
const supabase = createServiceRoleClient()

async function setupAgentDatabase() {
  console.log('🚀 Setting up Prismy Agent Database...')
  
  try {
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'database', 'migrations', '20241225000001_create_agent_system_tables.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    console.log('📝 Executing database migration...')
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
    
    console.log('✅ Database migration completed successfully')
    
    // Verify the setup by checking if tables exist
    console.log('🔍 Verifying database setup...')
    
    const tables = [
      'document_agents',
      'agent_memory_events', 
      'agent_memory_patterns',
      'agent_task_results',
      'agent_collaborations',
      'collaboration_participants',
      'swarm_queries',
      'swarm_query_responses',
      'agent_performance_metrics',
      'swarm_metrics',
      'agent_knowledge_base',
      'knowledge_sharing_events'
    ]
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)')
        .limit(1)
      
      if (error) {
        console.error(`❌ Table ${table} not accessible:`, error.message)
      } else {
        console.log(`✅ Table ${table} ready`)
      }
    }
    
    // Test agent creation
    console.log('🧪 Testing agent system...')
    await testAgentSystem()
    
    console.log('🎉 Prismy Agent Database setup completed successfully!')
    console.log('')
    console.log('📊 Your autonomous agent system is now ready with:')
    console.log('   • Persistent agent storage')
    console.log('   • Memory and pattern tracking')
    console.log('   • Collaboration management')
    console.log('   • Swarm intelligence queries')
    console.log('   • Performance analytics')
    console.log('   • Knowledge sharing')
    console.log('')
    console.log('🔧 Next steps:')
    console.log('   1. Configure AI providers (OpenAI, Anthropic)')
    console.log('   2. Upload documents to create autonomous agents')
    console.log('   3. Monitor agent dashboard for swarm activity')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

async function testAgentSystem() {
  try {
    // Create a test user (using a fixed UUID for testing)
    const testUserId = '00000000-0000-0000-0000-000000000001'
    
    // Test agent creation
    const { data: testAgent, error: agentError } = await supabase
      .from('document_agents')
      .insert({
        user_id: testUserId,
        document_id: '00000000-0000-0000-0000-000000000002',
        document_title: 'Test Document',
        document_type: 'pdf',
        personality: 'general',
        name: 'Test Agent',
        name_vi: 'Đại lý Thử nghiệm',
        specialty: 'General document assistance',
        specialty_vi: 'Hỗ trợ tài liệu tổng quát',
        avatar: '🤖',
        status: 'active'
      })
      .select()
      .single()
    
    if (agentError) {
      throw agentError
    }
    
    console.log('✅ Test agent created successfully')
    
    // Test memory event
    const { error: memoryError } = await supabase
      .from('agent_memory_events')
      .insert({
        agent_id: testAgent.id,
        event_type: 'test_event',
        event_data: { message: 'Database setup test' },
        importance: 0.5
      })
    
    if (memoryError) {
      throw memoryError
    }
    
    console.log('✅ Test memory event created successfully')
    
    // Test collaboration
    const { data: testCollab, error: collabError } = await supabase
      .from('agent_collaborations')
      .insert({
        user_id: testUserId,
        objective: 'Database setup test collaboration',
        participant_ids: [testAgent.id],
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (collabError) {
      throw collabError
    }
    
    console.log('✅ Test collaboration created successfully')
    
    // Clean up test data
    await supabase.from('agent_collaborations').delete().eq('id', testCollab.id)
    await supabase.from('agent_memory_events').delete().eq('agent_id', testAgent.id)
    await supabase.from('document_agents').delete().eq('id', testAgent.id)
    
    console.log('✅ Test data cleaned up')
    
  } catch (error) {
    console.error('❌ Agent system test failed:', error)
    throw error
  }
}

// Alternative setup using direct SQL execution
async function setupWithDirectSQL() {
  console.log('🔄 Attempting direct SQL execution...')
  
  try {
    const migrationPath = join(process.cwd(), 'database', 'migrations', '20241225000001_create_agent_system_tables.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
          if (error) {
            console.warn(`⚠️  Statement ${i + 1} warning:`, error.message)
          } else {
            console.log(`✅ Statement ${i + 1}/${statements.length} executed`)
          }
        } catch (error) {
          console.warn(`⚠️  Statement ${i + 1} failed:`, error)
        }
      }
    }
    
    console.log('✅ Direct SQL execution completed')
    
  } catch (error) {
    console.error('❌ Direct SQL execution failed:', error)
    throw error
  }
}

// Main execution
if (require.main === module) {
  setupAgentDatabase().catch(error => {
    console.error('Setup failed:', error)
    process.exit(1)
  })
}

export { setupAgentDatabase, testAgentSystem }