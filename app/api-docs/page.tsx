'use client'

// Temporary disable swagger-ui-react due to CVE-2024-45461 (prismjs vulnerability)
// TODO: Re-enable when vulnerability is fixed in upstream dependencies

export default function ApiDocsPage() {
  const loading = false
  const error = null

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Documentation</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Prismy API Documentation</h1>
          <p className="text-gray-300">
            Enterprise-grade translation API with advanced caching and Vietnamese payment integration
          </p>
        </div>
      </div>

      {/* API Documentation */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">🚧 Temporary Maintenance</h3>
          <p className="text-yellow-700">
            API documentation is temporarily unavailable due to security updates. 
            We're upgrading our documentation system to ensure the highest security standards.
          </p>
          <p className="text-yellow-700 mt-2">
            For immediate API access, please contact our support team or check our GitHub repository.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Core Translation API</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-mono text-sm">POST /api/translate</span>
                <span className="text-green-600 font-semibold">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">GET /api/languages</span>
                <span className="text-green-600 font-semibold">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">POST /api/documents/upload</span>
                <span className="text-green-600 font-semibold">ACTIVE</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Payment & Billing</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-mono text-sm">POST /api/payments/create</span>
                <span className="text-green-600 font-semibold">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">GET /api/billing/usage</span>
                <span className="text-green-600 font-semibold">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">POST /api/credits/purchase</span>
                <span className="text-green-600 font-semibold">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t p-6 mt-12">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <p className="mb-2">
            <strong>Need Help?</strong> Contact our support team at{' '}
            <a href="mailto:support@prismy.ai" className="text-black hover:underline">
              support@prismy.ai
            </a>
          </p>
          <p className="text-sm">
            This documentation is automatically generated from our OpenAPI specification.
          </p>
        </div>
      </div>

      {/* Custom styles for Swagger UI */}
      <style jsx global>{`
        .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui .info {
          margin: 20px 0;
        }
        
        .swagger-ui .info .title {
          color: #000;
          font-size: 2rem;
          font-weight: bold;
        }
        
        .swagger-ui .info .description {
          color: #666;
          line-height: 1.6;
        }
        
        .swagger-ui .opblock.opblock-get .opblock-summary {
          border-color: #10b981;
        }
        
        .swagger-ui .opblock.opblock-post .opblock-summary {
          border-color: #3b82f6;
        }
        
        .swagger-ui .opblock.opblock-put .opblock-summary {
          border-color: #f59e0b;
        }
        
        .swagger-ui .opblock.opblock-delete .opblock-summary {
          border-color: #ef4444;
        }
        
        .swagger-ui .btn.authorize {
          background-color: #000;
          border-color: #000;
        }
        
        .swagger-ui .btn.authorize:hover {
          background-color: #333;
        }
        
        .swagger-ui .scheme-container {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .swagger-ui .servers-title {
          font-weight: bold;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  )
}