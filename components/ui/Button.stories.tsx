import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'
import { Mail, Download, Trash2, Plus, ArrowRight } from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Master Prompt compliant button component with comprehensive variants, accessibility features, and bilingual support.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'ghost', 'primary', 'outline', 'secondary', 'destructive', 'link'],
      description: 'Button visual variant',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Button size',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state with spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    asChild: {
      control: 'boolean',
      description: 'Render as child component (using Radix Slot)',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: {
    children: 'Button',
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available button variants following Master Prompt design system.',
      },
    },
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button sizes with proper touch targets (44px minimum for accessibility).',
      },
    },
  },
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>
        <Mail className="mr-2 h-4 w-4" />
        Email
      </Button>
      <Button variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      <Button variant="destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
      <Button variant="ghost">
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with icons positioned before or after text content.',
      },
    },
  },
}

export const IconOnly: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button size="icon" aria-label="Add item">
        <Plus className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="outline" aria-label="Download file">
        <Download className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Send email">
        <Mail className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="destructive" aria-label="Delete item">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon-only buttons with proper aria-label for accessibility.',
      },
    },
  },
}

export const LoadingStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button loading>Loading...</Button>
      <Button loading variant="outline">
        Processing
      </Button>
      <Button loading variant="ghost">
        Saving
      </Button>
      <Button loading size="sm">
        Small Loading
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading states with spinner and proper aria-busy attributes.',
      },
    },
  },
}

export const DisabledStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button disabled>Disabled</Button>
      <Button disabled variant="outline">
        Disabled Outline
      </Button>
      <Button disabled variant="ghost">
        Disabled Ghost
      </Button>
      <Button disabled size="icon" aria-label="Disabled action">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disabled button states with proper accessibility attributes.',
      },
    },
  },
}

export const AsChild: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button asChild>
        <a href="#" role="button">
          Link as Button
        </a>
      </Button>
      <Button asChild variant="outline">
        <a href="#" role="button">
          External Link
        </a>
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Using asChild prop to render buttons as other elements (links, etc.).',
      },
    },
  },
}

export const BilingualSupport: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button>English Button</Button>
        <Button variant="outline">Save Changes</Button>
      </div>
      <div className="flex gap-4" dir="rtl">
        <Button>زر عربي</Button>
        <Button variant="outline">حفظ التغييرات</Button>
      </div>
      <div className="flex gap-4">
        <Button>中文按钮</Button>
        <Button variant="outline">保存更改</Button>
      </div>
      <div className="flex gap-4">
        <Button>Nút Tiếng Việt</Button>
        <Button variant="outline">Lưu Thay Đổi</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button component with bilingual text support and RTL layout compatibility.',
      },
    },
  },
}

export const ReducedMotion: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        These buttons respect prefers-reduced-motion settings
      </p>
      <div className="flex gap-4">
        <Button loading>Loading (Reduced Motion)</Button>
        <Button variant="outline">
          <ArrowRight className="mr-2 h-4 w-4" />
          With Animation
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons that respect user motion preferences for accessibility.',
      },
    },
  },
}

export const HighContrast: Story = {
  render: () => (
    <div className="high-contrast space-y-4">
      <p className="text-sm">High contrast mode simulation</p>
      <div className="flex flex-wrap gap-4">
        <Button>Default</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button appearance in high contrast mode for accessibility.',
      },
    },
  },
}

export const InteractiveExample: Story = {
  render: () => {
    const handleClick = () => {
      alert('Button clicked! In a real app, this would perform an action.')
    }

    return (
      <div className="space-y-4">
        <Button onClick={handleClick}>
          Click Me
        </Button>
        <Button variant="outline" onClick={handleClick}>
          <Download className="mr-2 h-4 w-4" />
          Download File
        </Button>
        <Button variant="ghost" onClick={handleClick}>
          Cancel
        </Button>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive buttons with click handlers for testing user interactions.',
      },
    },
  },
}

// Playground story for testing all combinations
export const Playground: Story = {
  args: {
    children: 'Playground Button',
    variant: 'default',
    size: 'default',
    loading: false,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Playground for testing different button configurations.',
      },
    },
  },
}