'use client'

import React, { useState, useEffect } from 'react'
import {
  Download,
  FileText,
  FileSpreadsheet,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  Settings,
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useAuth } from '@/contexts/AuthContext'

interface DownloadInterfaceProps {
  documentId: string
  onDownloadComplete?: (filename: string, format: string) => void
  className?: string
}

interface DownloadStatus {
  available: boolean
  document?: {
    id: string
    filename: string
    fileType: string
  }
  translations?: Array<{
    id: string
    status: string
    target_language: string
    created_at: string
    quality_score?: number
  }>
  supportedFormats?: string[]
  reason?: string
}

interface DownloadProgress {
  isDownloading: boolean
  format?: string
  progress?: number
  error?: string
}

export default function DownloadInterface({
  documentId,
  onDownloadComplete,
  className = '',
}: DownloadInterfaceProps) {
  const { language } = useSSRSafeLanguage()
  const { user } = useAuth()

  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus | null>(
    null
  )
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    isDownloading: false,
  })
  const [selectedFormat, setSelectedFormat] = useState<string>('original')
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [quality, setQuality] = useState<'standard' | 'high'>('standard')
  const [isLoading, setIsLoading] = useState(true)

  // Format options with icons and descriptions
  const formatOptions = [
    {
      value: 'original',
      label: language === 'vi' ? 'Định dạng gốc' : 'Original Format',
      icon: File,
      description:
        language === 'vi'
          ? 'Giữ nguyên định dạng file gốc'
          : 'Keep original file format',
      premium: false,
    },
    {
      value: 'txt',
      label: language === 'vi' ? 'Văn bản thuần' : 'Plain Text',
      icon: FileText,
      description:
        language === 'vi'
          ? 'File văn bản đơn giản (.txt)'
          : 'Simple text file (.txt)',
      premium: false,
    },
    {
      value: 'docx',
      label: language === 'vi' ? 'Microsoft Word' : 'Microsoft Word',
      icon: FileText,
      description:
        language === 'vi'
          ? 'Tài liệu Word với định dạng (.docx)'
          : 'Word document with formatting (.docx)',
      premium: true,
    },
    {
      value: 'xlsx',
      label: language === 'vi' ? 'Microsoft Excel' : 'Microsoft Excel',
      icon: FileSpreadsheet,
      description:
        language === 'vi'
          ? 'Bảng tính Excel (.xlsx)'
          : 'Excel spreadsheet (.xlsx)',
      premium: true,
    },
  ]

  // Check download availability on mount
  useEffect(() => {
    checkDownloadStatus()
  }, [documentId])

  const checkDownloadStatus = async () => {
    if (!documentId) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/documents/download?documentId=${documentId}`
      )
      const data: DownloadStatus = await response.json()

      setDownloadStatus(data)

      // Set default format based on original file type
      if (data.available && data.document) {
        setSelectedFormat(
          data.supportedFormats?.includes(data.document.fileType)
            ? data.document.fileType
            : 'txt'
        )
      }
    } catch (error) {
      console.error('Failed to check download status:', error)
      setDownloadStatus({
        available: false,
        reason:
          language === 'vi'
            ? 'Không thể kiểm tra trạng thái'
            : 'Unable to check status',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!downloadStatus?.available) return

    setDownloadProgress({
      isDownloading: true,
      format: selectedFormat,
      progress: 0,
    })

    try {
      const requestBody = {
        documentId,
        format: selectedFormat,
        quality,
        includeMetadata,
      }

      const response = await fetch('/api/documents/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Download failed')
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch
        ? filenameMatch[1]
        : `translation_${selectedFormat}.${getFileExtension(selectedFormat)}`

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      
      // Use a more React-safe approach with immediate cleanup
      link.click()
      window.URL.revokeObjectURL(url)

      setDownloadProgress({
        isDownloading: false,
        progress: 100,
      })

      if (onDownloadComplete) {
        onDownloadComplete(filename, selectedFormat)
      }
    } catch (error) {
      console.error('Download error:', error)
      setDownloadProgress({
        isDownloading: false,
        error: error instanceof Error ? error.message : 'Download failed',
      })
    }
  }

  const getFileExtension = (format: string): string => {
    switch (format) {
      case 'docx':
        return 'docx'
      case 'xlsx':
        return 'xlsx'
      case 'pdf':
        return 'pdf'
      case 'txt':
      default:
        return 'txt'
    }
  }

  const isPremiumFormat = (format: string): boolean => {
    return formatOptions.find(opt => opt.value === format)?.premium || false
  }

  const canDownloadFormat = (format: string): boolean => {
    if (!isPremiumFormat(format)) return true
    return user && user.subscription_tier !== 'free'
  }

  if (isLoading) {
    return (
      <div
        className={`download-interface bg-white rounded-lg border p-6 ${className}`}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-3" />
          <span className="text-gray-600">
            {language === 'vi'
              ? 'Đang kiểm tra...'
              : 'Checking availability...'}
          </span>
        </div>
      </div>
    )
  }

  if (!downloadStatus?.available) {
    return (
      <div
        className={`download-interface bg-white rounded-lg border p-6 ${className}`}
      >
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'vi'
              ? 'Không thể tải xuống'
              : 'Download Not Available'}
          </h3>
          <p className="text-gray-600">
            {downloadStatus?.reason ||
              (language === 'vi'
                ? 'Chưa có bản dịch hoàn thành cho tài liệu này'
                : 'No completed translation available for this document')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`download-interface bg-white rounded-lg border ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Download className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'vi'
                ? 'Tải xuống bản dịch'
                : 'Download Translation'}
            </h3>
            <p className="text-sm text-gray-600">
              {downloadStatus.document?.filename}
            </p>
          </div>
        </div>
      </div>

      {/* Translation Info */}
      {downloadStatus.translations &&
        downloadStatus.translations.length > 0 && (
          <div className="p-6 border-b border-gray-200 bg-blue-50">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-2">
                  {language === 'vi'
                    ? 'Thông tin bản dịch'
                    : 'Translation Information'}
                </h4>
                {downloadStatus.translations.map((translation, index) => (
                  <div key={translation.id} className="text-sm text-blue-800">
                    <div className="flex items-center justify-between">
                      <span>
                        {language === 'vi'
                          ? 'Ngôn ngữ đích:'
                          : 'Target Language:'}{' '}
                        {translation.target_language}
                      </span>
                      {translation.quality_score && (
                        <span className="text-blue-600">
                          {language === 'vi' ? 'Chất lượng:' : 'Quality:'}{' '}
                          {Math.round(translation.quality_score * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="text-blue-600 text-xs mt-1">
                      {new Date(translation.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Format Selection */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">
          {language === 'vi'
            ? 'Chọn định dạng tải xuống'
            : 'Select Download Format'}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {formatOptions.map(option => {
            const IconComponent = option.icon
            const isAvailable = canDownloadFormat(option.value)

            return (
              <label
                key={option.value}
                className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedFormat === option.value && isAvailable
                    ? 'border-blue-500 bg-blue-50'
                    : isAvailable
                      ? 'border-gray-300 hover:bg-gray-50'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={option.value}
                  checked={selectedFormat === option.value}
                  onChange={e => setSelectedFormat(e.target.value)}
                  disabled={!isAvailable}
                  className="sr-only"
                />

                <IconComponent
                  className={`w-5 h-5 mr-3 mt-0.5 ${
                    selectedFormat === option.value && isAvailable
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                />

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        isAvailable ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {option.label}
                    </span>
                    {option.premium && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        {language === 'vi' ? 'Premium' : 'Premium'}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm mt-1 ${
                      isAvailable ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {option.description}
                  </p>
                  {!isAvailable && option.premium && (
                    <p className="text-xs text-orange-600 mt-1">
                      {language === 'vi'
                        ? 'Cần nâng cấp tài khoản để sử dụng'
                        : 'Account upgrade required'}
                    </p>
                  )}
                </div>

                {selectedFormat === option.value && isAvailable && (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                )}
              </label>
            )
          })}
        </div>
      </div>

      {/* Options */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">
          {language === 'vi' ? 'Tùy chọn tải xuống' : 'Download Options'}
        </h4>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={e => setIncludeMetadata(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-gray-900">
              {language === 'vi'
                ? 'Bao gồm thông tin metadata'
                : 'Include metadata information'}
            </span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'vi' ? 'Chất lượng xuất file' : 'Output Quality'}
            </label>
            <select
              value={quality}
              onChange={e => setQuality(e.target.value as 'standard' | 'high')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="standard">
                {language === 'vi' ? 'Tiêu chuẩn' : 'Standard'}
              </option>
              <option value="high">{language === 'vi' ? 'Cao' : 'High'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Download Actions */}
      <div className="p-6">
        {downloadProgress.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{downloadProgress.error}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={
            downloadProgress.isDownloading || !canDownloadFormat(selectedFormat)
          }
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {downloadProgress.isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {language === 'vi' ? 'Đang tải xuống...' : 'Downloading...'}
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {language === 'vi' ? 'Tải xuống' : 'Download'}
            </>
          )}
        </button>

        {downloadProgress.isDownloading &&
          downloadProgress.progress !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{language === 'vi' ? 'Tiến độ' : 'Progress'}</span>
                <span>{downloadProgress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress.progress}%` }}
                />
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
