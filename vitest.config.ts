import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // ===============================================
    // VITEST CONFIG (Tối giản cho local testing)
    // ===============================================
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    
    // Test file patterns
    include: [
      'components/**/*.{test,spec}.{ts,tsx}',
      'lib/**/*.{test,spec}.{ts,tsx}',
      'tests/unit/**/*.{test,spec}.{ts,tsx}'
    ],
    
    // Exclude e2e tests (chạy riêng với Playwright)
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'tests/e2e/**',
      'play-smoke.ts'
    ],
    
    // Coverage settings
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'components/**/*.{ts,tsx}',
        'lib/**/*.ts',
        'app/**/*.{ts,tsx}'
      ],
      exclude: [
        'node_modules',
        'tests',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        'app/layout.tsx', // Next.js boilerplate
        '**/*.stories.{ts,tsx}' // Storybook files
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70, 
          lines: 70,
          statements: 70
        }
      }
    },
    
    // Test timeout (nhanh cho local dev)
    testTimeout: 5000,
    hookTimeout: 3000,
    
    // Watch mode settings
    watch: {
      // Chỉ watch source files
      include: ['components/**', 'lib/**', 'app/**'],
      exclude: ['node_modules', 'dist', '.next']
    }
  },
  
  // ===============================================
  // Path resolution (giống Next.js)
  // ===============================================
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/app': path.resolve(__dirname, 'app'),
      '@/styles': path.resolve(__dirname, 'styles'),
      '@/types': path.resolve(__dirname, 'types')
    }
  },
  
  // ===============================================
  // Environment variables for testing
  // ===============================================
  define: {
    'process.env.NODE_ENV': '"test"',
    'process.env.NEXT_PUBLIC_SUPABASE_URL': '"http://localhost:3001"',
    'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': '"test-key"'
  }
})