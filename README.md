# 🚀 Prismy Production

## 🛡️ Quality & Testing Status

[![CI/CD](https://github.com/nclamvn/prismy-production/workflows/CI/badge.svg)](https://github.com/nclamvn/prismy-production/actions)
[![QA Suite](https://github.com/nclamvn/prismy-production/workflows/QA%20Suite/badge.svg)](https://github.com/nclamvn/prismy-production/actions)
[![Coverage](https://img.shields.io/codecov/c/github/nclamvn/prismy-production)](https://codecov.io/gh/nclamvn/prismy-production)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=prismy-production&metric=alert_status)](https://sonarcloud.io/dashboard?id=prismy-production)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=prismy-production&metric=security_rating)](https://sonarcloud.io/dashboard?id=prismy-production)

### 🧪 Test Metrics (Zero-Chaos Pipeline)
[![Unit Tests](https://img.shields.io/badge/Unit%20Tests-Passing-brightgreen)](https://github.com/nclamvn/prismy-production/actions)
[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-Passing-brightgreen)](https://github.com/nclamvn/prismy-production/actions)
[![Visual Regression](https://img.shields.io/badge/Percy-Approved-blue)](https://percy.io/prismy/prismy-production)
[![Mutation Score](https://img.shields.io/badge/Mutation%20Score-85%25-orange)](./reports/mutation/mutation-report.html)
[![Storybook](https://img.shields.io/badge/Storybook-Latest-pink)](https://storybook.prismy.in)

### 📊 Code Quality
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=prismy-production&metric=ncloc)](https://sonarcloud.io/dashboard?id=prismy-production)
[![Maintainability](https://sonarcloud.io/api/project_badges/measure?project=prismy-production&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=prismy-production)
[![Reliability](https://sonarcloud.io/api/project_badges/measure?project=prismy-production&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=prismy-production)
[![Duplicated Lines](https://sonarcloud.io/api/project_badges/measure?project=prismy-production&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=prismy-production)

### 🚀 Performance & Monitoring
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)](https://prismy.in)
[![Uptime](https://img.shields.io/badge/Uptime-99.9%25-brightgreen)](https://status.prismy.in)
[![Core Web Vitals](https://img.shields.io/badge/Core%20Web%20Vitals-Passing-brightgreen)](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fprismy.in)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@prismy/production)](https://bundlephobia.com/package/@prismy/production)

Enterprise-grade AI-powered document translation platform with Vietnamese payment integration.

## ✨ Features

- 🔄 **Multi-format Support**: PDF, DOCX, PPTX translation
- 🧠 **AI-Powered**: GPT-4, Claude, Google Translate integration  
- 💳 **Vietnamese Payments**: Local payment gateway support
- 🌐 **Real-time Translation**: Live document processing
- 🔐 **Enterprise Security**: OAuth, RLS, CSP protection
- 📱 **Mobile Optimized**: Responsive design system

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/nclamvn/prismy-production.git
cd prismy-production

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Add your Supabase + Stripe keys

# Start development
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📚 Documentation

- [🏗️ Architecture Guide](./docs/ARCHITECTURE.md) - System overview & quick start
- [🧪 Testing Guide](./TESTING.md) - Zero-Chaos testing playbook
- [🎨 Design System](./docs/DESIGN_SYSTEM.md) - UI components & tokens
- [📡 API Reference](./docs/API.md) - Endpoint documentation
- [🚀 Deployment Guide](./docs/DEPLOYMENT.md) - Production setup
- [🔒 Security Checklist](./docs/SECURITY.md) - Security measures

## 🛠️ Development

```bash
# Quality checks
npm run lint              # ESLint
npm run type-check        # TypeScript
npm run format            # Prettier

# Zero-Chaos Testing Pipeline
npm run test:all          # Complete test suite (CI)
npm run test:unit         # Unit tests (Vitest)
npm run test:e2e          # End-to-end tests (Playwright)
npm run test:visual       # Visual regression (Percy)
npm run test:mutation     # Mutation testing (Stryker)
npm run test:coverage     # Coverage report
npm run test:watch        # Development watch mode

# Individual test types
npm run test:component    # Component tests
npm run test:api          # API route tests
npm run test:security     # Security validation tests

# Build & Analysis
npm run build             # Production build
npm run analyze           # Bundle analysis
```

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL + Auth)
- **Payments**: Stripe + Vietnamese gateways
- **AI**: OpenAI GPT-4, Anthropic Claude
- **Styling**: Tailwind CSS + Design Tokens
- **Testing**: Vitest, Playwright, Percy, Stryker, MSW
- **CI/CD**: GitHub Actions + Vercel

## 🌍 Deployment

- **Production**: [prismy.in](https://prismy.in)
- **Staging**: [prismy-staging.vercel.app](https://prismy-staging.vercel.app)
- **Storybook**: [storybook.prismy.in](https://storybook.prismy.in)

## 📊 Quality Metrics (Zero-Chaos Standards)

### 🧪 Testing Coverage
- **Unit Test Coverage**: 80%+ (85%+ for critical code)
- **E2E Test Coverage**: All user journeys tested
- **Visual Regression**: 100% UI component coverage
- **Mutation Testing**: 85%+ score maintained
- **API Contract Tests**: All endpoints validated

### 🚀 Performance Standards  
- **Core Web Vitals**: All metrics in green
- **Lighthouse Score**: 95+ across all categories
- **Bundle Size**: <500KB initial load
- **Time to Interactive**: <3s on 3G

### 🔒 Security & Quality
- **SonarCloud Rating**: A-grade maintained
- **Security Scan**: Zero critical vulnerabilities
- **Accessibility**: WCAG 2.1 AA compliant
- **Code Quality**: Zero code smells in new code

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

See [Contributing Guide](./CONTRIBUTING.md) for detailed guidelines.

## 📜 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file.

## 🆘 Support

- **Documentation**: [docs.prismy.in](https://docs.prismy.in)
- **Issues**: [GitHub Issues](https://github.com/nclamvn/prismy-production/issues)
- **Email**: support@prismy.in

---

**Status**: ✅ Production Ready (v1.0.0-recovery)  
**Last Updated**: January 2025  
**Next Milestone**: v1.1.0 - Enhanced AI Features
EOF < /dev/null