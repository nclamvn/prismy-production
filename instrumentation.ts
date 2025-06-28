// Next.js Instrumentation File
// Required for Sentry SDK in Next.js 13+

export async function register() {
  // Temporarily disable Sentry for deployment
  try {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      // Server-side initialization
      // await import('./lib/error-tracking/sentry-config')
      console.log('Sentry disabled for deployment')
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      // Edge runtime initialization
      // await import('./lib/error-tracking/sentry-config')
      console.log('Sentry disabled for deployment')
    }
  } catch (error) {
    console.warn('Sentry initialization skipped:', error)
  }
}