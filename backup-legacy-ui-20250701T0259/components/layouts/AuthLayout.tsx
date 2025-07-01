import React from 'react'
import { cn } from '@/lib/utils'

interface AuthLayoutProps {
  children: React.ReactNode
  className?: string
  leftContent?: React.ReactNode
  title?: string
  subtitle?: string
  showBranding?: boolean
}

export function AuthLayout({ 
  children, 
  className,
  leftContent,
  title,
  subtitle,
  showBranding = true
}: AuthLayoutProps) {
  return (
    <div className={cn("min-h-screen flex", className)}>
      {/* Left Column - Branding/Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-accent relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="h-full w-full">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          {leftContent ? (
            leftContent
          ) : (
            <>
              {/* Default Branding Content */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">P</span>
                  </div>
                  <span className="text-2xl font-bold">Prismy</span>
                </div>
                
                <h1 className="text-4xl font-bold mb-6 leading-tight">
                  AI-Powered Translation Platform
                </h1>
                
                <p className="text-xl text-white/90 mb-8 leading-relaxed">
                  Transform your documents with enterprise-grade AI translation. 
                  99.9% accuracy across 150+ languages with NotebookLM-inspired interface.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                    <span>Real-time collaboration with AI agents</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                    <span>Enterprise security & compliance</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                    <span>Support for 150+ languages</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                    <span>Advanced document processing</span>
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              <div className="border-l-4 border-white/30 pl-6">
                <p className="text-white/90 italic mb-4">
                  "Prismy has revolutionized our global communication. The AI-powered 
                  translation quality is incredible, and the NotebookLM-inspired interface 
                  makes complex document workflows simple."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">JD</span>
                  </div>
                  <div>
                    <p className="font-semibold">John Doe</p>
                    <p className="text-sm text-white/70">Global Operations Director</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Column - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-16 lg:px-16">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Branding */}
          {showBranding && (
            <div className="flex flex-col items-center mb-8 lg:hidden">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">Prismy</span>
              </div>
              <p className="text-center text-gray-600">
                AI-Powered Translation Platform
              </p>
            </div>
          )}

          {/* Form Header */}
          {(title || subtitle) && (
            <div className="text-center mb-8">
              {title && (
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Form Content */}
          <div className="space-y-6">
            {children}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2024 Prismy. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}