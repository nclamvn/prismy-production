'use client'

import React, { useState, useEffect } from 'react'
import { X, Shield, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ConsentBannerProps {
  onConsentChange?: (consent: ConsentSettings) => void
}

interface ConsentSettings {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

const defaultConsent: ConsentSettings = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  preferences: false
}

export function ConsentBanner({ onConsentChange }: ConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [consent, setConsent] = useState<ConsentSettings>(defaultConsent)

  useEffect(() => {
    // Check if user has already made a choice
    const savedConsent = localStorage.getItem('cookie_consent')
    if (!savedConsent) {
      setIsVisible(true)
    } else {
      try {
        const parsed = JSON.parse(savedConsent)
        setConsent(parsed)
        onConsentChange?.(parsed)
      } catch {
        setIsVisible(true)
      }
    }
  }, [onConsentChange])

  const handleAcceptAll = () => {
    const fullConsent: ConsentSettings = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    }
    saveConsent(fullConsent)
  }

  const handleAcceptNecessary = () => {
    saveConsent(defaultConsent)
  }

  const handleCustomSave = () => {
    saveConsent(consent)
  }

  const saveConsent = (settings: ConsentSettings) => {
    localStorage.setItem('cookie_consent', JSON.stringify(settings))
    localStorage.setItem('consent_timestamp', Date.now().toString())
    
    // Set analytics consent flag
    localStorage.setItem('analytics_consent', settings.analytics ? 'accepted' : 'declined')
    
    setConsent(settings)
    onConsentChange?.(settings)
    setIsVisible(false)

    // Reload analytics scripts if consent was given
    if (settings.analytics) {
      window.location.reload()
    }
  }

  const toggleConsent = (type: keyof ConsentSettings) => {
    if (type === 'necessary') return // Can't disable necessary cookies
    
    setConsent(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-consent-banner">
        <div
          className="mx-auto max-w-4xl rounded-lg p-6 shadow-lg backdrop-blur-sm"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            border: '1px solid var(--surface-outline)',
            borderRadius: 'var(--mat-card-elevated-container-shape)',
            boxShadow: 'var(--elevation-level-4)'
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield 
                className="w-6 h-6 flex-shrink-0" 
                style={{ color: 'var(--notebooklm-primary)' }}
              />
              <div>
                <h3 
                  className="font-semibold mb-1"
                  style={{
                    fontSize: 'var(--sys-headline-small-size)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Your Privacy Matters
                </h3>
                <p 
                  style={{
                    fontSize: 'var(--sys-body-medium-size)',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5'
                  }}
                >
                  We use cookies to enhance your experience with our NotebookLM-inspired platform, 
                  analyze usage patterns, and improve our AI translation services.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsVisible(false)}
              className="p-2 rounded-full hover:bg-opacity-10"
              style={{ 
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {showDetails && (
            <div className="mb-6 space-y-4 animate-consent-details">
              <div className="grid gap-4">
                {/* Necessary Cookies */}
                <div className="flex items-center justify-between p-3 rounded-lg" 
                     style={{ backgroundColor: 'var(--surface-filled)' }}>
                  <div>
                    <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      Necessary Cookies
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Required for basic functionality, authentication, and security.
                    </p>
                  </div>
                  <div
                    className="w-12 h-6 rounded-full flex items-center px-1"
                    style={{ backgroundColor: 'var(--notebooklm-primary)' }}
                  >
                    <div className="w-4 h-4 rounded-full bg-white ml-auto" />
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-3 rounded-lg" 
                     style={{ backgroundColor: 'var(--surface-filled)' }}>
                  <div>
                    <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      Analytics Cookies
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Help us understand how you use our platform and improve performance.
                    </p>
                  </div>
                  <button
                    onClick={() => toggleConsent('analytics')}
                    className="w-12 h-6 rounded-full flex items-center px-1 transition-colors"
                    style={{ 
                      backgroundColor: consent.analytics ? 'var(--notebooklm-primary)' : 'var(--surface-outline)'
                    }}
                  >
                    <div 
                      className="w-4 h-4 rounded-full bg-white transition-transform"
                      style={{
                        transform: consent.analytics ? 'translateX(24px)' : 'translateX(0)'
                      }}
                    />
                  </button>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between p-3 rounded-lg" 
                     style={{ backgroundColor: 'var(--surface-filled)' }}>
                  <div>
                    <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      Marketing Cookies
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Used to show you relevant content and advertisements.
                    </p>
                  </div>
                  <button
                    onClick={() => toggleConsent('marketing')}
                    className="w-12 h-6 rounded-full flex items-center px-1 transition-colors"
                    style={{ 
                      backgroundColor: consent.marketing ? 'var(--notebooklm-primary)' : 'var(--surface-outline)'
                    }}
                  >
                    <div 
                      className="w-4 h-4 rounded-full bg-white transition-transform"
                      style={{
                        transform: consent.marketing ? 'translateX(24px)' : 'translateX(0)'
                      }}
                    />
                  </button>
                </div>

                {/* Preferences Cookies */}
                <div className="flex items-center justify-between p-3 rounded-lg" 
                     style={{ backgroundColor: 'var(--surface-filled)' }}>
                  <div>
                    <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      Preference Cookies
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Remember your settings like language, theme, and layout preferences.
                    </p>
                  </div>
                  <button
                    onClick={() => toggleConsent('preferences')}
                    className="w-12 h-6 rounded-full flex items-center px-1 transition-colors"
                    style={{ 
                      backgroundColor: consent.preferences ? 'var(--notebooklm-primary)' : 'var(--surface-outline)'
                    }}
                  >
                    <div 
                      className="w-4 h-4 rounded-full bg-white transition-transform"
                      style={{
                        transform: consent.preferences ? 'translateX(24px)' : 'translateX(0)'
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm underline"
              style={{ color: 'var(--notebooklm-primary)' }}
            >
              <Settings className="w-4 h-4" />
              {showDetails ? 'Hide' : 'Customize'} Settings
            </button>

            <div className="flex gap-3">
              <Button
                variant="outlined"
                size="sm"
                onClick={handleAcceptNecessary}
              >
                Necessary Only
              </Button>
              
              {showDetails && (
                <Button
                  variant="filled"
                  size="sm"
                  onClick={handleCustomSave}
                >
                  Save Preferences
                </Button>
              )}
              
              {!showDetails && (
                <Button
                  variant="filled"
                  size="sm"
                  onClick={handleAcceptAll}
                >
                  Accept All
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--surface-outline)' }}>
            <p className="text-xs" style={{ color: 'var(--text-disabled)' }}>
              By continuing to use Prismy, you agree to our{' '}
              <a href="/privacy" className="underline" style={{ color: 'var(--notebooklm-primary)' }}>
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="/terms" className="underline" style={{ color: 'var(--notebooklm-primary)' }}>
                Terms of Service
              </a>
              . You can change your preferences at any time in Settings.
            </p>
          </div>
        </div>
    </div>
  )
}

// Hook to manage consent state
export function useConsent() {
  const [consent, setConsent] = useState<ConsentSettings | null>(null)

  useEffect(() => {
    const savedConsent = localStorage.getItem('cookie_consent')
    if (savedConsent) {
      try {
        setConsent(JSON.parse(savedConsent))
      } catch {
        setConsent(null)
      }
    }
  }, [])

  const updateConsent = (newConsent: ConsentSettings) => {
    localStorage.setItem('cookie_consent', JSON.stringify(newConsent))
    setConsent(newConsent)
  }

  const hasConsent = (type: keyof ConsentSettings) => {
    return consent?.[type] ?? false
  }

  return {
    consent,
    updateConsent,
    hasConsent,
    hasAnalyticsConsent: hasConsent('analytics'),
    hasMarketingConsent: hasConsent('marketing'),
    hasPreferencesConsent: hasConsent('preferences')
  }
}