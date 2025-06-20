import { Variants } from 'framer-motion'

/* ============================================================================ */
/* ZEN-LEVEL MOTION SYSTEM - Breath-Level Animations */
/* Revolutionary Minimalist Micro-Interactions */
/* ============================================================================ */

// Core easing - Zen breathing curve
export const zenEasing = [0.25, 0.46, 0.45, 0.94] as const

// Duration constants - Imperceptible timing
export const DURATION = {
  instant: 0.1,
  whisper: 0.2,
  breath: 0.3,
  meditation: 0.8
} as const

/* ============================================================================ */
/* BREATH-LEVEL VARIANTS - Invisible Presence */
/* ============================================================================ */

// Zen fade - So subtle it's felt, not seen
export const zenFade: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { 
      duration: DURATION.breath,
      ease: zenEasing
    }
  }
}

// Whisper movement - 1-2px movements only
export const whisperUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 4,
    scale: 0.99
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: DURATION.whisper,
      ease: zenEasing
    }
  }
}

// Micro float - Barely perceptible lift
export const microFloat: Variants = {
  hidden: { 
    opacity: 0, 
    y: 2
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: DURATION.whisper,
      ease: zenEasing
    }
  }
}

// Zen breathing - Rhythmic consciousness
export const zenBreathe: Variants = {
  hidden: { 
    opacity: 0,
    y: 8,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: DURATION.meditation,
      ease: zenEasing,
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

// Invisible presence - Appears without movement
export const invisiblePresence: Variants = {
  hidden: { 
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: { 
      duration: DURATION.breath,
      ease: zenEasing
    }
  }
}

/* ============================================================================ */
/* INTERACTION VARIANTS - Touch-Level Response */
/* ============================================================================ */

// Whisper hover - 1px movement maximum
export const whisperHover = {
  whileHover: { 
    y: -1,
    transition: { 
      duration: DURATION.whisper,
      ease: zenEasing
    }
  },
  whileTap: { 
    scale: 0.99,
    transition: { 
      duration: DURATION.instant,
      ease: zenEasing
    }
  }
}

// Breath hover - Subtle presence change
export const breathHover = {
  whileHover: { 
    y: -2,
    scale: 1.01,
    transition: { 
      duration: DURATION.breath,
      ease: zenEasing
    }
  },
  whileTap: { 
    scale: 0.98,
    transition: { 
      duration: DURATION.instant,
      ease: zenEasing
    }
  }
}

// Zen scale - Imperceptible growth
export const zenScale = {
  whileHover: { 
    scale: 1.005,
    transition: { 
      duration: DURATION.breath,
      ease: zenEasing
    }
  },
  whileTap: { 
    scale: 0.995,
    transition: { 
      duration: DURATION.instant,
      ease: zenEasing
    }
  }
}

/* ============================================================================ */
/* VIETNAMESE CULTURAL RHYTHMS */
/* ============================================================================ */

// Morning energy - Quick, alert movements
export const morningRhythm: Variants = {
  hidden: { 
    opacity: 0, 
    y: 2
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: DURATION.instant,
      ease: zenEasing
    }
  }
}

// Evening calm - Slower, meditative
export const eveningRhythm: Variants = {
  hidden: { 
    opacity: 0, 
    y: 6
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: DURATION.meditation,
      ease: zenEasing
    }
  }
}

// Vietnamese breathing pattern - Cultural rhythm
export const vietnameseBreathe: Variants = {
  hidden: { 
    opacity: 0,
    y: 4,
    scale: 0.99
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: DURATION.breath,
      ease: zenEasing,
      staggerChildren: 0.15, // Slightly slower stagger for mindfulness
      delayChildren: 0.05
    }
  }
}

/* ============================================================================ */
/* ACCESSIBILITY & PREFERENCES */
/* ============================================================================ */

// Reduced motion check
export const getMotionPreference = () => {
  if (typeof window === 'undefined') return true
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Motion-safe wrapper - Zen fallbacks
export const motionSafe = (variants: any): any => {
  if (!getMotionPreference()) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.01 }
    }
  }
  return variants
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

// Adaptive motion based on time
export const getAdaptiveMotion = (baseVariants: Variants): Variants => {
  const rhythm = getCulturalRhythm()
  
  switch (rhythm) {
    case 'morning':
      return {
        ...baseVariants,
        visible: {
          ...baseVariants.visible,
          transition: {
            ...(baseVariants.visible as any)?.transition,
            duration: DURATION.instant
          }
        }
      }
    case 'evening':
      return {
        ...baseVariants,
        visible: {
          ...baseVariants.visible,
          transition: {
            ...(baseVariants.visible as any)?.transition,
            duration: DURATION.meditation
          }
        }
      }
    default:
      return baseVariants
  }
}

/* ============================================================================ */
/* LEGACY COMPATIBILITY - Smooth Transition */
/* ============================================================================ */

// Map old animations to new zen variants
export const fadeIn = zenFade
export const slideUp = whisperUp
export const slideDown = microFloat
export const scaleIn = zenFade
export const staggerContainer = zenBreathe
export const listItem = whisperUp
export const hoverScale = zenScale
export const hoverLift = whisperHover