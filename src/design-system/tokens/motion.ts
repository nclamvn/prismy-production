// Motion design tokens for consistent animations
export const motion = {
  // Duration tokens (in milliseconds)
  duration: {
    instant: '0ms',
    fast: '150ms',      // Quick interactions (hover, focus)
    normal: '250ms',    // Standard transitions
    slow: '350ms',      // Complex animations
    slower: '500ms',    // Layout changes
  },

  // Easing curves
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Material ease-out
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',         // Slow start
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',        // Slow end  
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',    // Slow both ends
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },

  // Common transition combinations
  transitions: {
    fast: '150ms cubic-bezier(0, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: '150ms cubic-bezier(0, 0, 0.2, 1)',
    transform: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    layout: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Animation presets for common use cases
  presets: {
    // Micro-interactions
    hover: {
      duration: '150ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      properties: ['color', 'background-color', 'border-color', 'box-shadow'],
    },
    
    // Focus states
    focus: {
      duration: '150ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)', 
      properties: ['box-shadow', 'border-color'],
    },

    // Button press
    press: {
      duration: '100ms',
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
      properties: ['transform'],
    },

    // Modal/overlay
    modal: {
      duration: '250ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: ['opacity', 'transform'],
    },

    // Drawer/slide
    drawer: {
      duration: '300ms', 
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: ['transform'],
    },

    // Fade in/out
    fade: {
      duration: '200ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      properties: ['opacity'],
    },

    // Scale animations
    scale: {
      duration: '200ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: ['transform'],
    },
  },

  // Reduced motion preferences
  reducedMotion: {
    duration: '0ms',
    easing: 'linear',
    transitions: {
      fast: '0ms linear',
      normal: '0ms linear', 
      slow: '0ms linear',
      colors: '0ms linear',
      transform: '0ms linear',
      layout: '0ms linear',
    },
  },
} as const

// CSS custom properties for use in Tailwind
export const motionCssVars = {
  '--motion-duration-fast': motion.duration.fast,
  '--motion-duration-normal': motion.duration.normal,
  '--motion-duration-slow': motion.duration.slow,
  '--motion-easing-default': motion.easing.default,
  '--motion-easing-ease-out': motion.easing.easeOut,
  '--motion-transition-fast': motion.transitions.fast,
  '--motion-transition-normal': motion.transitions.normal,
  '--motion-transition-slow': motion.transitions.slow,
  '--motion-transition-colors': motion.transitions.colors,
} as const