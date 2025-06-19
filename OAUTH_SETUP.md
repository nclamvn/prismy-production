# OAuth Setup Guide

## Google OAuth Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API

2. **Configure OAuth Consent Screen**
   - Go to APIs & Services → OAuth consent screen
   - Choose External user type
   - Fill in application details:
     - App name: Prismy
     - User support email: your-email@domain.com
     - Developer contact: your-email@domain.com

3. **Create OAuth 2.0 Credentials**
   - Go to APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Name: Prismy Web Client
   - Authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for development)

4. **Configure in Supabase**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable Google provider
   - Add Client ID and Client Secret from Google Console

## Apple Sign-In Setup

1. **Apple Developer Account**
   - Ensure you have an Apple Developer account
   - Go to [Apple Developer Portal](https://developer.apple.com/)

2. **Create App ID**
   - Go to Certificates, Identifiers & Profiles
   - Create new App ID with Sign In with Apple capability

3. **Create Service ID**
   - Create new Service ID
   - Configure Sign In with Apple
   - Add domain: your-domain.com
   - Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`

4. **Create Private Key**
   - Create new Key with Sign In with Apple capability
   - Download the private key file (.p8)

5. **Configure in Supabase**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable Apple provider
   - Add Service ID, Team ID, Key ID, and Private Key

## Environment Variables

Add these to your `.env.local`:

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OAuth providers will be configured in Supabase dashboard
# No additional environment variables needed for the app
```

## Testing OAuth

1. **Google OAuth Test**
   - Click "Continue with Google" button
   - Should redirect to Google OAuth consent
   - After authorization, should redirect back to `/dashboard`

2. **Apple Sign-In Test**
   - Click "Continue with Apple" button
   - Should redirect to Apple Sign-In
   - After authorization, should redirect back to `/dashboard`

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Ensure redirect URIs match exactly in OAuth provider settings
   - Include both production and development URLs

2. **"OAuth provider not configured"**
   - Check Supabase dashboard that providers are enabled
   - Verify credentials are entered correctly

3. **"Failed to fetch" error**
   - Check network connectivity
   - Verify Supabase URL and keys are correct
   - Check browser console for specific error messages

### Email Signup Error Fix

The "Failed to fetch" error for email signup is likely due to:

1. **Supabase Configuration**
   - Email confirmation might be required
   - Go to Supabase → Authentication → Settings
   - Disable "Enable email confirmations" for testing
   - Or set up email templates properly

2. **Network Issues**
   - Check if Supabase project is active
   - Verify environment variables are loaded correctly

3. **CORS Issues**
   - Ensure your domain is added to allowed origins in Supabase

## Production Checklist

- [ ] Google OAuth configured with production domain
- [ ] Apple Sign-In configured with production domain  
- [ ] Supabase redirect URLs updated for production
- [ ] Email confirmation flow set up (if needed)
- [ ] Test all OAuth flows on production domain