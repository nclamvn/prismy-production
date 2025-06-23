'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { slideUp, staggerContainer, motionSafe } from '@/lib/motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { ChevronDown } from 'lucide-react'

interface FooterProps {
  // Language now managed globally
}

export default function Footer({}: FooterProps) {
  const { language } = useLanguage()
  const [openSection, setOpenSection] = useState<number | null>(null)

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index)
  }

  // Mobile Accordion Section Component
  const MobileAccordionSection = ({
    section,
    index,
  }: {
    section: { title: string; links: Array<{ name: string; href: string }> }
    index: number
  }) => {
    const isOpen = openSection === index

    return (
      <div className="border-b border-gray-800 last:border-b-0">
        <button
          onClick={() => toggleSection(index)}
          className="w-full flex items-center justify-between py-4 text-left focus:outline-none"
          aria-expanded={isOpen}
          aria-controls={`mobile-section-${index}`}
        >
          <h3 className="heading-5 text-gray-900 font-semibold">
            {section.title}
          </h3>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              id={`mobile-section-${index}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <ul className="pb-4 space-y-3">
                {section.links.map((link: { name: string; href: string }) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="block body-sm text-gray-600 hover:text-gray-900 hover:font-semibold 
                               transition-all focus-visible-ring rounded-md py-1"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
  const content = {
    vi: {
      sections: [
        {
          title: 'Sản phẩm',
          links: [
            { name: 'Tính năng', href: '/features' },
            { name: 'Doanh nghiệp', href: '/enterprise' },
            { name: 'Bảng giá', href: '/pricing' },
          ],
        },
        {
          title: 'Tài nguyên',
          links: [
            { name: 'Tài liệu API', href: '/api-docs' },
            { name: 'Blog', href: '/blog' },
          ],
        },
      ],
      description: 'Nền tảng dịch thuật AI hàng đầu',
    },
    en: {
      sections: [
        {
          title: 'Product',
          links: [
            { name: 'Features', href: '/features' },
            { name: 'Enterprise', href: '/enterprise' },
            { name: 'Pricing', href: '/pricing' },
          ],
        },
        {
          title: 'Resources',
          links: [
            { name: 'API Documentation', href: '/api-docs' },
            { name: 'Blog', href: '/blog' },
          ],
        },
      ],
      description: 'Leading AI translation platform',
    },
  }

  const socialLinks = [
    {
      name: 'X (Twitter)',
      href: 'https://twitter.com/prismy',
      icon: (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'GitHub',
      href: 'https://github.com/prismy',
      icon: (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/prismy',
      icon: (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: 'https://facebook.com/prismy',
      icon: (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'TikTok',
      href: 'https://tiktok.com/@prismy',
      icon: (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
    },
  ]

  return (
    <footer
      className="w-full bg-bg-main text-gray-900 border-0 outline-0"
      style={{ borderTop: 'none !important' }}
    >
      <div
        className="footer-content-container pt-10 pb-6 md:pb-4"
        style={{ borderTop: 'none !important' }}
      >
        <motion.div
          variants={motionSafe(staggerContainer)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Main Footer Content */}
          <div className="mb-6 sm:mb-8">
            {/* Simplified Desktop Layout - Only existing routes */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Brand Section */}
              <motion.div
                variants={motionSafe(slideUp)}
                className="lg:col-span-2 flex flex-col gap-4"
              >
                <div>
                  <Link
                    href="/"
                    className="mb-2 inline-flex items-center group"
                  >
                    <img
                      src="/logo.svg"
                      alt="Prismy"
                      className="h-7 w-auto mr-2"
                    />
                    <span className="heading-4 font-bold text-gray-900 transition-colors">
                      Prismy
                    </span>
                  </Link>
                  <p className="text-sm text-gray-600 italic mt-1 mb-3 max-w-sm">
                    {content[language].description}
                  </p>
                  <div className="flex space-x-5 mt-3">
                    {socialLinks.map(social => (
                      <Link
                        key={social.name}
                        href={social.href}
                        className="text-gray-700 hover:text-gray-900 hover:scale-110 transition-all duration-150 
                               focus-visible-ring rounded-md p-1"
                        aria-label={social.name}
                      >
                        {social.icon}
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Navigation Sections */}
              {content[language].sections.map(section => (
                <motion.div
                  key={section.title}
                  variants={motionSafe(slideUp)}
                  className="lg:col-span-1"
                >
                  <h3 className="heading-4 text-gray-900 mb-4">
                    {section.title}
                  </h3>
                  <ul className="space-y-3">
                    {section.links.map(link => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="body-sm text-gray-600 hover:text-gray-900 hover:font-semibold transition-all focus-visible-ring rounded-md"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Mobile Accordion Layout - Visible only on mobile */}
            <div className="md:hidden">
              {/* Brand Section for Mobile */}
              <motion.div variants={motionSafe(slideUp)} className="mb-6">
                <div>
                  <Link
                    href="/"
                    className="mb-2 inline-flex items-center group"
                  >
                    <img
                      src="/logo.svg"
                      alt="Prismy"
                      className="h-7 w-auto mr-2"
                    />
                    <span className="heading-4 font-bold text-gray-900 transition-colors">
                      Prismy
                    </span>
                  </Link>
                  <p className="text-sm text-gray-600 italic mt-1 mb-3 max-w-sm">
                    {content[language].description}
                  </p>
                  <div className="flex space-x-5 mt-3">
                    {socialLinks.map(social => (
                      <Link
                        key={social.name}
                        href={social.href}
                        className="text-gray-700 hover:text-gray-900 hover:scale-110 transition-all duration-150 
                                 focus-visible-ring rounded-md p-1"
                        aria-label={social.name}
                      >
                        {social.icon}
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Mobile Accordion Sections */}
              <motion.div variants={motionSafe(slideUp)} className="space-y-0">
                {content[language].sections.map((section, index) => (
                  <MobileAccordionSection
                    key={section.title}
                    section={section}
                    index={index}
                  />
                ))}
              </motion.div>
            </div>
          </div>

          {/* Bottom Bar - Simplified Pure White Text */}
          <motion.div
            variants={motionSafe(slideUp)}
            className="flex flex-col md:flex-row justify-between items-center 
                     mt-6 md:mt-8 pt-4"
          >
            <p className="text-sm text-gray-600">
              {language === 'vi' ? '© 2025 Prismy' : '© 2025 Prismy'}
            </p>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Enterprise Ready</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  )
}
