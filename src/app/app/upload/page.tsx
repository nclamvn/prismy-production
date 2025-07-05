'use client'

import { UploadDropZone } from '@/components/upload/upload-drop-zone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UploadPage() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Upload Documents</h1>
        <p className="text-muted-foreground">
          Upload your documents for translation, analysis, and AI-powered processing
        </p>
      </div>

      {/* Main Upload Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Zone - Single card with drop zone */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Upload a document</CardTitle>
              <CardDescription>
                PDF, DOCX, DOC, TXT &nbsp;·&nbsp; ≤ 1 GB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadDropZone onUploadComplete={(files) => console.log('Uploaded:', files)} />
            </CardContent>
          </Card>

          {/* Upload History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Uploads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent uploads</p>
                <p className="text-sm">Uploaded files will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Upload className="w-4 h-4 mr-2" />
                Upload from URL
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Paste Text
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Zap className="w-4 h-4 mr-2" />
                Batch Upload
              </Button>
            </CardContent>
          </Card>

          {/* Upload Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Upload Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Max file size:</span>
                <span className="font-medium">100 MB</span>
              </div>
              <div className="flex justify-between">
                <span>Files per hour:</span>
                <span className="font-medium">50</span>
              </div>
              <div className="flex justify-between">
                <span>Concurrent uploads:</span>
                <span className="font-medium">5</span>
              </div>
            </CardContent>
          </Card>

          {/* Supported Formats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Supported Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {['PDF', 'DOCX', 'TXT', 'MD', 'RTF', 'ODT'].map((format) => (
                  <span 
                    key={format}
                    className="px-2 py-1 text-xs bg-muted rounded"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}