'use client'

// Simplified Workspace Page for MVP
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useAgents, useSwarmIntelligence } from '@/contexts/AgentContext'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout'
import AuthGuard from '@/components/auth/AuthGuard'
import WorkspaceLayout from '@/components/workspace/WorkspaceLayout'
import SimpleTranslationInterface from '@/components/workspace/SimpleTranslationInterface'
import EnhancedDocumentInterface from '@/components/workspace/EnhancedDocumentInterface'
import SwarmIntelligenceDashboard from '@/components/workspace/SwarmIntelligenceDashboard'
import AnalyticsDashboard from '@/components/workspace/AnalyticsDashboard'
import ApiDeveloperPortal from '@/components/workspace/ApiDeveloperPortal'
import EnterpriseDashboard from '@/components/workspace/EnterpriseDashboard'
import SettingsDashboard from '@/components/workspace/SettingsDashboard'

export type WorkspaceMode = 'translation' | 'documents' | 'intelligence' | 'analytics' | 'api' | 'enterprise' | 'billing' | 'settings'

export default function Workspace() {
  const { user } = useAuth()
  const { language } = useSSRSafeLanguage()
  const { agents, swarmMetrics, isConnected } = useSwarmIntelligence()
  const [activeMode, setActiveMode] = useState<WorkspaceMode>('translation')

  const content = {
    vi: {
      title: 'Không gian làm việc',
      subtitle: 'Quản lý dự án AI và dịch thuật của bạn',
      modes: {
        translation: 'Dịch thuật',
        documents: 'Tài liệu AI',
        intelligence: 'Thông minh nhân tạo',
        analytics: 'Phân tích',
        api: 'API & Tích hợp',
        enterprise: 'Doanh nghiệp',
        billing: 'Thanh toán',
        settings: 'Cài đặt',
      },
      agentStatus: {
        connected: 'AI Agents đang hoạt động',
        disconnected: 'AI Agents không khả dụng',
        agents: 'agents',
        collaborations: 'collaborations',
      },
    },
    en: {
      title: 'Workspace',
      subtitle: 'Manage your AI and translation projects',
      modes: {
        translation: 'Translation',
        documents: 'AI Documents',
        intelligence: 'AI Intelligence',
        analytics: 'Analytics',
        api: 'API & Integration',
        enterprise: 'Enterprise',
        billing: 'Billing',
        settings: 'Settings',
      },
      agentStatus: {
        connected: 'AI Agents active',
        disconnected: 'AI Agents unavailable',
        agents: 'agents',
        collaborations: 'collaborations',
      },
    },
  }

  const renderActiveMode = () => {
    const baseStyle = {
      backgroundColor: 'rgba(251, 250, 249, 1)',
      border: '1px solid var(--surface-outline)',
    }

    switch (activeMode) {
      case 'translation':
        return <SimpleTranslationInterface />
      
      case 'documents':
        return (
          <div className="rounded-xl p-8" style={baseStyle}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {content[language].modes.documents}
                </h3>
                <p className="text-gray-600">
                  {language === 'vi' 
                    ? 'Xử lý tài liệu thông minh với AI Agents' 
                    : 'Intelligent document processing with AI Agents'}
                </p>
              </div>
              {renderAgentStatus()}
            </div>
            <EnhancedDocumentInterface />
          </div>
        )
      
      case 'intelligence':
        return (
          <div className="rounded-xl p-8" style={baseStyle}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {content[language].modes.intelligence}
                </h3>
                <p className="text-gray-600">
                  {language === 'vi' 
                    ? 'Hệ thống thông minh nhân tạo và cộng tác agent' 
                    : 'AI intelligence system and agent collaboration'}
                </p>
              </div>
              {renderAgentStatus()}
            </div>
            <SwarmIntelligenceDashboard />
          </div>
        )
      
      case 'analytics':
        return (
          <div className="rounded-xl p-8" style={baseStyle}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {content[language].modes.analytics}
                </h3>
                <p className="text-gray-600">
                  {language === 'vi' 
                    ? 'Phân tích và thống kê sử dụng chi tiết' 
                    : 'Detailed usage analytics and statistics'}
                </p>
              </div>
            </div>
            <AnalyticsDashboard />
          </div>
        )
      
      case 'api':
        return (
          <div className="rounded-xl p-8" style={baseStyle}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {content[language].modes.api}
                </h3>
                <p className="text-gray-600">
                  {language === 'vi' 
                    ? 'Quản lý API keys và tích hợp hệ thống cho nhà phát triển' 
                    : 'API key management and system integration for developers'}
                </p>
              </div>
            </div>
            <ApiDeveloperPortal />
          </div>
        )
      
      case 'enterprise':
        return (
          <div className="rounded-xl p-8" style={baseStyle}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {content[language].modes.enterprise}
                </h3>
                <p className="text-gray-600">
                  {language === 'vi' 
                    ? 'Quản lý nhóm và tài nguyên doanh nghiệp' 
                    : 'Team management and enterprise resources'}
                </p>
              </div>
            </div>
            <EnterpriseDashboard />
          </div>
        )
      
      case 'billing':
        return (
          <div className="rounded-xl p-8" style={baseStyle}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {content[language].modes.billing}
            </h3>
            <p className="text-gray-600">
              {language === 'vi' 
                ? 'Quản lý thanh toán và sử dụng' 
                : 'Billing and usage management'}
            </p>
          </div>
        )
      
      case 'settings':
        return (
          <div className="rounded-xl p-8" style={baseStyle}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {content[language].modes.settings}
                </h3>
                <p className="text-gray-600">
                  {language === 'vi' 
                    ? 'Quản lý tài khoản và tùy chọn cá nhân' 
                    : 'Manage account and personal preferences'}
                </p>
              </div>
            </div>
            <SettingsDashboard />
          </div>
        )
      
      default:
        return <SimpleTranslationInterface />
    }
  }

  // Render agent status indicator
  const renderAgentStatus = () => {
    if (!isConnected) {
      return (
        <div className="flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
          {content[language].agentStatus.disconnected}
        </div>
      )
    }

    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center px-3 py-1 bg-green-100 rounded-full text-sm text-green-700">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          {content[language].agentStatus.connected}
        </div>
        <div className="text-sm text-gray-600">
          {agents.length} {content[language].agentStatus.agents}
        </div>
        {swarmMetrics && (
          <div className="text-sm text-gray-600">
            {swarmMetrics.totalCollaborations} {content[language].agentStatus.collaborations}
          </div>
        )}
      </div>
    )
  }

  // Render swarm intelligence dashboard
  const renderSwarmDashboard = () => {
    if (!isConnected || !swarmMetrics) {
      return (
        <div className="text-center py-8 text-gray-500">
          {language === 'vi' 
            ? 'Hệ thống AI chưa sẵn sàng' 
            : 'AI system not ready'}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">
            {language === 'vi' ? 'Agents Hoạt Động' : 'Active Agents'}
          </h4>
          <div className="text-3xl font-bold text-blue-600">
            {swarmMetrics.activeAgents}/{swarmMetrics.totalAgents}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">
            {language === 'vi' ? 'Hiệu Suất Trung Bình' : 'Average Efficiency'}
          </h4>
          <div className="text-3xl font-bold text-green-600">
            {Math.round(swarmMetrics.averageEfficiency)}%
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">
            {language === 'vi' ? 'Cộng Tác' : 'Collaborations'}
          </h4>
          <div className="text-3xl font-bold text-purple-600">
            {swarmMetrics.totalCollaborations}
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <AuthenticatedLayout>
        <WorkspaceLayout
          currentMode={activeMode}
          onModeChange={setActiveMode}
          language={language}
          user={user}
        >
          <motion.div
            className="space-y-6 p-6"
            variants={motionSafe(staggerContainer)}
            initial="hidden"
            animate="visible"
          >
            {/* Active Mode Content */}
            <motion.div variants={motionSafe(slideUp)}>
              {renderActiveMode()}
            </motion.div>
          </motion.div>
        </WorkspaceLayout>
      </AuthenticatedLayout>
    </AuthGuard>
  )
}
