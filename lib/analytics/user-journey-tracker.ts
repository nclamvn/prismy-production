/**
 * User Journey & Experience Analytics
 * Phase 10.2: Advanced UX Analytics Implementation
 */

export interface UserEvent {
  id: string
  timestamp: number
  userId?: string
  sessionId: string
  event: string
  category: 'navigation' | 'interaction' | 'error' | 'performance' | 'conversion'
  properties: Record<string, any>
  page: string
  userAgent: string
  viewport: { width: number; height: number }
  deviceType: 'mobile' | 'tablet' | 'desktop'
  notebookLMFeature?: string // Track NotebookLM-specific features
}

export interface UserSession {
  id: string
  userId?: string
  startTime: number
  endTime?: number
  pageViews: number
  interactions: number
  conversions: string[]
  source: string
  campaign?: string
  device: string
  country?: string
}

class UserJourneyTracker {
  private sessionId: string
  private events: UserEvent[] = []
  private startTime: number
  private isEnabled: boolean

  constructor() {
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
    this.isEnabled = this.shouldTrack()
    
    if (this.isEnabled) {
      this.initializeTracking()
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private shouldTrack(): boolean {
    // Don't track in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development') {
      return process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
    }
    
    // Check for user consent (GDPR compliance)
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('analytics_consent')
      return consent === 'accepted'
    }
    
    return false
  }

  private initializeTracking() {
    if (typeof window === 'undefined') return

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.track('page_visibility_change', 'interaction', {
        visible: !document.hidden
      })
    })

    // Track scroll depth
    this.trackScrollDepth()

    // Track NotebookLM feature usage
    this.trackNotebookLMFeatures()

    // Track form interactions
    this.trackFormInteractions()

    // Track clicks on interactive elements
    this.trackClickInteractions()

    // Track performance issues
    this.trackPerformanceIssues()

    // Send session start event
    this.track('session_start', 'navigation', {
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
  }

  private trackScrollDepth() {
    let maxScroll = 0
    const milestones = [25, 50, 75, 90, 100]
    const reached = new Set<number>()

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      )
      
      maxScroll = Math.max(maxScroll, scrollPercent)
      
      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !reached.has(milestone)) {
          reached.add(milestone)
          this.track(`scroll_depth_${milestone}`, 'interaction', {
            scrollPercent: milestone,
            page: window.location.pathname
          })
        }
      })
    }

    window.addEventListener('scroll', this.throttle(handleScroll, 250))
  }

  private trackNotebookLMFeatures() {
    // Track dark mode usage
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const theme = (mutation.target as HTMLElement).getAttribute('data-theme')
          this.track('theme_change', 'interaction', {
            theme,
            notebookLMFeature: 'dark_mode'
          })
        }
      })
    })

    const htmlElement = document.querySelector('html')
    if (htmlElement) {
      observer.observe(htmlElement, { attributes: true })
    }

    // Track accessibility features
    this.trackAccessibilityUsage()

    // Track component interactions with NotebookLM styling
    this.trackNotebookLMComponentUsage()
  }

  private trackAccessibilityUsage() {
    // Track keyboard navigation
    let usingKeyboard = false
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (!usingKeyboard) {
          usingKeyboard = true
          this.track('keyboard_navigation_start', 'interaction', {
            notebookLMFeature: 'accessibility'
          })
        }
      }
    })

    document.addEventListener('mousedown', () => {
      if (usingKeyboard) {
        usingKeyboard = false
        this.track('keyboard_navigation_end', 'interaction', {
          notebookLMFeature: 'accessibility'
        })
      }
    })

    // Track screen reader usage (heuristic)
    if (navigator.userAgent.includes('NVDA') || 
        navigator.userAgent.includes('JAWS') ||
        navigator.userAgent.includes('VoiceOver')) {
      this.track('screen_reader_detected', 'interaction', {
        notebookLMFeature: 'accessibility',
        screenReader: this.detectScreenReader()
      })
    }
  }

  private trackNotebookLMComponentUsage() {
    // Track usage of NotebookLM-styled components
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      
      // Check for NotebookLM button styles
      if (target.closest('[style*="--notebooklm-primary"]') ||
          target.closest('.notebooklm-button') ||
          target.closest('[data-notebooklm="true"]')) {
        
        this.track('notebooklm_component_interaction', 'interaction', {
          componentType: this.getComponentType(target),
          notebookLMFeature: 'component_system'
        })
      }
    })
  }

  private trackFormInteractions() {
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        this.track('form_field_focus', 'interaction', {
          fieldType: target.tagName.toLowerCase(),
          fieldName: target.getAttribute('name') || target.getAttribute('id'),
          formId: target.closest('form')?.getAttribute('id')
        })
      }
    })

    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement
      this.track('form_submit', 'conversion', {
        formId: form.getAttribute('id'),
        formAction: form.getAttribute('action'),
        fieldCount: form.elements.length
      })
    })
  }

  private trackClickInteractions() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      
      // Track CTA clicks
      if (target.matches('[data-cta="true"]') || 
          target.closest('button')?.textContent?.toLowerCase().includes('sign up') ||
          target.closest('button')?.textContent?.toLowerCase().includes('get started')) {
        
        this.track('cta_click', 'conversion', {
          ctaText: target.textContent?.trim(),
          ctaLocation: this.getElementLocation(target)
        })
      }

      // Track navigation clicks
      if (target.closest('a[href]')) {
        const link = target.closest('a') as HTMLAnchorElement
        this.track('link_click', 'navigation', {
          href: link.href,
          text: link.textContent?.trim(),
          external: !link.href.includes(window.location.hostname)
        })
      }
    })
  }

  private trackPerformanceIssues() {
    // Track slow interactions
    let interactionStart = 0
    
    document.addEventListener('click', () => {
      interactionStart = performance.now()
    })

    // Use a MutationObserver to detect when the UI updates
    const observer = new MutationObserver(() => {
      if (interactionStart > 0) {
        const duration = performance.now() - interactionStart
        if (duration > 100) { // Slow interaction threshold
          this.track('slow_interaction', 'performance', {
            duration,
            type: 'click_to_update'
          })
        }
        interactionStart = 0
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    })

    // Track layout shifts
    if ('PerformanceObserver' in window) {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            const value = (entry as any).value
            if (value > 0.1) {
              this.track('layout_shift', 'performance', {
                value,
                severity: value > 0.25 ? 'high' : 'medium'
              })
            }
          }
        }
      })

      clsObserver.observe({ entryTypes: ['layout-shift'] })
    }
  }

  public track(
    event: string,
    category: UserEvent['category'],
    properties: Record<string, any> = {},
    customUserId?: string
  ) {
    if (!this.isEnabled) return

    const userEvent: UserEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      userId: customUserId,
      sessionId: this.sessionId,
      event,
      category,
      properties,
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      viewport: typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight
      } : { width: 0, height: 0 },
      deviceType: this.getDeviceType(),
      notebookLMFeature: properties.notebookLMFeature
    }

    this.events.push(userEvent)

    // Send to analytics service
    this.sendToAnalytics(userEvent)

    // Store locally for offline support
    this.storeLocally(userEvent)
  }

  private sendToAnalytics(event: UserEvent) {
    // Send to multiple analytics services
    
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', event.event, {
        event_category: event.category,
        event_label: event.page,
        custom_parameter_1: event.notebookLMFeature,
        ...event.properties
      })
    }

    // PostHog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(event.event, {
        ...event.properties,
        $current_url: event.page,
        $session_id: event.sessionId,
        notebooklm_feature: event.notebookLMFeature
      })
    }

    // Custom analytics endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }).catch(() => {
        // Silently fail - analytics shouldn't break the app
      })
    }
  }

  private storeLocally(event: UserEvent) {
    try {
      const stored = localStorage.getItem('analytics_events') || '[]'
      const events = JSON.parse(stored)
      events.push(event)
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100)
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(events))
    } catch {
      // Ignore storage errors
    }
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop'
    
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  private getComponentType(element: HTMLElement): string {
    // Determine component type from element
    if (element.closest('button')) return 'button'
    if (element.closest('input')) return 'input'
    if (element.closest('select')) return 'select'
    if (element.closest('[role="dialog"]')) return 'dialog'
    if (element.closest('[role="menu"]')) return 'menu'
    return 'unknown'
  }

  private getElementLocation(element: HTMLElement): string {
    // Get semantic location of element
    if (element.closest('header')) return 'header'
    if (element.closest('nav')) return 'navigation'
    if (element.closest('main')) return 'main'
    if (element.closest('footer')) return 'footer'
    if (element.closest('aside')) return 'sidebar'
    return 'unknown'
  }

  private detectScreenReader(): string {
    const ua = navigator.userAgent
    if (ua.includes('NVDA')) return 'NVDA'
    if (ua.includes('JAWS')) return 'JAWS'
    if (ua.includes('VoiceOver')) return 'VoiceOver'
    return 'unknown'
  }

  private throttle(func: Function, wait: number) {
    let timeout: NodeJS.Timeout | null = null
    return function executedFunction(...args: any[]) {
      const later = () => {
        timeout = null
        func(...args)
      }
      if (!timeout) {
        timeout = setTimeout(later, wait)
      }
    }
  }

  // Public methods for specific tracking needs
  public trackConversion(conversionType: string, value?: number, properties?: Record<string, any>) {
    this.track(`conversion_${conversionType}`, 'conversion', {
      value,
      ...properties
    })
  }

  public trackError(error: Error, context?: string) {
    this.track('error_occurred', 'error', {
      message: error.message,
      stack: error.stack,
      context,
      notebookLMFeature: 'error_tracking'
    })
  }

  public trackFeatureUsage(feature: string, action: string, properties?: Record<string, any>) {
    this.track(`feature_${feature}_${action}`, 'interaction', {
      feature,
      action,
      notebookLMFeature: feature,
      ...properties
    })
  }

  public getSessionSummary() {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      eventCount: this.events.length,
      pageViews: this.events.filter(e => e.category === 'navigation').length,
      interactions: this.events.filter(e => e.category === 'interaction').length,
      conversions: this.events.filter(e => e.category === 'conversion').length,
      errors: this.events.filter(e => e.category === 'error').length
    }
  }
}

// Singleton instance
export const userJourneyTracker = new UserJourneyTracker()

// React hook for easier integration
export function useAnalytics() {
  return {
    track: userJourneyTracker.track.bind(userJourneyTracker),
    trackConversion: userJourneyTracker.trackConversion.bind(userJourneyTracker),
    trackError: userJourneyTracker.trackError.bind(userJourneyTracker),
    trackFeatureUsage: userJourneyTracker.trackFeatureUsage.bind(userJourneyTracker),
    getSessionSummary: userJourneyTracker.getSessionSummary.bind(userJourneyTracker)
  }
}