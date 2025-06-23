'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'

interface TranslationHistoryItem {
  id: string
  originalText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  createdAt: string
  wordCount: number
  type: 'text' | 'document'
  fileName?: string
}

function TranslationHistory() {
  const [language, setLanguage] = useState<'vi' | 'en'>('en')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedLanguage, setSelectedLanguage] = useState('all')

  const content = {
    vi: {
      title: 'Lịch sử dịch thuật',
      searchPlaceholder: 'Tìm kiếm trong lịch sử...',
      filters: {
        all: 'Tất cả',
        text: 'Văn bản',
        document: 'Tài liệu',
        today: 'Hôm nay',
        week: 'Tuần này',
        month: 'Tháng này',
      },
      languages: {
        all: 'Tất cả ngôn ngữ',
        'en-vi': 'Anh → Việt',
        'vi-en': 'Việt → Anh',
        'en-es': 'Anh → Tây Ban Nha',
        'ja-en': 'Nhật → Anh',
      },
      export: 'Xuất CSV',
      clear: 'Xóa bộ lọc',
      stats: {
        total: 'Tổng số',
        thisMonth: 'Tháng này',
        words: 'từ',
      },
      table: {
        original: 'Văn bản gốc',
        translated: 'Bản dịch',
        languages: 'Ngôn ngữ',
        date: 'Ngày',
        type: 'Loại',
        actions: 'Thao tác',
      },
      actions: {
        view: 'Xem',
        copy: 'Sao chép',
        delete: 'Xóa',
      },
    },
    en: {
      title: 'Translation History',
      searchPlaceholder: 'Search in history...',
      filters: {
        all: 'All',
        text: 'Text',
        document: 'Document',
        today: 'Today',
        week: 'This Week',
        month: 'This Month',
      },
      languages: {
        all: 'All Languages',
        'en-vi': 'EN → VI',
        'vi-en': 'VI → EN',
        'en-es': 'EN → ES',
        'ja-en': 'JA → EN',
      },
      export: 'Export CSV',
      clear: 'Clear Filters',
      stats: {
        total: 'Total',
        thisMonth: 'This Month',
        words: 'words',
      },
      table: {
        original: 'Original Text',
        translated: 'Translation',
        languages: 'Languages',
        date: 'Date',
        type: 'Type',
        actions: 'Actions',
      },
      actions: {
        view: 'View',
        copy: 'Copy',
        delete: 'Delete',
      },
    },
  }

  // Mock data - in production, fetch from API
  const historyData: TranslationHistoryItem[] = [
    {
      id: '1',
      originalText: 'Hello, how are you today?',
      translatedText: 'Xin chào, hôm nay bạn thế nào?',
      sourceLang: 'en',
      targetLang: 'vi',
      createdAt: '2024-01-15T10:30:00Z',
      wordCount: 5,
      type: 'text',
    },
    {
      id: '2',
      originalText: 'This is a business contract document...',
      translatedText: 'Đây là tài liệu hợp đồng kinh doanh...',
      sourceLang: 'en',
      targetLang: 'vi',
      createdAt: '2024-01-14T15:45:00Z',
      wordCount: 1250,
      type: 'document',
      fileName: 'contract.pdf',
    },
    {
      id: '3',
      originalText: 'Tôi cần hỗ trợ kỹ thuật',
      translatedText: 'I need technical support',
      sourceLang: 'vi',
      targetLang: 'en',
      createdAt: '2024-01-13T09:15:00Z',
      wordCount: 4,
      type: 'text',
    },
  ]

  const filteredData = historyData.filter(item => {
    const matchesSearch =
      item.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translatedText.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      selectedFilter === 'all' || item.type === selectedFilter

    const matchesLanguage =
      selectedLanguage === 'all' ||
      `${item.sourceLang}-${item.targetLang}` === selectedLanguage

    return matchesSearch && matchesFilter && matchesLanguage
  })

  const handleExport = () => {
    // In production, generate and download CSV
    console.log('Exporting CSV...')
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === 'vi' ? 'vi-VN' : 'en-US'
    )
  }

  const formatLanguage = (lang: string) => {
    const languages: Record<string, Record<string, string>> = {
      vi: { en: 'Anh', vi: 'Việt', es: 'Tây Ban Nha', ja: 'Nhật' },
      en: { en: 'English', vi: 'Vietnamese', es: 'Spanish', ja: 'Japanese' },
    }
    return languages[language][lang] || lang.toUpperCase()
  }

  return (
    <DashboardLayout language={language}>
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="mb-6" variants={motionSafe(slideUp)}>
          <h1 className="heading-2 text-gray-900 mb-2">
            {content[language].title}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>
              {content[language].stats.total}: {historyData.length}
            </span>
            <span>
              {content[language].stats.thisMonth}:{' '}
              {
                historyData.filter(
                  item =>
                    new Date(item.createdAt).getMonth() ===
                    new Date().getMonth()
                ).length
              }
            </span>
            <span>
              {historyData
                .reduce((sum, item) => sum + item.wordCount, 0)
                .toLocaleString()}{' '}
              {content[language].stats.words}
            </span>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
          variants={motionSafe(slideUp)}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={content[language].searchPlaceholder}
                  className="input-base pl-10"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={selectedFilter}
                onChange={e => setSelectedFilter(e.target.value)}
                className="input-base"
              >
                {Object.entries(content[language].filters).map(
                  ([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages
              </label>
              <select
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                className="input-base"
              >
                {Object.entries(content[language].languages).map(
                  ([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedFilter('all')
                setSelectedLanguage('all')
              }}
              className="btn-ghost"
            >
              {content[language].clear}
            </button>
            <button onClick={handleExport} className="btn-secondary">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {content[language].export}
            </button>
          </div>
        </motion.div>

        {/* History Table */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          variants={motionSafe(slideUp)}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {content[language].table.original}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {content[language].table.translated}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {content[language].table.languages}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {content[language].table.type}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {content[language].table.date}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {content[language].table.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 truncate">
                          {item.type === 'document' && item.fileName
                            ? `📄 ${item.fileName}`
                            : item.originalText}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.wordCount} {content[language].stats.words}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 max-w-xs truncate">
                        {item.translatedText}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {formatLanguage(item.sourceLang)} →{' '}
                        {formatLanguage(item.targetLang)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.type === 'document'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {content[language].filters[item.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCopy(item.translatedText)}
                          className="text-gray-400 hover:text-gray-600"
                          title={content[language].actions.copy}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                        <button
                          className="text-red-400 hover:text-red-600"
                          title={content[language].actions.delete}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500">No translations found</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default function HistoryPage() {
  return <TranslationHistory />
}
