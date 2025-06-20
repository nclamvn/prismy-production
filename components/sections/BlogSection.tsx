'use client'

import { motion } from 'framer-motion'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'
import BlogCard from '@/components/ui/BlogCard'
import Link from 'next/link'

interface BlogSectionProps {
  language: 'vi' | 'en'
  className?: string
}

export default function BlogSection({ language, className = '' }: BlogSectionProps) {
  const content = {
    vi: {
      title: 'Tin tức & Cập nhật',
      subtitle: 'Cập nhật mới nhất về AI, dịch thuật và công nghệ',
      viewAll: 'Xem tất cả bài viết',
      posts: [
        {
          title: 'Cách AI đang thay đổi ngành dịch thuật',
          excerpt: 'Khám phá cách trí tuệ nhân tạo đang cách mạng hóa cách chúng ta dịch thuật và giao tiếp đa ngôn ngữ.',
          author: 'Nguyễn Văn A',
          publishDate: '15 Th6 2025',
          readTime: '5 phút đọc',
          slug: 'ai-changing-translation-industry',
          category: 'Công nghệ',
          artlineIllustration: 'ai' as const
        },
        {
          title: 'Bảo mật dữ liệu trong dịch vụ dịch thuật',
          excerpt: 'Tìm hiểu các biện pháp bảo mật mà Prismy áp dụng để bảo vệ dữ liệu khách hàng.',
          author: 'Trần Thị B',
          publishDate: '12 Th6 2025',
          readTime: '7 phút đọc',
          slug: 'data-security-translation-services',
          category: 'Bảo mật',
          artlineIllustration: 'security' as const
        },
        {
          title: 'Dịch thuật doanh nghiệp: Xu hướng 2025',
          excerpt: 'Phân tích các xu hướng mới trong dịch thuật doanh nghiệp và cách thích ứng với thị trường toàn cầu.',
          author: 'Lê Văn C',
          publishDate: '10 Th6 2025',
          readTime: '6 phút đọc',
          slug: 'enterprise-translation-trends-2025',
          category: 'Kinh doanh',
          artlineIllustration: 'business' as const
        }
      ]
    },
    en: {
      title: 'News & Updates',
      subtitle: 'Latest updates on AI, translation, and technology',
      viewAll: 'View all articles',
      posts: [
        {
          title: 'How AI is Transforming the Translation Industry',
          excerpt: 'Explore how artificial intelligence is revolutionizing the way we translate and communicate across languages.',
          author: 'John Smith',
          publishDate: 'Jun 15, 2025',
          readTime: '5 min read',
          slug: 'ai-changing-translation-industry',
          category: 'Technology',
          artlineIllustration: 'ai' as const
        },
        {
          title: 'Data Security in Translation Services',
          excerpt: 'Learn about the security measures Prismy implements to protect customer data.',
          author: 'Jane Doe',
          publishDate: 'Jun 12, 2025',
          readTime: '7 min read',
          slug: 'data-security-translation-services',
          category: 'Security',
          artlineIllustration: 'security' as const
        },
        {
          title: 'Enterprise Translation: 2025 Trends',
          excerpt: 'Analysis of new trends in enterprise translation and adapting to global markets.',
          author: 'Mike Johnson',
          publishDate: 'Jun 10, 2025',
          readTime: '6 min read',
          slug: 'enterprise-translation-trends-2025',
          category: 'Business',
          artlineIllustration: 'business' as const
        }
      ]
    }
  }

  return (
    <section className={`py-20 bg-gray-50 w-full ${className}`}>
      <div className="w-full">
        <motion.div
          variants={motionSafe(staggerContainer)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="px-4 md:px-8 lg:px-12"
        >
          {/* Header */}
          <motion.div 
            variants={motionSafe(slideUp)} 
            className="text-center mb-16"
          >
            <h2 className="heading-2 text-gray-900 mb-4">
              {content[language].title}
            </h2>
            <p className="body-lg text-gray-600 max-w-2xl mx-auto mb-8">
              {content[language].subtitle}
            </p>
            <Link 
              href="/blog"
              className="inline-flex items-center px-6 py-3 bg-gray-900 text-white 
                       rounded-lg font-semibold hover:bg-gray-800 transition-colors
                       focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              {content[language].viewAll}
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
          
          {/* Blog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {content[language].posts.map((post, index) => (
              <BlogCard
                key={post.slug}
                title={post.title}
                excerpt={post.excerpt}
                author={post.author}
                publishDate={post.publishDate}
                readTime={post.readTime}
                slug={post.slug}
                category={post.category}
                artlineIllustration={post.artlineIllustration}
                delay={index * 0.1}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}