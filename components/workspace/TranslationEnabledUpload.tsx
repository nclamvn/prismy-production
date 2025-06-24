'use client'

import React from 'react'
import DocumentUpload from './DocumentUpload'
import type { AIProcessingResult } from '@/lib/ai-document-processor'

interface TranslationEnabledUploadProps {
  enableTranslation?: boolean
  defaultTargetLanguage?: string
  onDocumentProcessed?: (result: AIProcessingResult) => void
  onError?: (error: Error) => void
  className?: string
}

export default function TranslationEnabledUpload({
  enableTranslation = true,
  defaultTargetLanguage = 'en',
  onDocumentProcessed,
  onError,
  className = ''
}: TranslationEnabledUploadProps) {
  console.log('🔄 TranslationEnabledUpload: Component rendered with translation enabled')

  return (
    <DocumentUpload
      enableTranslation={enableTranslation}
      defaultTargetLanguage={defaultTargetLanguage}
      onDocumentProcessed={onDocumentProcessed}
      onError={onError}
      className={className}
    />
  )
}