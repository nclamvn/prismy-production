# 🎨 NotebookLM Design System Documentation

**Complete Design System Implementation for Prismy.in**  
_Version 1.0.1-notebooklm_

## 📋 Overview

This documentation covers the complete NotebookLM-inspired design system implemented across Prismy.in, providing a comprehensive guide for developers, designers, and maintainers.

## 🎯 Design Philosophy

### NotebookLM Aesthetic Principles

- **Clean & Minimal**: Focus on content with minimal visual clutter
- **Intelligent Typography**: Clear hierarchy and excellent readability
- **Subtle Interactions**: Smooth, purposeful animations
- **Adaptive Interface**: Responsive to user preferences and context
- **Material Design 3**: Modern elevation, color, and component patterns

### Core Values

- **Accessibility First**: WCAG 2.1 AA compliance
- **Performance Optimized**: Fast loading and smooth interactions
- **User-Centric**: Designed for translation workflows
- **Culturally Aware**: Support for Vietnamese and international users

## 🎨 Design Tokens

### Color System

#### Primary Palette

```css
:root {
  /* NotebookLM Primary */
  --notebooklm-primary: #0b28ff;
  --notebooklm-primary-light: #4a90e2;
  --notebooklm-primary-dark: #0a1f4a;

  /* Surface Colors */
  --surface-panel: #fbfaf9;
  --surface-elevated: #ffffff;
  --surface-filled: #f7f6f5;
  --surface-outline: #e5e3e0;

  /* Text Colors */
  --text-primary: #1a1a1a;
  --text-secondary: #6b6b6b;
  --text-disabled: #a8a8a8;
  --text-inverse: #ffffff;
}
```

#### Dark Theme

```css
:root[data-theme='dark'] {
  --notebooklm-primary: #7b9eff;
  --surface-panel: #111111;
  --surface-elevated: #1e1e1e;
  --surface-filled: #2a2a2a;
  --surface-outline: #404040;
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --text-disabled: #666666;
}
```

#### Semantic Colors

```css
:root {
  /* Success */
  --success-color: #16a34a;
  --success-background: #f0fdf4;
  --success-border: #bbf7d0;

  /* Warning */
  --warning-color: #d97706;
  --warning-background: #fffbeb;
  --warning-border: #fed7aa;

  /* Error */
  --error-color: #dc2626;
  --error-background: #fef2f2;
  --error-border: #fecaca;

  /* Info */
  --info-color: #2563eb;
  --info-background: #eff6ff;
  --info-border: #bfdbfe;
}
```

### Typography System

#### Font Stack

```css
:root {
  --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  /* Material Design 3 Typography Scale */
  --sys-display-large-font: var(--font-family-base);
  --sys-display-large-size: 57px;
  --sys-display-large-line-height: 64px;
  --sys-display-large-weight: 400;

  --sys-headline-large-font: var(--font-family-base);
  --sys-headline-large-size: 32px;
  --sys-headline-large-line-height: 40px;
  --sys-headline-large-weight: 600;

  --sys-headline-medium-font: var(--font-family-base);
  --sys-headline-medium-size: 28px;
  --sys-headline-medium-line-height: 36px;
  --sys-headline-medium-weight: 600;

  --sys-body-large-font: var(--font-family-base);
  --sys-body-large-size: 16px;
  --sys-body-large-line-height: 24px;
  --sys-body-large-weight: 400;

  --sys-body-medium-font: var(--font-family-base);
  --sys-body-medium-size: 14px;
  --sys-body-medium-line-height: 20px;
  --sys-body-medium-weight: 400;
}
```

### Spacing & Layout

#### Spacing Scale

```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;
}
```

#### Grid System

- **Desktop**: 12-column grid with 24px gutters
- **Tablet**: 8-column grid with 16px gutters
- **Mobile**: 4-column grid with 16px gutters
- **Max Width**: 1440px centered container

### Elevation & Shadows

#### Material Design 3 Elevation

```css
:root {
  --elevation-level-0: none;
  --elevation-level-1: 0 1px 2px rgba(0, 0, 0, 0.05);
  --elevation-level-2: 0 1px 3px rgba(0, 0, 0, 0.1);
  --elevation-level-3: 0 4px 8px rgba(0, 0, 0, 0.1);
  --elevation-level-4: 0 8px 24px rgba(0, 0, 0, 0.12);
  --elevation-level-5: 0 16px 32px rgba(0, 0, 0, 0.16);
}
```

#### Border Radius

```css
:root {
  --mat-card-elevated-container-shape: 12px;
  --mat-button-shape: 8px;
  --mat-input-shape: 8px;
  --mat-dialog-shape: 16px;
}
```

## 🧩 Component Library

### Core Components

#### Button Component

```typescript
interface ButtonProps {
  variant: 'filled' | 'outlined' | 'text'
  size: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
}
```

**Usage:**

```tsx
<Button variant="filled" size="md">
  Get Started
</Button>
```

**Styling:**

- Uses NotebookLM primary color
- Smooth hover animations
- Loading states with spinner
- Keyboard focus indicators

#### Input Component

```typescript
interface InputProps {
  label?: string
  placeholder?: string
  error?: string
  required?: boolean
  type?: 'text' | 'email' | 'password'
}
```

**Features:**

- Floating label animation
- Error state styling
- Dark mode support
- ARIA accessibility

#### Dialog Component

```typescript
interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}
```

**Features:**

- Backdrop blur effect
- Smooth entrance/exit animations
- Focus management
- Escape key handling

### Layout Components

#### MainLayout

- Responsive navigation header
- Sidebar for authenticated pages
- Footer with links
- Mobile-optimized menu

#### Hero Section

- Gradient background effects
- Animated text reveal
- CTA button placement
- Mobile responsive

### NotebookLM-Specific Components

#### ThemeToggle

- System preference detection
- Smooth animation between modes
- Persistence in localStorage
- Icon morphing animation

#### AccessibilityPanel

- High contrast mode
- Reduced motion preference
- Font size adjustment
- Screen reader optimization

#### Toast Notifications

- Success, warning, error, info types
- Auto-dismiss functionality
- Action buttons
- Stacking behavior

## 🎭 Animation System

### Motion Principles

- **Easing**: `cubic-bezier(0.2, 0, 0, 1)` (NotebookLM timing)
- **Durations**:
  - Short: 150ms (micro-interactions)
  - Medium: 300ms (component states)
  - Long: 500ms (page transitions)

### Animation Variants

```typescript
export const notebookLMButton = {
  whileHover: {
    y: -1,
    scale: 1.02,
    transition: {
      duration: 0.15,
      ease: [0.2, 0, 0, 1],
    },
  },
}

export const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.2, 0, 0, 1],
    },
  },
}
```

### Performance Optimizations

- GPU-accelerated transforms
- `will-change` optimization
- Reduced motion respect
- Intersection observer triggers

## 🌐 Internationalization

### Language Support

- **Primary**: Vietnamese (vi)
- **Secondary**: English (en)
- **Planned**: Chinese, Japanese, Korean

### RTL Support

- CSS logical properties
- Direction-aware animations
- Text alignment handling
- Icon mirroring

## ♿ Accessibility Features

### WCAG 2.1 AA Compliance

- **Color Contrast**: 4.5:1 minimum ratio
- **Keyboard Navigation**: Full tab sequence
- **Screen Readers**: ARIA labels and descriptions
- **Focus Management**: Visible focus indicators

### Inclusive Design

- **Touch Targets**: 44px minimum size
- **Motion Preferences**: Reduced motion support
- **High Contrast**: System preference detection
- **Font Scaling**: Supports up to 200% zoom

### Testing Tools

- axe-core integration
- Lighthouse accessibility audits
- Manual keyboard testing
- Screen reader validation

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile First Approach */
@media (min-width: 640px) {
  /* sm */
}
@media (min-width: 768px) {
  /* md */
}
@media (min-width: 1024px) {
  /* lg */
}
@media (min-width: 1280px) {
  /* xl */
}
@media (min-width: 1536px) {
  /* 2xl */
}
```

### Mobile Optimizations

- Touch-friendly interactions
- Gesture support (swipe, pinch)
- Performance considerations
- Battery usage optimization

## 🔧 Implementation Guide

### Getting Started

1. Import design tokens: `@/styles/globals.css`
2. Use components: `@/components/ui/`
3. Apply animations: `@/lib/motion.ts`
4. Follow patterns: Reference existing components

### Code Examples

#### Creating a NotebookLM-styled Component

```tsx
import { motion } from 'framer-motion'
import { slideUp } from '@/lib/motion'

export function MyComponent() {
  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      className="p-6 rounded-lg"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        border: '1px solid var(--surface-outline)',
        borderRadius: 'var(--mat-card-elevated-container-shape)',
        boxShadow: 'var(--elevation-level-2)',
      }}
    >
      <h2
        style={{
          fontSize: 'var(--sys-headline-medium-size)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        NotebookLM Component
      </h2>

      <p
        style={{
          fontSize: 'var(--sys-body-large-size)',
          color: 'var(--text-secondary)',
          lineHeight: 'var(--sys-body-large-line-height)',
        }}
      >
        Content with proper typography and spacing.
      </p>
    </motion.div>
  )
}
```

#### Using Theme Context

```tsx
import { useTheme } from '@/components/theme/ThemeProvider'

export function ThemedComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      style={{
        backgroundColor: 'var(--notebooklm-primary)',
        color: 'var(--text-inverse)',
      }}
    >
      Toggle Theme
    </button>
  )
}
```

## 📊 Performance Guidelines

### Bundle Size Targets

- **JavaScript**: < 500KB total
- **CSS**: < 50KB total
- **Images**: WebP/AVIF formats
- **Fonts**: Subset and preload

### Core Web Vitals Targets

- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

### Optimization Techniques

- Code splitting by route
- Lazy loading non-critical components
- Image optimization and sizing
- CDN for static assets

## 🧪 Testing Strategy

### Unit Testing

- Component rendering
- User interactions
- Accessibility attributes
- Theme switching

### Integration Testing

- User flows
- Form submissions
- Navigation patterns
- API interactions

### Visual Testing

- Cross-browser compatibility
- Responsive layouts
- Dark mode rendering
- Animation smoothness

## 🚀 Deployment

### Production Checklist

- [ ] All components use design tokens
- [ ] Accessibility audit passed
- [ ] Performance budget met
- [ ] Cross-browser tested
- [ ] Mobile optimized
- [ ] Dark mode functional
- [ ] Animations respect preferences

### Monitoring

- Core Web Vitals tracking
- Error boundary reporting
- User interaction analytics
- Component performance metrics

## 📚 Resources

### Design References

- [NotebookLM Official](https://notebooklm.google.com)
- [Material Design 3](https://m3.material.io)
- [Inter Font Family](https://rsms.me/inter/)

### Development Tools

- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)

### Accessibility Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Testing](https://github.com/dequelabs/axe-core)
- [ARIA Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)

---

_Generated by Phase 10: Post-Launch Optimization & Analytics_  
_Prismy Design System v1.0.1-notebooklm_
