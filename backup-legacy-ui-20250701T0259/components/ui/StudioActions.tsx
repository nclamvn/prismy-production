'use client'

import React from 'react'
import {
  Sparkles,
  Zap,
  Target,
  Languages,
  FileType,
  MessageSquare,
  Briefcase,
  GraduationCap,
  Heart,
  Globe,
  Code,
  Newspaper,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'

interface StudioAction {
  id: string
  title: string
  titleVi: string
  description: string
  descriptionVi: string
  icon: React.ElementType
  color: string
  bgColor: string
  prompt?: string
  targetStyle?: string
}

interface StudioActionsProps {
  onActionClick?: (action: StudioAction) => void
  variant?: 'compact' | 'expanded'
}

/**
 * STUDIO-STYLE ONE-CLICK ACTIONS
 * NotebookLM/Claude-inspired quick actions
 */
export default function StudioActions({
  onActionClick,
  variant = 'compact',
}: StudioActionsProps) {
  const { language } = useSSRSafeLanguage()

  const actions: StudioAction[] = [
    {
      id: 'improve',
      title: 'Improve Translation',
      titleVi: 'Cải Thiện Bản Dịch',
      description: 'Enhance accuracy and fluency',
      descriptionVi: 'Tăng độ chính xác và trôi chảy',
      icon: Sparkles,
      color: 'text-purple-700',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      prompt: 'improve_translation',
    },
    {
      id: 'simplify',
      title: 'Simplify',
      titleVi: 'Đơn Giản Hóa',
      description: 'Make text easier to understand',
      descriptionVi: 'Làm văn bản dễ hiểu hơn',
      icon: Zap,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      prompt: 'simplify_language',
    },
    {
      id: 'formal',
      title: 'Formal Tone',
      titleVi: 'Trang Trọng',
      description: 'Professional business language',
      descriptionVi: 'Ngôn ngữ kinh doanh chuyên nghiệp',
      icon: Briefcase,
      color: 'text-gray-700',
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      targetStyle: 'formal',
    },
    {
      id: 'casual',
      title: 'Casual Tone',
      titleVi: 'Thân Thiện',
      description: 'Friendly conversational style',
      descriptionVi: 'Phong cách trò chuyện thân thiện',
      icon: MessageSquare,
      color: 'text-green-700',
      bgColor: 'bg-green-50 hover:bg-green-100',
      targetStyle: 'casual',
    },
    {
      id: 'academic',
      title: 'Academic',
      titleVi: 'Học Thuật',
      description: 'Scholarly and precise',
      descriptionVi: 'Chính xác và học thuật',
      icon: GraduationCap,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      targetStyle: 'academic',
    },
    {
      id: 'creative',
      title: 'Creative',
      titleVi: 'Sáng Tạo',
      description: 'Artistic and expressive',
      descriptionVi: 'Nghệ thuật và biểu cảm',
      icon: Heart,
      color: 'text-pink-700',
      bgColor: 'bg-pink-50 hover:bg-pink-100',
      targetStyle: 'creative',
    },
    {
      id: 'technical',
      title: 'Technical',
      titleVi: 'Kỹ Thuật',
      description: 'Precise technical language',
      descriptionVi: 'Ngôn ngữ kỹ thuật chính xác',
      icon: Code,
      color: 'text-cyan-700',
      bgColor: 'bg-cyan-50 hover:bg-cyan-100',
      targetStyle: 'technical',
    },
    {
      id: 'localize',
      title: 'Localize',
      titleVi: 'Bản Địa Hóa',
      description: 'Adapt for local culture',
      descriptionVi: 'Thích ứng văn hóa địa phương',
      icon: Globe,
      color: 'text-orange-700',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      prompt: 'localize_content',
    },
  ]

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-2">
        {actions.slice(0, 4).map(action => (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onActionClick?.(action)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              transition-colors ${action.bgColor} ${action.color}
            `}
          >
            <action.icon className="w-4 h-4" />
            <span>{language === 'vi' ? action.titleVi : action.title}</span>
          </motion.button>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {actions.map(action => (
        <motion.button
          key={action.id}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onActionClick?.(action)}
          className={`
            p-4 rounded-xl text-left transition-all
            ${action.bgColor} border border-transparent
            hover:border-gray-200 hover:shadow-md
          `}
        >
          <action.icon className={`w-6 h-6 mb-2 ${action.color}`} />
          <h3 className={`font-medium text-sm ${action.color}`}>
            {language === 'vi' ? action.titleVi : action.title}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {language === 'vi' ? action.descriptionVi : action.description}
          </p>
        </motion.button>
      ))}
    </div>
  )
}
