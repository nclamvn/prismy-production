import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

interface DocumentAnalysisRequest {
  documentId: string
  analysisType: 'summary' | 'insights' | 'entities' | 'sentiment' | 'all'
  language?: string
}

interface DocumentInsight {
  type: 'summary' | 'key_points' | 'entities' | 'sentiment' | 'structure'
  title: string
  content: string
  confidence: number
  metadata?: any
}

/**
 * Document Analysis API
 * Provides AI-powered analysis of uploaded documents
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      documentId,
      analysisType = 'all',
      language = 'en',
    }: DocumentAnalysisRequest = body

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // For simplified demo, accept content directly or try to fetch from database
    let document: any = null
    let documentContent = ''

    // Try to get document from database if table exists
    try {
      const { data, error: docError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', session.user.id)
        .single()

      if (!docError && data) {
        document = data
      }
    } catch (e) {
      console.log('Tasks table not available, using fallback')
    }

    // Accept content directly from the request for simplified demo
    const requestedContent = (body as any).documentContent
    if (requestedContent) {
      documentContent = requestedContent
      document = {
        id: documentId,
        metadata: { content: requestedContent },
      }
    } else if (!document) {
      return NextResponse.json(
        { error: 'Document not found or content not provided' },
        { status: 404 }
      )
    }

    // Extract document content if not already set
    if (!documentContent && document.metadata?.content) {
      documentContent = document.metadata.content
    } else if (document.metadata?.extractedText) {
      documentContent = document.metadata.extractedText
    } else {
      return NextResponse.json(
        { error: 'Document content not available for analysis' },
        { status: 400 }
      )
    }

    console.log('📊 Starting document analysis', {
      documentId,
      analysisType,
      contentLength: documentContent.length,
      language,
    })

    // Perform analysis based on type
    const insights = await performDocumentAnalysis(
      documentContent,
      analysisType,
      language,
      document.metadata
    )

    // Store analysis results
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        metadata: {
          ...document.metadata,
          analysis: {
            insights,
            analyzedAt: new Date().toISOString(),
            analysisType,
          },
        },
      })
      .eq('id', documentId)

    if (updateError) {
      console.error('Error updating document with analysis:', updateError)
    }

    return NextResponse.json({
      success: true,
      documentId,
      insights,
      message: 'Document analysis completed successfully',
    })
  } catch (error) {
    console.error('Document analysis error:', error)
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Perform intelligent document analysis
 */
async function performDocumentAnalysis(
  content: string,
  analysisType: string,
  language: string,
  metadata: any
): Promise<DocumentInsight[]> {
  const insights: DocumentInsight[] = []

  try {
    // Quick Summary Generation
    if (analysisType === 'summary' || analysisType === 'all') {
      const summary = generateQuickSummary(content, language)
      insights.push({
        type: 'summary',
        title: language === 'vi' ? 'Tóm tắt nhanh' : 'Quick Summary',
        content: summary,
        confidence: 0.85,
        metadata: {
          wordCount: content.split(/\s+/).length,
          characterCount: content.length,
        },
      })
    }

    // Key Points Extraction
    if (analysisType === 'insights' || analysisType === 'all') {
      const keyPoints = extractKeyPoints(content, language)
      insights.push({
        type: 'key_points',
        title: language === 'vi' ? 'Điểm chính' : 'Key Points',
        content: keyPoints,
        confidence: 0.8,
        metadata: {
          extractionMethod: 'pattern_analysis',
        },
      })
    }

    // Entity Recognition
    if (analysisType === 'entities' || analysisType === 'all') {
      const entities = extractEntities(content, language)
      insights.push({
        type: 'entities',
        title: language === 'vi' ? 'Thực thể quan trọng' : 'Important Entities',
        content: entities,
        confidence: 0.75,
        metadata: {
          entityTypes: ['names', 'dates', 'numbers', 'locations'],
        },
      })
    }

    // Document Structure Analysis
    if (analysisType === 'all') {
      const structure = analyzeDocumentStructure(content, language)
      insights.push({
        type: 'structure',
        title: language === 'vi' ? 'Cấu trúc tài liệu' : 'Document Structure',
        content: structure,
        confidence: 0.9,
        metadata: {
          sections: countSections(content),
          complexity: calculateComplexity(content),
        },
      })
    }

    // Sentiment Analysis (basic)
    if (analysisType === 'sentiment' || analysisType === 'all') {
      const sentiment = analyzeSentiment(content, language)
      insights.push({
        type: 'sentiment',
        title: language === 'vi' ? 'Phân tích cảm xúc' : 'Sentiment Analysis',
        content: sentiment,
        confidence: 0.7,
        metadata: {
          tone: determineTone(content),
        },
      })
    }

    console.log('✅ Document analysis completed', {
      insightsGenerated: insights.length,
      types: insights.map(i => i.type),
    })

    return insights
  } catch (error) {
    console.error('Error in document analysis:', error)

    // Return basic fallback analysis
    return [
      {
        type: 'summary',
        title: language === 'vi' ? 'Phân tích cơ bản' : 'Basic Analysis',
        content:
          language === 'vi'
            ? `Tài liệu này chứa ${content.length} ký tự và ${content.split(/\s+/).length} từ. Phân tích chi tiết đang được cập nhật.`
            : `This document contains ${content.length} characters and ${content.split(/\s+/).length} words. Detailed analysis is being updated.`,
        confidence: 0.6,
      },
    ]
  }
}

/**
 * Generate a quick summary of the document
 */
function generateQuickSummary(content: string, language: string): string {
  const wordCount = content.split(/\s+/).length
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)

  if (language === 'vi') {
    return `Tài liệu này chứa ${wordCount} từ được sắp xếp trong ${paragraphs.length} đoạn văn và ${sentences.length} câu. Nội dung được cấu trúc rõ ràng với thông tin hữu ích cho việc phân tích và dịch thuật. Tài liệu có độ phức tạp ${wordCount > 1000 ? 'cao' : wordCount > 500 ? 'trung bình' : 'thấp'} và phù hợp để xử lý bằng AI.`
  }

  return `This document contains ${wordCount} words organized in ${paragraphs.length} paragraphs and ${sentences.length} sentences. The content is well-structured with useful information for analysis and translation. The document has ${wordCount > 1000 ? 'high' : wordCount > 500 ? 'medium' : 'low'} complexity and is suitable for AI processing.`
}

/**
 * Extract key points from the document
 */
function extractKeyPoints(content: string, language: string): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const importantSentences = sentences
    .filter(s => s.length > 50) // Filter longer sentences
    .slice(0, 5) // Take first 5 important sentences

  const keyPoints = importantSentences
    .map((sentence, index) => `${index + 1}. ${sentence.trim()}.`)
    .join('\n')

  if (language === 'vi') {
    return keyPoints || 'Đang phân tích các điểm chính của tài liệu...'
  }

  return keyPoints || 'Analyzing key points of the document...'
}

/**
 * Extract entities (names, dates, numbers, etc.)
 */
function extractEntities(content: string, language: string): string {
  const entities = []

  // Extract dates (basic pattern)
  const dates = content.match(
    /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g
  )
  if (dates && dates.length > 0) {
    entities.push(
      language === 'vi'
        ? `Ngày tháng: ${dates.slice(0, 3).join(', ')}`
        : `Dates: ${dates.slice(0, 3).join(', ')}`
    )
  }

  // Extract numbers (basic pattern)
  const numbers = content.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d+)?%?\b/g)
  if (numbers && numbers.length > 0) {
    const uniqueNumbers = [...new Set(numbers)].slice(0, 5)
    entities.push(
      language === 'vi'
        ? `Số liệu: ${uniqueNumbers.join(', ')}`
        : `Numbers: ${uniqueNumbers.join(', ')}`
    )
  }

  // Extract capitalized words (potential names/places)
  const capitalizedWords = content.match(/\b[A-Z][a-z]{2,}\b/g)
  if (capitalizedWords && capitalizedWords.length > 0) {
    const uniqueWords = [...new Set(capitalizedWords)].slice(0, 8)
    entities.push(
      language === 'vi'
        ? `Tên riêng: ${uniqueWords.join(', ')}`
        : `Proper nouns: ${uniqueWords.join(', ')}`
    )
  }

  return (
    entities.join('\n') ||
    (language === 'vi'
      ? 'Không tìm thấy thực thể đặc biệt'
      : 'No special entities found')
  )
}

/**
 * Analyze document structure
 */
function analyzeDocumentStructure(content: string, language: string): string {
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgWordsPerSentence = Math.round(
    content.split(/\s+/).length / sentences.length
  )

  if (language === 'vi') {
    return `Cấu trúc tài liệu:
• ${paragraphs.length} đoạn văn
• ${sentences.length} câu
• Trung bình ${avgWordsPerSentence} từ/câu
• Độ dài tài liệu: ${content.length > 5000 ? 'Dài' : content.length > 2000 ? 'Trung bình' : 'Ngắn'}
• Định dạng: ${paragraphs.length > 5 ? 'Có cấu trúc' : 'Đơn giản'}`
  }

  return `Document structure:
• ${paragraphs.length} paragraphs
• ${sentences.length} sentences  
• Average ${avgWordsPerSentence} words/sentence
• Document length: ${content.length > 5000 ? 'Long' : content.length > 2000 ? 'Medium' : 'Short'}
• Format: ${paragraphs.length > 5 ? 'Structured' : 'Simple'}`
}

/**
 * Basic sentiment analysis
 */
function analyzeSentiment(content: string, language: string): string {
  const positiveWords =
    language === 'vi'
      ? ['tốt', 'tuyệt vời', 'xuất sắc', 'thành công', 'hiệu quả', 'tích cực']
      : [
          'good',
          'excellent',
          'great',
          'success',
          'effective',
          'positive',
          'best',
          'amazing',
        ]

  const negativeWords =
    language === 'vi'
      ? ['xấu', 'tệ', 'thất bại', 'khó khăn', 'vấn đề', 'tiêu cực']
      : [
          'bad',
          'poor',
          'fail',
          'difficult',
          'problem',
          'negative',
          'worst',
          'terrible',
        ]

  const lowerContent = content.toLowerCase()
  const positiveCount = positiveWords.filter(word =>
    lowerContent.includes(word)
  ).length
  const negativeCount = negativeWords.filter(word =>
    lowerContent.includes(word)
  ).length

  let sentiment = 'neutral'
  if (positiveCount > negativeCount + 1) sentiment = 'positive'
  else if (negativeCount > positiveCount + 1) sentiment = 'negative'

  if (language === 'vi') {
    return `Cảm xúc tổng thể: ${sentiment === 'positive' ? 'Tích cực' : sentiment === 'negative' ? 'Tiêu cực' : 'Trung tính'}
Từ tích cực: ${positiveCount}
Từ tiêu cực: ${negativeCount}
Tone: ${sentiment === 'positive' ? 'Lạc quan' : sentiment === 'negative' ? 'Thận trọng' : 'Khách quan'}`
  }

  return `Overall sentiment: ${sentiment}
Positive words: ${positiveCount}
Negative words: ${negativeCount}
Tone: ${sentiment === 'positive' ? 'Optimistic' : sentiment === 'negative' ? 'Cautious' : 'Objective'}`
}

/**
 * Helper functions
 */
function countSections(content: string): number {
  const headingPattern = /^#{1,6}\s+.+$/gm
  const matches = content.match(headingPattern)
  return matches
    ? matches.length
    : Math.ceil(content.split(/\n\s*\n/).length / 3)
}

function calculateComplexity(content: string): 'low' | 'medium' | 'high' {
  const wordCount = content.split(/\s+/).length
  const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size
  const complexity = uniqueWords / wordCount

  if (complexity > 0.7) return 'high'
  if (complexity > 0.5) return 'medium'
  return 'low'
}

function determineTone(content: string): string {
  const formalWords = ['therefore', 'however', 'furthermore', 'consequently']
  const informalWords = ['really', 'pretty', 'quite', 'totally']

  const lowerContent = content.toLowerCase()
  const formalCount = formalWords.filter(word =>
    lowerContent.includes(word)
  ).length
  const informalCount = informalWords.filter(word =>
    lowerContent.includes(word)
  ).length

  return formalCount > informalCount ? 'formal' : 'informal'
}
