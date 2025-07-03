'use client'

import { useState } from 'react'
import { MarketingLayout } from '@/components/layouts/MarketingLayout'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/hooks/useI18n'
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
import { useRouter } from 'next/navigation'
import FileDropZone from '@/components/ui/FileDropZone'
export default function HomePage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const router = useRouter()
  const { t } = useI18n()

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
              {t('homepage.hero_title')}
              <span className="block mt-2">
                <span className="prism-gradient bg-clip-text text-transparent animate-gradient">
                  {t('homepage.hero_subtitle')}
                </span>
              </span>
            </h1>

            <p className="text-xl text-secondary max-w-2xl mx-auto">
              {t('homepage.hero_description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted}>
                {t('homepage.workspace_btn')}
              </Button>
              <Button size="lg" variant="outline" onClick={handleSignIn}>
                {t('homepage.sign_in_btn')}
              </Button>
            </div>

            <div className="text-sm text-muted">
              {t('homepage.no_credit_card')}
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
                {t('homepage.try_now')}
              </h2>
              <p className="text-lg text-secondary">
                {t('homepage.try_description')}
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
                    {t('homepage.drop_document')}
                  </h3>
                  <p className="text-muted">
                    {t('homepage.pdf_docx_txt')}
                  </p>
                </div>
              </div>
            </FileDropZone>

            {selectedFiles.length > 0 && (
              <div className="bg-accent-brand-light border border-accent-brand/20 rounded-lg p-4">
                <p className="text-accent-brand text-center">
                  {t('homepage.sign_up_to_translate', { fileName: selectedFiles[0].name })}
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
              {t('homepage.everything_you_need')}
            </h2>
            <p className="text-lg text-secondary max-w-2xl mx-auto">
              {t('homepage.powerful_features')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Globe size={24} className="text-accent-brand" />}
              title={t('homepage.features.50_languages')}
              description={t('homepage.features.50_languages_desc')}
            />
            <FeatureCard
              icon={<Zap size={24} className="text-accent-brand" />}
              title={t('homepage.features.lightning_fast')}
              description={t('homepage.features.lightning_fast_desc')}
            />
            <FeatureCard
              icon={<Shield size={24} className="text-accent-brand" />}
              title={t('homepage.features.enterprise_security')}
              description={t('homepage.features.enterprise_security_desc')}
            />
            <FeatureCard
              icon={<Bot size={24} className="text-accent-brand" />}
              title={t('homepage.features.ai_chat')}
              description={t('homepage.features.ai_chat_desc')}
            />
            <FeatureCard
              icon={<BarChart3 size={24} className="text-accent-brand" />}
              title={t('homepage.features.batch_processing')}
              description={t('homepage.features.batch_processing_desc')}
            />
            <FeatureCard
              icon={<Plug size={24} className="text-accent-brand" />}
              title={t('homepage.features.api_access')}
              description={t('homepage.features.api_access_desc')}
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-bg-muted">
        <div className="container-content">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">
              {t('homepage.trusted_worldwide')}
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
              {t('homepage.ready_to_transform')}
            </h2>
            <p className="text-lg text-secondary">
              {t('homepage.join_thousands')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted}>
                {t('homepage.workspace_btn')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/demo')}
              >
                {t('homepage.view_live_demo')}
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
