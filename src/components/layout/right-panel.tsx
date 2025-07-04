'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  FileText, 
  Download, 
  Share2, 
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'

interface RightPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedFile?: {
    name: string
    size: string
    type: string
    status: 'pending' | 'processing' | 'completed' | 'error'
    uploadedAt: string
    translatedTo?: string[]
  } | null
}

export function RightPanel({ isOpen, onClose, selectedFile }: RightPanelProps) {
  if (!isOpen) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`
      fixed lg:static inset-y-0 right-0 z-40 w-80 bg-background border-l
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
    `}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <h3 className="font-semibold">File Details</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {selectedFile ? (
            <div className="p-4 space-y-6">
              {/* File Info */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <CardTitle className="text-sm">{selectedFile.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Size</span>
                    <span>{selectedFile.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span>{selectedFile.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Uploaded</span>
                    <span>{selectedFile.uploadedAt}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedFile.status)}
                      <Badge variant="secondary" className={getStatusColor(selectedFile.status)}>
                        {selectedFile.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Translation Status */}
              {selectedFile.translatedTo && selectedFile.translatedTo.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Translations</CardTitle>
                    <CardDescription>Available in {selectedFile.translatedTo.length} languages</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {selectedFile.translatedTo.map((lang, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{lang}</span>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Actions */}
              <div className="space-y-2">
                <Button className="w-full" disabled={selectedFile.status !== 'completed'}>
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
                <Button variant="outline" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center p-4">
              <div className="space-y-3">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-sm font-medium">No file selected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a document to view details and download translations
                  </p>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}