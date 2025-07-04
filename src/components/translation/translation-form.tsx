'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TranslationWorker } from '@/lib/translation/worker'
import { 
  Languages, 
  FileText, 
  ArrowRight, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface TranslationFormProps {
  documentId: string
  documentName: string
  documentSize: number
  onTranslationComplete?: (result: { success: boolean; resultPath?: string }) => void
}

interface TranslationState {
  sourceLanguage: string
  targetLanguage: string
  status: 'idle' | 'processing' | 'completed' | 'error'
  progress: number
  estimatedTime: number
  error: string | null
  resultPath: string | null
}

export function TranslationForm({ 
  documentId, 
  documentName, 
  documentSize,
  onTranslationComplete 
}: TranslationFormProps) {
  const [translationState, setTranslationState] = useState<TranslationState>({
    sourceLanguage: 'auto',
    targetLanguage: '',
    status: 'idle',
    progress: 0,
    estimatedTime: 0,
    error: null,
    resultPath: null
  })

  const supportedLanguages = TranslationWorker.getSupportedLanguages()

  const handleSourceLanguageChange = (value: string) => {
    setTranslationState(prev => ({ ...prev, sourceLanguage: value }))
  }

  const handleTargetLanguageChange = (value: string) => {
    const estimatedTime = TranslationWorker.estimateProcessingTime(documentSize)
    setTranslationState(prev => ({ 
      ...prev, 
      targetLanguage: value,
      estimatedTime
    }))
  }

  const startTranslation = async () => {
    if (!translationState.targetLanguage) return

    // Validate request
    const validation = await TranslationWorker.validateTranslationRequest(
      documentId,
      translationState.sourceLanguage,
      translationState.targetLanguage
    )

    if (!validation.valid) {
      setTranslationState(prev => ({
        ...prev,
        status: 'error',
        error: validation.error || 'Invalid translation request'
      }))
      return
    }

    setTranslationState(prev => ({
      ...prev,
      status: 'processing',
      progress: 0,
      error: null
    }))

    // Start translation with progress updates
    const result = await TranslationWorker.startTranslation(
      documentId,
      translationState.sourceLanguage,
      translationState.targetLanguage,
      (progress) => {
        setTranslationState(prev => ({ ...prev, progress }))
      }
    )

    if (result.success) {
      setTranslationState(prev => ({
        ...prev,
        status: 'completed',
        progress: 100,
        resultPath: result.resultPath || null
      }))
      onTranslationComplete?.(result)
    } else {
      setTranslationState(prev => ({
        ...prev,
        status: 'error',
        error: result.error || 'Translation failed'
      }))
    }
  }

  const resetTranslation = () => {
    setTranslationState(prev => ({
      ...prev,
      status: 'idle',
      progress: 0,
      error: null,
      resultPath: null
    }))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getLanguageDisplay = (code: string) => {
    if (code === 'auto') return { name: 'Auto-detect', flag: '🔍' }
    const lang = supportedLanguages.find(l => l.code === code)
    return lang || { name: code, flag: '🏳️' }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Translate Document
        </CardTitle>
        <CardDescription>
          Configure translation settings for your document
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Info */}
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium">{documentName}</p>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(documentSize)}
            </p>
          </div>
          <Badge variant="outline">Ready</Badge>
        </div>

        {/* Language Selection */}
        {translationState.status === 'idle' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Source Language */}
              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <Select 
                  value={translationState.sourceLanguage} 
                  onValueChange={handleSourceLanguageChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <span>🔍</span>
                        <span>Auto-detect</span>
                      </div>
                    </SelectItem>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Target Language */}
              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <Select 
                  value={translationState.targetLanguage} 
                  onValueChange={handleTargetLanguageChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem 
                        key={lang.code} 
                        value={lang.code}
                        disabled={lang.code === translationState.sourceLanguage}
                      >
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Estimated Time */}
            {translationState.targetLanguage && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Estimated processing time: ~{translationState.estimatedTime} seconds</span>
              </div>
            )}

            {/* Start Button */}
            <Button 
              onClick={startTranslation}
              disabled={!translationState.targetLanguage}
              className="w-full"
            >
              Start Translation
            </Button>
          </div>
        )}

        {/* Processing State */}
        {translationState.status === 'processing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="font-medium">Translating document...</p>
                  <p className="text-sm text-muted-foreground">
                    {getLanguageDisplay(translationState.sourceLanguage).flag} {getLanguageDisplay(translationState.sourceLanguage).name}
                    {' → '}
                    {getLanguageDisplay(translationState.targetLanguage).flag} {getLanguageDisplay(translationState.targetLanguage).name}
                  </p>
                </div>
              </div>
              <Badge variant="outline">
                {translationState.progress}%
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Translation Progress</span>
                <span>{translationState.progress}%</span>
              </div>
              <Progress value={translationState.progress} className="w-full" />
              <p className="text-xs text-muted-foreground text-center">
                This may take up to {translationState.estimatedTime} seconds
              </p>
            </div>
          </div>
        )}

        {/* Completed State */}
        {translationState.status === 'completed' && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Translation completed successfully! Your document has been translated from{' '}
                {getLanguageDisplay(translationState.sourceLanguage).name} to{' '}
                {getLanguageDisplay(translationState.targetLanguage).name}.
                {translationState.resultPath && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Result: {translationState.resultPath}
                  </span>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button className="flex-1">
                Download Translation
              </Button>
              <Button variant="outline" onClick={resetTranslation}>
                Translate Again
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {translationState.status === 'error' && translationState.error && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {translationState.error}
              </AlertDescription>
            </Alert>

            <Button variant="outline" onClick={resetTranslation} className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}