'use client'

import { useState } from 'react'
import { useWorkspaceStore, type Document } from './hooks/useWorkspaceStore'
import {
  FileText,
  Download,
  MessageCircle,
  Crown,
  Loader,
  RefreshCw,
  Eye,
  Copy,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface TranslationPanelProps {
  document: Document
}

export function TranslationPanel({ document }: TranslationPanelProps) {
  const { setChatPanelOpen, chatPanelOpen, translate, tier } =
    useWorkspaceStore()
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'split' | 'original' | 'translated'>(
    'split'
  )

  const handleRetranslate = async () => {
    try {
      await translate(document.id, document.tier)
    } catch (error) {
      console.error('Retranslation failed:', error)
    }
  }

  const handleCopyTranslation = async () => {
    if (document.status === 'translated') {
      try {
        await navigator.clipboard.writeText(mockTranslatedContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Copy failed:', error)
      }
    }
  }

  const handleDownload = () => {
    // Mock download functionality
    console.log('Downloading document...', document.id)
  }

  // Mock content for demonstration
  const mockOriginalContent = `# Sample Document

This is a sample document that demonstrates the translation capabilities of Prismy AI.

## Key Features
- Advanced neural machine translation
- Layout preservation for PDF documents
- Support for multiple file formats
- Real-time collaboration features

The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.

## Conclusion
Prismy provides enterprise-grade document translation with AI-powered accuracy.`

  const mockTranslatedContent = `# Tài liệu Mẫu

Đây là một tài liệu mẫu minh họa khả năng dịch thuật của Prismy AI.

## Tính năng Chính
- Dịch máy neural tiên tiến
- Bảo toàn bố cục cho tài liệu PDF
- Hỗ trợ nhiều định dạng tệp
- Tính năng cộng tác thời gian thực

Con cáo nâu nhanh nhẹn nhảy qua con chó lười biếng. Câu này chứa mọi chữ cái trong bảng chữ cái.

## Kết luận
Prismy cung cấp dịch tài liệu cấp doanh nghiệp với độ chính xác được hỗ trợ bởi AI.`

  const isProcessing =
    document.status === 'uploading' || document.status === 'processing'
  const isTranslated = document.status === 'translated'
  const hasError = document.status === 'error'

  return (
    <div className="h-full flex flex-col bg-bg-default">
      {/* Header */}
      <div className="flex-shrink-0 bg-surface border-b border-border-default p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText size={20} className="text-accent-brand" />
            <div>
              <h2 className="font-semibold text-primary">{document.name}</h2>
              <p className="text-sm text-secondary">
                {document.size < 1024 * 1024
                  ? `${Math.round(document.size / 1024)} KB`
                  : `${(document.size / (1024 * 1024)).toFixed(1)} MB`}{' '}
                • {document.tier} tier
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            {isTranslated && (
              <div className="flex rounded-lg border border-border-default overflow-hidden">
                <button
                  onClick={() => setViewMode('original')}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    viewMode === 'original'
                      ? 'bg-accent-brand text-white'
                      : 'bg-surface hover:bg-bg-muted'
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    viewMode === 'split'
                      ? 'bg-accent-brand text-white'
                      : 'bg-surface hover:bg-bg-muted'
                  }`}
                >
                  Split
                </button>
                <button
                  onClick={() => setViewMode('translated')}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    viewMode === 'translated'
                      ? 'bg-accent-brand text-white'
                      : 'bg-surface hover:bg-bg-muted'
                  }`}
                >
                  Translated
                </button>
              </div>
            )}

            {/* Action Buttons */}
            {isTranslated && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyTranslation}
                  disabled={copied}
                >
                  {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                </Button>

                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download size={16} />
                </Button>
              </>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleRetranslate}
              disabled={isProcessing}
            >
              <RefreshCw
                size={16}
                className={isProcessing ? 'animate-spin' : ''}
              />
            </Button>

            <Button
              size="sm"
              onClick={() => setChatPanelOpen(!chatPanelOpen)}
              className={chatPanelOpen ? 'bg-accent-brand text-white' : ''}
            >
              <MessageCircle size={16} />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-secondary">
                {document.status === 'uploading'
                  ? 'Uploading...'
                  : 'Translating...'}
              </span>
              <span className="text-primary">
                {Math.round(document.progress)}%
              </span>
            </div>
            <div className="w-full bg-bg-muted rounded-full h-2">
              <div
                className="bg-accent-brand h-2 rounded-full transition-all duration-300"
                style={{ width: `${document.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {isProcessing && <ProcessingView document={document} />}

        {hasError && (
          <ErrorView document={document} onRetry={handleRetranslate} />
        )}

        {isTranslated && (
          <TranslatedView
            original={mockOriginalContent}
            translated={mockTranslatedContent}
            viewMode={viewMode}
            tier={tier}
          />
        )}
      </div>
    </div>
  )
}

// Processing State Component
function ProcessingView({ document }: { document: Document }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="relative">
          <Loader
            size={48}
            className="animate-spin text-accent-brand mx-auto"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-accent-brand">
              {Math.round(document.progress)}%
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-primary mb-2">
            {document.status === 'uploading'
              ? 'Uploading Document'
              : 'AI Translation in Progress'}
          </h3>
          <p className="text-secondary">
            {document.status === 'uploading'
              ? 'Analyzing document structure and content...'
              : 'Our AI is carefully translating your document while preserving formatting...'}
          </p>
        </div>
      </div>
    </div>
  )
}

// Error State Component
function ErrorView({
  document,
  onRetry,
}: {
  document: Document
  onRetry: () => void
}) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <FileText size={32} className="text-red-500" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-primary mb-2">
            Translation Failed
          </h3>
          <p className="text-secondary mb-4">
            We encountered an error while processing your document. Please try
            again.
          </p>

          <Button onClick={onRetry}>
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}

// Translated View Component
interface TranslatedViewProps {
  original: string
  translated: string
  viewMode: 'split' | 'original' | 'translated'
  tier: string
}

function TranslatedView({
  original,
  translated,
  viewMode,
  tier,
}: TranslatedViewProps) {
  const showUpgradeOverlay = tier === 'free'

  return (
    <div className="h-full relative">
      {/* Free Tier Watermark Overlay */}
      {showUpgradeOverlay && (
        <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="bg-surface border border-border-default rounded-lg p-6 text-center shadow-lg max-w-md">
            <Crown size={48} className="text-accent-brand mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">
              Upgrade for Full Access
            </h3>
            <p className="text-secondary mb-4">
              Get layout-preserved translations, download options, and unlimited
              usage.
            </p>
            <Button>View Pricing Plans</Button>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div
        className={`h-full ${
          viewMode === 'split' ? 'grid grid-cols-2 gap-4' : 'flex'
        } p-4`}
      >
        {/* Original Content */}
        {(viewMode === 'split' || viewMode === 'original') && (
          <div className="flex flex-col">
            <h4 className="text-sm font-medium text-secondary mb-3 pb-2 border-b border-border-default">
              Original Document
            </h4>
            <div className="flex-1 overflow-auto">
              <DocumentContent content={original} />
            </div>
          </div>
        )}

        {/* Translated Content */}
        {(viewMode === 'split' || viewMode === 'translated') && (
          <div className="flex flex-col">
            <h4 className="text-sm font-medium text-secondary mb-3 pb-2 border-b border-border-default">
              Translated Document
            </h4>
            <div className="flex-1 overflow-auto">
              <DocumentContent content={translated} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Document Content Renderer
function DocumentContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none text-primary">
      {content.split('\n').map((line, index) => {
        if (line.startsWith('# ')) {
          return (
            <h1 key={index} className="text-xl font-bold mb-3">
              {line.substring(2)}
            </h1>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className="text-lg font-semibold mb-2 mt-4">
              {line.substring(3)}
            </h2>
          )
        }
        if (line.startsWith('- ')) {
          return (
            <li key={index} className="ml-4">
              {line.substring(2)}
            </li>
          )
        }
        if (line.trim() === '') {
          return <br key={index} />
        }
        return (
          <p key={index} className="mb-2">
            {line}
          </p>
        )
      })}
    </div>
  )
}
