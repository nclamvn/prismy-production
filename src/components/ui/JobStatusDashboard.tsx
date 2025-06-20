'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { backgroundQueue, ProcessingJob, QueueStats } from '@/src/lib/background-processing-queue'
import { useAuth } from '@/contexts/AuthContext'

interface JobStatusDashboardProps {
  className?: string
}

export default function JobStatusDashboard({ className = '' }: JobStatusDashboardProps) {
  const [jobs, setJobs] = useState<ProcessingJob[]>([])
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'all'>('active')
  const { user } = useAuth()

  // Refresh data
  const refreshData = () => {
    if (user?.id) {
      const userJobs = backgroundQueue.getUserJobs(user.id)
      setJobs(userJobs)
    }
    const queueStats = backgroundQueue.getStats()
    setStats(queueStats)
  }

  // Subscribe to job updates
  useEffect(() => {
    refreshData()

    const handleJobUpdate = (job: ProcessingJob) => {
      if (job.userId === user?.id) {
        refreshData()
      }
    }

    backgroundQueue.onJobUpdate('started', handleJobUpdate)
    backgroundQueue.onJobUpdate('progress', handleJobUpdate)
    backgroundQueue.onJobUpdate('completed', handleJobUpdate)
    backgroundQueue.onJobUpdate('failed', handleJobUpdate)
    backgroundQueue.onJobUpdate('cancelled', handleJobUpdate)

    // Refresh every 30 seconds
    const interval = setInterval(refreshData, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [user?.id])

  const filteredJobs = jobs.filter(job => {
    switch (selectedTab) {
      case 'active':
        return job.status === 'pending' || job.status === 'processing'
      case 'completed':
        return job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled'
      default:
        return true
    }
  })

  const handleRetryJob = (jobId: string) => {
    backgroundQueue.retryJob(jobId)
    refreshData()
  }

  const handleCancelJob = (jobId: string) => {
    backgroundQueue.cancelJob(jobId)
    refreshData()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'failed': return 'text-red-600 bg-red-50 border-red-200'
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'processing': return '⚙️'
      case 'pending': return '⏳'
      case 'failed': return '❌'
      case 'cancelled': return '🚫'
      default: return '❓'
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Background Processing Jobs</h2>
          <button
            onClick={refreshData}
            className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Refresh
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalJobs}</div>
              <div className="text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingJobs}</div>
              <div className="text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.processingJobs}</div>
              <div className="text-gray-600">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedJobs}</div>
              <div className="text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failedJobs}</div>
              <div className="text-gray-600">Failed</div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'active', label: 'Active Jobs', count: jobs.filter(j => j.status === 'pending' || j.status === 'processing').length },
              { key: 'completed', label: 'Completed', count: jobs.filter(j => j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled').length },
              { key: 'all', label: 'All Jobs', count: jobs.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Job List */}
        <div className="p-6">
          <AnimatePresence>
            {filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No jobs found for the selected filter.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`border rounded-lg p-4 ${getStatusColor(job.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-lg">{getStatusIcon(job.status)}</span>
                          <h3 className="font-medium">
                            {job.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            job.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            job.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            job.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.priority}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">Created:</span>
                            <div className="font-medium">
                              {new Date(job.createdAt).toLocaleString()}
                            </div>
                          </div>
                          
                          {job.metadata.filename && (
                            <div>
                              <span className="text-gray-600">File:</span>
                              <div className="font-medium truncate">
                                {job.metadata.filename}
                              </div>
                            </div>
                          )}
                          
                          {job.metadata.fileSize && (
                            <div>
                              <span className="text-gray-600">Size:</span>
                              <div className="font-medium">
                                {formatFileSize(job.metadata.fileSize)}
                              </div>
                            </div>
                          )}
                          
                          {job.actualDuration && (
                            <div>
                              <span className="text-gray-600">Duration:</span>
                              <div className="font-medium">
                                {formatDuration(job.actualDuration)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {job.progress !== undefined && job.status === 'processing' && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{job.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Error Message */}
                        {job.error && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{job.error}</p>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Job ID: {job.id}
                          {job.retryCount > 0 && ` • Retry ${job.retryCount}/${job.maxRetries}`}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 ml-4">
                        {(job.status === 'pending' || job.status === 'processing') && (
                          <button
                            onClick={() => handleCancelJob(job.id)}
                            className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        
                        {job.status === 'failed' && job.retryCount < job.maxRetries && (
                          <button
                            onClick={() => handleRetryJob(job.id)}
                            className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}