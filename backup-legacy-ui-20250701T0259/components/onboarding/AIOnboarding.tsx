'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, FileText, Zap, Users, Sparkles, ArrowRight, Check, X, Play } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFeatureDiscovery } from '@/contexts/FeatureDiscoveryContext'
import { motionSafe, slideUp, fadeIn } from '@/lib/motion'
// import confetti from 'canvas-confetti' // Commented out - install if needed

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  demo?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

interface AIOnboardingProps {
  language?: 'vi' | 'en'
  onComplete?: () => void
}

export default function AIOnboarding({ language = 'en', onComplete }: AIOnboardingProps) {
  const { user } = useAuth()
  const { completeFeature, updateUserLevel } = useFeatureDiscovery()
  const [currentStep, setCurrentStep] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [agentDemo, setAgentDemo] = useState(false)
  const [featureProgress, setFeatureProgress] = useState(0)

  const content = {
    vi: {
      welcome: 'Chào mừng đến Prismy AI!',
      subtitle: 'Khám phá sức mạnh của AI Agents thế hệ mới',
      getStarted: 'Bắt đầu hành trình',
      skipTour: 'Bỏ qua',
      next: 'Tiếp theo',
      previous: 'Trở lại',
      complete: 'Hoàn thành',
      tryItNow: 'Thử ngay',
      watchDemo: 'Xem demo',
      steps: [
        {
          title: 'AI Agents Tự Động',
          description: 'Tạo các AI agents có thể làm việc độc lập, phân tích tài liệu và tạo báo cáo tự động.'
        },
        {
          title: 'Phân Tích Đa Tài Liệu',
          description: 'Agents có thể phân tích nhiều tài liệu cùng lúc, tìm kiếm mối liên hệ và tạo insights.'
        },
        {
          title: 'Học Liên Tục',
          description: 'Agents học từ mỗi tương tác, cải thiện độ chính xác và hiểu biết theo thời gian.'
        },
        {
          title: 'Cộng Tác Thông Minh',
          description: 'Nhiều agents có thể làm việc cùng nhau, chia sẻ kiến thức và hoàn thành nhiệm vụ phức tạp.'
        }
      ],
      achievements: {
        title: 'Thành tựu đạt được',
        firstAgent: 'Tạo Agent đầu tiên',
        firstAnalysis: 'Phân tích tài liệu đầu tiên',
        aiExplorer: 'Nhà thám hiểm AI'
      }
    },
    en: {
      welcome: 'Welcome to Prismy AI!',
      subtitle: 'Discover the power of next-generation AI Agents',
      getStarted: 'Start Your Journey',
      skipTour: 'Skip Tour',
      next: 'Next',
      previous: 'Previous',
      complete: 'Complete',
      tryItNow: 'Try It Now',
      watchDemo: 'Watch Demo',
      steps: [
        {
          title: 'Autonomous AI Agents',
          description: 'Create AI agents that work independently, analyze documents, and generate reports automatically.'
        },
        {
          title: 'Multi-Document Analysis',
          description: 'Agents can analyze multiple documents simultaneously, finding connections and generating insights.'
        },
        {
          title: 'Continuous Learning',
          description: 'Agents learn from every interaction, improving accuracy and understanding over time.'
        },
        {
          title: 'Smart Collaboration',
          description: 'Multiple agents can work together, sharing knowledge and completing complex tasks.'
        }
      ],
      achievements: {
        title: 'Achievements Unlocked',
        firstAgent: 'Created First Agent',
        firstAnalysis: 'First Document Analysis',
        aiExplorer: 'AI Explorer'
      }
    }
  }

  const steps: OnboardingStep[] = content[language].steps.map((step, index) => ({
    id: `step-${index}`,
    title: step.title,
    description: step.description,
    icon: index === 0 ? <Brain /> : index === 1 ? <FileText /> : index === 2 ? <Zap /> : <Users />,
    demo: index === 0 ? <AgentDemo /> : undefined,
    action: index === 0 ? {
      label: content[language].tryItNow,
      onClick: () => window.location.href = '/dashboard/agents'
    } : undefined
  }))

  useEffect(() => {
    // Check if user is new or hasn't completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('prismy-ai-onboarding-completed')
    if (!hasCompletedOnboarding && user) {
      setTimeout(() => setShowOnboarding(true), 1000)
    }
  }, [user])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setFeatureProgress((currentStep + 1) / steps.length * 100)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setFeatureProgress(currentStep / steps.length * 100)
    }
  }

  const handleComplete = () => {
    // Mark onboarding as completed
    localStorage.setItem('prismy-ai-onboarding-completed', 'true')
    completeFeature('ai-onboarding')
    updateUserLevel('intermediate')
    
    // Celebration animation (install canvas-confetti to enable)
    // confetti({
    //   particleCount: 100,
    //   spread: 70,
    //   origin: { y: 0.6 }
    // })
    
    setTimeout(() => {
      setShowOnboarding(false)
      onComplete?.()
    }, 2000)
  }

  const handleSkip = () => {
    localStorage.setItem('prismy-ai-onboarding-completed', 'true')
    setShowOnboarding(false)
  }

  return (
    <AnimatePresence>
      {showOnboarding && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        >
          <motion.div
            variants={motionSafe(slideUp)}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <Sparkles className="w-16 h-16 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2">{content[language].welcome}</h1>
                <p className="text-purple-100">{content[language].subtitle}</p>
              </motion.div>
              
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="w-full bg-purple-700 rounded-full h-2">
                  <motion.div
                    className="bg-white h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${featureProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  variants={motionSafe(fadeIn)}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-6"
                >
                  {/* Step Icon */}
                  <div className="flex justify-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white">
                        {React.cloneElement(steps[currentStep].icon as React.ReactElement, { className: 'w-8 h-8' })}
                      </div>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {steps[currentStep].title}
                    </h2>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {steps[currentStep].description}
                    </p>
                  </div>

                  {/* Demo Area */}
                  {steps[currentStep].demo && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mt-8"
                    >
                      {steps[currentStep].demo}
                    </motion.div>
                  )}

                  {/* Action Button */}
                  {steps[currentStep].action && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={steps[currentStep].action.onClick}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 font-medium flex items-center space-x-2"
                      >
                        <span>{steps[currentStep].action.label}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-8 py-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {content[language].skipTour}
                </button>
                
                <div className="flex items-center space-x-2">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentStep
                          ? 'w-8 bg-purple-600'
                          : index < currentStep
                            ? 'bg-purple-300'
                            : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex space-x-3">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrevious}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {content[language].previous}
                    </button>
                  )}
                  
                  {currentStep < steps.length - 1 ? (
                    <button
                      onClick={handleNext}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      {content[language].next}
                    </button>
                  ) : (
                    <button
                      onClick={handleComplete}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-medium flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>{content[language].complete}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Agent Demo Component
function AgentDemo() {
  const [isActive, setIsActive] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsActive(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
      <div className="flex items-center justify-center space-x-8">
        {/* Document */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative"
        >
          <div className="w-20 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
        </motion.div>

        {/* Connection Lines */}
        {isActive && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-0.5 bg-gradient-to-r from-purple-400 to-indigo-400 origin-left"
          />
        )}

        {/* AI Agent */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: isActive ? [1, 1.1, 1] : 1 }}
          transition={{ 
            scale: { delay: 0.5, duration: 0.5 },
            repeat: isActive ? Infinity : 0,
            repeatDelay: 2
          }}
          className="relative"
        >
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
            <Brain className="w-12 h-12 text-white" />
          </div>
          {isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2"
            >
              <div className="w-4 h-4 bg-green-500 rounded-full" />
            </motion.div>
          )}
        </motion.div>

        {/* Output */}
        {isActive && (
          <>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="w-16 h-0.5 bg-gradient-to-r from-purple-400 to-indigo-400 origin-left"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.5, type: "spring" }}
              className="relative"
            >
              <div className="w-20 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center">
                <Zap className="w-10 h-10 text-yellow-500" />
              </div>
            </motion.div>
          </>
        )}
      </div>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ delay: 2 }}
        className="text-center text-sm text-purple-700 mt-4 font-medium"
      >
        AI Agent analyzing document...
      </motion.p>
    </div>
  )
}