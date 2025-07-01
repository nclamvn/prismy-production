// Utility Functions for AI Workspace
// Helper functions for cultural adaptation, performance optimization, and workspace management

import type { Agent, CulturalContext, WorkspaceEvent } from './types'

/**
 * Get current cultural rhythm based on Vietnamese time patterns
 * Returns appropriate interaction style based on time of day
 */
export function getCulturalRhythm(): 'morning' | 'midday' | 'evening' | 'night' {
  const hour = new Date().getHours()
  
  if (hour >= 6 && hour < 11) return 'morning'    // Active, energetic
  if (hour >= 11 && hour < 14) return 'midday'   // Focused, professional
  if (hour >= 14 && hour < 18) return 'midday'   // Continued focus
  if (hour >= 18 && hour < 22) return 'evening'  // Relaxed, contemplative
  return 'night' // Minimal, respectful
}

/**
 * Get motion preferences for accessibility and cultural adaptation
 */
export function getMotionPreference(): boolean {
  // Check user's motion preference
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (prefersReducedMotion.matches) return false
  }
  
  // Adapt to cultural rhythm
  const rhythm = getCulturalRhythm()
  switch (rhythm) {
    case 'morning':
      return true  // Full animations for energetic morning
    case 'midday':
      return true  // Standard animations for focused work
    case 'evening':
      return false // Reduced animations for calm evening
    case 'night':
      return false // Minimal animations for respectful night time
    default:
      return true
  }
}

/**
 * Calculate cultural formality level based on context
 */
export function getCulturalFormality(context: {
  timeOfDay?: 'morning' | 'midday' | 'evening' | 'night'
  documentType?: string
  agentType?: string
  userRole?: string
}): 'formal' | 'semi-formal' | 'casual' {
  const { timeOfDay = getCulturalRhythm(), documentType, agentType, userRole } = context
  
  // Legal and financial contexts are always formal
  if (agentType?.includes('legal') || agentType?.includes('financial')) {
    return 'formal'
  }
  
  // Contract and official documents require formality
  if (documentType?.includes('contract') || documentType?.includes('legal')) {
    return 'formal'
  }
  
  // Evening and night times lean towards more formal, respectful tone
  if (timeOfDay === 'evening' || timeOfDay === 'night') {
    return 'semi-formal'
  }
  
  // Morning and midday can be more casual for appropriate contexts
  return 'casual'
}

/**
 * Generate Vietnamese-appropriate greetings based on time and formality
 */
export function getVietnameseGreeting(formality: 'formal' | 'semi-formal' | 'casual' = 'semi-formal'): {
  en: string
  vi: string
} {
  const timeOfDay = getCulturalRhythm()
  
  const greetings = {
    morning: {
      formal: { en: 'Good morning', vi: 'Chào buổi sáng' },
      'semi-formal': { en: 'Good morning', vi: 'Chào anh/chị' },
      casual: { en: 'Morning!', vi: 'Chào bạn' }
    },
    midday: {
      formal: { en: 'Good afternoon', vi: 'Chào buổi chiều' },
      'semi-formal': { en: 'Good afternoon', vi: 'Chào anh/chị' },
      casual: { en: 'Hi there!', vi: 'Xin chào' }
    },
    evening: {
      formal: { en: 'Good evening', vi: 'Chào buổi tối' },
      'semi-formal': { en: 'Good evening', vi: 'Chào anh/chị' },
      casual: { en: 'Evening!', vi: 'Chào bạn' }
    },
    night: {
      formal: { en: 'Good evening', vi: 'Chào anh/chị' },
      'semi-formal': { en: 'Hello', vi: 'Xin chào' },
      casual: { en: 'Hi', vi: 'Chào' }
    }
  }
  
  return greetings[timeOfDay][formality]
}

/**
 * Format Vietnamese currency and numbers
 */
export function formatVietnameseCurrency(amount: number): {
  vnd: string
  usd: string
} {
  const vndFormatted = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount)
  
  const usdFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount / 24000) // Approximate exchange rate
  
  return { vnd: vndFormatted, usd: usdFormatted }
}

/**
 * Generate agent collaboration suggestions based on task type
 */
export function suggestAgentCollaboration(
  taskType: string, 
  primaryAgentId: string, 
  availableAgents: Agent[]
): Agent[] {
  const collaborationMatrix: Record<string, string[]> = {
    'legal-analysis': ['legal-expert', 'compliance-guardian', 'cultural-advisor'],
    'financial-review': ['financial-analyst', 'legal-expert', 'data-scientist'],
    'content-creation': ['content-strategist', 'cultural-advisor', 'technical-writer'],
    'research-project': ['research-assistant', 'data-scientist', 'innovation-catalyst'],
    'project-planning': ['project-manager', 'business-strategist', 'financial-analyst'],
    'customer-support': ['customer-advocate', 'cultural-advisor', 'technical-writer'],
    'compliance-review': ['compliance-guardian', 'legal-expert', 'cultural-advisor'],
    'innovation-analysis': ['innovation-catalyst', 'business-strategist', 'data-scientist']
  }
  
  const suggestedIds = collaborationMatrix[taskType] || []
  return availableAgents.filter(agent => 
    suggestedIds.includes(agent.id) && agent.id !== primaryAgentId
  )
}

/**
 * Calculate optimal workspace layout based on screen size and preferences
 */
export function calculateOptimalLayout(screenWidth: number, preferences?: any): {
  sidebarWidth: number
  rightPanelWidth: number
  mainContentRatio: number
} {
  if (screenWidth < 768) {
    // Mobile layout
    return {
      sidebarWidth: 0,
      rightPanelWidth: 0,
      mainContentRatio: 1
    }
  } else if (screenWidth < 1024) {
    // Tablet layout
    return {
      sidebarWidth: 280,
      rightPanelWidth: 0,
      mainContentRatio: 1
    }
  } else if (screenWidth < 1440) {
    // Small desktop
    return {
      sidebarWidth: 280,
      rightPanelWidth: 320,
      mainContentRatio: 0.6
    }
  } else {
    // Large desktop
    return {
      sidebarWidth: 320,
      rightPanelWidth: 380,
      mainContentRatio: 0.5
    }
  }
}

/**
 * Generate performance-optimized animation variants based on device capability
 */
export function getOptimizedAnimationVariants(deviceCapability: 'high' | 'medium' | 'low') {
  const baseVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  }
  
  switch (deviceCapability) {
    case 'high':
      return {
        ...baseVariants,
        animate: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: { 
            duration: 0.3, 
            ease: [0.4, 0, 0.2, 1] 
          }
        },
        initial: { 
          opacity: 0, 
          y: 20, 
          scale: 0.95 
        }
      }
    
    case 'medium':
      return {
        ...baseVariants,
        animate: { 
          opacity: 1, 
          transition: { duration: 0.2 } 
        }
      }
    
    case 'low':
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.1 } },
        exit: { opacity: 0, transition: { duration: 0.1 } }
      }
  }
}

/**
 * Detect device performance capability
 */
export function detectDeviceCapability(): 'high' | 'medium' | 'low' {
  if (typeof window === 'undefined') return 'medium'
  
  const navigator = window.navigator as any
  
  // Check for performance indicators
  const hardwareConcurrency = navigator.hardwareConcurrency || 2
  const memory = navigator.deviceMemory || 4
  const connection = navigator.connection
  
  let score = 0
  
  // CPU cores
  if (hardwareConcurrency >= 8) score += 3
  else if (hardwareConcurrency >= 4) score += 2
  else score += 1
  
  // Memory
  if (memory >= 8) score += 3
  else if (memory >= 4) score += 2
  else score += 1
  
  // Connection
  if (connection) {
    if (connection.effectiveType === '4g') score += 2
    else if (connection.effectiveType === '3g') score += 1
  } else {
    score += 2 // Assume good connection if not available
  }
  
  if (score >= 7) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}

/**
 * Generate Vietnamese-specific text processing options
 */
export function getVietnameseTextProcessingOptions() {
  return {
    diacritics: true,
    toneMarks: true,
    unicodeNormalization: 'NFC',
    wordSegmentation: true,
    culturalContext: true,
    formalityDetection: true,
    dialectAdaptation: {
      north: true,  // Hanoi dialect
      central: true, // Hue dialect  
      south: true   // Ho Chi Minh City dialect
    }
  }
}

/**
 * Validate Vietnamese business document formats
 */
export function validateVietnameseBusinessDocument(content: string): {
  isValid: boolean
  documentType: string
  confidence: number
  issues: string[]
} {
  const patterns = {
    contract: /hợp đồng|thỏa thuận|cam kết/i,
    invoice: /hóa đơn|phiếu thu|biên lai/i,
    report: /báo cáo|thống kê|phân tích/i,
    proposal: /đề xuất|kiến nghị|phương án/i,
    policy: /quy định|chính sách|thể lệ/i
  }
  
  let documentType = 'unknown'
  let confidence = 0
  const issues: string[] = []
  
  // Detect document type
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(content)) {
      documentType = type
      confidence += 0.3
      break
    }
  }
  
  // Check for Vietnamese business formalities
  if (/công ty|doanh nghiệp|tập đoàn/i.test(content)) confidence += 0.2
  if (/điều \d+|khoản \d+|mục \d+/i.test(content)) confidence += 0.2
  if (/ngày.*tháng.*năm/i.test(content)) confidence += 0.1
  if (/chữ ký|con dấu|xác nhận/i.test(content)) confidence += 0.2
  
  // Check for issues
  if (content.length < 100) issues.push('Document too short')
  if (!/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(content)) {
    issues.push('No Vietnamese diacritics detected')
  }
  
  return {
    isValid: confidence > 0.5 && issues.length === 0,
    documentType,
    confidence: Math.min(confidence, 1),
    issues
  }
}

/**
 * Create workspace event for analytics and collaboration
 */
export function createWorkspaceEvent(
  type: WorkspaceEvent['type'],
  payload: any,
  source: WorkspaceEvent['source'] = 'user'
): WorkspaceEvent {
  return {
    type,
    payload,
    timestamp: new Date(),
    source
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Deep merge objects utility
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key] as any)
    } else {
      result[key] = source[key] as any
    }
  }
  
  return result
}