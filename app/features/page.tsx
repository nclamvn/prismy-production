'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AuthProvider } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { slideUp, staggerContainer, motionSafe } from '@/lib/motion'
import { 
  Zap, 
  Globe, 
  CreditCard, 
  Shield, 
  Settings, 
  Headphones,
  FileText,
  Cpu,
  Users,
  BarChart3,
  Lock,
  Cloud
} from 'lucide-react'

export default function Features() {
  const { language } = useLanguage()

  const content = {
    vi: {
      hero: {
        title: 'Tính năng toàn diện',
        subtitle: 'Khám phá sức mạnh đầy đủ của nền tảng dịch thuật AI hàng đầu',
        description: 'Từ dịch thuật tức thì đến API doanh nghiệp, Prismy cung cấp mọi công cụ bạn cần để phá vỡ rào cản ngôn ngữ.'
      },
      sections: [
        {
          title: 'Nhân Dịch Thuật AI',
          subtitle: 'Công nghệ AI tiên tiến cho độ chính xác tuyệt đối',
          features: [
            {
              title: 'Dịch thuật tức thì',
              description: 'AI thế hệ mới xử lý và dịch nội dung trong vòng vài giây với độ chính xác 99.8%',
              icon: Zap
            },
            {
              title: 'Hỗ trợ 100+ ngôn ngữ',
              description: 'Dịch giữa tất cả các ngôn ngữ chính trên thế giới, bao gồm các phương ngữ địa phương',
              icon: Globe
            },
            {
              title: 'Học thích ứng',
              description: 'AI học hỏi từ phong cách và thuật ngữ của bạn để cải thiện độ chính xác theo thời gian',
              icon: Cpu
            }
          ]
        },
        {
          title: 'Công Cụ Xử Lý Tài Liệu',
          subtitle: 'Xử lý mọi định dạng tài liệu với độ chính xác cao',
          features: [
            {
              title: 'Hỗ trợ đa định dạng',
              description: 'PDF, Word, Excel, PowerPoint, và 20+ định dạng khác được xử lý với bố cục nguyên vẹn',
              icon: FileText
            },
            {
              title: 'OCR thông minh',
              description: 'Trích xuất văn bản từ hình ảnh và tài liệu scan với độ chính xác 99.5%',
              icon: BarChart3
            },
            {
              title: 'Giữ nguyên định dạng',
              description: 'Duy trì hoàn toàn bố cục, font chữ, và cấu trúc của tài liệu gốc',
              icon: Lock
            }
          ]
        },
        {
          title: 'API & Tích Hợp Doanh Nghiệp',
          subtitle: 'Tích hợp liền mạch vào quy trình làm việc hiện tại',
          features: [
            {
              title: 'API RESTful mạnh mẽ',
              description: 'API đơn giản, nhanh chóng với tài liệu đầy đủ và SDK cho mọi ngôn ngữ lập trình',
              icon: Settings
            },
            {
              title: 'Tích hợp Webhook',
              description: 'Nhận thông báo real-time về trạng thái dịch thuật và tự động hóa quy trình',
              icon: Cloud
            },
            {
              title: 'Hỗ trợ 24/7',
              description: 'Đội ngũ kỹ thuật chuyên biệt hỗ trợ tích hợp và khắc phục sự cố mọi lúc',
              icon: Headphones
            }
          ]
        },
        {
          title: 'Thanh Toán & Bảo Mật',
          subtitle: 'An toàn, linh hoạt và tuân thủ chuẩn quốc tế',
          features: [
            {
              title: 'Thanh toán Việt Nam',
              description: 'VNPay, MoMo, thẻ nội địa và quốc tế - thanh toán dễ dàng theo cách bạn muốn',
              icon: CreditCard
            },
            {
              title: 'Bảo mật cấp ngân hàng',
              description: 'Mã hóa end-to-end, tuân thủ GDPR, SOC 2 và ISO 27001 để bảo vệ dữ liệu',
              icon: Shield
            },
            {
              title: 'Quản lý nhóm',
              description: 'Phân quyền chi tiết, theo dõi sử dụng và báo cáo chi phí cho từng phòng ban',
              icon: Users
            }
          ]
        }
      ]
    },
    en: {
      hero: {
        title: 'Comprehensive Features',
        subtitle: 'Discover the full power of the leading AI translation platform',
        description: 'From instant translation to enterprise APIs, Prismy provides every tool you need to break down language barriers.'
      },
      sections: [
        {
          title: 'AI Translation Core',
          subtitle: 'Advanced AI technology for absolute accuracy',
          features: [
            {
              title: 'Instant Translation',
              description: 'Next-gen AI processes and translates content within seconds with 99.8% accuracy',
              icon: Zap
            },
            {
              title: '100+ Language Support',
              description: 'Translate between all major world languages, including regional dialects',
              icon: Globe
            },
            {
              title: 'Adaptive Learning',
              description: 'AI learns from your style and terminology to improve accuracy over time',
              icon: Cpu
            }
          ]
        },
        {
          title: 'Document Processing Engine',
          subtitle: 'Handle any document format with high precision',
          features: [
            {
              title: 'Multi-format Support',
              description: 'PDF, Word, Excel, PowerPoint, and 20+ other formats processed with layout integrity',
              icon: FileText
            },
            {
              title: 'Smart OCR',
              description: 'Extract text from images and scanned documents with 99.5% accuracy',
              icon: BarChart3
            },
            {
              title: 'Format Preservation',
              description: 'Maintain complete layout, fonts, and structure of original documents',
              icon: Lock
            }
          ]
        },
        {
          title: 'Enterprise API & Integration',
          subtitle: 'Seamlessly integrate into your existing workflow',
          features: [
            {
              title: 'Powerful RESTful API',
              description: 'Simple, fast API with comprehensive docs and SDKs for every programming language',
              icon: Settings
            },
            {
              title: 'Webhook Integration',
              description: 'Receive real-time notifications about translation status and automate workflows',
              icon: Cloud
            },
            {
              title: '24/7 Support',
              description: 'Dedicated technical team supports integration and troubleshooting anytime',
              icon: Headphones
            }
          ]
        },
        {
          title: 'Payment & Security',
          subtitle: 'Secure, flexible and internationally compliant',
          features: [
            {
              title: 'Vietnamese Payments',
              description: 'VNPay, MoMo, domestic and international cards - pay easily your way',
              icon: CreditCard
            },
            {
              title: 'Bank-grade Security',
              description: 'End-to-end encryption, GDPR, SOC 2 and ISO 27001 compliant for data protection',
              icon: Shield
            },
            {
              title: 'Team Management',
              description: 'Granular permissions, usage tracking and cost reporting for each department',
              icon: Users
            }
          ]
        }
      ]
    }
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-bg-main">
        <Navbar />
        
        <main>
          {/* Hero Section - Full Width */}
          <section className="relative overflow-hidden bg-white pt-20 w-full">
            <div className="w-full py-20">
              <div className="w-full">
                <motion.div
                  variants={motionSafe(staggerContainer)}
                  initial="hidden"
                  animate="visible"
                  className="text-center px-4 md:px-8 lg:px-12"
                >
                  <motion.h1 
                    variants={motionSafe(slideUp)}
                    className="heading-1 text-text-primary mb-6"
                  >
                    {content[language].hero.title}
                  </motion.h1>
                  
                  <motion.p 
                    variants={motionSafe(slideUp)}
                    className="body-xl text-text-secondary mb-8"
                  >
                    {content[language].hero.subtitle}
                  </motion.p>
                  
                  <motion.p 
                    variants={motionSafe(slideUp)}
                    className="body-lg text-text-muted max-w-2xl mx-auto"
                  >
                    {content[language].hero.description}
                  </motion.p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Feature Sections */}
          {content[language].sections.map((section, sectionIndex) => (
            <section key={sectionIndex} className="py-20 w-full">
              <div className="w-full">
                <div className="w-full">
                  <motion.div
                    variants={motionSafe(staggerContainer)}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                  >
                    {/* Section Header */}
                    <motion.div variants={motionSafe(slideUp)} className="text-center mb-16 px-4 md:px-8 lg:px-12">
                      <h2 className="heading-2 text-text-primary mb-4">
                        {section.title}
                      </h2>
                      <p className="body-lg text-text-secondary max-w-2xl mx-auto">
                        {section.subtitle}
                      </p>
                    </motion.div>
                    
                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 md:px-8 lg:px-12">
                      {section.features.map((feature, index) => {
                        const IconComponent = feature.icon
                        return (
                          <motion.div
                            key={index}
                            variants={motionSafe(slideUp)}
                            className="feature-card-vertical zen-card-hover-enhanced"
                          >
                            <div className="feature-icon-container">
                              <IconComponent 
                                size={28} 
                                className="text-black zen-icon-hover transition-all duration-300" 
                                strokeWidth={1.5}
                              />
                            </div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>
          ))}

          {/* CTA Section */}
          <section className="py-20 bg-black w-full">
            <div className="w-full">
              <div className="w-full">
                <motion.div
                  variants={motionSafe(staggerContainer)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="text-center px-4 md:px-8 lg:px-12"
                >
                  <motion.h2 
                    variants={motionSafe(slideUp)}
                    className="heading-2 text-white mb-6"
                  >
                    {language === 'vi' ? 'Sẵn sàng trải nghiệm?' : 'Ready to experience?'}
                  </motion.h2>
                  
                  <motion.p 
                    variants={motionSafe(slideUp)}
                    className="body-lg text-gray-300 mb-8"
                  >
                    {language === 'vi' 
                      ? 'Bắt đầu với Prismy ngay hôm nay và khám phá sức mạnh của AI dịch thuật'
                      : 'Start with Prismy today and discover the power of AI translation'
                    }
                  </motion.p>
                  
                  <motion.div 
                    variants={motionSafe(slideUp)}
                    className="flex flex-col sm:flex-row gap-4 justify-center px-4 md:px-8 lg:px-12"
                  >
                    <button className="bg-white text-black hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold transition-colors zen-language-hover">
                      {language === 'vi' ? 'Bắt đầu miễn phí' : 'Start Free'}
                    </button>
                    <button className="border border-gray-600 text-white hover:bg-gray-900 px-8 py-4 rounded-xl font-semibold transition-colors zen-language-hover">
                      {language === 'vi' ? 'Xem demo' : 'View Demo'}
                    </button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  )
}