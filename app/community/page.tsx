'use client'

import { motion } from 'framer-motion'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import MainLayout from '@/components/layouts/MainLayout'
import {
  Users,
  MessageSquare,
  BookOpen,
  Star,
  GitBranch,
  Coffee,
  Heart,
  Award,
  Sparkles,
  ExternalLink,
  ArrowRight,
} from 'lucide-react'
import Image from 'next/image'

export default function CommunityPage() {
  const { language } = useSSRSafeLanguage()

  const content = {
    vi: {
      hero: {
        title: 'Tham gia cộng đồng Prismy',
        subtitle:
          'Kết nối với hàng nghìn người dùng, chia sẻ kinh nghiệm và học hỏi cùng nhau',
        stats: [
          { label: 'Thành viên', value: '50,000+' },
          { label: 'Bài đăng', value: '125,000+' },
          { label: 'Câu trả lời', value: '89%' },
          { label: 'Quốc gia', value: '120+' },
        ],
      },
      platforms: {
        title: 'Tham gia trên các nền tảng',
        subtitle: 'Chọn nền tảng phù hợp với bạn để kết nối với cộng đồng',
        items: [
          {
            name: 'Discord',
            description: 'Chat real-time, hỏi đáp nhanh và chia sẻ tips',
            members: '25,000+',
            icon: MessageSquare,
            color: 'bg-indigo-500',
            link: '#',
          },
          {
            name: 'GitHub',
            description: 'Đóng góp mã nguồn, báo lỗi và feature requests',
            members: '8,500+',
            icon: GitBranch,
            color: 'bg-gray-800',
            link: '#',
          },
          {
            name: 'LinkedIn',
            description: 'Kết nối chuyên nghiệp và cập nhật tin tức',
            members: '12,000+',
            icon: Users,
            color: 'bg-blue-600',
            link: '#',
          },
          {
            name: 'Blog',
            description: 'Hướng dẫn chi tiết, case studies và best practices',
            members: '45,000+',
            icon: BookOpen,
            color: 'bg-green-600',
            link: '/blog',
          },
        ],
      },
      featured: {
        title: 'Thành viên nổi bật',
        subtitle: 'Những người đóng góp tích cực cho cộng đồng',
        members: [
          {
            name: 'Nguyễn Văn An',
            role: 'Lead Developer tại FPT',
            avatar:
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            contribution: 'Đóng góp 50+ templates',
            badge: 'Top Contributor',
          },
          {
            name: 'Trần Thị Lan',
            role: 'Product Manager tại VNG',
            avatar:
              'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face',
            contribution: 'Hỗ trợ 1000+ câu hỏi',
            badge: 'Community Helper',
          },
          {
            name: 'Lê Minh Tuấn',
            role: 'CTO tại Tiki',
            avatar:
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            contribution: 'API documentation',
            badge: 'Tech Expert',
          },
        ],
      },
      resources: {
        title: 'Tài nguyên cộng đồng',
        subtitle: 'Tất cả những gì bạn cần để thành công với Prismy',
        categories: [
          {
            title: 'Hướng dẫn cho người mới',
            description: 'Bắt đầu với Prismy từ A-Z',
            icon: BookOpen,
            color: 'bg-blue-500',
            items: [
              'Cài đặt và cấu hình',
              'Tính năng cơ bản',
              'Best practices',
              'Troubleshooting',
            ],
          },
          {
            title: 'Templates & Examples',
            description: 'Mẫu và ví dụ thực tế',
            icon: Sparkles,
            color: 'bg-purple-500',
            items: [
              'Translation templates',
              'API integration examples',
              'Workflow automation',
              'Custom solutions',
            ],
          },
          {
            title: 'Developer Resources',
            description: 'Tài nguyên cho lập trình viên',
            icon: GitBranch,
            color: 'bg-green-500',
            items: [
              'API documentation',
              'SDK và libraries',
              'Code samples',
              'Integration guides',
            ],
          },
        ],
      },
      events: {
        title: 'Sự kiện sắp tới',
        subtitle: 'Tham gia các sự kiện và workshop của cộng đồng',
        upcoming: [
          {
            title: 'Prismy Workshop: AI Translation Best Practices',
            date: '15 Tháng 7, 2024',
            time: '19:00 - 21:00',
            type: 'Online',
            attendees: 450,
            description: 'Học cách tối ưu hóa quy trình dịch thuật với AI',
          },
          {
            title: 'Community Meetup - Ho Chi Minh City',
            date: '22 Tháng 7, 2024',
            time: '18:30 - 21:00',
            type: 'Offline',
            attendees: 120,
            description: 'Gặp gỡ trực tiếp với cộng đồng tại TP.HCM',
          },
          {
            title: 'Prismy API Masterclass',
            date: '5 Tháng 8, 2024',
            time: '20:00 - 22:00',
            type: 'Online',
            attendees: 300,
            description: 'Deep dive vào Prismy API và advanced features',
          },
        ],
      },
      cta: {
        title: 'Sẵn sàng tham gia cộng đồng?',
        subtitle: 'Bắt đầu hành trình của bạn với hàng nghìn thành viên khác',
        primary: 'Tham gia Discord',
        secondary: 'Xem tài nguyên',
      },
    },
    en: {
      hero: {
        title: 'Join the Prismy Community',
        subtitle:
          'Connect with thousands of users, share experiences and learn together',
        stats: [
          { label: 'Members', value: '50,000+' },
          { label: 'Posts', value: '125,000+' },
          { label: 'Response Rate', value: '89%' },
          { label: 'Countries', value: '120+' },
        ],
      },
      platforms: {
        title: 'Join on platforms',
        subtitle: 'Choose the right platform to connect with the community',
        items: [
          {
            name: 'Discord',
            description: 'Real-time chat, quick Q&A and tips sharing',
            members: '25,000+',
            icon: MessageSquare,
            color: 'bg-indigo-500',
            link: '#',
          },
          {
            name: 'GitHub',
            description: 'Contribute code, report bugs and feature requests',
            members: '8,500+',
            icon: GitBranch,
            color: 'bg-gray-800',
            link: '#',
          },
          {
            name: 'LinkedIn',
            description: 'Professional networking and news updates',
            members: '12,000+',
            icon: Users,
            color: 'bg-blue-600',
            link: '#',
          },
          {
            name: 'Blog',
            description: 'Detailed guides, case studies and best practices',
            members: '45,000+',
            icon: BookOpen,
            color: 'bg-green-600',
            link: '/blog',
          },
        ],
      },
      featured: {
        title: 'Featured Members',
        subtitle: 'Active contributors to the community',
        members: [
          {
            name: 'John Smith',
            role: 'Lead Developer at Microsoft',
            avatar:
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            contribution: 'Contributed 50+ templates',
            badge: 'Top Contributor',
          },
          {
            name: 'Sarah Johnson',
            role: 'Product Manager at Google',
            avatar:
              'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face',
            contribution: 'Helped 1000+ questions',
            badge: 'Community Helper',
          },
          {
            name: 'David Chen',
            role: 'CTO at Amazon',
            avatar:
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            contribution: 'API documentation',
            badge: 'Tech Expert',
          },
        ],
      },
      resources: {
        title: 'Community Resources',
        subtitle: 'Everything you need to succeed with Prismy',
        categories: [
          {
            title: 'Getting Started',
            description: 'Begin your Prismy journey from A-Z',
            icon: BookOpen,
            color: 'bg-blue-500',
            items: [
              'Setup and configuration',
              'Basic features',
              'Best practices',
              'Troubleshooting',
            ],
          },
          {
            title: 'Templates & Examples',
            description: 'Real-world templates and examples',
            icon: Sparkles,
            color: 'bg-purple-500',
            items: [
              'Translation templates',
              'API integration examples',
              'Workflow automation',
              'Custom solutions',
            ],
          },
          {
            title: 'Developer Resources',
            description: 'Resources for developers',
            icon: GitBranch,
            color: 'bg-green-500',
            items: [
              'API documentation',
              'SDKs and libraries',
              'Code samples',
              'Integration guides',
            ],
          },
        ],
      },
      events: {
        title: 'Upcoming Events',
        subtitle: 'Join community events and workshops',
        upcoming: [
          {
            title: 'Prismy Workshop: AI Translation Best Practices',
            date: 'July 15, 2024',
            time: '7:00 PM - 9:00 PM',
            type: 'Online',
            attendees: 450,
            description: 'Learn how to optimize translation workflows with AI',
          },
          {
            title: 'Community Meetup - San Francisco',
            date: 'July 22, 2024',
            time: '6:30 PM - 9:00 PM',
            type: 'Offline',
            attendees: 120,
            description: 'Meet the community in person in San Francisco',
          },
          {
            title: 'Prismy API Masterclass',
            date: 'August 5, 2024',
            time: '8:00 PM - 10:00 PM',
            type: 'Online',
            attendees: 300,
            description: 'Deep dive into Prismy API and advanced features',
          },
        ],
      },
      cta: {
        title: 'Ready to join the community?',
        subtitle: 'Start your journey with thousands of other members',
        primary: 'Join Discord',
        secondary: 'View Resources',
      },
    },
  }

  const currentContent = content[language]

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              {currentContent.hero.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              {currentContent.hero.subtitle}
            </p>

            {/* Community Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {currentContent.hero.stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Community Platforms */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {currentContent.platforms.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {currentContent.platforms.subtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {currentContent.platforms.items.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center hover:border-blue-300 hover:shadow-lg transition-all duration-300 group cursor-pointer"
              >
                <div
                  className={`w-16 h-16 ${platform.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <platform.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {platform.name}
                </h3>
                <p className="text-gray-600 mb-4">{platform.description}</p>
                <div className="text-sm font-semibold text-blue-600 mb-4">
                  {platform.members} members
                </div>
                <button className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200">
                  Join Now
                  <ExternalLink className="ml-2 w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Members */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {currentContent.featured.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {currentContent.featured.subtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {currentContent.featured.members.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                    <Image
                      src={member.avatar}
                      alt={member.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                    <Award className="w-3 h-3 inline mr-1" />
                    {member.badge}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-gray-600 mb-4">{member.role}</p>
                <div className="flex items-center justify-center text-green-600">
                  <Heart className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">
                    {member.contribution}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Resources */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {currentContent.resources.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {currentContent.resources.subtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {currentContent.resources.categories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8"
              >
                <div
                  className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mb-6`}
                >
                  <category.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {category.title}
                </h3>
                <p className="text-gray-600 mb-6">{category.description}</p>
                <ul className="space-y-3">
                  {category.items.map((item, i) => (
                    <li key={i} className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-24 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {currentContent.events.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {currentContent.events.subtitle}
            </p>
          </motion.div>

          <div className="space-y-6">
            {currentContent.events.upcoming.map((event, index) => (
              <motion.div
                key={event.title}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex-1 mb-4 lg:mb-0">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-bold text-gray-900 mr-4">
                        {event.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          event.type === 'Online'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {event.type}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{event.description}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-4">{event.date}</span>
                      <span className="mr-4">{event.time}</span>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {event.attendees} attending
                      </span>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
                    Register Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              {currentContent.cta.title}
            </h2>
            <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
              {currentContent.cta.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-300 transform hover:scale-105">
                {currentContent.cta.primary}
                <ArrowRight className="ml-2 w-5 h-5 inline" />
              </button>
              <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-300">
                {currentContent.cta.secondary}
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  )
}
