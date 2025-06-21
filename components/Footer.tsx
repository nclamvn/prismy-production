'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { slideUp, staggerContainer, motionSafe } from '@/lib/motion'
import { useLanguage } from '@/contexts/LanguageContext'
import NewsletterSignup from '@/components/ui/NewsletterSignup'

interface FooterProps {
  // Language now managed globally
}

export default function Footer({}: FooterProps) {
  const { language } = useLanguage()
  const content = {
    vi: {
      sections: [
        {
          title: 'Sản phẩm',
          links: [
            { name: 'Dịch văn bản', href: '/text-translation' },
            { name: 'Dịch tài liệu', href: '/document-translation' },
            { name: 'Truy cập API', href: '/api' },
            { name: 'Doanh nghiệp', href: '/enterprise' },
            { name: 'Bảng giá', href: '/pricing' },
          ]
        },
        {
          title: 'Tài nguyên',
          links: [
            { name: 'Tài liệu hướng dẫn', href: '/docs' },
            { name: 'Tham khảo API', href: '/api-docs' },
            { name: 'Hướng dẫn sử dụng', href: '/tutorials' },
            { name: 'Blog', href: '/blog' },
            { name: 'Cộng đồng', href: '/community' },
          ]
        },
        {
          title: 'Công ty',
          links: [
            { name: 'Về chúng tôi', href: '/about' },
            { name: 'Tuyển dụng', href: '/careers' },
            { name: 'Bộ công cụ báo chí', href: '/press' },
            { name: 'Liên hệ', href: '/contact' },
            { name: 'Đối tác', href: '/partners' },
          ]
        },
        {
          title: 'Pháp lý',
          links: [
            { name: 'Chính sách bảo mật', href: '/privacy' },
            { name: 'Điều khoản dịch vụ', href: '/terms' },
            { name: 'Chính sách Cookie', href: '/cookies' },
            { name: 'Bảo mật', href: '/security' },
            { name: 'GDPR', href: '/gdpr' },
          ]
        }
      ],
      newsletter: {
        title: 'Cập nhật mới nhất',
        description: 'Nhận thông tin cập nhật mới nhất về các tính năng và cải tiến.',
        placeholder: 'Nhập email của bạn',
        subscribe: 'Đăng ký'
      },
      description: 'Dịch thuật chuyên nghiệp với AI tiên tiến cho doanh nghiệp toàn cầu.'
    },
    en: {
      sections: [
        {
          title: 'Product',
          links: [
            { name: 'Text Translation', href: '/text-translation' },
            { name: 'Document Translation', href: '/document-translation' },
            { name: 'API Access', href: '/api' },
            { name: 'Enterprise', href: '/enterprise' },
            { name: 'Pricing', href: '/pricing' },
          ]
        },
        {
          title: 'Resources',
          links: [
            { name: 'Documentation', href: '/docs' },
            { name: 'API Reference', href: '/api-docs' },
            { name: 'Tutorials', href: '/tutorials' },
            { name: 'Blog', href: '/blog' },
            { name: 'Community', href: '/community' },
          ]
        },
        {
          title: 'Company',
          links: [
            { name: 'About Us', href: '/about' },
            { name: 'Careers', href: '/careers' },
            { name: 'Press Kit', href: '/press' },
            { name: 'Contact', href: '/contact' },
            { name: 'Partners', href: '/partners' },
          ]
        },
        {
          title: 'Legal',
          links: [
            { name: 'Privacy Policy', href: '/privacy' },
            { name: 'Terms of Service', href: '/terms' },
            { name: 'Cookie Policy', href: '/cookies' },
            { name: 'Security', href: '/security' },
            { name: 'GDPR', href: '/gdpr' },
          ]
        }
      ],
      newsletter: {
        title: 'Stay Updated',
        description: 'Get the latest updates on new features and improvements.',
        placeholder: 'Enter your email',
        subscribe: 'Subscribe'
      },
      description: 'Professional AI-powered translation for global enterprises.'
    }
  }

  const socialLinks = [
    {
      name: 'X (Twitter)',
      href: 'https://twitter.com/prismy',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      name: 'GitHub',
      href: 'https://github.com/prismy',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/prismy',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      name: 'Facebook',
      href: 'https://facebook.com/prismy',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      name: 'TikTok',
      href: 'https://tiktok.com/@prismy',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      )
    }
  ]

  return (
    <footer className="w-full bg-black text-text-inverse">
      <div className="content-container py-12 pb-16 md:pb-12">
        <motion.div
          variants={motionSafe(staggerContainer)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
            {/* Brand Section */}
            <motion.div
              variants={motionSafe(slideUp)}
              className="lg:col-span-2"
            >
              <Link href="/" className="mb-2 inline-block group">
                <span className="heading-4 font-bold text-white transition-colors">Prismy</span>
              </Link>
              <p className="body-base text-white mt-1 mb-3 max-w-sm">
                {content[language].description}
              </p>
              <div className="flex space-x-4 mt-3">
                {socialLinks.map((social) => (
                  <Link
                    key={social.name}
                    href={social.href}
                    className="text-white opacity-70 hover:opacity-100 hover:scale-105 transition-all duration-150 
                             focus-visible-ring rounded-md p-1"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Product Column - FORCE RENDER */}
            <motion.div
              variants={motionSafe(slideUp)}
              className="lg:col-span-1"
            >
              <h3 className="heading-4 text-gray-300 mb-4">
                {language === 'vi' ? 'Sản phẩm' : 'Product'}
              </h3>
              <ul className="space-y-3">
                {language === 'vi' ? (
                  <>
                    <li><Link href="/text-translation" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Dịch văn bản</Link></li>
                    <li><Link href="/document-translation" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Dịch tài liệu</Link></li>
                    <li><Link href="/api" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Truy cập API</Link></li>
                    <li><Link href="/enterprise" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Doanh nghiệp</Link></li>
                    <li><Link href="/pricing" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Bảng giá</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link href="/text-translation" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Text Translation</Link></li>
                    <li><Link href="/document-translation" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Document Translation</Link></li>
                    <li><Link href="/api" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">API Access</Link></li>
                    <li><Link href="/enterprise" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Enterprise</Link></li>
                    <li><Link href="/pricing" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Pricing</Link></li>
                  </>
                )}
              </ul>
            </motion.div>

            {/* Resources Column - FORCE RENDER */}
            <motion.div
              variants={motionSafe(slideUp)}
              className="lg:col-span-1"
            >
              <h3 className="heading-4 text-gray-300 mb-4">
                {language === 'vi' ? 'Tài nguyên' : 'Resources'}
              </h3>
              <ul className="space-y-3">
                {language === 'vi' ? (
                  <>
                    <li><Link href="/docs" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Tài liệu hướng dẫn</Link></li>
                    <li><Link href="/api-docs" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Tham khảo API</Link></li>
                    <li><Link href="/tutorials" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Hướng dẫn sử dụng</Link></li>
                    <li><Link href="/blog" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Blog</Link></li>
                    <li><Link href="/community" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Cộng đồng</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link href="/docs" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Documentation</Link></li>
                    <li><Link href="/api-docs" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">API Reference</Link></li>
                    <li><Link href="/tutorials" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Tutorials</Link></li>
                    <li><Link href="/blog" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Blog</Link></li>
                    <li><Link href="/community" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Community</Link></li>
                  </>
                )}
              </ul>
            </motion.div>

            {/* Company Column - FORCE RENDER */}
            <motion.div
              variants={motionSafe(slideUp)}
              className="lg:col-span-1"
            >
              <h3 className="heading-4 text-gray-300 mb-4">
                {language === 'vi' ? 'Công ty' : 'Company'}
              </h3>
              <ul className="space-y-3">
                {language === 'vi' ? (
                  <>
                    <li><Link href="/about" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Về chúng tôi</Link></li>
                    <li><Link href="/careers" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Tuyển dụng</Link></li>
                    <li><Link href="/press" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Bộ công cụ báo chí</Link></li>
                    <li><Link href="/contact" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Liên hệ</Link></li>
                    <li><Link href="/partners" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Đối tác</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link href="/about" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">About Us</Link></li>
                    <li><Link href="/careers" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Careers</Link></li>
                    <li><Link href="/press" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Press Kit</Link></li>
                    <li><Link href="/contact" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Contact</Link></li>
                    <li><Link href="/partners" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Partners</Link></li>
                  </>
                )}
              </ul>
            </motion.div>

            {/* Legal Column - FORCE RENDER */}
            <motion.div
              variants={motionSafe(slideUp)}
              className="lg:col-span-1"
            >
              <h3 className="heading-4 text-gray-300 mb-4">
                {language === 'vi' ? 'Pháp lý' : 'Legal'}
              </h3>
              <ul className="space-y-3">
                {language === 'vi' ? (
                  <>
                    <li><Link href="/privacy" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Chính sách bảo mật</Link></li>
                    <li><Link href="/terms" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Điều khoản dịch vụ</Link></li>
                    <li><Link href="/cookies" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Chính sách Cookie</Link></li>
                    <li><Link href="/security" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Bảo mật</Link></li>
                    <li><Link href="/gdpr" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">GDPR</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link href="/privacy" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Privacy Policy</Link></li>
                    <li><Link href="/terms" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Terms of Service</Link></li>
                    <li><Link href="/cookies" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Cookie Policy</Link></li>
                    <li><Link href="/security" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">Security</Link></li>
                    <li><Link href="/gdpr" className="body-sm text-gray-500 hover:text-white hover:font-semibold transition-all focus-visible-ring rounded-md">GDPR</Link></li>
                  </>
                )}
              </ul>
            </motion.div>
          </div>

          {/* Newsletter Signup - Optimized Component */}
          <NewsletterSignup 
            language={language} 
            variant="footer" 
            className="mt-12 mb-8"
          />

          {/* Bottom Bar - Simplified Pure White Text */}
          <motion.div
            variants={motionSafe(slideUp)}
            className="flex flex-col md:flex-row justify-between items-center 
                     mt-12 md:mt-16"
          >
            <p className="text-sm text-gray-500">
              {language === 'vi' 
                ? '© 2025 Prismy'
                : '© 2025 Prismy'
              }
            </p>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-500">Enterprise Ready</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  )
}