import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()
    
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    return NextResponse.json(document)
  } catch (error) {
    console.error('Document API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}