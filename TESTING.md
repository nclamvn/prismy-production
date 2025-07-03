# PRISMY TESTING GUIDE

**PRISMY ZERO-CHAOS TEST & RELEASE PLAYBOOK** - Comprehensive Testing Documentation

## 🎯 Testing Philosophy

Every change to Prismy **MUST** pass through our **Zero-Chaos Testing Pipeline**:

1. **Unit Tests** (Vitest) - Validate individual functions
2. **Component Tests** (React Testing Library) - UI component behavior  
3. **Contract Tests** (MSW) - API interface validation
4. **Visual Regression** (Percy) - UI consistency across changes
5. **End-to-End Tests** (Playwright) - Complete user workflows
6. **Mutation Testing** (Stryker) - Test quality validation

**⚠️ CRITICAL RULE: No merge without ALL tests passing. No exceptions.**

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Configure your test database and API keys
```

### Run All Tests
```bash
# Complete test suite (as run in CI)
npm run test:all

# Individual test types
npm run test:unit          # Unit tests
npm run test:e2e           # End-to-end tests  
npm run test:visual        # Percy visual tests
npm run test:mutation      # Mutation testing
npm run test:coverage      # Coverage report
```

### Development Workflow
```bash
# Watch mode for active development
npm run test:watch

# Test specific file
npm run test -- auth.test.ts

# Debug failing tests
npm run test:debug
```

## 📁 Test Structure

```
tests/
├── unit/                 # Unit tests (Vitest)
│   ├── api/             # API route tests
│   ├── components/      # Component tests  
│   ├── utils/           # Utility function tests
│   └── setup.ts         # Global test setup
├── e2e/                 # End-to-end tests (Playwright)
│   ├── auth/           # Authentication flows
│   ├── upload/         # File upload workflows
│   ├── translation/    # Translation processes
│   └── billing/        # Payment and billing
├── contract/           # API contract tests (MSW)
└── visual/             # Visual regression tests (Percy)
```

## 🧪 Test Types & Guidelines

### 1. Unit Tests (Vitest + React Testing Library)

**What to Test:**
- ✅ Individual functions and methods
- ✅ Component rendering and behavior
- ✅ Error handling and edge cases
- ✅ Security validations (auth, CSRF, XSS)
- ✅ Business logic and calculations

**Test Naming Convention:**
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition is met', () => {
      // Test implementation
    })
  })
})
```

**Example Unit Test:**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button Component', () => {
  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn()
    
    render(
      <Button onClick={handleClick}>
        Click me
      </Button>
    )
    
    await fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

### 2. End-to-End Tests (Playwright)

**Critical User Journeys:**
- 🔐 Authentication (OAuth, email/password)
- 📤 File upload and processing
- 🌐 Translation workflows
- 💳 Billing and subscription management
- 🤖 AI agent interactions

**Example E2E Test:**
```typescript
import { test, expect } from '@playwright/test'

test('complete translation workflow', async ({ page }) => {
  // 1. Login
  await page.goto('/auth/signin')
  await page.fill('[data-testid="email"]', 'test@example.com')
  await page.fill('[data-testid="password"]', 'password123')
  await page.click('[data-testid="signin-button"]')
  
  // 2. Upload document
  await page.goto('/app/upload')
  await page.setInputFiles('[data-testid="file-input"]', 'test-doc.pdf')
  
  // 3. Start translation
  await page.click('[data-testid="translate-button"]')
  
  // 4. Verify completion
  await expect(page.locator('[data-testid="translation-status"]'))
    .toHaveText('Completed', { timeout: 30000 })
})
```

### 3. Visual Regression Tests (Percy)

**Critical UI States:**
- 🏠 Landing page (all viewports)
- 🔐 Authentication modals
- 📊 Workspace layouts
- ⚠️ Error states
- 📱 Mobile responsive views

Percy automatically captures screenshots during E2E tests. Mark critical visual states:

```typescript
// In E2E tests
await page.locator('[data-testid="main-content"]').waitFor()
await percySnapshot(page, 'Workspace - Empty State')
```

### 4. Contract Tests (MSW)

Mock external APIs to ensure consistent interfaces:

```typescript
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.post('/api/auth/signin', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        user: { id: '123', email: 'test@example.com' }
      })
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### 5. Mutation Testing (Stryker)

Validates test quality by introducing code mutations:

```bash
# Run mutation testing
npm run test:mutation

# Results in reports/mutation/
open reports/mutation/mutation-report.html
```

**Mutation Score Targets:**
- 🎯 **90%+**: Critical security code
- 🎯 **85%+**: Core business logic  
- 🎯 **75%+**: Supporting utilities
- 🎯 **70%**: Minimum threshold (build fails below)

## 🔒 Security Testing

### Authentication & Authorization
```typescript
describe('API Security', () => {
  it('rejects unauthenticated requests', async () => {
    const response = await fetch('/api/protected-route')
    expect(response.status).toBe(401)
  })
  
  it('validates CSRF tokens', async () => {
    const response = await fetch('/api/form-handler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'test' })
      // Missing CSRF token
    })
    expect(response.status).toBe(403)
  })
})
```

### Input Validation
```typescript
describe('Input Sanitization', () => {
  it('prevents XSS in user input', () => {
    const maliciousInput = '<script>alert("xss")</script>'
    const sanitized = sanitizeInput(maliciousInput)
    expect(sanitized).not.toContain('<script>')
  })
})
```

## 📊 Coverage Requirements

### Minimum Coverage Thresholds
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Critical Code Requirements
- **Security functions**: 95%+
- **Payment/billing code**: 90%+
- **Authentication logic**: 90%+
- **Data validation**: 85%+

### Coverage Commands
```bash
# Generate coverage report
npm run test:coverage

# View detailed HTML report
open coverage/index.html

# Coverage by file type
npm run test:coverage -- --reporter=text-summary
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow
Our `qa-suite.yml` runs:

1. **Quality Gate** (parallel):
   - Linting (ESLint)
   - Type checking (TypeScript)
   - Unit tests (Vitest)
   - Security audit

2. **E2E Testing** (parallel):
   - Chrome, Firefox, Safari
   - Multiple viewports
   - Mobile testing

3. **Visual Regression**:
   - Percy screenshot comparison
   - Multi-locale testing

**Status Checks Required:**
- ✅ All quality gates pass
- ✅ E2E tests pass (all browsers)
- ✅ Visual regression approved
- ✅ Coverage thresholds met

## 🐛 Testing Patterns

### Error Boundaries
```typescript
it('handles component errors gracefully', () => {
  const ThrowError = () => {
    throw new Error('Test error')
  }
  
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  )
  
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
})
```

### Loading States
```typescript
it('shows loading state during async operations', async () => {
  render(<AsyncComponent />)
  
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

### User Interactions
```typescript
it('handles user input correctly', async () => {
  const user = userEvent.setup()
  render(<FormComponent />)
  
  await user.type(screen.getByLabelText('Email'), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  expect(screen.getByText('Form submitted')).toBeInTheDocument()
})
```

## 🚨 Test-Driven Bug Fixes

When fixing bugs, **ALWAYS** follow this process:

1. **Write a failing test** that reproduces the bug
2. **Verify the test fails** with current code
3. **Fix the bug** until test passes
4. **Ensure all other tests** still pass
5. **Submit PR** with both fix and test

Example:
```typescript
// 1. Failing test for bug
it('should handle empty file upload gracefully', () => {
  const result = processUpload(null)
  expect(result.error).toBe('File is required')
})

// 2. Fix the bug in processUpload function
// 3. Test now passes
```

## 🎛️ Test Configuration

### Vitest Config (`vitest.config.ts`)
```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80
        }
      }
    }
  }
})
```

### Playwright Config (`playwright-e2e.config.ts`)
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' }
  ]
})
```

## 🔧 Debugging Tests

### Debug Failing Tests
```bash
# Run single test in debug mode
npm run test:debug -- --grep "specific test name"

# Playwright debug mode
npm run test:e2e -- --debug

# Visual debugging
npm run test:e2e -- --headed
```

### Common Issues & Solutions

**Flaky Tests:**
- Use `waitFor()` for async operations
- Mock external dependencies
- Set consistent viewport sizes

**Slow Tests:**
- Mock heavy operations
- Use test-specific data setup
- Parallelize where possible

**Memory Leaks:**
- Clean up event listeners
- Clear timers in tests
- Reset mocks between tests

## 📚 Best Practices

### DO ✅
- Test behavior, not implementation
- Use descriptive test names
- Keep tests independent
- Mock external dependencies
- Test error cases
- Use data-testid for stable selectors

### DON'T ❌
- Test internal implementation details
- Create interdependent tests
- Use production APIs in tests
- Ignore flaky tests
- Skip edge cases
- Use random data without seeds

## 🆘 Getting Help

- **Test failures**: Check CI logs and stack traces
- **Performance issues**: Use test profiling tools
- **E2E flakiness**: Review timing and wait strategies
- **Coverage gaps**: Use coverage reports to identify untested code

**Team Contacts:**
- Test Infrastructure: @team-qa
- CI/CD Issues: @team-devops
- Security Testing: @team-security

---

## 📋 Checklist for Contributors

Before submitting a PR, ensure:

- [ ] All new code has corresponding tests
- [ ] Tests pass locally: `npm run test:all`
- [ ] Coverage thresholds met
- [ ] No console errors in tests
- [ ] E2E tests cover new user flows
- [ ] Visual regression tests for UI changes
- [ ] Security tests for auth/input handling
- [ ] Performance tests for critical paths

**Remember: Tests are not just validation—they're documentation of how our system should behave. Write them with care! 🚀**