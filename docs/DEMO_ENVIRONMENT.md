# 🎪 Demo Environment Setup

> Secure and controlled demo environment for showcasing Prismy capabilities

## 🎯 Overview

The Prismy demo environment provides a safe, controlled space for showcasing features without exposing production data or systems. It includes sample data, feature demonstrations, and security safeguards.

## 🚀 Quick Demo Access

### Live Demo
- **URL**: [https://demo.prismy.in](https://demo.prismy.in)
- **Username**: `demo@prismy.in`
- **Password**: `Demo2024!`
- **Features**: Full feature access with sample data

### Sandbox Environment
- **URL**: [https://sandbox.prismy.in](https://sandbox.prismy.in)
- **Access**: Self-registration enabled
- **Limitations**: Processing limits, data cleanup every 24h

## 🛠️ Setting Up Local Demo

### Prerequisites
```bash
# Node.js 18+ required
node --version  # Should be >= 18.17.0

# Clone the repository
git clone https://github.com/prismy/prismy-production.git
cd prismy-production
```

### Environment Configuration
```bash
# Copy demo environment variables
cp .env.demo .env.local

# Install dependencies
npm install

# Initialize demo data
npm run demo:setup

# Start demo server
npm run demo:start
```

### Demo Environment Variables
```bash
# Demo-specific configuration
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_DATA_ENABLED=true
DEMO_USER_EMAIL=demo@prismy.in
DEMO_USER_PASSWORD=Demo2024!

# Supabase demo instance
NEXT_PUBLIC_SUPABASE_URL=https://demo-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=demo_anon_key

# Limited API keys for demo
OPENAI_API_KEY=demo_openai_key
ANTHROPIC_API_KEY=demo_anthropic_key

# Demo-safe external services
GOOGLE_TRANSLATE_API_KEY=demo_translate_key
STRIPE_PUBLISHABLE_KEY=pk_test_demo_key
```

## 📊 Demo Data & Content

### Sample Documents
The demo environment includes pre-loaded sample documents:

```typescript
// Sample document library
const demoDocuments = [
  {
    name: "Business_Plan_2024.pdf",
    type: "PDF",
    size: "2.3 MB",
    language: "en",
    status: "completed",
    translations: ["vi", "ja", "ar", "zh"],
    processingTime: "45s",
    tags: ["business", "planning", "strategy"]
  },
  {
    name: "Contract_Template.docx",
    type: "Word",
    size: "856 KB",
    language: "en",
    status: "processing",
    currentStep: "OCR Analysis",
    progress: 65,
    tags: ["legal", "contract", "template"]
  },
  {
    name: "Financial_Report_Q4.xlsx",
    type: "Excel",
    size: "1.2 MB",
    language: "en",
    status: "queued",
    tags: ["finance", "quarterly", "report"]
  },
  {
    name: "Marketing_Presentation.pptx",
    type: "PowerPoint",
    size: "4.1 MB",
    language: "en",
    status: "completed",
    translations: ["vi", "ja"],
    tags: ["marketing", "presentation", "strategy"]
  }
]
```

### Demo User Roles
```typescript
// Available demo user types
const demoUsers = {
  admin: {
    email: "admin@demo.prismy.in",
    permissions: ["all"],
    features: ["user_management", "analytics", "system_settings"]
  },
  manager: {
    email: "manager@demo.prismy.in",
    permissions: ["team_management", "document_processing"],
    features: ["team_analytics", "bulk_processing"]
  },
  user: {
    email: "user@demo.prismy.in",
    permissions: ["document_processing"],
    features: ["basic_translation", "personal_workspace"]
  }
}
```

### Feature Demonstrations

#### 1. Document Upload Demo
```typescript
// Simulated upload process
const uploadDemo = {
  steps: [
    "File validation (2s)",
    "OCR text extraction (15s)",
    "Language detection (3s)",
    "Translation processing (25s)",
    "Document reconstruction (8s)",
    "Quality assurance (5s)"
  ],
  totalTime: "58 seconds",
  supportedFormats: ["PDF", "DOCX", "XLSX", "PPTX"],
  maxFileSize: "50 MB (demo limited to 10 MB)"
}
```

#### 2. Translation Showcase
```typescript
// Sample translation pairs
const translationExamples = [
  {
    source: { lang: "en", text: "This is a business proposal for expanding our operations into Southeast Asian markets." },
    targets: [
      { lang: "vi", text: "Đây là đề xuất kinh doanh để mở rộng hoạt động của chúng ta vào các thị trường Đông Nam Á." },
      { lang: "ja", text: "これは東南アジア市場への事業展開に関するビジネス提案です。" },
      { lang: "ar", text: "هذا اقتراح تجاري لتوسيع عملياتنا في أسواق جنوب شرق آسيا." },
      { lang: "zh", text: "这是一份将我们的业务扩展到东南亚市场的商业提案。" }
    ]
  }
]
```

#### 3. Search Capabilities Demo
```typescript
// Pre-indexed search content
const searchDemoContent = [
  "How to upload a document",
  "Change language settings",
  "Download translated files",
  "View processing status",
  "Toggle dark theme",
  "Access user settings",
  "Batch process documents",
  "Export translation history"
]
```

## 🔒 Security & Limitations

### Demo Environment Safeguards
```typescript
// Security restrictions for demo
const demoLimitations = {
  fileUpload: {
    maxSize: "10 MB",          // Reduced from 50 MB production limit
    maxFiles: 5,               // Per session
    allowedTypes: ["pdf", "docx", "xlsx", "pptx"],
    scanForMalware: true,
    autoCleanup: "1 hour"
  },
  apiUsage: {
    requestsPerMinute: 20,     // Rate limiting
    dailyQuota: 100,           // API calls per day
    concurrentJobs: 2,         // Processing limit
    timeoutDuration: "5 minutes"
  },
  dataProtection: {
    encryptionAtRest: true,
    autoDelete: "24 hours",    // All demo data deleted
    noPersonalData: true,      // PII not allowed
    sessionTimeout: "30 minutes"
  }
}
```

### Content Filtering
```typescript
// Demo content restrictions
const contentFilter = {
  blockedKeywords: [
    "confidential", "internal", "private",
    "classified", "restricted", "proprietary"
  ],
  allowedLanguages: ["en", "vi", "ja", "ar", "zh"],
  maxTextLength: 10000,       // Characters per document
  prohibitedContent: [
    "personal_information",
    "financial_details",
    "legal_documents",
    "medical_records"
  ]
}
```

## 🎨 Demo UI Customization

### Demo Mode Indicators
```typescript
// Visual indicators for demo environment
const demoModeFeatures = {
  banner: {
    text: "Demo Environment - All data will be deleted after 24 hours",
    color: "warning",
    position: "top",
    dismissible: false
  },
  watermarks: {
    enabled: true,
    text: "DEMO",
    opacity: 0.1,
    position: "center"
  },
  limitedFeatures: {
    showUpgradePaths: true,
    highlightPremiumFeatures: true,
    contactSalesEnabled: true
  }
}
```

### Sample Workflows
```typescript
// Guided demo workflows
const demoWorkflows = [
  {
    id: "quick_translation",
    name: "Quick Document Translation",
    steps: [
      "Upload sample document",
      "Select target languages",
      "Start processing",
      "View real-time progress",
      "Download translated files"
    ],
    duration: "3 minutes",
    difficulty: "Beginner"
  },
  {
    id: "batch_processing",
    name: "Batch Document Processing",
    steps: [
      "Upload multiple documents",
      "Configure batch settings",
      "Monitor job queue",
      "Review completed translations",
      "Export results"
    ],
    duration: "5 minutes",
    difficulty: "Intermediate"
  },
  {
    id: "advanced_features",
    name: "Advanced Features Showcase",
    steps: [
      "Explore semantic search",
      "Use quality assurance tools",
      "Configure custom workflows",
      "Set up team collaboration",
      "View analytics dashboard"
    ],
    duration: "10 minutes",
    difficulty: "Advanced"
  }
]
```

## 📱 Demo Scripts & Automation

### Automated Demo Setup
```bash
#!/bin/bash
# Demo environment setup script

echo "🎪 Setting up Prismy Demo Environment..."

# Install dependencies
npm install --production

# Initialize demo database
npm run demo:db:setup

# Seed demo data
npm run demo:seed

# Configure demo settings
npm run demo:configure

# Start demo server
npm run demo:start

echo "✅ Demo environment ready at http://localhost:3000"
echo "📧 Demo credentials: demo@prismy.in / Demo2024!"
```

### Demo Data Reset
```typescript
// Automated data cleanup
export const demoDataManager = {
  async resetDemoData() {
    console.log('🔄 Resetting demo data...')
    
    // Clear uploaded files
    await this.clearUploads()
    
    // Reset user sessions
    await this.resetSessions()
    
    // Restore sample data
    await this.loadSampleData()
    
    // Clear processing queue
    await this.clearJobQueue()
    
    console.log('✅ Demo data reset complete')
  },
  
  async scheduleReset() {
    // Schedule daily reset at 2 AM UTC
    setInterval(() => {
      this.resetDemoData()
    }, 24 * 60 * 60 * 1000)
  }
}
```

## 🎬 Demo Presentation Scripts

### Quick Pitch (2 minutes)
```markdown
## Prismy Demo Script - Quick Pitch

### Introduction (15s)
"Welcome to Prismy, the enterprise document processing platform that makes multilingual business operations seamless."

### Document Upload (30s)
"Watch as I upload this business proposal. Prismy automatically detects it's in English and extracts the text using advanced OCR."

### Translation Process (45s)
"Now I'll translate it to Vietnamese, Japanese, and Arabic simultaneously. Notice the real-time progress tracking and our intelligent job queue management."

### Results Showcase (30s)
"Here are the completed translations, maintaining the original formatting and layout. The Arabic version shows our RTL language support."

### Search & Navigation (15s)
"Use Cmd+K to access our semantic search. It understands context - try searching 'upload document' or 'change theme'."

### Closing (5s)
"Ready to transform your document workflows? Let's discuss your specific needs."
```

### Feature Deep Dive (10 minutes)
```markdown
## Prismy Demo Script - Feature Deep Dive

### Setup & Environment (1m)
- Show demo environment indicators
- Explain security safeguards
- Overview of sample data

### Core Features (3m)
- Multi-format document support
- OCR and language detection
- AI-powered translation
- Document reconstruction

### Advanced Capabilities (3m)
- Batch processing workflows
- Quality assurance tools
- Team collaboration features
- Analytics and reporting

### Technical Excellence (2m)
- Performance optimization
- Security and compliance
- Accessibility features
- Multi-locale support

### Q&A and Next Steps (1m)
- Address specific questions
- Discuss implementation timeline
- Provide contact information
```

## 🚀 Demo Deployment

### Vercel Demo Deployment
```bash
# Deploy demo environment to Vercel
vercel --prod --env NEXT_PUBLIC_DEMO_MODE=true

# Configure custom domain
vercel domains add demo.prismy.in

# Set up demo-specific environment variables
vercel env add DEMO_MODE production
vercel env add DEMO_DATA_ENABLED production
```

### Docker Demo Container
```dockerfile
# Dockerfile.demo
FROM node:18-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Demo-specific configuration
ENV NEXT_PUBLIC_DEMO_MODE=true
ENV DEMO_DATA_ENABLED=true

EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Demo Analytics

### Usage Tracking
```typescript
// Demo analytics configuration
const demoAnalytics = {
  trackEvents: [
    "demo_started",
    "document_uploaded",
    "translation_completed",
    "feature_explored",
    "contact_requested",
    "demo_completed"
  ],
  
  metrics: {
    sessionDuration: "average_time_spent",
    featureUsage: "most_explored_features",
    conversionRate: "demo_to_trial_conversion",
    geographicData: "visitor_locations"
  },
  
  reporting: {
    dailyReports: true,
    weeklyDigest: true,
    realTimeDashboard: true
  }
}
```

## 🆘 Demo Support

### Self-Service Help
- **In-App Tutorials**: Step-by-step guided tours
- **Feature Tooltips**: Contextual help throughout the interface
- **Sample Workflows**: Pre-configured demonstration scenarios
- **FAQ Section**: Common questions and answers

### Live Support
- **Chat Support**: Available during business hours
- **Screen Sharing**: Assisted demo sessions
- **Custom Demos**: Tailored feature demonstrations
- **Technical Q&A**: Architecture and integration discussions

## 🔄 Demo Updates

### Continuous Improvement
```bash
# Update demo content
npm run demo:update

# Add new sample documents
npm run demo:add-samples

# Update feature demonstrations
npm run demo:refresh-workflows

# Deploy updates
npm run demo:deploy
```

### Feedback Integration
- **User Feedback Collection**: In-app feedback forms
- **Usage Analytics**: Feature engagement metrics
- **A/B Testing**: Demo flow optimization
- **Continuous Iteration**: Weekly demo improvements

---

**Ready to explore Prismy?** Visit [demo.prismy.in](https://demo.prismy.in) or contact our team for a personalized demonstration.

**Questions about the demo environment?** Check our [FAQ](./FAQ.md) or reach out to demo@prismy.in