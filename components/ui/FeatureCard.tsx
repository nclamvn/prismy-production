'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { motionSafe, slideUp, notebookLMElevated } from '@/lib/motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  delay?: number
  tags?: string[]
  isSelected?: boolean
  onClick?: (event: React.MouseEvent) => void
  className?: string
  'aria-label'?: string
  'aria-describedby'?: string
  role?: string
  tabIndex?: number
}

export default function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  delay = 0,
  tags = [],
  isSelected = false,
  onClick,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  role = onClick ? 'button' : 'article',
  tabIndex = onClick ? 0 : undefined
}: FeatureCardProps) {
  return (
    <motion.div
      variants={motionSafe(slideUp)}
      transition={{ delay }}
      className={cn(
        'group relative transition-all duration-300',
        onClick && 'cursor-pointer focus-indicator card-focus touch-accessible',
        className
      )}
      style={{
        backgroundColor: 'var(--surface-elevated)',
        border: isSelected 
          ? '2px solid var(--notebooklm-primary)' 
          : '1px solid var(--surface-outline)',
        borderRadius: 'var(--mat-card-elevated-container-shape)',
        padding: '1.5rem',
        boxShadow: isSelected 
          ? 'var(--elevation-level-3)' 
          : 'var(--elevation-level-1)'
      }}
      {...(onClick && !isSelected ? motionSafe(notebookLMElevated) : {})}
      onClick={(e) => onClick?.(e)}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick(e as any)
        }
      }}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel || `${title}. ${description}`}
      aria-describedby={ariaDescribedBy}
      aria-selected={isSelected}
    >
      {/* Horizontal Layout: Icon beside Title - Vietnamese Standard */}
      <div className="flex items-center gap-3 mb-4">
        {/* Icon Container */}
        <div className="flex-shrink-0">
          <div 
            className="w-10 h-10 flex items-center justify-center transition-all duration-300"
            style={{
              backgroundColor: 'var(--notebooklm-primary-light)',
              borderRadius: 'var(--mat-card-outlined-container-shape)'
            }}
          >
            <Icon 
              className="transition-transform duration-200"
              style={{ 
                width: '24px', 
                height: '24px',
                color: 'var(--notebooklm-primary)'
              }}
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Title - NotebookLM Typography */}
        <h3 
          className="transition-colors duration-200"
          style={{
            fontSize: 'var(--sys-title-large-size)',
            lineHeight: 'var(--sys-title-large-line-height)',
            fontFamily: 'var(--sys-title-large-font)',
            fontWeight: 'var(--sys-title-large-weight)',
            color: 'var(--text-primary)'
          }}
        >
          {title}
        </h3>
      </div>

      {/* Description */}
      <p 
        className="mb-4 line-clamp-3 transition-colors duration-200"
        style={{
          fontSize: 'var(--sys-body-medium-size)',
          lineHeight: 'var(--sys-body-medium-line-height)',
          fontFamily: 'var(--sys-body-medium-font)',
          fontWeight: 'var(--sys-body-medium-weight)',
          color: 'var(--text-secondary)'
        }}
      >
        {description}
      </p>

      {/* Feature Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 3).map((tag, tagIndex) => (
            <span
              key={tag}
              className="px-2 py-1 transition-all duration-200"
              style={{
                backgroundColor: 'var(--surface-panel)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--sys-body-small-size)',
                lineHeight: 'var(--sys-body-small-line-height)',
                fontFamily: 'var(--sys-body-small-font)',
                fontWeight: 'var(--sys-body-small-weight)',
                borderRadius: 'var(--shape-corner-full)'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div 
          className="absolute top-3 right-3 w-3 h-3 rounded-full"
          style={{
            backgroundColor: 'var(--notebooklm-primary)'
          }}
        />
      )}
    </motion.div>
  )
}