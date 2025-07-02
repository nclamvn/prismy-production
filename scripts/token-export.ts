#!/usr/bin/env ts-node

/**
 * UI/UX Polish Sprint - Phase 1.1: Token Export Script
 * 
 * Auto-generates CSS variables, Tailwind config, and component classes
 * Usage: pnpm token:export [--format css|tailwind|storybook|components|js|all]
 */

import * as fs from 'fs'
import * as path from 'path'
import { generators, type GeneratorType } from '../packages/ui/tokens/generators'

const OUTPUT_DIR = path.join(process.cwd(), 'packages/ui/dist')
const STYLES_DIR = path.join(process.cwd(), 'styles')

// Ensure output directories exist
function ensureDirectories() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
  
  if (!fs.existsSync(STYLES_DIR)) {
    fs.mkdirSync(STYLES_DIR, { recursive: true })
  }
}

// Write file with proper formatting
function writeFile(filePath: string, content: string, description: string) {
  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`✅ Generated ${description}: ${filePath}`)
}

// Generate specific format
function generateFormat(format: GeneratorType | 'all') {
  ensureDirectories()
  
  const timestamp = new Date().toISOString()
  console.log(`🎨 Token Export - ${timestamp}`)
  console.log(`📦 Format: ${format}`)
  console.log('')
  
  if (format === 'all' || format === 'css') {
    const css = generators.css()
    writeFile(
      path.join(OUTPUT_DIR, 'tokens.css'),
      css,
      'CSS Variables'
    )
    
    // Also write to styles directory for immediate use
    writeFile(
      path.join(STYLES_DIR, 'tokens-v2.css'),
      css,
      'CSS Variables (styles)'
    )
  }
  
  if (format === 'all' || format === 'tailwind') {
    const tailwindConfig = generators.tailwind()
    const content = `// Auto-generated Tailwind Config Extension
// Generated at: ${timestamp}

module.exports = ${JSON.stringify(tailwindConfig, null, 2)};
`
    writeFile(
      path.join(OUTPUT_DIR, 'tailwind.config.js'),
      content,
      'Tailwind Config'
    )
  }
  
  if (format === 'all' || format === 'storybook') {
    const storybookTheme = generators.storybook()
    const content = `// Auto-generated Storybook Theme
// Generated at: ${timestamp}

export const theme = ${JSON.stringify(storybookTheme, null, 2)};
`
    writeFile(
      path.join(OUTPUT_DIR, 'storybook-theme.js'),
      content,
      'Storybook Theme'
    )
  }
  
  if (format === 'all' || format === 'components') {
    const componentCSS = generators.components()
    writeFile(
      path.join(OUTPUT_DIR, 'components.css'),
      componentCSS,
      'Component Classes'
    )
    
    // Also write to styles directory
    writeFile(
      path.join(STYLES_DIR, 'components-v2.css'),
      componentCSS,
      'Component Classes (styles)'
    )
  }
  
  if (format === 'all' || format === 'js') {
    const tokensJS = generators.js()
    writeFile(
      path.join(OUTPUT_DIR, 'tokens.js'),
      tokensJS,
      'JavaScript Tokens'
    )
    
    // TypeScript version
    const tokensTS = tokensJS.replace('.js', '.ts')
    writeFile(
      path.join(OUTPUT_DIR, 'tokens.ts'),
      tokensTS,
      'TypeScript Tokens'
    )
  }
  
  // Generate usage documentation
  if (format === 'all') {
    generateDocumentation()
  }
  
  console.log('')
  console.log(`🎉 Token export completed successfully!`)
  console.log(`📁 Output directory: ${OUTPUT_DIR}`)
  console.log(`🎨 Styles directory: ${STYLES_DIR}`)
}

// Generate documentation
function generateDocumentation() {
  const docs = `# Design Tokens v2 - Generated Files

Generated at: ${new Date().toISOString()}

## Files Generated

### CSS Variables (\`tokens.css\`, \`styles/tokens-v2.css\`)
Contains all design tokens as CSS custom properties with \`--pry-v2-\` namespace.

**Usage:**
\`\`\`css
.my-component {
  background: var(--pry-v2-primary-500);
  padding: var(--pry-v2-spacing-4);
  border-radius: var(--pry-v2-border-radius-lg);
}
\`\`\`

### Component Classes (\`components.css\`, \`styles/components-v2.css\`)
Pre-built CSS classes for common UI patterns.

**Usage:**
\`\`\`html
<button class="btn-primary">Primary Button</button>
<div class="workspace-panel">Panel Content</div>
<div class="job-card">Job Card</div>
\`\`\`

### Tailwind Config (\`tailwind.config.js\`)
Tailwind CSS configuration extension with all tokens.

**Usage:**
\`\`\`js
// tailwind.config.js
const tokensConfig = require('./packages/ui/dist/tailwind.config.js');

module.exports = {
  ...tokensConfig,
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  // ... your other config
};
\`\`\`

### Storybook Theme (\`storybook-theme.js\`)
Storybook theme configuration matching design tokens.

**Usage:**
\`\`\`js
// .storybook/manager.js
import { addons } from '@storybook/addons';
import { theme } from '../packages/ui/dist/storybook-theme.js';

addons.setConfig({
  theme
});
\`\`\`

### JavaScript/TypeScript Tokens (\`tokens.js\`, \`tokens.ts\`)
Runtime access to token values with helper functions.

**Usage:**
\`\`\`typescript
import { tokens, getCSSVar, getTokenValue } from './packages/ui/dist/tokens';

// Get CSS variable name
const primaryColor = getCSSVar('primary.500'); // 'var(--pry-v2-primary-500)'

// Get token value
const spacing = getTokenValue('spacing.4'); // '1rem'
\`\`\`

## Feature Flag Integration

To enable v2 tokens conditionally:

\`\`\`css
/* Only load v2 tokens when feature flag is enabled */
[data-ui-version="v2"] {
  /* v2 tokens active */
}
\`\`\`

## Dark Theme Support

Dark theme variants are automatically included:

\`\`\`css
[data-theme="dark"] {
  --pry-v2-workspace-canvas: var(--pry-v2-workspace-canvas-dark);
  /* ... other dark variants */
}
\`\`\`

## Reduced Motion Support

Animation durations respect \`prefers-reduced-motion\`:

\`\`\`css
@media (prefers-reduced-motion: reduce) {
  --pry-v2-animation-duration-fast: 0ms;
  --pry-v2-animation-duration-normal: 0ms;
  --pry-v2-animation-duration-slow: 0ms;
}
\`\`\`

## Next Steps

1. Import \`styles/tokens-v2.css\` in your main CSS file
2. Import \`styles/components-v2.css\` for component classes
3. Update Tailwind config to extend with generated config
4. Add feature flag logic to conditionally apply v2 tokens
5. Test in both light/dark themes and with reduced motion
`

  writeFile(
    path.join(OUTPUT_DIR, 'README.md'),
    docs,
    'Documentation'
  )
}

// Main execution
function main() {
  const args = process.argv.slice(2)
  const formatArg = args.find(arg => arg.startsWith('--format='))
  const format = formatArg ? formatArg.split('=')[1] as GeneratorType | 'all' : 'all'
  
  if (format !== 'all' && !Object.keys(generators).includes(format)) {
    console.error(`❌ Invalid format: ${format}`)
    console.error(`Valid formats: ${Object.keys(generators).join(', ')}, all`)
    process.exit(1)
  }
  
  try {
    generateFormat(format)
  } catch (error) {
    console.error('❌ Token export failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { generateFormat, main }