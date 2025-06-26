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
      {/* Header - NotebookLM Style */}
      <motion.div variants={motionSafe(slideUp)}>
        <h1 
          className="mb-2"
          style={{
            fontSize: 'var(--sys-display-medium-size)',
            lineHeight: 'var(--sys-display-medium-line-height)',
            fontFamily: 'var(--sys-display-medium-font)',
            fontWeight: 'var(--sys-display-medium-weight)',
            color: 'var(--text-primary)'
          }}
        >
          {content[language].title}
        </h1>
        <p 
          style={{
            fontSize: 'var(--sys-body-large-size)',
            lineHeight: 'var(--sys-body-large-line-height)',
            fontFamily: 'var(--sys-body-large-font)',
            fontWeight: 'var(--sys-body-large-weight)',
            color: 'var(--text-secondary)'
          }}
        >
          {content[language].subtitle}
        </p>
      </motion.div>

      {/* Mode Selector - Material Design 3 Style */}
      <motion.div
        variants={motionSafe(slideUp)}
        className="p-6"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderRadius: 'var(--mat-card-elevated-container-shape)',
          border: '1px solid var(--surface-outline)',
          boxShadow: 'var(--elevation-level-1)'
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 
            style={{
              fontSize: 'var(--sys-headline-medium-size)',
              lineHeight: 'var(--sys-headline-medium-line-height)',
              fontFamily: 'var(--sys-headline-medium-font)',
              fontWeight: 'var(--sys-headline-medium-weight)',
              color: 'var(--text-primary)'
            }}
          >
            Interface Mode
          </h2>
          <div className="flex items-center space-x-3">
            {(['swarm', 'voice', 'hybrid'] as InterfaceMode[]).map((modeOption) => (
              <button
                key={modeOption}
                onClick={() => handleModeSwitch(modeOption)}
                className="flex items-center space-x-2 px-4 py-2 transition-all"
                style={{
                  borderRadius: 'var(--mat-button-filled-container-shape)',
                  backgroundColor: mode === modeOption 
                    ? 'var(--notebooklm-primary)' 
                    : 'var(--surface-filled)',
                  color: mode === modeOption 
                    ? 'white' 
                    : 'var(--text-secondary)',
                  fontSize: 'var(--sys-label-medium-size)',
                  lineHeight: 'var(--sys-label-medium-line-height)',
                  fontFamily: 'var(--sys-label-medium-font)',
                  fontWeight: 'var(--sys-label-medium-weight)'
                }}
                onMouseEnter={(e) => {
                  if (mode !== modeOption) {
                    e.currentTarget.style.backgroundColor = 'var(--surface-panel)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (mode !== modeOption) {
                    e.currentTarget.style.backgroundColor = 'var(--surface-filled)'
                  }
                }}
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
            <h3 
              style={{
                fontSize: 'var(--sys-title-medium-size)',
                lineHeight: 'var(--sys-title-medium-line-height)',
                fontFamily: 'var(--sys-title-medium-font)',
                fontWeight: 'var(--sys-title-medium-weight)',
                color: 'var(--text-primary)'
              }}
            >
              {content[language].settings.performance}
            </h3>
            
            <div className="space-y-3">
              <div 
                className="p-4"
                style={{
                  background: `linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))`,
                  borderRadius: 'var(--mat-card-outlined-container-shape)',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span 
                    className="text-sm"
                    style={{
                      color: 'rgb(21, 128, 61)',
                      fontSize: 'var(--sys-body-medium-size)',
                      lineHeight: 'var(--sys-body-medium-line-height)',
                      fontFamily: 'var(--sys-body-medium-font)',
                      fontWeight: 'var(--sys-body-medium-weight)'
                    }}
                  >
                    {content[language].metrics.responseTime}
                  </span>
                  <span 
                    className="font-bold"
                    style={{
                      color: 'rgb(22, 101, 52)',
                      fontSize: 'var(--sys-label-large-size)',
                      lineHeight: 'var(--sys-label-large-line-height)',
                      fontFamily: 'var(--sys-label-large-font)',
                      fontWeight: 'var(--sys-label-large-weight)'
                    }}
                  >
                    {performance.responseTime}{content[language].metrics.milliseconds}
                  </span>
                </div>
              </div>
              
              <div 
                className="p-4"
                style={{
                  background: `linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))`,
                  borderRadius: 'var(--mat-card-outlined-container-shape)',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span 
                    className="text-sm"
                    style={{
                      color: 'rgb(29, 78, 216)',
                      fontSize: 'var(--sys-body-medium-size)',
                      lineHeight: 'var(--sys-body-medium-line-height)',
                      fontFamily: 'var(--sys-body-medium-font)',
                      fontWeight: 'var(--sys-body-medium-weight)'
                    }}
                  >
                    {content[language].metrics.accuracy}
                  </span>
                  <span 
                    className="font-bold"
                    style={{
                      color: 'rgb(30, 64, 175)',
                      fontSize: 'var(--sys-label-large-size)',
                      lineHeight: 'var(--sys-label-large-line-height)',
                      fontFamily: 'var(--sys-label-large-font)',
                      fontWeight: 'var(--sys-label-large-weight)'
                    }}
                  >
                    {performance.accuracy}%
                  </span>
                </div>
              </div>
              
              <div 
                className="p-4"
                style={{
                  background: `linear-gradient(to right, var(--notebooklm-primary-light), rgba(139, 92, 246, 0.1))`,
                  borderRadius: 'var(--mat-card-outlined-container-shape)',
                  border: '1px solid var(--notebooklm-primary)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span 
                    className="text-sm"
                    style={{
                      color: 'var(--notebooklm-primary-dark)',
                      fontSize: 'var(--sys-body-medium-size)',
                      lineHeight: 'var(--sys-body-medium-line-height)',
                      fontFamily: 'var(--sys-body-medium-font)',
                      fontWeight: 'var(--sys-body-medium-weight)'
                    }}
                  >
                    {content[language].metrics.uptime}
                  </span>
                  <span 
                    className="font-bold"
                    style={{
                      color: 'var(--notebooklm-primary-dark)',
                      fontSize: 'var(--sys-label-large-size)',
                      lineHeight: 'var(--sys-label-large-line-height)',
                      fontFamily: 'var(--sys-label-large-font)',
                      fontWeight: 'var(--sys-label-large-weight)'
                    }}
                  >
                    {performance.uptime}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Controls */}
          <div className="space-y-4">
            <h3 
              style={{
                fontSize: 'var(--sys-title-medium-size)',
                lineHeight: 'var(--sys-title-medium-line-height)',
                fontFamily: 'var(--sys-title-medium-font)',
                fontWeight: 'var(--sys-title-medium-weight)',
                color: 'var(--text-primary)'
              }}
            >
              {content[language].settings.title}
            </h3>
            
            <div className="space-y-4">
              <div 
                className="flex items-center justify-between p-4"
                style={{
                  backgroundColor: 'var(--surface-filled)',
                  borderRadius: 'var(--mat-card-outlined-container-shape)'
                }}
              >
                <div>
                  <p 
                    style={{
                      fontSize: 'var(--sys-label-large-size)',
                      lineHeight: 'var(--sys-label-large-line-height)',
                      fontFamily: 'var(--sys-label-large-font)',
                      fontWeight: 'var(--sys-label-large-weight)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {content[language].settings.voiceControl}
                  </p>
                  <p 
                    className="text-sm"
                    style={{
                      fontSize: 'var(--sys-body-medium-size)',
                      lineHeight: 'var(--sys-body-medium-line-height)',
                      fontFamily: 'var(--sys-body-medium-font)',
                      fontWeight: 'var(--sys-body-medium-weight)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Enable voice commands
                  </p>
                </div>
                <button
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className="transition-colors"
                  style={{
                    color: isVoiceEnabled ? 'var(--notebooklm-primary)' : 'var(--text-disabled)'
                  }}
                >
                  {isVoiceEnabled ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>
              
              <div 
                className="flex items-center justify-between p-4"
                style={{
                  backgroundColor: 'var(--surface-filled)',
                  borderRadius: 'var(--mat-card-outlined-container-shape)'
                }}
              >
                <div>
                  <p 
                    style={{
                      fontSize: 'var(--sys-label-large-size)',
                      lineHeight: 'var(--sys-label-large-line-height)',
                      fontFamily: 'var(--sys-label-large-font)',
                      fontWeight: 'var(--sys-label-large-weight)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {content[language].settings.advancedMode}
                  </p>
                  <p 
                    className="text-sm"
                    style={{
                      fontSize: 'var(--sys-body-medium-size)',
                      lineHeight: 'var(--sys-body-medium-line-height)',
                      fontFamily: 'var(--sys-body-medium-font)',
                      fontWeight: 'var(--sys-body-medium-weight)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Show advanced options
                  </p>
                </div>
                <button
                  onClick={() => setAdvancedMode(!advancedMode)}
                  className="transition-colors"
                  style={{
                    color: advancedMode ? 'var(--notebooklm-primary)' : 'var(--text-disabled)'
                  }}
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
            <h3 
              style={{
                fontSize: 'var(--sys-title-medium-size)',
                lineHeight: 'var(--sys-title-medium-line-height)',
                fontFamily: 'var(--sys-title-medium-font)',
                fontWeight: 'var(--sys-title-medium-weight)',
                color: 'var(--text-primary)'
              }}
            >
              Features
            </h3>
            
            <div className="space-y-3">
              {Object.entries(content[language].features).map(([key, feature]) => (
                <div 
                  key={key} 
                  className="flex items-center space-x-3 p-3"
                  style={{
                    backgroundColor: 'var(--surface-filled)',
                    borderRadius: 'var(--mat-card-outlined-container-shape)'
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--notebooklm-primary)' }}
                  ></div>
                  <span 
                    className="text-sm"
                    style={{
                      fontSize: 'var(--sys-body-medium-size)',
                      lineHeight: 'var(--sys-body-medium-line-height)',
                      fontFamily: 'var(--sys-body-medium-font)',
                      fontWeight: 'var(--sys-body-medium-weight)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {feature}
                  </span>
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
                <div 
                  className="text-center p-4"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderRadius: 'var(--mat-card-outlined-container-shape)'
                  }}
                >
                  <Brain className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--notebooklm-primary)' }} />
                  <p 
                    className="text-sm font-medium"
                    style={{
                      fontSize: 'var(--sys-label-medium-size)',
                      lineHeight: 'var(--sys-label-medium-line-height)',
                      fontFamily: 'var(--sys-label-medium-font)',
                      fontWeight: 'var(--sys-label-medium-weight)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {language === 'vi' ? 'AI Thông minh' : 'Smart AI'}
                  </p>
                </div>
                
                <div 
                  className="text-center p-4"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderRadius: 'var(--mat-card-outlined-container-shape)'
                  }}
                >
                  <Mic className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--notebooklm-primary)' }} />
                  <p 
                    className="text-sm font-medium"
                    style={{
                      fontSize: 'var(--sys-label-medium-size)',
                      lineHeight: 'var(--sys-label-medium-line-height)',
                      fontFamily: 'var(--sys-label-medium-font)',
                      fontWeight: 'var(--sys-label-medium-weight)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {language === 'vi' ? 'Giọng nói' : 'Voice'}
                  </p>
                </div>
                
                <div 
                  className="text-center p-4"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderRadius: 'var(--mat-card-outlined-container-shape)'
                  }}
                >
                  <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--notebooklm-primary)' }} />
                  <p 
                    className="text-sm font-medium"
                    style={{
                      fontSize: 'var(--sys-label-medium-size)',
                      lineHeight: 'var(--sys-label-medium-line-height)',
                      fontFamily: 'var(--sys-label-medium-font)',
                      fontWeight: 'var(--sys-label-medium-weight)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {language === 'vi' ? 'Cộng tác' : 'Collaboration'}
                  </p>
                </div>
                
                <div 
                  className="text-center p-4"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderRadius: 'var(--mat-card-outlined-container-shape)'
                  }}
                >
                  <Eye className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--notebooklm-primary)' }} />
                  <p 
                    className="text-sm font-medium"
                    style={{
                      fontSize: 'var(--sys-label-medium-size)',
                      lineHeight: 'var(--sys-label-medium-line-height)',
                      fontFamily: 'var(--sys-label-medium-font)',
                      fontWeight: 'var(--sys-label-medium-weight)',
                      color: 'var(--text-primary)'
                    }}
                  >
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
            className="p-6"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderRadius: 'var(--mat-card-elevated-container-shape)',
              border: '1px solid var(--surface-outline)',
              boxShadow: 'var(--elevation-level-1)'
            }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
              <h3 
                style={{
                  fontSize: 'var(--sys-title-large-size)',
                  lineHeight: 'var(--sys-title-large-line-height)',
                  fontFamily: 'var(--sys-title-large-font)',
                  fontWeight: 'var(--sys-title-large-weight)',
                  color: 'var(--text-primary)'
                }}
              >
                {language === 'vi' ? 'Tùy chọn nâng cao' : 'Advanced Options'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 
                  className="mb-3"
                  style={{
                    fontSize: 'var(--sys-title-medium-size)',
                    lineHeight: 'var(--sys-title-medium-line-height)',
                    fontFamily: 'var(--sys-title-medium-font)',
                    fontWeight: 'var(--sys-title-medium-weight)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {language === 'vi' ? 'Hiệu năng' : 'Performance'}
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span 
                      className="text-sm"
                      style={{
                        fontSize: 'var(--sys-body-medium-size)',
                        lineHeight: 'var(--sys-body-medium-line-height)',
                        fontFamily: 'var(--sys-body-medium-font)',
                        fontWeight: 'var(--sys-body-medium-weight)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {language === 'vi' ? 'Tối ưu hóa bộ nhớ' : 'Memory optimization'}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span 
                      className="text-sm"
                      style={{
                        fontSize: 'var(--sys-body-medium-size)',
                        lineHeight: 'var(--sys-body-medium-line-height)',
                        fontFamily: 'var(--sys-body-medium-font)',
                        fontWeight: 'var(--sys-body-medium-weight)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {language === 'vi' ? 'Cache thông minh' : 'Smart caching'}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span 
                      className="text-sm"
                      style={{
                        fontSize: 'var(--sys-body-medium-size)',
                        lineHeight: 'var(--sys-body-medium-line-height)',
                        fontFamily: 'var(--sys-body-medium-font)',
                        fontWeight: 'var(--sys-body-medium-weight)',
                        color: 'var(--text-primary)'
                      }}
                    >
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
                    <span 
                      className="text-sm"
                      style={{
                        fontSize: 'var(--sys-body-medium-size)',
                        lineHeight: 'var(--sys-body-medium-line-height)',
                        fontFamily: 'var(--sys-body-medium-font)',
                        fontWeight: 'var(--sys-body-medium-weight)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {language === 'vi' ? 'Mã hóa dữ liệu' : 'Data encryption'}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span 
                      className="text-sm"
                      style={{
                        fontSize: 'var(--sys-body-medium-size)',
                        lineHeight: 'var(--sys-body-medium-line-height)',
                        fontFamily: 'var(--sys-body-medium-font)',
                        fontWeight: 'var(--sys-body-medium-weight)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {language === 'vi' ? 'Xác thực 2 lớp' : '2FA authentication'}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span 
                      className="text-sm"
                      style={{
                        fontSize: 'var(--sys-body-medium-size)',
                        lineHeight: 'var(--sys-body-medium-line-height)',
                        fontFamily: 'var(--sys-body-medium-font)',
                        fontWeight: 'var(--sys-body-medium-weight)',
                        color: 'var(--text-primary)'
                      }}
                    >
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
                    <span 
                      className="text-sm"
                      style={{
                        fontSize: 'var(--sys-body-medium-size)',
                        lineHeight: 'var(--sys-body-medium-line-height)',
                        fontFamily: 'var(--sys-body-medium-font)',
                        fontWeight: 'var(--sys-body-medium-weight)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {language === 'vi' ? 'Hiệu ứng đồ họa' : 'Visual effects'}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span 
                      className="text-sm"
                      style={{
                        fontSize: 'var(--sys-body-medium-size)',
                        lineHeight: 'var(--sys-body-medium-line-height)',
                        fontFamily: 'var(--sys-body-medium-font)',
                        fontWeight: 'var(--sys-body-medium-weight)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {language === 'vi' ? 'Thông báo thời gian thực' : 'Real-time notifications'}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span 
                      className="text-sm"
                      style={{
                        fontSize: 'var(--sys-body-medium-size)',
                        lineHeight: 'var(--sys-body-medium-line-height)',
                        fontFamily: 'var(--sys-body-medium-font)',
                        fontWeight: 'var(--sys-body-medium-weight)',
                        color: 'var(--text-primary)'
                      }}
                    >
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