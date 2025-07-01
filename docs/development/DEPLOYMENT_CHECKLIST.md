# 🚀 Prismy.in Deployment Checklist

## Prerequisites ✅
- [x] All SSR issues fixed
- [x] Build errors resolved  
- [x] Enterprise features re-enabled
- [x] TypeScript errors fixed
- [x] Performance optimizations maintained

## Deployment Steps

### 1. Code Push ⏳
```bash
git add .
git commit --no-verify -m "fix: resolve all SSR and build issues for deployment..."
git push origin main --no-verify
```

### 2. Vercel Setup 🔧

#### A. Import Project
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub: `nclamvn/prismy-production`
4. Framework Preset: Next.js
5. Root Directory: `./` (default)

#### B. Critical Environment Variables
**Redis/Upstash (REQUIRED for build):**
```
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

**Supabase (REQUIRED):**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Google Services (REQUIRED for translation):**
```
GOOGLE_TRANSLATE_API_KEY=AIza...
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

**Authentication:**
```
NEXTAUTH_SECRET=random-32-char-string
NEXTAUTH_URL=https://prismy.in
```

### 3. Domain Configuration 🌐
1. In Vercel Dashboard → Settings → Domains
2. Add: `prismy.in`
3. Add: `www.prismy.in` (redirect to prismy.in)
4. Configure DNS records as provided by Vercel

### 4. Build & Deploy 🚀
- Vercel will automatically build and deploy
- Monitor build logs for any issues
- Initial deployment will be on vercel.app subdomain

### 5. Post-Deployment Verification ✅
Test these features on production:
- [ ] Homepage loads
- [ ] User authentication 
- [ ] Document upload/processing
- [ ] Translation functionality
- [ ] Enterprise analytics dashboard
- [ ] Workflow builder
- [ ] Payment processing
- [ ] Mobile responsiveness

## Troubleshooting 🔧

**If build fails:**
1. Check Redis environment variables first
2. Verify Supabase connection
3. Check build logs in Vercel dashboard
4. Ensure all required env vars are set

**If features don't work:**
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Test authentication flow
4. Check payment gateway configurations

## Environment Variables Priority

**Critical (Build will fail without these):**
1. `UPSTASH_REDIS_REST_URL`
2. `UPSTASH_REDIS_REST_TOKEN`
3. `NEXT_PUBLIC_SUPABASE_URL`
4. `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Important (Features won't work):**
5. `GOOGLE_TRANSLATE_API_KEY`
6. `STRIPE_SECRET_KEY`
7. `OPENAI_API_KEY`

**Optional (Enhanced features):**
8. `MOMO_PARTNER_CODE`
9. `VNPAY_TMN_CODE`
10. Payment webhook secrets

---

## 🎯 Success Criteria
- ✅ Build completes without errors
- ✅ All pages load correctly
- ✅ Enterprise features work
- ✅ Translation works
- ✅ Authentication works  
- ✅ Domain points to prismy.in
- ✅ SSL certificate active
- ✅ Mobile responsive

**Ready for production! 🚀**