import type { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import { MarketingLayoutNew } from './MarketingLayoutNew'

const meta: Meta<typeof MarketingLayoutNew> = {
  title: 'Layouts/MarketingLayoutNew',
  component: MarketingLayoutNew,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Enhanced marketing layout with NotebookLM-inspired design, bilingual support (EN/VI), Vietnamese cultural theming, and comprehensive accessibility features.',
      },
    },
  },
  argTypes: {
    children: {
      control: false,
      description: 'Main content area for marketing pages',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof MarketingLayoutNew>

// Sample hero content for marketing pages
const SampleHeroContent = ({ language = 'en' }: { language?: 'en' | 'vi' }) => (
  <div className="py-20 text-center">
    <div className="max-w-4xl mx-auto px-6">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        {language === 'vi'
          ? 'Nền tảng Dịch thuật AI Hàng đầu Thế giới'
          : "World's Leading AI Translation Platform"}
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        {language === 'vi'
          ? 'Dịch thuật chính xác, nhanh chóng với công nghệ AI tiên tiến. Hỗ trợ hơn 150 ngôn ngữ với độ chính xác 99.9%.'
          : 'Accurate, fast translations powered by advanced AI technology. Supporting 150+ languages with 99.9% accuracy.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="px-8 py-4 bg-accent text-white rounded-lg text-lg font-semibold hover:bg-accent/90 transition-colors">
          {language === 'vi' ? 'Bắt đầu Miễn phí' : 'Start Free Trial'}
        </button>
        <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors">
          {language === 'vi' ? 'Xem Demo' : 'Watch Demo'}
        </button>
      </div>
    </div>
  </div>
)

const SampleFeaturesContent = ({
  language = 'en',
}: {
  language?: 'en' | 'vi'
}) => (
  <div className="py-16 bg-gray-50">
    <div className="max-w-6xl mx-auto px-6">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
        {language === 'vi' ? 'Tại sao chọn Prismy?' : 'Why Choose Prismy?'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🤖</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {language === 'vi' ? 'AI Thông minh' : 'Smart AI'}
          </h3>
          <p className="text-gray-600">
            {language === 'vi'
              ? 'Công nghệ AI tiên tiến hiểu ngữ cảnh và văn hóa'
              : 'Advanced AI technology that understands context and culture'}
          </p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚡</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {language === 'vi' ? 'Tức thì' : 'Instant'}
          </h3>
          <p className="text-gray-600">
            {language === 'vi'
              ? 'Dịch thuật trong tích tắc, tiết kiệm thời gian quý báu'
              : 'Lightning-fast translations, saving your valuable time'}
          </p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {language === 'vi' ? 'Chính xác' : 'Accurate'}
          </h3>
          <p className="text-gray-600">
            {language === 'vi'
              ? 'Độ chính xác 99.9% được chứng minh bởi hàng triệu người dùng'
              : '99.9% accuracy proven by millions of users worldwide'}
          </p>
        </div>
      </div>
    </div>
  </div>
)

const SamplePricingContent = ({
  language = 'en',
}: {
  language?: 'en' | 'vi'
}) => (
  <div className="py-16">
    <div className="max-w-6xl mx-auto px-6">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
        {language === 'vi' ? 'Bảng giá linh hoạt' : 'Flexible Pricing'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white border rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">
            {language === 'vi' ? 'Cơ bản' : 'Basic'}
          </h3>
          <div className="text-3xl font-bold text-gray-900 mb-4">
            {language === 'vi' ? 'Miễn phí' : 'Free'}
          </div>
          <ul className="text-left space-y-2 mb-6">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              {language === 'vi' ? '1,000 từ/tháng' : '1,000 words/month'}
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              {language === 'vi' ? '50+ ngôn ngữ' : '50+ languages'}
            </li>
          </ul>
          <button className="w-full py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50">
            {language === 'vi' ? 'Bắt đầu' : 'Get Started'}
          </button>
        </div>

        <div className="bg-white border-2 border-accent rounded-lg p-6 text-center relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="bg-accent text-white px-4 py-1 rounded-full text-sm">
              {language === 'vi' ? 'Phổ biến' : 'Popular'}
            </span>
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {language === 'vi' ? 'Pro' : 'Pro'}
          </h3>
          <div className="text-3xl font-bold text-gray-900 mb-4">
            {language === 'vi' ? '299.000₫' : '$29'}
            <span className="text-base font-normal text-gray-600">
              /{language === 'vi' ? 'tháng' : 'month'}
            </span>
          </div>
          <ul className="text-left space-y-2 mb-6">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              {language === 'vi' ? '100,000 từ/tháng' : '100,000 words/month'}
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              {language === 'vi' ? 'Tất cả ngôn ngữ' : 'All languages'}
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              {language === 'vi' ? 'Hỗ trợ ưu tiên' : 'Priority support'}
            </li>
          </ul>
          <button className="w-full py-2 bg-accent text-white rounded-lg hover:bg-accent/90">
            {language === 'vi' ? 'Chọn gói này' : 'Choose Plan'}
          </button>
        </div>

        <div className="bg-white border rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">
            {language === 'vi' ? 'Doanh nghiệp' : 'Enterprise'}
          </h3>
          <div className="text-3xl font-bold text-gray-900 mb-4">
            {language === 'vi' ? 'Liên hệ' : 'Custom'}
          </div>
          <ul className="text-left space-y-2 mb-6">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              {language === 'vi' ? 'Không giới hạn' : 'Unlimited usage'}
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              {language === 'vi' ? 'API tùy chỉnh' : 'Custom API'}
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              {language === 'vi' ? 'Hỗ trợ 24/7' : '24/7 support'}
            </li>
          </ul>
          <button className="w-full py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50">
            {language === 'vi' ? 'Liên hệ' : 'Contact Sales'}
          </button>
        </div>
      </div>
    </div>
  </div>
)

export const Default: Story = {
  args: {
    children: (
      <main>
        <SampleHeroContent />
        <SampleFeaturesContent />
        <SamplePricingContent />
      </main>
    ),
  },
}

export const EnglishMarketing: Story = {
  args: {
    children: (
      <main>
        <SampleHeroContent language="en" />
        <SampleFeaturesContent language="en" />
        <SamplePricingContent language="en" />
      </main>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'English marketing layout with NotebookLM-inspired design and modern typography.',
      },
    },
  },
}

export const VietnameseMarketing: Story = {
  args: {
    children: (
      <main>
        <SampleHeroContent language="vi" />
        <SampleFeaturesContent language="vi" />
        <SamplePricingContent language="vi" />
      </main>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Vietnamese marketing layout with localized content, VND pricing, and Vietnamese typography.',
      },
    },
  },
}

export const TetThemeMarketing: Story = {
  args: {
    children: (
      <main className="tet-theme">
        <div className="py-20 text-center bg-gradient-to-br from-red-50 to-yellow-50">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex justify-center mb-6">
              <span className="text-6xl">🧧</span>
            </div>
            <h1 className="text-5xl font-bold text-red-800 mb-6">
              Chúc Mừng Năm Mới 2025! 🎊
            </h1>
            <p className="text-xl text-red-600 mb-8 max-w-2xl mx-auto">
              Ưu đãi đặc biệt Tết Nguyên Đán - Giảm 50% tất cả gói dịch vụ! Khởi
              đầu năm mới với công nghệ dịch thuật AI tiên tiến.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-red-600 text-white rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors">
                🎉 Nhận ưu đãi Tết
              </button>
              <button className="px-8 py-4 border-2 border-yellow-400 bg-yellow-100 text-red-800 rounded-lg text-lg font-semibold hover:bg-yellow-200 transition-colors">
                🏮 Xem gói đặc biệt
              </button>
            </div>
          </div>
        </div>

        <div className="py-16 bg-gradient-to-br from-yellow-50 to-red-50">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-red-800 mb-12">
              🎋 Tính năng đặc biệt mùa Tết 🎋
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border-2 border-red-200">
                <div className="text-4xl mb-4">🧧</div>
                <h3 className="text-xl font-semibold text-red-800 mb-2">
                  Dịch thiệp Tết
                </h3>
                <p className="text-red-600">
                  Dịch lời chúc Tết sang nhiều ngôn ngữ để gửi tặng bạn bè quốc
                  tế
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border-2 border-yellow-300">
                <div className="text-4xl mb-4">🏮</div>
                <h3 className="text-xl font-semibold text-red-800 mb-2">
                  Menu Tết đa ngôn ngữ
                </h3>
                <p className="text-red-600">
                  Tạo menu món ăn Tết bằng nhiều thứ tiếng cho nhà hàng
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border-2 border-red-200">
                <div className="text-4xl mb-4">🎊</div>
                <h3 className="text-xl font-semibold text-red-800 mb-2">
                  Văn hóa Việt
                </h3>
                <p className="text-red-600">
                  Giới thiệu văn hóa Tết Việt Nam với thế giới
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Special Tết (Vietnamese New Year) themed marketing layout with cultural elements and festive styling.',
      },
    },
  },
}

export const LandingPage: Story = {
  args: {
    children: (
      <main>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="pt-32 pb-20 text-center">
            <div className="max-w-5xl mx-auto px-6">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                🚀 Giới thiệu Prismy 2.0 - AI Translation Revolution
              </div>
              <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Dịch thuật AI
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Thế hệ tiếp theo
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Trải nghiệm công nghệ dịch thuật AI tiên tiến nhất thế giới. Hỗ
                trợ 150+ ngôn ngữ với độ chính xác 99.9%, tích hợp NotebookLM và
                xử lý tài liệu thông minh.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all">
                  🎯 Trải nghiệm miễn phí
                </button>
                <button className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl text-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all">
                  📹 Xem Demo (2 phút)
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">150+</div>
                  <div className="text-gray-600">Ngôn ngữ</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    99.9%
                  </div>
                  <div className="text-gray-600">Độ chính xác</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">1M+</div>
                  <div className="text-gray-600">Người dùng</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">24/7</div>
                  <div className="text-gray-600">Hỗ trợ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Modern landing page design with gradient backgrounds, statistics, and compelling call-to-action.',
      },
    },
  },
}

export const AccessibilityDemo: Story = {
  args: {
    children: (
      <main>
        <div className="py-20 bg-blue-50">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Accessible Marketing Layout
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              WCAG AA compliant with comprehensive accessibility features
            </p>
          </div>
        </div>

        <div className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Accessibility Features
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-green-50 border-l-4 border-green-400 p-6">
                <h3 className="text-xl font-semibold text-green-800 mb-4">
                  Keyboard Navigation
                </h3>
                <ul className="space-y-2 text-green-700">
                  <li>• Tab navigation through all interactive elements</li>
                  <li>• Skip links for quick content access</li>
                  <li>• Focus indicators for current element</li>
                  <li>• Escape key support for modals and menus</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">
                  Screen Reader Support
                </h3>
                <ul className="space-y-2 text-blue-700">
                  <li>• ARIA landmarks for page regions</li>
                  <li>• Descriptive alt text for all images</li>
                  <li>• Proper heading hierarchy (H1-H6)</li>
                  <li>• Status announcements for dynamic content</li>
                </ul>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-6">
                <h3 className="text-xl font-semibold text-purple-800 mb-4">
                  Visual Accessibility
                </h3>
                <ul className="space-y-2 text-purple-700">
                  <li>• High contrast color combinations</li>
                  <li>• Minimum 4.5:1 contrast ratio</li>
                  <li>• Scalable text up to 200%</li>
                  <li>• Color-independent information design</li>
                </ul>
              </div>

              <div className="bg-orange-50 border-l-4 border-orange-400 p-6">
                <h3 className="text-xl font-semibold text-orange-800 mb-4">
                  Motion & Interaction
                </h3>
                <ul className="space-y-2 text-orange-700">
                  <li>• Respects prefers-reduced-motion</li>
                  <li>• Touch-friendly 44px minimum targets</li>
                  <li>• Hover states for all interactive elements</li>
                  <li>• Consistent interaction patterns</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Accessibility demonstration showing WCAG AA compliance features and inclusive design patterns.',
      },
    },
  },
}

export const ResponsiveDemo: Story = {
  args: {
    children: (
      <main>
        <SampleHeroContent />
        <SampleFeaturesContent />
      </main>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile-optimized responsive layout with touch-friendly navigation and collapsible menus.',
      },
    },
  },
}

export const InteractiveDemo: Story = {
  render: () => {
    const [language, setLanguage] = React.useState<'en' | 'vi'>('en')
    const [theme, setTheme] = React.useState<'default' | 'tet'>('default')

    return (
      <div>
        <div className="bg-gray-100 p-4 border-b">
          <div className="max-w-6xl mx-auto flex flex-wrap gap-4 items-center justify-between">
            <h2 className="text-lg font-semibold">
              Interactive Marketing Layout
            </h2>
            <div className="flex gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded text-sm ${
                    language === 'en'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border text-gray-700'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('vi')}
                  className={`px-3 py-1 rounded text-sm ${
                    language === 'vi'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border text-gray-700'
                  }`}
                >
                  Tiếng Việt
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme('default')}
                  className={`px-3 py-1 rounded text-sm ${
                    theme === 'default'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border text-gray-700'
                  }`}
                >
                  Default
                </button>
                <button
                  onClick={() => setTheme('tet')}
                  className={`px-3 py-1 rounded text-sm ${
                    theme === 'tet'
                      ? 'bg-red-600 text-white'
                      : 'bg-white border text-gray-700'
                  }`}
                >
                  🧧 Tết Theme
                </button>
              </div>
            </div>
          </div>
        </div>

        <MarketingLayoutNew className={theme === 'tet' ? 'tet-theme' : ''}>
          <main>
            <SampleHeroContent language={language} />
            <SampleFeaturesContent language={language} />
            <SamplePricingContent language={language} />
          </main>
        </MarketingLayoutNew>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo - toggle between languages and themes to see responsive design behavior.',
      },
    },
  },
}

export const Playground: Story = {
  args: {
    children: (
      <main>
        <SampleHeroContent />
        <SampleFeaturesContent />
        <SamplePricingContent />
      </main>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Playground for testing different marketing layout configurations and content.',
      },
    },
  },
}
