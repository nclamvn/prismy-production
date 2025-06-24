'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface FeedbackFormProps {
  translationId?: string
  documentId?: string
  type: 'translation' | 'document_analysis' | 'feature' | 'bug_report'
  onSubmit?: (feedbackId: string) => void
  onCancel?: () => void
  className?: string
}

export default function FeedbackForm({
  translationId,
  documentId,
  type,
  onSubmit,
  onCancel,
  className = ''
}: FeedbackFormProps) {
  const [rating, setRating] = useState<number>(0)
  const [feedback, setFeedback] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [suggestedImprovement, setSuggestedImprovement] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const categoryOptions = {
    translation: ['accuracy', 'fluency', 'terminology', 'context', 'speed'],
    document_analysis: ['accuracy', 'completeness', 'insights', 'speed', 'usability'],
    feature: ['usability', 'functionality', 'performance', 'design', 'accessibility'],
    bug_report: ['functionality', 'performance', 'ui', 'data_loss', 'security']
  }

  const severityOptions = [
    { value: 'low', label: 'Low', description: 'Minor issue or suggestion' },
    { value: 'medium', label: 'Medium', description: 'Affects usability' },
    { value: 'high', label: 'High', description: 'Significantly impacts workflow' },
    { value: 'critical', label: 'Critical', description: 'Prevents core functionality' }
  ]

  const handleCategoryToggle = (category: string) => {
    setCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0 || !feedback.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/quality/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          translationId,
          documentId,
          type,
          rating,
          feedback: feedback.trim(),
          categories,
          severity: type === 'bug_report' ? severity : undefined,
          suggestedImprovement: suggestedImprovement.trim() || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      const data = await response.json()
      
      setShowSuccess(true)
      
      setTimeout(() => {
        if (onSubmit) {
          onSubmit(data.feedbackId)
        }
      }, 2000)

    } catch (error) {
      console.error('Failed to submit feedback:', error)
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRatingLabel = (rating: number): string => {
    switch (rating) {
      case 1: return 'Very Poor'
      case 2: return 'Poor'
      case 3: return 'Fair'
      case 4: return 'Good'
      case 5: return 'Excellent'
      default: return 'Select Rating'
    }
  }

  if (showSuccess) {
    return (
      <motion.div
        className={`bg-white rounded-lg border border-gray-200 p-6 text-center ${className}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-16 h-16 mx-auto mb-4 text-green-500">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank You!</h3>
        <p className="text-gray-600">
          Your feedback has been submitted successfully. We appreciate your input to help us improve our service.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Provide Feedback
          </h3>
          <p className="text-sm text-gray-600">
            Help us improve by sharing your experience with our {type.replace('_', ' ')}.
          </p>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Overall Rating *
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`w-8 h-8 transition-colors ${
                  star <= rating
                    ? 'text-yellow-400 hover:text-yellow-500'
                    : 'text-gray-300 hover:text-gray-400'
                }`}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            <span className="ml-3 text-sm text-gray-600">
              {getRatingLabel(rating)}
            </span>
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What aspects would you like to comment on?
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categoryOptions[type].map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryToggle(category)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                  categories.includes(category)
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Severity (for bug reports) */}
        {type === 'bug_report' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Severity Level
            </label>
            <div className="space-y-2">
              {severityOptions.map((option) => (
                <label key={option.value} className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="severity"
                    value={option.value}
                    checked={severity === option.value}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-600">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Detailed Feedback *
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Please describe your experience, what worked well, what could be improved, or any issues you encountered..."
            required
          />
        </div>

        {/* Suggested Improvement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Suggested Improvement (Optional)
          </label>
          <textarea
            value={suggestedImprovement}
            onChange={(e) => setSuggestedImprovement(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="How do you think this could be improved? Any specific suggestions?"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={rating === 0 || !feedback.trim() || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}