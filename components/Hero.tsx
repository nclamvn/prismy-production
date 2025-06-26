'use client'

import { motion } from 'framer-motion'
import { useUnifiedAuthContext } from '@/contexts/UnifiedAuthProvider'
import { motionSafe, notebookLMButton, notebookLMStagger } from '@/lib/motion'
import { Button } from './ui/Button'

interface HeroProps {
  language?: 'vi' | 'en'
}

export default function Hero({ language = 'en' }: HeroProps) {
  const { handleGetStarted } = useUnifiedAuthContext()
  const content = {
    vi: {
      title: 'AI Agent cho',
      subtitle: 'tài liệu',
      description:
        'Trí tuệ nhân tạo tiên tiến, xử lý tài liệu thông minh với độ chính xác tuyệt đối.',
      action: 'Bắt đầu',
    },
    en: {
      title: 'AI Agent for',
      subtitle: 'documents',
      description:
        'Advanced AI that processes documents intelligently with absolute precision.',
      action: 'Begin',
    },
  }

  // NotebookLM hero animation variants
  const heroStagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  const heroItem = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.2, 0, 0, 1]
      }
    }
  }

  return (
    <section 
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-panel)',
        backgroundImage: `
          radial-gradient(circle at 25% 25%, var(--notebooklm-primary-light) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, var(--notebooklm-primary-light) 0%, transparent 50%)
        `
      }}
    >
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center">
        <motion.div
          variants={motionSafe(heroStagger)}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* NotebookLM Hero Title */}
          <motion.h1
            variants={motionSafe(heroItem)}
            style={{
              fontSize: 'clamp(3rem, 8vw, 5rem)',
              lineHeight: '1.1',
              fontFamily: 'var(--sys-display-large-font)',
              fontWeight: 'var(--sys-display-large-weight)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em'
            }}
          >
            {content[language].title}
          </motion.h1>

          {/* Subtitle with Premium Gradient Effect */}
          <motion.h2
            variants={motionSafe(heroItem)}
            className="gradient-text"
            style={{
              fontSize: 'clamp(2.25rem, 6vw, 3.75rem)', // 1.5x larger than title
              lineHeight: '1.1',
              fontFamily: 'var(--sys-headline-large-font)',
              fontWeight: 'var(--sys-headline-large-weight)',
              marginTop: '1rem',
              background: 'linear-gradient(135deg, #000000 0%, #333333 50%, #666666 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradientMove 3s ease-in-out infinite',
              filter: 'brightness(1.1) contrast(1.2)'
            }}
          >
            {content[language].subtitle}
          </motion.h2>

          {/* Description with proper spacing */}
          <motion.p
            variants={motionSafe(heroItem)}
            className="max-w-2xl mx-auto"
            style={{
              fontSize: 'var(--sys-body-large-size)',
              lineHeight: 'var(--sys-body-large-line-height)',
              fontFamily: 'var(--sys-body-large-font)',
              fontWeight: 'var(--sys-body-large-weight)',
              color: 'var(--text-secondary)',
              marginTop: '2rem'
            }}
          >
            {content[language].description}
          </motion.p>

          {/* NotebookLM CTA Button */}
          <motion.div 
            variants={motionSafe(heroItem)}
            className="flex justify-center"
            style={{ marginTop: '3rem' }}
          >
            <Button
              variant="filled"
              size="lg"
              onClick={() => {
                handleGetStarted({
                  initialMode: 'signup',
                  redirectTo: '/workspace',
                })
              }}
              className="px-8 py-4"
              style={{
                fontSize: 'var(--sys-label-large-size)',
                fontWeight: '600',
                borderRadius: 'var(--mat-button-filled-container-shape)',
                boxShadow: 'var(--elevation-level-2)'
              }}
            >
              {content[language].action}
            </Button>
          </motion.div>

          {/* AI Ready indicator */}
          <motion.div
            variants={motionSafe(heroItem)}
            className="flex items-center justify-center gap-2"
            style={{ marginTop: '2rem' }}
          >
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--text-secondary)' }}
            />
            <span
              style={{
                fontSize: 'var(--sys-body-small-size)',
                fontFamily: 'var(--sys-body-small-font)',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}
            >
              AI Ready
            </span>
          </motion.div>
        </motion.div>
      </div>
      
      {/* NotebookLM Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main floating orb - top left */}
        <div 
          className="absolute top-20 left-20 w-32 h-32 rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, var(--notebooklm-primary-light) 0%, transparent 70%)',
            filter: 'blur(20px)',
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        
        {/* Secondary orb - top right */}
        <div 
          className="absolute top-32 right-32 w-24 h-24 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0, 0, 0, 0.06) 0%, transparent 70%)',
            filter: 'blur(15px)',
            animation: 'float 8s ease-in-out infinite reverse'
          }}
        />
        
        {/* Bottom floating orb */}
        <div 
          className="absolute bottom-40 left-1/3 w-20 h-20 rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--notebooklm-primary-light) 0%, transparent 70%)',
            filter: 'blur(12px)',
            animation: 'float 10s ease-in-out infinite'
          }}
        />
      </div>
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes gradientMove {
          0%, 100% { 
            background-position: 0% 0%; 
            transform: scale(1);
          }
          25% { 
            background-position: 50% 50%; 
            transform: scale(1.02);
          }
          50% { 
            background-position: 100% 100%; 
            transform: scale(1);
          }
          75% { 
            background-position: 50% 0%; 
            transform: scale(1.01);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          33% {
            transform: translateY(-20px) translateX(10px);
          }
          66% {
            transform: translateY(10px) translateX(-5px);
          }
        }

        .gradient-text {
          text-shadow: 0 0 30px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        .gradient-text::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #000000 0%, #333333 50%, #666666 100%);
          background-size: 200% 200%;
          animation: gradientMove 3s ease-in-out infinite;
          filter: blur(8px);
          opacity: 0.2;
          z-index: -1;
        }
      `}</style>
    </section>
  )
}
