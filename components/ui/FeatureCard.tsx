'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { motionSafe, slideUp } from '@/lib/motion'
import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  delay?: number
  tags?: string[]
  isSelected?: boolean
  onClick?: (event: React.MouseEvent) => void
  className?: string
}

export default function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  delay = 0,
  tags = [],
  isSelected = false,
  onClick,
  className = ''
}: FeatureCardProps) {
  return (
    <motion.div
      variants={motionSafe(slideUp)}
      transition={{ delay }}
      className={`
        group relative bg-white rounded-2xl border transition-all duration-300 cursor-pointer
        ${isSelected 
          ? 'border-black shadow-lg ring-2 ring-black ring-offset-2' 
          : 'border-gray-200 hover:border-gray-300'
        }
        ${className}
      `}
      style={{
        borderColor: isSelected ? '#111827' : '#e5e7eb',
        borderRadius: '1rem',
        padding: '1.5rem',
        boxShadow: 'none',
        transition: 'all 200ms ease-in-out'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0px 4px 12px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onClick={(e) => onClick?.(e)}
    >
      {/* Horizontal Layout: Icon beside Title - Vietnamese Standard */}
      <div className="flex items-center gap-3 mb-4">
        {/* Icon Container */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center
                        group-hover:bg-gray-100 transition-all duration-300">
            <Icon 
              className="text-black transition-transform duration-200"
              style={{ width: '40px', height: '40px' }}
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Title - Vietnamese Typography Standards */}
        <h3 
          className="font-optima font-bold text-black tracking-tight leading-tight group-hover:text-gray-900 transition-colors duration-200"
          style={{ 
            color: '#111827',
            fontSize: '1.25rem', // Tăng từ kích thước hiện tại
            fontWeight: 'bold'
          }}
        >
          {title}
        </h3>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3
                   group-hover:text-gray-700 transition-colors duration-200">
        {description}
      </p>

      {/* Feature Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 3).map((tag, tagIndex) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full
                       group-hover:bg-gray-200 transition-all duration-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-3 h-3 bg-black rounded-full" />
      )}
    </motion.div>
  )
}