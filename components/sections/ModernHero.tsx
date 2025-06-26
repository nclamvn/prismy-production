'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Star, Users, Globe, Zap, ArrowRight } from 'lucide-react'
import UnifiedGetStartedButton from '@/components/ui/UnifiedGetStartedButton'
import { useIsHydrated } from '@/hooks/useHydrationSafeAnimation'
import './GradientKeyframes.css'

export default function ModernHero() {
  const { language } = useLanguage()
  const [userCount, setUserCount] = useState(47832)
  const isHydrated = useIsHydrated()

  // Animate user count
  useEffect(() => {
    const interval = setInterval(() => {
      setUserCount(prev => prev + Math.floor(Math.random() * 3))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const content = {
    vi: {
      badge: 'Nền tảng #1 Việt Nam',
      headline: 'AI Agent cho',
      subHeadline: 'tài liệu',
      description:
        'Tham gia cùng hơn 50,000+ đội nhóm đang sử dụng AI để dịch thuật nhanh chóng, chính xác và tiết kiệm thời gian',
      primaryCTA: 'Bắt đầu miễn phí',
      socialProof: 'từ 1,200+ đánh giá',
      stats: {
        users: 'người dùng',
        languages: 'ngôn ngữ',
        documents: 'tài liệu đã dịch',
        accuracy: 'độ chính xác',
      },
      features: ['Dịch tức thì với AI', 'Bảo mật enterprise', '99.9% uptime'],
    },
    en: {
      badge: '#1 Platform in Vietnam',
      headline: 'AI Agent for',
      subHeadline: 'documents',
      description:
        'Join 50,000+ teams using AI to translate faster, more accurately, and save time',
      primaryCTA: 'Start for free',
      socialProof: 'from 1,200+ reviews',
      stats: {
        users: 'users',
        languages: 'languages',
        documents: 'documents translated',
        accuracy: 'accuracy',
      },
      features: [
        'Instant AI translation',
        'Enterprise security',
        '99.9% uptime',
      ],
    },
  }

  const currentContent = content[language]

  return (
    <section
      className="relative min-h-screen flex items-center justify-center pt-0"
      style={{
        background: 'rgba(251, 250, 249, 1)',
        overflow: 'visible',
      }}
    >
      {/* Animated Background - NotebookLM Style */}
      <div className="absolute inset-0">
        {/* Unified Background Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'transparent',
          }}
        />

        {/* Floating Elements */}
        <div
          className="absolute top-20 left-10 w-20 h-20 blur-xl animate-float-slow"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 'var(--shape-corner-full)',
          }}
        />

        <div
          className="absolute top-40 right-20 w-32 h-32 blur-xl animate-float-medium"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.015)',
            borderRadius: 'var(--shape-corner-full)',
          }}
        />

        <div
          className="absolute bottom-32 left-1/4 w-24 h-24 blur-xl animate-float-fast"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.01)',
            borderRadius: 'var(--shape-corner-full)',
          }}
        />
      </div>

      {/* Main Content */}
      <div
        className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8 text-center"
        style={{ overflow: 'visible', zIndex: 1 }}
      >
        {/* Main Headlines - Spacing Optimized - Final Clean Version */}
        <div
          className={`mb-6 ${isHydrated ? 'animate-hero-slide-up' : ''}`}
          style={{
            overflow: 'visible',
            marginBottom: '1.5rem',
            animationDelay: '200ms'
          }}
        >
          <h1
            className="font-extrabold tracking-tight hero-title-reduced"
            style={{
              lineHeight: '1.3',
              fontFamily: 'var(--sys-display-large-font)',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '0.05rem !important',
              overflow: 'visible',
              paddingTop: '0.25rem',
            }}
          >
            {currentContent.headline}
          </h1>
          <h2
            className="font-extrabold tracking-tight gradient-text animate-gradient-text hero-title-reduced"
            style={{
              lineHeight: '1.1',
              fontFamily: 'var(--sys-display-large-font)',
              fontWeight: '600',
              background: `linear-gradient(90deg, #6366f1 0%, #3b82f6 20%, #06b6d4 40%, #10b981 60%, #22c55e 80%, #6366f1 100%)`,
              backgroundSize: '200% 100%',
              animation: 'gradientFlow 4s linear infinite',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              overflow: 'visible',
              paddingTop: '0.25rem',
              marginTop: '0rem !important',
            }}
          >
            {currentContent.subHeadline}
          </h2>
        </div>

        {/* Description - NotebookLM Style */}
        <p
          className={`mb-8 max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed text-lg sm:text-xl lg:text-2xl ${isHydrated ? 'animate-hero-slide-up' : ''}`}
          style={{
            fontFamily: 'var(--sys-title-large-font)',
            fontWeight: 'var(--sys-title-large-weight)',
            color: 'var(--text-secondary)',
            animationDelay: '400ms'
          }}
        >
          {currentContent.description}
        </p>

        {/* CTA - Material Design 3 Style */}
        <div
          className={`flex justify-center items-center mb-12 ${isHydrated ? 'animate-hero-slide-up' : ''}`}
          style={{ animationDelay: '600ms' }}
        >
          <UnifiedGetStartedButton
            className="w-full sm:w-auto"
            style={{
              backgroundColor: 'var(--notebooklm-primary)',
              color: 'white',
              borderRadius: 'var(--mat-button-filled-container-shape)',
              paddingLeft:
                'calc(2 * var(--mat-button-filled-horizontal-padding))',
              paddingRight:
                'calc(2 * var(--mat-button-filled-horizontal-padding))',
              paddingTop: '1.5rem',
              paddingBottom: '1.5rem',
              fontSize: 'calc(2 * var(--sys-label-large-size))',
              lineHeight: 'var(--sys-label-large-line-height)',
              fontFamily: 'var(--sys-label-large-font)',
              fontWeight: '600',
              border: 'none',
              boxShadow: 'var(--elevation-level-1)',
              transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 'fit-content',
              height: 'auto',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor =
                'var(--notebooklm-primary-dark)'
              e.currentTarget.style.boxShadow = 'var(--elevation-level-2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor =
                'var(--notebooklm-primary)'
              e.currentTarget.style.boxShadow = 'var(--elevation-level-1)'
            }}
          >
            {currentContent.primaryCTA}
            <ArrowRight className="ml-2 w-5 h-5" />
          </UnifiedGetStartedButton>
        </div>

        {/* Social Proof - NotebookLM Style */}
        <div
          className={`flex items-center justify-center mb-16 ${isHydrated ? 'animate-hero-slide-up' : ''}`}
          style={{ animationDelay: '800ms' }}
        >
          <div
            className="flex items-center px-4 py-2"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderRadius: 'var(--shape-corner-full)',
              border: '1px solid var(--surface-outline)',
              boxShadow: 'var(--elevation-level-1)',
            }}
          >
            <div className="flex mr-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-gray-400 fill-current" />
              ))}
            </div>
            <span
              className="font-semibold mr-2"
              style={{
                fontSize: 'var(--sys-label-medium-size)',
                lineHeight: 'var(--sys-label-medium-line-height)',
                fontFamily: 'var(--sys-label-medium-font)',
                fontWeight: 'var(--sys-label-medium-weight)',
                color: 'var(--text-primary)',
              }}
            >
              4.9/5
            </span>
            <span
              style={{
                fontSize: 'var(--sys-body-medium-size)',
                lineHeight: 'var(--sys-body-medium-line-height)',
                fontFamily: 'var(--sys-body-medium-font)',
                fontWeight: 'var(--sys-body-medium-weight)',
                color: 'var(--text-secondary)',
              }}
            >
              {currentContent.socialProof}
            </span>
          </div>
        </div>

        {/* Live Stats - Material Design 3 Style */}
        <div
          className={isHydrated ? 'animate-hero-slide-up' : ''}
          style={{ animationDelay: '1000ms' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto"
        >
          <div
            className="text-center p-4 sm:p-6"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderRadius: 'var(--mat-card-elevated-container-shape)',
              border: '1px solid var(--surface-outline)',
              boxShadow: 'var(--elevation-level-1)',
            }}
          >
            <div
              key={userCount}
              className="mb-2 animate-user-count-update"
              style={{
                fontSize: 'var(--sys-headline-large-size)',
                lineHeight: 'var(--sys-headline-large-line-height)',
                fontFamily: 'var(--sys-headline-large-font)',
                fontWeight: 'var(--sys-headline-large-weight)',
                color: 'var(--text-primary)',
              }}
            >
              {userCount.toLocaleString()}+
            </div>
            <div
              style={{
                fontSize: 'var(--sys-body-medium-size)',
                lineHeight: 'var(--sys-body-medium-line-height)',
                fontFamily: 'var(--sys-body-medium-font)',
                fontWeight: 'var(--sys-body-medium-weight)',
                color: 'var(--text-secondary)',
              }}
            >
              {currentContent.stats.users}
            </div>
          </div>

          <div
            className="text-center p-4 sm:p-6"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderRadius: 'var(--mat-card-elevated-container-shape)',
              border: '1px solid var(--surface-outline)',
              boxShadow: 'var(--elevation-level-1)',
            }}
          >
            <div
              className="mb-2"
              style={{
                fontSize: 'var(--sys-headline-large-size)',
                lineHeight: 'var(--sys-headline-large-line-height)',
                fontFamily: 'var(--sys-headline-large-font)',
                fontWeight: 'var(--sys-headline-large-weight)',
                color: 'var(--text-primary)',
              }}
            >
              100+
            </div>
            <div
              style={{
                fontSize: 'var(--sys-body-medium-size)',
                lineHeight: 'var(--sys-body-medium-line-height)',
                fontFamily: 'var(--sys-body-medium-font)',
                fontWeight: 'var(--sys-body-medium-weight)',
                color: 'var(--text-secondary)',
              }}
            >
              {currentContent.stats.languages}
            </div>
          </div>

          <div
            className="text-center p-4 sm:p-6"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderRadius: 'var(--mat-card-elevated-container-shape)',
              border: '1px solid var(--surface-outline)',
              boxShadow: 'var(--elevation-level-1)',
            }}
          >
            <div
              className="mb-2"
              style={{
                fontSize: 'var(--sys-headline-large-size)',
                lineHeight: 'var(--sys-headline-large-line-height)',
                fontFamily: 'var(--sys-headline-large-font)',
                fontWeight: 'var(--sys-headline-large-weight)',
                color: 'var(--text-primary)',
              }}
            >
              2M+
            </div>
            <div
              style={{
                fontSize: 'var(--sys-body-medium-size)',
                lineHeight: 'var(--sys-body-medium-line-height)',
                fontFamily: 'var(--sys-body-medium-font)',
                fontWeight: 'var(--sys-body-medium-weight)',
                color: 'var(--text-secondary)',
              }}
            >
              {currentContent.stats.documents}
            </div>
          </div>

          <div
            className="text-center p-4 sm:p-6"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderRadius: 'var(--mat-card-elevated-container-shape)',
              border: '1px solid var(--surface-outline)',
              boxShadow: 'var(--elevation-level-1)',
            }}
          >
            <div
              className="mb-2"
              style={{
                fontSize: 'var(--sys-headline-large-size)',
                lineHeight: 'var(--sys-headline-large-line-height)',
                fontFamily: 'var(--sys-headline-large-font)',
                fontWeight: 'var(--sys-headline-large-weight)',
                color: 'var(--text-primary)',
              }}
            >
              99.9%
            </div>
            <div
              style={{
                fontSize: 'var(--sys-body-medium-size)',
                lineHeight: 'var(--sys-body-medium-line-height)',
                fontFamily: 'var(--sys-body-medium-font)',
                fontWeight: 'var(--sys-body-medium-weight)',
                color: 'var(--text-secondary)',
              }}
            >
              {currentContent.stats.accuracy}
            </div>
          </div>
        </div>

        {/* Feature Pills - Material Design 3 Style */}
        <div
          className={`flex flex-wrap justify-center gap-2 sm:gap-3 mt-8 sm:mt-12 ${isHydrated ? 'animate-hero-slide-up' : ''}`}
          style={{ animationDelay: '1200ms' }}
        >
          {currentContent.features.map((feature, index) => (
            <div
              key={feature}
              className="flex items-center px-3 py-2 sm:px-4"
              style={{
                backgroundColor: 'var(--surface-filled)',
                borderRadius: 'var(--shape-corner-full)',
                border: '1px solid var(--surface-outline)',
                fontSize: 'var(--sys-label-medium-size)',
                lineHeight: 'var(--sys-label-medium-line-height)',
                fontFamily: 'var(--sys-label-medium-font)',
                fontWeight: 'var(--sys-label-medium-weight)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--elevation-level-1)',
              }}
            >
              <Zap
                className="w-4 h-4 mr-2"
                style={{ color: 'var(--notebooklm-primary)' }}
              />
              {feature}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
