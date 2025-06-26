/**
 * A/B Testing Framework for NotebookLM Features
 * Phase 10.3: Advanced Experimentation Setup
 */

export interface Experiment {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  variants: Variant[]
  targeting: TargetingRules
  metrics: string[]
  startDate: string
  endDate?: string
  trafficAllocation: number // 0-100 percentage
  notebookLMFeature?: string // Track NotebookLM-specific experiments
}

export interface Variant {
  id: string
  name: string
  description: string
  weight: number // 0-100 percentage within experiment
  config: Record<string, any>
  isControl: boolean
}

export interface TargetingRules {
  countries?: string[]
  devices?: ('mobile' | 'tablet' | 'desktop')[]
  userSegments?: string[]
  newUsersOnly?: boolean
  returningUsersOnly?: boolean
  minSessionCount?: number
  customRules?: CustomRule[]
}

export interface CustomRule {
  property: string
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'in'
  value: any
}

export interface ExperimentResult {
  experimentId: string
  variantId: string
  userId?: string
  sessionId: string
  timestamp: number
  metrics: Record<string, number>
}

class ExperimentEngine {
  private experiments: Map<string, Experiment> = new Map()
  private userVariants: Map<string, string> = new Map()
  private isEnabled: boolean

  constructor() {
    this.isEnabled = process.env.NEXT_PUBLIC_AB_TESTING_ENABLED === 'true'
    if (this.isEnabled) {
      this.loadExperiments()
      this.loadUserVariants()
    }
  }

  private loadExperiments() {
    // In production, this would load from your backend
    // For now, we'll define some NotebookLM-focused experiments
    const notebookLMExperiments: Experiment[] = [
      {
        id: 'hero_design_test',
        name: 'Hero Section Design Test',
        description: 'Test different hero section layouts with NotebookLM styling',
        status: 'active',
        variants: [
          {
            id: 'control',
            name: 'Current Design',
            description: 'Existing hero with standard layout',
            weight: 50,
            config: { layout: 'standard' },
            isControl: true
          },
          {
            id: 'enhanced',
            name: 'Enhanced NotebookLM',
            description: 'Enhanced hero with stronger NotebookLM visual elements',
            weight: 50,
            config: { 
              layout: 'enhanced',
              showGradientBg: true,
              enhancedAnimations: true
            },
            isControl: false
          }
        ],
        targeting: {
          devices: ['desktop', 'tablet'],
          newUsersOnly: true
        },
        metrics: ['conversion_rate', 'bounce_rate', 'time_on_page'],
        startDate: '2025-06-26',
        trafficAllocation: 50,
        notebookLMFeature: 'hero_design'
      },
      {
        id: 'dark_mode_onboarding',
        name: 'Dark Mode Onboarding',
        description: 'Test different approaches to introducing dark mode',
        status: 'active',
        variants: [
          {
            id: 'control',
            name: 'No Prompt',
            description: 'Users discover dark mode naturally',
            weight: 33,
            config: { showDarkModePrompt: false },
            isControl: true
          },
          {
            id: 'tooltip',
            name: 'Tooltip Hint',
            description: 'Show tooltip on theme toggle',
            weight: 33,
            config: { 
              showDarkModePrompt: true,
              promptType: 'tooltip'
            },
            isControl: false
          },
          {
            id: 'banner',
            name: 'Welcome Banner',
            description: 'Show welcome banner promoting dark mode',
            weight: 34,
            config: { 
              showDarkModePrompt: true,
              promptType: 'banner'
            },
            isControl: false
          }
        ],
        targeting: {
          newUsersOnly: true
        },
        metrics: ['dark_mode_adoption', 'user_retention'],
        startDate: '2025-06-26',
        trafficAllocation: 30,
        notebookLMFeature: 'dark_mode'
      },
      {
        id: 'animation_performance',
        name: 'Animation Performance Test',
        description: 'Test reduced animations for better performance',
        status: 'active',
        variants: [
          {
            id: 'control',
            name: 'Full Animations',
            description: 'All framer-motion animations enabled',
            weight: 50,
            config: { animationLevel: 'full' },
            isControl: true
          },
          {
            id: 'reduced',
            name: 'Reduced Animations',
            description: 'Simplified animations for better performance',
            weight: 50,
            config: { animationLevel: 'reduced' },
            isControl: false
          }
        ],
        targeting: {
          devices: ['mobile'],
          customRules: [
            {
              property: 'connection',
              operator: 'in',
              value: ['slow-2g', '2g', '3g']
            }
          ]
        },
        metrics: ['page_load_time', 'interaction_delay', 'bounce_rate'],
        startDate: '2025-06-26',
        trafficAllocation: 25,
        notebookLMFeature: 'animations'
      }
    ]

    notebookLMExperiments.forEach(exp => {
      this.experiments.set(exp.id, exp)
    })
  }

  private loadUserVariants() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ab_test_variants')
        if (stored) {
          const variants = JSON.parse(stored)
          Object.entries(variants).forEach(([expId, variantId]) => {
            this.userVariants.set(expId, variantId as string)
          })
        }
      } catch {
        // Ignore storage errors
      }
    }
  }

  private saveUserVariants() {
    if (typeof window !== 'undefined') {
      try {
        const variants = Object.fromEntries(this.userVariants)
        localStorage.setItem('ab_test_variants', JSON.stringify(variants))
      } catch {
        // Ignore storage errors
      }
    }
  }

  public getVariant(experimentId: string, userId?: string): Variant | null {
    if (!this.isEnabled) return null

    const experiment = this.experiments.get(experimentId)
    if (!experiment || experiment.status !== 'active') {
      return null
    }

    // Check if user is already assigned to a variant
    const existingVariant = this.userVariants.get(experimentId)
    if (existingVariant) {
      return experiment.variants.find(v => v.id === existingVariant) || null
    }

    // Check targeting rules
    if (!this.isUserEligible(experiment, userId)) {
      return null
    }

    // Check traffic allocation
    if (Math.random() * 100 > experiment.trafficAllocation) {
      return null
    }

    // Assign variant based on weights
    const variant = this.assignVariant(experiment, userId)
    if (variant) {
      this.userVariants.set(experimentId, variant.id)
      this.saveUserVariants()
      
      // Track assignment
      this.trackExperimentAssignment(experiment, variant, userId)
    }

    return variant
  }

  private isUserEligible(experiment: Experiment, userId?: string): boolean {
    const targeting = experiment.targeting

    // Device targeting
    if (targeting.devices && typeof window !== 'undefined') {
      const deviceType = this.getDeviceType()
      if (!targeting.devices.includes(deviceType)) {
        return false
      }
    }

    // Country targeting
    if (targeting.countries) {
      const userCountry = this.getUserCountry()
      if (userCountry && !targeting.countries.includes(userCountry)) {
        return false
      }
    }

    // New vs returning users
    if (targeting.newUsersOnly || targeting.returningUsersOnly) {
      const isNewUser = this.isNewUser(userId)
      if (targeting.newUsersOnly && !isNewUser) return false
      if (targeting.returningUsersOnly && isNewUser) return false
    }

    // Custom rules
    if (targeting.customRules) {
      for (const rule of targeting.customRules) {
        if (!this.evaluateCustomRule(rule)) {
          return false
        }
      }
    }

    return true
  }

  private assignVariant(experiment: Experiment, userId?: string): Variant | null {
    // Use deterministic assignment based on user ID for consistency
    const seed = userId || this.getAnonymousId()
    const hash = this.hashString(`${experiment.id}:${seed}`)
    const random = (hash % 100) / 100

    let cumulativeWeight = 0
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight / 100
      if (random <= cumulativeWeight) {
        return variant
      }
    }

    // Fallback to control
    return experiment.variants.find(v => v.isControl) || experiment.variants[0]
  }

  private trackExperimentAssignment(experiment: Experiment, variant: Variant, userId?: string) {
    // Track assignment to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'experiment_assignment', {
        experiment_id: experiment.id,
        variant_id: variant.id,
        notebooklm_feature: experiment.notebookLMFeature
      })
    }

    // Track to custom analytics
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'experiment_assignment',
          experimentId: experiment.id,
          variantId: variant.id,
          userId,
          timestamp: Date.now(),
          notebookLMFeature: experiment.notebookLMFeature
        })
      }).catch(() => {
        // Silently fail
      })
    }
  }

  public trackConversion(experimentId: string, metric: string, value: number = 1) {
    if (!this.isEnabled) return

    const variantId = this.userVariants.get(experimentId)
    if (!variantId) return

    const result: ExperimentResult = {
      experimentId,
      variantId,
      sessionId: this.getSessionId(),
      timestamp: Date.now(),
      metrics: { [metric]: value }
    }

    // Send to analytics
    this.sendResult(result)
  }

  private sendResult(result: ExperimentResult) {
    // Track to analytics services
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'experiment_conversion', {
        experiment_id: result.experimentId,
        variant_id: result.variantId,
        metric: Object.keys(result.metrics)[0],
        value: Object.values(result.metrics)[0]
      })
    }

    // Send to backend
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'experiment_result',
          ...result
        })
      }).catch(() => {
        // Silently fail
      })
    }
  }

  // Utility methods
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop'
    
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  private getUserCountry(): string | null {
    // In production, this could use IP geolocation or user preferences
    return null
  }

  private isNewUser(userId?: string): boolean {
    if (!userId) return true
    
    // Check if user has visited before
    const visitCount = parseInt(localStorage.getItem('visit_count') || '0')
    return visitCount <= 1
  }

  private evaluateCustomRule(rule: CustomRule): boolean {
    // Implement custom rule evaluation
    // This would check various user properties and browser features
    return true
  }

  private getAnonymousId(): string {
    if (typeof window === 'undefined') return 'anonymous'
    
    let id = localStorage.getItem('anonymous_id')
    if (!id) {
      id = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('anonymous_id', id)
    }
    return id
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'session'
    
    let id = sessionStorage.getItem('session_id')
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('session_id', id)
    }
    return id
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  // Public API
  public getActiveExperiments(): Experiment[] {
    return Array.from(this.experiments.values()).filter(exp => exp.status === 'active')
  }

  public getUserVariants(): Record<string, string> {
    return Object.fromEntries(this.userVariants)
  }

  public forceVariant(experimentId: string, variantId: string) {
    this.userVariants.set(experimentId, variantId)
    this.saveUserVariants()
  }

  public clearUserVariants() {
    this.userVariants.clear()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ab_test_variants')
    }
  }
}

// Singleton instance
export const experimentEngine = new ExperimentEngine()

// React hook for A/B testing
export function useExperiment(experimentId: string, userId?: string) {
  const [variant, setVariant] = React.useState<Variant | null>(null)

  React.useEffect(() => {
    const assignedVariant = experimentEngine.getVariant(experimentId, userId)
    setVariant(assignedVariant)
  }, [experimentId, userId])

  const trackConversion = React.useCallback((metric: string, value: number = 1) => {
    experimentEngine.trackConversion(experimentId, metric, value)
  }, [experimentId])

  return {
    variant,
    isInExperiment: variant !== null,
    config: variant?.config || {},
    trackConversion
  }
}

// Component for conditional rendering based on experiments
interface ExperimentProps {
  experimentId: string
  variantId?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function Experiment({ experimentId, variantId, fallback, children }: ExperimentProps) {
  const { variant, isInExperiment } = useExperiment(experimentId)

  if (!isInExperiment) {
    return fallback
  }

  if (variantId && variant?.id !== variantId) {
    return fallback
  }

  return children
}