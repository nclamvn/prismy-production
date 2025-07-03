# 🔐 Custom Auth Domain Setup - Endoscope Method

## Overview

Setting up a custom auth domain is crucial for professional OAuth branding. Instead of users seeing `supabase.co` in the Google OAuth dialog, they'll see your branded domain like `auth.prismy.in`.

## Prerequisites

- **Supabase Team Plan or higher** (required for custom domains)
- Domain ownership with DNS management access
- SSL certificate management capability

## Step 1: Supabase Configuration

### 1.1 Upgrade to Team Plan

```bash
# Navigate to your Supabase dashboard
# Go to Settings → Billing
# Upgrade to Team plan ($25/month minimum)
```

### 1.2 Add Custom Domain

1. Go to **Settings → Auth → Custom Domains**
2. Click **Add Domain**
3. Enter your custom domain: `auth.prismy.in`
4. Supabase will provide DNS verification steps

## Step 2: DNS Configuration

### 2.1 Add CNAME Record

Add the following DNS record to your domain provider:

```dns
Type: CNAME
Name: auth
Value: cname.vercel-dns.com (or provided by Supabase)
TTL: 300 (or Auto)
```

### 2.2 Verify DNS Propagation

```bash
# Check DNS propagation
dig auth.prismy.in CNAME

# Should return your CNAME target
# May take up to 48 hours to fully propagate
```

## Step 3: SSL Certificate Setup

### 3.1 Automatic SSL (Recommended)

Supabase typically handles SSL automatically for custom domains:

```bash
# Verify SSL certificate
curl -I https://auth.prismy.in/health

# Should return 200 OK with valid SSL
```

### 3.2 Manual SSL (If Required)

If automatic SSL fails:

```bash
# Generate SSL certificate using certbot
sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials ~/.secrets/cloudflare.ini \
  -d auth.prismy.in

# Upload to Supabase dashboard
```

## Step 4: Update Application Configuration

### 4.1 Environment Variables

Update your `.env.local`:

```env
# OLD - Default Supabase domain
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# NEW - Custom auth domain (if using separate auth domain)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_AUTH_URL=https://auth.prismy.in
```

### 4.2 Supabase Client Configuration

Update `lib/supabase-browser.ts` if using separate auth domain:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Custom auth domain configuration
const authOptions = process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL 
  ? {
      auth: {
        url: process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  : {}

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    ...authOptions,
    // ... other options
  }
)
```

## Step 5: OAuth Provider Configuration

### 5.1 Google OAuth Console

Update your Google OAuth application:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services → Credentials**
3. Edit your OAuth 2.0 client
4. Update **Authorized redirect URIs**:

```
# Add your custom domain redirects
https://auth.prismy.in/auth/v1/callback
https://auth.prismy.in/auth/v1/callback/google

# Keep existing for fallback
https://your-project.supabase.co/auth/v1/callback
```

### 5.2 Other OAuth Providers

For Apple, GitHub, etc., update redirect URIs similarly:

```
# Apple
https://auth.prismy.in/auth/v1/callback/apple

# GitHub  
https://auth.prismy.in/auth/v1/callback/github
```

## Step 6: Testing & Verification

### 6.1 DNS and SSL Check

```bash
# Run our OAuth doctor script
npm run doctor

# Should show:
# ✅ Custom auth domain configured
# ✅ SSL certificate valid
# ✅ DNS resolution working
```

### 6.2 OAuth Flow Testing

```bash
# Test OAuth flow with custom domain
npm run test:oauth

# Verify in browser:
# 1. Google OAuth dialog should show "auth.prismy.in"
# 2. No certificate warnings
# 3. Successful authentication
```

### 6.3 Manual Verification

1. Open incognito browser
2. Navigate to your app's login page
3. Click "Sign in with Google"
4. **Verify**: OAuth dialog shows your custom domain
5. Complete authentication
6. **Verify**: Successful redirect to your app

## Step 7: Production Deployment

### 7.1 Update Environment Variables

For Vercel deployment:

```bash
# Set production environment variables
vercel env add NEXT_PUBLIC_SUPABASE_AUTH_URL production
# Enter: https://auth.prismy.in

# Redeploy
vercel --prod
```

### 7.2 Verify Production

```bash
# Test production OAuth
npm run test:oauth:prod

# Should complete successfully with custom domain
```

## Troubleshooting

### Common Issues

#### 1. DNS Not Propagating

```bash
# Check multiple DNS servers
dig @8.8.8.8 auth.prismy.in CNAME
dig @1.1.1.1 auth.prismy.in CNAME
dig @208.67.222.222 auth.prismy.in CNAME

# If inconsistent, wait for propagation
```

#### 2. SSL Certificate Issues

```bash
# Check SSL certificate details
openssl s_client -connect auth.prismy.in:443 -servername auth.prismy.in

# Look for certificate chain and validity
```

#### 3. OAuth Redirect Mismatch

```bash
# Check Supabase logs for redirect errors
# Ensure all OAuth providers have updated redirect URIs
# Verify exact URL format matches provider requirements
```

#### 4. CORS Issues

Add your custom domain to Supabase CORS settings:

```
# In Supabase Dashboard → Settings → API
# Add to allowed origins:
https://auth.prismy.in
```

### Debug Commands

```bash
# Test full OAuth flow
curl -v https://auth.prismy.in/auth/v1/authorize?provider=google

# Check health endpoint
curl https://auth.prismy.in/health

# Verify DNS resolution
nslookup auth.prismy.in
```

## Security Considerations

### 1. Domain Verification

- Ensure domain ownership before DNS changes
- Use strong SSL certificates (TLS 1.2+)
- Regularly monitor certificate expiry

### 2. Access Control

```bash
# Restrict admin access to DNS settings
# Use separate accounts for domain management
# Enable 2FA on domain registrar account
```

### 3. Monitoring

Set up monitoring for:
- SSL certificate expiry alerts
- DNS resolution monitoring  
- OAuth failure rate monitoring

## Cost Considerations

- **Supabase Team Plan**: $25/month minimum
- **SSL Certificate**: Usually free with modern providers
- **DNS Management**: Typically included with domain
- **Monitoring**: Optional, varies by provider

## Rollback Plan

If issues occur:

1. **Quick Rollback**: Remove custom domain from Supabase
2. **DNS Rollback**: Update OAuth providers to use original Supabase URLs
3. **Application Rollback**: Remove custom auth URL environment variables
4. **Verification**: Test OAuth flow with original domain

## Success Criteria

✅ Google OAuth dialog shows `auth.prismy.in`  
✅ SSL certificate valid and trusted  
✅ OAuth flow completes under 5 seconds  
✅ No certificate warnings in browser  
✅ Doctor script passes all custom domain checks  
✅ Production deployment successful  

## Next Steps

After successful setup:

1. **Monitor**: Set up alerting for domain/SSL issues
2. **Document**: Update team documentation with new URLs
3. **Optimize**: Consider CDN for auth domain if needed
4. **Scale**: Document process for additional domains/environments

---

**Note**: Custom auth domains require Supabase Team plan or higher. Consider the monthly cost vs. branding benefits for your specific use case.