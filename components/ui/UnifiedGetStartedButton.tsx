'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUnifiedAuthContext } from '@/contexts/UnifiedAuthProvider'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useRouter } from 'next/navigation'

interface UnifiedGetStartedButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg' | 'compact-md' | 'pill-lg'
  className?: string
  redirectTo?: string
  children?: React.ReactNode
  onClick?: () => void
  style?: React.CSSProperties
}

export default function UnifiedGetStartedButton({
  variant = 'primary',
  size = 'md',
  className = '',
  redirectTo = '/workspace',
  children,
  onClick,
  style,
}: UnifiedGetStartedButtonProps) {
  const { user, loading } = useAuth()
  const { handleGetStarted } = useUnifiedAuthContext()
  const { language } = useSSRSafeLanguage()
  const router = useRouter()

  const content = {
    vi: {
      getStarted: 'Bắt đầu',
      goToWorkspace: 'Vào Workspace',
    },
    en: {
      getStarted: 'Get Started',
      goToWorkspace: 'Go to Workspace',
    },
  }

  const handleClick = () => {
    if (user) {
      // User is authenticated - navigate directly to workspace
      router.push(redirectTo)
    } else {
      // User needs to authenticate
      handleGetStarted({
        initialMode: 'signup',
        redirectTo,
      })
    }

    // Call additional onClick if provided
    if (onClick) {
      onClick()
    }
  }

  // Generate button classes based on variant and size
  const getButtonClasses = () => {
    const baseClasses =
      'transition-all duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2'

    const variantClasses = {
      primary: 'btn-primary focus:ring-blue-500',
      secondary: 'btn-secondary focus:ring-gray-500',
    }

    const sizeClasses = {
      sm: 'h-8 px-3 text-xs',
      md: 'btn-pill-compact-md',
      lg: 'btn-pill-lg',
      'compact-md': 'btn-pill-compact-md',
      'pill-lg': 'btn-pill-lg',
    }

    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
  }

  // Button text logic
  const getButtonText = () => {
    if (children) return children

    if (user) {
      return content[language].goToWorkspace
    }
    return content[language].getStarted
  }

  if (loading) {
    return (
      <button
        disabled
        className={`${getButtonClasses()} opacity-50 cursor-not-allowed`}
        style={style}
      >
        <span className="animate-pulse">{content[language].getStarted}</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={getButtonClasses()}
      style={style}
      type="button"
    >
      {getButtonText()}
    </button>
  )
}
