import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface AnalyticsEvent {
  event_type: string
  event_data: Record<string, unknown>
  user_id?: string
  session_id?: string
  timestamp: string
  ip_address?: string
  user_agent?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Parse the analytics event
    const event: AnalyticsEvent = await request.json()

    // Get IP address from request headers
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') ||
               'unknown'

    // Validate required fields
    if (!event.event_type) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      )
    }

    // Store the analytics event
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: event.event_type,
        event_data: event.event_data || {},
        user_id: event.user_id || null,
        session_id: event.session_id || null,
        ip_address: event.ip_address || ip,
        user_agent: event.user_agent || request.headers.get('user-agent'),
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Analytics storage error:', error)
      return NextResponse.json(
        { error: 'Failed to store analytics event' },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}