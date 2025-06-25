'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Zap, Eye, Settings, AlertTriangle, CheckCircle, Gauge, Accessibility } from 'lucide-react'
import { motionSafe, slideUp, fadeIn } from '@/lib/motion'
import {
  PerformanceMonitor,
  MemoryOptimizer,
  FrameRateOptimizer
} from '@/lib/performance-optimizer'
import {
  AccessibilityChecker,
  MotionAccessibility,
  ColorAccessibility,
  LiveRegionManager
} from '@/lib/accessibility-enhancer'

interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  batteryLevel: number
  responseTime: number
  accessibilityScore: number
}

interface AccessibilityIssue {
  type: string
  message: string
  severity: 'error' | 'warning'
  element?: string
}

interface PerformanceAccessibilityMonitorProps {
  language?: 'vi' | 'en'
  onOptimizationSuggestion?: (suggestion: string) => void
}

export default function PerformanceAccessibilityMonitor({ 
  language = 'en', 
  onOptimizationSuggestion 
}: PerformanceAccessibilityMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    batteryLevel: 1,
    responseTime: 100,
    accessibilityScore: 100
  })
  const [accessibilityIssues, setAccessibilityIssues] = useState<AccessibilityIssue[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [autoOptimize, setAutoOptimize] = useState(true)
  const [performanceLevel, setPerformanceLevel] = useState<'high' | 'medium' | 'low'>('high')
  const monitorRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout>()

  const content = {
    vi: {
      title: 'Giám sát Hiệu năng & Tiếp cận',
      subtitle: 'Theo dõi và tối ưu hóa trải nghiệm người dùng',
      startMonitoring: 'Bắt đầu giám sát',
      stopMonitoring: 'Dừng giám sát',
      autoOptimize: 'Tự động tối ưu',
      performanceMetrics: 'Chỉ số hiệu năng',
      accessibilityScore: 'Điểm tiếp cận',
      issues: 'Vấn đề',
      suggestions: 'Đề xuất',
      metrics: {
        fps: 'Khung hình/giây',
        memory: 'Sử dụng bộ nhớ',
        battery: 'Pin',
        responseTime: 'Thời gian phản hồi',
        accessibility: 'Tiếp cận'
      },
      levels: {
        high: 'Cao',
        medium: 'Trung bình',
        low: 'Thấp'
      },
      optimizations: {
        reduceAnimations: 'Giảm hiệu ứng đồ họa',
        enableLazyLoading: 'Kích hoạt lazy loading',
        optimizeImages: 'Tối ưu hóa hình ảnh',
        reducePolling: 'Giảm tần suất cập nhật',
        improveContrast: 'Cải thiện độ tương phản',
        addAltText: 'Thêm alt text cho hình ảnh',
        improveKeyboardNav: 'Cải thiện điều hướng bàn phím'
      }
    },
    en: {
      title: 'Performance & Accessibility Monitor',
      subtitle: 'Track and optimize user experience',
      startMonitoring: 'Start Monitoring',
      stopMonitoring: 'Stop Monitoring',
      autoOptimize: 'Auto Optimize',
      performanceMetrics: 'Performance Metrics',
      accessibilityScore: 'Accessibility Score',
      issues: 'Issues',
      suggestions: 'Suggestions',
      metrics: {
        fps: 'FPS',
        memory: 'Memory Usage',
        battery: 'Battery',
        responseTime: 'Response Time',
        accessibility: 'Accessibility'
      },
      levels: {
        high: 'High',
        medium: 'Medium',
        low: 'Low'
      },
      optimizations: {
        reduceAnimations: 'Reduce animations',
        enableLazyLoading: 'Enable lazy loading',
        optimizeImages: 'Optimize images',
        reducePolling: 'Reduce polling frequency',
        improveContrast: 'Improve color contrast',
        addAltText: 'Add alt text to images',
        improveKeyboardNav: 'Improve keyboard navigation'
      }
    }
  }

  // Initialize performance and accessibility monitoring
  useEffect(() => {
    const initializeMonitoring = async () => {
      await PerformanceMonitor.initialize()
      MotionAccessibility.initialize()
      ColorAccessibility.adaptColorsForHighContrast()
    }

    initializeMonitoring()
  }, [])

  // Start/stop monitoring
  useEffect(() => {
    if (isMonitoring) {
      intervalRef.current = setInterval(() => {
        updateMetrics()
        checkAccessibility()
      }, 2000)

      // Start frame rate monitoring
      FrameRateOptimizer.addCallback(() => {
        // Frame rate callback for real-time FPS
      })
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isMonitoring])

  const updateMetrics = () => {
    const performanceMetrics = PerformanceMonitor.getMetrics()
    const level = PerformanceMonitor.getPerformanceLevel()
    
    setMetrics(prev => ({
      ...prev,
      fps: performanceMetrics.frameRate,
      memoryUsage: performanceMetrics.memoryUsage * 100,
      batteryLevel: performanceMetrics.batteryLevel * 100,
      responseTime: 50 + Math.random() * 100 // Simulated response time
    }))
    
    setPerformanceLevel(level)
    
    // Auto-optimize if enabled
    if (autoOptimize) {
      applyAutomaticOptimizations(level)
    }
  }

  const checkAccessibility = () => {
    if (monitorRef.current) {
      const audit = AccessibilityChecker.auditElement(document.body)
      setAccessibilityIssues(audit.issues)
      setMetrics(prev => ({
        ...prev,
        accessibilityScore: audit.score
      }))
    }
  }

  const applyAutomaticOptimizations = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'low':
        // Aggressive optimizations
        MemoryOptimizer.optimizeMemory()
        onOptimizationSuggestion?.(content[language].optimizations.reduceAnimations)
        onOptimizationSuggestion?.(content[language].optimizations.reducePolling)
        break
        
      case 'medium':
        // Moderate optimizations
        onOptimizationSuggestion?.(content[language].optimizations.enableLazyLoading)
        onOptimizationSuggestion?.(content[language].optimizations.optimizeImages)
        break
        
      case 'high':
        // No immediate optimizations needed
        break
    }
  }

  const getMetricColor = (value: number, type: 'performance' | 'accessibility') => {
    if (type === 'performance') {
      if (value >= 90) return 'text-green-600'
      if (value >= 70) return 'text-yellow-600'
      return 'text-red-600'
    } else {
      if (value >= 95) return 'text-green-600'
      if (value >= 80) return 'text-yellow-600'
      return 'text-red-600'
    }
  }

  const getMetricIcon = (value: number, type: 'performance' | 'accessibility') => {
    const isGood = type === 'performance' ? value >= 90 : value >= 95
    const isFair = type === 'performance' ? value >= 70 : value >= 80
    
    if (isGood) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (isFair) return <AlertTriangle className="w-5 h-5 text-yellow-600" />
    return <AlertTriangle className="w-5 h-5 text-red-600" />
  }

  const handleStartMonitoring = () => {
    setIsMonitoring(true)
    LiveRegionManager.announce('monitor-status', 
      language === 'vi' 
        ? 'Bắt đầu giám sát hiệu năng và tiếp cận'
        : 'Started performance and accessibility monitoring'
    )
  }

  const handleStopMonitoring = () => {
    setIsMonitoring(false)
    LiveRegionManager.announce('monitor-status',
      language === 'vi'
        ? 'Dừng giám sát'
        : 'Stopped monitoring'
    )
  }

  return (
    <motion.div
      ref={monitorRef}
      variants={motionSafe(slideUp)}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Activity className="w-6 h-6 text-blue-600" />
            <span>{content[language].title}</span>
          </h2>
          <p className="text-gray-600 mt-1">{content[language].subtitle}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoOptimize}
              onChange={(e) => setAutoOptimize(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">{content[language].autoOptimize}</span>
          </label>
          
          <button
            onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isMonitoring
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            aria-live="polite"
          >
            {isMonitoring ? content[language].stopMonitoring : content[language].startMonitoring}
          </button>
        </div>
      </div>

      {/* Performance Level Indicator */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <Gauge className="w-6 h-6 text-gray-600" />
          <span className="font-medium text-gray-900">
            {language === 'vi' ? 'Mức hiệu năng' : 'Performance Level'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            performanceLevel === 'high' ? 'bg-green-500' :
            performanceLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className={`font-medium ${
            performanceLevel === 'high' ? 'text-green-700' :
            performanceLevel === 'medium' ? 'text-yellow-700' : 'text-red-700'
          }`}>
            {content[language].levels[performanceLevel]}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* FPS */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div className={`text-2xl font-bold ${getMetricColor(metrics.fps, 'performance')}`}>
            {Math.round(metrics.fps)}
          </div>
          <div className="text-sm text-gray-600">{content[language].metrics.fps}</div>
        </div>

        {/* Memory */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            {getMetricIcon(100 - metrics.memoryUsage, 'performance')}
          </div>
          <div className={`text-2xl font-bold ${getMetricColor(100 - metrics.memoryUsage, 'performance')}`}>
            {Math.round(metrics.memoryUsage)}%
          </div>
          <div className="text-sm text-gray-600">{content[language].metrics.memory}</div>
        </div>

        {/* Battery */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            {getMetricIcon(metrics.batteryLevel, 'performance')}
          </div>
          <div className={`text-2xl font-bold ${getMetricColor(metrics.batteryLevel, 'performance')}`}>
            {Math.round(metrics.batteryLevel)}%
          </div>
          <div className="text-sm text-gray-600">{content[language].metrics.battery}</div>
        </div>

        {/* Response Time */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            {getMetricIcon(Math.max(0, 200 - metrics.responseTime), 'performance')}
          </div>
          <div className={`text-2xl font-bold ${getMetricColor(Math.max(0, 200 - metrics.responseTime), 'performance')}`}>
            {Math.round(metrics.responseTime)}ms
          </div>
          <div className="text-sm text-gray-600">{content[language].metrics.responseTime}</div>
        </div>

        {/* Accessibility */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <Accessibility className="w-5 h-5 text-purple-600" />
          </div>
          <div className={`text-2xl font-bold ${getMetricColor(metrics.accessibilityScore, 'accessibility')}`}>
            {Math.round(metrics.accessibilityScore)}
          </div>
          <div className="text-sm text-gray-600">{content[language].metrics.accessibility}</div>
        </div>
      </div>

      {/* Issues and Suggestions */}
      <AnimatePresence>
        {(accessibilityIssues.length > 0 || performanceLevel !== 'high') && (
          <motion.div
            variants={motionSafe(fadeIn)}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            {/* Accessibility Issues */}
            {accessibilityIssues.length > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-medium text-orange-900 mb-3 flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>{content[language].accessibilityScore} {content[language].issues}</span>
                </h3>
                <div className="space-y-2">
                  {accessibilityIssues.slice(0, 5).map((issue, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                        issue.severity === 'error' ? 'text-red-500' : 'text-yellow-500'
                      }`} />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{issue.type}</span>
                        <p className="text-sm text-gray-600">{issue.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Suggestions */}
            {performanceLevel !== 'high' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>{content[language].suggestions}</span>
                </h3>
                <div className="space-y-2">
                  {performanceLevel === 'low' && (
                    <>
                      <div className="text-sm text-blue-700">
                        • {content[language].optimizations.reduceAnimations}
                      </div>
                      <div className="text-sm text-blue-700">
                        • {content[language].optimizations.reducePolling}
                      </div>
                    </>
                  )}
                  {performanceLevel === 'medium' && (
                    <>
                      <div className="text-sm text-blue-700">
                        • {content[language].optimizations.enableLazyLoading}
                      </div>
                      <div className="text-sm text-blue-700">
                        • {content[language].optimizations.optimizeImages}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Monitoring Indicator */}
      {isMonitoring && (
        <div className="flex items-center justify-center p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-700">
              {language === 'vi' ? 'Đang giám sát...' : 'Monitoring active...'}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}