# 🚀 Prismy v2 Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Infrastructure Ready:
- [x] Feature flag system implemented
- [x] Database migrations created (4 files)
- [x] Security hardening (rate limiting, RLS policies)
- [x] Error tracking (Sentry integration)
- [x] User seeding scripts
- [x] Vercel configuration
- [x] Environment templates

## 🔧 Environment Setup

### 1. Create Environment File
```bash
# Copy the template
cp .env.example .env.local

# Edit with your actual values:
# Required:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional (for full functionality):
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
SENTRY_DSN=your_sentry_dsn
```

### 2. Install Dependencies
```bash
npm install
```

## 🏗️ Build & Test

### 1. Build Application
```bash
npm run build
```

### 2. Run Quick Validation
```bash
cd tests/validation
chmod +x quick-validation.sh
./quick-validation.sh
```

## 💾 Database Setup (If Using Supabase)

### 1. Run Migrations
```bash
cd database/scripts
tsx run-migrations.ts up
```

### 2. Seed Production Users
```bash
tsx seed-users.ts production
```

## 🚀 Deploy to Vercel

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
# Deploy to production
vercel --prod
```

### 4. Set Environment Variables in Vercel
```bash
# Core variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# API keys
vercel env add OPENAI_API_KEY
vercel env add ANTHROPIC_API_KEY

# Feature flags (MVP mode)
vercel env add MVP_MODE true
vercel env add ENABLE_LARGE_UPLOADS false
vercel env add ENABLE_CHUNKED_UPLOAD false
vercel env add ENABLE_OCR_QUEUE false
vercel env add ENABLE_REAL_TRANSLATION true
vercel env add ENABLE_ADMIN_PANEL true
vercel env add ENABLE_ANALYTICS true
vercel env add ENABLE_ERROR_TRACKING true
vercel env add ENABLE_RATE_LIMITING true
vercel env add ENABLE_PERFORMANCE_MONITORING true
vercel env add NEXT_PUBLIC_PIPELINE_V2 true

# Application settings
vercel env add NEXT_PUBLIC_APP_URL https://your-domain.vercel.app
vercel env add NEXT_PUBLIC_ENVIRONMENT production

# Optional: Monitoring
vercel env add SENTRY_DSN
vercel env add SENTRY_ORG
vercel env add SENTRY_PROJECT
vercel env add SENTRY_AUTH_TOKEN
```

## 🔍 Post-Deployment Validation

### 1. Health Check
```bash
curl https://your-domain.vercel.app/api/health
```

### 2. Test Core Functionality
- [ ] Homepage loads
- [ ] Login/signup works
- [ ] Admin panel accessible (admin@prismy.com)
- [ ] File upload works (≤50MB)
- [ ] Error tracking active

### 3. Monitor Performance
- Check Vercel dashboard for deployment status
- Monitor Sentry for errors (if configured)
- Test user registration and login flows

## ⚡ Feature Rollout Plan

### Week 1: MVP Mode (Current)
- ✅ File upload (≤50MB)
- ✅ Basic translation pipeline
- ✅ Admin panel
- ✅ Error tracking

### Week 2: Enable Large Files (+48 hours)
```bash
vercel env add ENABLE_LARGE_UPLOADS true
vercel env add ENABLE_CHUNKED_UPLOAD true
```

### Week 3: Enable Advanced Features (+72 hours)
```bash
vercel env add ENABLE_OCR_QUEUE true
vercel env add ENABLE_SUMMARY_GENERATION true
```

## 🚨 Emergency Rollback

### Rollback Deployment
```bash
vercel rollback
```

### Disable Features
```bash
vercel env add MVP_MODE true
vercel env add ENABLE_LARGE_UPLOADS false
vercel env add ENABLE_OCR_QUEUE false
```

### Database Rollback
```bash
cd database/scripts
tsx run-migrations.ts rollback
```

## 📊 Monitoring & Maintenance

### Key Metrics to Monitor:
- **Uptime**: >99.5%
- **Response Time**: <3s
- **Error Rate**: <1%
- **Memory Usage**: Stable

### Daily Checks (First Week):
- [ ] Error rates in monitoring
- [ ] Performance metrics
- [ ] User feedback
- [ ] System capacity

### Weekly Reviews:
- [ ] Feature flag performance impact
- [ ] User adoption metrics
- [ ] Security audit results
- [ ] Capacity planning

## ✅ Success Criteria

### Technical:
- [x] All infrastructure components deployed
- [x] Database migrations applied
- [x] Security policies active
- [x] Monitoring configured
- [x] Feature flags operational

### Business:
- [ ] User registration working
- [ ] Core translation pipeline functional
- [ ] Admin capabilities available
- [ ] Error rates within acceptable limits
- [ ] Performance meets targets

## 🎉 You're Ready for Production!

Your Prismy v2 application is now ready to go live with:
- **Secure architecture** with RLS policies and rate limiting
- **Scalable infrastructure** with feature flags for safe rollout
- **Comprehensive monitoring** with error tracking and health checks
- **Production-ready database** with proper migrations and seeding
- **Safe deployment process** with rollback capabilities

**Welcome to production! 🚀**

---

### Support & Documentation:
- Production checklist: `deploy/production-checklist.md`
- Validation tests: `tests/validation/`
- Database scripts: `database/scripts/`
- Feature flags: `src/lib/feature-flags.ts`