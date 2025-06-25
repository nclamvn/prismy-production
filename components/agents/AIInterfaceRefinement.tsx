'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Mic, Users, Zap, Settings, Eye, ToggleLeft, ToggleRight } from 'lucide-react'
import { motionSafe, slideUp, fadeIn, staggerContainer } from '@/lib/motion'
import AgentSwarmInterface from './AgentSwarmInterface'
import VoiceControlInterface from './VoiceControlInterface'

interface AIInterfaceRefinementProps {
  language?: 'vi' | 'en'
}

type InterfaceMode = 'swarm' | 'voice' | 'hybrid'

export default function AIInterfaceRefinement({ language = 'en' }: AIInterfaceRefinementProps) {
  const [mode, setMode] = useState<InterfaceMode>('swarm')
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [performance, setPerformance] = useState({
    responseTime: 245,
    accuracy: 94,
    uptime: 99.8
  })

  const content = {
    vi: {
      title: 'Giao Diện AI Tiên Tiến',
      subtitle: 'Cài đặt và tối ưu hóa AI interface',
      modes: {
        swarm: 'Agent Swarm',
        voice: 'Điều khiển giọng nói',
        hybrid: 'Kết hợp'
      },
      settings: {
        title: 'Cài đặt',
        voiceControl: 'Kích hoạt điều khiển giọng nói',
        advancedMode: 'Chế độ nâng cao',
        performance: 'Hiệu năng hệ thống'
      },
      metrics: {
        responseTime: 'Thời gian phản hồi',
        accuracy: 'Độ chính xác',
        uptime: 'Thời gian hoạt động',
        milliseconds: 'ms'
      },
      features: {
        realTimeSync: 'Đồng bộ thời gian thực',
        multiModal: 'Đa phương thức tương tác',
        adaptiveUI: 'Giao diện thích ứng',
        performanceOptimized: 'Tối ưu hóa hiệu năng'
      }
    },
    en: {
      title: 'Advanced AI Interface',
      subtitle: 'Configure and optimize AI interface settings',
      modes: {
        swarm: 'Agent Swarm',
        voice: 'Voice Control',
        hybrid: 'Hybrid Mode'
      },
      settings: {
        title: 'Settings',
        voiceControl: 'Enable voice control',
        advancedMode: 'Advanced mode',
        performance: 'System performance'
      },
      metrics: {
        responseTime: 'Response Time',
        accuracy: 'Accuracy',
        uptime: 'Uptime',
        milliseconds: 'ms'
      },
      features: {
        realTimeSync: 'Real-time synchronization',
        multiModal: 'Multi-modal interaction',
        adaptiveUI: 'Adaptive interface',
        performanceOptimized: 'Performance optimized'
      }
    }
  }

  const handleModeSwitch = (newMode: InterfaceMode) => {
    setMode(newMode)
    if (newMode === 'voice' || newMode === 'hybrid') {
      setIsVoiceEnabled(true)
    }
  }

  const getModeIcon = (mode: InterfaceMode) => {
    switch (mode) {
      case 'swarm':
        return <Users className="w-5 h-5" />
      case 'voice':
        return <Mic className="w-5 h-5" />
      case 'hybrid':
        return <Zap className="w-5 h-5" />
      default:
        return <Brain className="w-5 h-5" />
    }
  }

  return (
    <motion.div
      variants={motionSafe(staggerContainer)}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={motionSafe(slideUp)}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {content[language].title}
        </h1>
        <p className="text-gray-600">{content[language].subtitle}</p>
      </motion.div>

      {/* Mode Selector */}
      <motion.div
        variants={motionSafe(slideUp)}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Interface Mode</h2>
          <div className="flex items-center space-x-3">
            {(['swarm', 'voice', 'hybrid'] as InterfaceMode[]).map((modeOption) => (
              <button
                key={modeOption}
                onClick={() => handleModeSwitch(modeOption)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  mode === modeOption
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getModeIcon(modeOption)}
                <span>{content[language].modes[modeOption]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Performance Metrics */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">
              {content[language].settings.performance}
            </h3>
            
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">
                    {content[language].metrics.responseTime}
                  </span>
                  <span className="font-bold text-green-800">
                    {performance.responseTime}{content[language].metrics.milliseconds}
                  </span>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">
                    {content[language].metrics.accuracy}
                  </span>
                  <span className="font-bold text-blue-800">
                    {performance.accuracy}%
                  </span>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">
                    {content[language].metrics.uptime}
                  </span>
                  <span className="font-bold text-purple-800">
                    {performance.uptime}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Controls */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">
              {content[language].settings.title}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {content[language].settings.voiceControl}
                  </p>
                  <p className="text-sm text-gray-600">Enable voice commands</p>
                </div>
                <button
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={`transition-colors ${
                    isVoiceEnabled ? 'text-purple-600' : 'text-gray-400'
                  }`}
                >
                  {isVoiceEnabled ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {content[language].settings.advancedMode}
                  </p>
                  <p className="text-sm text-gray-600">Show advanced options</p>
                </div>
                <button
                  onClick={() => setAdvancedMode(!advancedMode)}
                  className={`transition-colors ${
                    advancedMode ? 'text-purple-600' : 'text-gray-400'
                  }`}
                >
                  {advancedMode ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Features</h3>
            
            <div className="space-y-3">
              {Object.entries(content[language].features).map(([key, feature]) => (
                <div key={key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Interface Content */}
      <AnimatePresence mode="wait">
        {mode === 'swarm' && (
          <motion.div
            key="swarm"
            variants={motionSafe(fadeIn)}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <AgentSwarmInterface language={language} />
          </motion.div>
        )}
        
        {mode === 'voice' && (
          <motion.div
            key="voice"
            variants={motionSafe(fadeIn)}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <VoiceControlInterface language={language} />
          </motion.div>
        )}
        
        {mode === 'hybrid' && (
          <motion.div
            key="hybrid"
            variants={motionSafe(fadeIn)}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-6"
          >
            {/* Hybrid Mode - Both Interfaces */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Swarm</h3>
                <AgentSwarmInterface language={language} />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Voice Control</h3>
                <VoiceControlInterface language={language} />
              </div>
            </div>
            
            {/* Hybrid Integration Panel */}
            <motion.div
              variants={motionSafe(slideUp)}
              className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {language === 'vi' ? 'Chế độ tích hợp' : 'Integrated Mode'}
                </h3>
              </div>
              
              <p className="text-gray-700 mb-4">
                {language === 'vi' 
                  ? 'Kết hợp điều khiển giọng nói với agent swarm để tạo ra trải nghiệm AI tiên tiến nhất.'
                  : 'Combine voice control with agent swarm for the most advanced AI experience.'
                }
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">
                    {language === 'vi' ? 'AI Thông minh' : 'Smart AI'}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg">
                  <Mic className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">
                    {language === 'vi' ? 'Giọng nói' : 'Voice'}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg">
                  <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">
                    {language === 'vi' ? 'Cộng tác' : 'Collaboration'}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg">
                  <Eye className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">
                    {language === 'vi' ? 'Giám sát' : 'Monitoring'}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Advanced Options */}
      <AnimatePresence>
        {advancedMode && (
          <motion.div
            variants={motionSafe(slideUp)}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="w-6 h-6 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {language === 'vi' ? 'Tùy chọn nâng cao' : 'Advanced Options'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  {language === 'vi' ? 'Hiệu năng' : 'Performance'}
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm text-gray-700">
                      {language === 'vi' ? 'Tối ưu hóa bộ nhớ' : 'Memory optimization'}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm text-gray-700">
                      {language === 'vi' ? 'Cache thông minh' : 'Smart caching'}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">
                      {language === 'vi' ? 'Chế độ tiết kiệm' : 'Power saving mode'}
                    </span>
                  </label>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  {language === 'vi' ? 'Bảo mật' : 'Security'}
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm text-gray-700">
                      {language === 'vi' ? 'Mã hóa dữ liệu' : 'Data encryption'}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm text-gray-700">
                      {language === 'vi' ? 'Xác thực 2 lớp' : '2FA authentication'}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">
                      {language === 'vi' ? 'Chế độ riêng tư' : 'Privacy mode'}
                    </span>
                  </label>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  {language === 'vi' ? 'Giao diện' : 'Interface'}
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm text-gray-700">
                      {language === 'vi' ? 'Hiệu ứng đồ họa' : 'Visual effects'}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm text-gray-700">
                      {language === 'vi' ? 'Thông báo thời gian thực' : 'Real-time notifications'}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">
                      {language === 'vi' ? 'Chế độ tối' : 'Dark mode'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}