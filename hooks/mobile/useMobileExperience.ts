/**
 * PRISMY MOBILE EXPERIENCE HOOK
 * Comprehensive mobile features integration
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { installManager } from '@/lib/mobile/install-manager'
import { nativeAPIs } from '@/lib/mobile/native-apis'
import { advancedGestures } from '@/lib/mobile/advanced-gestures'
import { mobilePerformance } from '@/lib/mobile/mobile-performance'

export interface MobileCapabilities {
  canInstall: boolean
  isInstalled: boolean
  supportsShare: boolean
  supportsFileSystem: boolean
  supportsNotifications: boolean
  supportsCamera: boolean
  supportsGeolocation: boolean
  performanceScore: number
}

export interface MobileExperienceConfig {
  enableInstallPrompts: boolean
  enableGestures: boolean
  enablePerformanceMonitoring: boolean
  enableNativeFeatures: boolean
  autoOptimizePerformance: boolean
}

export interface MobileExperienceState {
  capabilities: MobileCapabilities
  installRecommendation: any
  performanceMetrics: any
  isOnline: boolean
  connectionType: string
  batteryLevel?: number
  memoryUsage: number
}

export const useMobileExperience = (
  config: Partial<MobileExperienceConfig> = {}
) => {
  const defaultConfig: MobileExperienceConfig = {
    enableInstallPrompts: true,
    enableGestures: true,
    enablePerformanceMonitoring: true,
    enableNativeFeatures: true,
    autoOptimizePerformance: true,
  }

  const finalConfig = { ...defaultConfig, ...config }

  // State
  const [state, setState] = useState<MobileExperienceState>({
    capabilities: {
      canInstall: false,
      isInstalled: false,
      supportsShare: false,
      supportsFileSystem: false,
      supportsNotifications: false,
      supportsCamera: false,
      supportsGeolocation: false,
      performanceScore: 0,
    },
    installRecommendation: null,
    performanceMetrics: null,
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
    memoryUsage: 0,
  })

  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showPerformanceBar, setShowPerformanceBar] = useState(false)
  const gestureHandlers = useRef<Map<string, () => void>>(new Map())

  // Initialize mobile experience
  useEffect(() => {
    if (typeof window === 'undefined') return

    const initializeMobile = async () => {
      // Get device capabilities
      const deviceCapabilities = nativeAPIs.getCapabilities()
      const installCapabilities = {
        canInstall: installManager.canInstall(),
        isInstalled: installManager.isInstalled(),
      }

      setState(prev => ({
        ...prev,
        capabilities: {
          ...deviceCapabilities,
          ...installCapabilities,
          performanceScore: mobilePerformance.getPerformanceScore(),
        },
      }))

      // Listen for install prompt availability
      if (finalConfig.enableInstallPrompts) {
        window.addEventListener('pwa-install-available', handleInstallAvailable)
      }

      // Monitor performance
      if (finalConfig.enablePerformanceMonitoring) {
        startPerformanceMonitoring()
      }

      // Monitor network status
      window.addEventListener('online', handleOnlineStatusChange)
      window.addEventListener('offline', handleOnlineStatusChange)

      // Initialize battery monitoring
      initializeBatteryMonitoring()
    }

    initializeMobile()

    return () => {
      window.removeEventListener(
        'pwa-install-available',
        handleInstallAvailable
      )
      window.removeEventListener('online', handleOnlineStatusChange)
      window.removeEventListener('offline', handleOnlineStatusChange)
      gestureHandlers.current.forEach(unsubscribe => unsubscribe())
    }
  }, [])

  // Handle install prompt availability
  const handleInstallAvailable = useCallback((event: any) => {
    const recommendation = event.detail
    setState(prev => ({
      ...prev,
      installRecommendation: recommendation,
    }))

    if (recommendation.shouldPrompt && recommendation.confidence > 70) {
      setShowInstallPrompt(true)
    }
  }, [])

  // Handle online status changes
  const handleOnlineStatusChange = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOnline: navigator.onLine,
    }))
  }, [])

  // Start performance monitoring
  const startPerformanceMonitoring = useCallback(() => {
    const updatePerformance = () => {
      const metrics = mobilePerformance.getMetrics()
      const score = mobilePerformance.getPerformanceScore()

      setState(prev => ({
        ...prev,
        performanceMetrics: metrics,
        capabilities: {
          ...prev.capabilities,
          performanceScore: score,
        },
        memoryUsage: metrics?.memoryUsage || 0,
      }))

      // Show performance bar for poor performance
      if (score < 60) {
        setShowPerformanceBar(true)
      }
    }

    updatePerformance()
    const interval = setInterval(updatePerformance, 10000) // Every 10 seconds
    return () => clearInterval(interval)
  }, [])

  // Initialize battery monitoring
  const initializeBatteryMonitoring = useCallback(async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        setState(prev => ({
          ...prev,
          batteryLevel: battery.level * 100,
        }))

        battery.addEventListener('levelchange', () => {
          setState(prev => ({
            ...prev,
            batteryLevel: battery.level * 100,
          }))
        })
      } catch (error) {
        console.warn('[Mobile Experience] Battery API not available')
      }
    }
  }, [])

  // Install app
  const installApp = useCallback(async () => {
    const result = await installManager.showInstallPrompt()

    if (result.outcome === 'accepted') {
      setState(prev => ({
        ...prev,
        capabilities: {
          ...prev.capabilities,
          isInstalled: true,
        },
      }))
      setShowInstallPrompt(false)
    }

    return result
  }, [])

  // Share content
  const shareContent = useCallback(
    async (data: {
      title?: string
      text?: string
      url?: string
      files?: File[]
    }) => {
      return await nativeAPIs.share(data)
    },
    []
  )

  // Save file
  const saveFile = useCallback(
    async (content: string | Blob, filename?: string) => {
      return await nativeAPIs.saveFile(content, filename)
    },
    []
  )

  // Pick files
  const pickFiles = useCallback(
    async (options?: { multiple?: boolean; accept?: string[] }) => {
      const types = options?.accept
        ? [
            {
              description: 'Selected files',
              accept: { '*/*': options.accept },
            },
          ]
        : undefined

      return await nativeAPIs.pickFile({
        multiple: options?.multiple,
        types,
      })
    },
    []
  )

  // Request notifications
  const requestNotifications = useCallback(async () => {
    return await nativeAPIs.requestNotificationPermission()
  }, [])

  // Show notification
  const showNotification = useCallback(
    async (config: { title: string; body: string; icon?: string }) => {
      return await nativeAPIs.showNotification(config)
    },
    []
  )

  // Get current location
  const getCurrentLocation = useCallback(async (options?: PositionOptions) => {
    return await nativeAPIs.getCurrentLocation(options)
  }, [])

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    return await nativeAPIs.writeToClipboard(text)
  }, [])

  // Read from clipboard
  const readFromClipboard = useCallback(async () => {
    return await nativeAPIs.readFromClipboard()
  }, [])

  // Add gesture handler
  const addGestureHandler = useCallback(
    (gestureType: string, handler: (gesture: any) => void) => {
      if (!finalConfig.enableGestures) return () => {}

      const unsubscribe = advancedGestures.on(gestureType, handler)
      gestureHandlers.current.set(`${gestureType}-${Date.now()}`, unsubscribe)
      return unsubscribe
    },
    [finalConfig.enableGestures]
  )

  // Optimize performance
  const optimizePerformance = useCallback(async () => {
    const recommendations = mobilePerformance.getOptimizationRecommendations()
    const results = []

    for (const optimization of recommendations.slice(0, 3)) {
      const success = await mobilePerformance.applyOptimization(optimization.id)
      results.push({ optimization: optimization.name, success })
    }

    return results
  }, [])

  // Track engagement
  const trackEngagement = useCallback(
    (type: 'translation' | 'document' | 'interaction') => {
      installManager.trackEngagement(type)
    },
    []
  )

  // Dismiss install prompt
  const dismissInstallPrompt = useCallback(() => {
    setShowInstallPrompt(false)
  }, [])

  // Dismiss performance bar
  const dismissPerformanceBar = useCallback(() => {
    setShowPerformanceBar(false)
  }, [])

  // Get connection info
  const getConnectionInfo = useCallback(() => {
    return nativeAPIs.getNetworkInfo()
  }, [])

  // Check if device is mobile
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  }, [])

  // Check if device supports touch
  const supportsTouch = useCallback(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }, [])

  // Get device info
  const getDeviceInfo = useCallback(() => {
    return {
      ...mobilePerformance.getDeviceInfo(),
      isMobile: isMobile(),
      supportsTouch: supportsTouch(),
      ...getConnectionInfo(),
    }
  }, [isMobile, supportsTouch, getConnectionInfo])

  // Create install banner component
  const InstallBanner = useCallback(() => {
    if (!showInstallPrompt || !state.capabilities.canInstall) return null

    return installManager.createInstallBanner()({
      onInstall: () => {
        installApp()
        setShowInstallPrompt(false)
      },
      onDismiss: dismissInstallPrompt,
    })
  }, [
    showInstallPrompt,
    state.capabilities.canInstall,
    installApp,
    dismissInstallPrompt,
  ])

  // Create performance monitor component
  const PerformanceMonitor = useCallback(() => {
    if (!showPerformanceBar || !finalConfig.enablePerformanceMonitoring)
      return null

    return mobilePerformance.createPerformanceMonitor()({
      showDetails: false,
      onOptimizationApplied: optimization => {
        console.log(
          '[Mobile Experience] Applied optimization:',
          optimization.name
        )
      },
    })
  }, [showPerformanceBar, finalConfig.enablePerformanceMonitoring])

  return {
    // State
    ...state,
    showInstallPrompt,
    showPerformanceBar,

    // Actions
    installApp,
    shareContent,
    saveFile,
    pickFiles,
    requestNotifications,
    showNotification,
    getCurrentLocation,
    copyToClipboard,
    readFromClipboard,
    addGestureHandler,
    optimizePerformance,
    trackEngagement,
    dismissInstallPrompt,
    dismissPerformanceBar,

    // Info
    getDeviceInfo,
    getConnectionInfo,
    isMobile: isMobile(),
    supportsTouch: supportsTouch(),

    // Components
    InstallBanner,
    PerformanceMonitor,
  }
}

export default useMobileExperience
