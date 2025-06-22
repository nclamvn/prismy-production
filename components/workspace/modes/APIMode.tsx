'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'
import {
  Code,
  Key,
  Copy,
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
  Plus,
  Book,
  Zap,
  BarChart3,
  Globe,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

interface APIModeProps {
  language: 'vi' | 'en'
}

interface APIKey {
  id: string
  name: string
  key: string
  environment: 'production' | 'development'
  created: string
  lastUsed: string
  requests: number
  status: 'active' | 'revoked'
}

export default function APIMode({ language }: APIModeProps) {
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({})
  const [selectedTab, setSelectedTab] = useState<'keys' | 'docs' | 'usage'>(
    'keys'
  )

  const content = {
    vi: {
      title: 'Quản lý API',
      subtitle: 'Tích hợp Prismy vào ứng dụng của bạn với API mạnh mẽ',
      tabs: {
        keys: 'API Keys',
        docs: 'Tài liệu',
        usage: 'Sử dụng',
      },
      apiKeys: {
        title: 'API Keys',
        create: 'Tạo API Key mới',
        name: 'Tên',
        environment: 'Môi trường',
        created: 'Tạo lúc',
        lastUsed: 'Sử dụng cuối',
        requests: 'Yêu cầu',
        actions: 'Thao tác',
        production: 'Production',
        development: 'Development',
        copy: 'Sao chép',
        regenerate: 'Tạo lại',
        delete: 'Xóa',
        show: 'Hiện',
        hide: 'Ẩn',
      },
      documentation: {
        title: 'Tài liệu API',
        gettingStarted: 'Bắt đầu',
        authentication: 'Xác thực',
        endpoints: 'Endpoints',
        examples: 'Ví dụ',
        sdks: 'SDKs',
      },
      usage: {
        title: 'Thống kê sử dụng API',
        thisMonth: 'Tháng này',
        totalRequests: 'Tổng yêu cầu',
        successRate: 'Tỷ lệ thành công',
        averageTime: 'Thời gian trung bình',
      },
    },
    en: {
      title: 'API Management',
      subtitle: 'Integrate Prismy into your applications with powerful APIs',
      tabs: {
        keys: 'API Keys',
        docs: 'Documentation',
        usage: 'Usage',
      },
      apiKeys: {
        title: 'API Keys',
        create: 'Create New API Key',
        name: 'Name',
        environment: 'Environment',
        created: 'Created',
        lastUsed: 'Last Used',
        requests: 'Requests',
        actions: 'Actions',
        production: 'Production',
        development: 'Development',
        copy: 'Copy',
        regenerate: 'Regenerate',
        delete: 'Delete',
        show: 'Show',
        hide: 'Hide',
      },
      documentation: {
        title: 'API Documentation',
        gettingStarted: 'Getting Started',
        authentication: 'Authentication',
        endpoints: 'Endpoints',
        examples: 'Examples',
        sdks: 'SDKs',
      },
      usage: {
        title: 'API Usage Statistics',
        thisMonth: 'This Month',
        totalRequests: 'Total Requests',
        successRate: 'Success Rate',
        averageTime: 'Average Time',
      },
    },
  }

  const apiKeys: APIKey[] = [
    {
      id: '1',
      name: 'Production App',
      key: 'pk_live_5f8a9b7c3d2e1a6b4c7d9e2f8a5b3c1d',
      environment: 'production',
      created: '2024-01-15',
      lastUsed: '2 hours ago',
      requests: 45231,
      status: 'active',
    },
    {
      id: '2',
      name: 'Development Testing',
      key: 'pk_test_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
      environment: 'development',
      created: '2024-02-01',
      lastUsed: '1 day ago',
      requests: 1247,
      status: 'active',
    },
  ]

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId],
    }))
  }

  const maskKey = (key: string, show: boolean) => {
    if (show) return key
    return (
      key.substring(0, 8) +
      '••••••••••••••••••••••••' +
      key.substring(key.length - 4)
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Show toast notification here
  }

  return (
    <div className="h-full p-6">
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div variants={motionSafe(slideUp)}>
          <h2 className="heading-2 text-gray-900 mb-4">
            {content[language].title}
          </h2>
          <p className="body-lg text-gray-600 mb-8">
            {content[language].subtitle}
          </p>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-2xl p-1">
            {(['keys', 'docs', 'usage'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-6 py-3 rounded-xl transition-all ${
                  selectedTab === tab
                    ? 'bg-white shadow-sm text-gray-900 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {content[language].tabs[tab]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* API Keys Tab */}
        {selectedTab === 'keys' && (
          <motion.div variants={motionSafe(slideUp)} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="heading-4 text-gray-900">
                {content[language].apiKeys.title}
              </h3>
              <button className="btn-primary btn-pill-compact-md">
                <Plus size={16} className="mr-2" />
                {content[language].apiKeys.create}
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-border-subtle overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left body-sm font-medium text-gray-900">
                        {content[language].apiKeys.name}
                      </th>
                      <th className="px-6 py-4 text-left body-sm font-medium text-gray-900">
                        API Key
                      </th>
                      <th className="px-6 py-4 text-left body-sm font-medium text-gray-900">
                        {content[language].apiKeys.environment}
                      </th>
                      <th className="px-6 py-4 text-left body-sm font-medium text-gray-900">
                        {content[language].apiKeys.requests}
                      </th>
                      <th className="px-6 py-4 text-left body-sm font-medium text-gray-900">
                        {content[language].apiKeys.lastUsed}
                      </th>
                      <th className="px-6 py-4 text-right body-sm font-medium text-gray-900">
                        {content[language].apiKeys.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map(apiKey => (
                      <tr
                        key={apiKey.id}
                        className="border-t border-border-subtle"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="body-sm font-medium text-gray-900">
                              {apiKey.name}
                            </div>
                            {apiKey.status === 'active' ? (
                              <CheckCircle
                                size={16}
                                className="text-green-500 ml-2"
                              />
                            ) : (
                              <AlertCircle
                                size={16}
                                className="text-red-500 ml-2"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <code className="body-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {maskKey(
                                apiKey.key,
                                showKeys[apiKey.id] || false
                              )}
                            </code>
                            <button
                              onClick={() => toggleKeyVisibility(apiKey.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              {showKeys[apiKey.id] ? (
                                <EyeOff size={14} className="text-gray-400" />
                              ) : (
                                <Eye size={14} className="text-gray-400" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(apiKey.key)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Copy size={14} className="text-gray-400" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full body-xs ${
                              apiKey.environment === 'production'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {apiKey.environment === 'production'
                              ? content[language].apiKeys.production
                              : content[language].apiKeys.development}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="body-sm text-gray-900">
                            {apiKey.requests.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="body-sm text-gray-500">
                            {apiKey.lastUsed}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                              <RotateCcw size={16} className="text-gray-400" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                              <Trash2 size={16} className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Documentation Tab */}
        {selectedTab === 'docs' && (
          <motion.div
            variants={motionSafe(slideUp)}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
          >
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl border border-border-subtle p-6">
                <h3 className="heading-4 text-gray-900 mb-4">
                  {content[language].documentation.title}
                </h3>
                <nav className="space-y-2">
                  <a
                    href="#"
                    className="block p-3 rounded-2xl bg-blue-50 text-blue-700 body-sm font-medium"
                  >
                    {content[language].documentation.gettingStarted}
                  </a>
                  <a
                    href="#"
                    className="block p-3 rounded-2xl hover:bg-gray-50 text-gray-700 body-sm"
                  >
                    {content[language].documentation.authentication}
                  </a>
                  <a
                    href="#"
                    className="block p-3 rounded-2xl hover:bg-gray-50 text-gray-700 body-sm"
                  >
                    {content[language].documentation.endpoints}
                  </a>
                  <a
                    href="#"
                    className="block p-3 rounded-2xl hover:bg-gray-50 text-gray-700 body-sm"
                  >
                    {content[language].documentation.examples}
                  </a>
                  <a
                    href="#"
                    className="block p-3 rounded-2xl hover:bg-gray-50 text-gray-700 body-sm"
                  >
                    {content[language].documentation.sdks}
                  </a>
                </nav>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-3xl border border-border-subtle p-8">
                <h3 className="heading-3 text-gray-900 mb-6">
                  {content[language].documentation.gettingStarted}
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="heading-4 text-gray-900 mb-3">
                      {language === 'vi' ? 'Cài đặt nhanh' : 'Quick Setup'}
                    </h4>
                    <div className="bg-gray-900 rounded-2xl p-4 overflow-x-auto">
                      <code className="text-green-400 body-sm font-mono">
                        curl -X POST https://api.prismy.in/v1/translate \<br />
                        &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY" \
                        <br />
                        &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                        &nbsp;&nbsp;-d '
                        {`{"text": "Hello world", "target": "vi"}`}'
                      </code>
                    </div>
                  </div>

                  <div>
                    <h4 className="heading-4 text-gray-900 mb-3">
                      {language === 'vi' ? 'Phản hồi' : 'Response'}
                    </h4>
                    <div className="bg-gray-50 rounded-2xl p-4 overflow-x-auto">
                      <code className="text-gray-700 body-sm font-mono">
                        {`{
  "translation": "Xin chào thế giới",
  "source_language": "en",
  "target_language": "vi",
  "confidence": 0.99
}`}
                      </code>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-border-subtle rounded-2xl">
                      <Code size={24} className="text-blue-500 mb-3" />
                      <h5 className="body-sm font-medium text-gray-900 mb-2">
                        JavaScript SDK
                      </h5>
                      <p className="body-xs text-gray-600">
                        {language === 'vi'
                          ? 'SDK chính thức cho Node.js'
                          : 'Official SDK for Node.js'}
                      </p>
                    </div>
                    <div className="p-4 border border-border-subtle rounded-2xl">
                      <Globe size={24} className="text-green-500 mb-3" />
                      <h5 className="body-sm font-medium text-gray-900 mb-2">
                        Python SDK
                      </h5>
                      <p className="body-xs text-gray-600">
                        {language === 'vi'
                          ? 'Thư viện Python đầy đủ'
                          : 'Full-featured Python library'}
                      </p>
                    </div>
                    <div className="p-4 border border-border-subtle rounded-2xl">
                      <Zap size={24} className="text-purple-500 mb-3" />
                      <h5 className="body-sm font-medium text-gray-900 mb-2">
                        REST API
                      </h5>
                      <p className="body-xs text-gray-600">
                        {language === 'vi'
                          ? 'API RESTful đơn giản'
                          : 'Simple RESTful API'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Usage Tab */}
        {selectedTab === 'usage' && (
          <motion.div variants={motionSafe(slideUp)} className="space-y-6">
            <h3 className="heading-4 text-gray-900">
              {content[language].usage.title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-3xl border border-border-subtle p-6">
                <BarChart3 size={24} className="text-blue-500 mb-4" />
                <div className="heading-2 text-gray-900 mb-2">46,478</div>
                <div className="body-sm text-gray-500">
                  {content[language].usage.totalRequests}
                </div>
                <div className="body-xs text-green-600 mt-2">
                  +12.3% vs last month
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-border-subtle p-6">
                <CheckCircle size={24} className="text-green-500 mb-4" />
                <div className="heading-2 text-gray-900 mb-2">99.8%</div>
                <div className="body-sm text-gray-500">
                  {content[language].usage.successRate}
                </div>
                <div className="body-xs text-green-600 mt-2">
                  +0.2% vs last month
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-border-subtle p-6">
                <Zap size={24} className="text-yellow-500 mb-4" />
                <div className="heading-2 text-gray-900 mb-2">245ms</div>
                <div className="body-sm text-gray-500">
                  {content[language].usage.averageTime}
                </div>
                <div className="body-xs text-green-600 mt-2">
                  -15ms vs last month
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-border-subtle p-6">
                <Globe size={24} className="text-purple-500 mb-4" />
                <div className="heading-2 text-gray-900 mb-2">15</div>
                <div className="body-sm text-gray-500">
                  {language === 'vi'
                    ? 'Ngôn ngữ được sử dụng'
                    : 'Languages Used'}
                </div>
                <div className="body-xs text-blue-600 mt-2">
                  +2 new languages
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-border-subtle p-6">
              <h4 className="heading-4 text-gray-900 mb-6">
                {language === 'vi' ? 'Biểu đồ sử dụng API' : 'API Usage Chart'}
              </h4>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl">
                <div className="text-center">
                  <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="body-sm text-gray-500">
                    {language === 'vi'
                      ? 'Biểu đồ sử dụng API theo thời gian'
                      : 'API usage chart over time'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
