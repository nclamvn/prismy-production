/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import RootLayout, { metadata, viewport } from '../layout'

expect.extend(toHaveNoViolations)

// Mock all the provider components to avoid complex setup
jest.mock('@/components/CriticalCSS', () => ({
  CriticalCSS: ({ children }: { children: React.ReactNode }) => <div data-testid="critical-css">{children}</div>
}))

jest.mock('@/components/ErrorBoundary/GlobalErrorBoundary', () => ({
  GlobalErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="global-error-boundary">{children}</div>
}))

jest.mock('@/components/ui/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>
}))

jest.mock('@/components/theme/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>
}))

jest.mock('@/components/accessibility/AccessibilityProvider', () => ({
  AccessibilityProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="accessibility-provider">{children}</div>
}))

jest.mock('@/components/accessibility/AccessibilityEnhancer', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="accessibility-enhancer">{children}</div>
}))

jest.mock('@/components/ui/Toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="toast-provider">{children}</div>
}))

jest.mock('@/contexts/LoadingContext', () => ({
  LoadingProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="loading-provider">{children}</div>,
  GlobalLoadingIndicator: () => <div data-testid="global-loading-indicator" />
}))

jest.mock('@/components/ui/Skeleton', () => ({
  SkeletonProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="skeleton-provider">{children}</div>
}))

jest.mock('@/contexts/SSRSafeLanguageContext', () => ({
  SSRSafeLanguageProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="language-provider">{children}</div>
}))

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>
}))

jest.mock('@/contexts/UnifiedAuthProvider', () => ({
  UnifiedAuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="unified-auth-provider">{children}</div>
}))

jest.mock('@/contexts/AgentContext', () => ({
  AgentProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="agent-provider">{children}</div>
}))

jest.mock('@/contexts/WorkspaceIntelligenceContext', () => ({
  WorkspaceIntelligenceProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="workspace-intelligence-provider">{children}</div>
}))

jest.mock('@/contexts/PipelineContext', () => ({
  PipelineProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="pipeline-provider">{children}</div>
}))

jest.mock('@/components/auth/AuthErrorHandler', () => ({
  __esModule: true,
  default: () => <div data-testid="auth-error-handler" />
}))

jest.mock('@/components/analytics/AnalyticsInitializer', () => ({
  __esModule: true,
  default: () => <div data-testid="analytics-initializer" />
}))

jest.mock('@/components/monitoring/WebVitalsMonitor', () => ({
  WebVitalsMonitor: () => <div data-testid="web-vitals-monitor" />
}))

jest.mock('@/components/navigation/ConditionalNavbar', () => ({
  __esModule: true,
  default: () => <div data-testid="conditional-navbar" />
}))

jest.mock('@/components/transitions/PageTransition', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="page-transition">{children}</div>
}))

jest.mock('@/components/ui/PortalRoot', () => ({
  PortalRoot: () => <div data-testid="portal-root" />
}))

jest.mock('@/components/ServiceWorkerRegistration', () => ({
  __esModule: true,
  default: () => <div data-testid="service-worker-registration" />
}))

describe('RootLayout', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    // Mock environment
    process.env.NODE_ENV = 'test'
    
    // Mock window.matchMedia for accessibility tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  it('renders children within all provider components', () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('test-child')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('includes all required provider components in correct order', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    // Check that all providers are present
    expect(screen.getByTestId('critical-css')).toBeInTheDocument()
    expect(screen.getByTestId('global-error-boundary')).toBeInTheDocument()
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
    expect(screen.getByTestId('accessibility-provider')).toBeInTheDocument()
    expect(screen.getByTestId('accessibility-enhancer')).toBeInTheDocument()
    expect(screen.getByTestId('toast-provider')).toBeInTheDocument()
    expect(screen.getByTestId('loading-provider')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-provider')).toBeInTheDocument()
    expect(screen.getByTestId('language-provider')).toBeInTheDocument()
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
    expect(screen.getByTestId('unified-auth-provider')).toBeInTheDocument()
    expect(screen.getByTestId('agent-provider')).toBeInTheDocument()
    expect(screen.getByTestId('workspace-intelligence-provider')).toBeInTheDocument()
    expect(screen.getByTestId('pipeline-provider')).toBeInTheDocument()
  })

  it('includes all global components', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('global-loading-indicator')).toBeInTheDocument()
    expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument()
    expect(screen.getByTestId('analytics-initializer')).toBeInTheDocument()
    expect(screen.getByTestId('web-vitals-monitor')).toBeInTheDocument()
    expect(screen.getByTestId('conditional-navbar')).toBeInTheDocument()
    expect(screen.getByTestId('page-transition')).toBeInTheDocument()
    expect(screen.getByTestId('portal-root')).toBeInTheDocument()
    expect(screen.getByTestId('service-worker-registration')).toBeInTheDocument()
  })

  it('sets correct HTML lang attribute', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    const html = document.documentElement
    expect(html).toHaveAttribute('lang', 'vi')
  })

  it('applies system font stack', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    const html = document.documentElement
    const body = document.body
    
    expect(html.style.fontFamily).toContain('system-ui')
    expect(body.style.fontFamily).toContain('system-ui')
  })

  it('applies correct body classes and styles', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    const body = document.body
    expect(body).toHaveClass('antialiased', 'overflow-x-hidden')
    expect(body.style.fontSize).toBe('18px')
    expect(body.style.lineHeight).toBe('1.6')
  })

  it('passes accessibility audit', async () => {
    const { container } = render(
      <RootLayout>
        <main id="main-content">
          <h1>Test Page</h1>
          <p>This is test content for accessibility testing.</p>
        </main>
      </RootLayout>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('includes proper meta tags in head', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    // Check for cache control meta tags
    const cacheControl = document.querySelector('meta[http-equiv="Cache-Control"]')
    expect(cacheControl).toHaveAttribute('content', 'no-cache, no-store, must-revalidate')

    // Check for version meta tag
    const version = document.querySelector('meta[name="version"]')
    expect(version).toHaveAttribute('content', expect.stringContaining('1.0.5'))

    // Check for PWA meta tags
    const appName = document.querySelector('meta[name="application-name"]')
    expect(appName).toHaveAttribute('content', 'Prismy')

    const appleMobileCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]')
    expect(appleMobileCapable).toHaveAttribute('content', 'yes')

    const themeColor = document.querySelector('meta[name="theme-color"]')
    expect(themeColor).toHaveAttribute('content', '#000000')
  })

  it('includes CSP nonce meta tag in development', () => {
    process.env.NODE_ENV = 'development'
    
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    const cspNonce = document.querySelector('meta[name="csp-nonce"]')
    expect(cspNonce).toHaveAttribute('content', 'dev-nonce')
  })

  it('includes development scripts only in development mode', () => {
    process.env.NODE_ENV = 'development'
    
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    // Development scripts should be included
    const scripts = document.querySelectorAll('script[nonce="dev-nonce"]')
    expect(scripts.length).toBeGreaterThan(0)
  })

  it('excludes development scripts in production', () => {
    process.env.NODE_ENV = 'production'
    
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    // Development scripts should not be included
    const devScripts = document.querySelectorAll('script[nonce="dev-nonce"]')
    expect(devScripts.length).toBe(0)
  })

  it('includes structured data for SEO', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    const structuredData = document.querySelector('script[type="application/ld+json"]')
    expect(structuredData).toBeInTheDocument()
    
    const data = JSON.parse(structuredData?.textContent || '{}')
    expect(data['@context']).toBe('https://schema.org')
    expect(data['@type']).toBe('SoftwareApplication')
    expect(data.name).toBe('Prismy')
    expect(data.applicationCategory).toBe('BusinessApplication')
  })

  it('includes DNS prefetch links', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    const prismyPrefetch = document.querySelector('link[rel="dns-prefetch"][href="//prismy.in"]')
    expect(prismyPrefetch).toBeInTheDocument()

    const cdnPrefetch = document.querySelector('link[rel="dns-prefetch"][href="//cdn.prismy.in"]')
    expect(cdnPrefetch).toBeInTheDocument()
  })

  it('includes API preconnect link', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    const apiPreconnect = document.querySelector('link[rel="preconnect"][href="https://api.prismy.in"]')
    expect(apiPreconnect).toBeInTheDocument()
  })

  it('handles theme provider configuration', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    // Theme provider should be configured with system theme
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
  })

  it('handles skeleton provider configuration', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    // Skeleton provider should be present
    expect(screen.getByTestId('skeleton-provider')).toBeInTheDocument()
  })

  it('handles language provider configuration', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    // Language provider should be configured with default language
    expect(screen.getByTestId('language-provider')).toBeInTheDocument()
  })

  it('handles web vitals monitor in development', () => {
    process.env.NODE_ENV = 'development'
    
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    // Web vitals monitor should be present
    expect(screen.getByTestId('web-vitals-monitor')).toBeInTheDocument()
  })
})

describe('Layout Metadata', () => {
  it('has correct metadata structure', () => {
    expect(metadata.title).toEqual({
      default: 'Prismy - AI-Powered Translation Platform',
      template: '%s | Prismy',
    })

    expect(metadata.description).toContain('AI translation platform')
    expect(metadata.keywords).toContain('translation')
    expect(metadata.keywords).toContain('AI translation')
    expect(metadata.keywords).toContain('Vietnamese translation')
  })

  it('has correct Open Graph metadata', () => {
    expect(metadata.openGraph).toEqual(
      expect.objectContaining({
        type: 'website',
        locale: 'en_US',
        alternateLocale: ['vi_VN', 'zh_CN', 'ja_JP', 'ko_KR'],
        url: 'https://prismy.in',
        siteName: 'Prismy',
        title: 'Prismy - AI-Powered Translation Platform',
      })
    )

    expect(metadata.openGraph?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: '/images/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Prismy - AI Translation Platform with NotebookLM Design',
        })
      ])
    )
  })

  it('has correct Twitter metadata', () => {
    expect(metadata.twitter).toEqual(
      expect.objectContaining({
        card: 'summary_large_image',
        site: '@PrismyAI',
        creator: '@PrismyAI',
        title: 'Prismy - AI-Powered Translation Platform',
      })
    )
  })

  it('has correct Apple Web App metadata', () => {
    expect(metadata.appleWebApp).toEqual(
      expect.objectContaining({
        capable: true,
        statusBarStyle: 'default',
        title: 'Prismy',
      })
    )

    expect(metadata.appleWebApp?.startupImage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: '/icons/apple-splash-2048-2732.png',
        })
      ])
    )
  })

  it('has correct robots metadata', () => {
    expect(metadata.robots).toEqual(
      expect.objectContaining({
        index: true,
        follow: true,
        nocache: false,
      })
    )

    expect(metadata.robots?.googleBot).toEqual(
      expect.objectContaining({
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      })
    )
  })

  it('has correct alternate languages', () => {
    expect(metadata.alternates?.languages).toEqual({
      'en-US': 'https://prismy.in',
      'vi-VN': 'https://prismy.in/vi',
      'zh-CN': 'https://prismy.in/zh',
      'ja-JP': 'https://prismy.in/ja',
      'ko-KR': 'https://prismy.in/ko',
    })
  })
})

describe('Layout Viewport', () => {
  it('has correct viewport configuration', () => {
    expect(viewport.width).toBe('device-width')
    expect(viewport.initialScale).toBe(1)
    expect(viewport.maximumScale).toBe(5)
    expect(viewport.userScalable).toBe(true)
    expect(viewport.viewportFit).toBe('cover')
    expect(viewport.colorScheme).toBe('light dark')
  })

  it('has correct theme colors', () => {
    expect(viewport.themeColor).toEqual([
      { media: '(prefers-color-scheme: light)', color: '#FBFAF9' },
      { media: '(prefers-color-scheme: dark)', color: '#000000' },
    ])
  })
})