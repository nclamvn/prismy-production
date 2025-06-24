// AI Workspace Components Export Index
// Centralized exports for the new AI workspace components

export { default as AIWorkspaceLayout } from './AIWorkspaceLayout'
export { default as AIChatInterface } from './AIChatInterface'
export { default as DocumentViewer } from './DocumentViewer'
export { default as AgentDashboard } from './AgentDashboard'

// Type exports for external use
export type {
  Agent,
  Message,
  Citation,
  Attachment,
  Task,
  Document,
  Annotation,
  Position
} from './types'

// Additional workspace utilities
export { getCulturalRhythm, getMotionPreference } from './utils'