'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

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
  size = 'md'
}: UniversalDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const selectedOption = options.find(option => option.value === value)
  
  // Close dropdown when clicking/touching outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    // Add both mouse and touch events for mobile compatibility
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside, { passive: true })
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

  const handleOptionSelect = (value: string, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(value)
    setIsOpen(false)
  }
  
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-5 py-3 text-lg'
  }
  
  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18
  }
  
  return (
    <div className={`relative mobile-dropdown-rectangular ${className}`} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={handleToggle}
        onTouchStart={handleToggle}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full
          bg-white border border-gray-300 rounded-lg
          font-medium text-gray-900
          hover:font-semibold hover:border-gray-400
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300
          transition-all duration-200
          touch-manipulation
          ${sizeClasses[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon && (
            <span className="flex-shrink-0">
              {selectedOption.icon}
            </span>
          )}
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
        </div>
        
        <ChevronDown 
          size={iconSizes[size]} 
          className={`flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[60] w-full mt-1 bg-white border border-gray-300 rounded-lg overflow-hidden mobile-dropdown-menu"
            style={{ boxShadow: 'none' }}
          >
            <div className="max-h-60 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={(e) => handleOptionSelect(option.value, e)}
                  onTouchStart={(e) => handleOptionSelect(option.value, e)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2.5 sm:py-2 text-left text-sm
                    font-medium text-gray-900
                    hover:font-semibold hover:bg-gray-50
                    transition-all duration-150
                    touch-manipulation
                    ${value === option.value ? 'bg-gray-50 font-semibold' : ''}
                  `}
                >
                  <span className="truncate">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}