# 👥 Team OAuth Diagnostics Workflow - Endoscope Method

## Overview
This document outlines the team workflow for diagnosing, debugging, and resolving OAuth authentication issues using the Endoscope Method monitoring system.

---

## 🚨 **When OAuth Issues Occur**

### **Immediate Response (< 5 minutes)**

#### 1. **Quick Health Check**
```bash
# Run automated health diagnostics
npm run doctor

# Check recent deployment status
vercel logs --follow

# Verify service status
make status
```

#### 2. **Identify Issue Scope**
- **Individual User**: Isolated browser/account issue
- **Multiple Users**: Systemic OAuth problem  
- **Complete Outage**: Infrastructure/configuration issue

#### 3. **Initial Triage**
| Issue Type | Symptoms | Priority | Response Time |
|------------|----------|----------|---------------|
| 🔴 **Critical** | No users can login | P0 | Immediate |
| 🟡 **High** | > 20% failure rate | P1 | < 30 min |
| 🟢 **Medium** | < 5% failure rate | P2 | < 2 hours |
| 🔵 **Low** | Edge case/specific browser | P3 | Next sprint |

---

## 🔍 **Diagnostic Tools & Procedures**

### **🩺 Primary Diagnostic Commands**

```bash
# Complete system health check
npm run doctor

# Test OAuth flow end-to-end
npm run test:oauth

# Test against production
npm run test:oauth:prod

# Check local development setup
make up-auth && make test-oauth
```

### **🧪 Browser-Based Diagnostics**

#### **For Developers:**
```javascript
// In browser console on affected page
window.authAnalytics.exportDiagnostics()
window.supabaseEventLogger.exportDiagnostics()
window.getAuthDiagnostics()

// Monitor real-time auth events
window.authAnalytics.getCurrentSession()
```

#### **For Support Team:**
1. **Ask user to open browser DevTools**
2. **Go to Console tab**  
3. **Paste and run:**
   ```javascript
   console.log("Auth Debug Info:", {
     currentUrl: window.location.href,
     hasAuthAnalytics: !!window.authAnalytics,
     authEvents: window.authAnalytics?.getSessionHistory?.() || 'Not available',
     localStorage: Object.keys(localStorage).filter(k => k.includes('supabase')),
     cookies: document.cookie.includes('sb-') ? 'Present' : 'Missing'
   })
   ```
4. **Ask user to screenshot and share results**

---

## 📋 **Issue Classification & Resolution**

### **🚫 Category 1: Authentication Failures**

#### **Symptoms:**
- Users stuck on "Authorising..." page
- Google OAuth redirects to error page
- "Sign-in fail" flash messages

#### **Diagnostic Steps:**
```bash
# 1. Check callback endpoint health
curl -I https://your-domain.com/auth/callback

# 2. Verify OAuth configuration
npm run doctor | grep -A5 "OAuth Pipeline"

# 3. Test with fresh browser
npm run test:oauth
```

#### **Common Causes & Fixes:**
| Cause | Symptoms | Fix |
|-------|----------|-----|
| Invalid OAuth credentials | `4xx` errors in network tab | Update `GOOGLE_CLIENT_ID` |
| Redirect URL mismatch | "redirect_uri_mismatch" | Update Google Console URLs |
| Expired session | Infinite loading loops | Clear browser cache |
| Network timeout | 15s+ callback processing | Check Supabase service status |

### **🔄 Category 2: Session Persistence Issues**

#### **Symptoms:**
- Page refresh logs user out
- "Please sign in" after successful OAuth
- Inconsistent login state

#### **Diagnostic Steps:**
```bash
# 1. Test session persistence
npm run test:oauth
# Look for "Session Persistence" test result

# 2. Check cookie configuration
npm run doctor | grep -A3 "Security Configuration"

# 3. Browser storage inspection
# In DevTools → Application → Storage
```

#### **Common Causes & Fixes:**
| Cause | Symptoms | Fix |
|-------|----------|-----|
| Cookie domain mismatch | Session lost on navigation | Check `SITE_URL` configuration |
| SameSite policy issues | OAuth works, session doesn't persist | Update cookie settings |
| Storage quota exceeded | Random session losses | Clear browser storage |
| Race condition in AuthContext | Flashing login states | Check auth state buffering |

### **⚡ Category 3: Performance Issues**

#### **Symptoms:**
- OAuth takes > 5 seconds
- Sign-out hangs or takes > 1 second
- Page loading slowly during auth

#### **Diagnostic Steps:**
```bash
# 1. Performance measurement
npm run test:oauth
# Check timing results

# 2. Bundle analysis
npm run analyze

# 3. Network analysis
# Use DevTools → Network tab during OAuth
```

#### **Common Causes & Fixes:**
| Cause | Symptoms | Fix |
|-------|----------|-----|
| Large callback bundle | Slow OAuth completion | Optimize imports, use dynamic loading |
| Network latency | Consistent slow timing | Check CDN configuration |
| Database connection issues | Random slow responses | Check Supabase connection pool |
| Inefficient auth state management | Multiple unnecessary re-renders | Optimize React state updates |

---

## 🛠 **Escalation Procedures**

### **Level 1: Team Member (Any Developer)**
**Capabilities:**
- Run diagnostic commands
- Check browser console for errors
- Basic configuration verification
- Restart development services

**Escalation Criteria:**
- Issue persists after basic troubleshooting
- Multiple users affected (> 10% failure rate)
- Infrastructure-related problems

### **Level 2: Senior Developer/Team Lead**
**Capabilities:**
- Deployment rollback decisions
- Advanced debugging with auth analytics
- Configuration changes
- Cross-service investigation

**Escalation Criteria:**
- Critical system outage (> 50% failure rate)
- Security concerns
- Infrastructure changes required

### **Level 3: DevOps/Infrastructure**
**Capabilities:**
- Service scaling and infrastructure changes
- DNS/domain configuration
- SSL certificate management
- Database performance optimization

---

## 📊 **Monitoring & Alerting**

### **Automated Monitoring**
```bash
# Set up continuous monitoring (run every 5 minutes)
*/5 * * * * cd /path/to/project && npm run test:oauth:prod > /dev/null || echo "OAuth failure detected" | mail -s "OAuth Alert" team@company.com
```

### **Key Metrics to Monitor**
| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| OAuth Success Rate | < 95% | Warning |
| OAuth Success Rate | < 90% | Critical |
| Average OAuth Time | > 8 seconds | Warning |
| Average OAuth Time | > 15 seconds | Critical |
| Sign-out Success Rate | < 98% | Warning |

### **Dashboard Setup**
```javascript
// Add to monitoring dashboard
const oauthMetrics = {
  successRate: window.authAnalytics?.getSuccessRate?.() || 0,
  averageTime: window.authAnalytics?.getAverageTime?.() || 0,
  errorRate: window.authAnalytics?.getErrorRate?.() || 0,
  lastUpdate: new Date().toISOString()
}
```

---

## 📝 **Documentation & Knowledge Sharing**

### **After Resolving Issues:**

#### **1. Update Runbook**
- Document new issue patterns
- Add resolution steps to this guide
- Update diagnostic commands if needed

#### **2. Team Communication**
```markdown
## OAuth Issue Resolution - [Date]

**Issue**: [Brief description]
**Impact**: [Users affected, duration]
**Root Cause**: [Technical explanation]
**Resolution**: [Steps taken]
**Prevention**: [How to avoid in future]
**Diagnostic Commands Used**: 
- `npm run doctor`
- `window.authAnalytics.exportDiagnostics()`
```

#### **3. Post-Mortem (for P0/P1 issues)**
- Timeline of events
- Detection time analysis
- Resolution effectiveness
- Monitoring improvements needed

---

## 🎯 **Proactive Maintenance**

### **Weekly Health Checks**
```bash
# Every Monday morning
npm run doctor
npm run test:oauth:prod
npm run quality:full

# Review and update if needed:
# - OAuth provider configurations
# - Certificate expiry dates
# - Environment variable rotation
```

### **Monthly Reviews**
- OAuth success rate trends
- Performance metric analysis
- User feedback on auth experience
- Security audit of auth flow

---

## 📚 **Training & Onboarding**

### **New Team Member Checklist**
- [ ] Run `npm run doctor` and understand output
- [ ] Complete OAuth test flow: `npm run test:oauth`
- [ ] Learn browser diagnostic commands
- [ ] Understand escalation procedures
- [ ] Practice with development environment: `make up-auth`

### **Advanced Training**
- [ ] Auth analytics deep dive
- [ ] Custom diagnostic script creation
- [ ] Supabase event logger usage
- [ ] Performance optimization techniques

---

## 🚀 **Quick Reference**

### **Emergency Commands**
```bash
# Health check
npm run doctor

# Test OAuth
npm run test:oauth:prod

# Service status  
make status

# Deployment rollback
vercel rollback

# Browser diagnostics
window.authAnalytics.exportDiagnostics()
```

### **Support Ticket Template**
```
OAuth Issue Report

User: [Email/ID]
Browser: [Chrome/Safari/Firefox + version]
Device: [Desktop/Mobile OS]
URL: [Where issue occurred]
Time: [When issue happened]
Error: [Error message/screenshot]
Reproduction: [Steps to reproduce]
Console: [Browser console output if available]
```

---

**🎉 This workflow ensures rapid diagnosis and resolution of OAuth issues while building team expertise in the Endoscope Method monitoring system.**