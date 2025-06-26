'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Gift, ArrowLeft, CreditCard, Users, Zap } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import InviteRedemptionModal from '@/components/auth/InviteRedemptionModal'

interface InviteRedemptionPageProps {
  userEmail?: string
}

export default function InviteRedemptionPage({ userEmail }: InviteRedemptionPageProps) {
  const { language } = useLanguage()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [hasRedeemed, setHasRedeemed] = useState(false)

  const content = {
    vi: {
      title: 'Chào mừng đến với Prismy',
      subtitle: 'Sử dụng mã mời để bắt đầu trải nghiệm dịch thuật AI tiên tiến',
      description: 'Prismy đang ở giai đoạn private beta. Để truy cập, bạn cần mã mời từ đội ngũ phát triển.',
      redeemButton: 'Đổi Mã Mời',
      backToHome: 'Về Trang Chủ',
      features: {
        title: 'Những gì bạn sẽ nhận được',
        translation: {
          title: 'Dịch Thuật AI',
          description: 'Dịch văn bản, tài liệu với độ chính xác cao'
        },
        credits: {
          title: 'Credits Miễn Phí',
          description: 'Nhận credits để trải nghiệm tất cả tính năng'
        },
        priority: {
          title: 'Hỗ Trợ Ưu Tiên',
          description: 'Hỗ trợ trực tiếp từ đội ngũ phát triển'
        }
      },
      alreadyHave: 'Đã có tài khoản?',
      loginLink: 'Đăng nhập',
      needInvite: 'Cần mã mời?',
      contactUs: 'Liên hệ chúng tôi'
    },
    en: {
      title: 'Welcome to Prismy',
      subtitle: 'Use your invite code to start experiencing advanced AI translation',
      description: 'Prismy is currently in private beta. To access the platform, you need an invite code from our development team.',
      redeemButton: 'Redeem Invite Code',
      backToHome: 'Back to Home',
      features: {
        title: 'What you\'ll get',
        translation: {
          title: 'AI Translation',
          description: 'Translate text and documents with high accuracy'
        },
        credits: {
          title: 'Free Credits',
          description: 'Get credits to experience all features'
        },
        priority: {
          title: 'Priority Support',
          description: 'Direct support from our development team'
        }
      },
      alreadyHave: 'Already have an account?',
      loginLink: 'Sign in',
      needInvite: 'Need an invite?',
      contactUs: 'Contact us'
    }
  }

  const t = content[language]

  // Auto-open modal on page load
  useEffect(() => {
    setShowModal(true)
  }, [])

  const handleRedemptionSuccess = (result: { credits: number; total: number }) => {
    setHasRedeemed(true)
    setShowModal(false)
    
    // Redirect to workspace after a short delay
    setTimeout(() => {
      router.push('/workspace?welcome=true')
    }, 2000)
  }

  const handleModalClose = () => {
    if (!hasRedeemed) {
      setShowModal(false)
      // Optionally redirect to home page
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="/icons/logo.svg" 
                alt="Prismy" 
                className="h-8 w-auto mr-3"
                style={{
                  borderRadius: 'var(--shape-corner-small)',
                  boxShadow: 'var(--elevation-level-1)',
                  overflow: 'hidden'
                }}
              />
              <span className="text-xl font-bold text-gray-900">Prismy</span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.backToHome}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.title}</h1>
            <p className="text-xl text-gray-600 mb-6">{t.subtitle}</p>
            <p className="text-gray-500 max-w-2xl mx-auto">{t.description}</p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <Gift className="w-5 h-5 mr-3" />
              {t.redeemButton}
            </button>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{t.features.title}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.features.translation.title}</h3>
              <p className="text-gray-600">{t.features.translation.description}</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.features.credits.title}</h3>
              <p className="text-gray-600">{t.features.credits.description}</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.features.priority.title}</h3>
              <p className="text-gray-600">{t.features.priority.description}</p>
            </div>
          </div>
        </motion.div>

        {/* User Info */}
        {userEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center text-gray-600"
          >
            <p>Signed in as: <span className="font-medium">{userEmail}</span></p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center space-x-6 text-sm text-gray-500">
            <span>{t.needInvite}</span>
            <a 
              href="mailto:hello@prismy.com" 
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              {t.contactUs}
            </a>
          </div>
        </div>
      </footer>

      {/* Success Message */}
      {hasRedeemed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {language === 'vi' ? 'Chào mừng đến với Prismy!' : 'Welcome to Prismy!'}
            </h3>
            <p className="text-gray-600 mb-4">
              {language === 'vi' 
                ? 'Đang chuyển đến workspace...' 
                : 'Redirecting to workspace...'
              }
            </p>
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </motion.div>
      )}

      {/* Invite Redemption Modal */}
      <InviteRedemptionModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleRedemptionSuccess}
        userEmail={userEmail}
      />
    </div>
  )
}