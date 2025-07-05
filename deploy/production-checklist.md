# Production Deployment Checklist

## 🛫 GO-LIVE-FOR-INTERNAL Deployment

### Phase 1: Infrastructure Setup ✅
- [x] Feature flag system implemented
- [x] Database migrations and RLS policies created
- [x] User seeding scripts prepared
- [x] Vercel deployment configuration
- [x] Environment variables template

### Phase 2: Security & Monitoring
- [ ] Sentry error tracking integration
- [ ] Performance monitoring setup
- [ ] Rate limiting implementation
- [ ] Security headers and CORS
- [ ] CSP (Content Security Policy)

### Phase 3: Database Setup
```bash
# Run database migrations
cd database/scripts
tsx run-migrations.ts up

# Seed production users
tsx seed-users.ts production

# Verify setup
tsx seed-users.ts show
```

### Phase 4: Environment Configuration

#### Vercel Environment Variables
Set these in Vercel dashboard or via CLI:

```bash
# Core Configuration
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY  
vercel env add SUPABASE_SERVICE_ROLE_KEY

# AI APIs
vercel env add OPENAI_API_KEY
vercel env add ANTHROPIC_API_KEY

# Monitoring
vercel env add SENTRY_DSN
vercel env add SENTRY_ORG
vercel env add SENTRY_PROJECT
vercel env add SENTRY_AUTH_TOKEN

# Feature Flags - Production Start State
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

# Application
vercel env add NEXT_PUBLIC_APP_URL https://prismy.in
vercel env add NEXT_PUBLIC_ENVIRONMENT production
```

### Phase 5: Testing & Validation

#### 🔍 8-Step Validation Checklist
1. **Authentication Flow**
   - [ ] User registration works
   - [ ] Login/logout functions
   - [ ] Password reset flow
   - [ ] Admin access control

2. **Core Pipeline (MVP Mode)**
   - [ ] File upload (≤50MB)
   - [ ] OCR text extraction
   - [ ] Language detection
   - [ ] Translation service
   - [ ] Document reconstruction
   - [ ] Preview and download

3. **Admin Functions**
   - [ ] Admin panel access
   - [ ] Settings management
   - [ ] User management
   - [ ] System metrics view

4. **Security**
   - [ ] RLS policies active
   - [ ] File access restrictions
   - [ ] Rate limiting functional
   - [ ] Error tracking working

5. **Performance**
   - [ ] Page load times <3s
   - [ ] API response times <2s
   - [ ] File processing within limits
   - [ ] Memory usage stable

6. **Error Handling**
   - [ ] Graceful error messages
   - [ ] Fallback behaviors
   - [ ] Log aggregation
   - [ ] Recovery procedures

7. **User Experience**
   - [ ] Mobile responsive
   - [ ] Accessibility compliance
   - [ ] Loading states
   - [ ] Success feedback

8. **Monitoring**
   - [ ] Error tracking active
   - [ ] Performance metrics
   - [ ] Usage analytics
   - [ ] Uptime monitoring

### Phase 6: Feature Rollout Plan

#### Week 1: Core MVP (Current)
- ✅ Basic file upload (≤50MB)
- ✅ OCR + Translation pipeline
- ✅ Admin panel
- ✅ User management

#### Week 2: Enhanced Features (+48 hours)
```bash
# Enable large file uploads
vercel env add ENABLE_LARGE_UPLOADS true
vercel env add ENABLE_CHUNKED_UPLOAD true

# Monitor system performance
# Enable if stable:
vercel env add ENABLE_OCR_QUEUE true
```

#### Week 3: Advanced Features (+72 hours)
```bash
# Additional UI/UX features
vercel env add ENABLE_DARK_MODE true
vercel env add ENABLE_SUMMARY_GENERATION true

# Enhanced admin capabilities
# Enable advanced analytics
```

### Phase 7: Rollback Procedures

#### Emergency Rollback
```bash
# Revert to previous Vercel deployment
vercel rollback

# Or disable problematic features
vercel env add MVP_MODE true
vercel env add ENABLE_LARGE_UPLOADS false
vercel env add ENABLE_OCR_QUEUE false
```

#### Database Rollback
```bash
# Rollback last migration if needed
cd database/scripts
tsx run-migrations.ts rollback
```

### Phase 8: Monitoring & Maintenance

#### Daily Checks (First Week)
- [ ] Error rates in Sentry
- [ ] System performance metrics
- [ ] User feedback/support tickets
- [ ] Database performance
- [ ] Storage usage

#### Weekly Reviews
- [ ] Feature flag performance impact
- [ ] User adoption metrics
- [ ] System capacity planning
- [ ] Security audit results

### Emergency Contacts
- **Technical Lead**: [Internal Team]
- **Supabase Support**: support@supabase.com
- **Vercel Support**: support@vercel.com
- **Sentry Support**: support@sentry.io

### Success Metrics
- **Uptime**: >99.5%
- **Page Load Time**: <3 seconds
- **API Response Time**: <2 seconds
- **Error Rate**: <1%
- **User Satisfaction**: >4.0/5.0

### Production URLs
- **Main Application**: https://prismy.in
- **Admin Panel**: https://prismy.in/admin
- **API Health Check**: https://prismy.in/api/health
- **Status Page**: [To be configured]

---

## ⚠️ Critical Notes

1. **MVP Mode**: Starts enabled with 50MB file limit
2. **Large Uploads**: Disabled initially, enable after 48h monitoring
3. **Admin Access**: Only prismy.com emails get admin role
4. **Test Users**: Available for internal testing
5. **Rollback Ready**: All changes reversible via feature flags

## 📞 Go-Live Checklist

Before switching DNS to production:
- [ ] All environment variables set
- [ ] Database migrations completed
- [ ] SSL certificate configured
- [ ] CDN/caching configured
- [ ] Monitoring dashboards ready
- [ ] Support processes defined
- [ ] Rollback procedures tested