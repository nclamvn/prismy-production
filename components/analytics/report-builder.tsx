'use client'

/**
 * Report Builder Component
 * Create and schedule custom analytics reports
 */

import React, { useState, useEffect } from 'react'
import {
  DocumentArrowDownIcon,
  ClockIcon,
  EnvelopeIcon,
  ChartBarIcon,
  TableCellsIcon,
  CalendarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { useTranslation } from '@/lib/i18n/provider'
import { logger } from '@/lib/logger'

interface ReportBuilderProps {
  organizationId?: string
  onReportCreated?: (reportId: string) => void
  onClose?: () => void
}

interface MetricDefinition {
  id: string
  name: string
  category: string
  description: string
}

interface ReportConfig {
  name: string
  description: string
  metrics: string[]
  dimensions: string[]
  filters: Record<string, any>
  format: 'pdf' | 'excel' | 'csv' | 'json'
  schedule?: {
    type: 'daily' | 'weekly' | 'monthly'
    time: string
    dayOfWeek?: number
    dayOfMonth?: number
  }
  recipients: string[]
  organizationId?: string
}

export function ReportBuilder({ organizationId, onReportCreated, onClose }: ReportBuilderProps) {
  const { t } = useTranslation('common')
  const [step, setStep] = useState(1)
  const [availableMetrics, setAvailableMetrics] = useState<MetricDefinition[]>([])
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    description: '',
    metrics: [],
    dimensions: [],
    filters: {},
    format: 'pdf',
    recipients: [],
    organizationId
  })
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any>(null)

  useEffect(() => {
    loadAvailableMetrics()
  }, [])

  const loadAvailableMetrics = async () => {
    try {
      const response = await fetch('/api/analytics?action=metrics')
      if (!response.ok) throw new Error('Failed to load metrics')
      
      const data = await response.json()
      setAvailableMetrics(data.metrics || [])
    } catch (error) {
      logger.error('Failed to load metrics', { error })
    }
  }

  const generatePreview = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        action: 'query',
        metrics: reportConfig.metrics.join(','),
        dimensions: reportConfig.dimensions.join(','),
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        granularity: 'day'
      })

      if (organizationId) {
        params.append('organizationId', organizationId)
      }

      const response = await fetch(`/api/analytics?${params}`)
      if (!response.ok) throw new Error('Failed to generate preview')
      
      const data = await response.json()
      setPreview(data)
    } catch (error) {
      logger.error('Failed to generate preview', { error })
    } finally {
      setLoading(false)
    }
  }

  const createReport = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...reportConfig,
          type: reportConfig.schedule ? 'scheduled' : 'adhoc'
        })
      })

      if (!response.ok) throw new Error('Failed to create report')
      
      const data = await response.json()
      onReportCreated?.(data.reportId)
      onClose?.()
    } catch (error) {
      logger.error('Failed to create report', { error })
    } finally {
      setLoading(false)
    }
  }

  const MetricsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Metrics</h3>
        <p className="text-sm text-gray-600 mb-6">
          Choose the metrics you want to include in your report
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['usage', 'performance', 'business', 'quality', 'security'].map(category => {
          const categoryMetrics = availableMetrics.filter(m => m.category === category)
          
          return (
            <div key={category} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 capitalize">
                {category} Metrics
              </h4>
              <div className="space-y-2">
                {categoryMetrics.map(metric => (
                  <label key={metric.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={reportConfig.metrics.includes(metric.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setReportConfig(prev => ({
                            ...prev,
                            metrics: [...prev.metrics, metric.id]
                          }))
                        } else {
                          setReportConfig(prev => ({
                            ...prev,
                            metrics: prev.metrics.filter(id => id !== metric.id)
                          }))
                        }
                      }}
                      className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{metric.name}</div>
                      <div className="text-xs text-gray-500">{metric.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const ConfigurationStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Configuration</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure your report details and output format
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Name
          </label>
          <input
            type="text"
            value={reportConfig.name}
            onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter report name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output Format
          </label>
          <select
            value={reportConfig.format}
            onChange={(e) => setReportConfig(prev => ({ 
              ...prev, 
              format: e.target.value as 'pdf' | 'excel' | 'csv' | 'json' 
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pdf">PDF Document</option>
            <option value="excel">Excel Spreadsheet</option>
            <option value="csv">CSV File</option>
            <option value="json">JSON Data</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={reportConfig.description}
          onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dimensions (Optional)
        </label>
        <input
          type="text"
          value={reportConfig.dimensions.join(', ')}
          onChange={(e) => setReportConfig(prev => ({ 
            ...prev, 
            dimensions: e.target.value.split(',').map(d => d.trim()).filter(Boolean)
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="user_id, organization_id, document_type"
        />
        <p className="text-xs text-gray-500 mt-1">
          Comma-separated list of dimensions to group by
        </p>
      </div>
    </div>
  )

  const ScheduleStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule & Recipients</h3>
        <p className="text-sm text-gray-600 mb-6">
          Set up automatic report generation and delivery
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-4">
          <input
            type="checkbox"
            checked={!!reportConfig.schedule}
            onChange={(e) => {
              if (e.target.checked) {
                setReportConfig(prev => ({
                  ...prev,
                  schedule: {
                    type: 'weekly',
                    time: '09:00'
                  }
                }))
              } else {
                setReportConfig(prev => ({ ...prev, schedule: undefined }))
              }
            }}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <ClockIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">Schedule automatic reports</span>
        </div>

        {reportConfig.schedule && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-7">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={reportConfig.schedule.type}
                onChange={(e) => setReportConfig(prev => ({
                  ...prev,
                  schedule: {
                    ...prev.schedule!,
                    type: e.target.value as 'daily' | 'weekly' | 'monthly'
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={reportConfig.schedule.time}
                onChange={(e) => setReportConfig(prev => ({
                  ...prev,
                  schedule: {
                    ...prev.schedule!,
                    time: e.target.value
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {reportConfig.schedule.type === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Week
                </label>
                <select
                  value={reportConfig.schedule.dayOfWeek || 1}
                  onChange={(e) => setReportConfig(prev => ({
                    ...prev,
                    schedule: {
                      ...prev.schedule!,
                      dayOfWeek: parseInt(e.target.value)
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={0}>Sunday</option>
                </select>
              </div>
            )}

            {reportConfig.schedule.type === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Month
                </label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={reportConfig.schedule.dayOfMonth || 1}
                  onChange={(e) => setReportConfig(prev => ({
                    ...prev,
                    schedule: {
                      ...prev.schedule!,
                      dayOfMonth: parseInt(e.target.value)
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <EnvelopeIcon className="w-4 h-4 inline mr-2" />
          Email Recipients
        </label>
        <textarea
          value={reportConfig.recipients.join('\n')}
          onChange={(e) => setReportConfig(prev => ({
            ...prev,
            recipients: e.target.value.split('\n').map(email => email.trim()).filter(Boolean)
          }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter email addresses (one per line)"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter one email address per line
        </p>
      </div>
    </div>
  )

  const PreviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preview & Create</h3>
        <p className="text-sm text-gray-600 mb-6">
          Review your report configuration and see a data preview
        </p>
      </div>

      {/* Configuration Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Report Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Name:</span>
            <span className="ml-2 text-gray-900">{reportConfig.name || 'Untitled Report'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Format:</span>
            <span className="ml-2 text-gray-900">{reportConfig.format.toUpperCase()}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Metrics:</span>
            <span className="ml-2 text-gray-900">{reportConfig.metrics.length} selected</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Schedule:</span>
            <span className="ml-2 text-gray-900">
              {reportConfig.schedule ? 
                `${reportConfig.schedule.type} at ${reportConfig.schedule.time}` : 
                'One-time report'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Data Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Data Preview</h4>
          <button
            onClick={generatePreview}
            disabled={loading || reportConfig.metrics.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Preview'}
          </button>
        </div>

        {preview ? (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    {reportConfig.metrics.map(metric => (
                      <th key={metric} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {metric.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.data?.slice(0, 5).map((row: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.date || row._period || 'N/A'}
                      </td>
                      {reportConfig.metrics.map(metric => (
                        <td key={metric} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row[metric] || 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.data?.length > 5 && (
              <p className="text-xs text-gray-500 mt-2">
                Showing first 5 rows of {preview.data.length} total rows
              </p>
            )}
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            Click "Generate Preview" to see sample data
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Create Analytics Report</h2>
        <p className="mt-2 text-gray-600">
          Build custom reports with your analytics data
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {[
              { id: 1, name: 'Metrics', icon: ChartBarIcon },
              { id: 2, name: 'Configuration', icon: AdjustmentsHorizontalIcon },
              { id: 3, name: 'Schedule', icon: CalendarIcon },
              { id: 4, name: 'Preview', icon: DocumentArrowDownIcon }
            ].map((stepItem, stepIdx) => (
              <li key={stepItem.name} className={`${stepIdx !== 3 ? 'pr-8 sm:pr-20' : ''} relative`}>
                <div className="flex items-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    step >= stepItem.id 
                      ? 'border-blue-600 bg-blue-600' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    <stepItem.icon className={`h-6 w-6 ${
                      step >= stepItem.id ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <span className={`ml-4 text-sm font-medium ${
                    step >= stepItem.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {stepItem.name}
                  </span>
                </div>
                {stepIdx !== 3 && (
                  <div className="absolute top-5 right-0 hidden h-0.5 w-full bg-gray-200 sm:block">
                    <div className={`h-0.5 ${step > stepItem.id ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        {step === 1 && <MetricsStep />}
        {step === 2 && <ConfigurationStep />}
        {step === 3 && <ScheduleStep />}
        {step === 4 && <PreviewStep />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : onClose?.()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          {step === 1 ? 'Cancel' : 'Previous'}
        </button>

        <div className="flex space-x-3">
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && reportConfig.metrics.length === 0) ||
                (step === 2 && !reportConfig.name.trim())
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={createReport}
              disabled={loading || reportConfig.metrics.length === 0 || !reportConfig.name.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}