import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      // Supabase
      supabase_url: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        valid: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase') || false,
        masked: process.env.NEXT_PUBLIC_SUPABASE_URL 
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...` 
          : 'NOT_SET'
      },
      supabase_anon_key: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        valid: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length > 100 || false,
        masked: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
          ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` 
          : 'NOT_SET'
      },
      supabase_service_key: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        valid: process.env.SUPABASE_SERVICE_ROLE_KEY?.length > 100 || false,
        masked: process.env.SUPABASE_SERVICE_ROLE_KEY 
          ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` 
          : 'NOT_SET'
      },
      
      // AI APIs
      openai_key: {
        exists: !!process.env.OPENAI_API_KEY,
        valid: process.env.OPENAI_API_KEY?.startsWith('sk-') || false,
        masked: process.env.OPENAI_API_KEY 
          ? `sk-...${process.env.OPENAI_API_KEY.slice(-4)}` 
          : 'NOT_SET'
      },
      anthropic_key: {
        exists: !!process.env.ANTHROPIC_API_KEY,
        valid: process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-') || false,
        masked: process.env.ANTHROPIC_API_KEY 
          ? `sk-ant-...${process.env.ANTHROPIC_API_KEY.slice(-4)}` 
          : 'NOT_SET'
      },
      
      // Feature Flags
      mvp_mode: process.env.MVP_MODE || 'NOT_SET',
      pipeline_v2: process.env.NEXT_PUBLIC_PIPELINE_V2 || 'NOT_SET',
      
      // App Config
      app_url: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
      environment_type: process.env.NEXT_PUBLIC_ENVIRONMENT || 'NOT_SET'
    },
    
    summary: {
      total_vars: 8,
      configured: 0,
      missing: 0
    }
  }
  
  // Calculate summary
  const checks = envCheck.checks
  envCheck.summary.configured = Object.values(checks).filter(check => 
    typeof check === 'object' && check.exists
  ).length + (checks.mvp_mode !== 'NOT_SET' ? 1 : 0) + (checks.pipeline_v2 !== 'NOT_SET' ? 1 : 0)
  
  envCheck.summary.missing = envCheck.summary.total_vars - envCheck.summary.configured
  
  return NextResponse.json(envCheck)
}