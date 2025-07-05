"use client"

import { Upload, Zap, Shield, ArrowRight, FileText, Languages, Download } from "lucide-react"
import { useTranslations } from 'next-intl'

import { Header } from "@/components/landing/header"
import { Hero } from "@/components/landing/hero"
import { Footer } from "@/components/landing/footer"
import { FeatureCard } from "@/components/ui/feature-card"
import { Timeline, TimelineItem } from "@/components/ui/timeline"
import { LogoCloud, demoLogos } from "@/components/ui/logo-cloud"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header transparent />

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-balance">
              {t('features.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              variant="gradient"
              icon={Zap}
              title={t('features.fast.title')}
              description={t('features.fast.description')}
            />
            <FeatureCard
              variant="gradient"
              icon={Shield}
              title={t('features.secure.title')}
              description={t('features.secure.description')}
            />
            <FeatureCard
              variant="gradient"
              icon={Languages}
              title={t('features.languages.title')}
              description={t('features.languages.description')}
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-balance">
              {t('workflow.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('workflow.subtitle')}
            </p>
          </div>

          <Timeline>
            <TimelineItem
              icon={Upload}
              iconVariant="filled"
              step={1}
              title={t('workflow.upload.title')}
              description={t('workflow.upload.description')}
            />
            <TimelineItem
              icon={Languages}
              iconVariant="filled"
              step={2}
              title={t('workflow.translate.title')}
              description={t('workflow.translate.description')}
            />
            <TimelineItem
              icon={Download}
              iconVariant="filled"
              step={3}
              title={t('workflow.download.title')}
              description={t('workflow.download.description')}
            />
          </Timeline>

          <div className="text-center mt-12">
            <Button size="lg" className="gap-2" onClick={() => window.location.href = '/upload'}>
              {t('workflow.cta')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 hidden md:block">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-muted-foreground">
              {t('socialProof.title')}
            </p>
          </div>
          <LogoCloud logos={demoLogos} size="default" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-balance">
              {t('cta.title')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2 text-base px-8 py-6 h-auto" onClick={() => window.location.href = '/upload'}>
                {t('cta.getStarted')}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="gap-2 text-base px-8 py-6 h-auto" onClick={() => window.location.href = '/api/health'}>
                <FileText className="h-4 w-4" />
                {t('cta.viewStatus')}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('cta.features')}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}