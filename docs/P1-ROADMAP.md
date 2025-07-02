# P1 Performance & Observability Roadmap (8 tuần)

## 🎯 Tổng quan P1: "Optimize & Observe"

Sau khi P0 đã đóng sổ an toàn với 0 CVE vulnerabilities và infrastructure ổn định, P1 tập trung vào:

- **Performance**: Bundle optimization, caching strategy
- **Observability**: Monitoring, alerting, dashboards
- **Security**: Tightening CORS, automated scans
- **Quality Gates**: CI/CD thresholds for production readiness

## 📅 Timeline Chi Tiết

### **Tuần 1-2: Bundle & Performance Optimization**

#### Mục tiêu

- LCP mobile P95 < 3s
- Main bundle < 400KB
- CSS bundle < 120KB

#### Tasks

- [ ] Implement `next/dynamic` cho heavy components
  - [ ] DocumentEditor với React.lazy
  - [ ] PrismJS syntax highlighter
  - [ ] Chart components (Recharts)
- [ ] Enable `modularizeImports` trong next.config.js
- [ ] Add bundle analysis với `@next/bundle-analyzer`
- [ ] Implement code splitting cho routes
- [ ] Tree-shaking optimization

```javascript
// next.config.js additions
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
    recharts: {
      transform: 'recharts/lib/{{member}}',
    },
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
})
```

#### Success Metrics

- [ ] Bundle size meets .size-limit.json thresholds
- [ ] Lighthouse Performance score ≥ 75
- [ ] FCP < 2s, LCP < 3s mobile

---

### **Tuần 3-4: Edge Caching Strategy**

#### Mục tiêu

- Cache hit ratio ≥ 60%
- P95 API response time < 500ms
- Static asset CDN optimization

#### Tasks

- [ ] Vercel Edge Config cho static content
  - [ ] i18n translations
  - [ ] Pricing data
  - [ ] Feature flags
- [ ] Implement Stale-While-Revalidate cho PDF previews
- [ ] Redis caching strategy refinement
- [ ] Image optimization với next/image priority hints

```javascript
// Edge Config implementation
import { get } from '@vercel/edge-config'

export async function getI18nTranslations(locale: string) {
  const translations = await get(`translations-${locale}`)
  return translations || fallbackTranslations
}
```

#### Success Metrics

- [ ] Cache hit ratio tracking implemented
- [ ] API latency P95 < 500ms
- [ ] Static assets served from edge locations

---

### **Tuần 5-6: Observability Infrastructure**

#### Mục tiêu

- MTTR < 15 minutes
- 100% error visibility
- Proactive alerting

#### Tasks

- [ ] Grafana Cloud dashboard setup
  - [ ] Redis metrics (hit ratio, latency, memory)
  - [ ] API endpoint performance
  - [ ] User journey funnels
  - [ ] Error rate trends
- [ ] Sentry Performance monitoring
  - [ ] Sample rate 100% for slow transactions
  - [ ] Custom instrumentation cho translation pipeline
  - [ ] User experience metrics
- [ ] Slack alerting integration
  - [ ] 5xx errors > 0.1%/5min
  - [ ] API latency > 2s for 3 consecutive checks
  - [ ] Redis connection failures

```javascript
// Sentry performance setup
import * as Sentry from '@sentry/nextjs'

Sentry.startTransaction({
  name: 'document-translation',
  op: 'translation.process',
  data: {
    documentSize: file.size,
    sourceLanguage: from,
    targetLanguage: to,
  },
})
```

#### Success Metrics

- [ ] Dashboard deployed with core metrics
- [ ] Alert rules configured and tested
- [ ] MTTR baseline established

---

### **Tuần 7-8: Security & CORS Hardening**

#### Mục tiêu

- ZAP baseline 0 High, ≤ 1 Medium
- Production CORS policy tightened
- Automated dependency updates

#### Tasks

- [ ] Strict CORS configuration
  - [ ] Allowlist production domains only
  - [ ] Remove wildcard origins
  - [ ] Credential handling review
- [ ] Renovate bot setup for dependency updates
  - [ ] Auto-merge for patch versions
  - [ ] Weekly PRs for minor/major
  - [ ] Security advisory monitoring
- [ ] ZAP security scanning automation
  - [ ] Weekly full scans
  - [ ] PR-based baseline scans
  - [ ] Custom rules for false positives

```javascript
// Strict CORS configuration
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? ['https://prismy.in', 'https://www.prismy.in']
    : ['http://localhost:3000', 'http://127.0.0.1:3000']

export default cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
})
```

#### Success Metrics

- [ ] ZAP scan passes with 0 High vulnerabilities
- [ ] CORS policy validated in production
- [ ] Dependency update automation working

---

## 📊 Quality Gates Implementation

### CI/CD Thresholds

| Gate            | Threshold                         | Action on Failure |
| --------------- | --------------------------------- | ----------------- |
| **Bundle Size** | main.js ≤ 400KB, CSS ≤ 120KB      | Block merge       |
| **Performance** | LCP < 3s mobile, Performance ≥ 75 | Block merge       |
| **Coverage**    | Statements ≥ 80%, Branches ≥ 70%  | Block merge       |
| **Security**    | ZAP High = 0, Medium ≤ 1          | Block merge       |

### Branch Protection Rules

```yaml
required_status_checks:
  strict: true
  contexts:
    - 'Bundle Size Check'
    - 'Lighthouse Performance'
    - 'Security Scan (ZAP Baseline)'
    - 'Test Coverage'
```

## 💰 Resource Planning

### Infrastructure Costs

- **Grafana Cloud**: $0-20/mo (free tier → basic)
- **Vercel Edge Config**: $0 (within quota)
- **Additional monitoring**: $10-30/mo

### Engineering Hours

- **Week 1-2**: 35h (Bundle optimization)
- **Week 3-4**: 25h (Edge caching)
- **Week 5-6**: 25h (Observability)
- **Week 7-8**: 20h (Security hardening)
- **Total**: ~80h over 8 weeks

## 🚀 Success Definition

### End of P1 Targets

- **Performance**: LCP < 3s mobile, bundle < 400KB
- **Reliability**: MTTR < 15min, 99.9% uptime
- **Security**: 0 High vulnerabilities, automated scanning
- **Observability**: Full visibility into user journeys

### GA Readiness Scorecard

- [ ] Performance ≥ 8.5/10
- [ ] Security ≥ 9/10
- [ ] Reliability ≥ 9/10
- [ ] User Experience ≥ 8.5/10

**Target GA Date**: End of August 2025

---

## 📞 Support & Escalation

- **Daily standups**: Performance metrics review
- **Weekly reports**: P1 progress dashboard
- **Escalation path**: Performance issues → Architecture review
- **Stakeholder updates**: Bi-weekly executive summary

P1 completion positions Prismy for enterprise-grade reliability and sets foundation for SOC 2 compliance in Q4.
