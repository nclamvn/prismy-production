import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

interface DocumentChatRequest {
  documentId: string
  message: string
  conversationHistory?: ChatMessage[]
  language?: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface DocumentChatResponse {
  success: boolean
  response: string
  confidence: number
  sources?: string[]
  suggestions?: string[]
}

/**
 * Document Chat API
 * Enables intelligent Q&A with uploaded documents
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
      message,
      conversationHistory = [],
      language = 'en',
    }: DocumentChatRequest = body

    if (!documentId || !message) {
      return NextResponse.json(
        { error: 'Document ID and message are required' },
        { status: 400 }
      )
    }

    // For now, we'll use a simplified approach without database dependency
    // In production, you would fetch from the tasks table
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

    // For simplified demo, accept content directly from the request
    const requestedContent = body.documentContent
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
        { error: 'Document content not available for chat' },
        { status: 400 }
      )
    }

    console.log('💬 Processing document chat', {
      documentId,
      messageLength: message.length,
      contentLength: documentContent.length,
      conversationLength: conversationHistory.length,
      language,
    })

    // Generate contextual response
    const chatResponse = await generateDocumentResponse(
      message,
      documentContent,
      conversationHistory,
      language,
      document.metadata
    )

    // Store conversation in database
    const conversationEntry = {
      document_id: documentId,
      user_id: session.user.id,
      user_message: message,
      assistant_response: chatResponse.response,
      confidence: chatResponse.confidence,
      language,
      created_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabase
      .from('document_conversations')
      .insert(conversationEntry)

    if (insertError) {
      console.error('Error storing conversation:', insertError)
      // Continue even if storage fails
    }

    return NextResponse.json({
      success: true,
      ...chatResponse,
      message: 'Response generated successfully',
    })
  } catch (error) {
    console.error('Document chat error:', error)
    return NextResponse.json(
      {
        error: 'Chat processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Generate intelligent response based on document content and user question
 */
async function generateDocumentResponse(
  userMessage: string,
  documentContent: string,
  conversationHistory: ChatMessage[],
  language: string,
  documentMetadata: any
): Promise<DocumentChatResponse> {
  try {
    const lowerMessage = userMessage.toLowerCase()
    const documentLower = documentContent.toLowerCase()

    // Analyze the user's question
    const questionType = analyzeQuestionType(userMessage, language)

    // Find relevant content sections
    const relevantSections = findRelevantContent(userMessage, documentContent)

    // Generate response based on question type
    let response = ''
    let confidence = 0.7
    let sources: string[] = []
    let suggestions: string[] = []

    switch (questionType) {
      case 'summary':
        response = generateSummaryResponse(documentContent, language)
        confidence = 0.85
        suggestions = getSummaryRelatedSuggestions(language)
        break

      case 'search':
        const searchResult = performContentSearch(
          userMessage,
          documentContent,
          language
        )
        response = searchResult.response
        confidence = searchResult.confidence
        sources = searchResult.sources
        suggestions = getSearchRelatedSuggestions(language)
        break

      case 'translation':
        response = generateTranslationResponse(language)
        confidence = 0.9
        suggestions = getTranslationRelatedSuggestions(language)
        break

      case 'analysis':
        response = generateAnalysisResponse(
          documentContent,
          userMessage,
          language
        )
        confidence = 0.75
        suggestions = getAnalysisRelatedSuggestions(language)
        break

      case 'specific':
        const specificResult = answerSpecificQuestion(
          userMessage,
          documentContent,
          language
        )
        response = specificResult.response
        confidence = specificResult.confidence
        sources = specificResult.sources
        suggestions = getSpecificQuestionSuggestions(language)
        break

      default:
        response = generateGeneralResponse(
          userMessage,
          documentContent,
          language
        )
        confidence = 0.65
        suggestions = getGeneralSuggestions(language)
    }

    // Add context from conversation history if relevant
    if (conversationHistory.length > 0) {
      const contextualResponse = addConversationContext(
        response,
        conversationHistory,
        language
      )
      if (contextualResponse !== response) {
        response = contextualResponse
        confidence = Math.min(confidence + 0.1, 0.95)
      }
    }

    console.log('✅ Generated document response', {
      questionType,
      responseLength: response.length,
      confidence,
      sourcesFound: sources.length,
      suggestionsProvided: suggestions.length,
    })

    return {
      success: true,
      response,
      confidence,
      sources: sources.length > 0 ? sources : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    }
  } catch (error) {
    console.error('Error generating document response:', error)

    // Fallback response
    return {
      success: true,
      response:
        language === 'vi'
          ? 'Xin lỗi, tôi đang gặp khó khăn trong việc phân tích câu hỏi của bạn. Vui lòng thử đặt câu hỏi khác hoặc cụ thể hơn.'
          : "Sorry, I'm having difficulty analyzing your question. Please try asking something else or be more specific.",
      confidence: 0.3,
    }
  }
}

/**
 * Analyze what type of question the user is asking
 */
function analyzeQuestionType(message: string, language: string): string {
  const lower = message.toLowerCase()

  // Summary questions
  const summaryKeywords =
    language === 'vi'
      ? ['tóm tắt', 'tổng kết', 'nói chung', 'tóm gọn', 'tóm lược']
      : [
          'summary',
          'summarize',
          'overview',
          'main points',
          'key points',
          'gist',
        ]

  if (summaryKeywords.some(keyword => lower.includes(keyword))) {
    return 'summary'
  }

  // Translation questions
  const translationKeywords =
    language === 'vi'
      ? ['dịch', 'translate', 'dịch thuật', 'chuyển ngữ']
      : ['translate', 'translation', 'convert', 'language']

  if (translationKeywords.some(keyword => lower.includes(keyword))) {
    return 'translation'
  }

  // Search/Find questions
  const searchKeywords =
    language === 'vi'
      ? ['tìm', 'ở đâu', 'có', 'nói về', 'đề cập']
      : ['find', 'where', 'locate', 'search', 'contains', 'mentions']

  if (searchKeywords.some(keyword => lower.includes(keyword))) {
    return 'search'
  }

  // Analysis questions
  const analysisKeywords =
    language === 'vi'
      ? ['phân tích', 'đánh giá', 'nhận xét', 'ý kiến', 'quan điểm']
      : ['analyze', 'analysis', 'evaluate', 'opinion', 'perspective', 'insight']

  if (analysisKeywords.some(keyword => lower.includes(keyword))) {
    return 'analysis'
  }

  // Specific questions (who, what, when, where, why, how)
  const specificKeywords =
    language === 'vi'
      ? ['ai', 'gì', 'khi nào', 'ở đâu', 'tại sao', 'như thế nào', 'bao nhiêu']
      : ['who', 'what', 'when', 'where', 'why', 'how', 'which', 'how many']

  if (specificKeywords.some(keyword => lower.includes(keyword))) {
    return 'specific'
  }

  return 'general'
}

/**
 * Find relevant content sections based on the user's question
 */
function findRelevantContent(query: string, content: string): string[] {
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)

  const relevantSentences = sentences
    .map(sentence => ({
      sentence: sentence.trim(),
      relevance: queryWords.reduce((score, word) => {
        return score + (sentence.toLowerCase().includes(word) ? 1 : 0)
      }, 0),
    }))
    .filter(item => item.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3)
    .map(item => item.sentence)

  return relevantSentences
}

/**
 * Generate summary response
 */
function generateSummaryResponse(content: string, language: string): string {
  const wordCount = content.split(/\s+/).length
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)

  // Get first few meaningful sentences as summary
  const keySentences = sentences
    .filter(s => s.length > 50)
    .slice(0, 3)
    .map(s => s.trim())

  if (language === 'vi') {
    return `📄 **Tóm tắt tài liệu:**

${keySentences.length > 0 ? keySentences.join('. ') + '.' : 'Tài liệu chứa thông tin cấu trúc rõ ràng.'}

**Thống kê:**
• ${wordCount} từ trong ${paragraphs.length} đoạn văn
• ${sentences.length} câu
• Độ phức tạp: ${wordCount > 1000 ? 'Cao' : wordCount > 500 ? 'Trung bình' : 'Thấp'}

Tài liệu này phù hợp để dịch thuật và phân tích chi tiết.`
  }

  return `📄 **Document Summary:**

${keySentences.length > 0 ? keySentences.join('. ') + '.' : 'The document contains well-structured information.'}

**Statistics:**
• ${wordCount} words in ${paragraphs.length} paragraphs
• ${sentences.length} sentences
• Complexity: ${wordCount > 1000 ? 'High' : wordCount > 500 ? 'Medium' : 'Low'}

This document is suitable for translation and detailed analysis.`
}

/**
 * Perform content search
 */
function performContentSearch(
  query: string,
  content: string,
  language: string
): {
  response: string
  confidence: number
  sources: string[]
} {
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)

  const matches = sentences
    .filter(sentence => {
      const lowerSentence = sentence.toLowerCase()
      return queryWords.some(word => lowerSentence.includes(word))
    })
    .slice(0, 5)

  if (matches.length === 0) {
    return {
      response:
        language === 'vi'
          ? 'Tôi không tìm thấy thông tin cụ thể về câu hỏi của bạn trong tài liệu này. Bạn có thể thử đặt câu hỏi khác không?'
          : "I couldn't find specific information about your question in this document. Could you try asking something else?",
      confidence: 0.2,
      sources: [],
    }
  }

  const response =
    language === 'vi'
      ? `🔍 **Tìm thấy thông tin liên quan:**\n\n${matches.map((match, i) => `${i + 1}. ${match.trim()}.`).join('\n\n')}`
      : `🔍 **Found relevant information:**\n\n${matches.map((match, i) => `${i + 1}. ${match.trim()}.`).join('\n\n')}`

  return {
    response,
    confidence: Math.min(0.6 + matches.length * 0.1, 0.9),
    sources: matches.slice(0, 3),
  }
}

/**
 * Generate translation response
 */
function generateTranslationResponse(language: string): string {
  if (language === 'vi') {
    return `🌍 **Dịch thuật tài liệu:**

Tôi có thể giúp bạn dịch tài liệu này sang nhiều ngôn ngữ khác nhau. Để bắt đầu quá trình dịch:

1. Chuyển sang tab "Dịch" 
2. Chọn ngôn ngữ đích
3. Chọn tùy chọn "Giữ nguyên định dạng" nếu cần
4. Nhấn "Bắt đầu dịch"

Hệ thống sẽ sử dụng AI tiên tiến để dịch với độ chính xác cao và giữ nguyên cấu trúc tài liệu.`
  }

  return `🌍 **Document Translation:**

I can help you translate this document into various languages. To start the translation process:

1. Switch to the "Translate" tab
2. Select your target language  
3. Choose "Preserve formatting" option if needed
4. Click "Start Translation"

The system will use advanced AI to translate with high accuracy while maintaining the document structure.`
}

/**
 * Generate analysis response
 */
function generateAnalysisResponse(
  content: string,
  question: string,
  language: string
): string {
  const wordCount = content.split(/\s+/).length
  const complexity =
    wordCount > 1000 ? 'high' : wordCount > 500 ? 'medium' : 'low'

  if (language === 'vi') {
    return `📊 **Phân tích tài liệu:**

Dựa trên nội dung tài liệu, tôi có thể đưa ra các nhận định sau:

• **Độ phức tạp:** ${complexity === 'high' ? 'Cao' : complexity === 'medium' ? 'Trung bình' : 'Thấp'}
• **Cấu trúc:** Tài liệu được tổ chức ${wordCount > 1000 ? 'rất có hệ thống' : 'rõ ràng'}
• **Nội dung:** Chứa thông tin ${wordCount > 500 ? 'phong phú và chi tiết' : 'súc tích và dễ hiểu'}

Để có phân tích chi tiết hơn, bạn có thể chuyển sang tab "Phân tích" hoặc hỏi tôi về các khía cạnh cụ thể của tài liệu.`
  }

  return `📊 **Document Analysis:**

Based on the document content, I can provide the following insights:

• **Complexity:** ${complexity.charAt(0).toUpperCase() + complexity.slice(1)}
• **Structure:** The document is ${wordCount > 1000 ? 'very well organized' : 'clearly structured'}
• **Content:** Contains ${wordCount > 500 ? 'rich and detailed information' : 'concise and accessible information'}

For more detailed analysis, you can switch to the "Insights" tab or ask me about specific aspects of the document.`
}

/**
 * Answer specific questions
 */
function answerSpecificQuestion(
  question: string,
  content: string,
  language: string
): {
  response: string
  confidence: number
  sources: string[]
} {
  // This is a simplified implementation
  // In a real system, you would use more sophisticated NLP

  const searchResult = performContentSearch(question, content, language)

  if (searchResult.sources.length > 0) {
    const specificResponse =
      language === 'vi'
        ? `💡 **Trả lời câu hỏi cụ thể:**\n\n${searchResult.response}\n\nĐây là thông tin tôi tìm thấy liên quan đến câu hỏi của bạn.`
        : `💡 **Specific Answer:**\n\n${searchResult.response}\n\nThis is the information I found related to your question.`

    return {
      response: specificResponse,
      confidence: searchResult.confidence,
      sources: searchResult.sources,
    }
  }

  return {
    response:
      language === 'vi'
        ? 'Tôi cần thêm thông tin để trả lời câu hỏi cụ thể của bạn. Bạn có thể đặt câu hỏi chi tiết hơn không?'
        : 'I need more information to answer your specific question. Could you ask something more detailed?',
    confidence: 0.3,
    sources: [],
  }
}

/**
 * Generate general response
 */
function generateGeneralResponse(
  message: string,
  content: string,
  language: string
): string {
  if (language === 'vi') {
    return `Tôi đã nhận được câu hỏi của bạn về tài liệu này. Để tôi có thể hỗ trợ tốt hơn, bạn có thể:

• Hỏi về nội dung cụ thể của tài liệu
• Yêu cầu tóm tắt các điểm chính  
• Muốn dịch tài liệu sang ngôn ngữ khác
• Cần phân tích cấu trúc và nội dung

Hãy đặt câu hỏi cụ thể hơn để tôi có thể giúp bạn hiệu quả nhất!`
  }

  return `I received your question about this document. To better assist you, you can:

• Ask about specific content in the document
• Request a summary of key points
• Want to translate the document to another language  
• Need analysis of structure and content

Please ask more specific questions so I can help you most effectively!`
}

/**
 * Add conversation context
 */
function addConversationContext(
  response: string,
  history: ChatMessage[],
  language: string
): string {
  if (history.length === 0) return response

  const lastUserMessage = history.filter(msg => msg.type === 'user').pop()
  if (!lastUserMessage) return response

  // Simple context addition - in a real system this would be more sophisticated
  const contextNote =
    language === 'vi'
      ? '\n\n*Tiếp tục từ cuộc trò chuyện trước...*'
      : '\n\n*Continuing from our previous conversation...*'

  return response + contextNote
}

/**
 * Suggestion generators
 */
function getSummaryRelatedSuggestions(language: string): string[] {
  return language === 'vi'
    ? [
        'Điểm chính của tài liệu là gì?',
        'Phân tích cấu trúc tài liệu',
        'Dịch tài liệu sang tiếng Anh',
      ]
    : [
        'What are the key points?',
        'Analyze document structure',
        'Translate to Vietnamese',
      ]
}

function getSearchRelatedSuggestions(language: string): string[] {
  return language === 'vi'
    ? [
        'Tìm số liệu quan trọng',
        'Có ngày tháng nào được đề cập?',
        'Tóm tắt nội dung chính',
      ]
    : [
        'Find important numbers',
        'Are there any dates mentioned?',
        'Summarize main content',
      ]
}

function getTranslationRelatedSuggestions(language: string): string[] {
  return language === 'vi'
    ? [
        'Dịch một đoạn cụ thể',
        'Giữ nguyên định dạng khi dịch',
        'Tóm tắt trước khi dịch',
      ]
    : [
        'Translate a specific section',
        'Preserve formatting when translating',
        'Summarize before translating',
      ]
}

function getAnalysisRelatedSuggestions(language: string): string[] {
  return language === 'vi'
    ? [
        'Phân tích tone của tài liệu',
        'Tìm thông tin quan trọng',
        'So sánh với tài liệu khác',
      ]
    : [
        'Analyze document tone',
        'Find important information',
        'Compare with other documents',
      ]
}

function getSpecificQuestionSuggestions(language: string): string[] {
  return language === 'vi'
    ? [
        'Giải thích chi tiết hơn',
        'Có ví dụ cụ thể không?',
        'Thông tin này có đáng tin không?',
      ]
    : [
        'Explain in more detail',
        'Are there specific examples?',
        'Is this information reliable?',
      ]
}

function getGeneralSuggestions(language: string): string[] {
  return language === 'vi'
    ? [
        'Tóm tắt tài liệu',
        'Dịch sang tiếng Anh',
        'Phân tích nội dung',
        'Tìm thông tin cụ thể',
      ]
    : [
        'Summarize document',
        'Translate to Vietnamese',
        'Analyze content',
        'Find specific information',
      ]
}
