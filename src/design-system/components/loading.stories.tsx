import type { Meta, StoryObj } from '@storybook/nextjs'
import { 
  Spinner, 
  Dots, 
  Pulse, 
  Skeleton, 
  LoadingOverlay,
  CardSkeleton,
  ListSkeleton,
  Progress 
} from './loading'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { useState } from 'react'

const meta: Meta<typeof Spinner> = {
  title: 'Design System/Loading',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Comprehensive loading components including spinners, skeletons, and progress indicators.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Spinner>

// Spinner Variants
export const Spinners: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Spinner Sizes</h3>
        <div className="flex items-center gap-4">
          <Spinner size="xs" />
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <Spinner size="xl" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Spinner Variants</h3>
        <div className="flex items-center gap-4">
          <Spinner variant="default" />
          <Spinner variant="muted" />
          <div className="bg-gray-800 p-2 rounded">
            <Spinner variant="white" />
          </div>
        </div>
      </div>
    </div>
  ),
}

// Dots Animation
export const DotsAnimation: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Dots Sizes</h3>
        <div className="flex items-center gap-4">
          <Dots size="xs" />
          <Dots size="sm" />
          <Dots size="md" />
          <Dots size="lg" />
          <Dots size="xl" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Dots Variants</h3>
        <div className="flex items-center gap-4">
          <Dots variant="default" />
          <Dots variant="muted" />
          <div className="bg-gray-800 p-2 rounded">
            <Dots variant="white" />
          </div>
        </div>
      </div>
    </div>
  ),
}

// Skeletons
export const Skeletons: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Skeletons</h3>
        <div className="space-y-3">
          <Skeleton width="100%" height={20} />
          <Skeleton width="80%" height={16} />
          <Skeleton width="60%" height={16} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Skeleton Shapes</h3>
        <div className="flex items-center gap-4">
          <Skeleton shape="rectangle" width={60} height={40} />
          <Skeleton shape="rounded" width={60} height={40} />
          <Skeleton shape="circle" width={40} height={40} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Card Skeleton</h3>
        <Card>
          <CardSkeleton />
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">List Skeleton</h3>
        <Card>
          <CardContent>
            <ListSkeleton items={4} />
          </CardContent>
        </Card>
      </div>
    </div>
  ),
}

// Loading Overlay
export const LoadingOverlayDemo: Story = {
  render: () => {
    const [isLoading, setIsLoading] = useState(false)

    const simulateLoading = () => {
      setIsLoading(true)
      setTimeout(() => setIsLoading(false), 3000)
    }

    return (
      <div className="space-y-6">
        <Button onClick={simulateLoading}>Start Loading</Button>
        
        <LoadingOverlay isLoading={isLoading} text="Loading content...">
          <Card className="w-80">
            <CardHeader>
              <CardTitle>Sample Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This content will be overlaid with a loading spinner when the button is clicked.</p>
              <div className="mt-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </LoadingOverlay>
      </div>
    )
  },
}

// Progress Bars
export const ProgressBars: Story = {
  render: () => {
    const [progress, setProgress] = useState(0)

    const startProgress = () => {
      setProgress(0)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 200)
    }

    return (
      <div className="space-y-6 w-80">
        <Button onClick={startProgress}>Start Progress</Button>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Progress Sizes</h3>
          <div className="space-y-3">
            <Progress value={75} size="sm" showLabel />
            <Progress value={50} size="md" showLabel />
            <Progress value={25} size="lg" showLabel />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Progress Variants</h3>
          <div className="space-y-3">
            <Progress value={progress} variant="default" showLabel />
            <Progress value={progress} variant="success" showLabel />
            <Progress value={progress} variant="warning" showLabel />
            <Progress value={progress} variant="error" showLabel />
          </div>
        </div>
      </div>
    )
  },
}

// Pulse Animation
export const PulseAnimation: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Pulse Animation</h3>
      <div className="space-y-3">
        <Pulse>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </Pulse>
        <Pulse>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </Pulse>
        <Pulse>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </Pulse>
      </div>
    </div>
  ),
}

// Kitchen Sink
export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold mb-4">Spinners</h3>
        <div className="flex items-center gap-4">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <Spinner variant="muted" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Dots</h3>
        <div className="flex items-center gap-4">
          <Dots size="sm" />
          <Dots size="md" />
          <Dots size="lg" />
          <Dots variant="muted" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Skeletons</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton width="100%" height={16} />
            <Skeleton width="80%" height={16} />
            <Skeleton width="60%" height={16} />
          </div>
          
          <div className="flex items-center gap-3">
            <Skeleton shape="circle" width={40} height={40} />
            <div className="space-y-2 flex-1">
              <Skeleton height={14} width="70%" />
              <Skeleton height={12} width="50%" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Progress</h3>
        <div className="space-y-3">
          <Progress value={25} variant="default" showLabel />
          <Progress value={50} variant="success" showLabel />
          <Progress value={75} variant="warning" showLabel />
          <Progress value={90} variant="error" showLabel />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Complex Skeletons</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardSkeleton />
          </Card>
          
          <Card>
            <CardContent>
              <ListSkeleton items={3} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
}