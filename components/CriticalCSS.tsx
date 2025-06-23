'use client'

import { useEffect } from 'react'
import { 
  CRITICAL_CSS, 
  injectCriticalCSS, 
  optimizeAboveFoldImages,
  ResourceHints,
  FontOptimizer 
} from '@/lib/progressive-enhancement'

/* ============================================================================ */
/* CRITICAL CSS INJECTION COMPONENT */
/* Ensures above-fold content renders instantly */
/* ============================================================================ */

export function CriticalCSS({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inject critical CSS immediately
    if (!document.getElementById('critical-css')) {
      injectCriticalCSS(CRITICAL_CSS)
    }

    // Optimize above-fold images
    optimizeAboveFoldImages()

    // Preload critical fonts
    const fontOptimizer = FontOptimizer.getInstance()
    fontOptimizer.preloadCriticalFonts()

    // Mark paint timing
    if ('performance' in window && 'mark' in performance) {
      performance.mark('critical-css-injected')
    }
  }, [])

  return (
    <>
      <ResourceHints />
      {children}
    </>
  )
}

// Individual critical style components for specific pages
export function HomeCriticalCSS() {
  const homeSpecificCSS = `
    /* Home page critical styles */
    .hero-gradient {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .hero-title {
      font-size: clamp(2rem, 5vw, 4rem);
      font-weight: 700;
      line-height: 1.1;
      color: white;
      text-align: center;
      margin-bottom: 1rem;
    }
    
    .hero-subtitle {
      font-size: clamp(1rem, 2.5vw, 1.25rem);
      color: rgba(255, 255, 255, 0.9);
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .cta-button {
      display: inline-flex;
      align-items: center;
      padding: 1rem 2rem;
      background: white;
      color: #667eea;
      border-radius: 50px;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s ease;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
    }
  `

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'home-critical-css'
    style.innerHTML = homeSpecificCSS
    document.head.appendChild(style)

    return () => {
      const existingStyle = document.getElementById('home-critical-css')
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  return null
}

export function WorkspaceCriticalCSS() {
  const workspaceCSS = `
    /* Workspace critical styles */
    .workspace-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      height: 100vh;
      overflow: hidden;
    }
    
    .workspace-sidebar {
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
      overflow-y: auto;
    }
    
    .workspace-main {
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .workspace-header {
      height: 64px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      padding: 0 1.5rem;
    }
    
    .workspace-content {
      flex: 1;
      overflow: auto;
      padding: 2rem;
    }
    
    @media (max-width: 768px) {
      .workspace-layout {
        grid-template-columns: 1fr;
      }
      .workspace-sidebar {
        display: none;
      }
    }
  `

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'workspace-critical-css'
    style.innerHTML = workspaceCSS
    document.head.appendChild(style)

    return () => {
      const existingStyle = document.getElementById('workspace-critical-css')
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  return null
}

export function PricingCriticalCSS() {
  const pricingCSS = `
    /* Pricing page critical styles */
    .pricing-hero {
      text-align: center;
      padding: 4rem 0 2rem;
    }
    
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .pricing-card {
      background: white;
      border-radius: 1.5rem;
      border: 1px solid #e2e8f0;
      padding: 2rem;
      position: relative;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .pricing-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }
    
    .pricing-card.featured {
      border-color: #667eea;
      transform: scale(1.05);
    }
    
    .pricing-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: #667eea;
      color: white;
      padding: 0.25rem 1rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
    }
  `

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'pricing-critical-css'
    style.innerHTML = pricingCSS
    document.head.appendChild(style)

    return () => {
      const existingStyle = document.getElementById('pricing-critical-css')
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  return null
}

// Above-fold optimization wrapper
export function AboveFoldOptimizer({ 
  children, 
  criticalImages = [] 
}: { 
  children: React.ReactNode
  criticalImages?: string[]
}) {
  useEffect(() => {
    // Preload critical images
    criticalImages.forEach(src => {
      const img = new Image()
      img.src = src
      img.fetchPriority = 'high'
    })

    // Mark LCP elements
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement
          element.style.contentVisibility = 'visible'
          observer.unobserve(element)
        }
      })
    })

    // Observe potential LCP elements
    const lcpCandidates = document.querySelectorAll('h1, .hero-title, .hero-image')
    lcpCandidates.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [criticalImages])

  return <>{children}</>
}