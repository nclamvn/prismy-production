import { SimpleMarketingLayout } from '@/components/layouts/SimpleMarketingLayout'

export default function HomePage() {
  return (
    <SimpleMarketingLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-20 pb-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              AI-Powered Translation Platform
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Translate documents instantly with 99.9% accuracy across 150+ languages
            </p>
            <div className="flex gap-4 justify-center">
              <a 
                href="/auth/login" 
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </a>
              <a 
                href="/workspace" 
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Try Demo
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                🚀
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Translation</h3>
              <p className="text-gray-600">Real-time document processing with AI-powered accuracy</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                🎯
              </div>
              <h3 className="text-xl font-semibold mb-2">99.9% Accuracy</h3>
              <p className="text-gray-600">Enterprise-grade translation quality for professional use</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                🌍
              </div>
              <h3 className="text-xl font-semibold mb-2">150+ Languages</h3>
              <p className="text-gray-600">Comprehensive language support for global teams</p>
            </div>
          </div>
        </section>
      </div>
    </SimpleMarketingLayout>
  )
}
