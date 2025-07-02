/**
 * UI/UX Polish Sprint - Phase 1.3: Reusable Motion Components
 * 
 * Pre-built motion components for consistent animations across the workspace
 * All animations respect reduced motion preferences
 */

'use client'

import React from 'react'
import { motion, AnimatePresence, HTMLMotionProps, Variants } from 'framer-motion'
import { 
  fadeVariants,
  slideVariants,
  scaleVariants,
  panelVariants,
  modalVariants,
  overlayVariants,
  listVariants,
  listItemVariants,
  buttonVariants,
  cardVariants,
  toastVariants,
  layoutTransition,
  type MotionPreset,
  MOTION_PRESETS
} from '@/lib/motion/motion-config'

// Base motion wrapper component
interface MotionWrapperProps extends HTMLMotionProps<'div'> {
  variant?: 'fade' | 'slide' | 'scale' | 'panel' | 'modal'
  children: React.ReactNode
  className?: string
}

export function MotionWrapper({ 
  variant = 'fade', 
  children, 
  className = '',
  ...props 
}: MotionWrapperProps) {
  const variantMap = {
    fade: fadeVariants,
    slide: slideVariants,
    scale: scaleVariants,
    panel: panelVariants,
    modal: modalVariants
  }

  return (
    <motion.div
      variants={variantMap[variant]}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Animated panel component
interface AnimatedPanelProps {
  isOpen: boolean
  children: React.ReactNode
  className?: string
  side?: 'left' | 'right' | 'top' | 'bottom'
}

export function AnimatedPanel({ 
  isOpen, 
  children, 
  className = '',
  side = 'right'
}: AnimatedPanelProps) {
  const variants: Variants = {
    hidden: {
      x: side === 'left' ? '-100%' : side === 'right' ? '100%' : 0,
      y: side === 'top' ? '-100%' : side === 'bottom' ? '100%' : 0,
      opacity: 0
    },
    visible: {
      x: 0,
      y: 0,
      opacity: 1
    }
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          layout
          layoutId={`panel-${side}`}
          transition={layoutTransition}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Interactive button with motion
interface MotionButtonProps extends HTMLMotionProps<'button'> {
  preset?: MotionPreset
  children: React.ReactNode
  className?: string
}

export function MotionButton({ 
  preset = 'standard', 
  children, 
  className = '',
  ...props 
}: MotionButtonProps) {
  const presetConfig = MOTION_PRESETS[preset]

  return (
    <motion.button
      whileHover={presetConfig.hover}
      whileTap={presetConfig.tap}
      transition={presetConfig.transition}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Interactive card with hover effects
interface MotionCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
  enableHover?: boolean
}

export function MotionCard({ 
  children, 
  className = '',
  enableHover = true,
  ...props 
}: MotionCardProps) {
  return (
    <motion.div
      variants={enableHover ? cardVariants : undefined}
      initial="idle"
      whileHover={enableHover ? "hover" : undefined}
      layout
      transition={layoutTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Animated list container
interface AnimatedListProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export function AnimatedList({ 
  children, 
  className = '',
  staggerDelay = 0.02
}: AnimatedListProps) {
  const customListVariants: Variants = {
    hidden: { 
      transition: { staggerChildren: staggerDelay, staggerDirection: -1 }
    },
    visible: { 
      transition: { staggerChildren: staggerDelay, delayChildren: 0.1 }
    }
  }

  return (
    <motion.div
      variants={customListVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Animated list item
interface AnimatedListItemProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
}

export function AnimatedListItem({ 
  children, 
  className = '',
  ...props 
}: AnimatedListItemProps) {
  return (
    <motion.div
      variants={listItemVariants}
      layout
      transition={layoutTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Modal with backdrop
interface AnimatedModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function AnimatedModal({ 
  isOpen, 
  onClose, 
  children, 
  className = ''
}: AnimatedModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Modal content */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
          >
            <div onClick={(e) => e.stopPropagation()}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Toast notification
interface AnimatedToastProps {
  isVisible: boolean
  children: React.ReactNode
  className?: string
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function AnimatedToast({ 
  isVisible, 
  children, 
  className = '',
  position = 'top-right'
}: AnimatedToastProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={toastVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`fixed z-50 ${positionClasses[position]} ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Progress bar with animation
interface AnimatedProgressProps {
  progress: number
  className?: string
  showValue?: boolean
}

export function AnimatedProgress({ 
  progress, 
  className = '',
  showValue = false
}: AnimatedProgressProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="w-full bg-workspace-border rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-status-processing rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          transition={layoutTransition}
          style={{ originX: 0 }}
        />
      </div>
      {showValue && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute right-0 top-0 text-xs text-text-secondary"
        >
          {Math.round(progress)}%
        </motion.span>
      )}
    </div>
  )
}

// Workspace panel with smooth transitions
interface WorkspacePanelProps {
  isVisible: boolean
  children: React.ReactNode
  className?: string
  layoutId?: string
}

export function WorkspacePanel({ 
  isVisible, 
  children, 
  className = '',
  layoutId
}: WorkspacePanelProps) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout
          layoutId={layoutId}
          transition={layoutTransition}
          className={`workspace-panel ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Page transition wrapper
interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Stagger container for complex layouts
interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function StaggerContainer({ 
  children, 
  className = '',
  delay = 0.1
}: StaggerContainerProps) {
  const staggerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.02,
        delayChildren: delay
      }
    }
  }

  return (
    <motion.div
      variants={staggerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Export all components
export {
  motion,
  AnimatePresence,
  type Variants,
  type HTMLMotionProps
}