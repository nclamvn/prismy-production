'use client'

import React, { useState, useEffect } from 'react'
import {
  Key,
  Code2,
  BookOpen,
  Terminal,
  Shield,
  Activity,
  Copy,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Download,
  Globe,
  Zap,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Settings,
  BarChart3,
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { createClientComponentClient } from '@/lib/supabase'

interface ApiKey {
  id: string
  name: string
  key: string
  created_at: string
  last_used: string | null
  requests_count: number
  rate_limit: number
  scopes: string[]
  is_active: boolean
}

interface ApiUsageStats {
  totalRequests: number
  requestsThisMonth: number
  averageResponseTime: number
  errorRate: number
  dailyUsage: Array<{ date: string; requests: number }>
  topEndpoints: Array<{ endpoint: string; requests: number }>
}

interface ApiDeveloperPortalProps {
  className?: string
}

export default function ApiDeveloperPortal({
  className = '',
}: ApiDeveloperPortalProps) {
  const { language } = useSSRSafeLanguage()
  const { user } = useAuth()
  const supabase = createClientComponentClient()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'docs' | 'usage'>('overview')
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [usageStats, setUsageStats] = useState<ApiUsageStats | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['translate', 'documents'])
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const content = {
    vi: {
      title: 'Cổng nhà phát triển API',
      subtitle: 'Quản lý API keys và tích hợp hệ thống',
      tabs: {
        overview: 'Tổng quan',
        keys: 'API Keys',
        docs: 'Tài liệu',
        usage: 'Sử dụng',
      },
      overview: {
        gettingStarted: 'Bắt đầu nhanh',
        apiEndpoint: 'API Endpoint',
        authentication: 'Xác thực',
        rateLimits: 'Giới hạn tốc độ',
        features: 'Tính năng chính',
      },
      keys: {
        createNew: 'Tạo API Key mới',
        keyName: 'Tên API Key',
        scopes: 'Phạm vi quyền',
        active: 'Hoạt động',
        inactive: 'Không hoạt động',
        lastUsed: 'Sử dụng lần cuối',
        requests: 'Requests',
        copy: 'Sao chép',
        copied: 'Đã sao chép',
        show: 'Hiện',
        hide: 'Ẩn',
        delete: 'Xóa',
        confirmDelete: 'Bạn có chắc muốn xóa API key này?',
      },
      usage: {
        totalRequests: 'Tổng requests',
        thisMonth: 'Tháng này',
        avgResponseTime: 'Thời gian phản hồi TB',
        errorRate: 'Tỷ lệ lỗi',
        dailyUsage: 'Sử dụng hàng ngày',
        topEndpoints: 'Endpoints phổ biến',
      },
      docs: {
        quickStart: 'Bắt đầu nhanh',
        authentication: 'Xác thực',
        endpoints: 'API Endpoints',
        examples: 'Ví dụ',
        sdks: 'SDKs & Thư viện',
      },
      scopes: {
        translate: 'Dịch văn bản',
        documents: 'Xử lý tài liệu',
        ocr: 'Nhận dạng văn bản',
        analytics: 'Phân tích dữ liệu',
        agents: 'AI Agents',
      },
    },
    en: {
      title: 'API Developer Portal',
      subtitle: 'Manage API keys and system integrations',
      tabs: {
        overview: 'Overview',
        keys: 'API Keys',
        docs: 'Documentation',
        usage: 'Usage',
      },
      overview: {
        gettingStarted: 'Getting Started',
        apiEndpoint: 'API Endpoint',
        authentication: 'Authentication',
        rateLimits: 'Rate Limits',
        features: 'Key Features',
      },
      keys: {
        createNew: 'Create New API Key',
        keyName: 'API Key Name',
        scopes: 'Scopes',
        active: 'Active',
        inactive: 'Inactive',
        lastUsed: 'Last Used',
        requests: 'Requests',
        copy: 'Copy',
        copied: 'Copied',
        show: 'Show',
        hide: 'Hide',
        delete: 'Delete',
        confirmDelete: 'Are you sure you want to delete this API key?',
      },
      usage: {
        totalRequests: 'Total Requests',
        thisMonth: 'This Month',
        avgResponseTime: 'Avg Response Time',
        errorRate: 'Error Rate',
        dailyUsage: 'Daily Usage',
        topEndpoints: 'Top Endpoints',
      },
      docs: {
        quickStart: 'Quick Start',
        authentication: 'Authentication',
        endpoints: 'API Endpoints',
        examples: 'Examples',
        sdks: 'SDKs & Libraries',
      },
      scopes: {
        translate: 'Text Translation',
        documents: 'Document Processing',
        ocr: 'OCR Recognition',
        analytics: 'Analytics Data',
        agents: 'AI Agents',
      },
    },
  }

  const currentContent = content[language]

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadApiKeys()
      loadUsageStats()
    }
  }, [user])

  const loadApiKeys = async () => {
    if (!user) return
    
    try {
      // Mock data for now - in production, this would come from your API keys table
      const mockKeys: ApiKey[] = [
        {
          id: '1',
          name: 'Production API',
          key: 'pk_live_' + 'x'.repeat(32),
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          last_used: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          requests_count: 15420,
          rate_limit: 1000,
          scopes: ['translate', 'documents', 'ocr'],
          is_active: true,
        },
        {
          id: '2',
          name: 'Development API',
          key: 'pk_test_' + 'x'.repeat(32),
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          last_used: null,
          requests_count: 245,
          rate_limit: 100,
          scopes: ['translate'],
          is_active: true,
        },
      ]
      
      setApiKeys(mockKeys)
    } catch (error) {
      console.error('Failed to load API keys:', error)
    }
  }

  const loadUsageStats = async () => {
    if (!user) return
    
    try {
      // Mock usage stats
      const mockStats: ApiUsageStats = {
        totalRequests: 15665,
        requestsThisMonth: 8540,
        averageResponseTime: 245,
        errorRate: 0.8,
        dailyUsage: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          requests: Math.floor(Math.random() * 500) + 100,
        })),
        topEndpoints: [
          { endpoint: '/api/translate', requests: 8420 },
          { endpoint: '/api/documents/process', requests: 3210 },
          { endpoint: '/api/ocr/analyze', requests: 2840 },
          { endpoint: '/api/agents/query', requests: 1195 },
        ],
      }
      
      setUsageStats(mockStats)
    } catch (error) {
      console.error('Failed to load usage stats:', error)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) return
    
    setIsLoading(true)
    try {
      // Mock key creation
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: newKeyName,
        key: 'pk_live_' + Math.random().toString(36).substring(2, 34),
        created_at: new Date().toISOString(),
        last_used: null,
        requests_count: 0,
        rate_limit: 1000,
        scopes: selectedScopes,
        is_active: true,
      }
      
      setApiKeys(prev => [...prev, newKey])
      setShowCreateModal(false)
      setNewKeyName('')
      setSelectedScopes(['translate', 'documents'])
    } catch (error) {
      console.error('Failed to create API key:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteApiKey = async (keyId: string) => {
    if (!confirm(currentContent.keys.confirmDelete)) return
    
    try {
      setApiKeys(prev => prev.filter(key => key.id !== keyId))
    } catch (error) {
      console.error('Failed to delete API key:', error)
    }
  }

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(keyId)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  const formatKey = (key: string, keyId: string) => {
    if (visibleKeys.has(keyId)) {
      return key
    }
    return key.substring(0, 12) + '•'.repeat(24)
  }

  // Render overview tab
  const renderOverview = () => (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Key className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">API Keys</p>
              <p className="text-2xl font-bold text-gray-900">{apiKeys.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">{currentContent.usage.totalRequests}</p>
              <p className="text-2xl font-bold text-gray-900">{usageStats?.totalRequests.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">{currentContent.usage.avgResponseTime}</p>
              <p className="text-2xl font-bold text-gray-900">{usageStats?.averageResponseTime}ms</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">{currentContent.usage.errorRate}</p>
              <p className="text-2xl font-bold text-gray-900">{usageStats?.errorRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
        <h3 className="text-2xl font-bold mb-4">{currentContent.overview.gettingStarted}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold mb-2">{currentContent.overview.apiEndpoint}</h4>
            <code className="bg-black bg-opacity-20 px-3 py-2 rounded text-sm">
              https://api.prismy.in/v1/
            </code>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2">{currentContent.overview.authentication}</h4>
            <code className="bg-black bg-opacity-20 px-3 py-2 rounded text-sm">
              Authorization: Bearer YOUR_API_KEY
            </code>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">{currentContent.overview.features}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center">
            <Globe className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Text Translation</h4>
            <p className="text-sm text-gray-600">Translate between 150+ languages with AI precision</p>
          </div>
          <div className="text-center">
            <BookOpen className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Document Processing</h4>
            <p className="text-sm text-gray-600">Process and translate documents with OCR</p>
          </div>
          <div className="text-center">
            <Zap className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">AI Agents</h4>
            <p className="text-sm text-gray-600">Integrate with AI agents for advanced workflows</p>
          </div>
        </div>
      </div>
    </div>
  )

  // Render API keys tab
  const renderApiKeys = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">API Keys</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {currentContent.keys.createNew}
        </button>
      </div>

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <div key={apiKey.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{apiKey.name}</h4>
                <p className="text-sm text-gray-500">
                  {new Date(apiKey.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  apiKey.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {apiKey.is_active ? currentContent.keys.active : currentContent.keys.inactive}
                </span>
                <button
                  onClick={() => deleteApiKey(apiKey.id)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm font-mono">
                    {formatKey(apiKey.key, apiKey.id)}
                  </code>
                  <button
                    onClick={() => toggleKeyVisibility(apiKey.id)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded"
                  >
                    {visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded"
                  >
                    {copiedKey === apiKey.id ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{currentContent.keys.requests}</p>
                  <p className="font-semibold text-gray-900">{apiKey.requests_count.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rate Limit</p>
                  <p className="font-semibold text-gray-900">{apiKey.rate_limit}/hour</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{currentContent.keys.lastUsed}</p>
                  <p className="font-semibold text-gray-900">
                    {apiKey.last_used 
                      ? new Date(apiKey.last_used).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>

              {/* Scopes */}
              <div>
                <p className="text-sm text-gray-600 mb-2">{currentContent.keys.scopes}</p>
                <div className="flex flex-wrap gap-2">
                  {apiKey.scopes.map((scope) => (
                    <span key={scope} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {currentContent.scopes[scope as keyof typeof currentContent.scopes] || scope}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentContent.keys.createNew}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentContent.keys.keyName}
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My API Key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentContent.keys.scopes}
                </label>
                <div className="space-y-2">
                  {Object.entries(currentContent.scopes).map(([scope, label]) => (
                    <label key={scope} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScopes(prev => [...prev, scope])
                          } else {
                            setSelectedScopes(prev => prev.filter(s => s !== scope))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={createApiKey}
                disabled={!newKeyName.trim() || isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Create'}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Render documentation tab
  const renderDocs = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">{currentContent.docs.quickStart}</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">1. Get your API key</h4>
            <p className="text-gray-600 mb-3">Create an API key in the Keys tab above.</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">2. Make your first request</h4>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm">
{`curl -X POST https://api.prismy.in/v1/translate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello, world!",
    "source": "en",
    "target": "vi"
  }'`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">3. Handle the response</h4>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-blue-400 text-sm">
{`{
  "translatedText": "Xin chào thế giới!",
  "sourceLanguage": "en",
  "targetLanguage": "vi",
  "confidence": 0.98
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">{currentContent.docs.endpoints}</h3>
        
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded mr-3">POST</span>
              <code className="text-sm font-mono">/v1/translate</code>
            </div>
            <p className="text-gray-600 text-sm">Translate text between languages</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded mr-3">POST</span>
              <code className="text-sm font-mono">/v1/documents/process</code>
            </div>
            <p className="text-gray-600 text-sm">Process and translate documents</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded mr-3">POST</span>
              <code className="text-sm font-mono">/v1/agents/query</code>
            </div>
            <p className="text-gray-600 text-sm">Query AI agents for complex tasks</p>
          </div>
        </div>
      </div>
    </div>
  )

  // Render usage tab
  const renderUsage = () => (
    <div className="space-y-6">
      {usageStats && (
        <>
          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">{currentContent.usage.totalRequests}</h3>
              <p className="text-2xl font-bold text-gray-900">{usageStats.totalRequests.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">{currentContent.usage.thisMonth}</h3>
              <p className="text-2xl font-bold text-gray-900">{usageStats.requestsThisMonth.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">{currentContent.usage.avgResponseTime}</h3>
              <p className="text-2xl font-bold text-gray-900">{usageStats.averageResponseTime}ms</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">{currentContent.usage.errorRate}</h3>
              <p className="text-2xl font-bold text-gray-900">{usageStats.errorRate}%</p>
            </div>
          </div>

          {/* Top Endpoints */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentContent.usage.topEndpoints}</h3>
            <div className="space-y-3">
              {usageStats.topEndpoints.map((endpoint, index) => (
                <div key={endpoint.endpoint} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    <code className="text-sm font-mono text-gray-900">{endpoint.endpoint}</code>
                  </div>
                  <span className="text-sm text-gray-600">{endpoint.requests.toLocaleString()} requests</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Usage Chart Placeholder */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentContent.usage.dailyUsage}</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Chart visualization coming soon</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className={`api-developer-portal ${className}`}>
      {/* Tab Navigation */}
      <div className="flex space-x-6 mb-8 border-b border-gray-200">
        {(['overview', 'keys', 'docs', 'usage'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {currentContent.tabs[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'keys' && renderApiKeys()}
        {activeTab === 'docs' && renderDocs()}
        {activeTab === 'usage' && renderUsage()}
      </div>
    </div>
  )
}