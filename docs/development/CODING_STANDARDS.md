# 📝 Coding Standards - Prismy

This document outlines coding standards and best practices for the Prismy codebase.

## 🎯 Code Quality Principles

### Core Values

- **Readability**: Code should be self-documenting
- **Consistency**: Follow established patterns
- **Performance**: Write efficient, optimized code
- **Security**: Implement security best practices
- **Maintainability**: Write code that's easy to modify

---

## 🔧 TypeScript Standards

### Type Definitions

```typescript
// ✅ Good: Explicit interface definitions
interface UserProfile {
  id: string
  email: string
  name: string
  createdAt: Date
  preferences?: UserPreferences
}

// ❌ Bad: Any types
const user: any = getData()
```

### Function Signatures

```typescript
// ✅ Good: Clear parameter and return types
async function translateDocument(
  document: DocumentInput,
  targetLanguage: SupportedLanguage
): Promise<TranslationResult> {
  // Implementation
}

// ❌ Bad: Missing types
async function translateDocument(document, targetLanguage) {
  // Implementation
}
```

### Error Handling

```typescript
// ✅ Good: Proper error handling
try {
  const result = await apiCall()
  return { success: true, data: result }
} catch (error) {
  logger.error('API call failed', { error, context })
  return { success: false, error: error.message }
}

// ❌ Bad: Silent failures
try {
  const result = await apiCall()
  return result
} catch {
  return null
}
```

---

## ⚛️ React Component Standards

### Component Structure

```typescript
// ✅ Good: Well-structured component
interface DocumentViewerProps {
  document: Document
  onEdit?: (id: string) => void
  className?: string
}

export default function DocumentViewer({
  document,
  onEdit,
  className = ''
}: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleEdit = useCallback(() => {
    onEdit?.(document.id)
  }, [document.id, onEdit])

  if (!document) {
    return <DocumentSkeleton />
  }

  return (
    <div className={`document-viewer ${className}`}>
      {/* Component content */}
    </div>
  )
}
```

### Hooks Usage

```typescript
// ✅ Good: Custom hooks for logic
function useDocumentTranslation(documentId: string) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [result, setResult] = useState<TranslationResult | null>(null)

  const translateDocument = useCallback(
    async (targetLang: string) => {
      setIsTranslating(true)
      try {
        const translation = await translationService.translate(
          documentId,
          targetLang
        )
        setResult(translation)
      } catch (error) {
        // Handle error
      } finally {
        setIsTranslating(false)
      }
    },
    [documentId]
  )

  return { translateDocument, isTranslating, result }
}

// ❌ Bad: Logic directly in component
function DocumentComponent() {
  const [isTranslating, setIsTranslating] = useState(false)
  // Lots of translation logic here...
}
```

---

## 🎨 Styling Standards

### Tailwind CSS Usage

```typescript
// ✅ Good: Semantic class organization
<button className={`
  inline-flex items-center justify-center
  px-4 py-2
  text-sm font-medium text-white
  bg-blue-600 hover:bg-blue-700
  border border-transparent rounded-md
  focus:outline-none focus:ring-2 focus:ring-blue-500
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors duration-200
`}>
  Submit
</button>

// ❌ Bad: Unorganized classes
<button className="inline-flex px-4 bg-blue-600 text-white py-2 items-center hover:bg-blue-700 justify-center text-sm">
  Submit
</button>
```

### Component Variants

```typescript
// ✅ Good: Variant-based styling
const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  danger: 'bg-red-600 hover:bg-red-700 text-white'
}

interface ButtonProps {
  variant?: keyof typeof buttonVariants
  children: React.ReactNode
}

function Button({ variant = 'primary', children, ...props }: ButtonProps) {
  return (
    <button
      className={`base-button-classes ${buttonVariants[variant]}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

---

## 🛡️ Security Standards

### Input Validation

```typescript
// ✅ Good: Validate and sanitize inputs
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

const documentSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(10000),
  tags: z.array(z.string()).max(10),
})

export async function createDocument(input: unknown) {
  const validated = documentSchema.parse(input)
  const sanitized = {
    ...validated,
    content: DOMPurify.sanitize(validated.content),
  }

  return await database.documents.create(sanitized)
}

// ❌ Bad: Direct database input
export async function createDocument(input: any) {
  return await database.documents.create(input)
}
```

### Environment Variables

```typescript
// ✅ Good: Validate environment variables
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  openaiKey: process.env.OPENAI_API_KEY!,
}

// Validate required variables
Object.entries(config).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
})

// ❌ Bad: Direct access without validation
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

---

## 📊 Performance Standards

### Efficient Rendering

```typescript
// ✅ Good: Memoized components
const DocumentItem = memo(function DocumentItem({
  document,
  onSelect
}: DocumentItemProps) {
  return (
    <div onClick={() => onSelect(document.id)}>
      {document.title}
    </div>
  )
})

// ✅ Good: Optimized lists
function DocumentList({ documents }: DocumentListProps) {
  const handleSelect = useCallback((id: string) => {
    // Handle selection
  }, [])

  return (
    <div>
      {documents.map(doc => (
        <DocumentItem
          key={doc.id}
          document={doc}
          onSelect={handleSelect}
        />
      ))}
    </div>
  )
}
```

### Lazy Loading

```typescript
// ✅ Good: Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<ComponentSkeleton />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

---

## 🔍 Testing Standards

### Unit Tests

```typescript
// ✅ Good: Comprehensive test coverage
describe('translateDocument', () => {
  it('should translate document successfully', async () => {
    const mockDocument = { id: '1', content: 'Hello' }
    const mockResult = { translatedText: 'Hola', confidence: 0.95 }

    mockTranslationAPI.translate.mockResolvedValue(mockResult)

    const result = await translateDocument(mockDocument, 'es')

    expect(result.success).toBe(true)
    expect(result.data.translatedText).toBe('Hola')
    expect(mockTranslationAPI.translate).toHaveBeenCalledWith({
      text: 'Hello',
      targetLanguage: 'es',
    })
  })

  it('should handle translation errors gracefully', async () => {
    mockTranslationAPI.translate.mockRejectedValue(new Error('API Error'))

    const result = await translateDocument(mockDocument, 'es')

    expect(result.success).toBe(false)
    expect(result.error).toBe('API Error')
  })
})
```

### Integration Tests

```typescript
// ✅ Good: E2E test scenarios
test('user can upload and translate document', async ({ page }) => {
  await page.goto('/workspace')

  // Upload document
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles('test-document.pdf')

  // Wait for upload
  await page.waitForSelector('[data-testid="document-uploaded"]')

  // Start translation
  await page.click('[data-testid="translate-button"]')
  await page.selectOption('[data-testid="target-language"]', 'es')
  await page.click('[data-testid="start-translation"]')

  // Verify result
  await page.waitForSelector('[data-testid="translation-complete"]')
  const result = await page.textContent('[data-testid="translated-text"]')
  expect(result).toContain('traducido')
})
```

---

## 📝 Documentation Standards

### Code Comments

```typescript
// ✅ Good: Meaningful comments
/**
 * Processes uploaded documents using OCR and text extraction
 *
 * @param file - The uploaded file (PDF, DOCX, or image)
 * @param options - Processing options including OCR settings
 * @returns Promise resolving to extracted text and metadata
 *
 * @throws {ValidationError} When file format is not supported
 * @throws {ProcessingError} When OCR or extraction fails
 */
async function processDocument(
  file: File,
  options: ProcessingOptions = {}
): Promise<ProcessedDocument> {
  // Validate file format before processing
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    throw new ValidationError(`Unsupported format: ${file.type}`)
  }

  // Implementation...
}

// ❌ Bad: Obvious or outdated comments
// Increment counter by 1
counter++

// TODO: Fix this later (from 6 months ago)
const result = hackyWorkaround()
```

### API Documentation

```typescript
/**
 * @swagger
 * /api/translate:
 *   post:
 *     summary: Translate text
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - targetLanguage
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to translate
 *               targetLanguage:
 *                 type: string
 *                 description: Target language code
 *     responses:
 *       200:
 *         description: Translation successful
 */
```

---

## 🚫 Anti-Patterns to Avoid

### Performance Anti-Patterns

```typescript
// ❌ Bad: Creating objects in render
function Component() {
  return (
    <SomeComponent
      style={{ margin: 10 }} // Creates new object every render
      onClick={() => doSomething()} // Creates new function every render
    />
  )
}

// ✅ Good: Stable references
const styles = { margin: 10 }

function Component() {
  const handleClick = useCallback(() => doSomething(), [])

  return (
    <SomeComponent
      style={styles}
      onClick={handleClick}
    />
  )
}
```

### Security Anti-Patterns

```typescript
// ❌ Bad: XSS vulnerability
function UserContent({ htmlContent }: { htmlContent: string }) {
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
}

// ✅ Good: Sanitized content
function UserContent({ htmlContent }: { htmlContent: string }) {
  const sanitizedHTML = DOMPurify.sanitize(htmlContent)
  return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
}
```

---

## 🔄 Code Review Checklist

### For Authors

- [ ] Code follows TypeScript standards
- [ ] Components are properly typed
- [ ] Error handling is comprehensive
- [ ] Performance considerations addressed
- [ ] Security implications reviewed
- [ ] Tests written and passing
- [ ] Documentation updated

### For Reviewers

- [ ] Logic is sound and efficient
- [ ] Edge cases are handled
- [ ] Code is readable and maintainable
- [ ] Security vulnerabilities checked
- [ ] Performance impact assessed
- [ ] Test coverage is adequate
- [ ] Documentation is accurate

---

## 🛠️ Tools and Automation

### ESLint Configuration

```json
{
  "extends": ["next/core-web-vitals", "@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error",
    "no-console": "warn"
  }
}
```

### Prettier Configuration

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

### Pre-commit Hooks

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

---

_These standards are living guidelines. Suggest improvements via PR!_
