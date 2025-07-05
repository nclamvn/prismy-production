'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    }
  }

  const testSimpleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🚀 Testing simple upload...')
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fromLang', 'auto')
      formData.append('toLang', 'vi')

      const response = await fetch('/api/upload-simple', {
        method: 'POST',
        body: formData,
      })

      console.log('📡 Response status:', response.status)
      const data = await response.json()
      console.log('📄 Response data:', data)

      if (response.ok) {
        setResult(data)
      } else {
        setError(`Error ${response.status}: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('❌ Upload error:', err)
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsUploading(false)
    }
  }

  const testFullUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🚀 Testing full upload...')
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fromLang', 'auto')
      formData.append('toLang', 'vi')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('📡 Response status:', response.status)
      const data = await response.json()
      console.log('📄 Response data:', data)

      if (response.ok) {
        setResult(data)
      } else {
        setError(`Error ${response.status}: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('❌ Upload error:', err)
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Debug Upload</h1>
        <p className="text-muted-foreground">Test upload functionality step by step</p>
      </div>

      {/* File Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. Select File</CardTitle>
        </CardHeader>
        <CardContent>
          <input 
            type="file" 
            onChange={handleFileSelect}
            accept=".txt,.pdf,.docx"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          {file && (
            <div className="mt-2 text-sm">
              <p><strong>File:</strong> {file.name}</p>
              <p><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
              <p><strong>Type:</strong> {file.type}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>2. Test Upload APIs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={testSimpleUpload}
              disabled={!file || isUploading}
              variant="outline"
            >
              {isUploading ? 'Testing...' : 'Test Simple Upload'}
            </Button>
            <Button 
              onClick={testFullUpload}
              disabled={!file || isUploading}
            >
              {isUploading ? 'Testing...' : 'Test Full Upload'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Simple upload tests file processing without database. Full upload tests complete flow.
          </p>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">❌ Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
          </CardContent>
        </Card>
      )}

      {/* Result Display */}
      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">✅ Success</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-green-600 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            <p><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
            <p><strong>Console:</strong> Check browser console for detailed logs</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}