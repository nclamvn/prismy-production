'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { AuthProvider } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { slideUp, staggerContainer, motionSafe } from '@/lib/motion'
import { 
  Calendar,
  Clock,
  User,
  ArrowRight,
  Tag
} from 'lucide-react'

export default function Blog() {
  const { language } = useLanguage()
  const [selectedCategory, setSelectedCategory] = useState('all')

  const content = {
    vi: {
      hero: {
        title: 'Blog Prismy',
        subtitle: 'Insights về AI, dịch thuật và văn hóa',
        description: 'Khám phá những xu hướng mới nhất trong công nghệ dịch thuật AI, case study từ khách hàng và insights về ngành ngôn ngữ.'
      },
      categories: [
        { id: 'all', name: 'Tất cả' },
        { id: 'ai', name: 'AI & Công nghệ' },
        { id: 'translation', name: 'Dịch thuật' },
        { id: 'culture', name: 'Văn hóa' },
        { id: 'business', name: 'Kinh doanh' },
        { id: 'technical', name: 'Kỹ thuật' }
      ],
      articles: [
        {
          id: 1,
          title: 'Tương lai của AI Translation trong thời đại số',
          excerpt: 'Khám phá cách AI đang thay đổi cách chúng ta giao tiếp qua các rào cản ngôn ngữ và tác động đến doanh nghiệp toàn cầu.',
          category: 'ai',
          author: 'Dr. Nguyễn Minh Anh',
          date: '15 Tháng 12, 2024',
          readTime: '8 phút đọc',
          image: '/api/placeholder/600/400',
          featured: true
        },
        {
          id: 2,
          title: 'Case Study: VinGroup tối ưu quy trình dịch thuật với AI',
          excerpt: 'Tìm hiểu cách VinGroup giảm 80% thời gian dịch thuật và tiết kiệm $2.3M mỗi năm với giải pháp AI translation của Prismy.',
          category: 'business',
          author: 'Trần Văn Nam',
          date: '12 Tháng 12, 2024',
          readTime: '6 phút đọc',
          image: '/api/placeholder/600/400'
        },
        {
          id: 3,
          title: 'Những thách thức trong dịch thuật tiếng Việt với AI',
          excerpt: 'Phân tích sâu về đặc thù ngôn ngữ Việt Nam và cách AI hiện đại xử lý các nét văn hóa tinh tế trong dịch thuật.',
          category: 'culture',
          author: 'Lê Thị Hương',
          date: '10 Tháng 12, 2024',
          readTime: '10 phút đọc',
          image: '/api/placeholder/600/400'
        },
        {
          id: 4,
          title: 'API Integration Best Practices cho Enterprise',
          excerpt: 'Hướng dẫn chi tiết cách tích hợp Prismy API vào hệ thống doanh nghiệp hiện tại một cách hiệu quả và bảo mật.',
          category: 'technical',
          author: 'Phạm Quang Huy',
          date: '8 Tháng 12, 2024',
          readTime: '12 phút đọc',
          image: '/api/placeholder/600/400'
        },
        {
          id: 5,
          title: 'Xu hướng localization tại Đông Nam Á 2024',
          excerpt: 'Báo cáo toàn diện về thị trường localization tại khu vực ASEAN và cơ hội cho các doanh nghiệp Việt Nam.',
          category: 'business',
          author: 'Hoàng Thị Mai',
          date: '5 Tháng 12, 2024',
          readTime: '7 phút đọc',
          image: '/api/placeholder/600/400'
        },
        {
          id: 6,
          title: 'Machine Learning trong xử lý ngôn ngữ tự nhiên',
          excerpt: 'Đi sâu vào các thuật toán ML hiện đại được Prismy sử dụng để đạt độ chính xác 99.8% trong dịch thuật.',
          category: 'ai',
          author: 'Dr. Vũ Hoàng Long',
          date: '2 Tháng 12, 2024',
          readTime: '15 phút đọc',
          image: '/api/placeholder/600/400'
        }
      ]
    },
    en: {
      hero: {
        title: 'Prismy Blog',
        subtitle: 'Insights on AI, Translation and Culture',
        description: 'Discover the latest trends in AI translation technology, customer case studies and insights about the language industry.'
      },
      categories: [
        { id: 'all', name: 'All' },
        { id: 'ai', name: 'AI & Technology' },
        { id: 'translation', name: 'Translation' },
        { id: 'culture', name: 'Culture' },
        { id: 'business', name: 'Business' },
        { id: 'technical', name: 'Technical' }
      ],
      articles: [
        {
          id: 1,
          title: 'The Future of AI Translation in the Digital Age',
          excerpt: 'Explore how AI is changing the way we communicate across language barriers and its impact on global business.',
          category: 'ai',
          author: 'Dr. Nguyen Minh Anh',
          date: 'December 15, 2024',
          readTime: '8 min read',
          image: '/api/placeholder/600/400',
          featured: true
        },
        {
          id: 2,
          title: 'Case Study: VinGroup Optimizes Translation Workflow with AI',
          excerpt: 'Learn how VinGroup reduced translation time by 80% and saved $2.3M annually with Prismy\'s AI translation solution.',
          category: 'business',
          author: 'Tran Van Nam',
          date: 'December 12, 2024',
          readTime: '6 min read',
          image: '/api/placeholder/600/400'
        },
        {
          id: 3,
          title: 'Challenges in Vietnamese Translation with AI',
          excerpt: 'Deep analysis of Vietnamese language specifics and how modern AI handles subtle cultural nuances in translation.',
          category: 'culture',
          author: 'Le Thi Huong',
          date: 'December 10, 2024',
          readTime: '10 min read',
          image: '/api/placeholder/600/400'
        },
        {
          id: 4,
          title: 'API Integration Best Practices for Enterprise',
          excerpt: 'Detailed guide on how to integrate Prismy API into existing enterprise systems efficiently and securely.',
          category: 'technical',
          author: 'Pham Quang Huy',
          date: 'December 8, 2024',
          readTime: '12 min read',
          image: '/api/placeholder/600/400'
        },
        {
          id: 5,
          title: 'Southeast Asia Localization Trends 2024',
          excerpt: 'Comprehensive report on the ASEAN localization market and opportunities for Vietnamese businesses.',
          category: 'business',
          author: 'Hoang Thi Mai',
          date: 'December 5, 2024',
          readTime: '7 min read',
          image: '/api/placeholder/600/400'
        },
        {
          id: 6,
          title: 'Machine Learning in Natural Language Processing',
          excerpt: 'Deep dive into modern ML algorithms used by Prismy to achieve 99.8% accuracy in translation.',
          category: 'ai',
          author: 'Dr. Vu Hoang Long',
          date: 'December 2, 2024',
          readTime: '15 min read',
          image: '/api/placeholder/600/400'
        }
      ]
    }
  }

  const filteredArticles = selectedCategory === 'all' 
    ? content[language].articles 
    : content[language].articles.filter(article => article.category === selectedCategory)

  const featuredArticle = content[language].articles.find(article => article.featured)
  const regularArticles = content[language].articles.filter(article => !article.featured)

  return (
    <AuthProvider>
      <div className="min-h-screen bg-bg-main">
        <Navbar />
        
        <main>
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-white pt-20 w-full">
            <div className="w-full py-20 px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
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
                    className="body-lg text-text-muted max-w-2xl mx-auto"
                  >
                    {content[language].hero.description}
                  </motion.p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Category Filter */}
          <section className="py-12 border-b border-border-subtle w-full">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-wrap justify-center gap-4">
                  {content[language].categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                        selectedCategory === category.id
                          ? 'bg-black text-white'
                          : 'bg-bg-secondary text-text-secondary hover:bg-gray-100'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Featured Article */}
          {featuredArticle && selectedCategory === 'all' && (
            <section className="py-20 w-full">
              <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                  <motion.div
                    variants={motionSafe(slideUp)}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="bg-bg-secondary rounded-2xl p-8 border border-border-subtle zen-card-hover transition-all duration-300"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Tag size={16} className="text-text-muted" />
                          <span className="body-sm text-text-muted uppercase tracking-wide">
                            {language === 'vi' ? 'Nổi bật' : 'Featured'}
                          </span>
                        </div>
                        
                        <h2 className="heading-3 text-text-primary mb-4">
                          {featuredArticle.title}
                        </h2>
                        
                        <p className="body-base text-text-secondary mb-6">
                          {featuredArticle.excerpt}
                        </p>
                        
                        <div className="blog-metadata-container mb-6 text-text-muted">
                          <div className="flex items-center gap-2">
                            <User size={16} />
                            <span className="body-sm">{featuredArticle.author}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span className="body-sm">{featuredArticle.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span className="body-sm">{featuredArticle.readTime}</span>
                          </div>
                        </div>
                        
                        <Link 
                          href={`/blog/${featuredArticle.id}`}
                          className="inline-flex items-center gap-2 text-text-primary hover:text-text-accent transition-colors"
                        >
                          <span className="body-base font-semibold">
                            {language === 'vi' ? 'Đọc tiếp' : 'Read more'}
                          </span>
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                      
                      <div className="bg-gray-200 rounded-xl aspect-video flex items-center justify-center">
                        <span className="text-text-muted">Featured Image</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>
          )}

          {/* Articles Grid */}
          <section className="py-20 w-full">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  variants={motionSafe(staggerContainer)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(selectedCategory === 'all' ? regularArticles : filteredArticles).map((article) => (
                      <motion.article
                        key={article.id}
                        variants={motionSafe(slideUp)}
                        className="bg-bg-secondary rounded-2xl border border-border-subtle zen-card-hover transition-all duration-300 overflow-hidden"
                      >
                        {/* Article Image */}
                        <div className="bg-gray-200 aspect-video flex items-center justify-center">
                          <span className="text-text-muted">Article Image</span>
                        </div>
                        
                        {/* Article Content */}
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Tag size={14} className="text-text-muted" />
                            <span className="body-sm text-text-muted uppercase tracking-wide">
                              {content[language].categories.find(cat => cat.id === article.category)?.name}
                            </span>
                          </div>
                          
                          <h3 className="heading-5 text-text-primary mb-3 line-clamp-2">
                            {article.title}
                          </h3>
                          
                          <p className="body-sm text-text-secondary mb-4 line-clamp-3">
                            {article.excerpt}
                          </p>
                          
                          <div className="blog-metadata-container mb-4 text-text-muted">
                            <div className="flex items-center gap-1">
                              <User size={14} />
                              <span className="body-xs">{article.author}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span className="body-xs">{article.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span className="body-xs">{article.readTime}</span>
                            </div>
                          </div>
                          
                          <Link 
                            href={`/blog/${article.id}`}
                            className="inline-flex items-center gap-2 text-text-primary hover:text-text-accent transition-colors"
                          >
                            <span className="body-sm font-semibold">
                              {language === 'vi' ? 'Đọc tiếp' : 'Read more'}
                            </span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Newsletter Signup */}
          <section className="py-20 bg-black w-full">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  variants={motionSafe(staggerContainer)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <motion.h2 
                    variants={motionSafe(slideUp)}
                    className="heading-2 text-white mb-6"
                  >
                    {language === 'vi' ? 'Đăng ký nhận bản tin' : 'Subscribe to Newsletter'}
                  </motion.h2>
                  
                  <motion.p 
                    variants={motionSafe(slideUp)}
                    className="body-lg text-gray-300 mb-8"
                  >
                    {language === 'vi' 
                      ? 'Nhận những insights mới nhất về AI translation và xu hướng ngành'
                      : 'Get the latest insights on AI translation and industry trends'
                    }
                  </motion.p>
                  
                  <motion.div 
                    variants={motionSafe(slideUp)}
                    className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto"
                  >
                    <input
                      type="email"
                      placeholder={language === 'vi' ? 'Email của bạn' : 'Your email'}
                      className="input-base flex-1"
                    />
                    <button className="bg-white text-black hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors">
                      {language === 'vi' ? 'Đăng ký' : 'Subscribe'}
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