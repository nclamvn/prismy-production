'use client'

import Link from 'next/link'
import { ArrowRight, Zap, Layout, CheckCircle } from 'lucide-react'

/**
 * DEMO PAGE: Compare Old vs New Interface
 * Showcases the transformation from complex to NotebookLM-inspired design
 */
export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Prismy Interface Transformation
          </h1>
          <p className="text-xl text-gray-600">
            Compare the old complex interface with the new NotebookLM-inspired
            design
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Old Interface */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Layout className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Old Workspace
              </h2>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">
                  Complex provider hierarchy (12+ layers)
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">Translation pipeline failures</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">Inconsistent navigation</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">Over-engineered UI</span>
              </div>
            </div>

            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              View Old Interface
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* New Interface */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                New NotebookLM Interface
              </h2>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">
                  Clean 3-panel layout (Sources | Translate | Export)
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Working translation pipeline</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Consistent navigation patterns</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Professional, minimalist design</span>
              </div>
            </div>

            <Link
              href="/workspace-v2"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Try New Interface
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Implementation Progress */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">
            🚀 Week 2 Progress: NotebookLM Transformation
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                3-Panel Layout
              </h4>
              <p className="text-sm text-gray-600">
                NotebookLM-inspired unified interface with Sources, Translate,
                and Export panels
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Working Pipeline
              </h4>
              <p className="text-sm text-gray-600">
                Translation now produces output with proper error handling and
                user feedback
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layout className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Clean Architecture
              </h4>
              <p className="text-sm text-gray-600">
                Simplified component structure with reusable variants for
                different layouts
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">
            🎯 Coming Next (Week 3)
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Provider hierarchy consolidation (12+ → 1 unified)</li>
            <li>• Studio-style one-click actions</li>
            <li>• Mobile responsive optimization</li>
            <li>• Performance optimization and polish</li>
            <li>• Vietnamese market-specific features</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
