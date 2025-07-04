# 🚀 Prismy v2 - Greenfield Rebuild

**Modern document translation platform built with Next.js 15, TypeScript 5, and Tailwind CSS.**

This is a complete architectural rebuild of Prismy, designed to address technical debt and implement modern development practices.

## 🎯 Project Overview

Prismy v2 is a 14-day sprint to rebuild the document translation platform with:

- **Clean Architecture**: No legacy CSS or technical debt
- **Modern Stack**: Next.js 15 + TypeScript 5 + Tailwind CSS 3.4
- **Quality Gates**: 80% test coverage, strict linting, visual regression testing
- **Simple Auth**: Email-first authentication (no OAuth complexity)
- **Real-time Features**: Supabase Realtime for job tracking

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3.5 with App Router
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 3.4 + shadcn/ui components
- **Database**: Supabase with Row Level Security
- **Testing**: Vitest + Playwright + Percy visual regression
- **Development**: Turbopack for fast dev server

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server with Turbopack
npm run dev

# Open http://localhost:3000
```

## 📋 Available Scripts

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript check
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage
npm run doctor       # Health check (type-check + lint + build)
```

## 🎯 Sprint Progress

### ✅ Day 1 Complete
- [x] Next.js 15 skeleton with TypeScript 5
- [x] Tailwind CSS 3.4 + shadcn/ui setup
- [x] Essential UI components (button, input, card, dialog)
- [x] Clean homepage with MVP design
- [x] Build verification and project structure

### 🔄 Upcoming
- **Day 2**: Supabase email authentication
- **Day 3**: 3-pane responsive grid layout
- **Day 4**: Chunked file upload system
- **Day 5**: Translation worker stub

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   └── ui/             # shadcn/ui components
└── lib/                # Utilities and configurations

public/                 # Static assets
```

## 🔧 Configuration

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended rules
- **Tailwind**: Utility-first CSS with design tokens
- **shadcn/ui**: Modern component library

## 🎨 Design System

Built with shadcn/ui components using:
- **Colors**: Neutral palette with semantic tokens
- **Typography**: Modern font stack with proper hierarchy
- **Spacing**: Consistent spacing scale
- **Responsive**: Mobile-first approach

## 📊 Quality Standards

- **Type Safety**: 100% TypeScript with strict mode
- **Testing**: 80% coverage requirement
- **Performance**: Lighthouse score ≥85
- **Accessibility**: WCAG 2.1 compliance
- **Security**: RLS policies, CSP headers

## 🚦 Quality Gates

All PRs must pass:
- ✅ TypeScript compilation
- ✅ ESLint checks  
- ✅ Unit tests
- ✅ E2E tests
- ✅ Percy visual regression
- ✅ Bundle size check

## 📈 Progress Tracking

Current Status: **Day 1 Complete - Foundation Ready**

Next Milestone: Email authentication system (Day 2)

---

Built with modern tools for a better developer experience and production reliability.
