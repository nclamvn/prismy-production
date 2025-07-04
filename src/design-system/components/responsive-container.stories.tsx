import type { Meta, StoryObj } from '@storybook/nextjs'
import { Container, Grid, GridItem, Stack, Show, Hide, useBreakpoint } from './responsive-container'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'

const meta: Meta<typeof Container> = {
  title: 'Design System/Responsive Layout',
  component: Container,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Responsive layout components including containers, grids, stacks, and visibility utilities. Supports mobile-first responsive design.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Container>

// Responsive Container
export const ResponsiveContainer: Story = {
  render: () => (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-2xl font-bold mb-4">Container Sizes</h2>
        <div className="space-y-4">
          {(['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'] as const).map((size) => (
            <Container key={size} size={size} className="bg-blue-50 border-2 border-blue-200 py-4">
              <div className="text-center">
                <Badge variant="secondary">{size}</Badge>
                <p className="mt-2 text-sm text-neutral-600">
                  Container with max-width {size}
                </p>
              </div>
            </Container>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Container Padding</h2>
        <div className="space-y-4">
          {(['none', 'sm', 'md', 'lg', 'xl'] as const).map((padding) => (
            <Container key={padding} size="4xl" padding={padding} className="bg-green-50 border-2 border-green-200 py-4">
              <div className="bg-green-200 p-2 text-center">
                <Badge variant="success">{padding} padding</Badge>
              </div>
            </Container>
          ))}
        </div>
      </div>
    </div>
  ),
}

// Responsive Grid System
export const ResponsiveGrid: Story = {
  render: () => (
    <Container className="space-y-8 py-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Responsive Grid Layouts</h2>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">2 Columns (1 on mobile, 2 on md+)</h3>
            <Grid cols={2}>
              {Array.from({ length: 4 }, (_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Badge>Item {i + 1}</Badge>
                      <p className="mt-2 text-sm text-neutral-600">Grid item content</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">3 Columns (1 → 2 → 3)</h3>
            <Grid cols={3}>
              {Array.from({ length: 6 }, (_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Badge variant="secondary">Item {i + 1}</Badge>
                      <p className="mt-2 text-sm text-neutral-600">Grid item content</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">4 Columns (1 → 2 → 4)</h3>
            <Grid cols={4}>
              {Array.from({ length: 8 }, (_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Badge variant="outline">Item {i + 1}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </div>
        </div>
      </div>
    </Container>
  ),
}

// Grid with Explicit Spanning
export const GridSpanning: Story = {
  render: () => (
    <Container className="space-y-8 py-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Grid Column Spanning</h2>
        
        <Grid cols={12} className="grid-cols-12">
          <GridItem span={12} className="mb-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Badge>Full Width (12 columns)</Badge>
              </CardContent>
            </Card>
          </GridItem>

          <GridItem span={6} spanMd={8}>
            <Card>
              <CardContent className="p-6 text-center">
                <Badge variant="secondary">6 cols → 8 cols on md+</Badge>
              </CardContent>
            </Card>
          </GridItem>

          <GridItem span={6} spanMd={4}>
            <Card>
              <CardContent className="p-6 text-center">
                <Badge variant="secondary">6 cols → 4 cols on md+</Badge>
              </CardContent>
            </Card>
          </GridItem>

          <GridItem span={4}>
            <Card>
              <CardContent className="p-4 text-center">
                <Badge variant="outline">4 cols</Badge>
              </CardContent>
            </Card>
          </GridItem>

          <GridItem span={4}>
            <Card>
              <CardContent className="p-4 text-center">
                <Badge variant="outline">4 cols</Badge>
              </CardContent>
            </Card>
          </GridItem>

          <GridItem span={4}>
            <Card>
              <CardContent className="p-4 text-center">
                <Badge variant="outline">4 cols</Badge>
              </CardContent>
            </Card>
          </GridItem>
        </Grid>
      </div>
    </Container>
  ),
}

// Stack Layouts
export const StackLayouts: Story = {
  render: () => (
    <Container className="space-y-8 py-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Stack Layouts</h2>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Horizontal Stack</h3>
            <Stack direction="row" gap="md" wrap>
              <Button>Button 1</Button>
              <Button variant="secondary">Button 2</Button>
              <Button variant="outline">Button 3</Button>
              <Button variant="ghost">Button 4</Button>
            </Stack>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Vertical Stack</h3>
            <Stack direction="col" gap="sm" className="max-w-xs">
              <Button className="w-full">Action 1</Button>
              <Button variant="secondary" className="w-full">Action 2</Button>
              <Button variant="outline" className="w-full">Action 3</Button>
            </Stack>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Responsive Stack (Column → Row)</h3>
            <Stack responsive gap="md" align="center">
              <div className="flex-1">
                <h4 className="font-semibold">Stack Item 1</h4>
                <p className="text-sm text-neutral-600">This content stacks vertically on mobile and horizontally on larger screens.</p>
              </div>
              <div className="flex-shrink-0">
                <Button>Call to Action</Button>
              </div>
            </Stack>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Stack with Different Alignments</h3>
            <div className="space-y-4">
              <Stack direction="row" justify="between" align="center" className="p-4 border rounded-lg">
                <span>Space Between</span>
                <Badge>Badge</Badge>
              </Stack>
              
              <Stack direction="row" justify="center" align="center" className="p-4 border rounded-lg">
                <span>Centered</span>
                <Badge>Badge</Badge>
              </Stack>
              
              <Stack direction="row" justify="end" align="center" className="p-4 border rounded-lg">
                <span>End Aligned</span>
                <Badge>Badge</Badge>
              </Stack>
            </div>
          </div>
        </div>
      </div>
    </Container>
  ),
}

// Responsive Visibility
export const ResponsiveVisibility: Story = {
  render: () => (
    <Container className="space-y-8 py-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Responsive Visibility</h2>
        <p className="text-neutral-600 mb-6">Resize your browser window to see elements show/hide at different breakpoints.</p>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Show Above Breakpoints</h3>
            <div className="space-y-2">
              <Show above="sm">
                <Badge variant="success">Visible on SM and above (≥640px)</Badge>
              </Show>
              <Show above="md">
                <Badge variant="success">Visible on MD and above (≥768px)</Badge>
              </Show>
              <Show above="lg">
                <Badge variant="success">Visible on LG and above (≥1024px)</Badge>
              </Show>
              <Show above="xl">
                <Badge variant="success">Visible on XL and above (≥1280px)</Badge>
              </Show>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Hide Above Breakpoints</h3>
            <div className="space-y-2">
              <Hide above="sm">
                <Badge variant="destructive">Hidden on SM and above (≥640px)</Badge>
              </Hide>
              <Hide above="md">
                <Badge variant="destructive">Hidden on MD and above (≥768px)</Badge>
              </Hide>
              <Hide above="lg">
                <Badge variant="destructive">Hidden on LG and above (≥1024px)</Badge>
              </Hide>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Show Only on Specific Breakpoints</h3>
            <div className="space-y-2">
              <Show only="sm">
                <Badge variant="info">Only visible on SM (640px - 767px)</Badge>
              </Show>
              <Show only="md">
                <Badge variant="info">Only visible on MD (768px - 1023px)</Badge>
              </Show>
              <Show only="lg">
                <Badge variant="info">Only visible on LG (1024px - 1279px)</Badge>
              </Show>
              <Show only="xl">
                <Badge variant="info">Only visible on XL (1280px - 1535px)</Badge>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </Container>
  ),
}

// Breakpoint Hook Demo
const BreakpointDemo = () => {
  const breakpoint = useBreakpoint()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Breakpoint Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Current:</strong> <Badge>{breakpoint.current}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Device Type:</strong>
            <ul className="mt-2 space-y-1">
              <li>Mobile: {breakpoint.isMobile ? '✅' : '❌'}</li>
              <li>Tablet: {breakpoint.isTablet ? '✅' : '❌'}</li>
              <li>Desktop: {breakpoint.isDesktop ? '✅' : '❌'}</li>
            </ul>
          </div>
          <div>
            <strong>Breakpoint Checks:</strong>
            <ul className="mt-2 space-y-1">
              <li>SM+: {breakpoint.isBreakpointUp('sm') ? '✅' : '❌'}</li>
              <li>MD+: {breakpoint.isBreakpointUp('md') ? '✅' : '❌'}</li>
              <li>LG+: {breakpoint.isBreakpointUp('lg') ? '✅' : '❌'}</li>
              <li>XL+: {breakpoint.isBreakpointUp('xl') ? '✅' : '❌'}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const BreakpointHook: Story = {
  render: () => (
    <Container className="py-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Breakpoint Hook</h2>
        <p className="text-neutral-600 mb-6">Resize your browser window to see real-time breakpoint information.</p>
        <BreakpointDemo />
      </div>
    </Container>
  ),
}

// Kitchen Sink - Complete Layout Examples
export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-12">
      {/* Hero Section */}
      <Container size="7xl" className="py-12">
        <Stack direction="col" align="center" gap="lg" className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold">Responsive Design System</h1>
          <p className="text-xl text-neutral-600 max-w-2xl">
            Build responsive layouts with our flexible grid system, containers, and utility components.
          </p>
          <Stack direction="row" gap="md" responsive>
            <Button size="lg">Get Started</Button>
            <Button variant="outline" size="lg">Learn More</Button>
          </Stack>
        </Stack>
      </Container>

      {/* Feature Grid */}
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Features</h2>
          <p className="text-neutral-600">Everything you need for responsive design.</p>
        </div>
        
        <Grid cols={3} gap="lg">
          {[
            { title: 'Responsive Containers', desc: 'Flexible containers with customizable max-widths and padding.' },
            { title: 'CSS Grid System', desc: 'Powerful grid system with responsive breakpoints and spanning.' },
            { title: 'Flexible Stacks', desc: 'Horizontal and vertical stacking with responsive behavior.' },
            { title: 'Visibility Controls', desc: 'Show and hide elements at specific breakpoints.' },
            { title: 'Breakpoint Hooks', desc: 'React hooks for responsive behavior in JavaScript.' },
            { title: 'Mobile-First', desc: 'Built with mobile-first responsive design principles.' },
          ].map((feature, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-600">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </Container>

      {/* Split Layout */}
      <Container>
        <Grid cols={2} gap="xl">
          <div>
            <h2 className="text-2xl font-bold mb-4">Design Tokens</h2>
            <p className="text-neutral-600 mb-6">
              Our design system is built on a foundation of carefully crafted design tokens
              that ensure consistency across all components and layouts.
            </p>
            <Stack direction="col" gap="sm">
              <Button variant="outline" className="justify-start">View Tokens</Button>
              <Button variant="outline" className="justify-start">Documentation</Button>
              <Button variant="outline" className="justify-start">Guidelines</Button>
            </Stack>
          </div>
          <div className="space-y-4">
            <Show above="md">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-xl">
                <div className="text-center">
                  <Badge variant="secondary">Responsive Demo</Badge>
                  <p className="mt-4 text-sm text-neutral-600">
                    This content only appears on medium screens and above.
                  </p>
                </div>
              </div>
            </Show>
            <Hide above="md">
              <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-xl">
                <div className="text-center">
                  <Badge variant="success">Mobile View</Badge>
                  <p className="mt-4 text-sm text-neutral-600">
                    This is the mobile-optimized layout.
                  </p>
                </div>
              </div>
            </Hide>
          </div>
        </Grid>
      </Container>
    </div>
  ),
}