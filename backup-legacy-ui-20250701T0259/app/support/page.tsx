import { Metadata } from 'next'
import Link from 'next/link'
import { 
  MessageCircle, 
  Mail, 
  Book, 
  HelpCircle, 
  Search,
  ArrowRight,
  Clock,
  CheckCircle
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Support Center - Prismy',
  description: 'Get help with Prismy translation services. Find answers, contact support, and access documentation.'
}

export default function SupportPage() {
  const faqs = [
    {
      question: 'How do I get started with Prismy?',
      answer: 'Sign up for a free account and get instant access to our translation tools. New users receive free credits to try our service.'
    },
    {
      question: 'What file formats do you support?',
      answer: 'We support PDF, DOCX, TXT, and direct text input. More formats are coming soon.'
    },
    {
      question: 'How accurate are the translations?',
      answer: 'Our AI-powered translations achieve 95%+ accuracy for most language pairs, with continuous improvements through machine learning.'
    },
    {
      question: 'Can I translate documents in bulk?',
      answer: 'Yes! Premium users can upload multiple documents and translate them simultaneously.'
    },
    {
      question: 'What languages do you support?',
      answer: 'We support 100+ languages including English, Vietnamese, Chinese, Japanese, Korean, Spanish, French, and many more.'
    },
    {
      question: 'How is pricing calculated?',
      answer: 'Pricing is based on the number of characters translated. Each plan includes a monthly allocation of translation credits.'
    }
  ]

  const supportChannels = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      action: 'Start Chat',
      available: 'Available 24/7'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us detailed questions or feedback',
      action: 'Send Email',
      available: 'Response within 24h'
    },
    {
      icon: Book,
      title: 'Documentation',
      description: 'Browse our comprehensive guides',
      action: 'View Docs',
      available: 'Always updated'
    }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="heading-1 mb-6">How can we help you?</h1>
          <p className="body-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Find answers to common questions, get in touch with support, or browse our documentation.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-12">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles..."
              className="input-base pl-12 text-center"
            />
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="heading-2 text-center mb-12">Get Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {supportChannels.map((channel, index) => (
              <div key={index} className="card-base p-8 text-center hover:shadow-lg transition-all">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                     style={{ backgroundColor: 'var(--notebooklm-primary-light)' }}>
                  <channel.icon className="w-8 h-8" style={{ color: 'var(--notebooklm-primary)' }} />
                </div>
                <h3 className="heading-3 mb-4">{channel.title}</h3>
                <p className="body-base text-gray-600 mb-6">{channel.description}</p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                  <Clock className="w-4 h-4" />
                  <span>{channel.available}</span>
                </div>
                <button className="btn-md3-filled w-full">
                  {channel.action}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16" style={{ backgroundColor: 'var(--surface-panel)' }}>
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="heading-2 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="card-base p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                       style={{ backgroundColor: 'var(--notebooklm-primary-light)' }}>
                    <HelpCircle className="w-4 h-4" style={{ color: 'var(--notebooklm-primary)' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="heading-4 mb-3">{faq.question}</h3>
                    <p className="body-base text-gray-700">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="heading-2 text-center mb-12">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/pricing" className="card-base p-6 hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="heading-5">Pricing Plans</h3>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="body-sm text-gray-600">Compare our subscription plans and features</p>
            </Link>
            
            <Link href="/features" className="card-base p-6 hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="heading-5">Features</h3>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="body-sm text-gray-600">Explore all translation features and tools</p>
            </Link>
            
            <Link href="/workspace" className="card-base p-6 hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="heading-5">Workspace</h3>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="body-sm text-gray-600">Start translating documents right away</p>
            </Link>
            
            <Link href="/blog" className="card-base p-6 hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="heading-5">Blog & Tips</h3>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="body-sm text-gray-600">Translation tips and industry insights</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20" style={{ backgroundColor: 'var(--notebooklm-primary)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="heading-2 text-white mb-6">Still need help?</h2>
          <p className="body-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Our support team is here to help you get the most out of Prismy. 
            Reach out anytime with questions or feedback.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-md3-filled bg-white text-gray-900 hover:bg-gray-100">
              Contact Support
            </button>
            <button className="btn-md3-outlined border-white text-white hover:bg-white/10">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}