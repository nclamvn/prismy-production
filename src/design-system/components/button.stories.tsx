import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button, ButtonGroup } from './button'
import { Plus, Download, Search, Heart, Settings } from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: 'Design System/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Versatile button component with multiple variants, sizes, and states. Built with accessibility and performance in mind.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select', 
      options: ['xs', 'sm', 'md', 'lg', 'xl', 'icon'],
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Button>

// Default Story
export const Default: Story = {
  args: {
    children: 'Button',
  },
}

// Variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
}

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
}

// With Icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button leftIcon={<Plus className="h-4 w-4" />}>
        Add Item
      </Button>
      <Button rightIcon={<Download className="h-4 w-4" />}>
        Download
      </Button>
      <Button 
        leftIcon={<Search className="h-4 w-4" />}
        rightIcon={<Settings className="h-4 w-4" />}
      >
        Advanced Search
      </Button>
    </div>
  ),
}

// Icon Only
export const IconOnly: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button size="icon" variant="primary">
        <Plus className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="secondary">
        <Download className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="outline">
        <Search className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost">
        <Heart className="h-4 w-4" />
      </Button>
    </div>
  ),
}

// Loading States
export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button loading>Loading</Button>
      <Button loading variant="secondary">Loading</Button>
      <Button loading variant="outline">Loading</Button>
      <Button loading size="sm">Loading</Button>
      <Button loading size="lg">Loading</Button>
    </div>
  ),
}

// Disabled States
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button disabled>Disabled</Button>
      <Button disabled variant="secondary">Disabled</Button>
      <Button disabled variant="outline">Disabled</Button>
      <Button disabled variant="destructive">Disabled</Button>
    </div>
  ),
}

// Button Group
export const GroupHorizontal: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">One</Button>
      <Button variant="outline">Two</Button>
      <Button variant="outline">Three</Button>
    </ButtonGroup>
  ),
}

export const GroupVertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical">
      <Button variant="outline">One</Button>
      <Button variant="outline">Two</Button>
      <Button variant="outline">Three</Button>
    </ButtonGroup>
  ),
}

// Interactive Example
export const Interactive: Story = {
  args: {
    children: 'Click me',
    variant: 'primary',
    size: 'md',
  },
}

// Kitchen Sink
export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">All Variants</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">All Sizes</h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="xs">XS</Button>
          <Button size="sm">SM</Button>
          <Button size="md">MD</Button>
          <Button size="lg">LG</Button>
          <Button size="xl">XL</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">With Icons</h3>
        <div className="flex flex-wrap gap-3">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add</Button>
          <Button rightIcon={<Download className="h-4 w-4" />} variant="secondary">Download</Button>
          <Button size="icon" variant="outline"><Search className="h-4 w-4" /></Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">States</h3>
        <div className="flex flex-wrap gap-3">
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button loading disabled>Loading + Disabled</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Button Groups</h3>
        <div className="space-y-4">
          <ButtonGroup>
            <Button variant="outline">Left</Button>
            <Button variant="outline">Center</Button>
            <Button variant="outline">Right</Button>
          </ButtonGroup>
          
          <ButtonGroup orientation="vertical">
            <Button variant="secondary">Top</Button>
            <Button variant="secondary">Middle</Button>
            <Button variant="secondary">Bottom</Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  ),
}