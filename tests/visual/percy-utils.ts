/**
 * UI/UX Polish Sprint - Phase 3.2: Percy Visual Testing Utilities
 * 
 * Utilities for multi-locale visual regression testing with Percy
 * Handles locale switching, screenshot capture, and comparison workflows
 */

import { Page, Browser } from '@playwright/test'

export interface VisualTestConfig {
  locales: string[]
  viewports: Array<{ name: string; width: number; height: number }>
  pages: Array<{ name: string; path: string; waitFor?: string }>
  themes: string[]
}

export interface Percy {
  snapshot(name: string, options?: PergySnapshotOptions): Promise<void>
}

export interface PergySnapshotOptions {
  widths?: number[]
  minHeight?: number
  percyCSS?: string
  scope?: string
  enableJavaScript?: boolean
  discovery?: {
    allowedHostnames?: string[]
    networkIdleTimeout?: number
  }
}

// Default configuration for Prismy visual testing
export const DEFAULT_VISUAL_CONFIG: VisualTestConfig = {
  locales: ['en', 'vi', 'ja', 'ar', 'zh'],
  viewports: [
    { name: 'Mobile Small', width: 375, height: 667 },
    { name: 'Mobile iPhone 12', width: 390, height: 844 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Large Desktop', width: 1920, height: 1080 }
  ],
  pages: [
    { name: 'Home', path: '/', waitFor: '[data-testid="hero-section"]' },
    { name: 'Workspace', path: '/workspace', waitFor: '[data-testid="workspace-main"]' },
    { name: 'Documents', path: '/workspace/documents', waitFor: '[data-testid="document-list"]' },
    { name: 'Settings', path: '/workspace/settings', waitFor: '[data-testid="settings-panel"]' },
    { name: 'Auth Modal', path: '/?auth=signup', waitFor: '[data-testid="auth-modal"]' }
  ],
  themes: ['light', 'dark']
}

/**
 * Percy visual testing utility class
 */
export class PercyTester {
  private percy: Percy | null = null
  private page: Page
  private baseUrl: string
  
  constructor(page: Page, baseUrl = 'http://localhost:3000') {
    this.page = page
    this.baseUrl = baseUrl
    
    // Initialize Percy if available
    try {
      this.percy = (global as any).percy || null
    } catch {
      console.warn('Percy not available - visual tests will be skipped')
    }
  }
  
  /**
   * Run comprehensive visual tests across all locales and viewports
   */
  async runVisualTestSuite(config = DEFAULT_VISUAL_CONFIG): Promise<void> {
    if (!this.percy) {
      console.log('Percy not available - skipping visual tests')
      return
    }
    
    console.log('🎯 Starting Percy visual test suite...')
    
    for (const locale of config.locales) {
      console.log(`📸 Testing locale: ${locale}`)
      await this.testLocale(locale, config)
    }
    
    console.log('✅ Percy visual test suite complete')
  }
  
  /**
   * Test all pages for a specific locale
   */
  async testLocale(locale: string, config: VisualTestConfig): Promise<void> {
    // Set locale
    await this.setLocale(locale)
    
    for (const theme of config.themes) {
      await this.setTheme(theme)
      
      for (const pageConfig of config.pages) {
        await this.testPage(pageConfig, locale, theme, config.viewports)
      }
    }
  }
  
  /**
   * Test a specific page across all viewports
   */
  async testPage(
    pageConfig: VisualTestConfig['pages'][0],
    locale: string,
    theme: string,
    viewports: VisualTestConfig['viewports']
  ): Promise<void> {
    const url = `${this.baseUrl}${pageConfig.path}`
    
    try {
      // Navigate to page
      await this.page.goto(url, { waitUntil: 'networkidle' })
      
      // Wait for specific element if specified
      if (pageConfig.waitFor) {
        await this.page.waitForSelector(pageConfig.waitFor, { timeout: 10000 })
      }
      
      // Additional wait for fonts and animations
      await this.page.waitForTimeout(1000)
      
      // Hide dynamic content that changes between runs
      await this.hideDynamicContent()
      
      // Take Percy screenshot with multiple viewports
      const snapshotName = `${pageConfig.name} - ${locale} - ${theme}`
      
      await this.percy!.snapshot(snapshotName, {
        widths: viewports.map(v => v.width),
        minHeight: 800,
        percyCSS: this.getPercyCSS(locale, theme),
        enableJavaScript: true,
        discovery: {
          allowedHostnames: [
            'fonts.googleapis.com',
            'fonts.gstatic.com', 
            'rsms.me'
          ],
          networkIdleTimeout: 750
        }
      })
      
      console.log(`  ✓ ${snapshotName}`)
      
    } catch (error) {
      console.error(`  ✗ Failed to test ${pageConfig.name} (${locale}/${theme}):`, error)
    }
  }
  
  /**
   * Test specific UI components in isolation
   */
  async testComponent(
    componentName: string,
    selector: string,
    locale: string,
    options: {
      variants?: string[]
      states?: string[]
      themes?: string[]
    } = {}
  ): Promise<void> {
    if (!this.percy) return
    
    const {
      variants = ['default'],
      states = ['default'],
      themes = ['light', 'dark']
    } = options
    
    await this.setLocale(locale)
    
    for (const theme of themes) {
      await this.setTheme(theme)
      
      for (const variant of variants) {
        for (const state of states) {
          // Apply variant and state classes if needed
          await this.applyComponentState(selector, variant, state)
          
          // Wait for any animations to complete
          await this.page.waitForTimeout(500)
          
          const snapshotName = `${componentName} - ${variant} - ${state} - ${locale} - ${theme}`
          
          await this.percy!.snapshot(snapshotName, {
            scope: selector,
            percyCSS: this.getPercyCSS(locale, theme),
            enableJavaScript: true
          })
          
          console.log(`  ✓ Component: ${snapshotName}`)
        }
      }
    }
  }
  
  /**
   * Test form interactions and error states
   */
  async testFormStates(
    formSelector: string,
    locale: string,
    scenarios: Array<{
      name: string
      actions: Array<{ type: 'fill' | 'click' | 'select'; selector: string; value?: string }>
      waitFor?: string
    }>
  ): Promise<void> {
    if (!this.percy) return
    
    await this.setLocale(locale)
    
    for (const scenario of scenarios) {
      try {
        // Reset form
        await this.page.reload({ waitUntil: 'networkidle' })
        await this.page.waitForSelector(formSelector)
        
        // Execute scenario actions
        for (const action of scenario.actions) {
          switch (action.type) {
            case 'fill':
              await this.page.fill(action.selector, action.value || '')
              break
            case 'click':
              await this.page.click(action.selector)
              break
            case 'select':
              await this.page.selectOption(action.selector, action.value || '')
              break
          }
          
          // Small delay between actions
          await this.page.waitForTimeout(200)
        }
        
        // Wait for specific condition if specified
        if (scenario.waitFor) {
          await this.page.waitForSelector(scenario.waitFor, { timeout: 5000 })
        }
        
        await this.hideDynamicContent()
        
        const snapshotName = `Form ${scenario.name} - ${locale}`
        
        await this.percy!.snapshot(snapshotName, {
          scope: formSelector,
          percyCSS: this.getPercyCSS(locale, 'light'),
          enableJavaScript: true
        })
        
        console.log(`  ✓ Form scenario: ${snapshotName}`)
        
      } catch (error) {
        console.error(`  ✗ Form scenario failed (${scenario.name}):`, error)
      }
    }
  }
  
  /**
   * Set application locale
   */
  private async setLocale(locale: string): Promise<void> {
    // Method 1: localStorage approach
    await this.page.evaluate((locale) => {
      localStorage.setItem('prismy-locale', locale)
      localStorage.setItem('i18nextLng', locale)
    }, locale)
    
    // Method 2: URL parameter approach  
    const currentUrl = this.page.url()
    const url = new URL(currentUrl)
    url.searchParams.set('locale', locale)
    
    await this.page.goto(url.toString(), { waitUntil: 'networkidle' })
    
    // Wait for locale change to take effect
    await this.page.waitForTimeout(500)
  }
  
  /**
   * Set application theme
   */
  private async setTheme(theme: string): Promise<void> {
    await this.page.evaluate((theme) => {
      localStorage.setItem('pry-theme-preference', theme)
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(theme)
    }, theme)
    
    // Wait for theme change to take effect
    await this.page.waitForTimeout(300)
  }
  
  /**
   * Hide dynamic content that changes between test runs
   */
  private async hideDynamicContent(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        /* Hide dynamic timestamps and user-specific content */
        [data-testid*="timestamp"],
        [data-testid*="time"],
        .timestamp,
        .relative-time,
        .user-avatar,
        .last-modified,
        .created-at,
        .updated-at {
          visibility: hidden !important;
        }
        
        /* Hide random IDs and dynamic content */
        [id^="react-"],
        [class*="random-"],
        .dynamic-content {
          opacity: 0 !important;
        }
        
        /* Pause animations for consistent screenshots */
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        
        /* Hide cursor and focus indicators */
        *:focus {
          outline: none !important;
          box-shadow: none !important;
        }
      `
    })
  }
  
  /**
   * Apply component variant and state classes
   */
  private async applyComponentState(
    selector: string,
    variant: string,
    state: string
  ): Promise<void> {
    await this.page.evaluate(
      ({ selector, variant, state }) => {
        const element = document.querySelector(selector)
        if (element) {
          // Remove existing state classes
          element.classList.remove('hover', 'focus', 'active', 'disabled', 'loading')
          
          // Apply new variant and state
          if (variant !== 'default') {
            element.classList.add(`variant-${variant}`)
          }
          
          if (state !== 'default') {
            element.classList.add(state)
          }
        }
      },
      { selector, variant, state }
    )
  }
  
  /**
   * Generate Percy CSS for locale-specific styling
   */
  private getPercyCSS(locale: string, theme: string): string {
    const isRTL = locale === 'ar'
    
    return `
      /* Ensure consistent fonts across Percy environments */
      * {
        font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif !important;
      }
      
      /* RTL layout adjustments for Arabic */
      ${isRTL ? `
        html {
          direction: rtl !important;
        }
        
        /* Flip certain elements for RTL */
        .sidebar,
        .navigation {
          left: auto !important;
          right: 0 !important;
        }
      ` : ''}
      
      /* Theme-specific adjustments */
      html.${theme} {
        color-scheme: ${theme};
      }
      
      /* Hide scrollbars for consistent screenshots */
      ::-webkit-scrollbar {
        display: none !important;
      }
      
      * {
        scrollbar-width: none !important;
      }
      
      /* Ensure proper text rendering */
      * {
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        text-rendering: optimizeLegibility !important;
      }
    `
  }
}

/**
 * Utility function to initialize Percy testing
 */
export async function setupPercyTesting(page: Page): Promise<PercyTester> {
  const percyTester = new PercyTester(page)
  
  // Set up viewport for consistent testing
  await page.setViewportSize({ width: 1440, height: 900 })
  
  // Disable animations globally
  await page.addInitScript(() => {
    // Disable CSS animations and transitions
    const style = document.createElement('style')
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
    document.head.appendChild(style)
    
    // Mock Date for consistent timestamps
    const mockDate = new Date('2024-01-01T12:00:00Z')
    Date.now = () => mockDate.getTime()
  })
  
  return percyTester
}

/**
 * Percy test scenarios for common UI patterns
 */
export const VISUAL_TEST_SCENARIOS = {
  // Authentication flows
  auth: {
    pages: [
      { name: 'Login Modal', path: '/?auth=login' },
      { name: 'Signup Modal', path: '/?auth=signup' },
      { name: 'Password Reset', path: '/?auth=reset' }
    ]
  },
  
  // Workspace layouts
  workspace: {
    pages: [
      { name: 'Empty Workspace', path: '/workspace?empty=true' },
      { name: 'Loading State', path: '/workspace?loading=true' },
      { name: 'Error State', path: '/workspace?error=true' },
      { name: 'With Sidebar', path: '/workspace?sidebar=open' }
    ]
  },
  
  // Document states  
  documents: {
    pages: [
      { name: 'Document List', path: '/workspace/documents' },
      { name: 'Document Upload', path: '/workspace/documents?upload=true' },
      { name: 'Document Processing', path: '/workspace/documents?processing=true' },
      { name: 'Document Viewer', path: '/workspace/documents/123' }
    ]
  },
  
  // Form interactions
  forms: {
    scenarios: [
      {
        name: 'Empty Form',
        actions: []
      },
      {
        name: 'Filled Form',
        actions: [
          { type: 'fill', selector: '[name="title"]', value: 'Test Document' },
          { type: 'fill', selector: '[name="description"]', value: 'Description text' }
        ]
      },
      {
        name: 'Form Errors',
        actions: [
          { type: 'click', selector: '[type="submit"]' }
        ],
        waitFor: '.error-message'
      }
    ]
  }
} as const