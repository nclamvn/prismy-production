# Vercel Environment Variables Setup for prismy.in

This document outlines all the environment variables that need to be configured in Vercel for successful deployment.

## Critical Environment Variables (Required for Build)

### 1. Redis/Upstash Configuration

```
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 2. Supabase Configuration

```
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Google Services

```
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key
GOOGLE_CLOUD_PROJECT_ID=your-google-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

### 4. Authentication

```
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://prismy.in
```

### 5. Stripe Configuration

```
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### 6. Payment Gateways (Vietnam)

```
MOMO_PARTNER_CODE=your-momo-partner-code
MOMO_ACCESS_KEY=your-momo-access-key
MOMO_SECRET_KEY=your-momo-secret-key
VNPAY_TMN_CODE=your-vnpay-terminal-code
VNPAY_HASH_SECRET=your-vnpay-hash-secret
```

### 7. OpenAI Configuration

```
OPENAI_API_KEY=sk-your-openai-api-key
```

## Vercel Deployment Steps

1. **Push Code to GitHub** (run the git commands provided by the Task agent)
2. **Connect GitHub to Vercel**
3. **Import Project** in Vercel dashboard
4. **Configure Environment Variables** in Vercel Project Settings
5. **Set Custom Domain** to prismy.in
6. **Deploy**

## Build Configuration in Vercel

The project is already configured with:

- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Node.js Version: 18.x

## Domain Configuration

1. In Vercel Dashboard → Project → Settings → Domains
2. Add custom domain: `prismy.in`
3. Add www redirect: `www.prismy.in` → `prismy.in`
4. Vercel will provide DNS records to configure with your domain registrar

## Post-Deployment Verification

After deployment, verify:

- [ ] Homepage loads correctly
- [ ] Authentication works
- [ ] Translation functionality works
- [ ] Document upload works
- [ ] Payment processing works
- [ ] Enterprise features are accessible
- [ ] Mobile responsiveness is maintained

## Troubleshooting

If build fails:

1. Check environment variables are set correctly
2. Verify Redis/Upstash connection
3. Check Supabase configuration
4. Review build logs in Vercel dashboard

All SSR issues have been resolved in the latest commit:

- Fixed window/document access in performance optimizer
- Fixed accessibility enhancer SSR issues
- Added proper browser API checks
- Re-enabled all enterprise features
- No functionality was sacrificed
