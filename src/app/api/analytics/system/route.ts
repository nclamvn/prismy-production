import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication and admin privileges
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = user.email?.includes('admin') || false
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('end') || new Date().toISOString()

    // Get document statistics
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('file_size, file_type, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (docError) {
      throw new Error(`Documents query failed: ${docError.message}`)
    }

    // Get translation statistics
    const { data: translations, error: transError } = await supabase
      .from('translations')
      .select('target_language, status, created_at, completed_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (transError) {
      throw new Error(`Translations query failed: ${transError.message}`)
    }

    // Get user activity statistics
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (userError) {
      console.warn('User profiles query failed:', userError)
    }

    // Calculate system metrics
    const totalUploads = documents?.length || 0
    const totalTranslations = translations?.length || 0
    const storageUsage = documents?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0
    const averageFileSize = totalUploads > 0 ? storageUsage / totalUploads : 0

    // Calculate popular languages
    const languageCounts: Record<string, number> = {}
    translations?.forEach(trans => {
      if (trans.target_language) {
        languageCounts[trans.target_language] = (languageCounts[trans.target_language] || 0) + 1
      }
    })

    const popularLanguages = Object.entries(languageCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([language, count]) => ({ language, count }))

    // Calculate processing times
    const completedTranslations = translations?.filter(t => 
      t.completed_at && t.created_at && t.status === 'completed'
    ) || []

    const processingTimes = completedTranslations.map(t => {
      const start = new Date(t.created_at).getTime()
      const end = new Date(t.completed_at!).getTime()
      return end - start
    })

    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0

    const medianProcessingTime = processingTimes.length > 0
      ? processingTimes.sort((a, b) => a - b)[Math.floor(processingTimes.length / 2)]
      : 0

    // Calculate uploads by date
    const uploadsByDate: Record<string, number> = {}
    documents?.forEach(doc => {
      const date = new Date(doc.created_at).toISOString().split('T')[0]
      uploadsByDate[date] = (uploadsByDate[date] || 0) + 1
    })

    const uploadsArray = Object.entries(uploadsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate translations by date
    const translationsByDate: Record<string, number> = {}
    translations?.forEach(trans => {
      const date = new Date(trans.created_at).toISOString().split('T')[0]
      translationsByDate[date] = (translationsByDate[date] || 0) + 1
    })

    const translationsArray = Object.entries(translationsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate user activity
    const activeUsers = users?.length || 0
    const newUsers = users?.filter(u => 
      new Date(u.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length || 0

    const systemMetrics = {
      totalUploads,
      totalTranslations,
      averageFileSize,
      popularLanguages,
      uploadsByDate: uploadsArray,
      translationsByDate: translationsArray,
      userActivity: {
        activeUsers,
        newUsers
      },
      storageUsage,
      processingTime: {
        average: averageProcessingTime,
        median: medianProcessingTime
      }
    }

    return NextResponse.json(systemMetrics)

  } catch (error) {
    console.error('System analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}