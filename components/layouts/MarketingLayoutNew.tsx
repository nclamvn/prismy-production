import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface MarketingLayoutProps {
  children: React.ReactNode
  className?: string
}

export function MarketingLayout({ children, className }: MarketingLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-white", className)}>
      {/* NotebookML-inspired Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">
                Prismy
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="/features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </a>
              <a href="/enterprise" className="text-gray-600 hover:text-gray-900 transition-colors">
                Enterprise
              </a>
              <a href="/docs" className="text-gray-600 hover:text-gray-900 transition-colors">
                Docs
              </a>
            </div>

            {/* Language Toggle & Auth */}
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <div className="flex items-center space-x-1 text-sm">
                <button className="px-2 py-1 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                  EN
                </button>
                <span className="text-gray-400">|</span>
                <button className="px-2 py-1 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                  VI
                </button>
              </div>

              {/* Auth Buttons */}
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
                <Button size="sm">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 rounded bg-accent flex items-center justify-center">
                  <span className="text-white font-bold text-xs">P</span>
                </div>
                <span className="font-semibold text-gray-900">Prismy</span>
              </div>
              <p className="text-sm text-gray-600">
                AI-powered translation platform for enterprise teams.
              </p>
              <p className="text-sm text-gray-600">
                Nền tảng dịch thuật AI cho doanh nghiệp.
              </p>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a></li>
                <li><a href="/enterprise" className="text-gray-600 hover:text-gray-900 transition-colors">Enterprise</a></li>
                <li><a href="/api-docs" className="text-gray-600 hover:text-gray-900 transition-colors">API</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/docs" className="text-gray-600 hover:text-gray-900 transition-colors">Documentation</a></li>
                <li><a href="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">Blog</a></li>
                <li><a href="/community" className="text-gray-600 hover:text-gray-900 transition-colors">Community</a></li>
                <li><a href="/support" className="text-gray-600 hover:text-gray-900 transition-colors">Support</a></li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a></li>
                <li><a href="/careers" className="text-gray-600 hover:text-gray-900 transition-colors">Careers</a></li>
                <li><a href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy</a></li>
                <li><a href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © 2024 Prismy. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 sm:mt-0">
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/>
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"/>
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}