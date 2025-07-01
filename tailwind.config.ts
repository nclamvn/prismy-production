import type { Config } from 'tailwindcss'
import tokens from './tokens'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'sans': ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'], // Make Inter default
        'vietnamese': tokens.flattenedTypography.fontFamily.vietnamese,
        ...tokens.flattenedTypography.fontFamily,
      },
      colors: {
        // Legacy CSS variables (keep for backward compatibility)
        black: 'var(--black)',
        white: 'var(--white)',
        main: 'var(--bg-main)',
        footer: 'var(--bg-footer)',
        
        // New design system tokens
        ...tokens.flattenedColors,
        
        // Vietnamese cultural colors
        'vietnamese-red': tokens.vietnamese.culturalColors.vietnamese.red,
        'vietnamese-gold': tokens.vietnamese.culturalColors.vietnamese.gold,
        'tet-red': tokens.vietnamese.culturalColors.festive.tetRed,
        'tet-gold': tokens.vietnamese.culturalColors.festive.tetGold,
      },
      backgroundImage: {
        'accent-rainbow': 'var(--accent-rainbow)',
      },
      borderRadius: {
        // Design system radius tokens (0/4/8/16px scale)
        none: '0px',
        sm: '4px',      // buttons, badges
        DEFAULT: '8px', // cards, inputs
        lg: '16px',     // modals, panels
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
        full: '9999px', // avatars, pills
        
        // Semantic radius from tokens
        card: '8px',
        button: '8px',
        input: '8px',
        badge: '4px',
        modal: '16px',
        tooltip: '4px',
        avatar: '9999px',
      },
      boxShadow: {
        // Master Prompt: only shadow-sm and shadow-md allowed
        none: '0 0 #0000',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',     // subtle elements
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // cards, modals
        // No other shadows allowed per Master Prompt
      },
      spacing: {
        // Legacy CSS variables (keep for backward compatibility)
        // xs: 'var(--space-xs)',
        // sm: 'var(--space-sm)',
        // md: 'var(--space-md)',
        // lg: 'var(--space-lg)',
        // xl: 'var(--space-xl)',
        // '2xl': 'var(--space-2xl)',
        // '3xl': 'var(--space-3xl)',
        
        // New design system tokens
        ...tokens.flattenedSpacing,
      },
      fontSize: {
        // Legacy CSS variables (keep for backward compatibility)
        // xs: 'var(--text-xs)',
        // sm: 'var(--text-sm)',
        // base: 'var(--text-base)',
        // lg: 'var(--text-lg)',
        // xl: 'var(--text-xl)',
        // '2xl': 'var(--text-2xl)',
        // '3xl': 'var(--text-3xl)',
        // '4xl': 'var(--text-4xl)',
        // '5xl': 'var(--text-5xl)',
        
        // New design system tokens with line height
        ...(tokens.flattenedTypography.fontSize as any),
      },
      lineHeight: {
        // Legacy CSS variables (keep for backward compatibility)
        tight: 'var(--leading-tight)',
        normal: 'var(--leading-normal)',
        relaxed: 'var(--leading-relaxed)',
        
        // New design system tokens
        ...tokens.flattenedTypography.lineHeight,
      },
      fontWeight: {
        // New design system tokens
        ...tokens.flattenedTypography.fontWeight,
      },
      letterSpacing: {
        // New design system tokens
        ...tokens.flattenedTypography.letterSpacing,
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
      animation: {
        'rainbow-slide': 'rainbow-slide 3s linear infinite',
      },
      keyframes: {
        'rainbow-slide': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        }
      }
    },
  },
  plugins: [],
}

export default config