'use client'

import React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { notebookLMButton, motionSafe } from '@/lib/motion'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  'aria-label'?: string
  'aria-describedby'?: string
  loading?: boolean
  loadingText?: string
}

export function Button({
  className,
  variant = 'filled',
  size = 'md',
  children,
  disabled,
  loading = false,
  loadingText = 'Loading...',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}: ButtonProps) {
  const motionProps = (disabled || loading) ? {} : motionSafe(notebookLMButton)
  const isInteractionDisabled = disabled || loading
  // Material Design 3 Button Styles using NotebookLM tokens
  const getButtonStyles = () => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--sys-label-large-font)',
      fontSize: 'var(--sys-label-large-size)',
      lineHeight: 'var(--sys-label-large-line-height)',
      fontWeight: 'var(--sys-label-large-weight)',
      borderRadius: 'var(--mat-button-filled-container-shape)',
      transition: 'all 0.2s ease',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      border: 'none',
      outline: 'none',
    }

    const sizeStyles = {
      sm: {
        height: '36px',
        paddingLeft: '16px',
        paddingRight: '16px',
        fontSize: 'var(--sys-label-medium-size)',
        lineHeight: 'var(--sys-label-medium-line-height)',
      },
      md: {
        height: 'var(--mat-button-filled-container-height)',
        paddingLeft: 'var(--mat-button-filled-horizontal-padding)',
        paddingRight: 'var(--mat-button-filled-horizontal-padding)',
      },
      lg: {
        height: '48px',
        paddingLeft: '32px',
        paddingRight: '32px',
      }
    }

    const variantStyles = {
      filled: {
        backgroundColor: 'var(--notebooklm-primary)',
        color: 'var(--mat-button-filled-label-text-color)',
      },
      outlined: {
        backgroundColor: 'transparent',
        color: 'var(--notebooklm-primary)',
        border: '1px solid var(--surface-outline)',
      },
      text: {
        backgroundColor: 'transparent',
        color: 'var(--notebooklm-primary)',
        paddingLeft: 'var(--mat-button-text-horizontal-padding)',
        paddingRight: 'var(--mat-button-text-horizontal-padding)',
      },
      elevated: {
        backgroundColor: 'var(--surface-elevated)',
        color: 'var(--notebooklm-primary)',
        boxShadow: 'var(--elevation-level-1)',
      }
    }

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
    }
  }

  const getHoverStyles = () => {
    if (disabled) return {}

    const hoverStyles = {
      filled: {
        backgroundColor: 'var(--notebooklm-primary-dark)',
        boxShadow: 'var(--elevation-level-1)',
      },
      outlined: {
        backgroundColor: 'rgba(11, 40, 255, 0.04)',
        borderColor: 'var(--notebooklm-primary)',
      },
      text: {
        backgroundColor: 'rgba(11, 40, 255, 0.04)',
      },
      elevated: {
        boxShadow: 'var(--elevation-level-2)',
        backgroundColor: 'var(--surface-panel)',
      }
    }

    return hoverStyles[variant] || {}
  }

  return (
    <motion.button
      className={cn(
        'relative overflow-hidden focus-indicator btn-focus touch-accessible ripple-effect',
        isInteractionDisabled && 'cursor-not-allowed',
        className
      )}
      style={{
        ...getButtonStyles(),
        position: 'relative',
        overflow: 'hidden'
      }}
      disabled={isInteractionDisabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          const button = e.currentTarget
          const rect = button.getBoundingClientRect()
          const size = Math.max(rect.width, rect.height)
          const x = e.clientX - rect.left - size / 2
          const y = e.clientY - rect.top - size / 2
          
          const ripple = document.createElement('span')
          ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            animation: ripple 0.6s linear;
            pointer-events: none;
            z-index: 1;
          `
          
          button.appendChild(ripple)
          setTimeout(() => ripple.remove(), 600)
        }
      }}
      {...motionProps}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
          <span className="sr-only">{loadingText}</span>
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'} style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </span>
      
      <style jsx>{`
        @keyframes ripple {
          from {
            transform: scale(0);
            opacity: 0.6;
          }
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </motion.button>
  )
}