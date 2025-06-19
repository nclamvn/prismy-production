import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/analytics-service'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const userId = searchParams.get('userId') // In a real app, get from auth

    // If no user ID provided, return sample data for demo
    if (!userId) {
      logger.info({ period }, 'Fetching sample analytics data for demo')
      
      const sampleData = {
        metrics: {
          totalTranslations: Math.floor(Math.random() * 1000) + 100,
          wordsTranslated: Math.floor(Math.random() * 50000) + 10000,
          avgAccuracy: Math.floor(Math.random() * 10) + 90,
          timeSpent: Math.floor(Math.random() * 100) + 20,
          documentsProcessed: Math.floor(Math.random() * 50) + 10,
          languagePairs: Math.floor(Math.random() * 8) + 3,
          avgWordsPerDay: Math.floor(Math.random() * 500) + 200,
          efficiency: Math.floor(Math.random() * 30) + 70
        },
        trends: {
          translationsGrowth: `+${Math.floor(Math.random() * 30) + 5}%`,
          wordsGrowth: `+${Math.floor(Math.random() * 25) + 10}%`,
          accuracyChange: `+${(Math.random() * 5).toFixed(1)}%`,
          efficiencyChange: `+${(Math.random() * 10).toFixed(1)}%`
        },
        charts: {
          translationsOverTime: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 50) + 20
          })),
          languageUsage: [
            { language: 'EN → VI', percentage: 35, count: 432 },
            { language: 'VI → EN', percentage: 28, count: 345 },
            { language: 'EN → ES', percentage: 15, count: 185 },
            { language: 'JA → EN', percentage: 12, count: 148 },
            { language: 'Others', percentage: 10, count: 124 }
          ]
        }
      }

      return NextResponse.json(sampleData)
    }

    // Get real user metrics
    const userMetrics = await analyticsService.getUserMetrics(userId, period as any)
    
    // Format data for the frontend
    const responseData = {
      metrics: {
        totalTranslations: userMetrics.totalTranslations,
        wordsTranslated: userMetrics.wordsTranslated,
        avgAccuracy: userMetrics.avgAccuracy,
        timeSpent: userMetrics.timeSpent,
        documentsProcessed: userMetrics.documentsProcessed,
        languagePairs: userMetrics.languagePairs,
        avgWordsPerDay: userMetrics.avgWordsPerDay,
        efficiency: userMetrics.efficiency
      },
      trends: {
        translationsGrowth: '+0%', // Would calculate from historical data
        wordsGrowth: '+0%',
        accuracyChange: '+0%',
        efficiencyChange: '+0%'
      },
      charts: {
        translationsOverTime: [], // Would generate from events
        languageUsage: [] // Would generate from translation history
      },
      insights: {
        mostUsedLanguagePair: userMetrics.mostUsedLanguagePair,
        peakUsageHours: userMetrics.peakUsageHours,
        retentionRate: userMetrics.retentionRate,
        sessionCount: userMetrics.sessionCount,
        avgSessionDuration: userMetrics.avgSessionDuration
      }
    }

    logger.info({ userId, period, metrics: userMetrics }, 'User analytics retrieved')
    
    return NextResponse.json(responseData)

  } catch (error) {
    logger.error({ error }, 'Failed to get user analytics')
    
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { eventType, eventData, userId } = await request.json()

    await analyticsService.trackEvent(eventType, eventData, userId)

    return NextResponse.json({ success: true })

  } catch (error) {
    logger.error({ error }, 'Failed to track analytics event')
    
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}