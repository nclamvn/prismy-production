'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from './ThemeProvider'
import { Button } from '@/components/ui/Button'
import { motionSafe, notebookLMButton } from '@/lib/motion'

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown'
  showLabel?: boolean
  className?: string
}

export function ThemeToggle({ 
  variant = 'button', 
  showLabel = false,
  className = ''
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const themes = [
    { 
      key: 'light' as const, 
      label: 'Light', 
      icon: Sun,
      description: 'Use light theme'
    },
    { 
      key: 'dark' as const, 
      label: 'Dark', 
      icon: Moon,
      description: 'Use dark theme'
    },
    { 
      key: 'system' as const, 
      label: 'System', 
      icon: Monitor,
      description: 'Use system preference'
    }
  ]

  const currentTheme = themes.find(t => t.key === theme) || themes[0]
  const CurrentIcon = currentTheme.icon

  if (variant === 'dropdown') {
    return (
      <div className={`relative group ${className}`}>
        <Button
          variant="outlined"
          className="w-auto px-3 py-2"
          aria-label={`Current theme: ${currentTheme.label}. Click to change theme`}
        >
          <CurrentIcon className="w-4 h-4" aria-hidden="true" />
          {showLabel && (
            <span className="ml-2 text-sm">{currentTheme.label}</span>
          )}
        </Button>

        {/* Dropdown Menu */}
        <div 
          className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            border: '1px solid var(--surface-outline)',
            borderRadius: 'var(--mat-card-elevated-container-shape)',
            boxShadow: 'var(--elevation-level-3)',
            minWidth: '160px'
          }}
        >
          {themes.map((themeOption) => {
            const Icon = themeOption.icon
            const isActive = theme === themeOption.key
            
            return (
              <button
                key={themeOption.key}
                onClick={() => setTheme(themeOption.key)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-opacity-80"
                style={{
                  backgroundColor: isActive ? 'var(--notebooklm-primary-light)' : 'transparent',
                  color: isActive ? 'var(--notebooklm-primary)' : 'var(--text-primary)',
                  borderRadius: isActive ? 'var(--mat-card-outlined-container-shape)' : '0'
                }}
                aria-pressed={isActive}
                aria-describedby={`theme-desc-${themeOption.key}`}
              >
                <Icon 
                  className="w-4 h-4" 
                  style={{
                    color: isActive ? 'var(--notebooklm-primary)' : 'var(--text-secondary)'
                  }}
                  aria-hidden="true"
                />
                <div>
                  <div 
                    style={{
                      fontSize: 'var(--sys-body-medium-size)',
                      fontWeight: isActive ? '600' : '400'
                    }}
                  >
                    {themeOption.label}
                  </div>
                  <div 
                    id={`theme-desc-${themeOption.key}`}
                    className="text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {themeOption.description}
                  </div>
                </div>
                
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--notebooklm-primary)' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Cycle through themes on click
  const cycleTheme = () => {
    const currentIndex = themes.findIndex(t => t.key === theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex].key)
  }

  return (
    <motion.div {...motionSafe(notebookLMButton)} className={className}>
      <Button
        variant="outlined"
        onClick={cycleTheme}
        className="w-auto px-3 py-2 relative overflow-hidden"
        aria-label={`Current theme: ${currentTheme.label}. Click to cycle to next theme`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="flex items-center gap-2"
          >
            <CurrentIcon className="w-4 h-4" aria-hidden="true" />
            {showLabel && (
              <span className="text-sm font-medium">{currentTheme.label}</span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Visual indicator for resolved theme */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300"
          style={{
            backgroundColor: resolvedTheme === 'dark' 
              ? 'var(--notebooklm-primary)' 
              : 'var(--surface-outline)'
          }}
        />
      </Button>
    </motion.div>
  )
}