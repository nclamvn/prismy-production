# 🚀 Prismy Production

[\![CI/CD](https://github.com/nclamvn/prismy-production/workflows/CI/badge.svg)](https://github.com/nclamvn/prismy-production/actions)
[\![Coverage](https://img.shields.io/codecov/c/github/nclamvn/prismy-production)](https://codecov.io/gh/nclamvn/prismy-production)
[\![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=prismy-production&metric=alert_status)](https://sonarcloud.io/dashboard?id=prismy-production)
[\![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=prismy-production&metric=security_rating)](https://sonarcloud.io/dashboard?id=prismy-production)

Enterprise-grade AI-powered document translation platform with Vietnamese payment integration.

## ✨ Features

- 🔄 **Multi-format Support**: PDF, DOCX, PPTX translation
- 🧠 **AI-Powered**: GPT-4, Claude, Google Translate integration  
- 💳 **Vietnamese Payments**: Local payment gateway support
- 🌐 **Real-time Translation**: Live document processing
- 🔐 **Enterprise Security**: OAuth, RLS, CSP protection
- 📱 **Mobile Optimized**: Responsive design system

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/nclamvn/prismy-production.git
cd prismy-production

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Add your Supabase + Stripe keys

# Start development
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📚 Documentation

- [🏗️ Architecture Guide](./docs/ARCHITECTURE.md) - System overview & quick start
- [🎨 Design System](./docs/DESIGN_SYSTEM.md) - UI components & tokens
- [📡 API Reference](./docs/API.md) - Endpoint documentation
- [🚀 Deployment Guide](./docs/DEPLOYMENT.md) - Production setup
- [🔒 Security Checklist](./docs/SECURITY.md) - Security measures

## 🛠️ Development

```bash
# Quality checks
npm run lint              # ESLint
npm run type-check        # TypeScript
npm run format            # Prettier

# Testing
npm run test              # Unit tests
npm run test:e2e          # Integration tests
npm run test:coverage     # Coverage report

# Build
npm run build             # Production build
npm run analyze           # Bundle analysis
```

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL + Auth)
- **Payments**: Stripe + Vietnamese gateways
- **AI**: OpenAI GPT-4, Anthropic Claude
- **Styling**: Tailwind CSS + Design Tokens
- **Testing**: Jest, Playwright, Storybook
- **CI/CD**: GitHub Actions + Vercel

## 🌍 Deployment

- **Production**: [prismy.in](https://prismy.in)
- **Staging**: [prismy-staging.vercel.app](https://prismy-staging.vercel.app)
- **Storybook**: [storybook.prismy.in](https://storybook.prismy.in)

## 📊 Quality Metrics

- **Test Coverage**: 80%+ maintained
- **Performance**: Core Web Vitals optimized
- **Security**: SonarCloud A-rating
- **Accessibility**: WCAG 2.1 AA compliant

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

See [Contributing Guide](./CONTRIBUTING.md) for detailed guidelines.

## 📜 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file.

## 🆘 Support

- **Documentation**: [docs.prismy.in](https://docs.prismy.in)
- **Issues**: [GitHub Issues](https://github.com/nclamvn/prismy-production/issues)
- **Email**: support@prismy.in

---

**Status**: ✅ Production Ready (v1.0.0-recovery)  
**Last Updated**: January 2025  
**Next Milestone**: v1.1.0 - Enhanced AI Features
EOF < /dev/null