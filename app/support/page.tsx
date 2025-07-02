'use client'

import { useI18n } from '@/hooks/useI18n'

export default function SupportPage() {
  const { t } = useI18n()
  
  return (
    <div className="min-h-screen bg-bg-default">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-primary mb-8">{t('navigation.settings')}</h1>
        <div className="prose prose-gray max-w-none">
          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">
            How can we help?
          </h2>
          <p className="text-secondary mb-4">
            We're here to help you get the most out of Prismy.
          </p>

          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">
            Contact Support
          </h2>
          <p className="text-secondary mb-4">
            Email: support@prismy.in
            <br />
            Response time: Within 24 hours
          </p>

          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">
            Common Questions
          </h2>
          <ul className="list-disc list-inside text-secondary space-y-2">
            <li>How do I upload documents?</li>
            <li>What file formats are supported?</li>
            <li>How do credits work?</li>
            <li>How do I upgrade my plan?</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
