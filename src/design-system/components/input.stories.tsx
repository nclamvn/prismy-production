import type { Meta, StoryObj } from '@storybook/nextjs'
import { Input, Textarea } from './input'
import { Search, User, Mail } from 'lucide-react'

const meta: Meta<typeof Input> = {
  title: 'Design System/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Input component with multiple variants, sizes, and states. Includes support for icons, labels, and validation states.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'error', 'success'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Input>

// Default
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

// Kitchen Sink simplified to avoid conflicts
export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold mb-4">Design System Input Components</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input placeholder="Default input" />
            <Input variant="filled" placeholder="Filled variant" />
            <Input variant="error" placeholder="Error state" error="This field is required" />
            <Input variant="success" placeholder="Success state" success="Valid input!" />
          </div>
          
          <div className="space-y-2">
            <Input 
              placeholder="Input with search icon"
              leftIcon={<Search className="h-4 w-4" />}
            />
            <Input 
              placeholder="Input with user icon"
              leftIcon={<User className="h-4 w-4" />}
            />
            <Input 
              placeholder="Input with mail icon"
              leftIcon={<Mail className="h-4 w-4" />}
            />
          </div>

          <Textarea
            placeholder="Textarea example..."
            rows={3}
            label="Message"
          />
        </div>
      </div>
    </div>
  ),
}