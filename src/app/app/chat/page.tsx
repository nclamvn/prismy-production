'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MessageSquare, Download, User, Bot } from 'lucide-react'

interface Message {
  id: string
  sender: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Conversation {
  id: string
  title: string
  document: {
    filename: string
    status: string
    id: string
  }
}

export default function ChatPage() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('conversation')
  
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load conversation and messages
  useEffect(() => {
    if (!conversationId) return

    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/chat?conversationId=${conversationId}`)
        const data = await response.json()
        
        if (data.success) {
          setMessages(data.messages)
        } else {
          setError('Failed to load conversation')
        }
      } catch (err) {
        console.error('Error loading messages:', err)
        setError('Failed to load conversation')
      }
    }

    loadMessages()
  }, [conversationId])

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          message: newMessage.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        // Add both user and AI messages to the list
        setMessages(prev => [
          ...prev,
          data.userMessage,
          data.aiMessage
        ])
        setNewMessage('')
        
        // Store conversation info if not already set
        if (!conversation && data.conversation) {
          setConversation(data.conversation)
        }
      } else {
        setError(data.error || 'Failed to send message')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (format: string) => {
    if (!conversation?.document?.id) return

    try {
      const response = await fetch(`/api/documents/${conversation.document.id}/download/${format}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${conversation.document.filename.replace(/\.[^/.]+$/, '')}_translated.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        setError('Failed to download file')
      }
    } catch (err) {
      console.error('Download error:', err)
      setError('Failed to download file')
    }
  }

  if (!conversationId) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">No conversation selected</h2>
            <p className="text-muted-foreground">Upload a document to start chatting about it.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Chat</h1>
          {conversation && (
            <p className="text-muted-foreground">
              Chatting about: {conversation.document.filename}
            </p>
          )}
        </div>
        
        {/* Download buttons */}
        {conversation && conversation.document.status === 'completed' && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDownload('txt')}
            >
              <Download className="w-4 h-4 mr-2" />
              TXT
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDownload('pdf')}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDownload('docx')}
            >
              <Download className="w-4 h-4 mr-2" />
              DOCX
            </Button>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start by asking something about your document!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>

        {/* Chat Input */}
        <div className="border-t p-4">
          {error && (
            <div className="mb-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask about your document..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || isLoading}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Try asking: "Summarize this document" or "What's the main topic?"
          </p>
        </div>
      </Card>
    </div>
  )
}