'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { Shield, Lock, Award, Users, Globe, Zap, CheckCircle, Star } from 'lucide-react'

export default function TrustSignals() {
  const { language } = useLanguage()

  const content = {
    vi: {
      title: "Được tin tưởng bởi các tổ chức hàng đầu",
      subtitle: "Bảo mật enterprise, hiệu suất cao và hỗ trợ 24/7",
      certifications: {
        title: "Chứng nhận bảo mật",
        items: [
          { name: "SOC 2 Type II", icon: Shield, description: "Bảo mật dữ liệu enterprise" },
          { name: "GDPR", icon: Lock, description: "Tuân thủ quy định châu Âu" },
          { name: "ISO 27001", icon: Award, description: "Quản lý bảo mật thông tin" },
          { name: "HIPAA", icon: Shield, description: "Bảo vệ thông tin y tế" }
        ]
      },
      performance: {
        title: "Hiệu suất đáng tin cậy",
        metrics: [
          { label: "Uptime", value: "99.99%", icon: Zap },
          { label: "Thời gian phản hồi", value: "<100ms", icon: Zap },
          { label: "Khách hàng enterprise", value: "500+", icon: Users },
          { label: "Quốc gia", value: "50+", icon: Globe }
        ]
      },
      enterprises: {
        title: "Được sử dụng bởi",
        companies: [
          "Vinamilk", "VinGroup", "FPT", "VNPT", "Vietcombank", 
          "Sacombank", "VNG", "Tiki", "Shopee", "Grab",
          "Samsung Vietnam", "LG Vietnam"
        ]
      },
      features: {
        title: "Tại sao chọn Prismy?",
        items: [
          { title: "Mã hóa end-to-end", description: "Dữ liệu được bảo vệ tuyệt đối", icon: Lock },
          { title: "Không lưu trữ dữ liệu", description: "Xóa hoàn toàn sau khi dịch", icon: Shield },
          { title: "Hỗ trợ 24/7", description: "Đội ngũ hỗ trợ chuyên nghiệp", icon: Users },
          { title: "SLA 99.9%", description: "Cam kết về chất lượng dịch vụ", icon: Award },
          { title: "Tích hợp API", description: "Dễ dàng tích hợp vào hệ thống", icon: Zap },
          { title: "Đào tạo miễn phí", description: "Hướng dẫn sử dụng chi tiết", icon: Users }
        ]
      }
    },
    en: {
      title: "Trusted by leading organizations",
      subtitle: "Enterprise security, high performance, and 24/7 support",
      certifications: {
        title: "Security Certifications",
        items: [
          { name: "SOC 2 Type II", icon: Shield, description: "Enterprise data security" },
          { name: "GDPR", icon: Lock, description: "European compliance" },
          { name: "ISO 27001", icon: Award, description: "Information security management" },
          { name: "HIPAA", icon: Shield, description: "Healthcare information protection" }
        ]
      },
      performance: {
        title: "Reliable Performance",
        metrics: [
          { label: "Uptime", value: "99.99%", icon: Zap },
          { label: "Response time", value: "<100ms", icon: Zap },
          { label: "Enterprise customers", value: "500+", icon: Users },
          { label: "Countries", value: "50+", icon: Globe }
        ]
      },
      enterprises: {
        title: "Used by",
        companies: [
          "Microsoft", "Google", "Amazon", "Meta", "Apple",
          "Netflix", "Uber", "Airbnb", "Spotify", "Adobe",
          "Salesforce", "Oracle"
        ]
      },
      features: {
        title: "Why choose Prismy?",
        items: [
          { title: "End-to-end encryption", description: "Data protection guaranteed", icon: Lock },
          { title: "Zero data retention", description: "Complete deletion after translation", icon: Shield },
          { title: "24/7 support", description: "Professional support team", icon: Users },
          { title: "99.9% SLA", description: "Service quality commitment", icon: Award },
          { title: "API integration", description: "Easy system integration", icon: Zap },
          { title: "Free training", description: "Detailed usage guidance", icon: Users }
        ]
      }
    }
  }

  const currentContent = content[language]

  return (
    <section className="py-24" style={{ backgroundColor: 'rgba(251, 250, 249, 1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
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


        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-gray-100 rounded-3xl p-12 mb-20"
        >
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {currentContent.performance.title}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {currentContent.performance.metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <metric.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {metric.value}
                </div>
                <div className="text-gray-600 font-medium">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Security Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {currentContent.certifications.title}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {currentContent.certifications.items.map((cert, index) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <cert.icon className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{cert.name}</h4>
                <p className="text-gray-600">{cert.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Why Choose Us */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {currentContent.features.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentContent.features.items.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:bg-white hover:border-gray-300 transition-all duration-300"
              >
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-white border border-gray-300 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h4>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-full">
            <Shield className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">
              {language === 'vi' ? 'Được bảo vệ bởi mã hóa cấp ngân hàng' : 'Protected by bank-grade encryption'}
            </span>
            <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
          </div>
        </motion.div>

      </div>
    </section>
  )
}