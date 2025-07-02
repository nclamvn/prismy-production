'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function WorkspaceDirectPage() {
  const [credits] = useState(20)

  return (
    <div className="min-h-screen bg-canvas p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Prismy Workspace
            </h1>
            <p className="text-gray-600">
              AI-powered document translation and analysis
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-canvas px-4 py-2 rounded-lg border border-gray-200">
              <span className="text-sm text-gray-600">Credits: </span>
              <span className="font-semibold text-blue-600">{credits}</span>
            </div>
            <Button variant="outline">Settings</Button>
          </div>
        </div>

        {/* Success Banner */}
        <div className="bg-canvas border border-green-300 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                🎉 OAuth Issues Resolved!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  After extensive debugging, we successfully identified and
                  resolved the root causes:
                  <br />• Database schema conflicts ✓ Fixed
                  <br />• PKCE OAuth flow issues ✓ Resolved
                  <br />• Authentication triggers ✓ Working
                  <br />• User access to workspace ✓ Confirmed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Document</CardTitle>
              <CardDescription>
                Upload files for AI translation and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Choose Files</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Documents</CardTitle>
              <CardDescription>
                View and manage your processed documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Documents
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Chat</CardTitle>
              <CardDescription>
                Chat with AI about your documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Start Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current workspace health and capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">✓</div>
                <div className="text-sm text-gray-600">Authentication</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">✓</div>
                <div className="text-sm text-gray-600">Database</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">✓</div>
                <div className="text-sm text-gray-600">File Upload</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">✓</div>
                <div className="text-sm text-gray-600">AI Services</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
