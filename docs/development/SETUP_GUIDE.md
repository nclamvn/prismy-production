# Prismy Setup Guide

## Quick Start

This guide walks you through setting up the complete Prismy translation platform. Follow the steps in order for a smooth setup experience.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- Text editor (VS Code recommended)

## Project Overview

Prismy is a comprehensive translation platform featuring:

- **AI-Powered Translation**: Google Cloud Translate API integration
- **User Authentication**: Supabase with OAuth support (Google, Apple)
- **Multi-Payment Support**: Stripe (international) + VNPay/MoMo (Vietnamese)
- **Subscription Billing**: Tiered plans with usage tracking
- **Vietnamese Localization**: Full Vietnamese language support
- **Document Translation**: File upload and batch processing
- **Modern Stack**: Next.js 15, React 18, TypeScript, Tailwind CSS

## Setup Process

### 1. Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd prismy-production

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env.local
```

### 2. Translation API Integration

**📖 Detailed Guide**: [API_SETUP.md](./API_SETUP.md)

**Quick Steps**:

1. Create Google Cloud Project
2. Enable Cloud Translate API
3. Create service account and download credentials
4. Configure environment variables

**Environment Variables**:

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_TRANSLATE_API_KEY=your-api-key
```

### 3. Authentication System

**📖 Detailed Guide**: [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md)

**Quick Steps**:

1. Create Supabase project
2. Run database migration (`supabase-setup.sql`)
3. Configure OAuth providers (Google, Apple)
4. Set up authentication environment variables

**Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Payment Processing

**📖 Detailed Guide**: [PAYMENTS_SETUP.md](./PAYMENTS_SETUP.md)

**Quick Steps**:

1. Set up Stripe for international payments
2. Configure VNPay for Vietnamese domestic cards
3. Set up MoMo for Vietnamese mobile wallet
4. Configure webhooks and pricing

**Environment Variables**:

```env
# Stripe (International)
STRIPE_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# VNPay (Vietnamese Cards)
VNPAY_TMN_CODE=your_terminal_code
VNPAY_HASH_SECRET=your_hash_secret

# MoMo (Vietnamese Wallet)
MOMO_PARTNER_CODE=your_partner_code
MOMO_SECRET_KEY=your_secret_key
```

### 5. Vietnamese Payment Gateway Setup

**📖 Detailed Guide**: [VIETNAMESE_PAYMENT_SETUP.md](./VIETNAMESE_PAYMENT_SETUP.md)

This comprehensive guide covers:

- VNPay merchant registration and integration
- MoMo business account setup and API integration
- Vietnamese pricing strategy and market considerations
- Security best practices for Vietnamese payment gateways

## Database Migration

Run the database migrations to set up all required tables:

```bash
# Apply base schema (in Supabase SQL Editor)
# Copy content from supabase-setup.sql

# Apply payment system migration
# Copy content from supabase-stripe-migration.sql
```

## Development

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Start production server
npm start
```

## Production Deployment

### Environment Setup

1. Update all environment variables with production values
2. Switch API endpoints from sandbox to production
3. Configure production webhook URLs
4. Test all payment flows

### Deployment Checklist

- [ ] Google Cloud Translate API configured
- [ ] Supabase authentication working
- [ ] OAuth providers configured for production domain
- [ ] Stripe webhooks configured for production
- [ ] VNPay production merchant account verified
- [ ] MoMo production business account verified
- [ ] Database migrations applied
- [ ] All environment variables set
- [ ] SSL certificates configured
- [ ] Domain and DNS configured

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   External      │
│   (Next.js)     │    │   Routes        │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • React 18      │◄──►│ • Translation   │◄──►│ • Google Cloud  │
│ • TypeScript    │    │ • Authentication│    │ • Supabase      │
│ • Tailwind CSS  │    │ • Payments      │    │ • Stripe        │
│ • Framer Motion │    │ • User Management│    │ • VNPay         │
└─────────────────┘    └─────────────────┘    │ • MoMo          │
                                              └─────────────────┘
```

## Feature Modules

### Core Features

- **Translation Engine**: AI-powered text and document translation
- **User Authentication**: Secure login with multiple providers
- **Subscription Management**: Tiered billing with usage tracking
- **Document Processing**: File upload and batch translation
- **Analytics Dashboard**: Usage statistics and insights

### Vietnamese Market Features

- **Local Payment Methods**: VNPay and MoMo integration
- **VND Pricing**: Optimized for Vietnamese purchasing power
- **Vietnamese Localization**: Full UI translation
- **Cultural Intelligence**: Vietnamese-specific translation optimizations

## Troubleshooting

### Common Issues

1. **Translation API Errors**

   - Verify Google Cloud credentials
   - Check API quotas and billing
   - Ensure proper service account permissions

2. **Authentication Issues**

   - Verify Supabase project configuration
   - Check OAuth provider settings
   - Ensure redirect URLs are correct

3. **Payment Processing Errors**
   - Verify webhook endpoints are accessible
   - Check payment provider credentials
   - Test in sandbox mode first

### Getting Help

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Detailed guides for each component
- **Support**: Contact information in respective service portals

## Next Steps

After completing the setup:

1. **Customize Branding**: Update colors, logos, and content
2. **Configure Analytics**: Set up tracking and monitoring
3. **Add Features**: Extend functionality as needed
4. **Scale Infrastructure**: Optimize for production load
5. **Marketing Setup**: Configure SEO and marketing tools

---

**Note**: This setup guide provides a high-level overview. Refer to the individual setup guides for detailed, step-by-step instructions for each component.
