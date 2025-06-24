/**
 * PRISMY PWA INSTALL MANAGER
 * Manages app installation prompts and user engagement
 */

import React from 'react'

export interface InstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export interface InstallMetrics {
  promptShown: number
  promptAccepted: number
  promptDismissed: number
  installationCompleted: number
  uninstallationDetected: number
  lastPromptDate?: Date
  userEngagementScore: number
}

export interface InstallManagerConfig {
  // Engagement thresholds
  minPageViews: number
  minSessionTime: number // in seconds
  minInteractions: number
  
  // Timing controls
  promptCooldownDays: number
  maxPromptsPerUser: number
  
  // UI customization
  customPromptEnabled: boolean
  showMiniPrompt: boolean
  promoteInMenu: boolean
}

class PWAInstallManager {
  private installPromptEvent: InstallPromptEvent | null = null
  private metrics: InstallMetrics
  private config: InstallManagerConfig
  private userEngagement = {
    pageViews: 0,
    sessionStart: Date.now(),
    interactions: 0,
    translationsCompleted: 0,
    documentsProcessed: 0
  }

  constructor(config: Partial<InstallManagerConfig> = {}) {
    this.config = {
      minPageViews: 3,
      minSessionTime: 120, // 2 minutes
      minInteractions: 5,
      promptCooldownDays: 7,
      maxPromptsPerUser: 3,
      customPromptEnabled: true,
      showMiniPrompt: true,
      promoteInMenu: true,
      ...config
    }

    this.metrics = this.loadMetrics()
    this.initialize()
  }

  /**
   * Initialize the install manager
   */
  private initialize(): void {
    if (typeof window === 'undefined') return

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.installPromptEvent = e as InstallPromptEvent
      console.log('[PWA Install] Install prompt available')
      
      // Show custom prompt if conditions are met
      this.evaluateInstallPrompt()
    })

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA Install] App was installed')
      this.trackInstallation()
      this.installPromptEvent = null
    })

    // Detect if app is running in standalone mode
    if (this.isInstalled()) {
      console.log('[PWA Install] App is running in installed mode')
      this.trackAppUsage()
    }

    // Track page view
    this.trackPageView()

    // Listen for user interactions
    this.setupInteractionTracking()
  }

  /**
   * Check if the app can be installed
   */
  public canInstall(): boolean {
    return this.installPromptEvent !== null
  }

  /**
   * Check if the app is already installed
   */
  public isInstalled(): boolean {
    if (typeof window === 'undefined') return false
    
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    )
  }

  /**
   * Show the native install prompt
   */
  public async showInstallPrompt(): Promise<{
    outcome: 'accepted' | 'dismissed' | 'unavailable'
    platform?: string
  }> {
    if (!this.installPromptEvent) {
      return { outcome: 'unavailable' }
    }

    try {
      // Show the native prompt
      await this.installPromptEvent.prompt()
      
      // Wait for user choice
      const choiceResult = await this.installPromptEvent.userChoice
      
      // Track the result
      this.trackPromptResult(choiceResult.outcome)
      
      // Clear the prompt event
      this.installPromptEvent = null
      
      return {
        outcome: choiceResult.outcome,
        platform: choiceResult.platform
      }

    } catch (error) {
      console.error('[PWA Install] Failed to show install prompt:', error)
      return { outcome: 'unavailable' }
    }
  }

  /**
   * Get current install metrics
   */
  public getMetrics(): InstallMetrics {
    return { ...this.metrics }
  }

  /**
   * Track user engagement for install eligibility
   */
  public trackEngagement(type: 'translation' | 'document' | 'interaction'): void {
    switch (type) {
      case 'translation':
        this.userEngagement.translationsCompleted++
        break
      case 'document':
        this.userEngagement.documentsProcessed++
        break
      case 'interaction':
        this.userEngagement.interactions++
        break
    }

    this.updateEngagementScore()
    this.evaluateInstallPrompt()
  }

  /**
   * Check if user is eligible for install prompt
   */
  public isEligibleForPrompt(): boolean {
    const engagement = this.userEngagement
    const sessionTime = (Date.now() - engagement.sessionStart) / 1000
    
    // Check engagement thresholds
    const engagementMet = (
      engagement.pageViews >= this.config.minPageViews &&
      sessionTime >= this.config.minSessionTime &&
      engagement.interactions >= this.config.minInteractions
    )

    // Check prompt cooldown
    const cooldownMet = this.isCooldownExpired()
    
    // Check max prompts limit
    const limitsOk = this.metrics.promptShown < this.config.maxPromptsPerUser

    return engagementMet && cooldownMet && limitsOk && !this.isInstalled()
  }

  /**
   * Get install prompt recommendation
   */
  public getInstallRecommendation(): {
    shouldPrompt: boolean
    reason: string
    confidence: number
  } {
    if (this.isInstalled()) {
      return {
        shouldPrompt: false,
        reason: 'App already installed',
        confidence: 0
      }
    }

    if (!this.canInstall()) {
      return {
        shouldPrompt: false,
        reason: 'Install prompt not available',
        confidence: 0
      }
    }

    const engagement = this.userEngagement
    const sessionTime = (Date.now() - engagement.sessionStart) / 1000
    
    // Calculate confidence score
    let confidence = 0
    confidence += Math.min(engagement.pageViews / this.config.minPageViews, 1) * 25
    confidence += Math.min(sessionTime / this.config.minSessionTime, 1) * 25
    confidence += Math.min(engagement.interactions / this.config.minInteractions, 1) * 25
    confidence += Math.min(this.metrics.userEngagementScore / 100, 1) * 25

    if (this.isEligibleForPrompt()) {
      return {
        shouldPrompt: true,
        reason: 'User shows high engagement',
        confidence: Math.round(confidence)
      }
    }

    // Identify blocking reason
    let reason = 'User engagement too low'
    if (!this.isCooldownExpired()) {
      reason = 'Cooldown period active'
    } else if (this.metrics.promptShown >= this.config.maxPromptsPerUser) {
      reason = 'Maximum prompts reached'
    }

    return {
      shouldPrompt: false,
      reason,
      confidence: Math.round(confidence)
    }
  }

  /**
   * Create an install promotion banner component
   */
  public createInstallBanner(): React.ComponentType<{
    onInstall?: () => void
    onDismiss?: () => void
  }> {
    return ({ onInstall, onDismiss }) => {
      const handleInstall = async () => {
        const result = await this.showInstallPrompt()
        if (result.outcome === 'accepted' && onInstall) {
          onInstall()
        }
      }

      const handleDismiss = () => {
        this.trackPromptResult('dismissed')
        if (onDismiss) {
          onDismiss()
        }
      }

      if (!this.canInstall() || !this.isEligibleForPrompt()) {
        return null
      }

      return React.createElement(
        'div',
        {
          className: 'fixed bottom-4 left-4 right-4 bg-blue-600 text-white rounded-lg p-4 shadow-lg z-50 flex items-center justify-between',
          style: { animation: 'slideUp 0.3s ease-out' }
        },
        React.createElement(
          'div',
          { className: 'flex-1' },
          React.createElement(
            'h3',
            { className: 'font-semibold text-sm' },
            'Install Prismy App'
          ),
          React.createElement(
            'p',
            { className: 'text-xs opacity-90 mt-1' },
            'Get faster access and offline capabilities'
          )
        ),
        React.createElement(
          'div',
          { className: 'flex gap-2 ml-4' },
          React.createElement(
            'button',
            {
              onClick: handleInstall,
              className: 'bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium'
            },
            'Install'
          ),
          React.createElement(
            'button',
            {
              onClick: handleDismiss,
              className: 'text-white opacity-70 px-2'
            },
            '×'
          )
        )
      )
    }
  }

  // Private methods

  private evaluateInstallPrompt(): void {
    if (this.config.customPromptEnabled && this.isEligibleForPrompt()) {
      console.log('[PWA Install] User is eligible for install prompt')
      // Dispatch custom event for UI components to listen
      window.dispatchEvent(new CustomEvent('pwa-install-available', {
        detail: this.getInstallRecommendation()
      }))
    }
  }

  private trackPageView(): void {
    this.userEngagement.pageViews++
    this.updateEngagementScore()
  }

  private setupInteractionTracking(): void {
    if (typeof window === 'undefined') return

    const events = ['click', 'touchstart', 'keydown', 'scroll']
    let interactionCount = 0

    const trackInteraction = () => {
      interactionCount++
      if (interactionCount % 5 === 0) { // Track every 5th interaction
        this.trackEngagement('interaction')
      }
    }

    events.forEach(event => {
      window.addEventListener(event, trackInteraction, { passive: true })
    })
  }

  private trackPromptResult(outcome: 'accepted' | 'dismissed'): void {
    this.metrics.promptShown++
    this.metrics.lastPromptDate = new Date()

    if (outcome === 'accepted') {
      this.metrics.promptAccepted++
    } else {
      this.metrics.promptDismissed++
    }

    this.saveMetrics()
    console.log('[PWA Install] Prompt result:', outcome)
  }

  private trackInstallation(): void {
    this.metrics.installationCompleted++
    this.saveMetrics()
  }

  private trackAppUsage(): void {
    // Track usage patterns for installed app
    const usageData = {
      sessionStart: Date.now(),
      isInstalled: true,
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
    }
    
    console.log('[PWA Install] App usage tracked:', usageData)
  }

  private updateEngagementScore(): void {
    const weights = {
      pageViews: 10,
      sessionTime: 20,
      interactions: 15,
      translations: 25,
      documents: 20
    }

    const sessionTime = (Date.now() - this.userEngagement.sessionStart) / 1000 / 60 // minutes
    
    this.metrics.userEngagementScore = Math.min(100, 
      (this.userEngagement.pageViews * weights.pageViews) +
      (sessionTime * weights.sessionTime) +
      (this.userEngagement.interactions * weights.interactions) +
      (this.userEngagement.translationsCompleted * weights.translations) +
      (this.userEngagement.documentsProcessed * weights.documents)
    )
  }

  private isCooldownExpired(): boolean {
    if (!this.metrics.lastPromptDate) return true
    
    const daysSinceLastPrompt = (Date.now() - this.metrics.lastPromptDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceLastPrompt >= this.config.promptCooldownDays
  }

  private loadMetrics(): InstallMetrics {
    if (typeof window === 'undefined') {
      return this.getDefaultMetrics()
    }

    try {
      const stored = localStorage.getItem('prismy-install-metrics')
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          ...this.getDefaultMetrics(),
          ...parsed,
          lastPromptDate: parsed.lastPromptDate ? new Date(parsed.lastPromptDate) : undefined
        }
      }
    } catch (error) {
      console.error('[PWA Install] Failed to load metrics:', error)
    }

    return this.getDefaultMetrics()
  }

  private saveMetrics(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('prismy-install-metrics', JSON.stringify(this.metrics))
    } catch (error) {
      console.error('[PWA Install] Failed to save metrics:', error)
    }
  }

  private getDefaultMetrics(): InstallMetrics {
    return {
      promptShown: 0,
      promptAccepted: 0,
      promptDismissed: 0,
      installationCompleted: 0,
      uninstallationDetected: 0,
      userEngagementScore: 0
    }
  }
}

// Export singleton instance
export const installManager = new PWAInstallManager()

// Export types and class for testing/customization
export { PWAInstallManager }
export type { InstallManagerConfig, InstallPromptEvent, InstallMetrics }