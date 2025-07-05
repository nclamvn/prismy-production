import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()
    
    // Get document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    if (document.status !== 'completed' || !document.output_file_path) {
      return NextResponse.json({ error: 'Document not ready for download' }, { status: 400 })
    }
    
    // Get download URL
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.output_file_path, 3600) // 1 hour expiry
    
    if (downloadError) {
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      downloadUrl: downloadData.signedUrl,
      filename: `translated-${document.filename}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    })
  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}