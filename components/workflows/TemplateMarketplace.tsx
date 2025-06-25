'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Star, 
  Download, 
  Heart, 
  Share2, 
  Filter, 
  Search,
  TrendingUp,
  Clock,
  Users,
  Tag,
  CheckCircle,
  Play,
  Eye,
  Copy,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { motionSafe, slideUp, staggerContainer, fadeIn } from '@/lib/motion'
import OptimizedComponentWrapper from '@/components/optimization/OptimizedComponentWrapper'

interface MarketplaceTemplate {
  id: string
  name: string
  description: string
  longDescription: string
  category: string
  subcategory: string
  tags: string[]
  complexity: 'beginner' | 'intermediate' | 'advanced'
  price: number
  isPremium: boolean
  isFree: boolean
  isFeatured: boolean
  isVerified: boolean
  author: {
    id: string
    name: string
    avatar: string
    verified: boolean
    reputation: number
  }
  stats: {
    downloads: number
    rating: number
    reviewCount: number
    likes: number
    views: number
    successRate: number
  }
  media: {
    thumbnail: string
    screenshots: string[]
    video?: string
  }
  estimatedTime: string
  lastUpdated: string
  version: string
  requirements: string[]
  workflow: {
    stepCount: number
    agentTypes: string[]
    outputTypes: string[]
  }
}

interface TemplateMarketplaceProps {
  language?: 'vi' | 'en'
  onTemplateSelect?: (template: MarketplaceTemplate) => void
  onTemplateInstall?: (templateId: string) => void
}

export default function TemplateMarketplace({
  language = 'en',
  onTemplateSelect,
  onTemplateInstall
}: TemplateMarketplaceProps) {
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest' | 'downloads'>('popular')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'premium'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [favoriteTemplates, setFavoriteTemplates] = useState<Set<string>>(new Set())

  const content = {
    vi: {
      title: 'Template Marketplace',
      subtitle: 'Khám phá và cài đặt workflow templates từ cộng đồng',
      categories: {
        all: 'Tất cả',
        document: 'Tài liệu',
        legal: 'Pháp lý',
        financial: 'Tài chính',
        research: 'Nghiên cứu',
        marketing: 'Marketing',
        automation: 'Tự động hóa',
        analytics: 'Phân tích'
      },
      complexity: {
        all: 'Tất cả mức độ',
        beginner: 'Cơ bản',
        intermediate: 'Trung cấp',
        advanced: 'Nâng cao'
      },
      pricing: {
        all: 'Tất cả',
        free: 'Miễn phí',
        premium: 'Trả phí'
      },
      sortOptions: {
        popular: 'Phổ biến',
        rating: 'Đánh giá',
        newest: 'Mới nhất',
        downloads: 'Lượt tải'
      },
      actions: {
        install: 'Cài đặt',
        preview: 'Xem trước',
        clone: 'Sao chép',
        favorite: 'Yêu thích',
        share: 'Chia sẻ',
        download: 'Tải xuống',
        viewDetails: 'Xem chi tiết'
      },
      metrics: {
        downloads: 'Lượt tải',
        rating: 'Đánh giá',
        reviews: 'Đánh giá',
        likes: 'Lượt thích',
        views: 'Lượt xem',
        successRate: 'Tỷ lệ thành công',
        steps: 'Bước',
        estimatedTime: 'Thời gian ước tính',
        lastUpdated: 'Cập nhật lần cuối',
        version: 'Phiên bản'
      },
      labels: {
        free: 'Miễn phí',
        premium: 'Trả phí',
        featured: 'Nổi bật',
        verified: 'Đã xác minh',
        new: 'Mới',
        trending: 'Xu hướng'
      },
      placeholder: {
        search: 'Tìm kiếm templates...',
        noResults: 'Không tìm thấy template nào',
        loading: 'Đang tải templates...'
      }
    },
    en: {
      title: 'Template Marketplace',
      subtitle: 'Discover and install workflow templates from the community',
      categories: {
        all: 'All',
        document: 'Document',
        legal: 'Legal',
        financial: 'Financial',
        research: 'Research',
        marketing: 'Marketing',
        automation: 'Automation',
        analytics: 'Analytics'
      },
      complexity: {
        all: 'All Levels',
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced'
      },
      pricing: {
        all: 'All',
        free: 'Free',
        premium: 'Premium'
      },
      sortOptions: {
        popular: 'Popular',
        rating: 'Rating',
        newest: 'Newest',
        downloads: 'Downloads'
      },
      actions: {
        install: 'Install',
        preview: 'Preview',
        clone: 'Clone',
        favorite: 'Favorite',
        share: 'Share',
        download: 'Download',
        viewDetails: 'View Details'
      },
      metrics: {
        downloads: 'Downloads',
        rating: 'Rating',
        reviews: 'Reviews',
        likes: 'Likes',
        views: 'Views',
        successRate: 'Success Rate',
        steps: 'Steps',
        estimatedTime: 'Estimated Time',
        lastUpdated: 'Last Updated',
        version: 'Version'
      },
      labels: {
        free: 'Free',
        premium: 'Premium',
        featured: 'Featured',
        verified: 'Verified',
        new: 'New',
        trending: 'Trending'
      },
      placeholder: {
        search: 'Search templates...',
        noResults: 'No templates found',
        loading: 'Loading templates...'
      }
    }
  }

  useEffect(() => {
    fetchMarketplaceTemplates()
  }, [])

  const fetchMarketplaceTemplates = async () => {
    try {
      setLoading(true)

      // Mock marketplace data
      const mockTemplates: MarketplaceTemplate[] = [
        {
          id: 'mp-1',
          name: language === 'vi' ? 'Phân Tích Hợp Đồng Thông Minh' : 'Smart Contract Analysis',
          description: language === 'vi' 
            ? 'AI-powered workflow phân tích hợp đồng và trích xuất thông tin quan trọng'
            : 'AI-powered workflow for contract analysis and key information extraction',
          longDescription: language === 'vi'
            ? 'Workflow toàn diện sử dụng AI để phân tích các loại hợp đồng khác nhau, trích xuất thông tin quan trọng như các bên tham gia, điều khoản thanh toán, thời hạn, và các rủi ro tiềm ẩn. Bao gồm tính năng so sánh hợp đồng và tạo báo cáo tóm tắt.'
            : 'Comprehensive workflow using AI to analyze various contract types, extract key information including parties, payment terms, deadlines, and potential risks. Includes contract comparison and summary report generation.',
          category: 'legal',
          subcategory: 'contract_analysis',
          tags: ['contract', 'legal', 'analysis', 'ai', 'extraction'],
          complexity: 'intermediate',
          price: 0,
          isPremium: false,
          isFree: true,
          isFeatured: true,
          isVerified: true,
          author: {
            id: 'author-1',
            name: 'Legal AI Team',
            avatar: '/avatars/legal-team.jpg',
            verified: true,
            reputation: 4.8
          },
          stats: {
            downloads: 2847,
            rating: 4.9,
            reviewCount: 124,
            likes: 856,
            views: 5634,
            successRate: 97.3
          },
          media: {
            thumbnail: '/templates/contract-analysis-thumb.jpg',
            screenshots: [
              '/templates/contract-analysis-1.jpg',
              '/templates/contract-analysis-2.jpg'
            ],
            video: '/templates/contract-analysis-demo.mp4'
          },
          estimatedTime: '15-30 min',
          lastUpdated: '2024-06-20',
          version: '2.1.0',
          requirements: ['Legal Agent', 'Document Processing API', 'PDF Parser'],
          workflow: {
            stepCount: 6,
            agentTypes: ['legal', 'document'],
            outputTypes: ['pdf', 'json', 'excel']
          }
        },
        {
          id: 'mp-2',
          name: language === 'vi' ? 'Dashboard Tài Chính Tự Động' : 'Automated Financial Dashboard',
          description: language === 'vi'
            ? 'Tạo dashboard tài chính tự động từ dữ liệu Excel và CSV'
            : 'Create automated financial dashboards from Excel and CSV data',
          longDescription: language === 'vi'
            ? 'Template mạnh mẽ cho việc tạo dashboard tài chính tự động. Hỗ trợ nhiều định dạng dữ liệu đầu vào, tính toán các chỉ số KPI quan trọng, và tạo biểu đồ tương tác. Bao gồm cảnh báo thông minh và báo cáo tự động.'
            : 'Powerful template for creating automated financial dashboards. Supports multiple input data formats, calculates important KPIs, and creates interactive charts. Includes smart alerts and automated reporting.',
          category: 'financial',
          subcategory: 'dashboard',
          tags: ['finance', 'dashboard', 'automation', 'kpi', 'reporting'],
          complexity: 'advanced',
          price: 29.99,
          isPremium: true,
          isFree: false,
          isFeatured: true,
          isVerified: true,
          author: {
            id: 'author-2',
            name: 'FinTech Solutions',
            avatar: '/avatars/fintech.jpg',
            verified: true,
            reputation: 4.7
          },
          stats: {
            downloads: 1523,
            rating: 4.8,
            reviewCount: 89,
            likes: 634,
            views: 3421,
            successRate: 95.8
          },
          media: {
            thumbnail: '/templates/financial-dashboard-thumb.jpg',
            screenshots: [
              '/templates/financial-dashboard-1.jpg',
              '/templates/financial-dashboard-2.jpg',
              '/templates/financial-dashboard-3.jpg'
            ]
          },
          estimatedTime: '45-60 min',
          lastUpdated: '2024-06-18',
          version: '1.8.2',
          requirements: ['Financial Agent', 'Chart.js Library', 'Excel Parser'],
          workflow: {
            stepCount: 8,
            agentTypes: ['financial', 'analytics'],
            outputTypes: ['html', 'pdf', 'interactive']
          }
        },
        {
          id: 'mp-3',
          name: language === 'vi' ? 'Nghiên Cứu Khách Hàng Thông Minh' : 'Smart Customer Research',
          description: language === 'vi'
            ? 'Thu thập và phân tích thông tin khách hàng từ nhiều nguồn'
            : 'Collect and analyze customer information from multiple sources',
          longDescription: language === 'vi'
            ? 'Workflow nghiên cứu khách hàng toàn diện sử dụng AI để thu thập thông tin từ social media, website, survey và các nguồn khác. Phân tích sentiment, xu hướng và tạo customer persona chi tiết.'
            : 'Comprehensive customer research workflow using AI to collect information from social media, websites, surveys and other sources. Analyzes sentiment, trends and creates detailed customer personas.',
          category: 'research',
          subcategory: 'customer_research',
          tags: ['research', 'customer', 'analysis', 'sentiment', 'persona'],
          complexity: 'beginner',
          price: 0,
          isPremium: false,
          isFree: true,
          isFeatured: false,
          isVerified: true,
          author: {
            id: 'author-3',
            name: 'Research Labs',
            avatar: '/avatars/research-labs.jpg',
            verified: true,
            reputation: 4.6
          },
          stats: {
            downloads: 3421,
            rating: 4.7,
            reviewCount: 156,
            likes: 1205,
            views: 7832,
            successRate: 94.2
          },
          media: {
            thumbnail: '/templates/customer-research-thumb.jpg',
            screenshots: [
              '/templates/customer-research-1.jpg',
              '/templates/customer-research-2.jpg'
            ]
          },
          estimatedTime: '30-45 min',
          lastUpdated: '2024-06-15',
          version: '1.5.1',
          requirements: ['Research Agent', 'Social Media API', 'Sentiment Analysis'],
          workflow: {
            stepCount: 5,
            agentTypes: ['research', 'sentiment'],
            outputTypes: ['report', 'persona', 'chart']
          }
        },
        {
          id: 'mp-4',
          name: language === 'vi' ? 'Email Marketing Automation' : 'Email Marketing Automation',
          description: language === 'vi'
            ? 'Tự động hóa chiến dịch email marketing với AI personalization'
            : 'Automate email marketing campaigns with AI personalization',
          longDescription: language === 'vi'
            ? 'Template marketing automation mạnh mẽ cho email campaigns. Sử dụng AI để personalize content, segment khách hàng, A/B testing tự động và tracking performance chi tiết.'
            : 'Powerful marketing automation template for email campaigns. Uses AI for content personalization, customer segmentation, automatic A/B testing and detailed performance tracking.',
          category: 'marketing',
          subcategory: 'email_automation',
          tags: ['marketing', 'email', 'automation', 'personalization', 'analytics'],
          complexity: 'intermediate',
          price: 19.99,
          isPremium: true,
          isFree: false,
          isFeatured: false,
          isVerified: true,
          author: {
            id: 'author-4',
            name: 'Marketing Pro',
            avatar: '/avatars/marketing-pro.jpg',
            verified: true,
            reputation: 4.5
          },
          stats: {
            downloads: 987,
            rating: 4.6,
            reviewCount: 67,
            likes: 423,
            views: 2156,
            successRate: 92.7
          },
          media: {
            thumbnail: '/templates/email-marketing-thumb.jpg',
            screenshots: [
              '/templates/email-marketing-1.jpg',
              '/templates/email-marketing-2.jpg'
            ]
          },
          estimatedTime: '25-40 min',
          lastUpdated: '2024-06-12',
          version: '1.3.0',
          requirements: ['Marketing Agent', 'Email API', 'Analytics Dashboard'],
          workflow: {
            stepCount: 7,
            agentTypes: ['marketing', 'analytics'],
            outputTypes: ['email', 'report', 'dashboard']
          }
        }
      ]

      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Failed to fetch marketplace templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
      const matchesComplexity = selectedComplexity === 'all' || template.complexity === selectedComplexity
      const matchesPrice = priceFilter === 'all' || 
                          (priceFilter === 'free' && template.isFree) ||
                          (priceFilter === 'premium' && template.isPremium)

      return matchesSearch && matchesCategory && matchesComplexity && matchesPrice
    })

    // Sort templates
    filtered.sort((a, b) => {
      let aValue: number | string = 0
      let bValue: number | string = 0

      switch (sortBy) {
        case 'popular':
          aValue = a.stats.downloads + a.stats.likes
          bValue = b.stats.downloads + b.stats.likes
          break
        case 'rating':
          aValue = a.stats.rating
          bValue = b.stats.rating
          break
        case 'newest':
          aValue = new Date(a.lastUpdated).getTime()
          bValue = new Date(b.lastUpdated).getTime()
          break
        case 'downloads':
          aValue = a.stats.downloads
          bValue = b.stats.downloads
          break
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [templates, searchQuery, selectedCategory, selectedComplexity, priceFilter, sortBy, sortOrder])

  const handleToggleFavorite = (templateId: string) => {
    setFavoriteTemplates(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(templateId)) {
        newFavorites.delete(templateId)
      } else {
        newFavorites.add(templateId)
      }
      return newFavorites
    })
  }

  const handleInstallTemplate = (templateId: string) => {
    onTemplateInstall?.(templateId)
    console.log('Installing template:', templateId)
  }

  const getComplexityColor = (complexity: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    }
    return colors[complexity as keyof typeof colors] || colors.beginner
  }

  const formatPrice = (price: number) => {
    return price === 0 ? content[language].labels.free : `$${price}`
  }

  const TemplateCard = ({ template }: { template: MarketplaceTemplate }) => (
    <motion.div
      variants={motionSafe(slideUp)}
      className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group"
    >
      {/* Template Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          {template.isFeatured && (
            <span className="px-2 py-1 text-xs font-medium bg-yellow-400 text-yellow-900 rounded">
              {content[language].labels.featured}
            </span>
          )}
          {template.isVerified && (
            <CheckCircle className="w-4 h-4 text-green-400" />
          )}
        </div>
        <div className="absolute top-3 right-3">
          <button
            onClick={() => handleToggleFavorite(template.id)}
            className={`p-2 rounded-full transition-colors ${
              favoriteTemplates.has(template.id)
                ? 'bg-red-500 text-white'
                : 'bg-white bg-opacity-80 text-gray-600 hover:bg-opacity-100'
            }`}
          >
            <Heart className={`w-4 h-4 ${favoriteTemplates.has(template.id) ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center justify-between">
            <span className={`px-2 py-1 text-xs font-medium rounded ${getComplexityColor(template.complexity)}`}>
              {content[language].complexity[template.complexity]}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-white bg-opacity-90 text-gray-900 rounded">
              {formatPrice(template.price)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Template Info */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
        </div>

        {/* Author */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
          <span className="text-sm text-gray-600">{template.author.name}</span>
          {template.author.verified && (
            <CheckCircle className="w-4 h-4 text-blue-500" />
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{template.stats.rating}</span>
            <span className="text-sm text-gray-500">({template.stats.reviewCount})</span>
          </div>
          <div className="flex items-center space-x-1">
            <Download className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{template.stats.downloads.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{template.estimatedTime}</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{template.stats.successRate}%</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              +{template.tags.length - 3}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleInstallTemplate(template.id)}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>{content[language].actions.install}</span>
          </button>
          <button
            onClick={() => onTemplateSelect?.(template)}
            className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )

  const TemplateListItem = ({ template }: { template: MarketplaceTemplate }) => (
    <motion.div
      variants={motionSafe(slideUp)}
      className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow p-6"
    >
      <div className="flex items-start space-x-4">
        {/* Template Image */}
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0">
          <div className="w-full h-full bg-black bg-opacity-20 rounded-lg"></div>
        </div>

        {/* Template Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            </div>
            <button
              onClick={() => handleToggleFavorite(template.id)}
              className={`p-1 rounded transition-colors ${
                favoriteTemplates.has(template.id)
                  ? 'text-red-500'
                  : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${favoriteTemplates.has(template.id) ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="flex items-center space-x-4 mb-3">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium">{template.stats.rating}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Download className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{template.stats.downloads.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{template.estimatedTime}</span>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded ${getComplexityColor(template.complexity)}`}>
              {content[language].complexity[template.complexity]}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatPrice(template.price)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleInstallTemplate(template.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>{content[language].actions.install}</span>
              </button>
              <button
                onClick={() => onTemplateSelect?.(template)}
                className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <OptimizedComponentWrapper
      componentId="template-marketplace"
      enablePerformanceOptimization={true}
      enableAccessibilityEnhancements={true}
      ariaLabel={content[language].title}
      ariaDescription={content[language].subtitle}
    >
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={motionSafe(slideUp)}>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {content[language].title}
          </h2>
          <p className="text-gray-600">{content[language].subtitle}</p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div variants={motionSafe(slideUp)} className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={content[language].placeholder.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(content[language].categories).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              <select
                value={selectedComplexity}
                onChange={(e) => setSelectedComplexity(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(content[language].complexity).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(content[language].pricing).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* View and Sort Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(content[language].sortOptions).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>{filteredAndSortedTemplates.length} templates found</span>
            <span>Showing {viewMode} view</span>
          </div>
        </motion.div>

        {/* Templates */}
        <motion.div variants={motionSafe(slideUp)}>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">{content[language].placeholder.loading}</p>
            </div>
          ) : filteredAndSortedTemplates.length > 0 ? (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {filteredAndSortedTemplates.map((template) => (
                viewMode === 'grid' ? (
                  <TemplateCard key={template.id} template={template} />
                ) : (
                  <TemplateListItem key={template.id} template={template} />
                )
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{content[language].placeholder.noResults}</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </OptimizedComponentWrapper>
  )
}