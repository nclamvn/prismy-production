'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from '@/components/upload/file-upload'
import { MessageSquare, Upload, FileText, Zap } from 'lucide-react'

export default function WorkspacePage() {
  const [hasFiles, setHasFiles] = useState(false)

  return (
    <div className="h-full flex flex-col">
      {/* Conversation Canvas - Main Content Area */}
      <div className="flex-1 flex flex-col">
        
        {/* Welcome State */}
        {!hasFiles && (
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-2xl mx-auto text-center space-y-8">
              {/* Hero Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Welcome to Prismy Workspace
                </h1>
                <p className="text-lg text-muted-foreground">
                  Your AI-powered document translation co-pilot. Upload documents to start a conversation about translation, analysis, and more.
                </p>
              </div>

              {/* Upload Zone */}
              <div className="border-2 border-dashed border-border rounded-lg p-8">
                <FileUpload 
                  onUploadComplete={(files) => {
                    setHasFiles(files.length > 0)
                  }}
                />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="text-center pb-2">
                    <Upload className="w-6 h-6 text-primary mx-auto mb-2" />
                    <CardTitle className="text-sm">Upload & Translate</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs">
                      Drag and drop documents for instant translation
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="text-center pb-2">
                    <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
                    <CardTitle className="text-sm">Analyze Content</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs">
                      Get insights about document structure and language
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="text-center pb-2">
                    <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                    <CardTitle className="text-sm">Smart Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs">
                      AI-powered suggestions for your documents
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>

              {/* Tips */}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Pro tip:</strong> You can also paste text directly into the chat or drag URLs for web content
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, DOCX, TXT, and more
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Conversation State */}
        {hasFiles && (
          <div className="flex-1 flex flex-col">
            {/* Chat Thread Area */}
            <div className="flex-1 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="text-center py-8">
                  <h2 className="text-xl font-semibold mb-2">Ready to start working!</h2>
                  <p className="text-muted-foreground">
                    Your files are uploaded. Ask me anything about them or request translations.
                  </p>
                </div>
                
                {/* Placeholder for chat messages */}
                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      💬 Chat interface coming soon...
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Input Area */}
            <div className="border-t p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Ask me anything about your documents..."
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled
                    />
                  </div>
                  <Button disabled>Send</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Interactive chat coming in the next update
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}