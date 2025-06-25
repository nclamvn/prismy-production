'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import EnterpriseFeatures from '@/components/workspace/dashboard/EnterpriseFeatures'
import AIInterfaceRefinement from '@/components/agents/AIInterfaceRefinement'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'
import { Network, Crown, Zap, Users, Mic, GraduationCap } from 'lucide-react'

function EnterprisePage() {
  const [language, setLanguage] = useState<'vi' | 'en'>('en')

  const content = {
    vi: {
      title: 'Enterprise AI',
      subtitle: 'Mạng lưới học tập và điều khiển giọng nói cho doanh nghiệp',
      features: [
        {
          icon: Network,
          title: 'Mạng lưới học tập',
          description: 'AI agents chia sẻ kiến thức và học từ nhau'
        },
        {
          icon: Mic,
          title: 'Điều khiển giọng nói',
          description: 'Điều khiển agents bằng tiếng Việt và tiếng Anh'
        },
        {
          icon: GraduationCap,
          title: 'Học tập nhóm',
          description: 'Collaborative learning và swarm intelligence'
        }
      ]
    },
    en: {
      title: 'Enterprise AI',
      subtitle: 'Learning networks and voice control for enterprise',
      features: [
        {
          icon: Network,
          title: 'Learning Networks',
          description: 'AI agents share knowledge and learn from each other'
        },
        {
          icon: Mic,
          title: 'Voice Control',
          description: 'Control agents with Vietnamese and English commands'
        },
        {
          icon: GraduationCap,
          title: 'Swarm Learning',
          description: 'Collaborative learning and swarm intelligence'
        }
      ]
    }
  }

  return (
    <DashboardLayout language={language}>
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div className="flex items-center justify-between" variants={motionSafe(slideUp)}>
          <div>
            <h1 className="heading-2 text-gray-900 flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                <Crown className="w-8 h-8 text-purple-600" />
              </div>
              <span>{content[language].title}</span>
              <span className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                PRO
              </span>
            </h1>
            <p className="body-lg text-gray-600 mt-2">
              {content[language].subtitle}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {language === 'vi' ? 'EN' : 'VI'}
            </button>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          variants={motionSafe(slideUp)}
        >
          {content[language].features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              variants={motionSafe(slideUp)}
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                  <feature.icon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* AI Interface Refinement */}
        <motion.div variants={motionSafe(slideUp)}>
          <AIInterfaceRefinement language={language} />
        </motion.div>

        {/* Enterprise Features Component */}
        <motion.div variants={motionSafe(slideUp)}>
          <EnterpriseFeatures 
            onLearningSessionStart={(session) => {
              console.log('Learning session started:', session)
            }}
            onVoiceCommand={(command) => {
              console.log('Voice command executed:', command)
            }}
          />
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default function EnterpriseDashboard() {
  return <EnterprisePage />
}