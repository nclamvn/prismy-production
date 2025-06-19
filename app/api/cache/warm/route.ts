import { NextRequest, NextResponse } from 'next/server'
import { redisTranslationCache } from '@/lib/redis-translation-cache'
import { createServiceRoleClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request or admin user
    const authHeader = request.headers.get('authorization')
    const adminKey = process.env.ADMIN_API_KEY || 'default-admin-key'
    
    if (authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()
    
    // Get popular translations from database for cache warming
    const { data: popularTranslations, error } = await supabase
      .from('translation_history')
      .select(`
        source_text,
        translated_text,
        source_language,
        target_language,
        quality_tier,
        quality_score,
        character_count
      `)
      .not('source_text', 'is', null)
      .not('translated_text', 'is', null)
      .gte('quality_score', 0.8) // Only high-quality translations
      .order('created_at', { ascending: false })
      .limit(1000) // Top 1000 recent translations

    if (error) {
      throw error
    }

    if (!popularTranslations || popularTranslations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No translations found for cache warming',
        warmed: 0
      })
    }

    // Group by language pairs and text to avoid duplicates
    const uniqueTranslations = new Map<string, any>()
    
    popularTranslations.forEach(translation => {
      const key = `${translation.source_text}|${translation.source_language}|${translation.target_language}|${translation.quality_tier || 'standard'}`
      
      if (!uniqueTranslations.has(key)) {
        uniqueTranslations.set(key, {
          text: translation.source_text,
          sourceLang: translation.source_language,
          targetLang: translation.target_language,
          translation: {
            translatedText: translation.translated_text,
            sourceLang: translation.source_language,
            targetLang: translation.target_language,
            confidence: 0.95, // Default confidence for cached items
            qualityScore: translation.quality_score || 0.95,
            timestamp: new Date().toISOString(),
            qualityTier: translation.quality_tier || 'standard'
          }
        })
      }
    })

    const warmingData = Array.from(uniqueTranslations.values())
    
    // Warm the cache
    await redisTranslationCache.warmCache(warmingData)
    
    // Also get common business/technical phrases for warming
    const commonPhrases = getCommonBusinessPhrases()
    
    return NextResponse.json({
      success: true,
      message: 'Cache warming completed successfully',
      stats: {
        uniqueTranslations: warmingData.length,
        totalFound: popularTranslations.length,
        commonPhrasesAvailable: commonPhrases.length
      },
      recommendations: [
        'Cache warming completed with recent high-quality translations',
        'Consider running cache warming daily during low-traffic periods',
        'Monitor cache hit rates to optimize warming strategy'
      ]
    })

  } catch (error) {
    console.error('Cache warming error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to warm cache',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Common business and technical phrases for Vietnamese market
function getCommonBusinessPhrases(): Array<{
  text: string
  sourceLang: string
  targetLang: string
  category: string
}> {
  return [
    // Business phrases EN -> VI
    { text: 'Thank you for your business', sourceLang: 'en', targetLang: 'vi', category: 'business' },
    { text: 'Please review the contract', sourceLang: 'en', targetLang: 'vi', category: 'business' },
    { text: 'We appreciate your partnership', sourceLang: 'en', targetLang: 'vi', category: 'business' },
    { text: 'Invoice payment is due', sourceLang: 'en', targetLang: 'vi', category: 'business' },
    { text: 'Meeting scheduled for tomorrow', sourceLang: 'en', targetLang: 'vi', category: 'business' },
    
    // Technical phrases EN -> VI
    { text: 'System maintenance required', sourceLang: 'en', targetLang: 'vi', category: 'technical' },
    { text: 'Database backup completed', sourceLang: 'en', targetLang: 'vi', category: 'technical' },
    { text: 'API endpoint not responding', sourceLang: 'en', targetLang: 'vi', category: 'technical' },
    { text: 'Authentication failed', sourceLang: 'en', targetLang: 'vi', category: 'technical' },
    { text: 'Server configuration updated', sourceLang: 'en', targetLang: 'vi', category: 'technical' },
    
    // Business phrases VI -> EN
    { text: 'Cảm ơn quý khách hàng', sourceLang: 'vi', targetLang: 'en', category: 'business' },
    { text: 'Vui lòng xem xét hợp đồng', sourceLang: 'vi', targetLang: 'en', category: 'business' },
    { text: 'Chúng tôi đánh giá cao sự hợp tác', sourceLang: 'vi', targetLang: 'en', category: 'business' },
    { text: 'Hóa đơn đến hạn thanh toán', sourceLang: 'vi', targetLang: 'en', category: 'business' },
    { text: 'Cuộc họp được lên lịch vào ngày mai', sourceLang: 'vi', targetLang: 'en', category: 'business' },
    
    // Technical phrases VI -> EN
    { text: 'Bảo trì hệ thống cần thiết', sourceLang: 'vi', targetLang: 'en', category: 'technical' },
    { text: 'Sao lưu cơ sở dữ liệu hoàn tất', sourceLang: 'vi', targetLang: 'en', category: 'technical' },
    { text: 'API endpoint không phản hồi', sourceLang: 'vi', targetLang: 'en', category: 'technical' },
    { text: 'Xác thực thất bại', sourceLang: 'vi', targetLang: 'en', category: 'technical' },
    { text: 'Cấu hình máy chủ đã được cập nhật', sourceLang: 'vi', targetLang: 'en', category: 'technical' },
  ]
}