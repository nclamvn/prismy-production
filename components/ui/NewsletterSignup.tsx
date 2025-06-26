'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { motionSafe, slideUp, notebookLMButton } from '@/lib/motion'
import { Button } from './Button'

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
    const baseInputStyle = {
      backgroundColor: 'var(--surface-elevated)',
      border: '1px solid var(--surface-outline)',
      borderRadius: 'var(--mat-button-outlined-container-shape)',
      color: 'var(--text-primary)',
      fontSize: 'var(--sys-body-large-size)',
      lineHeight: 'var(--sys-body-large-line-height)',
      fontFamily: 'var(--sys-body-large-font)',
      padding: '0 16px',
      height: '48px',
      outline: 'none',
      transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)'
    }
    
    switch (variant) {
      case 'footer':
        return {
          container: 'w-full',
          titleStyle: {
            fontSize: 'var(--sys-headline-medium-size)',
            lineHeight: 'var(--sys-headline-medium-line-height)',
            fontFamily: 'var(--sys-headline-medium-font)',
            fontWeight: 'var(--sys-headline-medium-weight)',
            color: 'var(--text-primary)',
            marginBottom: '12px'
          },
          descriptionStyle: {
            fontSize: 'var(--sys-body-medium-size)',
            lineHeight: 'var(--sys-body-medium-line-height)',
            fontFamily: 'var(--sys-body-medium-font)',
            color: 'var(--text-secondary)',
            marginBottom: '20px'
          },
          form: 'flex flex-col sm:flex-row gap-3',
          inputStyle: baseInputStyle
        }
      case 'inline':
        return {
          container: 'w-full',
          titleStyle: {
            fontSize: 'var(--sys-title-large-size)',
            lineHeight: 'var(--sys-title-large-line-height)',
            fontFamily: 'var(--sys-title-large-font)',
            fontWeight: 'var(--sys-title-large-weight)',
            color: 'var(--text-primary)',
            marginBottom: '8px'
          },
          descriptionStyle: {
            fontSize: 'var(--sys-body-medium-size)',
            lineHeight: 'var(--sys-body-medium-line-height)',
            fontFamily: 'var(--sys-body-medium-font)',
            color: 'var(--text-secondary)',
            marginBottom: '16px'
          },
          form: 'flex flex-col sm:flex-row gap-3',
          inputStyle: baseInputStyle
        }
      default:
        return {
          container: 'max-w-lg mx-auto text-center',
          titleStyle: {
            fontSize: 'var(--sys-headline-large-size)',
            lineHeight: 'var(--sys-headline-large-line-height)',
            fontFamily: 'var(--sys-headline-large-font)',
            fontWeight: 'var(--sys-headline-large-weight)',
            color: 'var(--text-primary)',
            marginBottom: '16px'
          },
          descriptionStyle: {
            fontSize: 'var(--sys-body-large-size)',
            lineHeight: 'var(--sys-body-large-line-height)',
            fontFamily: 'var(--sys-body-large-font)',
            color: 'var(--text-secondary)',
            marginBottom: '24px'
          },
          form: 'flex flex-col sm:flex-row gap-4',
          inputStyle: baseInputStyle
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
        <div 
          className="text-center p-6"
          style={{
            backgroundColor: 'var(--success-background)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--mat-card-elevated-container-shape)'
          }}
        >
          <div 
            className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--success-color)' }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 
            className="mb-2"
            style={{
              fontSize: 'var(--sys-title-large-size)',
              lineHeight: 'var(--sys-title-large-line-height)',
              fontFamily: 'var(--sys-title-large-font)',
              fontWeight: 'var(--sys-title-large-weight)',
              color: 'var(--success-color)'
            }}
          >
            {content[language].success}
          </h3>
          <p 
            style={{
              fontSize: 'var(--sys-body-medium-size)',
              lineHeight: 'var(--sys-body-medium-line-height)',
              fontFamily: 'var(--sys-body-medium-font)',
              color: 'var(--success-color)'
            }}
          >
            {content[language].description}
          </p>
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
          <h3 style={styles.titleStyle}>{content[language].title}</h3>
          <p style={styles.descriptionStyle}>{content[language].description}</p>
        </>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={content[language].placeholder}
          style={{
            ...styles.inputStyle,
            '::placeholder': {
              color: 'var(--text-disabled)'
            }
          }}
          className="focus-indicator flex-1"
          required
          disabled={isSubmitting}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--notebooklm-primary)'
            e.target.style.backgroundColor = 'var(--surface-panel)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--surface-outline)'
            e.target.style.backgroundColor = 'var(--surface-elevated)'
          }}
        />
        <Button
          type="submit"
          variant="filled"
          disabled={isSubmitting || !email}
          loading={isSubmitting}
          loadingText={content[language].subscribing}
          className="whitespace-nowrap"
        >
          {content[language].subscribe}
        </Button>
      </form>
    </motion.div>
  )
}