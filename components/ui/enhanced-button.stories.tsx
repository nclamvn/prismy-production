import type { Meta, StoryObj } from '@storybook/react'
import { 
  EnhancedButton, 
  VietnameseButton, 
  TetButton, 
  PricingButton, 
  BilingualButton 
} from './enhanced-button'

const meta: Meta<typeof EnhancedButton> = {
  title: 'Vietnamese Components/Enhanced Button',
  component: EnhancedButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enhanced button component with Vietnamese cultural variants, bilingual text support, and pricing display features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'vietnamese', 'tet', 'pricing'],
      description: 'Button variant including Vietnamese cultural themes',
    },
    size: {
      control: 'select', 
      options: ['default', 'sm', 'lg', 'xl', 'icon'],
      description: 'Button size options',
    },
    vietnamese: {
      control: 'boolean',
      description: 'Apply Vietnamese typography and styling',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state with spinner',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Default Button',
    variant: 'default',
  },
}

export const Vietnamese: Story = {
  args: {
    children: 'Nút Vietnamese',
    variant: 'vietnamese',
    vietnamese: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with Vietnamese cultural colors and typography.',
      },
    },
  },
}

export const TetTheme: Story = {
  args: {
    children: 'Nút Tết',
    variant: 'tet',
    vietnamese: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Special Tết (Vietnamese New Year) themed button with gold background.',
      },
    },
  },
}

export const BilingualText: Story = {
  render: (args) => (
    <BilingualButton 
      en="Get Started"
      vi="Bắt đầu"
      variant="default"
      {...args}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button displaying bilingual text in English | Vietnamese format.',
      },
    },
  },
}

export const PricingButtons: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <PricingButton
        plan="free"
        amount={0}
        currency="VND"
        className="w-48"
      >
        Miễn phí
      </PricingButton>
      
      <PricingButton
        plan="standard" 
        amount={239000}
        currency="VND"
        className="w-48"
      >
        Tiêu chuẩn
      </PricingButton>
      
      <PricingButton
        plan="premium"
        amount={719000}
        currency="VND"
        className="w-48"
      >
        Cao cấp
      </PricingButton>
      
      <PricingButton
        plan="enterprise"
        amount={2399000}
        currency="VND"
        className="w-48"
      >
        Doanh nghiệp
      </PricingButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pricing buttons with Vietnamese currency formatting.',
      },
    },
  },
}

export const LoadingStates: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <EnhancedButton loading loadingText="Đang tải...">
        Loading Button
      </EnhancedButton>
      
      <VietnameseButton loading loadingText="Đang xử lý...">
        Vietnamese Loading
      </VietnameseButton>
      
      <TetButton loading loadingText="Vui lòng chờ...">
        Tết Loading
      </TetButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button loading states with Vietnamese loading text.',
      },
    },
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 items-center">
      <EnhancedButton variant="default">Default</EnhancedButton>
      <EnhancedButton variant="destructive">Destructive</EnhancedButton>
      <EnhancedButton variant="outline">Outline</EnhancedButton>
      <EnhancedButton variant="secondary">Secondary</EnhancedButton>
      <EnhancedButton variant="ghost">Ghost</EnhancedButton>
      <EnhancedButton variant="link">Link</EnhancedButton>
      <EnhancedButton variant="vietnamese" vietnamese>Vietnamese</EnhancedButton>
      <EnhancedButton variant="tet" vietnamese>Tết</EnhancedButton>
      <EnhancedButton variant="pricing">Pricing</EnhancedButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available button variants including Vietnamese cultural themes.',
      },
    },
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <EnhancedButton size="sm" variant="vietnamese" vietnamese>
        Small
      </EnhancedButton>
      <EnhancedButton size="default" variant="vietnamese" vietnamese>
        Default
      </EnhancedButton>
      <EnhancedButton size="lg" variant="vietnamese" vietnamese>
        Large
      </EnhancedButton>
      <EnhancedButton size="xl" variant="vietnamese" vietnamese>
        Extra Large
      </EnhancedButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button size variations with Vietnamese styling.',
      },
    },
  },
}

export const CulturalThemeComparison: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-center font-vietnamese text-lg font-semibold">
        Vietnamese Cultural Themes | Chủ đề văn hóa Việt Nam
      </div>
      
      <div className="flex gap-4 justify-center">
        <div className="text-center space-y-2">
          <div className="text-sm font-vietnamese">Default | Mặc định</div>
          <EnhancedButton variant="default">
            Button | Nút
          </EnhancedButton>
        </div>
        
        <div className="text-center space-y-2">
          <div className="text-sm font-vietnamese">Vietnamese | Việt Nam</div>
          <VietnameseButton>
            Nút Vietnamese
          </VietnameseButton>
        </div>
        
        <div className="text-center space-y-2">
          <div className="text-sm font-vietnamese">Tết Theme | Chủ đề Tết</div>
          <TetButton>
            Nút Tết
          </TetButton>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different Vietnamese cultural themes side by side.',
      },
    },
  },
}