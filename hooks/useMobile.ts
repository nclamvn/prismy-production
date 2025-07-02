import { useState, useEffect } from 'react'

interface MobileDetection {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  orientation: 'portrait' | 'landscape'
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  userAgent: {
    isIOS: boolean
    isAndroid: boolean
    isSafari: boolean
    isChrome: boolean
    isFirefox: boolean
  }
}

export function useMobile(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    orientation: 'landscape',
    screenSize: 'lg',
    userAgent: {
      isIOS: false,
      isAndroid: false,
      isSafari: false,
      isChrome: false,
      isFirefox: false,
    },
  })

  useEffect(() => {
    const detectDevice = () => {
      if (typeof window === 'undefined') return

      const width = window.innerWidth
      const height = window.innerHeight
      const userAgent = navigator.userAgent

      // Screen size detection
      let screenSize: MobileDetection['screenSize'] = 'lg'
      if (width < 640) screenSize = 'xs'
      else if (width < 768) screenSize = 'sm'
      else if (width < 1024) screenSize = 'md'
      else if (width < 1280) screenSize = 'lg'
      else if (width < 1536) screenSize = 'xl'
      else screenSize = '2xl'

      // Device type detection
      const isMobile = width < 768
      const isTablet = width >= 768 && width < 1024
      const isDesktop = width >= 1024

      // Touch device detection
      const isTouchDevice =
        'ontouchstart' in window || navigator.maxTouchPoints > 0

      // Orientation detection
      const orientation = height > width ? 'portrait' : 'landscape'

      // User agent detection
      const isIOS = /iPad|iPhone|iPod/.test(userAgent)
      const isAndroid = /Android/.test(userAgent)
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
      const isChrome = /Chrome/.test(userAgent)
      const isFirefox = /Firefox/.test(userAgent)

      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        orientation,
        screenSize,
        userAgent: {
          isIOS,
          isAndroid,
          isSafari,
          isChrome,
          isFirefox,
        },
      })
    }

    detectDevice()

    // Listen for resize and orientation changes
    const handleResize = () => detectDevice()
    const handleOrientationChange = () => {
      // Delay to allow for orientation change to complete
      setTimeout(detectDevice, 100)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return detection
}

export function useDeviceOrientation() {
  const [orientation, setOrientation] = useState<{
    alpha: number | null
    beta: number | null
    gamma: number | null
    supported: boolean
  }>({
    alpha: null,
    beta: null,
    gamma: null,
    supported: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      setOrientation({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        supported: true,
      })
    }

    // Check if device orientation is supported
    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleDeviceOrientation)

      return () => {
        window.removeEventListener('deviceorientation', handleDeviceOrientation)
      }
    }
  }, [])

  return orientation
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: true,
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false,
    } as any,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateOnlineStatus = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine,
      }))
    }

    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        setNetworkStatus(prev => ({
          ...prev,
          connection: {
            effectiveType: connection.effectiveType || '4g',
            downlink: connection.downlink || 10,
            rtt: connection.rtt || 100,
            saveData: connection.saveData || false,
          },
        }))
      }
    }

    updateOnlineStatus()
    updateConnectionInfo()

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener('change', updateConnectionInfo)
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)

      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        connection.removeEventListener('change', updateConnectionInfo)
      }
    }
  }, [])

  return networkStatus
}

export function useVibration() {
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const vibratePattern = {
    success: [100],
    error: [100, 100, 100],
    warning: [200],
    notification: [50, 50, 50],
    selection: [25],
    longPress: [75],
  }

  return {
    vibrate,
    patterns: vibratePattern,
    isSupported: 'vibrate' in navigator,
  }
}

export function useWakeLock() {
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null)
  const [isSupported] = useState('wakeLock' in navigator)

  const requestWakeLock = async () => {
    if (!isSupported) return false

    try {
      const wakeLockSentinel = await (navigator as any).wakeLock.request(
        'screen'
      )
      setWakeLock(wakeLockSentinel)
      return true
    } catch (error) {
      console.warn('Wake lock request failed:', error)
      return false
    }
  }

  const releaseWakeLock = async () => {
    if (wakeLock) {
      await wakeLock.release()
      setWakeLock(null)
    }
  }

  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release()
      }
    }
  }, [wakeLock])

  return {
    requestWakeLock,
    releaseWakeLock,
    isActive: !!wakeLock,
    isSupported,
  }
}
