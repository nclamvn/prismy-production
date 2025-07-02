'use client'

import { useState } from 'react'
import { MarketingLayout } from '@/components/layouts/MarketingLayout'
import { Button } from '@/components/ui/Button'
import {
  Rocket,
  Globe,
  Zap,
  Shield,
  Bot,
  BarChart3,
  Plug,
  Star,
} from 'lucide-react'
import dynamic from 'next/dynamic'

const FileDropZone = dynamic(
  () => import('@/components/ui/FileDropZone').then(mod => mod.FileDropZone),
  {
    loading: () => (
      <div className="border-2 border-dashed border-border-default rounded-lg p-12 text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-bg-muted rounded-lg mx-auto mb-4"></div>
          <div className="h-4 bg-bg-muted rounded w-48 mx-auto mb-2"></div>
          <div className="h-3 bg-bg-muted rounded w-32 mx-auto"></div>
        </div>
      </div>
    ),
  }
)
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/login?next=/app')
  }

  const handleSignIn = () => {
    router.push('/login')
  }

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files)
    // Redirect to login to save work
    router.push('/login?next=/app')
  }

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container-content">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-primary">
              AI-Powered Document Translation
              <span className="block text-accent-brand mt-2">Made Simple</span>
            </h1>

            <p className="text-xl text-secondary max-w-2xl mx-auto">
              Transform your documents with enterprise-grade AI translation.
              Upload, translate, and chat with your content in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted}>
                Workspace
              </Button>
              <Button size="lg" variant="outline" onClick={handleSignIn}>
                Sign In
              </Button>
            </div>

            <div className="text-sm text-muted">
              No credit card required • 14-day free trial • Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="py-16 px-4 bg-surface">
        <div className="container-content">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-primary">
                Try It Now - No Sign Up Required
              </h2>
              <p className="text-lg text-secondary">
                Drop a document below to see Prismy in action
              </p>
            </div>

            <FileDropZone
              onFilesSelected={handleFilesSelected}
              accept=".pdf,.docx,.txt"
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
            >
              <div className="space-y-4">
                <Rocket size={48} className="text-accent-brand mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    Drop Your Document Here
                  </h3>
                  <p className="text-muted">
                    PDF, DOCX, or TXT files up to 10MB
                  </p>
                </div>
              </div>
            </FileDropZone>

            {selectedFiles.length > 0 && (
              <div className="bg-accent-brand-light border border-accent-brand/20 rounded-lg p-4">
                <p className="text-accent-brand text-center">
                  Great! Sign up to start translating "{selectedFiles[0].name}"
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container-content">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">
              Everything You Need for Document Intelligence
            </h2>
            <p className="text-lg text-secondary max-w-2xl mx-auto">
              Powerful features designed for teams who work with multilingual
              content
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Globe size={24} className="text-accent-brand" />}
              title="50+ Languages"
              description="Translate between major world languages with AI-powered accuracy"
            />
            <FeatureCard
              icon={<Zap size={24} className="text-accent-brand" />}
              title="Lightning Fast"
              description="Process documents in seconds, not hours. Built for speed at scale"
            />
            <FeatureCard
              icon={<Shield size={24} className="text-accent-brand" />}
              title="Enterprise Security"
              description="Bank-level encryption and SOC 2 compliance for your sensitive data"
            />
            <FeatureCard
              icon={<Bot size={24} className="text-accent-brand" />}
              title="AI Chat Assistant"
              description="Ask questions about your documents in any language"
            />
            <FeatureCard
              icon={<BarChart3 size={24} className="text-accent-brand" />}
              title="Batch Processing"
              description="Upload and translate multiple documents simultaneously"
            />
            <FeatureCard
              icon={<Plug size={24} className="text-accent-brand" />}
              title="API Access"
              description="Integrate translation capabilities into your existing workflow"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-bg-muted">
        <div className="container-content">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">
              Trusted by Teams Worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Prismy transformed our international communication. We now process contracts in 8 languages effortlessly."
              author="Sarah Chen"
              role="Legal Director, TechCorp"
              rating={5}
            />
            <TestimonialCard
              quote="The AI chat feature is incredible. It's like having a multilingual assistant for every document."
              author="Marcus Weber"
              role="Product Manager, GlobalSoft"
              rating={5}
            />
            <TestimonialCard
              quote="We saved 80% of our translation costs and improved accuracy. Best decision we made this year."
              author="Yuki Tanaka"
              role="CEO, StartupAI"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-accent-brand-light">
        <div className="container-content text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-primary">
              Ready to Transform Your Document Workflow?
            </h2>
            <p className="text-lg text-secondary">
              Join thousands of teams using Prismy to break language barriers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted}>
                Workspace
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/demo')}
              >
                View Live Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-surface border border-border-default rounded-lg p-6 space-y-4 hover:elevation-md transition-all">
      <div className="flex items-center justify-center w-12 h-12 bg-accent-brand-light rounded-lg">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-primary">{title}</h3>
      <p className="text-secondary">{description}</p>
    </div>
  )
}

interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  rating: number
}

function TestimonialCard({
  quote,
  author,
  role,
  rating,
}: TestimonialCardProps) {
  return (
    <div className="bg-surface border border-border-default rounded-lg p-6 space-y-4">
      <div className="flex space-x-1">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} size={16} className="text-yellow-500 fill-current" />
        ))}
      </div>
      <p className="text-secondary italic">"{quote}"</p>
      <div>
        <div className="font-semibold text-primary">{author}</div>
        <div className="text-sm text-muted">{role}</div>
      </div>
    </div>
  )
}
