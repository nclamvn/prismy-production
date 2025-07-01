/**
 * MSW Browser Setup (for Storybook, development, etc.)
 * This worker intercepts requests in the browser
 */

import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Create the MSW worker instance
export const worker = setupWorker(...handlers)

// Start options for the service worker
export const workerOptions = {
  serviceWorker: {
    url: '/mockServiceWorker.js'
  },
  onUnhandledRequest: 'warn'
}