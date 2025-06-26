'use client'

import React, { useState } from 'react'
import { 
  Languages, 
  ArrowRight, 
  Copy, 
  Download,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'

interface SimpleTranslationInterfaceProps {
  className?: string
  onTranslationComplete?: (result: any) => void
}

export default function SimpleTranslationInterface({
  className = '',
  onTranslationComplete
}: SimpleTranslationInterfaceProps) {
  const { language } = useLanguage()
  const { user } = useAuth()
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Language options for translation
  const languageOptions = [
    { code: 'auto', name: 'Auto-detect', nameVi: 'Tự động nhận dạng' },
    { code: 'en', name: 'English', nameVi: 'Tiếng Anh' },
    { code: 'vi', name: 'Vietnamese', nameVi: 'Tiếng Việt' },
    { code: 'zh', name: 'Chinese', nameVi: 'Tiếng Trung' },
    { code: 'ja', name: 'Japanese', nameVi: 'Tiếng Nhật' },
    { code: 'ko', name: 'Korean', nameVi: 'Tiếng Hàn' },
    { code: 'fr', name: 'French', nameVi: 'Tiếng Pháp' },
    { code: 'de', name: 'German', nameVi: 'Tiếng Đức' },
    { code: 'es', name: 'Spanish', nameVi: 'Tiếng Tây Ban Nha' },
    { code: 'th', name: 'Thai', nameVi: 'Tiếng Thái' }
  ]

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError(language === 'vi' ? 'Vui lòng nhập văn bản cần dịch' : 'Please enter text to translate')
      return
    }

    setIsTranslating(true)
    setError(null)
    setSuccess(false)

    console.log('🚀 Starting simple translation', {
      textLength: sourceText.length,
      sourceLang,
      targetLang
    })

    try {
      // Use authenticated endpoint for logged-in users
      const endpoint = user ? '/api/translate/authenticated' : '/api/translate/public'
      const qualityTier = user ? 'standard' : 'free'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sourceText,
          sourceLang: sourceLang === 'auto' ? undefined : sourceLang,
          targetLang: targetLang,
          qualityTier: qualityTier,
          serviceType: 'google_translate'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Translation failed')
      }

      console.log('✅ Simple translation completed', data)

      if (data.success && data.result) {
        setTranslatedText(data.result.translatedText)
        setSuccess(true)
        
        // Show credit usage for authenticated users
        if (data.credits) {
          console.log(`💰 Credits used: ${data.credits.charged}, Remaining: ${data.credits.remaining}`)
        }
        
        if (onTranslationComplete) {
          onTranslationComplete(data.result)
        }
      } else {
        throw new Error('Invalid response format')
      }

    } catch (error) {
      console.error('❌ Simple translation error:', error)
      setError(error instanceof Error ? error.message : 'Translation failed')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const handleSwapLanguages = () => {
    if (sourceLang !== 'auto') {
      setSourceLang(targetLang)
      setTargetLang(sourceLang)
      setSourceText(translatedText)
      setTranslatedText('')
    }
  }

  return (
    <div className={`simple-translation-interface bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Languages className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            {language === 'vi' ? 'Dịch Thuật Nhanh' : 'Quick Translation'}
          </h2>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-4">
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languageOptions.map(option => (
              <option key={option.code} value={option.code}>
                {language === 'vi' ? option.nameVi : option.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleSwapLanguages}
            disabled={sourceLang === 'auto'}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={language === 'vi' ? 'Hoán đổi ngôn ngữ' : 'Swap languages'}
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languageOptions.filter(option => option.code !== 'auto').map(option => (
              <option key={option.code} value={option.code}>
                {language === 'vi' ? option.nameVi : option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Translation Area */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'vi' ? 'Văn bản gốc' : 'Source text'}
            </label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={language === 'vi' 
                ? 'Nhập văn bản cần dịch...'
                : 'Enter text to translate...'}
              className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={10240}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {sourceText.length}/10,240 {language === 'vi' ? 'ký tự' : 'characters'}
              </span>
              {sourceText && (
                <button
                  onClick={() => handleCopy(sourceText)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {language === 'vi' ? 'Sao chép' : 'Copy'}
                </button>
              )}
            </div>
          </div>

          {/* Translated Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'vi' ? 'Bản dịch' : 'Translation'}
            </label>
            <div className="relative">
              <textarea
                value={translatedText}
                readOnly
                placeholder={language === 'vi' 
                  ? 'Bản dịch sẽ xuất hiện ở đây...'
                  : 'Translation will appear here...'}
                className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none bg-gray-50 focus:outline-none"
              />
              {isTranslating && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {translatedText.length} {language === 'vi' ? 'ký tự' : 'characters'}
              </span>
              {translatedText && (
                <button
                  onClick={() => handleCopy(translatedText)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {language === 'vi' ? 'Sao chép' : 'Copy'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-3">
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm animate-slide-in-left">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            {success && !error && (
              <div className="flex items-center gap-2 text-green-600 text-sm animate-slide-in-left">
                <CheckCircle className="w-4 h-4" />
                {language === 'vi' ? 'Thành công!' : 'Success!'}
              </div>
            )}
          </div>

          <button
            onClick={handleTranslate}
            disabled={isTranslating || !sourceText.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === 'vi' ? 'Đang dịch...' : 'Translating...'}
              </>
            ) : (
              <>
                <Languages className="w-4 h-4" />
                {language === 'vi' ? 'Dịch' : 'Translate'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}