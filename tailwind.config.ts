import type { Config } from 'tailwindcss'
import prismyPreset from './tailwind.preset'

const config: Config = {
  presets: [prismyPreset],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './stories/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Font variables for next/font
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: [
          'var(--font-jetbrains-mono)',
          'ui-monospace',
          'Menlo',
          'monospace',
        ],
      },
      colors: {
        canvas: '#F9FAFB', // Unified canvas background
      },
      height: {
        header: '3.5rem', // 56px header height
      },
      zIndex: {
        header: '20',
        sidebar: '30',
      },
    },
  },
}

export default config
