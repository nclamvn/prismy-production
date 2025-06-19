'use client'

import { useState, useEffect } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/swagger')
      .then(response => response.json())
      .then(data => {
        setSpec(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

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
      <div className="max-w-7xl mx-auto">
        {spec && (
          <SwaggerUI
            spec={spec}
            docExpansion="list"
            defaultModelsExpandDepth={2}
            defaultModelRendering="model"
            displayRequestDuration={true}
            tryItOutEnabled={true}
            requestInterceptor={(req) => {
              // Add custom headers or modify requests if needed
              req.headers['X-API-Client'] = 'Prismy-Docs'
              return req
            }}
            responseInterceptor={(res) => {
              // Log responses for debugging
              console.log('API Response:', res)
              return res
            }}
            supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
            validatorUrl={null} // Disable validator
            plugins={[
              // Custom plugins can be added here
            ]}
            layout="BaseLayout"
            deepLinking={true}
            showExtensions={true}
            showCommonExtensions={true}
            filter={true}
            requestSnippetsEnabled={true}
            requestSnippets={{
              generators: {
                curl_bash: {
                  title: 'cURL (bash)',
                  syntax: 'bash'
                },
                curl_powershell: {
                  title: 'cURL (PowerShell)',
                  syntax: 'powershell'
                },
                curl_cmd: {
                  title: 'cURL (CMD)',
                  syntax: 'bash'
                }
              },
              defaultExpanded: true,
              languages: ['curl_bash', 'curl_powershell', 'curl_cmd']
            }}
          />
        )}
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