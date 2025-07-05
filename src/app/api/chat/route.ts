import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { conversationId, message } = await request.json()
    
    if (!conversationId || !message) {
      return NextResponse.json({ error: 'Missing conversationId or message' }, { status: 400 })
    }
    
    // Verify user owns this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, documents(*)')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()
    
    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    
    // Store user message
    const { data: userMessage, error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender: 'user',
        content: message,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (userMsgError) {
      console.error('User message error:', userMsgError)
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }
    
    // Generate AI response based on document content
    let aiResponse = "I'm processing your request..."
    
    if (conversation.documents?.translated_text) {
      const documentText = conversation.documents.translated_text
      
      // Simple AI response based on message type
      if (message.toLowerCase().includes('summarize') || message.toLowerCase().includes('summary')) {
        const summary = documentText.substring(0, 200) + '...'
        aiResponse = `Here's a summary of your document "${conversation.documents.filename}":\n\n${summary}\n\nWould you like me to elaborate on any specific part?`
      } else if (message.toLowerCase().includes('translate')) {
        aiResponse = `I've already translated your document "${conversation.documents.filename}" from ${conversation.documents.detected_language} to ${conversation.documents.target_language}. The translation is complete and ready for download.`
      } else if (message.toLowerCase().includes('download')) {
        aiResponse = `You can download your translated document using the download button. The file has been processed and is ready for download in your preferred format.`
      } else {
        aiResponse = `I can help you with your document "${conversation.documents.filename}". I can summarize it, explain the translation, or help you with specific questions about the content. What would you like to know?`
      }
    }
    
    // Store AI response
    const { data: aiMessage, error: aiMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender: 'assistant',
        content: aiResponse,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (aiMsgError) {
      console.error('AI message error:', aiMsgError)
      return NextResponse.json({ error: 'Failed to save AI response' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      userMessage,
      aiMessage,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        document: {
          filename: conversation.documents?.filename,
          status: conversation.documents?.status
        }
      }
    })
    
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get conversation messages
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    
    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })
    }
    
    // Get messages for conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    
    if (messagesError) {
      console.error('Messages error:', messagesError)
      return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      messages: messages || []
    })
    
  } catch (error) {
    console.error('Chat GET API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}