import type { Meta, StoryObj } from '@storybook/nextjs'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Clean input component following NotebookML design patterns with focus states and semantic styling.',
      },
    },
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'search', 'url', 'tel'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    placeholder: 'Enter your text...',
  },
}

export const WithValue: Story = {
  args: {
    value: 'Sample text content',
    placeholder: 'Enter your text...',
  },
}

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email...',
  },
}

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter your password...',
  },
}

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search documents...',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
    value: 'Cannot edit this',
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2 w-80">
      <label
        htmlFor="document-title"
        className="text-sm font-medium text-primary"
      >
        Document Title
      </label>
      <Input id="document-title" placeholder="Enter document title..." />
    </div>
  ),
}

export const FormExample: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-primary">
          Full Name
        </label>
        <Input id="name" placeholder="Enter your full name..." />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-primary">
          Email Address
        </label>
        <Input id="email" type="email" placeholder="Enter your email..." />
      </div>

      <div className="space-y-2">
        <label htmlFor="company" className="text-sm font-medium text-primary">
          Company (Optional)
        </label>
        <Input id="company" placeholder="Enter your company name..." />
      </div>
    </div>
  ),
}
