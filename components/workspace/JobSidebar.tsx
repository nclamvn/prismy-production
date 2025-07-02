'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
  MoreVertical, 
  Play, 
  Pause, 
  RotateCcw,
  Download,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface JobSidebarProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

interface Job {
  id: string
  title: string
  type: 'translation' | 'processing' | 'analysis' | 'file-processing' | 'document-translation'
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'retrying'
  progress: number
  createdAt: string
  estimatedTime?: string
  fileCount?: number
  outputFiles?: string[]
  currentStep?: string
  totalSteps?: number
  message?: string
}

/**
 * JobSidebar - Right sidebar for job management
 * 320px width, contains active jobs, queue, and job controls
 */
export function JobSidebar({ 
  isOpen = true,
  onClose,
  className = ''
}: JobSidebarProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch jobs from API
  useEffect(() => {
    let mounted = true
    let pollInterval: NodeJS.Timeout

    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs/queue')
        if (response.ok) {
          const data = await response.json()
          if (mounted && data.success) {
            // Transform API jobs to our Job interface
            const transformedJobs = data.recentJobs.map((apiJob: any) => ({
              id: apiJob.id,
              title: getJobTitle(apiJob.type, apiJob.id),
              type: apiJob.type,
              status: apiJob.status,
              progress: apiJob.progress || 0,
              createdAt: formatRelativeTime(apiJob.created_at),
              currentStep: apiJob.current_step,
              totalSteps: apiJob.total_steps,
              message: apiJob.progress_message,
              fileCount: 1, // Default for now
            }))
            setJobs(transformedJobs)
          }
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchJobs()

    // Poll for updates every 3 seconds
    if (isOpen) {
      pollInterval = setInterval(fetchJobs, 3000)
    }

    return () => {
      mounted = false
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [isOpen])

  const getJobTitle = (type: string, jobId: string) => {
    switch (type) {
      case 'file-processing':
        return 'File Processing'
      case 'document-translation':
        return 'Document Translation'
      case 'document-analysis':
        return 'Document Analysis'
      default:
        return `Job ${jobId.slice(0, 8)}`
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-status-processing animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-status-success" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-status-error" />
      case 'queued':
        return <AlertCircle className="h-4 w-4 text-status-queued" />
      case 'cancelled':
        return <X className="h-4 w-4 text-status-idle" />
      case 'retrying':
        return <RotateCcw className="h-4 w-4 text-status-warning animate-spin" />
      default:
        return null
    }
  }

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'processing':
        return 'text-status-processing'
      case 'completed':
        return 'text-status-success'
      case 'failed':
        return 'text-status-error'
      case 'queued':
        return 'text-status-queued'
      case 'cancelled':
        return 'text-status-idle'
      case 'retrying':
        return 'text-status-warning'
      default:
        return 'text-muted'
    }
  }

  if (!isOpen) return null

  return (
    <aside className={`w-job-sidebar bg-workspace-panel border-l border-workspace-border flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-workspace-divider">
        <h2 className="font-semibold text-primary">Jobs & Tasks</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="p-1 h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Job Queue */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Active Jobs */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-secondary mb-3">Active Jobs</h3>
            <div className="space-y-3">
              {jobs.filter(job => ['processing', 'queued'].includes(job.status)).map((job) => (
                <div key={job.id} className="job-card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(job.status)}
                      <h4 className="text-sm font-medium text-primary truncate">{job.title}</h4>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {/* Progress bar */}
                    {job.status === 'processing' && (
                      <div className="w-full bg-workspace-canvas rounded-full overflow-hidden">
                        <div 
                          className="h-2 bg-status-processing transition-all duration-500"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    )}

                    <div className="flex justify-between text-xs text-muted">
                      <span>{job.fileCount} file{job.fileCount !== 1 ? 's' : ''}</span>
                      <span className={getStatusColor(job.status)}>{job.status}</span>
                    </div>

                    {job.estimatedTime && (
                      <div className="text-xs text-muted">{job.estimatedTime}</div>
                    )}

                    {/* Job actions */}
                    <div className="flex items-center space-x-1 pt-1">
                      {job.status === 'processing' && (
                        <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                          <Pause className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {job.status === 'paused' && (
                        <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                          <Play className="h-3 w-3" />
                        </Button>
                      )}

                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                        <RotateCcw className="h-3 w-3" />
                      </Button>

                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6 text-status-error">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Jobs */}
          <div>
            <h3 className="text-sm font-medium text-secondary mb-3">Recent Completed</h3>
            <div className="space-y-3">
              {jobs.filter(job => ['completed', 'failed', 'cancelled'].includes(job.status)).map((job) => (
                <div key={job.id} className="job-card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(job.status)}
                      <h4 className="text-sm font-medium text-primary truncate">{job.title}</h4>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted">
                      <span>{job.fileCount} file{job.fileCount !== 1 ? 's' : ''}</span>
                      <span className={getStatusColor(job.status)}>{job.status}</span>
                    </div>

                    <div className="text-xs text-muted">{job.createdAt}</div>

                    {/* Output files */}
                    {job.outputFiles && job.outputFiles.length > 0 && (
                      <div className="pt-1">
                        {job.outputFiles.map((file, index) => (
                          <div key={index} className="output-chip flex items-center space-x-1 mb-1">
                            <FileText className="h-3 w-3 text-muted" />
                            <span className="text-xs text-secondary truncate flex-1">{file}</span>
                            <Button variant="ghost" size="sm" className="p-0.5 h-4 w-4">
                              <Download className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Job actions */}
                    <div className="flex items-center space-x-1 pt-1">
                      {job.status === 'completed' && (
                        <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                          <Download className="h-3 w-3" />
                        </Button>
                      )}

                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                        <RotateCcw className="h-3 w-3" />
                      </Button>

                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6 text-status-error">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-workspace-divider">
        <div className="text-xs text-muted text-center">
          {jobs.filter(j => j.status === 'processing').length} active • {jobs.filter(j => j.status === 'queued').length} queued
        </div>
      </div>
    </aside>
  )
}