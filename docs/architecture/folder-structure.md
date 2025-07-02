# 📁 Prismy Folder Structure

## Overview

Prismy follows a modern, scalable folder structure optimized for Next.js 15 and production deployment.

## Root Structure

```
prismy-production/
├── 📱 app/                     # Next.js App Router pages & API routes
├── 🧩 components/              # Reusable React components
├── 📚 lib/                     # Business logic & utilities
├── 🎣 hooks/                   # Custom React hooks
├── 🎨 styles/                  # Global CSS & design tokens
├── 🔧 config/                  # Configuration files (NEW)
├── 📜 scripts/                 # Build & utility scripts
├── 🧪 tests/                   # Test files
├── 📖 docs/                    # Documentation (ORGANIZED)
├── 🔒 .github/                 # GitHub workflows
├── 🌍 public/                  # Static assets
├── 🏷️  types/                   # TypeScript type definitions
└── 📄 Root files (minimal)     # Essential files only
```

## Configuration Directory (`config/`)

### `config/build/`

- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `postcss.config.mjs` - PostCSS configuration

### `config/deployment/`

- `vercel.json` - Vercel deployment settings
- `lighthouserc.json` - Lighthouse CI configuration
- `scripts/` - Deployment scripts

### `config/database/`

- `supabase/` - Supabase configurations & migrations
- `*.sql` - Database setup scripts

### `config/testing/`

- `jest.config.js` - Jest testing configuration
- `jest.setup.js` - Jest setup file
- `playwright.config.ts` - Playwright E2E configuration

## Documentation Directory (`docs/`)

### `docs/development/`

- Setup guides, API documentation, technical docs

### `docs/deployment/`

- Deployment checklists, CI/CD documentation

### `docs/api/`

- API reference documentation

### `docs/architecture/`

- System architecture, folder structure documentation

## Key Features

### ✅ Benefits

- **Clean Root**: Only essential files in root directory
- **Logical Grouping**: Related files organized together
- **Proxy Configs**: Root configs proxy to organized locations
- **Scalable**: Structure supports project growth
- **Maintainable**: Clear ownership and organization

### 🔧 Proxy Files

Root configuration files proxy to their organized locations:

- `next.config.js` → `config/build/next.config.js`
- `tailwind.config.ts` → `config/build/tailwind.config.ts`
- `tsconfig.json` → `config/build/tsconfig.json`

### 📦 Build Compatibility

All build tools work seamlessly with the new structure through proxy files and updated script paths.

## Migration Notes

- ✅ All configurations moved to `config/` directory
- ✅ Documentation organized by purpose
- ✅ Build scripts updated for new paths
- ✅ Proxy files maintain compatibility
- ✅ Removed temporary and redundant files

This structure provides a solid foundation for continued development and scaling.
