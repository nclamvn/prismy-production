'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { analytics } from '@/lib/analytics'

export default function AnalyticsInitializer() {
  const { user } = useAuth()
  const { language } = useSSRSafeLanguage()

  useEffect(() => {
    // Initialize analytics with user data when available
    const initializeAnalytics = async () => {
      try {
        await analytics.initialize({
          userId: user?.id,
          userProperties: {
            id: user?.id,
            email: user?.email,
            language: language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            firstVisit: new Date().toISOString(),
            lastActive: new Date().toISOString(),
          }
        })
      } catch (error) {
        console.error('Failed to initialize analytics:', error)
      }
    }

    initializeAnalytics()
  }, [user, language])

  // Track user identification when user changes
  useEffect(() => {
    if (user?.id) {
      analytics.setUserId(user.id)
      analytics.setUserProperties({
        id: user.id,
        email: user.email,
        language: language,
        lastActive: new Date().toISOString(),
      })
    }
  }, [user, language])

  // Track page views on route changes
  useEffect(() => {
    analytics.trackPageView(window.location.pathname)
  }, [])

  return null // This component doesn't render anything
}