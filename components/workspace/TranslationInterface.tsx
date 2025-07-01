'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { RefreshCw, Bot, Languages } from 'lucide-react'

interface TranslationJob {
  id: string
  documentName: string
  sourceText: string
  translatedText: string
  fromLanguage: string
  toLanguage: string
  status: 'pending' | 'translating' | 'completed' | 'error'
  progress: number
  createdAt: Date
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' }
]

interface TranslationInterfaceProps {
  documentName?: string
  initialText?: string
  onTranslationComplete?: (job: TranslationJob) => void
}

export function TranslationInterface({ 
  documentName = 'Untitled Document',
  initialText = '',
  onTranslationComplete 
}: TranslationInterfaceProps) {
  const [sourceText, setSourceText] = useState(initialText)
  const [translatedText, setTranslatedText] = useState('')
  const [fromLanguage, setFromLanguage] = useState('en')
  const [toLanguage, setToLanguage] = useState('vi')
  const [isTranslating, setIsTranslating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [jobs, setJobs] = useState<TranslationJob[]>([])

  const handleTranslate = async () => {
    if (!sourceText.trim()) return

    setIsTranslating(true)
    setProgress(0)

    const job: TranslationJob = {
      id: `trans-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      documentName,
      sourceText,
      translatedText: '',
      fromLanguage,
      toLanguage,
      status: 'translating',
      progress: 0,
      createdAt: new Date()
    }

    setJobs(prev => [job, ...prev])

    // Simulate translation progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 20
        return newProgress >= 100 ? 100 : newProgress
      })
    }, 200)

    // Simulate translation API call
    setTimeout(() => {
      clearInterval(progressInterval)
      
      const mockTranslation = `[AI Translation from ${SUPPORTED_LANGUAGES.find(l => l.code === fromLanguage)?.name} to ${SUPPORTED_LANGUAGES.find(l => l.code === toLanguage)?.name}]\n\n` +
        sourceText.split('\n').map(line => 
          line.trim() ? `• ${line}` : ''
        ).join('\n')

      const completedJob = {
        ...job,
        translatedText: mockTranslation,
        status: 'completed' as const,
        progress: 100
      }

      setTranslatedText(mockTranslation)
      setJobs(prev => prev.map(j => j.id === job.id ? completedJob : j))
      setIsTranslating(false)
      setProgress(100)
      
      onTranslationComplete?.(completedJob)
    }, 3000 + Math.random() * 2000)
  }

  const handleSwapLanguages = () => {
    setFromLanguage(toLanguage)
    setToLanguage(fromLanguage)
    setSourceText(translatedText)
    setTranslatedText('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-primary">AI Translation</h2>
        <div className="text-sm text-muted">{documentName}</div>
      </div>

      {/* Language Selection */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-primary mb-2">
            From
          </label>
          <select
            value={fromLanguage}
            onChange={(e) => setFromLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-border-default rounded-md bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent-brand focus:border-transparent"
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwapLanguages}
            disabled={isTranslating}
          >
            <RefreshCw size={20} />
          </Button>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-primary mb-2">
            To
          </label>
          <select
            value={toLanguage}
            onChange={(e) => setToLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-border-default rounded-md bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent-brand focus:border-transparent"
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Translation Interface */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Source Text */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-primary">
            Source Text
          </label>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Enter text to translate..."
            className="w-full h-64 px-3 py-2 border border-border-default rounded-md bg-surface text-primary placeholder-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent-brand focus:border-transparent"
            disabled={isTranslating}
          />
        </div>

        {/* Translated Text */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-primary">
            Translation
          </label>
          <div className="relative">
            <textarea
              value={translatedText}
              placeholder="Translation will appear here..."
              className="w-full h-64 px-3 py-2 border border-border-default rounded-md bg-bg-muted text-primary placeholder-muted resize-none focus:outline-none"
              readOnly
            />
            {isTranslating && (
              <div className="absolute inset-0 bg-surface/50 flex items-center justify-center">
                <div className="bg-surface border border-border-default rounded-lg p-6 text-center">
                  <Bot size={32} className="text-accent-brand mx-auto mb-2" />
                  <div className="text-sm font-medium text-primary mb-2">
                    AI Translation in Progress
                  </div>
                  <div className="w-32 bg-bg-muted rounded-full h-2 mb-2">
                    <div 
                      className="bg-accent-brand h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted">
                    {Math.round(progress)}% complete
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted">
          {sourceText.length} characters
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              setSourceText('')
              setTranslatedText('')
            }}
            disabled={isTranslating}
          >
            Clear
          </Button>
          <Button
            onClick={handleTranslate}
            disabled={!sourceText.trim() || isTranslating}
          >
            {isTranslating ? 'Translating...' : 'Translate'}
          </Button>
        </div>
      </div>

      {/* Translation History */}
      {jobs.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border-default">
          <h3 className="text-lg font-semibold text-primary">
            Recent Translations ({jobs.length})
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {jobs.map(job => (
              <div
                key={job.id}
                className="bg-surface border border-border-default rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-primary">
                      {SUPPORTED_LANGUAGES.find(l => l.code === job.fromLanguage)?.flag} → {SUPPORTED_LANGUAGES.find(l => l.code === job.toLanguage)?.flag}
                    </span>
                    <span className="text-sm text-muted">
                      {job.createdAt.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'translating' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </div>
                </div>
                <div className="text-sm text-muted truncate">
                  {job.sourceText.substring(0, 100)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}