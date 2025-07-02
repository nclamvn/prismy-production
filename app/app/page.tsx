'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/useAuth'
import { FileText, Upload, Rocket } from 'lucide-react'
import AgentChat from '@/components/AgentChat'

// Force dynamic rendering to avoid SSR issues with auth
export const dynamic = 'force-dynamic'

export default function WorkspacePage() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle file drag and drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      if (!e.relatedTarget) {
        setIsDragOver(false)
      }
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      // Handle file upload here
      console.log('Files dropped:', e.dataTransfer?.files)
    }

    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
    }
  }, [])

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-canvas">
        <div className="text-center">
          <Rocket size={32} className="text-accent-brand mx-auto mb-4" />
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Main Workspace Layout */}
      <div className="h-screen flex bg-canvas">
        {/* Upload Area */}
        <div className="flex-1 flex flex-col">
          {/* Upload Zone */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className={`max-w-2xl w-full ${isDragOver ? 'scale-105' : ''} transition-transform`}>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-accent-brand transition-colors">
                <Upload size={48} className="text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Upload Your Document</h3>
                <p className="text-gray-600 mb-6">Drag and drop your file here, or click to browse</p>
                <div className="flex justify-center space-x-4 text-sm text-gray-500">
                  <span>• PDF</span>
                  <span>• DOCX</span>
                  <span>• TXT</span>
                  <span>• Up to 10MB</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Agent Panel */}
        <div className="w-96 border-l border-gray-200">
          <AgentChat />
        </div>
      </div>

      {/* Drag Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-accent-brand-light/90 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-dashed border-accent-brand rounded-lg p-8 text-center">
            <FileText size={48} className="text-accent-brand mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Drop files to upload</h3>
            <p className="text-gray-600">Release to start processing</p>
          </div>
        </div>
      )}
    </>
  )
}
