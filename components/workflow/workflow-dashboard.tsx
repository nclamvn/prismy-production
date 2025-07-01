'use client'

/**
 * Workflow Dashboard Component
 * Overview and management of automation workflows
 */

import React, { useState, useEffect } from 'react'
import { 
  PlayIcon, 
  PauseIcon, 
  PencilIcon, 
  TrashIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useTranslation } from '@/lib/i18n/provider'
import { useFormatting } from '@/lib/i18n/hooks'
import { logger } from '@/lib/logger'

interface Workflow {
  id: string
  name: string
  description: string
  enabled: boolean
  triggers: any[]
  actions: any[]
  created_at: string
  updated_at: string
  execution_count?: number
  success_rate?: number
  last_execution?: string
  priority: number
}

interface WorkflowExecution {
  id: string
  workflow_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  started_at: string
  completed_at?: string
  triggered_by: string
  workflow_rules?: { name: string }
}

interface WorkflowDashboardProps {
  organizationId?: string
  onCreateWorkflow?: () => void
  onEditWorkflow?: (workflowId: string) => void
  onViewExecution?: (executionId: string) => void
}

export function WorkflowDashboard({ 
  organizationId,
  onCreateWorkflow,
  onEditWorkflow,
  onViewExecution
}: WorkflowDashboardProps) {
  const { t } = useTranslation('common')
  const { formatDate, formatRelativeTime } = useFormatting()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'workflows' | 'executions' | 'templates'>('workflows')
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)

  useEffect(() => {
    loadWorkflows()
    loadExecutions()
  }, [organizationId])

  const loadWorkflows = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ action: 'list' })
      if (organizationId) {
        params.append('organizationId', organizationId)
      }

      const response = await fetch(`/api/workflows?${params}`)
      if (!response.ok) throw new Error('Failed to load workflows')
      
      const data = await response.json()
      setWorkflows(data.workflows || [])
    } catch (error) {
      logger.error('Failed to load workflows', { error })
    } finally {
      setLoading(false)
    }
  }

  const loadExecutions = async () => {
    try {
      const params = new URLSearchParams({ 
        action: 'executions',
        limit: '50'
      })

      const response = await fetch(`/api/workflows?${params}`)
      if (!response.ok) throw new Error('Failed to load executions')
      
      const data = await response.json()
      setExecutions(data.executions || [])
    } catch (error) {
      logger.error('Failed to load executions', { error })
    }
  }

  const toggleWorkflow = async (workflowId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, enabled })
      })

      if (!response.ok) throw new Error('Failed to toggle workflow')
      
      await loadWorkflows()
    } catch (error) {
      logger.error('Failed to toggle workflow', { error })
    }
  }

  const executeWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          workflowId,
          context: {},
          triggeredBy: 'manual'
        })
      })

      if (!response.ok) throw new Error('Failed to execute workflow')
      
      const data = await response.json()
      logger.info('Workflow executed', { executionId: data.executionId })
      
      // Refresh executions
      setTimeout(() => loadExecutions(), 1000)
    } catch (error) {
      logger.error('Failed to execute workflow', { error })
    }
  }

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return

    try {
      const response = await fetch(`/api/workflows?workflowId=${workflowId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete workflow')
      
      await loadWorkflows()
    } catch (error) {
      logger.error('Failed to delete workflow', { error })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      case 'running':
        return 'text-blue-600 bg-blue-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'cancelled':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'failed':
        return <XCircleIcon className="w-4 h-4" />
      case 'running':
        return <ClockIcon className="w-4 h-4 animate-spin" />
      case 'pending':
        return <ExclamationTriangleIcon className="w-4 h-4" />
      default:
        return <ClockIcon className="w-4 h-4" />
    }
  }

  const WorkflowsTab = () => (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {workflows.length}
              </div>
              <div className="text-sm text-gray-500">Total Workflows</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {workflows.filter(w => w.enabled).length}
              </div>
              <div className="text-sm text-gray-500">Active Workflows</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PlayIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {executions.filter(e => e.status === 'running').length}
              </div>
              <div className="text-sm text-gray-500">Running Now</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(
                  executions.filter(e => e.status === 'completed').length /
                  Math.max(executions.length, 1) * 100
                )}%
              </div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Workflows</h3>
            <button
              onClick={onCreateWorkflow}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Workflow
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Triggers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Execution
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workflows.map((workflow) => (
                <tr key={workflow.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {workflow.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {workflow.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workflow.enabled ? 'text-green-800 bg-green-100' : 'text-gray-800 bg-gray-100'
                    }`}>
                      {workflow.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workflow.triggers.length} trigger{workflow.triggers.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workflow.last_execution ? 
                      formatRelativeTime(workflow.last_execution) : 
                      'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => executeWorkflow(workflow.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Execute workflow"
                      >
                        <PlayIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleWorkflow(workflow.id, !workflow.enabled)}
                        className="text-gray-600 hover:text-gray-900"
                        title={workflow.enabled ? 'Disable workflow' : 'Enable workflow'}
                      >
                        {workflow.enabled ? 
                          <PauseIcon className="w-4 h-4" /> : 
                          <PlayIcon className="w-4 h-4" />
                        }
                      </button>
                      <button
                        onClick={() => onEditWorkflow?.(workflow.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit workflow"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteWorkflow(workflow.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete workflow"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {workflows.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500">No workflows found</div>
              <button
                onClick={onCreateWorkflow}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Create your first workflow
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const ExecutionsTab = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Executions</h3>
      </div>

      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Workflow
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Triggered By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Started
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {executions.map((execution) => (
              <tr key={execution.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {execution.workflow_rules?.name || 'Unknown Workflow'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                    {getStatusIcon(execution.status)}
                    <span className="ml-1">{execution.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {execution.triggered_by}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatRelativeTime(execution.started_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {execution.completed_at ? 
                    `${Math.round((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000)}s` :
                    'Running...'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onViewExecution?.(execution.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {executions.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">No executions found</div>
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Workflow Automation</h1>
        <p className="mt-2 text-gray-600">
          Automate your document processing with intelligent workflows
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('workflows')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'workflows'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Workflows ({workflows.length})
          </button>
          <button
            onClick={() => setActiveTab('executions')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'executions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Executions ({executions.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'workflows' && <WorkflowsTab />}
      {activeTab === 'executions' && <ExecutionsTab />}
    </div>
  )
}