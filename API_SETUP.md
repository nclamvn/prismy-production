# Prismy API Integration Setup Guide

## Phase 4: Translation API Integration - COMPLETE ✅

### What's Been Implemented:

1. **Google Translate API Integration**
   - Full Google Cloud Translate v2 API integration
   - Auto-language detection
   - Quality tier system (Free, Standard, Premium, Enterprise)
   - Translation confidence scoring

2. **API Routes**
   - `POST /api/translate` - Translate text with quality metrics
   - `GET /api/translate` - Get supported languages

3. **Performance Features**
   - In-memory translation caching (1 hour TTL)
   - Rate limiting (per IP, per quality tier)
   - Character limit validation (10,000 max)

4. **Frontend Integration**
   - Real-time translation in Workbench component
   - Quality indicators with visual feedback
   - Character count with limit warnings
   - Error handling and loading states

### Setup Instructions:

#### 1. Google Cloud Setup:
```bash
# Create Google Cloud project
gcloud projects create prismy-translation

# Enable Translation API
gcloud services enable translate.googleapis.com

# Create service account
gcloud iam service-accounts create prismy-translate

# Create and download key
gcloud iam service-accounts keys create key.json \
  --iam-account=prismy-translate@prismy-translation.iam.gserviceaccount.com
```

#### 2. Environment Variables:
```bash
# Copy example env file
cp .env.example .env.local

# Add your credentials:
GOOGLE_CLOUD_PROJECT_ID=prismy-translation
GOOGLE_TRANSLATE_API_KEY=your-api-key-here
# OR
GOOGLE_CLOUD_KEY_FILE=/path/to/key.json
```

#### 3. Rate Limits by Tier:
- **Free**: 10 translations/hour
- **Standard**: 50 translations/hour  
- **Premium**: 200 translations/hour
- **Enterprise**: 1000 translations/hour

### API Usage Examples:

#### Translate Text:
```javascript
fetch('/api/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Hello world',
    sourceLang: 'en',
    targetLang: 'vi',
    qualityTier: 'premium'
  })
})
```

#### Response Format:
```json
{
  "success": true,
  "result": {
    "translatedText": "Xin chào thế giới",
    "sourceLang": "en",
    "targetLang": "vi",
    "confidence": 0.95,
    "qualityScore": 0.92,
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "usage": {
    "charactersTranslated": 11,
    "qualityTier": "premium"
  }
}
```

### Next Phase Preview:
- **Phase 5**: User Authentication & Accounts
- **Phase 6**: File Upload & Document Processing
- **Phase 7**: Database Integration & History

### Production Notes:
- Translation results are cached for 1 hour
- Rate limiting is IP-based (use Redis in production)
- Google Translate API charges per character
- Consider implementing user accounts for better rate limiting