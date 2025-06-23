'use client'

import { useEffect, useState } from 'react'

/* ============================================================================ */
/* PRISMY PROGRESSIVE ENHANCEMENT SYSTEM */
/* Critical CSS extraction and above-fold optimization */
/* ============================================================================ */

// Critical CSS for above-fold content
export const CRITICAL_CSS = `
  /* Reset and base styles */
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
  
  /* Hero section critical styles */
  .hero-section {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
  }
  
  /* Navigation critical styles */
  .nav-header {
    position: fixed;
    top: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 50;
  }
  
  /* Button critical styles */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    background: #000;
    color: #fff;
    border-radius: 9999px;
    font-weight: 500;
    text-decoration: none;
    transition: transform 0.2s;
  }
  
  /* Typography critical styles */
  h1 { font-size: 3rem; font-weight: 700; margin: 0; }
  h2 { font-size: 2rem; font-weight: 600; margin: 0; }
  p { line-height: 1.6; margin: 0; }
  
  /* Layout critical styles */
  .container {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  /* Loading states */
  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`

// Extract critical CSS from DOM
export function extractCriticalCSS(): string {
  if (typeof window === 'undefined') return CRITICAL_CSS

  const critical: string[] = [CRITICAL_CSS]
  const stylesheets = Array.from(document.styleSheets)

  try {
    stylesheets.forEach(sheet => {
      if (!sheet.href || sheet.href.includes('/_next/')) {
        const rules = Array.from(sheet.cssRules || [])
        rules.forEach(rule => {
          const ruleText = rule.cssText
          // Check if rule applies to above-fold elements
          if (isAboveFoldRule(ruleText)) {
            critical.push(ruleText)
          }
        })
      }
    })
  } catch (e) {
    // Cross-origin stylesheets will throw
  }

  return critical.join('\n')
}

// Check if CSS rule applies to above-fold content
function isAboveFoldRule(rule: string): boolean {
  const aboveFoldSelectors = [
    'nav', 'header', '.hero', '.banner', 
    'h1', 'h2', '.btn-primary', '.container'
  ]
  return aboveFoldSelectors.some(selector => rule.includes(selector))
}

// Progressive enhancement hook
export function useProgressiveEnhancement() {
  const [enhanced, setEnhanced] = useState(false)
  const [criticalLoaded, setCriticalLoaded] = useState(false)

  useEffect(() => {
    // Mark critical CSS as loaded
    setCriticalLoaded(true)

    // Progressive enhancement after interaction
    const enhance = () => {
      if (!enhanced) {
        setEnhanced(true)
        loadNonCriticalResources()
      }
    }

    // Enhance on user interaction
    const events = ['scroll', 'click', 'touchstart', 'keydown']
    events.forEach(event => {
      window.addEventListener(event, enhance, { once: true, passive: true })
    })

    // Or enhance after delay
    const timer = setTimeout(enhance, 3000)

    return () => {
      clearTimeout(timer)
      events.forEach(event => {
        window.removeEventListener(event, enhance)
      })
    }
  }, [enhanced])

  return { enhanced, criticalLoaded }
}

// Load non-critical resources
async function loadNonCriticalResources() {
  // Preload fonts
  const fonts = [
    '/fonts/Inter-Regular.woff2',
    '/fonts/Inter-Medium.woff2',
    '/fonts/Inter-Bold.woff2',
  ]

  fonts.forEach(font => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.href = font
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  })

  // Load analytics
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      loadAnalytics()
    })
  } else {
    setTimeout(loadAnalytics, 1)
  }

  // Preconnect to external domains
  const domains = [
    'https://fonts.googleapis.com',
    'https://www.googletagmanager.com',
    'https://vitals.vercel-insights.com',
  ]

  domains.forEach(domain => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = domain
    document.head.appendChild(link)
  })
}

// Load analytics scripts
function loadAnalytics() {
  // Google Analytics
  const ga = document.createElement('script')
  ga.async = true
  ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'
  document.head.appendChild(ga)

  // Vercel Analytics
  const va = document.createElement('script')
  va.async = true
  va.src = '/_vercel/insights/script.js'
  document.head.appendChild(va)
}

// Resource hints component
export function ResourceHints() {
  useEffect(() => {
    // DNS prefetch for external domains
    const dnsPrefetch = [
      'https://api.prismy.in',
      'https://cdn.prismy.in',
    ]

    dnsPrefetch.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = domain
      document.head.appendChild(link)
    })

    // Preconnect to critical domains
    const preconnect = [
      { href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    ]

    preconnect.forEach(({ href, crossOrigin }) => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = href
      if (crossOrigin) {
        link.crossOrigin = crossOrigin
      }
      document.head.appendChild(link)
    })
  }, [])

  return null
}

// Above-fold image optimizer
export function optimizeAboveFoldImages() {
  if (typeof window === 'undefined') return

  const images = document.querySelectorAll('img[loading="eager"]')
  
  images.forEach((img: HTMLImageElement) => {
    // Add fetchpriority for LCP images
    if (isAboveFold(img)) {
      img.fetchPriority = 'high'
      img.decoding = 'sync'
    } else {
      img.fetchPriority = 'low'
      img.decoding = 'async'
    }
  })
}

// Check if element is above fold
function isAboveFold(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  return rect.top < window.innerHeight && rect.bottom > 0
}

// Critical path CSS injector
export function injectCriticalCSS(css: string = CRITICAL_CSS) {
  if (typeof document === 'undefined') return

  const style = document.createElement('style')
  style.id = 'critical-css'
  style.innerHTML = css
  document.head.appendChild(style)
}

// Lazy load CSS files
export function lazyLoadCSS(href: string, media = 'all') {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.media = 'print'
  
  link.onload = () => {
    link.media = media
  }
  
  document.head.appendChild(link)
}

// Progressive image loading
export function progressiveImageLoading(
  lowQualitySrc: string,
  highQualitySrc: string,
  alt: string,
  className?: string
) {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const img = new Image()
    img.src = highQualitySrc
    
    img.onload = () => {
      setCurrentSrc(highQualitySrc)
      setIsLoading(false)
    }
  }, [highQualitySrc])

  return {
    src: currentSrc,
    className: `${className} ${isLoading ? 'blur-sm' : 'blur-0'}`,
    style: {
      transition: 'filter 0.3s',
      willChange: 'filter',
    },
    alt,
  }
}

// Font loading optimization
export class FontOptimizer {
  private static instance: FontOptimizer
  private loadedFonts = new Set<string>()

  static getInstance() {
    if (!FontOptimizer.instance) {
      FontOptimizer.instance = new FontOptimizer()
    }
    return FontOptimizer.instance
  }

  async loadFont(fontFamily: string, options?: FontFaceDescriptors) {
    if (this.loadedFonts.has(fontFamily)) return

    try {
      await document.fonts.load(`1rem ${fontFamily}`, 'a')
      this.loadedFonts.add(fontFamily)
    } catch (e) {
      console.warn(`Failed to load font: ${fontFamily}`)
    }
  }

  preloadCriticalFonts() {
    const criticalFonts = [
      { family: 'Inter', weight: '400' },
      { family: 'Inter', weight: '500' },
      { family: 'Inter', weight: '700' },
    ]

    criticalFonts.forEach(({ family, weight }) => {
      this.loadFont(family, { weight })
    })
  }
}

// Script loading priority
export function loadScript(
  src: string,
  options: {
    async?: boolean
    defer?: boolean
    priority?: 'high' | 'low'
    onLoad?: () => void
  } = {}
) {
  const script = document.createElement('script')
  script.src = src
  
  if (options.async) script.async = true
  if (options.defer) script.defer = true
  if (options.priority === 'high') {
    script.fetchPriority = 'high'
  }
  
  if (options.onLoad) {
    script.onload = options.onLoad
  }
  
  document.body.appendChild(script)
}

// Export utility for Next.js
export const progressiveEnhancement = {
  extractCriticalCSS,
  injectCriticalCSS,
  lazyLoadCSS,
  optimizeAboveFoldImages,
  loadScript,
  FontOptimizer,
}