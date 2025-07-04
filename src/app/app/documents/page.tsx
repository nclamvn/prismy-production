import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TranslationForm } from '@/components/translation/translation-form'
import { FileText, Upload, Calendar, HardDrive } from 'lucide-react'

export default async function DocumentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's documents
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'translated':
        return 'bg-purple-100 text-purple-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AppLayout userEmail={user.email}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Documents</h1>
            <p className="text-muted-foreground">
              Manage your uploaded documents and translations
            </p>
          </div>
          <Button asChild>
            <a href="/app/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </a>
          </Button>
        </div>

        {documents && documents.length > 0 ? (
          <div className="grid gap-6">
            {documents.map((document) => (
              <Card key={document.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">{document.file_name}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(document.file_size)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(document.created_at)}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(document.status)}>
                      {document.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p>File Type: {document.file_type}</p>
                      <p>Document ID: {document.id}</p>
                    </div>
                    
                    {/* Translation Form */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-4">Translate this document</h4>
                      <TranslationForm
                        documentId={document.id}
                        documentName={document.file_name}
                        documentSize={document.file_size}
                        onTranslationComplete={(result) => {
                          console.log('Translation completed:', result)
                          // Could refresh the page or update UI here
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Upload your first document to get started with translation. We support PDF, DOCX, DOC, TXT, and MD files.
              </p>
              <Button asChild>
                <a href="/app/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Status */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Day 5 - Translation System Complete</span>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}