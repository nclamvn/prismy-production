'use client'

import React, { useState } from 'react'
import {
  Download,
  FileText,
  FileType,
  Image,
  Share2,
  Copy,
  CheckCircle,
  Clock,
  Settings,
  Zap,
  BarChart3,
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'

interface ExportData {
  originalText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  timestamp: Date
  qualityScore?: number
  processingTime?: number
}

interface ExportPanelProps {
  exportData?: ExportData
  onDownload?: (format: string, options: any) => void
}

/**
 * EXPORT PANEL - NotebookLM Style
 * Download and sharing functionality
 */
export default function ExportPanel({
  exportData,
  onDownload,
}: ExportPanelProps) {
  const { language } = useSSRSafeLanguage()
  const [selectedFormat, setSelectedFormat] = useState('txt')
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [copied, setCopied] = useState(false)

  const exportFormats = [
    {
      id: 'txt',
      name: 'Text File',
      icon: FileText,
      description:
        language === 'vi' ? 'Văn bản thuần túy' : 'Plain text format',
      extension: '.txt',
      premium: false,
    },
    {
      id: 'docx',
      name: 'Word Document',
      icon: FileType,
      description:
        language === 'vi' ? 'Microsoft Word' : 'Microsoft Word format',
      extension: '.docx',
      premium: true,
    },
    {
      id: 'pdf',
      name: 'PDF Document',
      icon: FileType,
      description: language === 'vi' ? 'Định dạng PDF' : 'PDF format',
      extension: '.pdf',
      premium: true,
    },
    {
      id: 'json',
      name: 'JSON Data',
      icon: FileText,
      description:
        language === 'vi' ? 'Dữ liệu có cấu trúc' : 'Structured data',
      extension: '.json',
      premium: false,
    },
  ]

  const handleDownload = (format: string) => {
    if (!exportData) return

    const options = {
      format,
      includeMetadata,
      filename: `translation_${exportData.sourceLanguage}_to_${exportData.targetLanguage}_${Date.now()}`,
    }

    onDownload?.(format, options)
  }

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const generatePreview = () => {
    if (!exportData) return ''

    let preview = `${language === 'vi' ? 'BẢN DỊCH' : 'TRANSLATION'}\n`
    preview += `${language === 'vi' ? 'Từ' : 'From'}: ${exportData.sourceLanguage.toUpperCase()}\n`
    preview += `${language === 'vi' ? 'Sang' : 'To'}: ${exportData.targetLanguage.toUpperCase()}\n`
    preview += `${language === 'vi' ? 'Thời gian' : 'Date'}: ${exportData.timestamp.toLocaleString()}\n\n`

    preview += `${language === 'vi' ? 'NGUYÊN BẢN' : 'ORIGINAL'}:\n`
    preview += `${exportData.originalText}\n\n`

    preview += `${language === 'vi' ? 'BẢN DỊCH' : 'TRANSLATED'}:\n`
    preview += `${exportData.translatedText}\n`

    if (includeMetadata && exportData.qualityScore) {
      preview += `\n${language === 'vi' ? 'CHẤT LƯỢNG' : 'QUALITY'}: ${Math.round(exportData.qualityScore * 100)}%`
    }

    return preview
  }

  return (
    <div className="h-full flex flex-col">
      {!exportData ? (
        /* Empty State */
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <Download className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">
              {language === 'vi'
                ? 'Hoàn thành bản dịch để xuất tệp'
                : 'Complete a translation to export'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCopyText(exportData.translatedText)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm transition-colors"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied
                  ? language === 'vi'
                    ? 'Đã sao chép!'
                    : 'Copied!'
                  : language === 'vi'
                    ? 'Sao chép'
                    : 'Copy'}
              </button>

              <button
                onClick={() => {
                  /* TODO: Implement sharing */
                }}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm transition-colors"
              >
                <Share2 className="w-4 h-4" />
                {language === 'vi' ? 'Chia sẻ' : 'Share'}
              </button>
            </div>
          </div>

          {/* Translation Info */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {language === 'vi' ? 'Ngôn ngữ' : 'Languages'}:
                </span>
                <span className="font-medium">
                  {exportData.sourceLanguage.toUpperCase()} →{' '}
                  {exportData.targetLanguage.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {language === 'vi' ? 'Thời gian' : 'Time'}:
                </span>
                <span className="font-medium">
                  {exportData.timestamp.toLocaleString()}
                </span>
              </div>

              {exportData.qualityScore && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {language === 'vi' ? 'Chất lượng' : 'Quality'}:
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${exportData.qualityScore * 100}%` }}
                      />
                    </div>
                    <span className="font-medium">
                      {Math.round(exportData.qualityScore * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {exportData.processingTime && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {language === 'vi' ? 'Tốc độ' : 'Speed'}:
                  </span>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-green-500" />
                    <span className="font-medium">
                      {exportData.processingTime}ms
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Export Formats */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              {language === 'vi' ? 'Định dạng xuất' : 'Export Format'}
            </h3>

            <div className="space-y-2">
              {exportFormats.map(format => (
                <div
                  key={format.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedFormat(format.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <format.icon className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {format.name}
                          </span>
                          {format.premium && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Premium
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          {format.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedFormat === format.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedFormat === format.id && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              {language === 'vi' ? 'Tùy chọn' : 'Options'}
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={e => setIncludeMetadata(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {language === 'vi'
                    ? 'Bao gồm thông tin metadata'
                    : 'Include metadata'}
                </span>
              </label>
            </div>
          </div>

          {/* Download Button */}
          <div className="p-4">
            <button
              onClick={() => handleDownload(selectedFormat)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              {language === 'vi'
                ? `Tải về ${exportFormats.find(f => f.id === selectedFormat)?.extension}`
                : `Download ${exportFormats.find(f => f.id === selectedFormat)?.extension}`}
            </button>
          </div>

          {/* Preview */}
          <div className="flex-1 p-4 bg-gray-50 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              {language === 'vi' ? 'Xem trước' : 'Preview'}
            </h3>
            <div className="bg-white rounded-lg p-3 border border-gray-200 text-xs font-mono text-gray-700 max-h-40 overflow-auto">
              <pre className="whitespace-pre-wrap">{generatePreview()}</pre>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
