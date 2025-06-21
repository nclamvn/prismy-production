'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { motionSafe, slideUp } from '@/lib/motion'

interface NewsletterSignupProps {
  language: 'vi' | 'en'
  variant?: 'default' | 'footer' | 'inline'
  className?: string
}

export default function NewsletterSignup({ 
  language, 
  variant = 'default', 
  className = '' 
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const content = {
    vi: {
      title: 'Cập nhật mới nhất',
      description: 'Nhận thông tin cập nhật mới nhất về các tính năng và cải tiến.',
      placeholder: 'Nhập email của bạn',
      subscribe: 'Đăng ký',
      subscribing: 'Đang gửi...',
      success: 'Đăng ký thành công!',
      error: 'Có lỗi xảy ra. Vui lòng thử lại.'
    },
    en: {
      title: 'Stay Updated',
      description: 'Get the latest updates on new features and improvements.',
      placeholder: 'Enter your email',
      subscribe: 'Subscribe',
      subscribing: 'Subscribing...',
      success: 'Successfully subscribed!',
      error: 'Something went wrong. Please try again.'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      // Simulate API call - replace with actual newsletter subscription logic
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSubmitted(true)
      setEmail('')
    } catch (error) {
      console.error('Newsletter subscription failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'footer':
        return {
          container: 'max-w-md',
          title: 'heading-4 text-white font-semibold mb-4',
          description: 'body-sm text-gray-500 mb-4',
          form: 'email-pill-form',
          input: 'email-pill-input',
          button: 'email-pill-button'
        }
      case 'inline':
        return {
          container: 'w-full',
          title: 'heading-4 text-gray-900 mb-2',
          description: 'body-sm text-gray-600 mb-4',
          form: 'flex flex-col sm:flex-row gap-3',
          input: 'flex-1 h-12 px-4 bg-white border border-gray-300 rounded-lg text-base text-gray-900 placeholder:text-gray-500 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all',
          button: 'h-12 bg-gray-900 text-white hover:bg-gray-800 px-6 rounded-lg font-semibold text-base transition-colors whitespace-nowrap'
        }
      default:
        return {
          container: 'max-w-lg mx-auto text-center',
          title: 'heading-3 text-gray-900 mb-4',
          description: 'body-base text-gray-600 mb-6',
          form: 'flex flex-col sm:flex-row gap-4',
          input: 'flex-1 h-12 px-4 bg-white border border-gray-300 rounded-lg text-base text-gray-900 placeholder:text-gray-500 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all',
          button: 'h-12 bg-gray-900 text-white hover:bg-gray-800 px-8 rounded-lg font-semibold text-base transition-colors'
        }
    }
  }

  const styles = getVariantStyles()

  if (isSubmitted) {
    return (
      <motion.div
        variants={motionSafe(slideUp)}
        className={`${styles.container} ${className}`}
      >
        <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
          <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="heading-4 text-green-900 mb-2">{content[language].success}</h3>
          <p className="body-sm text-green-700">{content[language].description}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={motionSafe(slideUp)}
      className={`${styles.container} ${className}`}
    >
      {variant !== 'inline' && (
        <>
          <h3 className={styles.title}>{content[language].title}</h3>
          <p className={styles.description}>{content[language].description}</p>
        </>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={content[language].placeholder}
          className={styles.input}
          required
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !email}
          className={`${styles.button} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? content[language].subscribing : (
            <>
              {content[language].subscribe}
              <span className="ml-1.5">→</span>
            </>
          )}
        </button>
      </form>
    </motion.div>
  )
}