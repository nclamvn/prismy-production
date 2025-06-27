import { Variants } from 'framer-motion'

/* ============================================================================ */
/* ZEN-LEVEL MOTION SYSTEM - Hardware-Accelerated Animations */
/* Revolutionary 60fps Minimalist Micro-Interactions */
/* ============================================================================ */

// Core easing - Zen breathing curve optimized for 60fps
export const zenEasing = [0.25, 0.46, 0.45, 0.94] as const
export const hardwareEasing = [0.4, 0, 0.2, 1] as const // Optimized for GPU

// NotebookLM-specific easing curves
export const notebookLMEasing = [0.2, 0, 0, 1] as const // NotebookLM standard curve
export const notebookLMEmphasized = [0.05, 0.7, 0.1, 1] as const // For emphasized motions
export const notebookLMDecelerate = [0, 0, 0.2, 1] as const // For entering elements

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
  // NotebookLM Material Design 3 durations
  short1: 0.05, // 50ms - Very quick actions
  short2: 0.1, // 100ms - Quick actions
  short3: 0.15, // 150ms - Quick actions
  short4: 0.2, // 200ms - Quick actions
  medium1: 0.25, // 250ms - Standard actions
  medium2: 0.3, // 300ms - Standard actions
  medium3: 0.35, // 350ms - Standard actions
  medium4: 0.4, // 400ms - Standard actions
  long1: 0.45, // 450ms - Complex actions
  long2: 0.5, // 500ms - Complex actions
  long3: 0.55, // 550ms - Complex actions
  long4: 0.6, // 600ms - Complex actions
  extraLong1: 0.7, // 700ms - Page transitions
  extraLong2: 0.8, // 800ms - Page transitions
  extraLong3: 0.9, // 900ms - Page transitions
  extraLong4: 1.0, // 1000ms - Page transitions
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

// Hardware capability detection - optimized to prevent WebGL context leaks
export const getHardwareCapability = () => {
  if (typeof window === 'undefined')
    return {
      hasWebGL: false,
      hasWillChange: false,
      hasTransform3d: false,
      devicePixelRatio: 1,
    }

  // Cached result to prevent multiple WebGL context creation
  if (window.__hardware_capability_cache) {
    return window.__hardware_capability_cache
  }

  // Check for hardware acceleration support without creating WebGL context
  // to prevent "Too many active WebGL contexts" warning
  const hasWebGL = 'WebGLRenderingContext' in window

  const result = {
    hasWebGL,
    hasWillChange: 'willChange' in document.documentElement.style,
    hasTransform3d: 'transform' in document.documentElement.style,
    devicePixelRatio: window.devicePixelRatio || 1,
  }

  // Cache the result to prevent re-detection
  ;(window as any).__hardware_capability_cache = result

  return result
}

// Motion-safe wrapper with hardware optimization - SSR safe
export const motionSafe = (variants: any): any => {
  // Skip hardware detection during SSR
  if (typeof window === 'undefined') {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.01, type: 'tween' },
    }
  }

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

// Performance-optimized legacy mappings - SSR safe
export const fadeIn = zenFade
export const slideUp = whisperUp
export const slideDown = microFloat
export const scaleIn = zenFade
export const staggerContainer = zenBreathe
export const listItem = whisperUp
export const hoverScale = zenScale
export const hoverLift = whisperHover

// NotebookLM optimized mappings
export const notebookLMFade = notebookLMCard
export const notebookLMSlide = notebookLMListItem
export const notebookLMHover = notebookLMElevated
export const notebookLMContainer = notebookLMStagger

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

/* ============================================================================ */
/* NOTEBOOKLM MATERIAL DESIGN 3 VARIANTS */
/* ============================================================================ */

// NotebookLM card entrance with stagger
export const notebookLMCard: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.96,
    ...GPU_OPTIMIZED,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.medium2,
      ease: notebookLMDecelerate,
      type: 'tween',
    },
  },
}

// NotebookLM stagger container with proper timing
export const notebookLMStagger: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
      duration: DURATION.short2,
      ease: notebookLMEasing,
    },
  },
}

// NotebookLM button interactions
export const notebookLMButton = {
  whileHover: {
    y: -1,
    scale: 1.02,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.short1,
      ease: notebookLMEasing,
      type: 'tween',
    },
  },
  whileTap: {
    scale: 0.98,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.short1,
      ease: notebookLMEmphasized,
      type: 'tween',
    },
  },
}

// NotebookLM elevated card hover
export const notebookLMElevated = {
  whileHover: {
    y: -2,
    scale: 1.01,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.short3,
      ease: notebookLMEasing,
      type: 'tween',
    },
  },
  whileTap: {
    scale: 0.995,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.short1,
      ease: notebookLMEmphasized,
      type: 'tween',
    },
  },
}

// NotebookLM page transition
export const notebookLMPageTransition: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    ...GPU_OPTIMIZED,
  },
  visible: {
    opacity: 1,
    y: 0,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.medium4,
      ease: notebookLMDecelerate,
      type: 'tween',
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.short4,
      ease: notebookLMEasing,
      type: 'tween',
    },
  },
}

// NotebookLM modal/dialog entrance
export const notebookLMModal: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    ...GPU_OPTIMIZED,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.medium3,
      ease: notebookLMEmphasized,
      type: 'tween',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.short4,
      ease: notebookLMEasing,
      type: 'tween',
    },
  },
}

// NotebookLM list item entrance
export const notebookLMListItem: Variants = {
  hidden: {
    opacity: 0,
    x: -8,
    ...GPU_OPTIMIZED,
  },
  visible: {
    opacity: 1,
    x: 0,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.short4,
      ease: notebookLMDecelerate,
      type: 'tween',
    },
  },
}

// NotebookLM form field focus
export const notebookLMFormField = {
  focus: {
    scale: 1.01,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.short2,
      ease: notebookLMEasing,
      type: 'tween',
    },
  },
  blur: {
    scale: 1,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.short3,
      ease: notebookLMDecelerate,
      type: 'tween',
    },
  },
}

// NotebookLM navigation drawer
export const notebookLMDrawer: Variants = {
  hidden: {
    x: '-100%',
    ...GPU_OPTIMIZED,
  },
  visible: {
    x: 0,
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.medium4,
      ease: notebookLMEmphasized,
      type: 'tween',
    },
  },
  exit: {
    x: '-100%',
    ...GPU_OPTIMIZED,
    transition: {
      duration: DURATION.medium2,
      ease: notebookLMEasing,
      type: 'tween',
    },
  },
}
