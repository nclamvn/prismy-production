# Prismy vNEXT - AI-Powered Document Translation Platform

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-proprietary-red)
![Build](https://img.shields.io/badge/build-passing-green)
![Lighthouse](https://img.shields.io/badge/lighthouse-96%2F100-brightgreen)

## 🚀 Overview

Prismy is an enterprise-grade AI-powered document translation platform built with Next.js 15, TypeScript, and Supabase. Features a clean, NotebookML-inspired UI with exceptional performance and security.

**Live at:** [https://prismy.in](https://prismy.in)

## ✨ Key Features

- **🌍 AI-Powered Translation**: 50+ languages with enterprise accuracy
- **📄 Document Processing**: PDF, DOCX, TXT, XLS support
- **💬 Interactive Chat**: Ask questions about documents in any language
- **🔒 Enterprise Security**: Bank-level encryption, CSP headers, SOC 2 ready
- **⚡ Blazing Fast**: ~197kB bundle, excellent Core Web Vitals
- **🎨 Modern UI**: Clean, accessible NotebookML-inspired design

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3.4 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x + Custom Design System
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Deployment**: Vercel (Edge Functions)
- **State**: React Context + Hooks
- **Components**: Atomic design system with CVA

## 📦 Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/prismy.git
cd prismy-production

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

## 🔧 Environment Setup

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Config
NEXT_PUBLIC_APP_URL=https://prismy.in
NEXT_PUBLIC_APP_NAME=Prismy
NEXT_PUBLIC_APP_VERSION=2.0.0

# Database
DATABASE_URL=postgresql://...
```

## 📁 Project Structure

```
prismy-production/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── workspace/         # Protected workspace
│   ├── api/              # API routes
│   └── (auth)/           # Auth pages
├── components/            # React components
│   ├── ui/               # Atomic UI (Button, Input, etc)
│   ├── auth/             # Auth components
│   ├── workspace/        # Workspace features
│   └── layouts/          # Layout components
├── lib/                   # Utilities & services
│   ├── supabase.ts       # Supabase client
│   ├── utils.ts          # Helper functions
│   └── design-tokens.ts  # Design system
├── styles/               # Global styles
├── public/               # Static assets
└── scripts/              # Build & utility scripts
```

## 🚀 Development

```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## 📊 Performance Metrics

### Lighthouse Scores (Average: 96/100)
- 🟢 **Performance**: 92/100
- 🟢 **Accessibility**: 98/100
- 🟢 **Best Practices**: 95/100
- 🟢 **SEO**: 100/100

### Core Web Vitals
- **FCP**: 1.2s (Good)
- **LCP**: 1.8s (Good)
- **TTI**: 2.1s (Good)
- **CLS**: 0.02 (Excellent)

### Bundle Size
- Landing: 197kB
- Workspace: 199kB
- Shared chunks: 191kB

## 🎨 Design System

NotebookML-inspired minimal design:
- **Colors**: 8 grays + 2 indigo accents
- **Typography**: System font stack
- **Spacing**: 4px grid system
- **Components**: 20+ reusable components
- **Animations**: CSS-only, reduced motion support

## 🔒 Security Features

- Content Security Policy (CSP) with nonces
- HTTPS enforced with HSTS
- Secure authentication (Supabase Auth)
- Input validation & sanitization
- No exposed secrets or API keys
- Regular security audits

## 🌐 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Production Checklist

Run the production readiness check:

```bash
npm run production-check
```

Ensures:
- ✅ Environment configured
- ✅ Build succeeds
- ✅ Security headers set
- ✅ Performance targets met
- ✅ SEO optimized
- ✅ Monitoring ready

## 📈 Monitoring

- **Health Check**: `/api/health`
- **Metrics**: Performance monitoring built-in
- **Error Tracking**: Global error boundaries
- **Analytics**: Privacy-focused analytics

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "auth"

# E2E tests
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📝 License

Copyright © 2024 Prismy. All rights reserved.

This is proprietary software. Unauthorized copying, modification, or distribution is strictly prohibited.

## 📧 Support

- Email: support@prismy.in
- Documentation: [docs.prismy.in](https://docs.prismy.in)
- Status: [status.prismy.in](https://status.prismy.in)

---

Built with ❤️ by the Prismy team using [Claude Code](https://claude.ai/code)