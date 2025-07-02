/**
 * UI/UX Polish Sprint - Phase 2.1: Font Optimization & Pre-connect
 * 
 * Implements next/font for Inter to eliminate FOUT
 * Provides consistent font loading across the application
 */

import { Inter } from 'next/font/google'

// Primary font configuration with optimized settings
export const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal'],
  display: 'swap',
  preload: true,
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif'
  ]
})

// Font CSS class names for use in components
export const fontClassNames = {
  inter: inter.className,
  variable: inter.variable
}

// Font CSS variables for use in Tailwind and CSS
export const fontVariables = {
  primary: 'var(--font-inter)',
  fallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
}

// Pre-connect URLs for font optimization
export const fontPreconnectUrls = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://rsms.me' // Inter font CDN
]

// Font loading optimization script
export const fontOptimizationScript = `
(function() {
  // Preload critical font files
  const criticalFonts = [
    'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
  ];
  
  criticalFonts.forEach(function(url) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = url;
    document.head.appendChild(link);
  });
})();
`

// Font performance metrics for monitoring
export const fontMetrics = {
  // Time to font display
  maxFOUT: 100, // ms
  // Font swap period
  swapPeriod: 3000, // ms
  // Critical fonts count
  criticalFonts: 1
}

export default inter