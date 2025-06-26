'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { Star, Quote, Building, Users, Zap, Shield, Globe } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function CommunityProof() {
  const { language } = useLanguage()
  const [isPaused, setIsPaused] = useState(false)

  const content = {
    vi: {
      title: "Được tin tưởng bởi hơn 50,000+ doanh nghiệp",
      subtitle: "Từ startup đến Fortune 500, mọi người đều chọn Prismy",
      testimonials: [
        {
          name: "Nguyễn Minh Anh",
          role: "Marketing Director",
          company: "VinGroup",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face",
          content: "Prismy giúp chúng tôi tiết kiệm 80% thời gian dịch thuật. Chất lượng AI translation vượt xa mong đợi.",
          rating: 5
        },
        {
          name: "Trần Văn Hùng",
          role: "Legal Counsel",
          company: "FPT Software",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
          content: "Tính năng dịch tài liệu pháp lý của Prismy cực kỳ chính xác. Chúng tôi đã áp dụng cho toàn bộ quy trình.",
          rating: 5
        },
        {
          name: "Lê Thu Hương",
          role: "Product Manager",
          company: "Shopee Vietnam",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
          content: "Interface thân thiện, dễ sử dụng. Team của tôi từ 20 người giờ chỉ cần 3 người để handle toàn bộ translation.",
          rating: 5
        },
        {
          name: "Phạm Đức Minh",
          role: "CTO",
          company: "TechCorp",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          content: "API integration siêu mượt mà. Chúng tôi đã tích hợp vào hệ thống ERP trong vòng 2 tuần.",
          rating: 5
        },
        {
          name: "Hoàng Thị Mai",
          role: "Operations Manager",
          company: "Global Solutions",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
          content: "Độ chính xác đáng kinh ngạc, đặc biệt với tài liệu kỹ thuật. Prismy đã thay đổi cách chúng tôi làm việc.",
          rating: 5
        },
        {
          name: "Võ Thanh Tùng",
          role: "Content Director",
          company: "Media Hub",
          avatar: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face",
          content: "Từ khi dùng Prismy, productivity team tăng gấp 5 lần. Tuyệt vời cho content đa ngôn ngữ.",
          rating: 5
        }
      ],
      companies: ["VinGroup", "FPT", "Shopee", "VNG", "Tiki", "Grab"],
      stats: [
        { label: "Khách hàng enterprise", value: "500+" },
        { label: "Tài liệu được dịch", value: "2M+" },
        { label: "Ngôn ngữ hỗ trợ", value: "100+" },
        { label: "Độ chính xác", value: "99.9%" }
      ]
    },
    en: {
      title: "Trusted by 50,000+ businesses worldwide",
      subtitle: "From startups to Fortune 500, everyone chooses Prismy",
      testimonials: [
        {
          name: "Sarah Johnson",
          role: "Marketing Director",
          company: "Microsoft",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face",
          content: "Prismy saves us 80% of translation time. The AI quality exceeds all expectations.",
          rating: 5
        },
        {
          name: "David Chen",
          role: "Legal Counsel",
          company: "Google",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
          content: "Legal document translation accuracy is phenomenal. We've integrated it into our entire workflow.",
          rating: 5
        },
        {
          name: "Emily Rodriguez",
          role: "Product Manager",
          company: "Amazon",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
          content: "User-friendly interface. My 20-person team now only needs 3 people to handle all translations.",
          rating: 5
        },
        {
          name: "Michael Park",
          role: "CTO",
          company: "TechFlow",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          content: "API integration was seamless. We had it running in our ERP system within 2 weeks.",
          rating: 5
        },
        {
          name: "Lisa Wang",
          role: "Operations Manager",
          company: "GlobalTech",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
          content: "Incredible accuracy, especially with technical documents. Prismy has transformed our workflow.",
          rating: 5
        },
        {
          name: "James Wilson",
          role: "Content Director",
          company: "MediaCorp",
          avatar: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face",
          content: "Since using Prismy, our team productivity increased 5x. Perfect for multilingual content.",
          rating: 5
        }
      ],
      companies: ["Microsoft", "Google", "Amazon", "Meta", "Apple", "Netflix"],
      stats: [
        { label: "Enterprise customers", value: "500+" },
        { label: "Documents translated", value: "2M+" },
        { label: "Languages supported", value: "100+" },
        { label: "Accuracy rate", value: "99.9%" }
      ]
    }
  }

  const currentContent = content[language]

  // Duplicate testimonials for seamless loop
  const duplicatedTestimonials = [...currentContent.testimonials, ...currentContent.testimonials]

  return (
    <section className="py-24" style={{ backgroundColor: 'rgba(251, 250, 249, 1)' }}>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .marquee-container {
          display: flex;
          animation: marquee 30s linear infinite;
        }
        
        .marquee-container.paused {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="w-full px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {currentContent.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {currentContent.subtitle}
          </p>
        </motion.div>

        {/* Marquee Testimonials */}
        <div 
          className="relative mb-20 overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className={`marquee-container ${isPaused ? 'paused' : ''}`}>
            {duplicatedTestimonials.map((testimonial, index) => (
              <div
                key={`${testimonial.name}-${index}`}
                className="flex-shrink-0"
                style={{ 
                  backgroundColor: '#f6f6f6',
                  borderRadius: '16px',
                  padding: '2rem',
                  width: '400px',
                  marginRight: '2rem',
                  minHeight: '280px'
                }}
              >
                {/* Quote Icon */}
                <Quote className="absolute top-6 right-6 w-8 h-8 text-gray-200" />
                
                {/* Rating */}
                <div className="flex mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-gray-400 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-gray-800 rounded-3xl p-12 text-white"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {currentContent.stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl lg:text-5xl font-bold mb-2">{stat.value}</div>
                  <div className="text-gray-300 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Live Activity Feed */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Live Activity</h3>
            <div className="flex items-center text-green-500">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live
            </div>
          </div>

          <div className="space-y-4">
            {[
              { user: "John from Microsoft", action: "translated a legal document", time: "2 mins ago" },
              { user: "Sarah from Google", action: "completed 5 marketing translations", time: "5 mins ago" },
              { user: "David from Amazon", action: "joined the enterprise plan", time: "8 mins ago" },
              { user: "Emily from Meta", action: "translated technical documentation", time: "12 mins ago" }
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    {activity.user.charAt(0)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">{activity.user}</span>
                    <span className="text-gray-600"> {activity.action}</span>
                  </div>
                </div>
                <div className="text-gray-500 text-sm">{activity.time}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        </div>

      </div>
    </section>
  )
}