import type { Meta, StoryObj } from '@storybook/nextjs'
import { Badge, DotBadge, NotificationBadge } from './badge'
import { Star, User, Bell, Mail, Heart, Tag } from 'lucide-react'
import { Button } from './button'

const meta: Meta<typeof Badge> = {
  title: 'Design System/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Badge component for displaying status, categories, or notifications.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'success', 'warning', 'info', 'outline', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    removable: {
      control: 'boolean',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Badge>

// Default
export const Default: Story = {
  args: {
    children: 'Badge',
  },
}

// Variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
    </div>
  ),
}

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
}

// With Icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge icon={<Star className="h-3 w-3" />}>Featured</Badge>
      <Badge variant="success" icon={<User className="h-3 w-3" />}>Admin</Badge>
      <Badge variant="warning" icon={<Bell className="h-3 w-3" />}>Alert</Badge>
      <Badge variant="info" icon={<Mail className="h-3 w-3" />}>Message</Badge>
    </div>
  ),
}

// Removable Badges
export const Removable: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge removable onRemove={() => alert('Removed!')}>Removable</Badge>
      <Badge variant="secondary" removable onRemove={() => alert('Removed!')}>
        React
      </Badge>
      <Badge variant="outline" removable onRemove={() => alert('Removed!')}>
        TypeScript
      </Badge>
    </div>
  ),
}

// Dot Badges
export const DotBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <DotBadge>Online</DotBadge>
      <DotBadge dotColor="success">Available</DotBadge>
      <DotBadge dotColor="warning">Away</DotBadge>
      <DotBadge dotColor="error">Busy</DotBadge>
      <DotBadge dotColor="info">In Meeting</DotBadge>
    </div>
  ),
}

// Notification Badges
export const NotificationBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      <NotificationBadge count={3}>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </NotificationBadge>
      
      <NotificationBadge count={12}>
        <Button variant="ghost" size="icon">
          <Mail className="h-5 w-5" />
        </Button>
      </NotificationBadge>
      
      <NotificationBadge count={99}>
        <Button variant="ghost" size="icon">
          <Heart className="h-5 w-5" />
        </Button>
      </NotificationBadge>
      
      <NotificationBadge count={999} max={99}>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </NotificationBadge>
    </div>
  ),
}

// Status Examples
export const StatusExamples: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <span>Order #1234</span>
        <Badge variant="success">Completed</Badge>
      </div>
      
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <span>Order #1235</span>
        <Badge variant="warning">Pending</Badge>
      </div>
      
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <span>Order #1236</span>
        <Badge variant="destructive">Failed</Badge>
      </div>
      
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <span>Order #1237</span>
        <Badge variant="info">Processing</Badge>
      </div>
    </div>
  ),
}

// Category Tags
export const CategoryTags: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Skills</h4>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" size="sm">React</Badge>
          <Badge variant="outline" size="sm">TypeScript</Badge>
          <Badge variant="outline" size="sm">Next.js</Badge>
          <Badge variant="outline" size="sm">Tailwind</Badge>
          <Badge variant="outline" size="sm">Node.js</Badge>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Categories</h4>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" icon={<Tag className="h-3 w-3" />}>
            Frontend
          </Badge>
          <Badge variant="secondary" icon={<Tag className="h-3 w-3" />}>
            Backend
          </Badge>
          <Badge variant="secondary" icon={<Tag className="h-3 w-3" />}>
            Design
          </Badge>
        </div>
      </div>
    </div>
  ),
}

// Interactive Example
export const Interactive: Story = {
  args: {
    children: 'Interactive Badge',
    variant: 'default',
    size: 'md',
  },
}

// Kitchen Sink
export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold mb-4">Variants</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="ghost">Ghost</Badge>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Sizes</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
          <Badge size="lg">Large</Badge>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">With Icons</h3>
        <div className="flex flex-wrap gap-2">
          <Badge icon={<Star className="h-3 w-3" />}>Featured</Badge>
          <Badge variant="success" icon={<User className="h-3 w-3" />}>Admin</Badge>
          <Badge variant="warning" icon={<Bell className="h-3 w-3" />}>Alert</Badge>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Removable</h3>
        <div className="flex flex-wrap gap-2">
          <Badge removable>Tag 1</Badge>
          <Badge variant="secondary" removable>Tag 2</Badge>
          <Badge variant="outline" removable>Tag 3</Badge>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Dot Badges</h3>
        <div className="flex flex-wrap gap-2">
          <DotBadge dotColor="success">Online</DotBadge>
          <DotBadge dotColor="warning">Away</DotBadge>
          <DotBadge dotColor="error">Busy</DotBadge>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Notification Badges</h3>
        <div className="flex flex-wrap gap-4">
          <NotificationBadge count={3}>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </NotificationBadge>
          <NotificationBadge count={99}>
            <Button variant="ghost" size="icon">
              <Mail className="h-5 w-5" />
            </Button>
          </NotificationBadge>
          <NotificationBadge count={999} max={99}>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </NotificationBadge>
        </div>
      </div>
    </div>
  ),
}