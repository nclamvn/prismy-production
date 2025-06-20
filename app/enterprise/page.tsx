'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AuthProvider } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import UniversalDropdown from '@/components/ui/UniversalDropdown'
import { slideUp, staggerContainer, motionSafe } from '@/lib/motion'
import { 
  Building2,
  Shield,
  Users,
  BarChart3,
  Zap,
  Globe,
  HeadphonesIcon,
  Settings,
  Award,
  CheckCircle
} from 'lucide-react'

function EnterpriseContent() {
  const { language } = useLanguage()
  const [employeeCount, setEmployeeCount] = useState('1-50')

  const content = {
    vi: {
      hero: {
        title: 'Giải pháp dịch thuật doanh nghiệp',
        subtitle: 'Tin cậy bởi các tập đoàn hàng đầu Việt Nam',
        description: 'Nền tảng AI translation được thiết kế đặc biệt cho các doanh nghiệp quy mô lớn với yêu cầu về bảo mật, hiệu suất và tích hợp cao.',
        cta1: 'Liên hệ bán hàng',
        cta2: 'Tải case study'
      },
      stats: [
        { number: '500+', label: 'Doanh nghiệp lớn' },
        { number: '99.9%', label: 'Uptime SLA' },
        { number: '10M+', label: 'Tài liệu/tháng' },
        { number: '< 2s', label: 'Thời gian phản hồi' }
      ],
      whyEnterprise: {
        title: 'Vì sao các tập đoàn chọn Prismy?',
        subtitle: 'Chúng tôi hiểu rằng doanh nghiệp cần nhiều hơn là dịch thuật đơn thuần',
        reasons: [
          {
            title: 'Bảo mật cấp doanh nghiệp',
            description: 'SOC 2, ISO 27001, GDPR compliant. Data center riêng tại Việt Nam với mã hóa end-to-end.',
            icon: Shield
          },
          {
            title: 'Tích hợp liền mạch',
            description: 'API RESTful mạnh mẽ, SDK đa ngôn ngữ, webhook real-time và tích hợp SSO enterprise.',
            icon: Settings
          },
          {
            title: 'Hiệu suất đảm bảo',
            description: 'SLA 99.9% uptime, < 2s response time, auto-scaling và infrastructure toàn cầu.',
            icon: Zap
          },
          {
            title: 'Hỗ trợ chuyên biệt',
            description: 'Dedicated account manager, technical support 24/7 và onboarding chuyên nghiệp.',
            icon: HeadphonesIcon
          },
          {
            title: 'Phân tích dữ liệu',
            description: 'Dashboard executive, ROI tracking, usage analytics và cost optimization insights.',
            icon: BarChart3
          },
          {
            title: 'Tuân thủ pháp lý',
            description: 'Đáp ứng yêu cầu pháp lý Việt Nam, quốc tế và industry-specific compliance.',
            icon: Award
          }
        ]
      },
      caseStudies: {
        title: 'Thành công thực tế',
        subtitle: 'Khám phá cách các doanh nghiệp hàng đầu đã chuyển đổi quy trình với Prismy',
        studies: [
          {
            company: 'VinGroup',
            industry: 'Tập đoàn đa ngành',
            challenge: 'Dịch thuật tài liệu pháp lý và hợp đồng quốc tế với 15+ ngôn ngữ',
            solution: 'API integration với legal management system, custom terminology và workflow automation',
            results: ['Giảm 80% thời gian dịch thuật', 'Tiết kiệm $2.3M chi phí hàng năm', '99.8% độ chính xác pháp lý']
          },
          {
            company: 'FPT Corporation',
            industry: 'Công nghệ & Dịch vụ IT',
            challenge: 'Localization sản phẩm phần mềm cho 25+ thị trường quốc tế',
            solution: 'DevOps integration với CI/CD pipeline, terminology management và quality assurance workflow',
            results: ['Tăng 300% tốc độ time-to-market', 'Hỗ trợ 25 ngôn ngữ đồng thời', 'Giảm 90% lỗi translation']
          },
          {
            company: 'Vietcombank',
            industry: 'Ngân hàng & Tài chính',
            challenge: 'Dịch thuật báo cáo tài chính và tài liệu compliance cho quốc tế',
            solution: 'Banking-grade security, regulatory compliance integration và real-time reporting',
            results: ['100% tuân thủ BASEL III', 'Giảm 60% thời gian báo cáo', 'Zero security incidents']
          }
        ]
      },
      pricing: {
        title: 'Kế hoạch doanh nghiệp',
        subtitle: 'Linh hoạt và mở rộng theo nhu cầu thực tế của tổ chức',
        enterprise: {
          title: 'Enterprise Custom',
          price: 'Báo giá theo yêu cầu',
          description: 'Giải pháp hoàn toàn tùy chỉnh cho tập đoàn lớn',
          features: [
            'Unlimited API calls & document processing',
            'Dedicated cloud infrastructure',
            'Custom model training',
            'White-label solution',
            'Priority support & SLA',
            'Compliance & audit support',
            'Multi-region deployment',
            'Custom integration & training'
          ]
        }
      },
      contact: {
        title: 'Bắt đầu hành trình chuyển đổi',
        subtitle: 'Đội ngũ chuyên gia của chúng tôi sẵn sàng tư vấn giải pháp phù hợp nhất',
        form: {
          company: 'Tên công ty',
          name: 'Họ và tên',
          email: 'Email công ty',
          phone: 'Số điện thoại',
          employees: 'Số lượng nhân viên',
          industry: 'Ngành nghề',
          requirements: 'Yêu cầu cụ thể',
          submit: 'Gửi yêu cầu tư vấn'
        }
      }
    },
    en: {
      hero: {
        title: 'Enterprise Translation Solutions',
        subtitle: 'Trusted by leading Vietnamese corporations',
        description: 'AI translation platform specifically designed for large enterprises with high requirements for security, performance and integration.',
        cta1: 'Contact Sales',
        cta2: 'Download Case Study'
      },
      stats: [
        { number: '500+', label: 'Large Enterprises' },
        { number: '99.9%', label: 'Uptime SLA' },
        { number: '10M+', label: 'Documents/month' },
        { number: '< 2s', label: 'Response Time' }
      ],
      whyEnterprise: {
        title: 'Why corporations choose Prismy?',
        subtitle: 'We understand that businesses need more than just simple translation',
        reasons: [
          {
            title: 'Enterprise-grade Security',
            description: 'SOC 2, ISO 27001, GDPR compliant. Dedicated data center in Vietnam with end-to-end encryption.',
            icon: Shield
          },
          {
            title: 'Seamless Integration',
            description: 'Powerful RESTful API, multi-language SDKs, real-time webhooks and enterprise SSO integration.',
            icon: Settings
          },
          {
            title: 'Guaranteed Performance',
            description: '99.9% uptime SLA, < 2s response time, auto-scaling and global infrastructure.',
            icon: Zap
          },
          {
            title: 'Dedicated Support',
            description: 'Dedicated account manager, 24/7 technical support and professional onboarding.',
            icon: HeadphonesIcon
          },
          {
            title: 'Data Analytics',
            description: 'Executive dashboard, ROI tracking, usage analytics and cost optimization insights.',
            icon: BarChart3
          },
          {
            title: 'Legal Compliance',
            description: 'Meet Vietnamese, international and industry-specific compliance requirements.',
            icon: Award
          }
        ]
      },
      caseStudies: {
        title: 'Real Success Stories',
        subtitle: 'Discover how leading businesses have transformed their processes with Prismy',
        studies: [
          {
            company: 'VinGroup',
            industry: 'Diversified Conglomerate',
            challenge: 'Legal document and international contract translation across 15+ languages',
            solution: 'API integration with legal management system, custom terminology and workflow automation',
            results: ['80% reduction in translation time', '$2.3M annual cost savings', '99.8% legal accuracy']
          },
          {
            company: 'FPT Corporation',
            industry: 'Technology & IT Services',
            challenge: 'Software product localization for 25+ international markets',
            solution: 'DevOps integration with CI/CD pipeline, terminology management and quality assurance workflow',
            results: ['300% faster time-to-market', '25 simultaneous languages', '90% reduction in translation errors']
          },
          {
            company: 'Vietcombank',
            industry: 'Banking & Finance',
            challenge: 'Financial report and compliance document translation for international markets',
            solution: 'Banking-grade security, regulatory compliance integration and real-time reporting',
            results: ['100% BASEL III compliance', '60% faster reporting', 'Zero security incidents']
          }
        ]
      },
      pricing: {
        title: 'Enterprise Plans',
        subtitle: 'Flexible and scalable according to your organization\'s actual needs',
        enterprise: {
          title: 'Enterprise Custom',
          price: 'Custom Quote',
          description: 'Fully customized solution for large corporations',
          features: [
            'Unlimited API calls & document processing',
            'Dedicated cloud infrastructure',
            'Custom model training',
            'White-label solution',
            'Priority support & SLA',
            'Compliance & audit support',
            'Multi-region deployment',
            'Custom integration & training'
          ]
        }
      },
      contact: {
        title: 'Start your transformation journey',
        subtitle: 'Our expert team is ready to consult the most suitable solution',
        form: {
          company: 'Company Name',
          name: 'Full Name',
          email: 'Company Email',
          phone: 'Phone Number',
          employees: 'Number of Employees',
          industry: 'Industry',
          requirements: 'Specific Requirements',
          submit: 'Request Consultation'
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <Navbar />
      
      <main>
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-white pt-20 w-full">
            <div className="w-full py-20 px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  variants={motionSafe(staggerContainer)}
                  initial="hidden"
                  animate="visible"
                  className="text-center"
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
                    className="body-lg text-text-muted max-w-3xl mx-auto mb-12"
                  >
                    {content[language].hero.description}
                  </motion.p>
                  
                  <motion.div 
                    variants={motionSafe(slideUp)}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                  >
                    <button className="btn-primary btn-lg">
                      {content[language].hero.cta1}
                    </button>
                    <button className="btn-secondary btn-lg">
                      {content[language].hero.cta2}
                    </button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-20 bg-gray-50 w-full">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {content[language].stats.map((stat, index) => (
                    <motion.div 
                      key={index} 
                      variants={motionSafe(slideUp)}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      className="text-center"
                    >
                      <div className="heading-1 text-text-primary mb-2">{stat.number}</div>
                      <div className="body-base text-text-secondary">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Why Enterprise Section */}
          <section className="py-20 w-full">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  variants={motionSafe(staggerContainer)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <motion.div variants={motionSafe(slideUp)} className="text-center mb-16">
                    <h2 className="heading-2 text-text-primary mb-4">
                      {content[language].whyEnterprise.title}
                    </h2>
                    <p className="body-lg text-text-secondary max-w-3xl mx-auto">
                      {content[language].whyEnterprise.subtitle}
                    </p>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {content[language].whyEnterprise.reasons.map((reason, index) => {
                      const IconComponent = reason.icon
                      return (
                        <motion.div
                          key={index}
                          variants={motionSafe(slideUp)}
                          className="bg-bg-secondary rounded-2xl p-8 border border-border-subtle zen-card-hover transition-all duration-300"
                        >
                          <div className="mb-6">
                            <IconComponent 
                              size={24} 
                              className="text-black zen-icon-hover transition-all duration-300" 
                              strokeWidth={1.5}
                            />
                          </div>
                          <h3 className="heading-4 text-text-primary mb-3">{reason.title}</h3>
                          <p className="body-base text-text-secondary">{reason.description}</p>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Case Studies Section */}
          <section className="py-20 bg-gray-50 w-full">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  variants={motionSafe(staggerContainer)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <motion.div variants={motionSafe(slideUp)} className="text-center mb-16">
                    <h2 className="heading-2 text-text-primary mb-4">
                      {content[language].caseStudies.title}
                    </h2>
                    <p className="body-lg text-text-secondary max-w-3xl mx-auto">
                      {content[language].caseStudies.subtitle}
                    </p>
                  </motion.div>
                  
                  <div className="space-y-12">
                    {content[language].caseStudies.studies.map((study, index) => (
                      <motion.div
                        key={index}
                        variants={motionSafe(slideUp)}
                        className="bg-bg-secondary rounded-2xl p-8 border border-border-subtle"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <div>
                            <h3 className="heading-4 text-text-primary mb-2">{study.company}</h3>
                            <p className="body-sm text-text-muted mb-4">{study.industry}</p>
                            <div className="mb-4">
                              <h4 className="body-base font-semibold text-text-primary mb-2">
                                {language === 'vi' ? 'Thách thức:' : 'Challenge:'}
                              </h4>
                              <p className="body-sm text-text-secondary">{study.challenge}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="body-base font-semibold text-text-primary mb-2">
                              {language === 'vi' ? 'Giải pháp:' : 'Solution:'}
                            </h4>
                            <p className="body-sm text-text-secondary">{study.solution}</p>
                          </div>
                          
                          <div>
                            <h4 className="body-base font-semibold text-text-primary mb-2">
                              {language === 'vi' ? 'Kết quả:' : 'Results:'}
                            </h4>
                            <ul className="space-y-2">
                              {study.results.map((result, resultIndex) => (
                                <li key={resultIndex} className="flex items-start space-x-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span className="body-sm text-text-secondary">{result}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Vietnamese Market Focus */}
          <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50 w-full">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  variants={motionSafe(staggerContainer)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <motion.div variants={motionSafe(slideUp)} className="text-center mb-16">
                    <h2 className="heading-2 text-text-primary mb-4">
                      {language === 'vi' ? 'Được thiết kế đặc biệt cho thị trường Việt Nam' : 'Specifically Designed for Vietnamese Market'}
                    </h2>
                    <p className="body-lg text-text-secondary max-w-3xl mx-auto">
                      {language === 'vi' 
                        ? 'Chúng tôi hiểu sâu sắc về văn hóa, quy định pháp lý và nhu cầu kinh doanh đặc thù của các doanh nghiệp Việt Nam'
                        : 'We deeply understand the culture, legal regulations and specific business needs of Vietnamese enterprises'
                      }
                    </p>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                      {
                        title: language === 'vi' ? 'Tuân thủ pháp luật Việt Nam' : 'Vietnamese Legal Compliance',
                        description: language === 'vi' 
                          ? 'Đáp ứng đầy đủ Luật An toàn thông tin mạng, Nghị định 85/2016, Thông tư 20/2017 và các quy định mới nhất của Bộ TT&TT'
                          : 'Full compliance with Cybersecurity Law, Decree 85/2016, Circular 20/2017 and latest regulations from Ministry of ICT',
                        icon: '🇻🇳'
                      },
                      {
                        title: language === 'vi' ? 'Data Center tại Việt Nam' : 'Data Center in Vietnam',
                        description: language === 'vi' 
                          ? 'Máy chủ đặt tại Việt Nam, đảm bảo độ trễ thấp và tuân thủ quy định về lưu trữ dữ liệu trong nước'
                          : 'Servers located in Vietnam, ensuring low latency and compliance with domestic data storage regulations',
                        icon: '🏢'
                      },
                      {
                        title: language === 'vi' ? 'Hỗ trợ tiếng Việt chuyên sâu' : 'Deep Vietnamese Language Support',
                        description: language === 'vi' 
                          ? 'AI được huấn luyện chuyên biệt cho tiếng Việt, hiểu ngữ cảnh văn hóa và thuật ngữ chuyên ngành Việt Nam'
                          : 'AI specially trained for Vietnamese, understanding cultural context and Vietnamese industry terminology',
                        icon: '🤖'
                      },
                      {
                        title: language === 'vi' ? 'Tích hợp hệ thống Việt Nam' : 'Vietnamese System Integration',
                        description: language === 'vi' 
                          ? 'Tích hợp sẵn với các hệ thống phổ biến tại Việt Nam như VNPT, Viettel, FPT và các giải pháp ERP địa phương'
                          : 'Pre-integrated with popular Vietnamese systems like VNPT, Viettel, FPT and local ERP solutions',
                        icon: '🔗'
                      },
                      {
                        title: language === 'vi' ? 'Thanh toán nội địa' : 'Local Payment Methods',
                        description: language === 'vi' 
                          ? 'Hỗ trợ đầy đủ các phương thức thanh toán Việt Nam: VNPay, MoMo, chuyển khoản ngân hàng và hóa đơn VAT'
                          : 'Full support for Vietnamese payment methods: VNPay, MoMo, bank transfers and VAT invoicing',
                        icon: '💳'
                      },
                      {
                        title: language === 'vi' ? 'Đội ngũ hỗ trợ Việt Nam' : 'Vietnamese Support Team',
                        description: language === 'vi' 
                          ? 'Đội ngũ kỹ thuật và CSKH người Việt, hiểu rõ văn hóa làm việc và có thể hỗ trợ 24/7 bằng tiếng Việt'
                          : 'Vietnamese technical and customer support team, understanding work culture and providing 24/7 Vietnamese support',
                        icon: '👥'
                      }
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        variants={motionSafe(slideUp)}
                        className="bg-white rounded-2xl p-6 border border-blue-200 hover:border-blue-300 transition-all duration-300"
                      >
                        <div className="text-3xl mb-4">{item.icon}</div>
                        <h3 className="heading-4 text-text-primary mb-3">{item.title}</h3>
                        <p className="body-sm text-text-secondary">{item.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="py-20 w-full">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  variants={motionSafe(staggerContainer)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <motion.div variants={motionSafe(slideUp)} className="text-center mb-16">
                    <h2 className="heading-2 text-text-primary mb-4">
                      {language === 'vi' ? 'Lời chứng thực từ khách hàng' : 'Customer Testimonials'}
                    </h2>
                    <p className="body-lg text-text-secondary">
                      {language === 'vi' 
                        ? 'Nghe những chia sẻ từ các nhà lãnh đạo doanh nghiệp về trải nghiệm với Prismy'
                        : 'Hear from business leaders about their experience with Prismy'
                      }
                    </p>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      {
                        quote: language === 'vi' 
                          ? '"Prismy đã giúp chúng tôi giảm 70% thời gian dịch thuật tài liệu pháp lý quốc tế. Độ chính xác và tốc độ vượt xa mong đợi của chúng tôi."'
                          : '"Prismy has helped us reduce international legal document translation time by 70%. The accuracy and speed exceeded our expectations."',
                        author: 'Nguyễn Văn Minh',
                        position: language === 'vi' ? 'Giám đốc Pháp chế, VinGroup' : 'Legal Director, VinGroup',
                        company: 'VinGroup'
                      },
                      {
                        quote: language === 'vi' 
                          ? '"Việc tích hợp Prismy vào quy trình CI/CD của chúng tôi đã tăng tốc độ ra mắt sản phẩm quốc tế lên 300%. Đây là game changer thực sự."'
                          : '"Integrating Prismy into our CI/CD process has accelerated international product launches by 300%. This is a real game changer."',
                        author: 'Trần Thanh Hương',
                        position: language === 'vi' ? 'CTO, FPT Software' : 'CTO, FPT Software',
                        company: 'FPT Corporation'
                      },
                      {
                        quote: language === 'vi' 
                          ? '"Bảo mật và tuân thủ của Prismy đáp ứng hoàn hảo yêu cầu khắt khe của ngành ngân hàng. Chúng tôi hoàn toàn yên tâm về dữ liệu khách hàng."'
                          : '"Prismy\'s security and compliance perfectly meet the stringent requirements of the banking industry. We are completely confident about customer data."',
                        author: 'Lê Thị Mai',
                        position: language === 'vi' ? 'Phó Tổng Giám đốc, Vietcombank' : 'Deputy CEO, Vietcombank',
                        company: 'Vietcombank'
                      },
                      {
                        quote: language === 'vi' 
                          ? '"ROI từ Prismy đạt 400% chỉ trong 6 tháng đầu. Chi phí dịch thuật giảm mạnh nhưng chất lượng lại tăng đáng kể."'
                          : '"ROI from Prismy reached 400% in just the first 6 months. Translation costs dropped significantly but quality increased remarkably."',
                        author: 'Phạm Đức Thành',
                        position: language === 'vi' ? 'CFO, Techcombank' : 'CFO, Techcombank',
                        company: 'Techcombank'
                      }
                    ].map((testimonial, index) => (
                      <motion.div
                        key={index}
                        variants={motionSafe(slideUp)}
                        className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg"
                      >
                        <p className="body-base text-text-secondary mb-6 italic leading-relaxed">
                          {testimonial.quote}
                        </p>
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                            {testimonial.author.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-semibold text-text-primary">{testimonial.author}</div>
                            <div className="body-sm text-text-muted">{testimonial.position}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Enterprise Pricing */}
          <section className="py-20 w-full">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  variants={motionSafe(staggerContainer)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <motion.div variants={motionSafe(slideUp)} className="mb-16">
                    <h2 className="heading-2 text-text-primary mb-4">
                      {content[language].pricing.title}
                    </h2>
                    <p className="body-lg text-text-secondary">
                      {content[language].pricing.subtitle}
                    </p>
                  </motion.div>
                  
                  <motion.div
                    variants={motionSafe(slideUp)}
                    className="bg-bg-secondary rounded-2xl p-8 border border-border-subtle"
                  >
                    <h3 className="heading-3 text-text-primary mb-2">
                      {content[language].pricing.enterprise.title}
                    </h3>
                    <p className="heading-4 text-text-primary mb-4">
                      {content[language].pricing.enterprise.price}
                    </p>
                    <p className="body-base text-text-secondary mb-8">
                      {content[language].pricing.enterprise.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {content[language].pricing.enterprise.features.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="body-sm text-text-secondary text-left">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <button className="btn-primary btn-lg">
                      {content[language].hero.cta1}
                    </button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="py-20 bg-black w-full">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  variants={motionSafe(staggerContainer)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <motion.div variants={motionSafe(slideUp)} className="text-center mb-12">
                    <h2 className="heading-2 text-white mb-4">
                      {content[language].contact.title}
                    </h2>
                    <p className="body-lg text-gray-300">
                      {content[language].contact.subtitle}
                    </p>
                  </motion.div>
                  
                  <motion.div
                    variants={motionSafe(slideUp)}
                    className="bg-white rounded-2xl p-8"
                  >
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input
                        type="text"
                        placeholder={content[language].contact.form.company}
                        className="input-base"
                      />
                      <input
                        type="text"
                        placeholder={content[language].contact.form.name}
                        className="input-base"
                      />
                      <input
                        type="email"
                        placeholder={content[language].contact.form.email}
                        className="input-base"
                      />
                      <input
                        type="tel"
                        placeholder={content[language].contact.form.phone}
                        className="input-base"
                      />
                      <UniversalDropdown
                        value={employeeCount}
                        onChange={(value) => setEmployeeCount(value)}
                        size="lg"
                        placeholder={content[language].contact.form.employees}
                        options={[
                          { value: '1-50', label: '1-50' },
                          { value: '51-200', label: '51-200' },
                          { value: '201-1000', label: '201-1000' },
                          { value: '1000+', label: '1000+' }
                        ]}
                      />
                      <input
                        type="text"
                        placeholder={content[language].contact.form.industry}
                        className="input-base"
                      />
                      <textarea
                        placeholder={content[language].contact.form.requirements}
                        rows={4}
                        className="input-base md:col-span-2"
                      />
                      <button
                        type="submit"
                        className="btn-primary btn-lg md:col-span-2"
                      >
                        {content[language].contact.form.submit}
                      </button>
                    </form>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
  )
}

export default function Enterprise() {
  return (
    <AuthProvider>
      <EnterpriseContent />
    </AuthProvider>
  )
}