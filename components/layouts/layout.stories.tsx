import type { Meta, StoryObj } from '@storybook/react'
import { DashboardLayout, VietnameseDashboardLayout, TetDashboardLayout } from './DashboardLayout'
import { AuthLayout, VietnameseAuthLayout, TetAuthLayout, MinimalAuthLayout } from './AuthLayout'
import { MarketingLayout, VietnameseMarketingLayout, TetMarketingLayout, LandingLayout } from './MarketingLayout'
import { EnhancedButton } from '../ui/enhanced-button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/enhanced-card'
import { EnhancedInput } from '../ui/enhanced-input'

// Dashboard Layout Stories
const dashboardMeta: Meta<typeof DashboardLayout> = {
  title: 'Vietnamese Layouts/Dashboard Layout',
  component: DashboardLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete dashboard layout with Vietnamese cultural themes, bilingual navigation, and VND currency display.',
      },
    },
  },
  tags: ['autodocs'],
}

export default dashboardMeta

const mockUser = {
  name: 'Nguyễn Văn An',
  email: 'an.nguyen@example.com',
  plan: 'premium' as const,
  credits: 500000,
  usage: {
    translations: 150,
    documents: 23,
    limit: 200
  }
}

export const DefaultDashboard: StoryObj<typeof DashboardLayout> = {
  args: {
    user: mockUser,
    vietnamese: false,
    children: (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the default dashboard layout with English interface.</p>
          </CardContent>
        </Card>
      </div>
    ),
  },
}

export const VietnameseDashboard: StoryObj<typeof DashboardLayout> = {
  render: (args) => (
    <VietnameseDashboardLayout {...args}>
      <div className="space-y-6">
        <Card vietnamese>
          <CardHeader>
            <CardTitle vietnamese>Chào mừng đến bảng điều khiển</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-vietnamese">
              Đây là bảng điều khiển với giao diện hoàn toàn tiếng Việt và văn hóa truyền thống.
            </p>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card vietnamese>
            <CardHeader>
              <CardTitle vietnamese>Dự án gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 font-vietnamese">
                <li>Dịch tài liệu marketing Q4</li>
                <li>Bản địa hóa website công ty</li>
                <li>Dịch hợp đồng doanh nghiệp</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card vietnamese>
            <CardHeader>
              <CardTitle vietnamese>Thống kê tuần này</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-vietnamese">
                <div>Bản dịch hoàn thành: 47</div>
                <div>Từ đã dịch: 15,230</div>
                <div>Độ chính xác: 98.5%</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </VietnameseDashboardLayout>
  ),
  args: {
    user: mockUser,
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with full Vietnamese interface and traditional cultural styling.',
      },
    },
  },
}

export const TetThemedDashboard: StoryObj<typeof DashboardLayout> = {
  render: (args) => (
    <TetDashboardLayout {...args}>
      <div className="space-y-6">
        <Card variant="tet" vietnamese>
          <CardHeader>
            <CardTitle vietnamese>🧧 Chúc Mừng Năm Mới!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-vietnamese">
              Năm mới an khang thịnh vượng! Prismy chúc quý khách một năm mới đầy thành công.
            </p>
            <div className="mt-4">
              <EnhancedButton variant="tet" size="sm">
                Nhận ưu đãi Tết
              </EnhancedButton>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="tet" vietnamese>
            <CardHeader>
              <CardTitle vietnamese>🎋 Khuyến mãi Tết</CardTitle>
            </CardHeader>
            <CardContent className="font-vietnamese">
              Giảm 50% gói Premium<br/>
              Có hiệu lực đến 15/2
            </CardContent>
          </Card>
          
          <Card variant="tet" vietnamese>
            <CardHeader>
              <CardTitle vietnamese>🏮 Lì xì may mắn</CardTitle>
            </CardHeader>
            <CardContent className="font-vietnamese">
              Nhận 100.000 VND<br/>
              Cho mỗi bạn bè giới thiệu
            </CardContent>
          </Card>
          
          <Card variant="tet" vietnamese>
            <CardHeader>
              <CardTitle vietnamese>🎊 Quà tặng đặc biệt</CardTitle>
            </CardHeader>
            <CardContent className="font-vietnamese">
              API miễn phí 1 tháng<br/>
              Cho khách hàng mới
            </CardContent>
          </Card>
        </div>
      </div>
    </TetDashboardLayout>
  ),
  args: {
    user: mockUser,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tết (Vietnamese New Year) themed dashboard with festive colors and special offers.',
      },
    },
  },
}

// Auth Layout Stories
const authMeta: Meta<typeof AuthLayout> = {
  title: 'Vietnamese Layouts/Auth Layout',
  component: AuthLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Authentication layout with Vietnamese cultural themes, testimonials, and bilingual support.',
      },
    },
  },
  tags: ['autodocs'],
}

export const DefaultAuth: StoryObj<typeof AuthLayout> = {
  args: {
    title: { en: 'Sign in to your account', vi: 'Đăng nhập vào tài khoản' },
    subtitle: { en: 'Welcome back! Please enter your details', vi: 'Chào mừng trở lại! Vui lòng nhập thông tin của bạn' },
    vietnamese: false,
    children: (
      <div className="space-y-4">
        <EnhancedInput 
          type="email" 
          placeholder="Enter your email"
          label="Email"
        />
        <EnhancedInput 
          type="password" 
          placeholder="Enter your password"
          label="Password"
        />
        <EnhancedButton className="w-full">
          Sign In
        </EnhancedButton>
      </div>
    ),
  },
}

export const VietnameseAuth: StoryObj<typeof AuthLayout> = {
  render: (args) => (
    <VietnameseAuthLayout {...args}>
      <div className="space-y-4">
        <EnhancedInput 
          type="email" 
          placeholder="Nhập email của bạn"
          label="Email"
          vietnamese
        />
        <EnhancedInput 
          type="password" 
          placeholder="Nhập mật khẩu"
          label="Mật khẩu"
          vietnamese
        />
        <EnhancedButton variant="vietnamese" className="w-full" vietnamese>
          Đăng nhập
        </EnhancedButton>
        
        <div className="text-center text-sm font-vietnamese">
          <span className="text-gray-600">Chưa có tài khoản? </span>
          <a href="#" className="text-vietnamese-red hover:underline">Đăng ký ngay</a>
        </div>
      </div>
    </VietnameseAuthLayout>
  ),
  args: {
    title: { en: 'Sign in to your account', vi: 'Đăng nhập vào tài khoản' },
    subtitle: { en: 'Welcome back!', vi: 'Chào mừng trở lại!' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Authentication with Vietnamese interface and cultural styling.',
      },
    },
  },
}

export const TetAuth: StoryObj<typeof AuthLayout> = {
  render: (args) => (
    <TetAuthLayout {...args}>
      <div className="space-y-4">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🧧</div>
          <div className="text-sm font-vietnamese text-tet-red">
            Khuyến mãi đặc biệt Tết - Giảm 50% gói Premium!
          </div>
        </div>
        
        <EnhancedInput 
          type="email" 
          placeholder="Nhập email của bạn"
          label="Email"
          vietnamese
        />
        <EnhancedInput 
          type="password" 
          placeholder="Nhập mật khẩu"
          label="Mật khẩu"
          vietnamese
        />
        <EnhancedButton variant="tet" className="w-full" vietnamese>
          🎋 Đăng nhập nhận ưu đãi
        </EnhancedButton>
      </div>
    </TetAuthLayout>
  ),
  args: {
    title: { en: 'New Year Special Access', vi: 'Truy cập đặc biệt Năm Mới' },
    subtitle: { en: 'Sign in to claim your Tết offers', vi: 'Đăng nhập để nhận ưu đãi Tết' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tết themed authentication with special offers and festive styling.',
      },
    },
  },
}

export const MinimalAuth: StoryObj<typeof AuthLayout> = {
  render: (args) => (
    <MinimalAuthLayout {...args}>
      <div className="space-y-4">
        <EnhancedInput 
          type="email" 
          placeholder="Email"
          vietnamese
        />
        <EnhancedInput 
          type="password" 
          placeholder="Mật khẩu"
          vietnamese
        />
        <EnhancedButton variant="vietnamese" className="w-full" vietnamese>
          Đăng nhập
        </EnhancedButton>
      </div>
    </MinimalAuthLayout>
  ),
  args: {
    title: { en: 'Quick Sign In', vi: 'Đăng nhập nhanh' },
    vietnamese: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal authentication layout without side panel, focused on simplicity.',
      },
    },
  },
}

// Marketing Layout Stories
const marketingMeta: Meta<typeof MarketingLayout> = {
  title: 'Vietnamese Layouts/Marketing Layout',
  component: MarketingLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Marketing layout with Vietnamese navigation, cultural themes, and comprehensive footer.',
      },
    },
  },
  tags: ['autodocs'],
}

export const DefaultMarketing: StoryObj<typeof MarketingLayout> = {
  args: {
    vietnamese: false,
    children: (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold">
            Professional Translation Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered translation services optimized for Vietnamese market with cultural context awareness.
          </p>
          <div className="flex gap-4 justify-center">
            <EnhancedButton size="lg">Get Started</EnhancedButton>
            <EnhancedButton variant="outline" size="lg">Learn More</EnhancedButton>
          </div>
        </div>
      </div>
    ),
  },
}

export const VietnameseMarketing: StoryObj<typeof MarketingLayout> = {
  render: (args) => (
    <VietnameseMarketingLayout {...args}>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold font-vietnamese">
            Nền tảng dịch thuật chuyên nghiệp
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-vietnamese">
            Dịch vụ dịch thuật AI được tối ưu cho thị trường Việt Nam với nhận thức bối cảnh văn hóa.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <Card vietnamese>
              <CardHeader>
                <CardTitle vietnamese>🇻🇳 Tối ưu cho Việt Nam</CardTitle>
              </CardHeader>
              <CardContent className="font-vietnamese">
                Hỗ trợ dấu tiếng Việt, định dạng VND, và bối cảnh văn hóa địa phương.
              </CardContent>
            </Card>
            
            <Card vietnamese>
              <CardHeader>
                <CardTitle vietnamese>🤖 AI Thông minh</CardTitle>
              </CardHeader>
              <CardContent className="font-vietnamese">
                Công nghệ AI tiên tiến với độ chính xác cao cho tiếng Việt.
              </CardContent>
            </Card>
            
            <Card vietnamese>
              <CardHeader>
                <CardTitle vietnamese>💰 Giá cả hợp lý</CardTitle>
              </CardHeader>
              <CardContent className="font-vietnamese">
                Định giá VND phù hợp với thị trường và khả năng chi trả Việt Nam.
              </CardContent>
            </Card>
          </div>
          
          <div className="flex gap-4 justify-center">
            <EnhancedButton variant="vietnamese" size="lg" vietnamese>
              Bắt đầu ngay
            </EnhancedButton>
            <EnhancedButton variant="outline" size="lg" vietnamese>
              Tìm hiểu thêm
            </EnhancedButton>
          </div>
        </div>
      </div>
    </VietnameseMarketingLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Marketing layout with full Vietnamese interface and cultural context.',
      },
    },
  },
}

export const TetMarketing: StoryObj<typeof MarketingLayout> = {
  render: (args) => (
    <TetMarketingLayout {...args}>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="text-6xl mb-4">🧧🎋🏮</div>
          <h1 className="text-4xl font-bold font-vietnamese text-vietnamese-red">
            Chúc Mừng Năm Mới 2024!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-vietnamese">
            Đón Tết với ưu đãi đặc biệt từ Prismy - Giảm 50% tất cả gói dịch vụ!
          </p>
          
          <Card variant="tet" size="lg" className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <div className="text-3xl font-bold text-vietnamese-red mb-2">
                🎊 50% OFF 🎊
              </div>
              <div className="font-vietnamese text-lg">
                Khuyến mãi đặc biệt Tết
              </div>
              <div className="font-vietnamese text-sm text-gray-600 mt-2">
                Áp dụng đến 15/2/2024
              </div>
            </CardContent>
          </Card>
          
          <div className="flex gap-4 justify-center">
            <EnhancedButton variant="tet" size="lg" vietnamese>
              🧧 Nhận ưu đãi ngay
            </EnhancedButton>
            <EnhancedButton variant="outline" size="lg" vietnamese>
              Xem bảng giá
            </EnhancedButton>
          </div>
        </div>
      </div>
    </TetMarketingLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tết themed marketing layout with festive styling and special offers.',
      },
    },
  },
}

export const LandingPage: StoryObj<typeof MarketingLayout> = {
  render: (args) => (
    <LandingLayout {...args}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center space-y-8">
            <h1 className="text-5xl font-bold font-vietnamese">
              Prismy - Dịch thuật AI cho Việt Nam
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-vietnamese">
              Nền tảng dịch thuật được tối ưu hoàn toàn cho thị trường Việt Nam với 
              hỗ trợ dấu tiếng Việt, định dạng VND và bối cảnh văn hóa địa phương.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <EnhancedButton variant="vietnamese" size="xl" vietnamese>
                🚀 Dùng thử miễn phí
              </EnhancedButton>
              <EnhancedButton variant="outline" size="xl" vietnamese>
                📺 Xem demo
              </EnhancedButton>
            </div>
            
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-vietnamese-red">1M+</div>
                <div className="text-gray-600 font-vietnamese">Bản dịch</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-vietnamese-red">50k+</div>
                <div className="text-gray-600 font-vietnamese">Khách hàng</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-vietnamese-red">99.9%</div>
                <div className="text-gray-600 font-vietnamese">Độ chính xác</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandingLayout>
  ),
  args: {
    vietnamese: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal landing page layout with hero section and key metrics.',
      },
    },
  },
}