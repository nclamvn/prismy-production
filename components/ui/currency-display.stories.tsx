import type { Meta, StoryObj } from '@storybook/react'
import { 
  CurrencyDisplay, 
  VNDDisplay, 
  PricingDisplay, 
  LargeCurrencyDisplay 
} from './currency-display'

const meta: Meta<typeof CurrencyDisplay> = {
  title: 'Vietnamese Components/Currency Display',
  component: CurrencyDisplay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Vietnamese currency display component with VND formatting, cultural styling, and multiple size variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    amount: {
      control: 'number',
      description: 'The amount to display',
    },
    currency: {
      control: 'select',
      options: ['VND', 'USD'],
      description: 'Currency type',
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'muted', 'pricing', 'large'],
      description: 'Display variant with Vietnamese cultural colors',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl', '2xl', '3xl'],
      description: 'Text size options',
    },
    showSymbol: {
      control: 'boolean',
      description: 'Show currency symbol',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    amount: 239000,
    currency: 'VND',
  },
}

export const VNDFormatting: Story = {
  render: () => (
    <div className="space-y-4 text-center">
      <div className="text-lg font-semibold">VND Currency Formatting</div>
      <div className="space-y-2">
        <div>
          <span className="text-sm text-gray-600">Small amount: </span>
          <VNDDisplay amount={1000} />
        </div>
        <div>
          <span className="text-sm text-gray-600">Medium amount: </span>
          <VNDDisplay amount={50000} />
        </div>
        <div>
          <span className="text-sm text-gray-600">Large amount: </span>
          <VNDDisplay amount={1000000} />
        </div>
        <div>
          <span className="text-sm text-gray-600">Enterprise amount: </span>
          <VNDDisplay amount={10000000} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Vietnamese Dong formatting with proper thousand separators (dots).',
      },
    },
  },
}

export const PricingExamples: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="text-center text-lg font-semibold font-vietnamese">
        Bảng giá Prismy
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="text-center space-y-2 p-4 border rounded-lg">
          <div className="font-vietnamese text-sm text-gray-600">Miễn phí</div>
          <PricingDisplay amount={0} variant="success" size="2xl" />
          <div className="text-xs text-gray-500 font-vietnamese">Mãi mãi</div>
        </div>
        
        <div className="text-center space-y-2 p-4 border rounded-lg">
          <div className="font-vietnamese text-sm text-gray-600">Tiêu chuẩn</div>
          <PricingDisplay amount={239000} size="2xl" />
          <div className="text-xs text-gray-500 font-vietnamese">/tháng</div>
        </div>
        
        <div className="text-center space-y-2 p-4 border rounded-lg">
          <div className="font-vietnamese text-sm text-gray-600">Cao cấp</div>
          <PricingDisplay amount={719000} size="2xl" />
          <div className="text-xs text-gray-500 font-vietnamese">/tháng</div>
        </div>
        
        <div className="text-center space-y-2 p-4 border rounded-lg">
          <div className="font-vietnamese text-sm text-gray-600">Doanh nghiệp</div>
          <PricingDisplay amount={2399000} size="2xl" />
          <div className="text-xs text-gray-500 font-vietnamese">/tháng</div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pricing display examples for Vietnamese market with proper VND formatting.',
      },
    },
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-center text-lg font-semibold">Currency Display Variants</div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Default:</div>
          <CurrencyDisplay amount={239000} variant="default" />
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Primary (Vietnamese Red):</div>
          <CurrencyDisplay amount={239000} variant="primary" />
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Success:</div>
          <CurrencyDisplay amount={239000} variant="success" />
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Muted:</div>
          <CurrencyDisplay amount={239000} variant="muted" />
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Pricing:</div>
          <CurrencyDisplay amount={239000} variant="pricing" />
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Large:</div>
          <CurrencyDisplay amount={239000} variant="large" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available currency display variants including Vietnamese cultural colors.',
      },
    },
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-center text-lg font-semibold">Currency Display Sizes</div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-16">Small:</span>
          <CurrencyDisplay amount={239000} size="sm" variant="primary" />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-16">Default:</span>
          <CurrencyDisplay amount={239000} size="default" variant="primary" />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-16">Large:</span>
          <CurrencyDisplay amount={239000} size="lg" variant="primary" />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-16">XL:</span>
          <CurrencyDisplay amount={239000} size="xl" variant="primary" />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-16">2XL:</span>
          <CurrencyDisplay amount={239000} size="2xl" variant="primary" />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-16">3XL:</span>
          <CurrencyDisplay amount={239000} size="3xl" variant="primary" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Currency display size variations with Vietnamese styling.',
      },
    },
  },
}

export const USDvsVND: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="text-center text-lg font-semibold">Currency Comparison</div>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="text-center space-y-4">
          <div className="text-sm font-semibold text-gray-700">USD Currency</div>
          <div className="space-y-2">
            <CurrencyDisplay amount={9.99} currency="USD" size="lg" />
            <CurrencyDisplay amount={29.99} currency="USD" size="lg" />
            <CurrencyDisplay amount={99.99} currency="USD" size="lg" />
          </div>
        </div>
        
        <div className="text-center space-y-4">
          <div className="text-sm font-semibold text-gray-700 font-vietnamese">VND Currency</div>
          <div className="space-y-2">
            <VNDDisplay amount={239000} size="lg" />
            <VNDDisplay amount={719000} size="lg" />
            <VNDDisplay amount={2399000} size="lg" />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison between USD and VND currency formatting.',
      },
    },
  },
}

export const LargeDisplays: Story = {
  render: () => (
    <div className="space-y-8 text-center">
      <div className="text-lg font-semibold">Large Currency Displays</div>
      
      <div className="space-y-6">
        <div>
          <div className="text-sm text-gray-600 font-vietnamese mb-2">Giá khuyến mãi</div>
          <LargeCurrencyDisplay amount={199000} />
        </div>
        
        <div>
          <div className="text-sm text-gray-600 font-vietnamese mb-2">Giá thường</div>
          <LargeCurrencyDisplay amount={399000} />
          <div className="text-sm text-gray-400 line-through">719.000 ₫</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-600 font-vietnamese mb-2">Tổng doanh thu</div>
          <LargeCurrencyDisplay amount={15750000} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Large currency displays for promotional pricing and revenue displays.',
      },
    },
  },
}