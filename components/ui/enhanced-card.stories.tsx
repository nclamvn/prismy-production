import type { Meta, StoryObj } from '@storybook/react'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  VietnameseCard,
  TetCard,
  PricingCard
} from './enhanced-card'
import { EnhancedButton } from './enhanced-button'

const meta: Meta<typeof Card> = {
  title: 'Vietnamese Components/Enhanced Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enhanced card component with Vietnamese cultural variants, bilingual text support, and pricing card features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outline', 'vietnamese', 'tet', 'pricing'],
      description: 'Card variant including Vietnamese cultural themes',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl'],
      description: 'Card padding size options',
    },
    vietnamese: {
      control: 'boolean',
      description: 'Apply Vietnamese typography and styling',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>
          This is a default card description.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here.</p>
      </CardContent>
    </Card>
  ),
}

export const Vietnamese: Story = {
  render: (args) => (
    <VietnameseCard {...args} className="w-80">
      <CardHeader>
        <CardTitle vietnamese>Tiêu đề thẻ</CardTitle>
        <CardDescription vietnamese>
          Đây là mô tả thẻ với phong cách Việt Nam.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-vietnamese">Nội dung thẻ ở đây.</p>
      </CardContent>
    </VietnameseCard>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card with Vietnamese cultural styling and typography.',
      },
    },
  },
}

export const TetTheme: Story = {
  render: (args) => (
    <TetCard {...args} className="w-80">
      <CardHeader>
        <CardTitle vietnamese>Chúc Mừng Năm Mới</CardTitle>
        <CardDescription vietnamese>
          Thẻ chủ đề Tết với màu sắc truyền thống.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-vietnamese">
          🧧 Chúc năm mới an khang thịnh vượng!
        </p>
      </CardContent>
    </TetCard>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Special Tết (Vietnamese New Year) themed card with festive colors.',
      },
    },
  },
}

export const BilingualCard: Story = {
  render: () => (
    <Card className="w-80" vietnamese>
      <CardHeader>
        <CardTitle 
          vietnamese
          bilingualText={{
            en: "Welcome",
            vi: "Chào mừng"
          }}
        />
        <CardDescription 
          vietnamese
          bilingualText={{
            en: "This card supports bilingual content",
            vi: "Thẻ này hỗ trợ nội dung song ngữ"
          }}
        />
      </CardHeader>
      <CardContent>
        <p className="font-vietnamese">
          English and Vietnamese content | Nội dung tiếng Anh và tiếng Việt
        </p>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card with bilingual title and description support.',
      },
    },
  },
}

export const PricingCards: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
      <PricingCard
        plan="free"
        price={{ amount: 0, currency: 'VND' }}
        features={[
          '10 bản dịch mỗi tháng',
          'Hỗ trợ cơ bản',
          'Định dạng văn bản',
        ]}
        vietnamese
      >
        <CardFooter>
          <EnhancedButton variant="outline" className="w-full" vietnamese>
            Bắt đầu miễn phí
          </EnhancedButton>
        </CardFooter>
      </PricingCard>

      <PricingCard
        plan="standard"
        price={{ amount: 239000, currency: 'VND', period: 'month' }}
        features={[
          '50 bản dịch mỗi tháng',
          'Hỗ trợ ưu tiên',
          'Định dạng tài liệu',
          'API truy cập',
        ]}
        popular
        vietnamese
      >
        <CardFooter>
          <EnhancedButton variant="vietnamese" className="w-full">
            Chọn gói này
          </EnhancedButton>
        </CardFooter>
      </PricingCard>

      <PricingCard
        plan="premium"
        price={{ amount: 719000, currency: 'VND', period: 'month' }}
        features={[
          '200 bản dịch mỗi tháng',
          'Hỗ trợ 24/7',
          'Tất cả định dạng',
          'API không giới hạn',
          'Tùy chỉnh mô hình AI',
        ]}
        vietnamese
      >
        <CardFooter>
          <EnhancedButton variant="tet" className="w-full">
            Nâng cấp
          </EnhancedButton>
        </CardFooter>
      </PricingCard>

      <PricingCard
        plan="enterprise"
        price={{ amount: 2399000, currency: 'VND', period: 'month' }}
        features={[
          '1000 bản dịch mỗi tháng',
          'Quản lý tài khoản chuyên dụng',
          'Triển khai on-premise',
          'SLA 99.9%',
          'Đào tạo và tích hợp',
        ]}
        vietnamese
      >
        <CardFooter>
          <EnhancedButton variant="pricing" className="w-full">
            Liên hệ
          </EnhancedButton>
        </CardFooter>
      </PricingCard>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Complete pricing cards with Vietnamese currency formatting and features.',
      },
    },
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-full max-w-6xl">
      <Card variant="default" className="w-full">
        <CardHeader>
          <CardTitle>Default</CardTitle>
          <CardDescription>Default card variant</CardDescription>
        </CardHeader>
        <CardContent>Standard styling</CardContent>
      </Card>

      <Card variant="elevated" className="w-full">
        <CardHeader>
          <CardTitle>Elevated</CardTitle>
          <CardDescription>Elevated card with shadow</CardDescription>
        </CardHeader>
        <CardContent>Enhanced shadow</CardContent>
      </Card>

      <Card variant="outline" className="w-full">
        <CardHeader>
          <CardTitle>Outline</CardTitle>
          <CardDescription>Outlined card variant</CardDescription>
        </CardHeader>
        <CardContent>Border emphasis</CardContent>
      </Card>

      <Card variant="vietnamese" vietnamese className="w-full">
        <CardHeader>
          <CardTitle vietnamese>Vietnamese</CardTitle>
          <CardDescription vietnamese>Phong cách Việt Nam</CardDescription>
        </CardHeader>
        <CardContent className="font-vietnamese">Văn hóa Việt</CardContent>
      </Card>

      <Card variant="tet" vietnamese className="w-full">
        <CardHeader>
          <CardTitle vietnamese>Tết</CardTitle>
          <CardDescription vietnamese>Chủ đề Tết</CardDescription>
        </CardHeader>
        <CardContent className="font-vietnamese">Màu sắc lễ hội</CardContent>
      </Card>

      <Card variant="pricing" className="w-full">
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>Pricing card style</CardDescription>
        </CardHeader>
        <CardContent>Premium styling</CardContent>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'All available card variants including Vietnamese cultural themes.',
      },
    },
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4 w-full">
      <Card size="sm" variant="vietnamese" vietnamese className="w-full">
        <CardHeader>
          <CardTitle vietnamese>Small</CardTitle>
        </CardHeader>
        <CardContent className="font-vietnamese">Nhỏ</CardContent>
      </Card>

      <Card size="default" variant="vietnamese" vietnamese className="w-full">
        <CardHeader>
          <CardTitle vietnamese>Default</CardTitle>
        </CardHeader>
        <CardContent className="font-vietnamese">Mặc định</CardContent>
      </Card>

      <Card size="lg" variant="vietnamese" vietnamese className="w-full">
        <CardHeader>
          <CardTitle vietnamese>Large</CardTitle>
        </CardHeader>
        <CardContent className="font-vietnamese">Lớn</CardContent>
      </Card>

      <Card size="xl" variant="vietnamese" vietnamese className="w-full">
        <CardHeader>
          <CardTitle vietnamese>Extra Large</CardTitle>
        </CardHeader>
        <CardContent className="font-vietnamese">Rất lớn</CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card size variations with Vietnamese styling.',
      },
    },
  },
}