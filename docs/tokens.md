# Prismy Design System - Design Tokens

This document outlines the design tokens that form the foundation of the Prismy Design System. These tokens ensure consistency, scalability, and maintainability across the entire application.

## 🎨 Color System

### Primary Brand Colors
Our primary color palette is built around a sophisticated blue that conveys trust, professionalism, and innovation.

- **Primary 500**: `#0ea5e9` - Main brand color
- **Primary 600**: `#0284c7` - Interactive states
- **Primary 700**: `#0369a1` - Hover states

### Neutral Colors
A comprehensive grayscale system for text, backgrounds, and borders.

- **Neutral 0**: `#ffffff` - Pure white
- **Neutral 50**: `#f9fafb` - Light backgrounds
- **Neutral 900**: `#111827` - Primary text
- **Neutral 950**: `#030712` - Highest contrast

### Semantic Colors
Purposeful colors for communicating system states and user feedback.

- **Success**: Green palette for positive actions and confirmations
- **Warning**: Orange/yellow palette for cautionary messages
- **Error**: Red palette for errors and destructive actions
- **Info**: Blue palette for informational content

## 📏 Spacing System

Our spacing system is based on a **4px base unit** (0.25rem) to ensure consistent rhythm and alignment.

### Key Spacing Values
- **1** (4px): Minimal spacing for tight layouts
- **2** (8px): Small gaps between related elements
- **4** (16px): Standard spacing for most components
- **6** (24px): Medium spacing for sections
- **8** (32px): Large spacing for major sections
- **12** (48px): Extra large spacing for page-level separation

## ✍️ Typography System

### Font Families
- **Sans**: Inter, system-ui, sans-serif (primary)
- **Mono**: JetBrains Mono, Consolas, Monaco, monospace (code)
- **Display**: Cal Sans, Inter, system-ui, sans-serif (headings)

### Type Scale
Progressive type scale for clear hierarchy:

- **xs**: 12px / 16px line-height
- **sm**: 14px / 20px line-height  
- **base**: 16px / 24px line-height (body text)
- **lg**: 18px / 28px line-height
- **xl**: 20px / 28px line-height
- **2xl**: 24px / 32px line-height
- **3xl**: 30px / 36px line-height (page titles)

### Font Weights
- **Normal**: 400 (body text)
- **Medium**: 500 (emphasized text)
- **Semibold**: 600 (headings)
- **Bold**: 700 (strong emphasis)

## 🔲 Border Radius

Consistent rounding for a cohesive visual language:

- **sm**: 2px - Subtle rounding for small elements
- **base**: 4px - Standard component rounding
- **md**: 6px - Medium rounding for cards
- **lg**: 8px - Large rounding for prominent elements
- **xl**: 12px - Extra large rounding for containers
- **full**: 9999px - Perfect circles and pills

## 🌑 Shadows

Layered shadow system for depth and hierarchy:

- **sm**: Subtle shadow for slight elevation
- **base**: Standard shadow for cards and modals
- **md**: Medium shadow for elevated components
- **lg**: Large shadow for floating elements
- **xl**: Extra large shadow for maximum elevation
- **2xl**: Dramatic shadow for overlays

## 📱 Breakpoints

Mobile-first responsive breakpoints:

- **sm**: 640px - Small tablets
- **md**: 768px - Tablets  
- **lg**: 1024px - Small desktops
- **xl**: 1280px - Large desktops
- **2xl**: 1536px - Extra large screens

## 🎭 Animation & Motion

Consistent timing and easing for smooth interactions:

### Duration
- **75ms**: Micro-interactions
- **150ms**: Standard transitions (recommended)
- **300ms**: Medium transitions
- **500ms**: Long transitions

### Easing
- **ease**: Standard easing for most transitions
- **ease-out**: Entering animations
- **ease-in**: Exiting animations
- **spring**: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` - Bouncy animations

## 🏗️ Component Variants

### Button Sizes
- **xs**: 24px height - Compact buttons
- **sm**: 32px height - Small buttons
- **md**: 40px height - Standard buttons (default)
- **lg**: 44px height - Prominent buttons
- **xl**: 48px height - Hero buttons

### Input Sizes
- **sm**: 32px height - Compact inputs
- **md**: 40px height - Standard inputs (default)
- **lg**: 48px height - Large inputs

## 🎯 Semantic Token Mappings

### Background Colors
- **Primary**: `neutral.0` - Main page background
- **Secondary**: `neutral.50` - Section backgrounds
- **Tertiary**: `neutral.100` - Card backgrounds

### Text Colors
- **Primary**: `neutral.900` - Main text color
- **Secondary**: `neutral.600` - Supporting text
- **Muted**: `neutral.500` - Placeholder text

### Border Colors
- **Primary**: `neutral.200` - Standard borders
- **Focus**: `primary.500` - Focus rings
- **Error**: `error.500` - Error states

## 📋 Usage Guidelines

### Do's
✅ Use tokens consistently across all components
✅ Reference tokens by name, not hardcoded values
✅ Follow the established spacing scale
✅ Use semantic colors for appropriate contexts
✅ Maintain the type scale hierarchy

### Don'ts
❌ Hardcode color/spacing values
❌ Create custom spacing outside the scale
❌ Mix different color systems
❌ Use primary colors for semantic states
❌ Break the typographic hierarchy

## 🔧 Implementation

### Import Tokens
```typescript
import { tokens } from '@/design-system/tokens'

// Access specific tokens
const primaryColor = tokens.colors.primary[500]
const mediumSpacing = tokens.spacing[4]
const bodyFont = tokens.typography.fontSize.base
```

### Tailwind Integration
All tokens are automatically available as Tailwind classes:

```jsx
<div className="bg-primary-500 text-white p-4 rounded-md shadow-md">
  Content with design tokens
</div>
```

### CSS Custom Properties
Tokens are also exposed as CSS custom properties for maximum flexibility:

```css
.custom-component {
  background-color: var(--color-primary-500);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
}
```

## 🧪 Testing & Validation

### Accessibility
- All color combinations meet WCAG 2.1 AA contrast requirements
- Focus states use high-contrast indicators
- Motion respects `prefers-reduced-motion`

### Browser Support
- All tokens work in modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Graceful fallbacks for older browsers
- CSS custom properties with fallback values

---

## 📚 Related Documentation

- [Component Library](./components.md)
- [Accessibility Guidelines](./accessibility.md)
- [Contributing Guide](./contributing.md)
- [Migration Guide](./migration.md)

---

*Last updated: Day 1 Sprint 2 - Design System Foundation*