'use client'

import React, { useEffect } from 'react'
// Optimized CriticalCSS to prevent preload warnings

/* ============================================================================ */
/* CRITICAL CSS OPTIMIZATION COMPONENT */
/* Prevents CSS preload warnings by managing CSS loading properly */
/* ============================================================================ */

export function CriticalCSS({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Mark paint timing and optimize CSS loading
    if ('performance' in window && 'mark' in performance) {
      performance.mark('critical-css-injected')
    }
    
    // Optimize CSS preload links to prevent warnings
    const timeoutId = setTimeout(() => {
      const preloadLinks = document.querySelectorAll('link[rel="preload"][as="style"]')
      preloadLinks.forEach((link) => {
        const href = link.getAttribute('href')
        if (href) {
          // Check if there's a corresponding stylesheet loaded
          const correspondingStylesheet = document.querySelector(`link[rel="stylesheet"][href="${href}"]`)
          
          // If no stylesheet found, convert preload to actual stylesheet
          if (!correspondingStylesheet) {
            const newStylesheet = document.createElement('link')
            newStylesheet.rel = 'stylesheet'
            newStylesheet.href = href
            newStylesheet.media = 'all'
            
            // Insert before the preload link
            link.parentNode?.insertBefore(newStylesheet, link)
            
            // Remove the preload link after a short delay
            setTimeout(() => {
              if (link.parentNode) {
                link.parentNode.removeChild(link)
              }
            }, 100)
          }
        }
      })
    }, 500) // Give initial page load time to complete

    return () => clearTimeout(timeoutId)
  }, [])

  return <>{children}</>
}

// Individual critical style components for specific pages  
// Moved to static CSS to prevent dynamic injection warnings
export function HomeCriticalCSS() {
  // Removed dynamic CSS injection to prevent preload warnings
  // All critical styles are now in globals.css
  return null
}

export function WorkspaceCriticalCSS() {
  // Removed dynamic CSS injection to prevent preload warnings
  // All critical styles are now in globals.css
  return null
}

export function PricingCriticalCSS() {
  // Removed dynamic CSS injection to prevent preload warnings
  // All critical styles are now in globals.css
  return null
}

// Above-fold optimization wrapper
export function AboveFoldOptimizer({
  children,
  criticalImages = [],
}: {
  children: React.ReactNode
  criticalImages?: string[]
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Preload critical images
    criticalImages.forEach(src => {
      const img = new Image()
      img.src = src
      img.fetchPriority = 'high'
    })

    // Mark LCP elements
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement
          element.style.contentVisibility = 'visible'
          observer.unobserve(element)
        }
      })
    })

    // Observe potential LCP elements
    const lcpCandidates = document.querySelectorAll(
      'h1, .hero-title, .hero-image'
    )
    lcpCandidates.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [criticalImages])

  return <>{children}</>
}
