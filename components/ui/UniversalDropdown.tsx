'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { motionSafe, notebookLMButton } from '@/lib/motion'

export interface DropdownOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface UniversalDropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function UniversalDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  disabled = false,
  className = '',
  size = 'md',
}: UniversalDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(option => option.value === value)

  // Close dropdown when clicking/touching outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    // Add both mouse and touch events for mobile compatibility
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside, {
      passive: true,
    })
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // Unified event handler for cross-platform compatibility
  const handleToggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleOptionSelect = (
    value: string,
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(value)
    setIsOpen(false)
  }

  const getSizeStyles = (size: 'sm' | 'md' | 'lg') => {
    const styles = {
      sm: {
        height: '36px',
        padding: '0 12px',
        fontSize: 'var(--sys-label-medium-size)',
        lineHeight: 'var(--sys-label-medium-line-height)',
      },
      md: {
        height: '44px',
        padding: '0 16px',
        fontSize: 'var(--sys-label-large-size)',
        lineHeight: 'var(--sys-label-large-line-height)',
      },
      lg: {
        height: '48px',
        padding: '0 20px',
        fontSize: 'var(--sys-title-medium-size)',
        lineHeight: 'var(--sys-title-medium-line-height)',
      }
    }
    return styles[size]
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  }

  return (
    <div
      className={`relative mobile-dropdown-rectangular ${className}`}
      ref={dropdownRef}
    >
      {/* NotebookLM Dropdown Button */}
      <motion.button
        onClick={handleToggle}
        onTouchStart={handleToggle}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full
          focus-indicator touch-accessible
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        style={{
          ...getSizeStyles(size),
          backgroundColor: 'var(--surface-elevated)',
          border: '1px solid var(--surface-outline)',
          borderRadius: 'var(--mat-button-outlined-container-shape)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--sys-label-large-font)',
          fontWeight: 'var(--sys-label-large-weight)',
          transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)'
        }}
        {...(disabled ? {} : motionSafe(notebookLMButton))}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'var(--surface-filled)'
            e.currentTarget.style.borderColor = 'var(--notebooklm-primary)'
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'var(--surface-elevated)'
            e.currentTarget.style.borderColor = 'var(--surface-outline)'
          }
        }}
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon && (
            <span className="flex-shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
        </div>

        <ChevronDown
          size={iconSizes[size]}
          className={`flex-shrink-0 transition-transform duration-200 ml-2 ${
            isOpen ? 'rotate-180' : ''
          }`}
          style={{ color: 'var(--text-secondary)' }}
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="absolute z-[60] w-full mt-2 overflow-hidden"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderRadius: 'var(--mat-card-elevated-container-shape)',
              border: '1px solid var(--surface-outline)',
              boxShadow: 'var(--elevation-level-3)',
            }}
          >
            <div className="max-h-60 overflow-y-auto">
              {options.map(option => {
                const isSelected = value === option.value
                return (
                  <button
                    key={option.value}
                    onClick={e => handleOptionSelect(option.value, e)}
                    onTouchStart={e => handleOptionSelect(option.value, e)}
                    className="w-full flex items-center gap-2 text-left touch-accessible transition-all duration-150"
                    style={{
                      padding: '12px 16px',
                      backgroundColor: isSelected ? 'var(--notebooklm-primary-light)' : 'transparent',
                      color: isSelected ? 'var(--notebooklm-primary)' : 'var(--text-primary)',
                      fontSize: 'var(--sys-body-medium-size)',
                      lineHeight: 'var(--sys-body-medium-line-height)',
                      fontFamily: 'var(--sys-body-medium-font)',
                      fontWeight: isSelected ? '600' : 'var(--sys-body-medium-weight)',
                      borderRadius: isSelected ? 'var(--mat-card-outlined-container-shape)' : '0'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--surface-filled)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    {option.icon && (
                      <span className="flex-shrink-0">{option.icon}</span>
                    )}
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <div 
                        className="ml-auto w-2 h-2 rounded-full"
                        style={{ backgroundColor: 'var(--notebooklm-primary)' }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
