'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong!
            </h1>

            <p className="text-gray-600 mb-8">
              We apologize for the inconvenience. An unexpected error has
              occurred.
            </p>

            <div className="space-y-4">
              <button
                onClick={reset}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Try again
              </button>

              <a
                href="/"
                className="block w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Go to homepage
              </a>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-gray-100 rounded-md text-left">
                <p className="text-sm font-mono text-gray-700">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
