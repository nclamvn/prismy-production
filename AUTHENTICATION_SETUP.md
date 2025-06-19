# Authentication Setup Guide

## Overview

Prismy uses Supabase for authentication with support for email/password signup and OAuth providers (Google and Apple). This guide covers the complete authentication system setup including database configuration, OAuth integration, and production deployment.

## Core Authentication (Supabase)

### 1. Create Supabase Project
```bash
# Go to https://supabase.com/dashboard
# Create new project
# Copy Project URL and Anon Key
```

### 2. Environment Variables
Add to your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Database Setup
Run the SQL in `supabase-setup.sql` via Supabase dashboard to create:
- `user_profiles` table with subscription tiers
- `translation_history` table for user translations
- `usage_analytics` table for tracking
- Row Level Security (RLS) policies
- Automated triggers and functions

### 4. Authentication Configuration
In Supabase Dashboard → Authentication → Settings:
- Configure email confirmations (optional for development)
- Set redirect URLs for production deployment
- Configure rate limiting and security settings

## OAuth Providers Integration

### Google OAuth Setup

#### 1. Create Google Cloud Project
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create new project or select existing one
- Enable Google+ API

#### 2. Configure OAuth Consent Screen
- Go to APIs & Services → OAuth consent screen
- Choose External user type
- Fill in application details:
  - App name: Prismy
  - User support email: your-email@domain.com
  - Developer contact: your-email@domain.com

#### 3. Create OAuth 2.0 Credentials
- Go to APIs & Services → Credentials
- Create Credentials → OAuth 2.0 Client ID
- Application type: Web application
- Name: Prismy Web Client
- Authorized redirect URIs:
  - `https://your-project.supabase.co/auth/v1/callback`
  - `http://localhost:3000/auth/callback` (for development)

#### 4. Configure in Supabase
- Go to Supabase Dashboard → Authentication → Providers
- Enable Google provider
- Add Client ID and Client Secret from Google Console

### Apple Sign-In Setup

#### 1. Apple Developer Account
- Ensure you have an Apple Developer account
- Go to [Apple Developer Portal](https://developer.apple.com/)

#### 2. Create App ID
- Go to Certificates, Identifiers & Profiles
- Create new App ID with Sign In with Apple capability

#### 3. Create Service ID
- Create new Service ID
- Configure Sign In with Apple
- Add domain: your-domain.com
- Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`

#### 4. Create Private Key
- Create new Key with Sign In with Apple capability
- Download the private key file (.p8)

#### 5. Configure in Supabase
- Go to Supabase Dashboard → Authentication → Providers
- Enable Apple provider
- Add Service ID, Team ID, Key ID, and Private Key

## Database Schema

### User Profiles Table
```sql
user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  usage_limit INTEGER DEFAULT 10,
  usage_count INTEGER DEFAULT 0,
  usage_reset_date TIMESTAMP,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  subscription_plan TEXT,
  subscription_current_period_start TIMESTAMP,
  subscription_current_period_end TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Translation History Table
```sql
translation_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_language VARCHAR(10),
  target_language VARCHAR(10),
  quality_tier TEXT,
  quality_score DECIMAL(3,2),
  character_count INTEGER,
  created_at TIMESTAMP
)
```

## Subscription Tiers

| Tier | Monthly Limit | Features |
|------|---------------|----------|
| **Free** | 10 translations | Basic translation |
| **Standard** | 50 translations | Enhanced accuracy |
| **Premium** | 200 translations | Professional quality + History |
| **Enterprise** | 1000 translations | Maximum precision + Analytics |

## Authentication Flow

1. **Sign Up**: Email + Password + Full Name OR OAuth provider
2. **Auto Profile Creation**: Triggered on user registration
3. **Session Management**: Automatic token refresh with SSR support
4. **Usage Tracking**: Real-time quota monitoring
5. **Profile Updates**: Subscription and settings management

## Testing

### Email Authentication Test
```bash
1. Click "Get Started" button
2. Create new account with email/password
3. Verify profile creation in database
4. Test sign in/out functionality
5. Check user menu and navigation
```

### OAuth Testing
1. **Google OAuth Test**:
   - Click "Continue with Google" button
   - Should redirect to Google OAuth consent
   - After authorization, should redirect back to `/dashboard`

2. **Apple Sign-In Test**:
   - Click "Continue with Apple" button
   - Should redirect to Apple Sign-In
   - After authorization, should redirect back to `/dashboard`

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Automatic Triggers**: Profile creation and usage tracking
- **Secure Cookies**: SSR-compatible session handling
- **Input Validation**: Client and server-side validation
- **OAuth Security**: Proper redirect URI validation

## Troubleshooting

### Common Issues

#### "Invalid redirect URI"
- Ensure redirect URIs match exactly in OAuth provider settings
- Include both production and development URLs

#### "OAuth provider not configured"
- Check Supabase dashboard that providers are enabled
- Verify credentials are entered correctly

#### "Failed to fetch" error
- Check network connectivity
- Verify Supabase URL and keys are correct
- Check browser console for specific error messages

#### Email Signup Error Fix
The "Failed to fetch" error for email signup is likely due to:

1. **Supabase Configuration**:
   - Email confirmation might be required
   - Go to Supabase → Authentication → Settings
   - Disable "Enable email confirmations" for testing
   - Or set up email templates properly

2. **Network Issues**:
   - Check if Supabase project is active
   - Verify environment variables are loaded correctly

3. **CORS Issues**:
   - Ensure your domain is added to allowed origins in Supabase

## Production Deployment

### Pre-Production Checklist
- [ ] Google OAuth configured with production domain
- [ ] Apple Sign-In configured with production domain
- [ ] Supabase redirect URLs updated for production
- [ ] Email confirmation flow set up (if needed)
- [ ] Test all OAuth flows on production domain
- [ ] RLS policies tested and verified
- [ ] Database backups configured

### Production Environment Variables
```env
# Production Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key

# Production Site URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### OAuth Production URLs
Update OAuth redirect URIs to:
- Google: `https://your-prod-project.supabase.co/auth/v1/callback`
- Apple: `https://your-prod-project.supabase.co/auth/v1/callback`

## API Integration

The authentication system integrates with:
- Translation API (usage tracking and rate limiting)
- User-specific translation history
- Subscription-based feature access
- Payment processing for premium features

This authentication system provides a complete foundation for user management, subscription handling, and secure access control throughout the Prismy platform.