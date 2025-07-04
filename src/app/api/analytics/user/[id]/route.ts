import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = await params

    // Users can only access their own metrics (or admins can access any)
    const isAdmin = user.email?.includes('admin') || false
    if (userId !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user's document stats
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('file_size, created_at')
      .eq('user_id', userId)

    if (docError) {
      throw new Error(`Documents query failed: ${docError.message}`)
    }

    // Get user's translation stats
    const { data: translations, error: transError } = await supabase
      .from('translations')
      .select('target_language, created_at, completed_at')
      .eq('user_id', userId)

    if (transError) {
      throw new Error(`Translations query failed: ${transError.message}`)
    }

    // Get user profile info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('created_at')
      .eq('user_id', userId)
      .maybeSingle()

    // Calculate metrics
    const totalUploads = documents?.length || 0
    const totalTranslations = translations?.length || 0
    const storageUsed = documents?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0

    // Calculate favorite languages
    const languageCounts: Record<string, number> = {}
    translations?.forEach(trans => {
      if (trans.target_language) {
        languageCounts[trans.target_language] = (languageCounts[trans.target_language] || 0) + 1
      }
    })

    const favoriteLanguages = Object.entries(languageCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([lang]) => lang)

    // Calculate average processing time
    const completedTranslations = translations?.filter(t => t.completed_at && t.created_at) || []
    const processingTimes = completedTranslations.map(t => {
      const start = new Date(t.created_at).getTime()
      const end = new Date(t.completed_at!).getTime()
      return end - start
    })

    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0

    // Get last activity
    const lastActivity = Math.max(
      ...documents?.map(d => new Date(d.created_at).getTime()) || [0],
      ...translations?.map(t => new Date(t.created_at).getTime()) || [0]
    )

    const userMetrics = {
      userId,
      totalUploads,
      totalTranslations,
      storageUsed,
      lastActive: lastActivity > 0 ? new Date(lastActivity) : new Date(),
      joinDate: profile?.created_at ? new Date(profile.created_at) : new Date(),
      favoriteLanguages,
      averageProcessingTime
    }

    return NextResponse.json(userMetrics)

  } catch (error) {
    console.error('User analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}