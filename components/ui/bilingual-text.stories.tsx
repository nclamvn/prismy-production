import type { Meta, StoryObj } from '@storybook/react'
import { 
  BilingualText,
  BilingualHeading,
  BilingualSubtitle,
  BilingualCaption,
  BilingualAccent,
  BilingualNavItem,
  BilingualDescription
} from './bilingual-text'

const meta: Meta<typeof BilingualText> = {
  title: 'Vietnamese Components/Bilingual Text',
  component: BilingualText,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Bilingual text component for displaying English and Vietnamese text with various separators and Vietnamese cultural styling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    en: {
      control: 'text',
      description: 'English text',
    },
    vi: {
      control: 'text', 
      description: 'Vietnamese text',
    },
    variant: {
      control: 'select',
      options: ['default', 'heading', 'subtitle', 'caption', 'accent'],
      description: 'Text variant with Vietnamese cultural styling',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'xl', '2xl', '3xl'],
      description: 'Text size options',
    },
    weight: {
      control: 'select',
      options: ['normal', 'medium', 'semibold', 'bold'],
      description: 'Font weight options',
    },
    separator: {
      control: 'select',
      options: ['pipe', 'slash', 'dash', 'bullet', 'none'],
      description: 'Separator between English and Vietnamese text',
    },
    showOnlyVietnamese: {
      control: 'boolean',
      description: 'Show only Vietnamese text',
    },
    showOnlyEnglish: {
      control: 'boolean',
      description: 'Show only English text',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    en: 'Welcome',
    vi: 'Chào mừng',
  },
}

export const DifferentSeparators: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-center text-lg font-semibold">Separator Options</div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-16">Pipe:</span>
          <BilingualText en="Welcome" vi="Chào mừng" separator="pipe" />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-16">Slash:</span>
          <BilingualText en="Welcome" vi="Chào mừng" separator="slash" />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-16">Dash:</span>
          <BilingualText en="Welcome" vi="Chào mừng" separator="dash" />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-16">Bullet:</span>
          <BilingualText en="Welcome" vi="Chào mừng" separator="bullet" />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-16">None:</span>
          <BilingualText en="Welcome" vi="Chào mừng" separator="none" />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-16">Custom:</span>
          <BilingualText en="Welcome" vi="Chào mừng" customSeparator=" 🇻🇳 " />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different separator options for bilingual text display.',
      },
    },
  },
}

export const NavigationItems: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="text-center text-lg font-semibold">Navigation Menu Items</div>
      
      <div className="flex flex-wrap gap-6 justify-center">
        <BilingualNavItem en="Home" vi="Trang chủ" />
        <BilingualNavItem en="Features" vi="Tính năng" />
        <BilingualNavItem en="Pricing" vi="Bảng giá" />
        <BilingualNavItem en="Contact" vi="Liên hệ" />
        <BilingualNavItem en="Support" vi="Hỗ trợ" />
        <BilingualNavItem en="Documentation" vi="Tài liệu" />
      </div>
      
      <div className="text-center text-sm text-gray-600">
        Typical navigation items for Vietnamese market
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Bilingual navigation items commonly used in Vietnamese websites.',
      },
    },
  },
}

export const ContentHierarchy: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <BilingualHeading 
        en="Prismy Translation Platform" 
        vi="Nền tảng dịch thuật Prismy"
        size="2xl"
      />
      
      <BilingualSubtitle 
        en="AI-powered translation for Vietnamese market"
        vi="Dịch thuật AI cho thị trường Việt Nam"
        size="lg"
      />
      
      <BilingualDescription
        en="Prismy offers state-of-the-art translation services specifically optimized for Vietnamese language nuances and cultural context."
        vi="Prismy cung cấp dịch vụ dịch thuật tiên tiến được tối ưu hóa đặc biệt cho các sắc thái ngôn ngữ và bối cảnh văn hóa Việt Nam."
      />
      
      <div className="space-y-2">
        <BilingualAccent 
          en="Key Features"
          vi="Tính năng chính"
          weight="semibold"
        />
        
        <ul className="space-y-1 ml-4">
          <li><BilingualCaption en="Vietnamese diacritics support" vi="Hỗ trợ dấu tiếng Việt" /></li>
          <li><BilingualCaption en="Cultural context awareness" vi="Nhận thức bối cảnh văn hóa" /></li>
          <li><BilingualCaption en="VND currency formatting" vi="Định dạng tiền tệ VND" /></li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Content hierarchy using different bilingual text variants.',
      },
    },
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-center text-lg font-semibold">Text Variants</div>
      
      <div className="space-y-3">
        <div>
          <span className="text-sm text-gray-600">Default: </span>
          <BilingualText en="Translation" vi="Dịch thuật" variant="default" />
        </div>
        
        <div>
          <span className="text-sm text-gray-600">Heading: </span>
          <BilingualText en="Translation" vi="Dịch thuật" variant="heading" />
        </div>
        
        <div>
          <span className="text-sm text-gray-600">Subtitle: </span>
          <BilingualText en="Translation" vi="Dịch thuật" variant="subtitle" />
        </div>
        
        <div>
          <span className="text-sm text-gray-600">Caption: </span>
          <BilingualText en="Translation" vi="Dịch thuật" variant="caption" />
        </div>
        
        <div>
          <span className="text-sm text-gray-600">Accent: </span>
          <BilingualText en="Translation" vi="Dịch thuật" variant="accent" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available text variants with Vietnamese cultural styling.',
      },
    },
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-center text-lg font-semibold">Text Sizes</div>
      
      <div className="space-y-3">
        <BilingualText en="Extra Small" vi="Rất nhỏ" size="xs" variant="accent" />
        <BilingualText en="Small" vi="Nhỏ" size="sm" variant="accent" />
        <BilingualText en="Default" vi="Mặc định" size="default" variant="accent" />
        <BilingualText en="Large" vi="Lớn" size="lg" variant="accent" />
        <BilingualText en="Extra Large" vi="Rất lớn" size="xl" variant="accent" />
        <BilingualText en="2X Large" vi="2X lớn" size="2xl" variant="accent" />
        <BilingualText en="3X Large" vi="3X lớn" size="3xl" variant="accent" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Text size variations with Vietnamese styling.',
      },
    },
  },
}

export const LanguageToggle: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="text-center text-lg font-semibold">Language Display Options</div>
      
      <div className="grid grid-cols-3 gap-6 text-center">
        <div className="space-y-2">
          <div className="text-sm text-gray-600 font-semibold">Bilingual</div>
          <BilingualText 
            en="Welcome to Prismy" 
            vi="Chào mừng đến với Prismy"
            variant="heading"
            size="lg"
          />
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-600 font-semibold">English Only</div>
          <BilingualText 
            en="Welcome to Prismy" 
            vi="Chào mừng đến với Prismy"
            variant="heading"
            size="lg"
            showOnlyEnglish
          />
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-600 font-semibold">Vietnamese Only</div>
          <BilingualText 
            en="Welcome to Prismy" 
            vi="Chào mừng đến với Prismy"
            variant="heading"
            size="lg"
            showOnlyVietnamese
          />
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-600">
        Dynamic language display based on user preferences
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Options for displaying bilingual, English-only, or Vietnamese-only text.',
      },
    },
  },
}

export const BusinessTerms: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="text-center text-lg font-semibold font-vietnamese">
        Thuật ngữ kinh doanh | Business Terms
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <BilingualText en="Pricing Plans" vi="Gói dịch vụ" variant="accent" />
        <BilingualText en="Free Trial" vi="Dùng thử miễn phí" variant="accent" />
        <BilingualText en="Enterprise" vi="Doanh nghiệp" variant="accent" />
        <BilingualText en="Customer Support" vi="Hỗ trợ khách hàng" variant="accent" />
        <BilingualText en="Documentation" vi="Tài liệu hướng dẫn" variant="accent" />
        <BilingualText en="API Access" vi="Truy cập API" variant="accent" />
        <BilingualText en="Translation Memory" vi="Bộ nhớ dịch thuật" variant="accent" />
        <BilingualText en="Quality Assurance" vi="Đảm bảo chất lượng" variant="accent" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common business terms displayed in bilingual format for Vietnamese market.',
      },
    },
  },
}