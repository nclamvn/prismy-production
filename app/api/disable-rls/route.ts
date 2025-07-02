import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  const disableRLSSQL = `-- TEMPORARY: Disable RLS to fix upload issue
-- This allows the service role to access all tables without restriction

ALTER TABLE user_credits DISABLE ROW LEVEL SECURITY;
ALTER TABLE translation_jobs DISABLE ROW LEVEL SECURITY;  
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Note: This removes security restrictions. 
-- In production, you should re-enable RLS with proper policies for the service role.
-- For now, this will make the upload functionality work.`

  return NextResponse.json({
    success: true,
    message: 'Quick RLS disable SQL (temporary fix)',
    sql: disableRLSSQL,
    instructions: [
      'QUICK FIX - Run this SQL in Supabase Dashboard:',
      '1. Go to Supabase Dashboard → SQL Editor',
      '2. Paste the SQL above',
      '3. Run it',
      '4. Test upload at https://prismy.in/app',
      '',
      'WARNING: This disables security. Re-enable with proper policies later.',
    ],
    timestamp: new Date().toISOString(),
  })
}
