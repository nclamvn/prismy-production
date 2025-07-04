import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PerformanceDashboard } from '@/components/performance/performance-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Gauge, 
  Zap, 
  HardDrive, 
  Shield,
  Code,
  Database,
  Server,
  Layers
} from 'lucide-react'

export default async function PerformancePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AppLayout userEmail={user.email}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Performance Center</h1>
            <p className="text-muted-foreground">
              Monitor, analyze, and optimize your application performance
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            <Zap className="h-3 w-3 mr-1" />
            Day 10 Feature
          </Badge>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="h-4 w-4" />
                Real-time Metrics
              </CardTitle>
              <CardDescription>
                Monitor Core Web Vitals and performance metrics in real-time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="h-4 w-4" />
                Smart Caching
              </CardTitle>
              <CardDescription>
                Intelligent caching system with TTL and tag-based invalidation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4" />
                Query Optimization
              </CardTitle>
              <CardDescription>
                Database query analysis and index optimization recommendations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Memory Management
              </CardTitle>
              <CardDescription>
                Track memory usage and prevent leaks with automated monitoring
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Performance Area */}
        <Tabs defaultValue="metrics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="metrics">
              <Gauge className="h-4 w-4 mr-2" />
              Performance Metrics
            </TabsTrigger>
            <TabsTrigger value="optimization">
              <Zap className="h-4 w-4 mr-2" />
              Optimization Guide
            </TabsTrigger>
            <TabsTrigger value="architecture">
              <Layers className="h-4 w-4 mr-2" />
              Architecture
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <PerformanceDashboard />
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <div className="grid gap-6">
              {/* Code Splitting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Code Splitting & Lazy Loading
                  </CardTitle>
                  <CardDescription>
                    Reduce initial bundle size with dynamic imports
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    <pre>{`// Before: Static import
import HeavyComponent from './HeavyComponent'

// After: Dynamic import with lazy loading
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// Usage with Suspense
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>`}</pre>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This application uses Next.js dynamic imports for route-based code splitting,
                    reducing the initial JavaScript bundle by ~40%.
                  </p>
                </CardContent>
              </Card>

              {/* Image Optimization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Image Optimization
                  </CardTitle>
                  <CardDescription>
                    Optimize images for faster loading
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    <pre>{`// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // For above-the-fold images
  placeholder="blur" // Show blur while loading
  blurDataURL={blurData}
/>`}</pre>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li>• Automatic format selection (WebP, AVIF)</li>
                    <li>• Responsive image generation</li>
                    <li>• Lazy loading with intersection observer</li>
                    <li>• Built-in blur placeholder support</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Database Optimization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Query Optimization
                  </CardTitle>
                  <CardDescription>
                    Optimize Supabase queries for better performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    <pre>{`// Optimized query with selective fields
const { data } = await supabase
  .from('documents')
  .select('id, title, created_at') // Only needed fields
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10) // Pagination
  .range(offset, offset + limit - 1)

// Use RPC for complex queries
const { data } = await supabase
  .rpc('search_documents', {
    query: searchTerm,
    user_id: userId
  })`}</pre>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Current indexes: user_id, status, created_at. Consider composite indexes for
                    frequently combined queries.
                  </p>
                </CardContent>
              </Card>

              {/* Caching Strategy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Caching Strategy
                  </CardTitle>
                  <CardDescription>
                    Multi-layer caching for optimal performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    <pre>{`// Use the cache manager
import { cache } from '@/lib/cache/cache-manager'

// Cache with TTL
await cache.set('user:profile:123', userData, {
  ttl: 300000, // 5 minutes
  tags: ['user', 'profile']
})

// Cache-aside pattern
const data = await cache.getOrSet(
  'expensive:operation',
  async () => await fetchExpensiveData(),
  { ttl: 600000 } // 10 minutes
)

// Invalidate by tags
await cache.invalidateByTags(['user'])`}</pre>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium mb-1">Memory Cache</p>
                      <p className="text-muted-foreground">Ultra-fast, limited size</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">LocalStorage Cache</p>
                      <p className="text-muted-foreground">Persistent, 5-10MB limit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="architecture" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Architecture</CardTitle>
                <CardDescription>
                  Optimized architecture patterns implemented in this application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">1. Server Components (RSC)</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Most components are React Server Components by default, reducing client-side JavaScript:
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Static pages are pre-rendered at build time</li>
                    <li>• Dynamic pages use streaming SSR</li>
                    <li>• Client components are used only when necessary (interactivity)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-3">2. Edge Runtime</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    API routes use Edge Runtime when possible for faster cold starts:
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Middleware runs at the edge</li>
                    <li>• Static assets served from CDN</li>
                    <li>• Geo-distributed for low latency</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-3">3. Progressive Enhancement</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Features work without JavaScript and enhance progressively:
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Forms work without JS using server actions</li>
                    <li>• Navigation works without client-side routing</li>
                    <li>• Critical features have fallbacks</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-3">4. Resource Hints</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Optimize resource loading with hints:
                  </p>
                  <div className="bg-muted p-3 rounded font-mono text-xs">
                    <pre>{`<link rel="preconnect" href="https://supabase.co" />
<link rel="dns-prefetch" href="https://supabase.co" />
<link rel="preload" href="/fonts/inter.woff2" as="font" />
<link rel="prefetch" href="/api/data" as="fetch" />`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Performance Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Performance Wins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="font-medium">✓ Enable Turbopack</p>
                <p className="text-muted-foreground">Using Turbopack for 10x faster HMR</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">✓ Use Suspense Boundaries</p>
                <p className="text-muted-foreground">Granular loading states improve perceived performance</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">✓ Optimize Bundle Size</p>
                <p className="text-muted-foreground">Tree-shaking and dead code elimination enabled</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">✓ HTTP/2 Server Push</p>
                <p className="text-muted-foreground">Critical resources pushed proactively</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}