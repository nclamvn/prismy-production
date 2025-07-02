# Prismy - Enterprise Document Processing Platform

> AI-powered document processing with semantic search, multi-locale support, and enterprise-grade security.

[![Build Status](https://github.com/prismy/prismy-production/workflows/CI/badge.svg)](https://github.com/prismy/prismy-production/actions)
[![Quality Gate](https://github.com/prismy/prismy-production/workflows/Quality%20Checks/badge.svg)](https://github.com/prismy/prismy-production/actions)
[![Visual Tests](https://github.com/prismy/prismy-production/workflows/Visual%20Testing/badge.svg)](https://github.com/prismy/prismy-production/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/prismy/prismy-production.git
cd prismy-production

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev

# Open http://localhost:3000
```

## ✨ Features

### 📄 Document Processing
- **Multi-format Support**: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX
- **OCR Text Extraction**: Advanced optical character recognition
- **Language Detection**: Automatic source language identification
- **AI Translation**: High-quality translation across 5 languages
- **Document Reconstruction**: Maintains original formatting and layout

### 🌍 Multi-locale Support
- **5 Languages**: English, Vietnamese, Japanese, Arabic, Chinese
- **RTL Support**: Proper right-to-left layout for Arabic
- **Cultural Adaptation**: Locale-specific formatting and conventions
- **Dynamic Language Switching**: Real-time interface translation

### 🔍 Smart Search
- **Semantic Search**: Vector-based content understanding
- **Multi-type Indexing**: Search across UI, documents, help, and actions
- **Real-time Suggestions**: AI-powered autocomplete
- **Keyboard Shortcuts**: `Cmd+K` / `Ctrl+K` for instant access
- **Intelligent Caching**: LRU cache with TTL optimization

### 🎨 Modern UI/UX
- **Design System**: Comprehensive token architecture
- **Dark/Light Themes**: Seamless theme switching with flash prevention
- **Framer Motion**: Enterprise-grade animations (≤150ms)
- **Responsive Design**: Mobile-first with progressive enhancement
- **Accessibility**: WCAG 2.1 AA compliance

### ⚡ Performance
- **Bundle Optimization**: Strategic code splitting (7 chunk groups)
- **Font Optimization**: Inter font with FOUT elimination
- **Image Optimization**: Next.js optimized images with AVIF/WebP
- **Caching Strategy**: Multi-layer caching with edge optimization

### 🔒 Enterprise Security
- **Authentication**: Supabase Auth with PKCE flow
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: End-to-end encryption for sensitive documents
- **Audit Logging**: Comprehensive activity tracking
- **Compliance**: SOC 2, GDPR, HIPAA ready

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI/ML**: OpenAI GPT-4, Claude, Custom Vector Engine
- **Search**: Vector embeddings, Semantic similarity
- **Testing**: Playwright, Jest, Percy Visual Testing
- **CI/CD**: GitHub Actions, Vercel

### Project Structure
```
prismy-production/
├── app/                    # Next.js 13+ App Router
│   ├── [locale]/          # Internationalized routing
│   ├── api/               # API routes
│   └── workspace/         # Main application pages
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── motion/           # Framer Motion components
│   ├── search/           # Search functionality
│   └── workspace/        # Workspace-specific components
├── lib/                  # Core utilities and services
│   ├── search/          # Vector search engine
│   ├── i18n/            # Internationalization
│   ├── auth/            # Authentication
│   └── performance/     # Performance optimization
├── hooks/               # Custom React hooks
├── tests/               # Test suites
│   ├── e2e/            # End-to-end tests
│   └── visual/         # Visual regression tests
└── docs/               # Documentation
```

## 📖 Documentation Structure

### 🚀 For Developers

- **[Developer Onboarding](development/DEVELOPER_ONBOARDING.md)** - Complete setup guide for new developers
- **[Coding Standards](development/CODING_STANDARDS.md)** - Code quality guidelines and best practices
- **[Troubleshooting](development/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Technical Documentation](development/TECHNICAL_DOCUMENTATION.md)** - System architecture overview

### 🏗️ Architecture & Design

- **[Folder Structure](architecture/folder-structure.md)** - Project organization guide
- **[API Reference](development/API_REFERENCE.md)** - Complete API documentation
- **[Database Schema](development/DATABASE_SETUP.md)** - Database structure and migrations

### 🚀 Deployment & Operations

- **[Deployment Guide](development/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Environment Setup](development/VERCEL_ENV_SETUP.md)** - Environment variable configuration
- **[Performance Monitoring](development/PERFORMANCE_MONITORING_SETUP.md)** - Monitoring and analytics setup

### 🎨 Design & UI

- **[Design Guidelines](development/DESIGN_GUIDELINES.md)** - UI/UX design principles
- **[NotebookLM Design System](development/NOTEBOOKLM_DESIGN_SYSTEM.md)** - Design system documentation

### 🔐 Security & Compliance

- **[Authentication Setup](development/AUTHENTICATION_SETUP.md)** - Auth configuration guide
- **[Payments Setup](development/PAYMENTS_SETUP.md)** - Payment integration guide
- **[Error Tracking](development/ERROR_TRACKING_SETUP.md)** - Error monitoring setup

## 🔗 Quick Links

### Essential Resources

- [🚀 Getting Started](development/DEVELOPER_ONBOARDING.md#quick-start-checklist)
- [🛠️ Local Development](development/DEVELOPER_ONBOARDING.md#development-environment-setup)
- [🧪 Testing Guide](development/TESTING_GUIDE.md)
- [🔧 Troubleshooting](development/TROUBLESHOOTING.md)

### External Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vercel Deployment](https://vercel.com/docs)

## 📋 Development Workflow

### New Developer Checklist

- [ ] Read [Developer Onboarding Guide](development/DEVELOPER_ONBOARDING.md)
- [ ] Set up local development environment
- [ ] Review [Coding Standards](development/CODING_STANDARDS.md)
- [ ] Understand project [Architecture](architecture/folder-structure.md)
- [ ] Make first contribution

### Daily Development

1. **Start Development**: `npm run dev`
2. **Run Tests**: `npm run test`
3. **Code Quality**: `npm run lint && npm run type-check`
4. **Build Check**: `npm run build`

### Before Deployment

1. **Full Test Suite**: `npm run test:all`
2. **Performance Check**: `npm run analyze`
3. **Security Audit**: `npm audit`
4. **Documentation Update**: Update relevant docs

## 🎯 Key Features Documentation

### Core Features

- **Document Translation**: AI-powered document translation with multiple format support
- **Real-time Collaboration**: Multi-user editing and translation workflows
- **Batch Processing**: Large-scale document processing capabilities
- **Quality Assurance**: AI-powered translation quality assessment

### Technical Features

- **Multi-provider AI**: OpenAI, Anthropic, Google Translate integration
- **Scalable Architecture**: Serverless deployment with edge caching
- **Security First**: End-to-end encryption and compliance features
- **Performance Optimized**: Sub-second response times with intelligent caching

## 🔄 Documentation Updates

### Contributing to Documentation

1. **Find outdated content** - Check for accuracy
2. **Create new guides** - For new features or processes
3. **Improve clarity** - Make complex topics easier to understand
4. **Add examples** - Include code samples and screenshots

### Documentation Standards

- Use clear, concise language
- Include code examples where relevant
- Add troubleshooting sections
- Keep external links updated
- Use proper markdown formatting

## 🆘 Getting Help

### Internal Resources

- **Slack**: #prismy-dev for questions
- **GitHub Issues**: Bug reports and feature requests
- **Code Reviews**: Tag team members for guidance
- **Team Meetings**: Weekly architecture discussions

### External Resources

- **Community Forums**: Stack Overflow, Reddit
- **Official Docs**: Next.js, Supabase, Vercel
- **AI Provider Docs**: OpenAI, Anthropic documentation
- **Payment Docs**: Stripe integration guides

## 📊 Metrics & Monitoring

### Documentation Quality

- **Completeness**: All features documented
- **Accuracy**: Information is up-to-date
- **Usability**: Easy to navigate and understand
- **Feedback**: Regular updates based on team input

### Development Metrics

- **Setup Time**: New developers productive in <2 hours
- **Bug Reports**: Reduced through better documentation
- **Code Quality**: Consistent through standards enforcement
- **Deployment Success**: Reliable through clear guides

---

## 📝 Recent Updates

- ✅ **2024-06-29**: Complete documentation restructure
- ✅ **2024-06-29**: Developer onboarding guide created
- ✅ **2024-06-29**: Folder structure migration completed
- ✅ **2024-06-29**: CI/CD pipeline documentation added
- ✅ **2024-06-29**: Troubleshooting guide expanded

---

**Need to add or update documentation?**
Create a PR with your changes following our [documentation standards](development/CODING_STANDARDS.md#documentation-standards).

**Found an issue?**
Report it in our [GitHub Issues](https://github.com/your-org/prismy/issues) with the `documentation` label.

---

_Last updated: June 29, 2024_
