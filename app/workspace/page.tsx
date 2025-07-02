'use client'

import { useState } from 'react'
import { WorkspaceLayout } from '@/components/layouts/WorkspaceLayout'
import { DocumentUpload } from '@/components/workspace/DocumentUpload'
import { TranslationInterface } from '@/components/workspace/TranslationInterface'
import { ChatInterface } from '@/components/workspace/ChatInterface'
import { Logo } from '@/components/ui/Logo'

interface Document {
  id: string
  name: string
  content?: string
}

interface Translation {
  id: string
  documentName: string
  translatedText: string
}

import { AuthGuard } from '@/components/auth/AuthGuard'

function WorkspaceContent() {
  const [activeTab, setActiveTab] = useState<'upload' | 'translate' | 'chat'>(
    'upload'
  )
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [currentTranslation, setCurrentTranslation] =
    useState<Translation | null>(null)

  const handleDocumentUploaded = (document: any) => {
    setCurrentDocument({
      id: document.id,
      name: document.name,
      content: `Sample content from ${document.name}...`, // In real app, extract actual content
    })
    // Auto-switch to translate tab
    setActiveTab('translate')
  }

  const handleTranslationComplete = (job: any) => {
    setCurrentTranslation({
      id: job.id,
      documentName: job.documentName,
      translatedText: job.translatedText,
    })
    // Auto-switch to chat tab
    setActiveTab('chat')
  }

  const renderMainContent = () => {
    switch (activeTab) {
      case 'upload':
        return <DocumentUpload onDocumentUploaded={handleDocumentUploaded} />
      case 'translate':
        return (
          <TranslationInterface
            documentName={currentDocument?.name}
            initialText={currentDocument?.content}
            onTranslationComplete={handleTranslationComplete}
          />
        )
      case 'chat':
        return (
          <ChatInterface
            documentName={currentDocument?.name}
            documentContent={
              currentTranslation?.translatedText || currentDocument?.content
            }
          />
        )
      default:
        return <DocumentUpload onDocumentUploaded={handleDocumentUploaded} />
    }
  }

  const renderSidebar = () => (
    <div className="p-4">
      {/* Logo */}
      <div className="mb-6">
        <Logo size={24} showText={true} textSize="sm" />
      </div>

      {/* Workflow Navigation */}
      <nav className="space-y-2 mb-8">
        <SidebarItem
          icon="📄"
          label="Upload"
          active={activeTab === 'upload'}
          onClick={() => setActiveTab('upload')}
          completed={!!currentDocument}
        />
        <SidebarItem
          icon="🔄"
          label="Translate"
          active={activeTab === 'translate'}
          onClick={() => setActiveTab('translate')}
          disabled={!currentDocument}
          completed={!!currentTranslation}
        />
        <SidebarItem
          icon="💬"
          label="Chat"
          active={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
          disabled={!currentDocument}
        />
      </nav>

      {/* Current Document Info */}
      {currentDocument && (
        <div className="pt-4 border-t border-border-default">
          <div className="text-xs text-muted mb-2 uppercase tracking-wide">
            Current Document
          </div>
          <div className="bg-accent-brand-light rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">📄</span>
              <div>
                <div className="text-sm font-medium text-accent-brand">
                  {currentDocument.name}
                </div>
                <div className="text-xs text-muted">Ready for processing</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mt-6 pt-4 border-t border-border-default">
        <div className="text-xs text-muted mb-3 uppercase tracking-wide">
          Workflow Progress
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                currentDocument ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <span className="text-xs text-muted">Document uploaded</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                currentTranslation ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <span className="text-xs text-muted">Translation completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                activeTab === 'chat' && currentDocument
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`}
            />
            <span className="text-xs text-muted">AI chat active</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderChatPanel = () => {
    if (activeTab === 'chat' && currentDocument) {
      return (
        <ChatInterface
          documentName={currentDocument.name}
          documentContent={
            currentTranslation?.translatedText || currentDocument.content
          }
        />
      )
    }

    return (
      <div className="p-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-primary">AI Assistant</h2>
          {!currentDocument ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🤖</div>
              <div className="text-sm text-muted">
                Upload a document to start chatting with AI
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💬</div>
              <div className="text-sm text-muted mb-4">
                Ready to chat about "{currentDocument.name}"
              </div>
              <button
                onClick={() => setActiveTab('chat')}
                className="text-sm text-accent-brand hover:text-accent-brand-dark font-medium"
              >
                Start Conversation →
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <WorkspaceLayout
      sidebar={renderSidebar()}
      chatPanel={activeTab !== 'chat' ? renderChatPanel() : undefined}
    >
      <div className="p-6">{renderMainContent()}</div>
    </WorkspaceLayout>
  )
}

interface SidebarItemProps {
  icon: string
  label: string
  active?: boolean
  onClick?: () => void
  disabled?: boolean
  completed?: boolean
}

function SidebarItem({
  icon,
  label,
  active = false,
  onClick,
  disabled = false,
  completed = false,
}: SidebarItemProps) {
  return (
    <div
      className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
        disabled
          ? 'text-muted cursor-not-allowed'
          : active
            ? 'bg-accent-brand-light text-accent-brand'
            : 'text-secondary hover:text-primary hover:bg-bg-muted'
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="relative">
        <span>{icon}</span>
        {completed && !active && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

export default function WorkspacePage() {
  return (
    <AuthGuard>
      <WorkspaceContent />
    </AuthGuard>
  )
}
