/**
 * MSW Server Setup for Node.js environments (Jest tests)
 * This server intercepts all HTTP requests during tests
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Create the MSW server instance with our handlers
export const server = setupServer(...handlers)