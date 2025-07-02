# 🚀 Developer Onboarding Guide - Prismy

Welcome to the Prismy development team! This comprehensive guide will get you up and running quickly.

## 📋 Quick Start Checklist

### Prerequisites

- [ ] Node.js 18.17.0+ installed
- [ ] npm 9.0.0+ installed
- [ ] Git configured
- [ ] VSCode with recommended extensions
- [ ] Access to Supabase project
- [ ] Access to Vercel project

### Initial Setup

- [ ] Clone repository
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Run development server
- [ ] Verify build process
- [ ] Run test suite

---

## 🛠️ Development Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/prismy-production.git
cd prismy-production
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy and configure environment variables:

```bash
cp .env.example .env.local
```

**Required Environment Variables:**

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_TRANSLATE_API_KEY=your_google_translate_key

# Payments
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Monitoring
SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
```

### 4. Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

---

## 🏗️ Project Architecture

### Folder Structure

```
prismy-production/
├── 📱 app/           # Next.js App Router (pages & APIs)
├── 🧩 components/    # React components
├── 📚 lib/           # Business logic
├── 🎣 hooks/         # Custom hooks
├── 🎨 styles/        # Global styles
├── 🔧 config/        # Configuration files
├── 📜 scripts/       # Build scripts
├── 🧪 tests/         # Test files
├── 📖 docs/          # Documentation
└── 🌍 public/        # Static assets
```

### Key Technologies

- **Frontend**: React 18, Next.js 15, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **AI**: OpenAI, Anthropic Claude
- **Monitoring**: Sentry
- **Deployment**: Vercel

---

## 🚀 Development Workflow

### Daily Development

1. **Pull latest changes**

   ```bash
   git pull origin main
   ```

2. **Create feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes with hot reload**

   ```bash
   npm run dev
   ```

4. **Run tests**

   ```bash
   npm run test
   npm run test:e2e
   ```

5. **Build verification**
   ```bash
   npm run build
   ```

### Code Quality

- **Linting**: `npm run lint`
- **Formatting**: `npm run format`
- **Type checking**: `npm run type-check`
- **Full test suite**: `npm run test:all`

### Git Workflow

- Create feature branches from `main`
- Use conventional commits: `feat:`, `fix:`, `docs:`
- Squash commits before merging
- All PRs require review + CI passing

---

## 🧪 Testing Strategy

### Unit Tests (Jest)

```bash
npm run test:unit       # Run unit tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### E2E Tests (Playwright)

```bash
npm run test:e2e        # Run E2E tests
npm run test:e2e:ui     # Visual test runner
```

### Test File Locations

- Unit tests: `*.spec.ts` files
- E2E tests: `tests/` directory
- Mocks: `__mocks__/` directories

---

## 🔧 Configuration Files

### Build Configurations

- `config/build/next.config.js` - Next.js configuration
- `config/build/tailwind.config.ts` - Tailwind CSS
- `config/build/tsconfig.json` - TypeScript

### Testing Configurations

- `config/testing/jest.config.js` - Jest setup
- `config/testing/playwright.config.ts` - E2E testing

### Deployment Configurations

- `config/deployment/vercel.json` - Vercel settings
- `config/deployment/lighthouserc.json` - Performance audits

---

## 🎯 Common Development Tasks

### Adding New Components

1. Create component in `components/[category]/`
2. Add TypeScript interfaces
3. Include tests
4. Update exports in `index.ts`

### Creating API Endpoints

1. Add route in `app/api/[path]/route.ts`
2. Implement HTTP methods (GET, POST, etc.)
3. Add error handling
4. Include API documentation

### Database Changes

1. Create migration in `config/database/supabase/migrations/`
2. Test locally with Supabase CLI
3. Update TypeScript types
4. Document schema changes

### Adding New Features

1. Plan architecture and data flow
2. Create components and API endpoints
3. Add comprehensive tests
4. Update documentation
5. Performance testing

---

## 🐛 Debugging Guide

### Common Issues

**Build Failures:**

- Check TypeScript errors: `npm run type-check`
- Verify imports and exports
- Clear `.next` cache: `npm run clean`

**Database Issues:**

- Verify Supabase connection
- Check RLS policies
- Review migration status

**Authentication Problems:**

- Verify environment variables
- Check Supabase Auth settings
- Review redirect URLs

**Performance Issues:**

- Run Lighthouse audit: `npm run analyze`
- Check bundle size
- Profile components

### Debug Tools

- React DevTools
- Next.js DevTools
- Supabase Dashboard
- Sentry Error Tracking
- Vercel Analytics

---

## 📚 Key Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Stripe API](https://stripe.com/docs/api)

### Internal Docs

- `docs/api/` - API Reference
- `docs/architecture/` - System Architecture
- `docs/deployment/` - Deployment Guide
- `TECHNICAL_DOCUMENTATION.md` - Technical Overview

### Team Resources

- Slack: #prismy-dev
- Code Review Guidelines: See PR template
- Design System: Figma workspace
- API Docs: `/api-docs` endpoint

---

## 🚀 Deployment Process

### Development Deployment

- Every PR creates preview deployment
- Auto-deploys to staging on `develop` branch
- Production deploys on `main` branch merge

### CI/CD Pipeline

- **Quality Checks**: Lint, type-check, tests
- **Security Scans**: Dependency audit, CodeQL
- **Performance**: Lighthouse, bundle analysis
- **Monitoring**: Health checks, alerts

### Release Process

1. Feature development on branches
2. PR review and approval
3. Merge to `develop` → staging deployment
4. QA testing on staging
5. Merge to `main` → production deployment

---

## 🎓 Learning Path

### Week 1: Environment & Basics

- [ ] Complete setup checklist
- [ ] Explore codebase structure
- [ ] Run development server
- [ ] Make first small change
- [ ] Understand build process

### Week 2: Core Features

- [ ] Study authentication flow
- [ ] Understand document processing
- [ ] Learn translation service
- [ ] Review database schema
- [ ] Practice debugging

### Week 3: Advanced Topics

- [ ] Performance optimization
- [ ] Security best practices
- [ ] Testing strategies
- [ ] Deployment process
- [ ] Monitoring and alerts

### Week 4: Contribution

- [ ] Pick first ticket
- [ ] Submit first PR
- [ ] Code review process
- [ ] Feature implementation
- [ ] Documentation updates

---

## 🆘 Getting Help

### Quick Help

- Check this documentation first
- Search existing issues/PRs
- Review error logs and console

### Team Support

- **Slack**: #prismy-dev for questions
- **Code Review**: Tag senior developers
- **Architecture**: Schedule design discussion
- **Urgent Issues**: Contact team lead

### External Resources

- Stack Overflow for general questions
- GitHub Issues for bug reports
- Community forums for framework help

---

## ✅ Success Metrics

You'll know you're ready when you can:

- [ ] Set up development environment independently
- [ ] Navigate codebase confidently
- [ ] Make changes without breaking builds
- [ ] Write tests for your code
- [ ] Debug common issues
- [ ] Follow team coding standards
- [ ] Deploy changes safely

**Welcome to the team! 🎉**

---

_Last updated: $(date)_
_Need updates? Edit this file and submit a PR._
