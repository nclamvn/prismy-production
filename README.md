# Prismy - Production-Ready AI Translation Platform

> ⚠️ **IMPORTANT:** This is the MAIN project directory. Always work from `/Users/mac/prismy/prismy-production`
>
> 🌐 **Live at:** https://prismy.in

## 🚀 Overview

A clean, token-driven, componentized UI for Prismy's AI-powered translation platform. This production-ready codebase fuses semantic CSS with utility classes, following modern web development best practices.

## 🛠 Tech Stack

- **Framework**: Next.js 15 / React 18 / TypeScript
- **Styling**: Tailwind CSS v3 with `@apply`, design tokens, semantic classes
- **Components**: Custom components with shadcn/ui patterns
- **Animations**: Framer Motion with accessibility-aware variants
- **Icons**: Radix UI icons
- **Testing**: Playwright for E2E testing
- **Performance**: Core Web Vitals optimized (≥95 score target)

## 🎨 Design System

### Color Palette

- **95% Grayscale**: From `#0d0d0d` (black) to `#ffffff` (white)
- **5% Rainbow Accent**: Gradient laser effect for highlights
- **Glassmorphism**: Backdrop blur header with 75% opacity

### Design Tokens

All design decisions are driven by CSS custom properties and Tailwind theme extensions:

```css
:root {
  /* Color scale */
  --black: #0d0d0d;
  --gray-900: #111;
  /* ... */
  --white: #ffffff;

  /* Accent laser */
  --accent-rainbow: linear-gradient(
    90deg,
    #ff5757 0%,
    #ffca46 25%,
    #34d97b 45%,
    #45b2ff 65%,
    #c47bff 85%,
    #ff5790 100%
  );

  /* Radius, shadows, spacing, typography, durations... */
}
```

## 📁 File Structure

```
app/
├── layout.tsx          # Root layout with glass header & rainbow bar
├── page.tsx           # Landing page (Hero → Templates → Workbench → Stats → Footer)
├── globals.css        # Global styles importing tokens
components/
├── Navbar.tsx         # Glass header with rainbow bar animation
├── Hero.tsx           # Hero section with rainbow gradient text
├── TemplateChip.tsx   # Template selection chips
├── Workbench.tsx      # 2-column translation interface
├── StatCard.tsx       # Feature cards and community stats
├── Footer.tsx         # Footer with newsletter signup
└── ui/
    └── Button.tsx     # Reusable button component
styles/
├── globals.css        # Tailwind imports + semantic component classes
└── tokens.css         # Design system CSS custom properties
lib/
├── motion.ts          # Framer Motion variants helper
└── utils.ts           # Utility functions (cn, date formatting, etc.)
tests/
└── translation.spec.ts # Playwright E2E tests
```

## 🎭 Component Architecture

### Semantic + Utility Hybrid

Components use semantic wrapper classes powered by `@apply` utilities:

```css
.btn-primary {
  @apply btn-base bg-gray-900 text-white hover:bg-gray-800 
         focus:ring-gray-900 active:scale-[0.98];
}

.template-chip {
  @apply inline-flex items-center px-4 py-2 
         rounded-full border border-gray-200 
         text-sm font-medium text-gray-700 
         hover:border-gray-300 hover:bg-gray-50 
         transition-[var(--transition-base)] cursor-pointer
         active:scale-[0.98];
}
```

### Accessibility Features

- **WCAG 2.1 AA Compliant**: All interactive elements have proper ARIA labels
- **Keyboard Navigation**: Full tab-through support with focus indicators
- **Reduced Motion**: `prefers-reduced-motion` disables animations
- **Screen Reader**: Semantic HTML and descriptive text

### Animation System

Framer Motion variants with motion-safe wrapper:

```typescript
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

// Motion-safe wrapper disables animations for reduced motion users
export const motionSafe = (variants: Variants): Variants => {
  if (!getMotionPreference()) return { hidden: {}, visible: {} }
  return variants
}
```

## 🌐 Key Features

### Translation Workbench

- **2-column grid**: Source and target language panels (1-column on mobile)
- **Language Selection**: Dropdown menus with auto-detect for source
- **Quality Tiers**: Free, Standard, Premium, Enterprise options
- **Real-time Features**: Character count, language swap, loading states

### Template Chips

Interactive category selection for optimized translation models:

- Business, Academic, Legal, Medical, Creative, Technical
- Staggered animations with hover and tap feedback

### Performance Optimizations

- **Lazy Loading**: Fonts, images, and code splitting
- **Static Generation**: Pre-rendered at build time
- **Optimized Bundle**: 50.7 kB page size, 151 kB First Load JS
- **Core Web Vitals**: Designed for ≥95 Lighthouse scores

## 🧪 Testing

### Playwright E2E Tests

Comprehensive test coverage for translation functionality:

```bash
npm run test      # Run all tests
npm run test:ui   # Run tests with UI mode
```

Test scenarios include:

- Translation workflow (input → translate → output)
- Character counting and validation
- Quality tier selection
- Language swapping
- Keyboard accessibility
- Loading states and error handling

## 🚀 Getting Started

### Development

```bash
npm install
npm run dev      # Start development server
```

### Production Build

```bash
npm run build    # Build for production
npm start        # Start production server
```

### Testing

```bash
npm run test     # Run Playwright tests
```

## 📱 Responsive Design

Breakpoint system optimized for all devices:

- **Mobile**: < 768px (1-column workbench)
- **Tablet**: 768px - 1023px
- **Desktop**: ≥ 1024px (2-column workbench)

## 🔧 Configuration

### Tailwind Config

Links design tokens to Tailwind theme:

```typescript
theme: {
  extend: {
    colors: {
      gray: {
        100: 'var(--gray-100)',
        // ... maps to CSS custom properties
      }
    },
    backgroundImage: {
      'accent-rainbow': 'var(--accent-rainbow)'
    }
    // ... all tokens mapped
  }
}
```

## 🎯 Production Checklist

- ✅ **Build Success**: Zero TypeScript errors
- ✅ **Performance**: Optimized bundle size and Core Web Vitals
- ✅ **Accessibility**: WCAG 2.1 AA compliant
- ✅ **Testing**: E2E test coverage with Playwright
- ✅ **Design System**: Token-driven, consistent styling
- ✅ **Responsive**: Mobile-first, adaptive design
- ✅ **Animations**: Motion-safe with reduced-motion support
- ✅ **SEO**: Proper metadata and semantic HTML

## 📄 License

© 2024 Prismy. All rights reserved.

---

**Ready for production deployment** 🚀# Deployment trigger Sat Jun 21 01:57:40 +07 2025
Deployment trigger: Sat Jun 21 02:03:43 +07 2025
