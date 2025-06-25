'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Target, Sparkles, Lock, CheckCircle, Brain, FileText, Users, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useProgressiveFeatures } from '@/contexts/FeatureDiscoveryContext'
import { motionSafe, slideUp, fadeIn, scaleIn } from '@/lib/motion'

interface UserMilestone {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  requiredActions: string[]
  reward?: string
  unlocks?: string[]
  progress: number
}

interface SmartUserJourneyProps {
  language?: 'vi' | 'en'
  onMilestoneComplete?: (milestone: UserMilestone) => void
}

export default function SmartUserJourney({ language = 'en', onMilestoneComplete }: SmartUserJourneyProps) {
  const { user } = useAuth()
  const { userLevel, completedFeaturesCount, isFeatureUnlocked } = useProgressiveFeatures()
  const [activeMilestone, setActiveMilestone] = useState<string | null>(null)
  const [showReward, setShowReward] = useState(false)
  const [userStats, setUserStats] = useState({
    documentsProcessed: 0,
    agentsCreated: 0,
    collaborations: 0,
    insightsGenerated: 0
  })

  const content = {
    vi: {
      title: 'Hành trình AI của bạn',
      subtitle: 'Mở khóa tính năng mới và nâng cao kỹ năng AI',
      currentLevel: 'Cấp độ hiện tại',
      nextReward: 'Phần thưởng tiếp theo',
      progress: 'Tiến độ',
      completed: 'Hoàn thành',
      locked: 'Chưa mở khóa',
      startJourney: 'Bắt đầu hành trình',
      viewDetails: 'Xem chi tiết',
      claim: 'Nhận thưởng',
      milestones: {
        firstSteps: {
          title: 'Bước đầu tiên',
          description: 'Làm quen với Prismy AI',
          actions: ['Hoàn thành hướng dẫn', 'Tải lên tài liệu đầu tiên'],
          reward: '5 AI credits'
        },
        agentMaster: {
          title: 'Thầy AI Agent',
          description: 'Tạo và quản lý AI agents',
          actions: ['Tạo 3 AI agents', 'Hoàn thành 10 phân tích'],
          reward: 'Mở khóa Advanced Agents'
        },
        collaborator: {
          title: 'Nhà cộng tác',
          description: 'Làm việc với nhiều agents',
          actions: ['Tạo agent swarm', 'Chia sẻ kiến thức giữa agents'],
          reward: 'Enterprise features trial'
        },
        innovator: {
          title: 'Nhà sáng tạo',
          description: 'Đạt đến trình độ cao nhất',
          actions: ['Sử dụng voice control', 'Tạo learning network'],
          reward: 'Pro badge & priority support'
        }
      },
      stats: {
        documents: 'Tài liệu đã xử lý',
        agents: 'AI Agents đã tạo',
        collaborations: 'Lần cộng tác',
        insights: 'Insights đã tạo'
      },
      levels: {
        beginner: 'Người mới bắt đầu',
        intermediate: 'Trung cấp',
        advanced: 'Nâng cao',
        expert: 'Chuyên gia'
      }
    },
    en: {
      title: 'Your AI Journey',
      subtitle: 'Unlock new features and level up your AI skills',
      currentLevel: 'Current Level',
      nextReward: 'Next Reward',
      progress: 'Progress',
      completed: 'Completed',
      locked: 'Locked',
      startJourney: 'Start Journey',
      viewDetails: 'View Details',
      claim: 'Claim Reward',
      milestones: {
        firstSteps: {
          title: 'First Steps',
          description: 'Get familiar with Prismy AI',
          actions: ['Complete onboarding', 'Upload first document'],
          reward: '5 AI credits'
        },
        agentMaster: {
          title: 'Agent Master',
          description: 'Create and manage AI agents',
          actions: ['Create 3 AI agents', 'Complete 10 analyses'],
          reward: 'Unlock Advanced Agents'
        },
        collaborator: {
          title: 'Collaborator',
          description: 'Work with multiple agents',
          actions: ['Create agent swarm', 'Share knowledge between agents'],
          reward: 'Enterprise features trial'
        },
        innovator: {
          title: 'Innovator',
          description: 'Reach the highest level',
          actions: ['Use voice control', 'Create learning network'],
          reward: 'Pro badge & priority support'
        }
      },
      stats: {
        documents: 'Documents Processed',
        agents: 'AI Agents Created',
        collaborations: 'Collaborations',
        insights: 'Insights Generated'
      },
      levels: {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
        expert: 'Expert'
      }
    }
  }

  const milestones: UserMilestone[] = [
    {
      id: 'first-steps',
      title: content[language].milestones.firstSteps.title,
      description: content[language].milestones.firstSteps.description,
      icon: <Target className="w-6 h-6" />,
      requiredActions: content[language].milestones.firstSteps.actions,
      reward: content[language].milestones.firstSteps.reward,
      unlocks: ['agents'],
      progress: completedFeaturesCount >= 1 ? 100 : (completedFeaturesCount / 1) * 100
    },
    {
      id: 'agent-master',
      title: content[language].milestones.agentMaster.title,
      description: content[language].milestones.agentMaster.description,
      icon: <Brain className="w-6 h-6" />,
      requiredActions: content[language].milestones.agentMaster.actions,
      reward: content[language].milestones.agentMaster.reward,
      unlocks: ['insights', 'swarm'],
      progress: userStats.agentsCreated >= 3 ? 100 : (userStats.agentsCreated / 3) * 100
    },
    {
      id: 'collaborator',
      title: content[language].milestones.collaborator.title,
      description: content[language].milestones.collaborator.description,
      icon: <Users className="w-6 h-6" />,
      requiredActions: content[language].milestones.collaborator.actions,
      reward: content[language].milestones.collaborator.reward,
      unlocks: ['enterprise'],
      progress: userStats.collaborations >= 5 ? 100 : (userStats.collaborations / 5) * 100
    },
    {
      id: 'innovator',
      title: content[language].milestones.innovator.title,
      description: content[language].milestones.innovator.description,
      icon: <Zap className="w-6 h-6" />,
      requiredActions: content[language].milestones.innovator.actions,
      reward: content[language].milestones.innovator.reward,
      unlocks: ['all-features'],
      progress: userLevel === 'advanced' ? 100 : 0
    }
  ]

  // Simulate user stats (in real app, fetch from API)
  useEffect(() => {
    const fetchUserStats = async () => {
      // Mock data - replace with actual API call
      setUserStats({
        documentsProcessed: completedFeaturesCount * 2,
        agentsCreated: Math.floor(completedFeaturesCount * 0.8),
        collaborations: Math.floor(completedFeaturesCount * 0.5),
        insightsGenerated: completedFeaturesCount * 3
      })
    }
    
    if (user) {
      fetchUserStats()
    }
  }, [user, completedFeaturesCount])

  const handleMilestoneClick = (milestone: UserMilestone) => {
    setActiveMilestone(milestone.id)
    if (milestone.progress === 100) {
      setShowReward(true)
      onMilestoneComplete?.(milestone)
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'intermediate': return 'from-blue-500 to-indigo-500'
      case 'advanced': return 'from-purple-500 to-pink-500'
      case 'expert': return 'from-yellow-500 to-orange-500'
      default: return 'from-green-500 to-emerald-500'
    }
  }

  const getNextLevel = () => {
    switch (userLevel) {
      case 'beginner': return 'intermediate'
      case 'intermediate': return 'advanced'
      case 'advanced': return 'expert'
      default: return 'expert'
    }
  }

  return (
    <motion.div
      variants={motionSafe(staggerContainer)}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={motionSafe(slideUp)} className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {content[language].title}
        </h2>
        <p className="text-gray-600">{content[language].subtitle}</p>
      </motion.div>

      {/* User Level & Stats */}
      <motion.div
        variants={motionSafe(slideUp)}
        className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-purple-700 mb-1">{content[language].currentLevel}</p>
            <div className="flex items-center space-x-3">
              <div className={`px-4 py-2 bg-gradient-to-r ${getLevelColor(userLevel)} text-white rounded-lg font-semibold`}>
                {content[language].levels[userLevel as keyof typeof content.en.levels]}
              </div>
              <ArrowRight className="w-5 h-5 text-purple-600" />
              <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-medium">
                {content[language].levels[getNextLevel() as keyof typeof content.en.levels]}
              </div>
            </div>
          </div>
          <Trophy className="w-10 h-10 text-purple-600" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: content[language].stats.documents, value: userStats.documentsProcessed, icon: <FileText /> },
            { label: content[language].stats.agents, value: userStats.agentsCreated, icon: <Brain /> },
            { label: content[language].stats.collaborations, value: userStats.collaborations, icon: <Users /> },
            { label: content[language].stats.insights, value: userStats.insightsGenerated, icon: <Zap /> }
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={motionSafe(scaleIn)}
              className="text-center"
            >
              <div className="text-2xl font-bold text-purple-900">{stat.value}</div>
              <div className="text-xs text-purple-700 flex items-center justify-center space-x-1">
                {React.cloneElement(stat.icon as React.ReactElement, { className: 'w-3 h-3' })}
                <span>{stat.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Milestones */}
      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const isLocked = index > 0 && milestones[index - 1].progress < 100
          const isCompleted = milestone.progress === 100
          
          return (
            <motion.div
              key={milestone.id}
              variants={motionSafe(slideUp)}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                isLocked
                  ? 'border-gray-200 bg-gray-50 opacity-60'
                  : isCompleted
                    ? 'border-green-400 bg-green-50'
                    : 'border-purple-300 bg-purple-50 hover:border-purple-400'
              }`}
              onClick={() => !isLocked && handleMilestoneClick(milestone)}
            >
              <div className="flex items-center space-x-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  isLocked
                    ? 'bg-gray-200'
                    : isCompleted
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                } text-white`}>
                  {isLocked ? (
                    <Lock className="w-5 h-5" />
                  ) : isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    milestone.icon
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${
                      isLocked ? 'text-gray-500' : 'text-gray-900'
                    }`}>
                      {milestone.title}
                    </h3>
                    {milestone.reward && !isLocked && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        {milestone.reward}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${
                    isLocked ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {milestone.description}
                  </p>
                  
                  {/* Progress Bar */}
                  {!isLocked && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">{content[language].progress}</span>
                        <span className="text-xs font-medium text-purple-600">
                          {Math.round(milestone.progress)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${milestone.progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0"
                  >
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                  </motion.div>
                )}
              </div>

              {/* Expanded Actions */}
              <AnimatePresence>
                {activeMilestone === milestone.id && !isLocked && (
                  <motion.div
                    variants={motionSafe(fadeIn)}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="mt-4 pt-4 border-t border-purple-200"
                  >
                    <p className="text-sm font-medium text-gray-700 mb-2">Required Actions:</p>
                    <ul className="space-y-1">
                      {milestone.requiredActions.map((action, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                          }`}>
                            {isCompleted && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {isCompleted && (
                      <button
                        onClick={() => setShowReward(true)}
                        className="mt-4 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-medium flex items-center space-x-2 mx-auto"
                      >
                        <Trophy className="w-4 h-4" />
                        <span>{content[language].claim}</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Reward Modal */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowReward(false)}
          >
            <motion.div
              variants={motionSafe(scaleIn)}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h3>
              <p className="text-gray-600 mb-6">You've earned a new reward!</p>
              <button
                onClick={() => setShowReward(false)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium"
              >
                Continue Journey
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Missing import
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}