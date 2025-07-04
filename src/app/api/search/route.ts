import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const status = searchParams.get('status')?.split(',') || []
    const languages = searchParams.get('lang')?.split(',') || []
    const fileTypes = searchParams.get('type')?.split(',') || []
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('size') || '20')

    // Build base query for documents
    let documentsQuery = supabase
      .from('documents')
      .select(`
        id,
        file_name,
        file_size,
        file_type,
        status,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)

    // Apply filters
    if (status.length > 0) {
      documentsQuery = documentsQuery.in('status', status)
    }

    if (fileTypes.length > 0) {
      documentsQuery = documentsQuery.in('file_type', fileTypes)
    }

    // Apply text search if query provided
    if (query) {
      documentsQuery = documentsQuery.ilike('file_name', `%${query}%`)
    }

    // Execute query with pagination
    const { data: documents, error: docError, count } = await documentsQuery
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (docError) {
      console.error('Documents query error:', docError)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    // Build query for translations
    let translationsQuery = supabase
      .from('translations')
      .select(`
        id,
        source_language,
        target_language,
        status,
        created_at,
        completed_at,
        documents!inner(
          id,
          file_name,
          file_size,
          file_type
        )
      `)
      .eq('user_id', user.id)

    if (languages.length > 0) {
      translationsQuery = translationsQuery.in('target_language', languages)
    }

    if (status.length > 0) {
      translationsQuery = translationsQuery.in('status', status)
    }

    if (query) {
      translationsQuery = translationsQuery.ilike('documents.file_name', `%${query}%`)
    }

    const { data: translations, error: transError } = await translationsQuery
      .order('created_at', { ascending: false })
      .limit(pageSize)

    if (transError) {
      console.error('Translations query error:', transError)
    }

    // Process results
    const results = []

    // Add document results
    if (documents) {
      for (const doc of documents) {
        let score = 50 // Base score

        if (query) {
          const fileName = doc.file_name.toLowerCase()
          const queryLower = query.toLowerCase()
          
          if (fileName === queryLower) score += 100
          else if (fileName.includes(queryLower)) score += 80
        }

        // Status bonus
        if (doc.status === 'uploaded') score += 10
        if (doc.status === 'translated') score += 20

        results.push({
          id: doc.id,
          type: 'document',
          title: doc.file_name,
          excerpt: `${formatFileSize(doc.file_size)} • ${doc.file_type} • Status: ${doc.status}`,
          relevanceScore: score,
          metadata: {
            status: doc.status,
            fileType: doc.file_type,
            fileSize: doc.file_size,
            createdAt: doc.created_at,
            updatedAt: doc.updated_at
          },
          highlights: query ? [highlightText(doc.file_name, query)] : []
        })
      }
    }

    // Add translation results
    if (translations) {
      for (const trans of translations) {
        let score = 40 // Base score for translations

        if (query && trans.documents && typeof trans.documents === 'object' && !Array.isArray(trans.documents)) {
          const docData = trans.documents as unknown as Record<string, unknown>
          const fileName = String(docData.file_name || '').toLowerCase()
          const queryLower = query.toLowerCase()
          
          if (fileName.includes(queryLower)) score += 60
        }

        if (languages.includes(trans.target_language)) score += 30

        const docData = trans.documents as unknown as Record<string, unknown>
        results.push({
          id: trans.id,
          type: 'translation',
          title: `${String(docData?.file_name || 'Unknown')} (${trans.target_language})`,
          excerpt: `Translation to ${trans.target_language}`,
          relevanceScore: score,
          metadata: {
            status: trans.status,
            language: trans.target_language,
            fileType: String(docData?.file_type || ''),
            createdAt: trans.created_at
          },
          highlights: []
        })
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore)

    // Generate facets
    const facets = await generateFacets(user.id, supabase)

    return NextResponse.json({
      results,
      totalCount: count || 0,
      facets,
      searchTime: Date.now() - Date.now() // Placeholder
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function highlightText(text: string, query: string): string {
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

async function generateFacets(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    // Get status counts
    const { data: statusCounts } = await supabase
      .from('documents')
      .select('status')
      .eq('user_id', userId)

    // Get language counts
    const { data: languageCounts } = await supabase
      .from('translations')
      .select('target_language')
      .eq('user_id', userId)

    // Get file type counts
    const { data: fileTypeCounts } = await supabase
      .from('documents')
      .select('file_type')
      .eq('user_id', userId)

    return {
      status: countBy(statusCounts || [], 'status'),
      languages: countBy(languageCounts || [], 'target_language'),
      fileTypes: countBy(fileTypeCounts || [], 'file_type')
    }
  } catch (error) {
    console.error('Facets generation error:', error)
    return { status: {}, languages: {}, fileTypes: {} }
  }
}

function countBy(array: Record<string, unknown>[], key: string): Record<string, number> {
  return array.reduce((acc: Record<string, number>, item) => {
    const value = String(item[key] || '')
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}