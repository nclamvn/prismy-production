'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Eye, MoreHorizontal, Search, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Mock data for demonstration
const mockDocuments = [
  {
    id: '1',
    name: 'Business_Plan_2024.pdf',
    originalLanguage: 'English',
    translatedTo: ['Vietnamese', 'Japanese'],
    uploadedAt: '2024-01-15',
    status: 'completed',
    size: '2.4 MB'
  },
  {
    id: '2', 
    name: 'Technical_Manual.docx',
    originalLanguage: 'English',
    translatedTo: ['Vietnamese'],
    uploadedAt: '2024-01-14',
    status: 'processing',
    size: '1.8 MB'
  },
  {
    id: '3',
    name: 'Contract_Agreement.pdf',
    originalLanguage: 'Vietnamese',
    translatedTo: ['English'],
    uploadedAt: '2024-01-13',
    status: 'completed',
    size: '890 KB'
  }
]

const statusColors = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
}

export default function DocumentsPage() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage your uploaded documents and their translations
          </p>
        </div>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Upload New
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        {mockDocuments.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-medium">{doc.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Original: {doc.originalLanguage}</span>
                      <span>•</span>
                      <span>Translated to: {doc.translatedTo.join(', ')}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.uploadedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge 
                    variant="secondary"
                    className={statusColors[doc.status as keyof typeof statusColors]}
                  >
                    {doc.status}
                  </Badge>
                  
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Translations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.1 MB</div>
            <p className="text-xs text-muted-foreground">of 1 GB limit</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}