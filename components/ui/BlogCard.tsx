'use client'

import { motion } from 'framer-motion'
import { motionSafe, slideUp, notebookLMCard } from '@/lib/motion'
import Link from 'next/link'
import { Calendar, Clock, User } from 'lucide-react'

interface BlogCardProps {
  title: string
  excerpt: string
  author: string
  publishDate: string
  readTime: string
  slug: string
  category: string
  artlineIllustration?: 'translation' | 'ai' | 'business' | 'technology' | 'security'
  delay?: number
  className?: string
}

export default function BlogCard({
  title,
  excerpt,
  author,
  publishDate,
  readTime,
  slug,
  category,
  artlineIllustration = 'translation',
  delay = 0,
  className = ''
}: BlogCardProps) {
  
  // Artline SVG illustrations - Vietnamese design standard
  const getArtlineIllustration = () => {
    const baseProps = {
      className: "w-full h-48 object-cover",
      fill: "none",
      stroke: "#111827",
      strokeWidth: "1.5",
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const
    }

    switch (artlineIllustration) {
      case 'translation':
        return (
          <svg viewBox="0 0 400 200" {...baseProps}>
            {/* Document with text lines */}
            <rect x="50" y="40" width="120" height="140" rx="8" stroke="#111827" fill="#f9fafb"/>
            <line x1="70" y1="60" x2="130" y2="60" stroke="#111827"/>
            <line x1="70" y1="80" x2="150" y2="80" stroke="#111827"/>
            <line x1="70" y1="100" x2="140" y2="100" stroke="#111827"/>
            <line x1="70" y1="120" x2="120" y2="120" stroke="#111827"/>
            
            {/* Arrow transformation */}
            <path d="M180 90 L200 90 M195 85 L200 90 L195 95" stroke="#3b82f6" strokeWidth="2"/>
            <circle cx="190" cy="90" r="15" stroke="#3b82f6" fill="#eff6ff"/>
            
            {/* Translated document */}
            <rect x="230" y="40" width="120" height="140" rx="8" stroke="#111827" fill="#f0fdf4"/>
            <line x1="250" y1="60" x2="310" y2="60" stroke="#111827"/>
            <line x1="250" y1="80" x2="330" y2="80" stroke="#111827"/>
            <line x1="250" y1="100" x2="320" y2="100" stroke="#111827"/>
            <line x1="250" y1="120" x2="300" y2="120" stroke="#111827"/>
            
            {/* Language indicators */}
            <text x="110" y="200" fontSize="12" fill="#6b7280" textAnchor="middle">EN</text>
            <text x="290" y="200" fontSize="12" fill="#6b7280" textAnchor="middle">VI</text>
          </svg>
        )
      
      case 'ai':
        return (
          <svg viewBox="0 0 400 200" {...baseProps}>
            {/* Brain/AI network */}
            <circle cx="200" cy="100" r="60" stroke="#111827" fill="#f3f4f6"/>
            <circle cx="180" cy="80" r="8" stroke="#3b82f6" fill="#3b82f6"/>
            <circle cx="220" cy="80" r="8" stroke="#3b82f6" fill="#3b82f6"/>
            <circle cx="200" cy="120" r="8" stroke="#3b82f6" fill="#3b82f6"/>
            <circle cx="160" cy="110" r="6" stroke="#6366f1" fill="#6366f1"/>
            <circle cx="240" cy="110" r="6" stroke="#6366f1" fill="#6366f1"/>
            
            {/* Connections */}
            <line x1="180" y1="80" x2="220" y2="80" stroke="#3b82f6"/>
            <line x1="180" y1="80" x2="200" y2="120" stroke="#3b82f6"/>
            <line x1="220" y1="80" x2="200" y2="120" stroke="#3b82f6"/>
            <line x1="160" y1="110" x2="180" y2="80" stroke="#6366f1"/>
            <line x1="240" y1="110" x2="220" y2="80" stroke="#6366f1"/>
            
            {/* Data streams */}
            <path d="M100 60 Q120 40 140 60 T180 60" stroke="#10b981" strokeDasharray="4,4"/>
            <path d="M300 60 Q280 40 260 60 T220 60" stroke="#10b981" strokeDasharray="4,4"/>
          </svg>
        )
      
      case 'business':
        return (
          <svg viewBox="0 0 400 200" {...baseProps}>
            {/* Charts and graphs */}
            <rect x="50" y="50" width="300" height="120" rx="8" stroke="#111827" fill="#f9fafb"/>
            
            {/* Bar chart */}
            <rect x="80" y="120" width="20" height="30" fill="#3b82f6"/>
            <rect x="110" y="100" width="20" height="50" fill="#10b981"/>
            <rect x="140" y="110" width="20" height="40" fill="#f59e0b"/>
            <rect x="170" y="90" width="20" height="60" fill="#3b82f6"/>
            
            {/* Line graph */}
            <path d="M220 140 L250 120 L280 100 L310 80 L340 70" stroke="#ef4444" strokeWidth="2" fill="none"/>
            <circle cx="220" cy="140" r="3" fill="#ef4444"/>
            <circle cx="250" cy="120" r="3" fill="#ef4444"/>
            <circle cx="280" cy="100" r="3" fill="#ef4444"/>
            <circle cx="310" cy="80" r="3" fill="#ef4444"/>
            <circle cx="340" cy="70" r="3" fill="#ef4444"/>
            
            {/* Growth arrow */}
            <path d="M320 90 L350 60 M345 65 L350 60 L345 70" stroke="#10b981" strokeWidth="2"/>
          </svg>
        )
      
      case 'technology':
        return (
          <svg viewBox="0 0 400 200" {...baseProps}>
            {/* Server/cloud infrastructure */}
            <rect x="80" y="60" width="80" height="50" rx="4" stroke="#111827" fill="#f3f4f6"/>
            <rect x="240" y="60" width="80" height="50" rx="4" stroke="#111827" fill="#f3f4f6"/>
            
            {/* Connection lines */}
            <line x1="160" y1="85" x2="240" y2="85" stroke="#3b82f6" strokeWidth="2"/>
            <circle cx="200" cy="85" r="8" stroke="#3b82f6" fill="#eff6ff"/>
            
            {/* Data packets */}
            <rect x="90" y="70" width="10" height="6" rx="1" fill="#10b981"/>
            <rect x="110" y="70" width="10" height="6" rx="1" fill="#10b981"/>
            <rect x="130" y="70" width="10" height="6" rx="1" fill="#10b981"/>
            
            <rect x="250" y="70" width="10" height="6" rx="1" fill="#10b981"/>
            <rect x="270" y="70" width="10" height="6" rx="1" fill="#10b981"/>
            <rect x="290" y="70" width="10" height="6" rx="1" fill="#10b981"/>
            
            {/* Cloud */}
            <path d="M150 130 Q160 120 170 130 Q180 120 190 130 Q200 125 210 130 Q200 140 190 140 L170 140 Q160 140 150 130 Z" 
                  stroke="#111827" fill="#e0f2fe"/>
          </svg>
        )
      
      case 'security':
        return (
          <svg viewBox="0 0 400 200" {...baseProps}>
            {/* Shield */}
            <path d="M200 50 L160 70 L160 120 Q160 140 200 150 Q240 140 240 120 L240 70 Z" 
                  stroke="#111827" fill="#f0fdf4"/>
            
            {/* Lock */}
            <rect x="185" y="95" width="30" height="25" rx="3" stroke="#111827" fill="#10b981"/>
            <path d="M190 95 L190 85 Q190 80 195 80 L205 80 Q210 80 210 85 L210 95" 
                  stroke="#111827" fill="none"/>
            <circle cx="200" cy="105" r="3" fill="#111827"/>
            
            {/* Security rings */}
            <circle cx="200" cy="100" r="80" stroke="#10b981" strokeDasharray="8,4" fill="none" opacity="0.6"/>
            <circle cx="200" cy="100" r="100" stroke="#3b82f6" strokeDasharray="12,6" fill="none" opacity="0.4"/>
          </svg>
        )
      
      default:
        return null
    }
  }

  return (
    <motion.article
      variants={motionSafe(slideUp)}
      transition={{ delay }}
      className={`group overflow-hidden ${className}`}
      style={{ 
        backgroundColor: 'var(--surface-elevated)',
        border: '1px solid var(--surface-outline)',
        borderRadius: 'var(--mat-card-elevated-container-shape)',
        boxShadow: 'var(--elevation-level-1)',
        transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)'
      }}
      {...motionSafe(notebookLMCard)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--notebooklm-primary-light)';
        e.currentTarget.style.boxShadow = 'var(--elevation-level-2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--surface-outline)';
        e.currentTarget.style.boxShadow = 'var(--elevation-level-1)';
      }}
    >
      {/* Artline Illustration Header */}
      <div 
        className="p-6"
        style={{ backgroundColor: 'var(--surface-filled)' }}
      >
        {getArtlineIllustration()}
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Category */}
        <div className="mb-3">
          <span 
            className="inline-flex items-center px-3 py-1 transition-colors"
            style={{
              backgroundColor: 'var(--notebooklm-primary-light)',
              color: 'var(--notebooklm-primary)',
              borderRadius: 'var(--shape-corner-full)',
              fontSize: 'var(--sys-label-small-size)',
              lineHeight: 'var(--sys-label-small-line-height)',
              fontFamily: 'var(--sys-label-small-font)',
              fontWeight: 'var(--sys-label-small-weight)'
            }}
          >
            {category}
          </span>
        </div>
        
        {/* Title */}
        <h3 
          className="mb-3 line-clamp-2 transition-colors group-hover:opacity-80"
          style={{
            fontSize: 'var(--sys-title-large-size)',
            lineHeight: 'var(--sys-title-large-line-height)',
            fontFamily: 'var(--sys-title-large-font)',
            fontWeight: 'var(--sys-title-large-weight)',
            color: 'var(--text-primary)'
          }}
        >
          <Link 
            href={`/blog/${slug}`} 
            className="hover:underline focus-indicator"
            style={{ textDecorationColor: 'var(--notebooklm-primary)' }}
          >
            {title}
          </Link>
        </h3>
        
        {/* Excerpt */}
        <p 
          className="mb-4 line-clamp-3 transition-colors"
          style={{
            fontSize: 'var(--sys-body-medium-size)',
            lineHeight: 'var(--sys-body-medium-line-height)',
            fontFamily: 'var(--sys-body-medium-font)',
            fontWeight: 'var(--sys-body-medium-weight)',
            color: 'var(--text-secondary)'
          }}
        >
          {excerpt}
        </p>
        
        {/* Meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User 
                className="w-3 h-3" 
                style={{ color: 'var(--text-disabled)' }}
              />
              <span
                style={{
                  fontSize: 'var(--sys-body-small-size)',
                  lineHeight: 'var(--sys-body-small-line-height)',
                  fontFamily: 'var(--sys-body-small-font)',
                  fontWeight: 'var(--sys-body-small-weight)',
                  color: 'var(--text-disabled)'
                }}
              >
                {author}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar 
                className="w-3 h-3" 
                style={{ color: 'var(--text-disabled)' }}
              />
              <span
                style={{
                  fontSize: 'var(--sys-body-small-size)',
                  lineHeight: 'var(--sys-body-small-line-height)',
                  fontFamily: 'var(--sys-body-small-font)',
                  fontWeight: 'var(--sys-body-small-weight)',
                  color: 'var(--text-disabled)'
                }}
              >
                {publishDate}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock 
                className="w-3 h-3" 
                style={{ color: 'var(--text-disabled)' }}
              />
              <span
                style={{
                  fontSize: 'var(--sys-body-small-size)',
                  lineHeight: 'var(--sys-body-small-line-height)',
                  fontFamily: 'var(--sys-body-small-font)',
                  fontWeight: 'var(--sys-body-small-weight)',
                  color: 'var(--text-disabled)'
                }}
              >
                {readTime}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}