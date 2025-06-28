// Next.js Instrumentation File
// Required for Sentry SDK in Next.js 13+

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side initialization
    await import('./lib/error-tracking/sentry-config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime initialization
    await import('./lib/error-tracking/sentry-config')
  }
}