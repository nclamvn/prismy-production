/**
 * Document Preview Component
 * 
 * Displays translated documents in an iframe with controls
 * Supports PDF, DOCX preview, and text formats
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/design-system/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/components/card'
import { Spinner } from '@/design-system/components/loading'
import { Badge } from '@/design-system/components/badge'
import { Download, Eye, ZoomIn, ZoomOut, RotateCw, Maximize } from 'lucide-react'

interface DocumentPreviewProps {
  translationId: string
  documentTitle: string
  format: 'pdf' | 'docx' | 'txt' | 'md'
  previewUrl?: string
  downloadUrl?: string
  onDownload?: () => void
  className?: string
}

interface PreviewState {
  loading: boolean
  error: string | null
  zoom: number
  rotation: number
  fullscreen: boolean
}

export function DocumentPreview({
  translationId,
  documentTitle,
  format,
  previewUrl,
  downloadUrl,
  onDownload,
  className = ''
}: DocumentPreviewProps) {
  const [state, setState] = useState<PreviewState>({
    loading: true,
    error: null,
    zoom: 100,
    rotation: 0,
    fullscreen: false
  })
  
  const [previewContent, setPreviewContent] = useState<string>('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load preview content
  useEffect(() => {
    if (previewUrl) {
      loadPreviewContent()
    } else {
      // Generate preview from translation
      generatePreview()
    }
  }, [previewUrl, translationId])

  const loadPreviewContent = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      if (format === 'txt' || format === 'md') {
        // For text formats, fetch content directly
        const response = await fetch(previewUrl!)
        const content = await response.text()
        setPreviewContent(content)
      }
      
      setState(prev => ({ ...prev, loading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load preview'
      }))
    }
  }

  const generatePreview = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      // Fetch translation data to generate preview
      const response = await fetch(`/api/translation/status/${translationId}`)
      const data = await response.json()
      
      if (data.translatedText) {
        setPreviewContent(data.translatedText)
      } else {
        throw new Error('No translated content available')
      }
      
      setState(prev => ({ ...prev, loading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to generate preview'
      }))
    }
  }

  const handleZoomIn = () => {
    setState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 25, 300) }))
  }

  const handleZoomOut = () => {
    setState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 25, 25) }))
  }

  const handleRotate = () => {
    setState(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))
  }

  const handleFullscreen = () => {
    if (!state.fullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.()
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.()
    }
    setState(prev => ({ ...prev, fullscreen: !prev.fullscreen }))
  }

  const handleDownload = async () => {
    if (downloadUrl) {
      // Use provided download URL
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = documentTitle
      link.click()
    } else {
      // Trigger download via API
      try {
        const response = await fetch(`/api/translation/${translationId}/download`)
        const blob = await response.blob()
        
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = documentTitle
        link.click()
        
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Download failed:', error)
      }
    }
    
    onDownload?.()
  }

  const renderPreviewContent = () => {
    if (state.loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
          <span className="ml-2 text-sm text-gray-600">Loading preview...</span>
        </div>
      )
    }

    if (state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="text-red-500 mb-4">
            <Eye className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Preview Unavailable
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {state.error}
          </p>
          <Button variant="outline" onClick={generatePreview}>
            Retry Preview
          </Button>
        </div>
      )
    }

    switch (format) {
      case 'pdf':
        return previewUrl ? (
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-96 border-0"
            style={{
              transform: `scale(${state.zoom / 100}) rotate(${state.rotation}deg)`,
              transformOrigin: 'center center'
            }}
            title={`Preview of ${documentTitle}`}
          />
        ) : (
          <div className="bg-gray-50 p-8 rounded h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <Eye className="h-8 w-8 mx-auto" />
              </div>
              <p className="text-sm text-gray-600">
                PDF preview will be available after processing
              </p>
            </div>
          </div>
        )

      case 'docx':
        return (
          <div className="bg-white p-6 border rounded h-96 overflow-auto">
            <div 
              className="prose max-w-none"
              style={{
                transform: `scale(${state.zoom / 100})`,
                transformOrigin: 'top left'
              }}
            >
              <div className="whitespace-pre-wrap">{previewContent}</div>
            </div>
          </div>
        )

      case 'txt':
        return (
          <div className="bg-gray-50 p-4 border rounded h-96 overflow-auto">
            <pre 
              className="text-sm font-mono whitespace-pre-wrap"
              style={{
                transform: `scale(${state.zoom / 100})`,
                transformOrigin: 'top left'
              }}
            >
              {previewContent}
            </pre>
          </div>
        )

      case 'md':
        return (
          <div className="bg-white p-6 border rounded h-96 overflow-auto">
            <div 
              className="prose max-w-none"
              style={{
                transform: `scale(${state.zoom / 100})`,
                transformOrigin: 'top left'
              }}
            >
              <div className="whitespace-pre-wrap">{previewContent}</div>
            </div>
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-96 bg-gray-50 border rounded">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <Eye className="h-8 w-8 mx-auto" />
              </div>
              <p className="text-sm text-gray-600">
                Preview not supported for this format
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{documentTitle}</CardTitle>
            <CardDescription>
              Translated document preview
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {format.toUpperCase()}
            </Badge>
            {state.zoom !== 100 && (
              <Badge variant="outline" className="text-xs">
                {state.zoom}%
              </Badge>
            )}
          </div>
        </div>

        {/* Preview Controls */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={state.zoom <= 25}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-gray-600 min-w-[3rem] text-center">
              {state.zoom}%
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={state.zoom >= 300}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            {format === 'pdf' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotate}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleFullscreen}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleDownload}
            disabled={state.loading}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent ref={containerRef}>
        {renderPreviewContent()}
      </CardContent>
    </Card>
  )
}