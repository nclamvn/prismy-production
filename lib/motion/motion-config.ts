/**
 * UI/UX Polish Sprint - Phase 1.3: Framer Motion Configuration
 * 
 * Enterprise-grade motion system with ≤150ms transitions and reduced motion support
 * Provides consistent animations across the workspace with accessibility compliance
 */

import { Variants, Transition } from 'framer-motion'

// Motion duration constants (≤150ms as specified)
export const MOTION_DURATION = {
  instant: 0,
  fast: 0.1,      // 100ms
  normal: 0.15,   // 150ms
  slow: 0.2       // 200ms - only for complex transitions
} as const

// Motion easing curves
export const MOTION_EASING = {
  linear: [0, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  spring: { type: 'spring', stiffness: 400, damping: 35 }, // Increased damping to reduce overshoot
  springMobile: { type: 'spring', stiffness: 300, damping: 40 } // Even more damping for mobile
} as const

// Mobile detection
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

// Reduced motion detection
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches || isMobileDevice()
}

// Base transition configuration
export const createTransition = (
  duration: keyof typeof MOTION_DURATION = 'normal',
  easing: keyof typeof MOTION_EASING = 'easeOut'
): Transition => {
  if (shouldReduceMotion()) {
    return { duration: 0 }
  }

  return {
    duration: MOTION_DURATION[duration],
    ease: MOTION_EASING[easing]
  }
}

// Common animation variants
export const fadeVariants: Variants = {
  hidden: { 
    opacity: 0,
    transition: createTransition('fast')
  },
  visible: { 
    opacity: 1,
    transition: createTransition('fast')
  },
  exit: { 
    opacity: 0,
    transition: createTransition('fast')
  }
}

export const slideVariants: Variants = {
  hidden: { 
    x: -20,
    opacity: 0,
    transition: createTransition('normal')
  },
  visible: { 
    x: 0,
    opacity: 1,
    transition: createTransition('normal')
  },
  exit: { 
    x: 20,
    opacity: 0,
    transition: createTransition('fast')
  }
}

export const scaleVariants: Variants = {
  hidden: { 
    scale: 0.95,
    opacity: 0,
    transition: createTransition('fast')
  },
  visible: { 
    scale: 1,
    opacity: 1,
    transition: createTransition('normal')
  },
  exit: { 
    scale: 0.95,
    opacity: 0,
    transition: createTransition('fast')
  }
}

// Panel-specific animations
export const panelVariants: Variants = {
  hidden: { 
    x: '100%',
    transition: createTransition('normal')
  },
  visible: { 
    x: 0,
    transition: createTransition('normal')
  },
  exit: { 
    x: '100%',
    transition: createTransition('normal')
  }
}

export const drawerVariants: Variants = {
  hidden: { 
    y: '100%',
    transition: createTransition('normal')
  },
  visible: { 
    y: 0,
    transition: createTransition('normal')
  },
  exit: { 
    y: '100%',
    transition: createTransition('normal')
  }
}

// Modal and overlay animations
export const modalVariants: Variants = {
  hidden: { 
    scale: 0.9,
    opacity: 0,
    transition: createTransition('fast')
  },
  visible: { 
    scale: 1,
    opacity: 1,
    transition: createTransition('normal')
  },
  exit: { 
    scale: 0.9,
    opacity: 0,
    transition: createTransition('fast')
  }
}

export const overlayVariants: Variants = {
  hidden: { 
    opacity: 0,
    transition: createTransition('fast')
  },
  visible: { 
    opacity: 1,
    transition: createTransition('fast')
  },
  exit: { 
    opacity: 0,
    transition: createTransition('fast')
  }
}

// List and stagger animations
export const listVariants: Variants = {
  hidden: { 
    transition: { staggerChildren: 0.02, staggerDirection: -1 }
  },
  visible: { 
    transition: { staggerChildren: 0.02, delayChildren: 0.1 }
  },
  exit: { 
    transition: { staggerChildren: 0.02, staggerDirection: -1 }
  }
}

export const listItemVariants: Variants = {
  hidden: { 
    y: 10,
    opacity: 0,
    transition: createTransition('fast')
  },
  visible: { 
    y: 0,
    opacity: 1,
    transition: createTransition('fast')
  },
  exit: { 
    y: -10,
    opacity: 0,
    transition: createTransition('fast')
  }
}

// Job progress animations
export const progressVariants: Variants = {
  hidden: { 
    scaleX: 0,
    originX: 0,
    transition: createTransition('fast')
  },
  visible: { 
    scaleX: 1,
    transition: createTransition('normal', 'easeOut')
  }
}

// Workspace-specific animations
export const workspaceVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: 20,
    transition: createTransition('normal')
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: createTransition('normal')
  }
}

// Button hover and tap animations
export const buttonVariants: Variants = {
  idle: { 
    scale: 1,
    transition: createTransition('fast')
  },
  hover: { 
    scale: shouldReduceMotion() ? 1 : 1.02,
    transition: createTransition('fast')
  },
  tap: { 
    scale: shouldReduceMotion() ? 1 : 0.98,
    transition: createTransition('fast')
  }
}

// Card hover animations
export const cardVariants: Variants = {
  idle: { 
    y: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: createTransition('fast')
  },
  hover: { 
    y: shouldReduceMotion() ? 0 : -2,
    boxShadow: shouldReduceMotion() 
      ? '0 1px 3px rgba(0,0,0,0.1)' 
      : '0 4px 12px rgba(0,0,0,0.15)',
    transition: createTransition('fast')
  }
}

// Notification/toast animations
export const toastVariants: Variants = {
  hidden: { 
    x: '100%',
    opacity: 0,
    transition: createTransition('fast')
  },
  visible: { 
    x: 0,
    opacity: 1,
    transition: createTransition('normal')
  },
  exit: { 
    x: '100%',
    opacity: 0,
    transition: createTransition('fast')
  }
}

// Preset motion configurations for common UI patterns
export const MOTION_PRESETS = {
  // Subtle interactions
  subtle: {
    hover: { scale: 1.01 },
    tap: { scale: 0.99 },
    transition: createTransition('fast')
  },
  
  // Standard interactions
  standard: {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
    transition: createTransition('fast')
  },
  
  // Prominent interactions
  prominent: {
    hover: { scale: 1.05, y: -1 },
    tap: { scale: 0.95 },
    transition: createTransition('normal')
  },
  
  // Panel entrance
  panelEnter: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 300, opacity: 0 },
    transition: createTransition('normal')
  },
  
  // Modal entrance
  modalEnter: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: createTransition('normal')
  }
} as const

// Layout animation configuration
export const layoutTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  duration: shouldReduceMotion() ? 0 : 0.15
}

// Shared layout animations for workspace panels
export const workspaceLayoutId = {
  jobSidebar: 'job-sidebar',
  sideNav: 'side-nav',
  mainContent: 'main-content',
  agentPane: 'agent-pane'
} as const

export type MotionPreset = keyof typeof MOTION_PRESETS
export type MotionVariant = 'hidden' | 'visible' | 'exit' | 'hover' | 'tap' | 'idle'