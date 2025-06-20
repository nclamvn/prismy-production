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
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-5 py-3 text-lg'
  }
  
  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18
  }
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full
          bg-white border border-gray-300 rounded-lg
          font-medium text-gray-900
          hover:font-semibold hover:border-gray-400
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300
          transition-all duration-200
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
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`
                    w-full flex items-center gap-2 px-4 py-2.5 text-left
                    font-medium text-gray-900
                    hover:font-semibold hover:bg-gray-50
                    transition-all duration-150
                    ${value === option.value ? 'bg-gray-50 font-semibold' : ''}
                  `}
                >
                  {option.icon && (
                    <span className="flex-shrink-0">
                      {option.icon}
                    </span>
                  )}
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