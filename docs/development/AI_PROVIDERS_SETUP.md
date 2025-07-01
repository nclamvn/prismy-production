# AI Providers Setup Guide

This guide explains how to configure the AI providers for Prismy's enhanced document processing capabilities.

## Overview

Prismy now supports multiple AI providers for different capabilities:

- **OpenAI**: Fast completion and embedding generation
- **Anthropic**: High-quality reasoning and document analysis  
- **Cohere**: Multilingual embedding and completion support

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Anthropic Configuration  
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# Cohere Configuration
COHERE_API_KEY=your-cohere-api-key

# AI Provider Settings (Optional)
AI_PROVIDER_TIMEOUT=30000
AI_DEFAULT_MAX_TOKENS=4096
AI_DEFAULT_TEMPERATURE=0.7

# AI Quality & Cost Settings (Optional)
AI_PRIMARY_PROVIDER=anthropic
AI_FALLBACK_PROVIDERS=openai,cohere
AI_COST_OPTIMIZATION=true
```

## Getting API Keys

### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new secret key
5. Copy the key (starts with `sk-`)

### Anthropic
1. Visit [Anthropic Console](https://console.anthropic.com)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### Cohere
1. Visit [Cohere Dashboard](https://dashboard.cohere.ai)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key

## Provider Features

### Completion Models
- **OpenAI**: GPT-4o, GPT-4o-mini
- **Anthropic**: Claude 3.5 Sonnet, Claude 3.5 Haiku
- **Cohere**: Command R, Command R+

### Embedding Models
- **OpenAI**: text-embedding-3-small, text-embedding-3-large
- **Cohere**: embed-multilingual-v3.0, embed-english-v3.0

## Configuration Options

### Provider Selection Strategy
The system automatically selects providers based on:
- **Quality**: Anthropic (best reasoning) → OpenAI → Cohere
- **Speed**: OpenAI (fastest) → Cohere → Anthropic  
- **Cost**: Cohere (cheapest) → OpenAI → Anthropic

### Fallback Chain
If the primary provider fails, the system automatically falls back to:
1. Primary provider (configurable)
2. Secondary provider
3. Tertiary provider

### Features by Provider

| Feature | OpenAI | Anthropic | Cohere |
|---------|--------|-----------|--------|
| Text Completion | ✅ | ✅ | ✅ |
| Embeddings | ✅ | ❌ | ✅ |
| Function Calling | ✅ | ✅ | ❌ |
| Multilingual | ✅ | ✅ | ✅ |
| Long Context | ✅ | ✅ | ✅ |

## Usage in Features

### Document Intelligence
- **Primary**: Anthropic Claude (best document analysis)
- **Fallback**: OpenAI GPT-4o → Cohere Command R

### Semantic Search
- **Embeddings**: OpenAI text-embedding-3-small (cost-effective)
- **Fallback**: Cohere embed-multilingual-v3.0

### Multilingual Q&A
- **Primary**: Anthropic Claude (cultural sensitivity)
- **Fallback**: OpenAI GPT-4o → Cohere Command R

### Translation Enhancement
- **Primary**: OpenAI GPT-4o (speed for translation)
- **Fallback**: Anthropic Claude → Cohere Command R

## Monitoring & Metrics

The system tracks:
- Request success/failure rates
- Average latency per provider
- Cost per request
- Provider availability

Access metrics through the provider manager:
```typescript
import { aiProviderManager } from '@/src/lib/ai/providers/provider-manager'

const metrics = aiProviderManager.getProviderMetrics()
const availableProviders = aiProviderManager.getAvailableProviders()
```

## Cost Optimization

### Automatic Model Selection
- **Fast requests**: Uses cheaper, faster models
- **Quality requests**: Uses premium models for better results
- **Balanced requests**: Optimizes for speed/quality ratio

### Request Caching
- Responses are cached to reduce API calls
- Cache TTL varies by request type
- Cache keys include request parameters

## Testing

Run AI provider tests:
```bash
# Test all providers
npm test src/lib/ai/providers

# Test specific provider
npm test -- --testNamePattern="OpenAI"
```

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Verify key format and permissions
   - Check if key is active in provider dashboard

2. **Rate Limits**
   - Monitor usage in provider dashboards
   - Upgrade plans if needed
   - System automatically retries with backoff

3. **Network Timeouts**
   - Increase `AI_PROVIDER_TIMEOUT` value
   - Check network connectivity

4. **Provider Unavailable**
   - System automatically uses fallback providers
   - Check provider status pages

### Debug Mode
Enable debug logging:
```bash
DEBUG=prismy:ai npm run dev
```

## Security

- API keys are stored as environment variables
- Keys are never logged or exposed to client
- Requests are validated and sanitized
- Rate limiting prevents abuse

## Support

For issues with AI providers:
1. Check provider status pages
2. Verify environment variable configuration
3. Review application logs
4. Contact provider support if needed