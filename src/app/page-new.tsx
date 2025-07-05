"use client"

import { Upload, Zap, Shield, ArrowRight, FileText, Languages, Download } from "lucide-react"

import { Header } from "@/components/landing/header"
import { Hero } from "@/components/landing/hero"
import { Footer } from "@/components/landing/footer"
import { FeatureCard } from "@/components/ui/feature-card"
import { Timeline, TimelineItem } from "@/components/ui/timeline"
import { LogoCloud, demoLogos } from "@/components/ui/logo-cloud"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
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
              Everything you need for professional translation
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make document translation fast, accurate, and secure.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              variant="gradient"
              icon={Zap}
              title="Lightning Fast"
              description="Modern architecture with Next.js 15 and edge computing for instant translations that scale globally."
            />
            <FeatureCard
              variant="gradient"
              icon={Shield}
              title="Enterprise Security"
              description="Built-in RLS policies, encryption at rest, and SOC 2 compliance to protect your sensitive documents."
            />
            <FeatureCard
              variant="gradient"
              icon={Languages}
              title="50+ Languages"
              description="Professional translation quality with AI-powered language detection and context-aware processing."
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-balance">
              Simple workflow, powerful results
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get professional translations in three simple steps.
            </p>
          </div>

          <Timeline>
            <TimelineItem
              icon={Upload}
              iconVariant="filled"
              step={1}
              title="Upload"
              description="Drag and drop your document or paste text. We support PDF, DOCX, and more."
            />
            <TimelineItem
              icon={Languages}
              iconVariant="filled"
              step={2}
              title="Translate"
              description="Our AI detects the language and translates with context awareness and professional quality."
            />
            <TimelineItem
              icon={Download}
              iconVariant="filled"
              step={3}
              title="Download"
              description="Get your translated document with preserved formatting and layout in seconds."
            />
          </Timeline>

          <div className="text-center mt-12">
            <Button size="lg" className="gap-2" onClick={() => window.location.href = '/upload'}>
              Try it now for free
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
              Trusted by teams at leading companies
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
              Ready to transform your{" "}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                document workflow?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of teams who trust Prismy for their translation needs.
              Start translating in under 30 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2 text-base px-8 py-6 h-auto" onClick={() => window.location.href = '/upload'}>
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="gap-2 text-base px-8 py-6 h-auto" onClick={() => window.location.href = '/api/health'}>
                <FileText className="h-4 w-4" />
                View API Status
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card required • Free tier available • Enterprise ready
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}