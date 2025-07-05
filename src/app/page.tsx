"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">🚀 Prismy v2</h1>
            <Button variant="outline" onClick={() => window.location.href = '/api/health'}>
              API Status
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 text-gray-900">
            Document Translation
            <span className="block text-blue-600 mt-2">Simplified</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload any document and get professional translations in seconds. 
            Built with modern architecture for reliability and speed.
          </p>
          <div className="flex gap-4 justify-center mb-12">
            <Button size="lg" onClick={() => window.location.href = '/upload'}>Get Started</Button>
            <Button size="lg" variant="outline" onClick={() => window.location.href = '#features'}>Learn More</Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card>
              <CardHeader>
                <div className="text-3xl mb-4">🚀</div>
                <CardTitle>Fast</CardTitle>
                <CardDescription>
                  Modern architecture with Next.js 15 for lightning-fast performance
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="text-3xl mb-4">🔒</div>
                <CardTitle>Secure</CardTitle>
                <CardDescription>
                  Built-in RLS policies and enterprise-grade security
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="text-3xl mb-4">🎯</div>
                <CardTitle>Simple</CardTitle>
                <CardDescription>
                  Clean interface with drag-and-drop file upload
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Status */}
          <div className="mt-16">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-50 border border-green-200 rounded-full">
              <div className="w-3 h-3 bg-green-500 rounded-full opacity-80"></div>
              <span className="text-green-800 font-medium">🎉 Production Ready - All Systems Operational</span>
            </div>
          </div>

          {/* Infrastructure Ready Notice */}
          <div className="mt-16 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-lg font-semibold text-yellow-800 mb-2">
              🚧 Infrastructure Complete
            </h4>
            <p className="text-yellow-700 text-sm">
              All backend services, database schemas, and API endpoints are implemented and ready. 
              Features will be gradually enabled as we complete testing and optimization.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}