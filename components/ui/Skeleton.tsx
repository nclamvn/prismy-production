'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/* ============================================================================ */
/* PRISMY SKELETON LOADING SYSTEM */
/* Ultra-smooth skeleton screens with shimmer effects */
/* ============================================================================ */

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  animation?: 'pulse' | 'wave' | 'shimmer' | 'none'
  width?: string | number
  height?: string | number
  count?: number
  duration?: number
}

// Base skeleton component with hardware acceleration
export function Skeleton({
  className,
  variant = 'text',
  animation = 'shimmer',
  width,
  height,
  count = 1,
  duration = 1.5,
}: SkeletonProps) {
  // Variant-specific classes
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    rounded: 'rounded-lg',
  }

  // Animation variants
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: '',
    shimmer: 'relative overflow-hidden',
    none: '',
  }

  // Shimmer effect overlay
  const shimmerOverlay = animation === 'shimmer' && (
    <motion.div
      className="absolute inset-0 -translate-x-full"
      style={{
        background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.4), transparent)'
      }}
      animate={{
        translateX: ['100%', '-100%'],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        willChange: 'transform',
      }}
    />
  )

  // Wave animation
  const waveAnimation = animation === 'wave' && {
    animate: {
      opacity: [0.5, 1, 0.5],
    },
    transition: {
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }

  const skeletonElements = Array.from({ length: count }).map((_, index) => (
    <motion.div
      key={index}
      className={cn(
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        backgroundColor: 'var(--surface-filled)',
        width: width || (variant === 'circular' ? height : undefined),
        height,
      }}
      {...(animation === 'wave' ? waveAnimation : {})}
    >
      {shimmerOverlay}
    </motion.div>
  ))

  return count > 1 ? (
    <div className="space-y-2">{skeletonElements}</div>
  ) : (
    skeletonElements[0]
  )
}

/* ============================================================================ */
/* SPECIALIZED SKELETON COMPONENTS */
/* ============================================================================ */

// Text skeleton with multiple lines
export function SkeletonText({
  lines = 3,
  className,
  lastLineWidth = '60%',
}: {
  lines?: number
  className?: string
  lastLineWidth?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  )
}

// Card skeleton
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn('p-6 space-y-4', className)}
      style={{
        backgroundColor: 'var(--surface-elevated)',
        borderRadius: 'var(--mat-card-elevated-container-shape)',
        border: '1px solid var(--surface-outline)'
      }}
    >
      <Skeleton variant="rectangular" height={200} className="mb-4" />
      <Skeleton variant="text" width="80%" />
      <SkeletonText lines={2} />
      <div className="flex items-center justify-between pt-4">
        <Skeleton variant="rectangular" width={100} height={32} />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
    </div>
  )
}

// Avatar skeleton
export function SkeletonAvatar({
  size = 40,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  )
}

// Table row skeleton
export function SkeletonTableRow({
  columns = 4,
  className,
}: {
  columns?: number
  className?: string
}) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <Skeleton variant="text" />
        </td>
      ))}
    </tr>
  )
}

// List item skeleton
export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center space-x-4 p-4', className)}>
      <SkeletonAvatar />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" height={14} />
      </div>
      <Skeleton variant="rectangular" width={80} height={32} />
    </div>
  )
}

// Pricing card skeleton
export function SkeletonPricingCard({ className }: { className?: string }) {
  return (
    <div
      className={cn('p-8 space-y-6', className)}
      style={{
        backgroundColor: 'var(--surface-elevated)',
        borderRadius: 'var(--mat-card-elevated-container-shape)',
        border: '1px solid var(--surface-outline)'
      }}
    >
      <div className="text-center space-y-4">
        <Skeleton variant="text" width="60%" className="mx-auto" />
        <Skeleton
          variant="rectangular"
          width={120}
          height={48}
          className="mx-auto"
        />
        <Skeleton variant="text" width="80%" className="mx-auto" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width="70%" />
          </div>
        ))}
      </div>
      <Skeleton variant="rectangular" height={48} className="rounded-full" />
    </div>
  )
}

// Dashboard stat skeleton
export function SkeletonStat({ className }: { className?: string }) {
  return (
    <div 
      className={cn('space-y-2 p-4', className)}
      style={{
        backgroundColor: 'var(--surface-elevated)',
        borderRadius: 'var(--mat-card-outlined-container-shape)',
        border: '1px solid var(--surface-outline)'
      }}
    >
      <Skeleton variant="text" width="50%" height={14} />
      <Skeleton variant="rectangular" width="80%" height={32} />
      <Skeleton variant="text" width="60%" height={12} />
    </div>
  )
}

// Translation interface skeleton
export function SkeletonTranslation({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-8', className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="rectangular" width={120} height={40} />
          <Skeleton variant="circular" width={40} height={40} />
        </div>
        <Skeleton
          variant="rectangular"
          height={200}
          className="rounded-2xl"
        />
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="rectangular" width={120} height={40} />
          <Skeleton variant="circular" width={40} height={40} />
        </div>
        <Skeleton
          variant="rectangular"
          height={200}
          className="rounded-2xl"
        />
      </div>
    </div>
  )
}

// Blog post skeleton
export function SkeletonBlogPost({ className }: { className?: string }) {
  return (
    <article className={cn('space-y-6', className)}>
      <Skeleton variant="rectangular" height={400} className="rounded-3xl" />
      <div className="space-y-4">
        <Skeleton variant="text" width="90%" height={32} />
        <div className="flex items-center space-x-4">
          <SkeletonAvatar size={48} />
          <div className="space-y-1">
            <Skeleton variant="text" width={120} />
            <Skeleton variant="text" width={80} height={14} />
          </div>
        </div>
      </div>
      <SkeletonText lines={5} />
    </article>
  )
}

// Workspace sidebar skeleton
export function SkeletonSidebar({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center space-x-3 px-4">
        <Skeleton variant="rectangular" width={32} height={32} />
        <Skeleton variant="text" width="60%" />
      </div>
      <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3 px-4 py-2">
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width="70%" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================================================================ */
/* SKELETON PROVIDER FOR PAGE TRANSITIONS */
/* ============================================================================ */

export function SkeletonProvider({
  loading,
  skeleton,
  children,
  className,
  delay = 0,
}: {
  loading: boolean
  skeleton: React.ReactNode
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const [showSkeleton, setShowSkeleton] = useState(loading)

  useEffect(() => {
    if (loading) {
      if (delay > 0) {
        const timer = setTimeout(() => setShowSkeleton(true), delay)
        return () => clearTimeout(timer)
      } else {
        setShowSkeleton(true)
      }
    } else {
      setShowSkeleton(false)
    }
  }, [loading, delay])

  return (
    <div className={className}>
      {showSkeleton ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </div>
  )
}