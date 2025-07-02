'use client'

import { useState, useCallback } from 'react'
import { useWorkspaceStore } from './hooks/useWorkspaceStore'
import { FileText, UploadCloud, Crown, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function UploadPanel() {
  const { upload, tier, setTier } = useWorkspaceStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    await handleUpload(files)
  }, [])

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      await handleUpload(files)

      // Reset input
      e.target.value = ''
    },
    []
  )

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return

    setIsUploading(true)
    setError(null)

    try {
      // Validate file types
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ]
      const invalidFiles = files.filter(f => !allowedTypes.includes(f.type))

      if (invalidFiles.length > 0) {
        throw new Error('Only PDF, DOCX, and TXT files are supported')
      }

      await upload(files)

      // Auto-start translation for uploaded files
      // The upload method will handle adding documents to store and starting polling
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const tierLimits = {
    free: {
      maxSize: '10 MB',
      maxFiles: 1,
      features: ['Basic translation', 'Text extraction'],
    },
    basic: {
      maxSize: '50 MB',
      maxFiles: 5,
      features: [
        'High-quality translation',
        'Layout preservation',
        'Batch processing',
      ],
    },
    premium: {
      maxSize: '100 MB',
      maxFiles: 20,
      features: [
        'Premium AI models',
        'Advanced formatting',
        'Priority support',
      ],
    },
    enterprise: {
      maxSize: 'Unlimited',
      maxFiles: 'Unlimited',
      features: ['Custom models', 'API access', 'Dedicated support'],
    },
  }

  const currentLimits = tierLimits[tier]

  return (
    <div className="h-full flex flex-col">
      {/* Upload Area */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative w-full max-w-2xl border-2 border-dashed rounded-lg p-12 text-center transition-all
            ${
              isDragOver
                ? 'border-border-focus bg-accent-brand-light'
                : 'border-border-default hover:border-border-focus'
            }
            ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
          `}
        >
          <input
            type="file"
            multiple={tier !== 'free'}
            accept=".pdf,.docx,.txt"
            onChange={handleFileInput}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            data-testid="dropzone-input"
          />

          <div className="space-y-4">
            {isUploading ? (
              <div className="space-y-4">
                <div className="animate-spin mx-auto">
                  <UploadCloud size={48} className="text-accent-brand" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    Uploading your documents...
                  </h3>
                  <p className="text-secondary">
                    Please wait while we process your files
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <UploadCloud size={48} className="text-accent-brand mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    Drop documents here or click to browse
                  </h3>
                  <p className="text-secondary">
                    Supports PDF, DOCX, and TXT files up to{' '}
                    {currentLimits.maxSize}
                  </p>
                  {tier === 'free' && (
                    <p className="text-xs text-muted mt-1">
                      Free tier: 1 file at a time
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() =>
              document.querySelector('input[type="file"]')?.click()
            }
            disabled={isUploading}
            size="lg"
          >
            <FileText size={20} className="mr-2" />
            Choose Files
          </Button>

          {tier === 'free' && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                /* Open upgrade modal */
              }}
            >
              <Crown size={20} className="mr-2" />
              Upgrade for More
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="w-full max-w-2xl bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle
              size={20}
              className="text-red-500 flex-shrink-0 mt-0.5"
            />
            <div>
              <h4 className="font-medium text-red-800">Upload Error</h4>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tier Information */}
      <div className="border-t border-border-default bg-bg-muted p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-primary">
              Current Plan: {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </h4>
            {tier === 'free' && (
              <Button
                size="sm"
                onClick={() => {
                  /* Open pricing */
                }}
              >
                View All Plans
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <dt className="text-sm font-medium text-secondary">
                File Size Limit
              </dt>
              <dd className="text-primary">{currentLimits.maxSize}</dd>
            </div>

            <div className="space-y-1">
              <dt className="text-sm font-medium text-secondary">
                Files Per Upload
              </dt>
              <dd className="text-primary">{currentLimits.maxFiles}</dd>
            </div>

            <div className="space-y-1">
              <dt className="text-sm font-medium text-secondary">Features</dt>
              <dd className="text-primary">
                <ul className="text-sm space-y-0.5">
                  {currentLimits.features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
