'use client'

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { VietnameseThemeProvider, useVietnameseTheme } from "@/components/ui/vietnamese-theme-provider"
import { BilingualText, BilingualNavItem } from "@/components/ui/bilingual-text"
import { EnhancedButton, BilingualButton } from "@/components/ui/enhanced-button"
import { CurrencyDisplay } from "@/components/ui/currency-display"

interface MarketingLayoutProps {
  children: React.ReactNode
  vietnamese?: boolean
  showCTABanner?: boolean
  className?: string
}

// Navigation Header Component
const MarketingHeader = ({ vietnamese = true }: { vietnamese?: boolean }) => {
  const { culturalTheme, setCulturalTheme } = useVietnameseTheme()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  const navItems = [
    { en: 'Features', vi: 'Tính năng', href: '/features' },
    { en: 'Pricing', vi: 'Bảng giá', href: '/pricing' },
    { en: 'Documentation', vi: 'Tài liệu', href: '/docs' },
    { en: 'Support', vi: 'Hỗ trợ', href: '/support' },
    { en: 'Community', vi: 'Cộng đồng', href: '/community' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-vietnamese-red rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl font-vietnamese">Prismy</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="text-sm font-medium hover:text-vietnamese-red transition-colors"
              >
                <BilingualNavItem 
                  en={item.en} 
                  vi={item.vi}
                  showOnlyVietnamese={vietnamese}
                />
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <EnhancedButton
              size="sm"
              variant={culturalTheme === 'tet' ? 'tet' : 'outline'}
              onClick={() => setCulturalTheme(culturalTheme === 'tet' ? 'default' : 'tet')}
            >
              {culturalTheme === 'tet' ? '🎋' : '🇻🇳'}
            </EnhancedButton>
            
            <Link href="/auth/login">
              <EnhancedButton variant="ghost" size="sm">
                <BilingualText 
                  en="Sign In" 
                  vi="Đăng nhập"
                  showOnlyVietnamese={vietnamese}
                />
              </EnhancedButton>
            </Link>
            
            <Link href="/auth/register">
              <EnhancedButton variant="vietnamese" size="sm">
                <BilingualText 
                  en="Get Started" 
                  vi="Bắt đầu"
                  showOnlyVietnamese={vietnamese}
                />
              </EnhancedButton>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-4">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="text-sm font-medium hover:text-vietnamese-red transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <BilingualNavItem 
                    en={item.en} 
                    vi={item.vi}
                    showOnlyVietnamese={vietnamese}
                  />
                </Link>
              ))}
              
              <div className="flex flex-col gap-2 pt-4 border-t">
                <Link href="/auth/login">
                  <EnhancedButton variant="ghost" size="sm" className="w-full">
                    <BilingualText 
                      en="Sign In" 
                      vi="Đăng nhập"
                      showOnlyVietnamese={vietnamese}
                    />
                  </EnhancedButton>
                </Link>
                
                <Link href="/auth/register">
                  <EnhancedButton variant="vietnamese" size="sm" className="w-full">
                    <BilingualText 
                      en="Get Started" 
                      vi="Bắt đầu"
                      showOnlyVietnamese={vietnamese}
                    />
                  </EnhancedButton>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

// CTA Banner Component
const CTABanner = ({ vietnamese = true }: { vietnamese?: boolean }) => {
  return (
    <div className="bg-gradient-to-r from-vietnamese-red to-vietnamese-red/90 text-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl">🎋</span>
            <div>
              <div className="font-semibold font-vietnamese">
                <BilingualText 
                  en="Tết Special Offer" 
                  vi="Khuyến mãi đặc biệt Tết"
                  showOnlyVietnamese={vietnamese}
                />
              </div>
              <div className="text-sm opacity-90 font-vietnamese">
                <BilingualText 
                  en="50% off Premium plans until Lunar New Year"
                  vi="Giảm 50% gói Premium đến Tết Nguyên Đán"
                  showOnlyVietnamese={vietnamese}
                />
              </div>
            </div>
          </div>
          
          <EnhancedButton variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-vietnamese-red">
            <BilingualText 
              en="Claim Offer" 
              vi="Nhận ưu đãi"
              showOnlyVietnamese={vietnamese}
            />
          </EnhancedButton>
        </div>
      </div>
    </div>
  )
}

// Footer Component
const MarketingFooter = ({ vietnamese = true }: { vietnamese?: boolean }) => {
  const footerSections = [
    {
      title: { en: 'Product', vi: 'Sản phẩm' },
      links: [
        { en: 'Features', vi: 'Tính năng', href: '/features' },
        { en: 'Pricing', vi: 'Bảng giá', href: '/pricing' },
        { en: 'API', vi: 'API', href: '/api-docs' },
        { en: 'Documentation', vi: 'Tài liệu', href: '/docs' },
      ]
    },
    {
      title: { en: 'Support', vi: 'Hỗ trợ' },
      links: [
        { en: 'Help Center', vi: 'Trung tâm trợ giúp', href: '/help' },
        { en: 'Contact', vi: 'Liên hệ', href: '/contact' },
        { en: 'Community', vi: 'Cộng đồng', href: '/community' },
        { en: 'Status', vi: 'Trạng thái', href: '/status' },
      ]
    },
    {
      title: { en: 'Company', vi: 'Công ty' },
      links: [
        { en: 'About', vi: 'Giới thiệu', href: '/about' },
        { en: 'Blog', vi: 'Blog', href: '/blog' },
        { en: 'Careers', vi: 'Tuyển dụng', href: '/careers' },
        { en: 'Press', vi: 'Báo chí', href: '/press' },
      ]
    },
    {
      title: { en: 'Legal', vi: 'Pháp lý' },
      links: [
        { en: 'Privacy', vi: 'Quyền riêng tư', href: '/privacy' },
        { en: 'Terms', vi: 'Điều khoản', href: '/terms' },
        { en: 'Security', vi: 'Bảo mật', href: '/security' },
        { en: 'Cookies', vi: 'Cookie', href: '/cookies' },
      ]
    }
  ]

  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-vietnamese-red rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-lg font-vietnamese">Prismy</span>
            </div>
            <p className="text-sm text-gray-600 font-vietnamese mb-4">
              <BilingualText 
                en="AI-powered translation platform optimized for Vietnamese market."
                vi="Nền tảng dịch thuật AI được tối ưu cho thị trường Việt Nam."
                showOnlyVietnamese={vietnamese}
              />
            </p>
            <div className="flex gap-4">
              <span className="text-2xl">🇻🇳</span>
              <span className="text-2xl">🤖</span>
              <span className="text-2xl">🌏</span>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="font-semibold mb-4 font-vietnamese">
                <BilingualText 
                  en={section.title.en}
                  vi={section.title.vi}
                  showOnlyVietnamese={vietnamese}
                />
              </h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-vietnamese-red transition-colors"
                    >
                      <BilingualText 
                        en={link.en}
                        vi={link.vi}
                        showOnlyVietnamese={vietnamese}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-600 font-vietnamese">
            <BilingualText 
              en="© 2024 Prismy. All rights reserved."
              vi="© 2024 Prismy. Bảo lưu mọi quyền."
              showOnlyVietnamese={vietnamese}
            />
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="text-sm text-gray-600 font-vietnamese">
              <BilingualText 
                en="Made with ❤️ for Vietnam"
                vi="Được tạo với ❤️ cho Việt Nam"
                showOnlyVietnamese={vietnamese}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Main Marketing Layout Component
const MarketingLayoutContent = ({
  children,
  vietnamese = true,
  showCTABanner = false,
  className
}: MarketingLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {showCTABanner && <CTABanner vietnamese={vietnamese} />}
      <MarketingHeader vietnamese={vietnamese} />
      
      <main className={cn("flex-1", className)}>
        {children}
      </main>
      
      <MarketingFooter vietnamese={vietnamese} />
    </div>
  )
}

// Exported Marketing Layout with Vietnamese Theme Provider
export const MarketingLayout = (props: MarketingLayoutProps) => {
  return (
    <VietnameseThemeProvider culturalTheme="default" enableVietnameseFeatures>
      <MarketingLayoutContent {...props} />
    </VietnameseThemeProvider>
  )
}

// Vietnamese-specific Marketing Layout
export const VietnameseMarketingLayout = (props: Omit<MarketingLayoutProps, 'vietnamese'>) => {
  return (
    <VietnameseThemeProvider culturalTheme="traditional" enableVietnameseFeatures>
      <MarketingLayoutContent vietnamese={true} {...props} />
    </VietnameseThemeProvider>
  )
}

// Tết-themed Marketing Layout
export const TetMarketingLayout = (props: MarketingLayoutProps) => {
  return (
    <VietnameseThemeProvider culturalTheme="tet" enableVietnameseFeatures>
      <MarketingLayoutContent vietnamese={true} showCTABanner={true} {...props} />
    </VietnameseThemeProvider>
  )
}

// Landing Page Layout (minimal header/footer)
export const LandingLayout = (props: Omit<MarketingLayoutProps, 'showCTABanner'>) => {
  return (
    <VietnameseThemeProvider culturalTheme="default" enableVietnameseFeatures>
      <div className="min-h-screen">
        <MarketingHeader vietnamese={props.vietnamese} />
        <main className={props.className}>
          {props.children}
        </main>
      </div>
    </VietnameseThemeProvider>
  )
}

export default MarketingLayout