import { Variants } from 'framer-motion'

/* ============================================================================ */
/* ZEN-LEVEL MOTION SYSTEM - Hardware-Accelerated Animations */
/* Revolutionary 60fps Minimalist Micro-Interactions */
/* ============================================================================ */

// Core easing - Zen breathing curve optimized for 60fps
export const zenEasing = [0.25, 0.46, 0.45, 0.94] as const
export const hardwareEasing = [0.4, 0, 0.2, 1] as const // Optimized for GPU

// Duration constants - 60fps frame-perfect timing
export const DURATION = {
  instant: 0.1,
  whisper: 0.2,
  breath: 0.3,
  meditation: 0.8,
  // Hardware-optimized durations
  frame: 0.016, // Single frame at 60fps
  twoFrame: 0.033, // Two frames at 60fps
  smooth: 0.25, // 15 frames - optimal for smooth perception
} as const

// Hardware acceleration hints
export const GPU_OPTIMIZED = {
  // Force hardware acceleration
  willChange: 'transform, opacity',
  // Use transform3d to trigger GPU layer
  force3d: true,
  // Optimize for compositing
  isolation: 'isolate',
} as const

/* ============================================================================ */
/* BREATH-LEVEL VARIANTS - Invisible Presence */
/* ============================================================================ */

// Hardware-accelerated zen fade - GPU optimized
export const zenFade: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.98,
    ...GPU_OPTIMIZED,
  },
  visible: {
    opacity: 1,
    scale: 1,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.smooth,
      ease: hardwareEasing,
      type: 'tween',
    },
  },
}

// Hardware-accelerated whisper movement - GPU transform3d
export const whisperUp: Variants = {
  hidden: {
    opacity: 0,
    y: 4,
    scale: 0.99,
    ...GPU_OPTIMIZED,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.smooth,
      ease: hardwareEasing,
      type: 'tween',
    },
  },
}

// Hardware-accelerated micro float - 60fps smooth
export const microFloat: Variants = {
  hidden: {
    opacity: 0,
    y: 2,
    ...GPU_OPTIMIZED,
  },
  visible: {
    opacity: 1,
    y: 0,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.whisper,
      ease: hardwareEasing,
      type: 'tween',
    },
  },
}

// Hardware-accelerated zen breathing - Staggered GPU optimization
export const zenBreathe: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.98,
    ...GPU_OPTIMIZED,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.meditation,
      ease: hardwareEasing,
      type: 'tween',
      staggerChildren: 0.05, // Faster stagger for 60fps
      delayChildren: 0.05,
    },
  },
}

// Invisible presence - Appears without movement
export const invisiblePresence: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATION.breath,
      ease: zenEasing,
    },
  },
}

/* ============================================================================ */
/* INTERACTION VARIANTS - Touch-Level Response */
/* ============================================================================ */

// Hardware-accelerated whisper hover - Instant GPU response
export const whisperHover = {
  whileHover: {
    y: -1,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.frame,
      ease: hardwareEasing,
      type: 'tween',
    },
  },
  whileTap: {
    scale: 0.99,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.frame,
      ease: hardwareEasing,
      type: 'tween',
    },
  },
}

// Hardware-accelerated breath hover - Smooth 60fps scaling
export const breathHover = {
  whileHover: {
    y: -2,
    scale: 1.01,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.twoFrame,
      ease: hardwareEasing,
      type: 'tween',
    },
  },
  whileTap: {
    scale: 0.98,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.frame,
      ease: hardwareEasing,
      type: 'tween',
    },
  },
}

// Hardware-accelerated zen scale - Micro GPU transforms
export const zenScale = {
  whileHover: {
    scale: 1.005,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.twoFrame,
      ease: hardwareEasing,
      type: 'tween',
    },
  },
  whileTap: {
    scale: 0.995,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.frame,
      ease: hardwareEasing,
      type: 'tween',
    },
  },
}

/* ============================================================================ */
/* VIETNAMESE CULTURAL RHYTHMS */
/* ============================================================================ */

// Morning energy - Quick, alert movements
export const morningRhythm: Variants = {
  hidden: {
    opacity: 0,
    y: 2,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.instant,
      ease: zenEasing,
    },
  },
}

// Evening calm - Slower, meditative
export const eveningRhythm: Variants = {
  hidden: {
    opacity: 0,
    y: 6,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.meditation,
      ease: zenEasing,
    },
  },
}

// Vietnamese breathing pattern - Cultural rhythm
export const vietnameseBreathe: Variants = {
  hidden: {
    opacity: 0,
    y: 4,
    scale: 0.99,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: DURATION.breath,
      ease: zenEasing,
      staggerChildren: 0.15, // Slightly slower stagger for mindfulness
      delayChildren: 0.05,
    },
  },
}

/* ============================================================================ */
/* ACCESSIBILITY & PREFERENCES */
/* ============================================================================ */

// Enhanced motion preference detection
export const getMotionPreference = () => {
  if (typeof window === 'undefined') return true
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Hardware capability detection
export const getHardwareCapability = () => {
  if (typeof window === 'undefined') return {
    hasWebGL: false,
    hasWillChange: false,
    hasTransform3d: false,
    devicePixelRatio: 1,
  }

  // Check for hardware acceleration support
  const canvas = document.createElement('canvas')
  const gl =
    canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

  return {
    hasWebGL: !!gl,
    hasWillChange: 'willChange' in document.documentElement.style,
    hasTransform3d: 'transform' in document.documentElement.style,
    devicePixelRatio: window.devicePixelRatio || 1,
  }
}

// Motion-safe wrapper with hardware optimization
export const motionSafe = (variants: any): any => {
  if (!getMotionPreference()) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, ...GPU_OPTIMIZED },
      transition: { duration: 0.01, type: 'tween' },
    }
  }

  // Apply hardware optimizations if supported
  const hardware = getHardwareCapability()
  if (hardware.hasWebGL && hardware.hasWillChange) {
    return {
      ...variants,
      ...GPU_OPTIMIZED,
    }
  }

  return variants
}

// 60fps animation wrapper
export const smooth60fps = (variants: any): any => {
  return {
    ...variants,
    ...GPU_OPTIMIZED,
    transition: {
      ...variants.transition,
      type: 'tween',
      ease: hardwareEasing,
    },
  }
}

// Performance-critical animation wrapper
export const performanceCritical = (variants: any): any => {
  const hardware = getHardwareCapability()

  if (hardware.devicePixelRatio > 2) {
    // High DPI screens - reduce animation complexity
    return {
      ...variants,
      transition: {
        ...variants.transition,
        duration: (variants.transition?.duration || DURATION.smooth) * 0.75,
      },
    }
  }

  return smooth60fps(variants)
}

// Cultural time adaptation
export const getCulturalRhythm = () => {
  if (typeof window === 'undefined') return 'neutral'

  const hour = new Date().getHours()

  // Vietnamese cultural time patterns
  if (hour >= 6 && hour < 11) return 'morning' // Active energy
  if (hour >= 11 && hour < 14) return 'midday' // Focused work
  if (hour >= 14 && hour < 18) return 'afternoon' // Collaborative
  if (hour >= 18 && hour < 22) return 'evening' // Contemplative

  return 'night' // Rest
}

// Adaptive motion with hardware optimization
export const getAdaptiveMotion = (baseVariants: Variants): Variants => {
  const rhythm = getCulturalRhythm()
  const hardware = getHardwareCapability()

  // Base hardware optimization - merge GPU settings into each variant
  const optimizedVariants = {
    ...baseVariants,
    hidden: {
      ...baseVariants.hidden,
      ...GPU_OPTIMIZED,
    },
    visible: {
      ...baseVariants.visible,
      ...GPU_OPTIMIZED,
    },
  }

  switch (rhythm) {
    case 'morning':
      return smooth60fps({
        ...optimizedVariants,
        visible: {
          ...optimizedVariants.visible,
          transition: {
            ...(optimizedVariants.visible as any)?.transition,
            duration: DURATION.frame,
            ease: hardwareEasing,
            type: 'tween',
          },
        },
      })
    case 'evening':
      return smooth60fps({
        ...optimizedVariants,
        visible: {
          ...optimizedVariants.visible,
          transition: {
            ...(optimizedVariants.visible as any)?.transition,
            duration:
              DURATION.meditation * (hardware.devicePixelRatio > 1 ? 0.75 : 1),
            ease: hardwareEasing,
            type: 'tween',
          },
        },
      })
    default:
      return performanceCritical(optimizedVariants)
  }
}

/* ============================================================================ */
/* LEGACY COMPATIBILITY - Smooth Transition */
/* ============================================================================ */

// Performance-optimized legacy mappings
export const fadeIn = smooth60fps(zenFade)
export const slideUp = smooth60fps(whisperUp)
export const slideDown = smooth60fps(microFloat)
export const scaleIn = smooth60fps(zenFade)
export const staggerContainer = smooth60fps(zenBreathe)
export const listItem = smooth60fps(whisperUp)
export const hoverScale = zenScale  // Remove performanceCritical to avoid SSR issues
export const hoverLift = whisperHover  // Remove performanceCritical to avoid SSR issues

// New hardware-accelerated variants
export const ultraSmooth = {
  ...zenFade,
  transition: {
    duration: DURATION.frame,
    ease: hardwareEasing,
    type: 'tween',
  },
  ...GPU_OPTIMIZED,
}

export const instantResponse = {
  whileHover: {
    scale: 1.02,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.frame,
      ease: hardwareEasing,
      type: 'tween',
    },
  },
  whileTap: {
    scale: 0.98,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.frame,
      ease: hardwareEasing,
      type: 'tween',
    },
  },
}
