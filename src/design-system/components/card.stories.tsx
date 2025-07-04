import type { Meta, StoryObj } from '@storybook/nextjs'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  InteractiveCard 
} from './card'
import { Button } from './button'
import { Badge } from './badge'
import { Heart, Share, MoreHorizontal, Star, User, Calendar, MapPin } from 'lucide-react'

const meta: Meta<typeof Card> = {
  title: 'Design System/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Flexible card component with multiple variants and composable parts.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined', 'ghost'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Card>

// Basic Card
export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the card content area where you can put any content.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
}

// Card Variants
export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-96">
      <Card variant="default">
        <CardHeader>
          <CardTitle className="text-lg">Default</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Default card with subtle shadow</p>
        </CardContent>
      </Card>
      
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-lg">Elevated</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Elevated card with hover effects</p>
        </CardContent>
      </Card>
      
      <Card variant="outlined">
        <CardHeader>
          <CardTitle className="text-lg">Outlined</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Outlined card without shadow</p>
        </CardContent>
      </Card>
      
      <Card variant="ghost">
        <CardHeader>
          <CardTitle className="text-lg">Ghost</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Ghost card with no background</p>
        </CardContent>
      </Card>
    </div>
  ),
}

// Padding Variants
export const Padding: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Card padding="none">
        <div className="p-4 bg-neutral-100 text-sm">No padding (custom content)</div>
      </Card>
      <Card padding="sm">
        <div className="text-sm">Small padding</div>
      </Card>
      <Card padding="md">
        <div className="text-sm">Medium padding (default)</div>
      </Card>
      <Card padding="lg">
        <div className="text-sm">Large padding</div>
      </Card>
    </div>
  ),
}

// Blog Post Card
export const BlogPost: Story = {
  render: () => (
    <Card variant="elevated" className="w-80">
      <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 rounded-t-lg"></div>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">Technology</Badge>
          <div className="flex items-center gap-1 text-sm text-neutral-500">
            <Calendar className="h-4 w-4" />
            Dec 15, 2023
          </div>
        </div>
        <CardTitle className="text-xl">Getting Started with Next.js 14</CardTitle>
        <CardDescription>
          Learn the fundamentals of Next.js 14 and build modern web applications with React Server Components.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <User className="h-4 w-4" />
          John Doe
          <span>•</span>
          <span>5 min read</span>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Share className="h-4 w-4" />
          </Button>
        </div>
        <Button size="sm">Read More</Button>
      </CardFooter>
    </Card>
  ),
}

// Product Card
export const Product: Story = {
  render: () => (
    <Card variant="elevated" className="w-72">
      <div className="relative">
        <div className="aspect-square bg-gradient-to-br from-pink-200 to-orange-200 rounded-t-lg"></div>
        <Badge className="absolute top-2 left-2" variant="destructive">
          Sale
        </Badge>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Wireless Headphones</CardTitle>
            <CardDescription>Premium noise-canceling headphones</CardDescription>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="text-sm text-neutral-500 ml-2">(124 reviews)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">$299</span>
          <span className="text-lg text-neutral-500 line-through">$399</span>
          <Badge variant="success">25% off</Badge>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button className="flex-1">Add to Cart</Button>
        <Button variant="outline" size="icon">
          <Heart className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  ),
}

// User Profile Card
export const UserProfile: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto mb-4"></div>
        <CardTitle>Sarah Johnson</CardTitle>
        <CardDescription>Senior Product Designer</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex items-center justify-center gap-1 mb-4">
          <MapPin className="h-4 w-4 text-neutral-500" />
          <span className="text-sm text-neutral-600">San Francisco, CA</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">127</div>
            <div className="text-xs text-neutral-500">Projects</div>
          </div>
          <div>
            <div className="text-2xl font-bold">2.4k</div>
            <div className="text-xs text-neutral-500">Followers</div>
          </div>
          <div>
            <div className="text-2xl font-bold">342</div>
            <div className="text-xs text-neutral-500">Following</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button className="flex-1">Follow</Button>
        <Button variant="outline" className="flex-1">Message</Button>
      </CardFooter>
    </Card>
  ),
}

// Interactive Cards
export const Interactive: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-96">
      <InteractiveCard 
        variant="elevated"
        onClick={() => alert('Card clicked!')}
        className="cursor-pointer"
      >
        <CardHeader>
          <CardTitle className="text-lg">Clickable Card</CardTitle>
          <CardDescription>Click me to see the action</CardDescription>
        </CardHeader>
      </InteractiveCard>

      <InteractiveCard 
        variant="elevated"
        href="https://example.com"
        className="cursor-pointer"
      >
        <CardHeader>
          <CardTitle className="text-lg">Link Card</CardTitle>
          <CardDescription>This card opens a link</CardDescription>
        </CardHeader>
      </InteractiveCard>
    </div>
  ),
}

// Kitchen Sink
export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6 max-w-4xl">
      <div>
        <h3 className="text-lg font-semibold mb-4">Card Variants</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="default" padding="sm">
            <CardTitle className="text-sm">Default</CardTitle>
          </Card>
          <Card variant="elevated" padding="sm">
            <CardTitle className="text-sm">Elevated</CardTitle>
          </Card>
          <Card variant="outlined" padding="sm">
            <CardTitle className="text-sm">Outlined</CardTitle>
          </Card>
          <Card variant="ghost" padding="sm">
            <CardTitle className="text-sm">Ghost</CardTitle>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Content Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Simple content card */}
          <Card>
            <CardHeader>
              <CardTitle>Simple Card</CardTitle>
              <CardDescription>Basic card with header and content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">This is a simple card with basic content.</p>
            </CardContent>
          </Card>

          {/* Stats card */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1,234</div>
              <div className="text-sm text-neutral-500">Total Users</div>
            </CardContent>
            <CardFooter>
              <Badge variant="success">+12% from last month</Badge>
            </CardFooter>
          </Card>

          {/* Action card */}
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>Ready to begin your journey?</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full">Start Now</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  ),
}