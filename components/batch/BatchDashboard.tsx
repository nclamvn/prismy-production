/**
 * BatchDashboard - Phase 3.5-B
 * Main dashboard for batch management with overview and detailed views
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus,
  FolderOpen,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Grid3X3,
  List,
  Search,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useBatchDrop } from './BatchDropProvider'
import { BatchView } from './BatchView'

interface BatchDashboardProps {
  className?: string
}

export function BatchDashboard({ className = '' }: BatchDashboardProps) {
  const { batches, createBatch, setActiveBatch, activeBatch } = useBatchDrop()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  
  // Filter batches based on search and status
  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter
    return matchesSearch && matchesStatus
  })
  
  // Calculate dashboard stats
  const stats = {
    total: batches.length,
    pending: batches.filter(b => b.status === 'pending').length,
    processing: batches.filter(b => b.status === 'processing').length,
    completed: batches.filter(b => b.status === 'completed').length,
    failed: batches.filter(b => b.status === 'failed').length
  }
  
  const handleCreateBatch = async () => {
    // Open file picker
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = '.pdf,.docx,.txt,.md'
    
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length > 0) {
        try {
          await createBatch(files)
        } catch (error) {
          console.error('Failed to create batch:', error)
        }
      }
    }
    
    input.click()
  }
  
  const handleViewBatch = (batchId: string) => {
    setSelectedBatchId(batchId)
    setActiveBatch(batchId)
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'text-status-processing'
      case 'completed':
        return 'text-status-success'
      case 'failed':
        return 'text-status-error'
      case 'pending':
        return 'text-status-queued'
      default:
        return 'text-muted'
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-status-processing animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-status-success" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-status-error" />
      default:
        return <Clock className="h-4 w-4 text-status-queued" />
    }
  }
  
  // If a specific batch is selected, show the detailed view
  if (selectedBatchId) {
    return (
      <BatchView 
        batchId={selectedBatchId} 
        onClose={() => setSelectedBatchId(null)}
      />
    )
  }
  
  return (
    <div className={`flex flex-col h-full bg-workspace-panel ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-workspace-divider">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Batch Processing</h1>
            <p className="text-secondary">Manage and monitor your document processing batches</p>
          </div>
          <Button onClick={handleCreateBatch} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Create Batch
          </Button>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-workspace-canvas rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Total</p>
                <p className="text-2xl font-semibold text-primary">{stats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted" />
            </div>
          </div>
          
          <div className="bg-workspace-canvas rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Processing</p>
                <p className="text-2xl font-semibold text-status-processing">{stats.processing}</p>
              </div>
              <Clock className="h-8 w-8 text-status-processing" />
            </div>
          </div>
          
          <div className="bg-workspace-canvas rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Completed</p>
                <p className="text-2xl font-semibold text-status-success">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-status-success" />
            </div>
          </div>
          
          <div className="bg-workspace-canvas rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Failed</p>
                <p className="text-2xl font-semibold text-status-error">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-status-error" />
            </div>
          </div>
          
          <div className="bg-workspace-canvas rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Success Rate</p>
                <p className="text-2xl font-semibold text-primary">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="p-4 border-b border-workspace-divider bg-workspace-canvas">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search batches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-workspace-border rounded-md bg-workspace-panel text-sm"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-workspace-border rounded px-3 py-2 bg-workspace-panel"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
          
          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Batch List/Grid */}
      <div className="flex-1 overflow-auto p-6">
        {filteredBatches.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">
              {batches.length === 0 ? 'No batches yet' : 'No batches found'}
            </h3>
            <p className="text-secondary mb-6">
              {batches.length === 0 
                ? 'Create your first batch by uploading files or dragging them anywhere on the page.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {batches.length === 0 && (
              <Button onClick={handleCreateBatch}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Batch
              </Button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredBatches.map((batch) => (
              <div
                key={batch.id}
                className={`
                  bg-workspace-canvas border border-workspace-border rounded-lg p-6 
                  hover:border-primary cursor-pointer transition-colors
                  ${viewMode === 'list' ? 'flex items-center justify-between' : ''}
                `}
                onClick={() => handleViewBatch(batch.id)}
              >
                <div className={viewMode === 'list' ? 'flex items-center space-x-4' : ''}>
                  <div className={viewMode === 'list' ? '' : 'mb-4'}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-primary">{batch.name}</h3>
                      {viewMode === 'grid' && (
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(batch.status)}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-secondary">
                      {batch.files.length} files • Created {formatDate(batch.createdAt)}
                    </p>
                  </div>
                  
                  {viewMode === 'list' && (
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(batch.status)}
                        <span className={`text-sm capitalize ${getStatusColor(batch.status)}`}>
                          {batch.status}
                        </span>
                      </div>
                      <span className="text-sm text-secondary">
                        {batch.files.length} files
                      </span>
                    </div>
                  )}
                </div>
                
                {viewMode === 'grid' && (
                  <>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-secondary">Progress</span>
                        <span className="text-secondary">
                          {Math.round(batch.files.reduce((sum, f) => sum + f.progress, 0) / batch.files.length)}%
                        </span>
                      </div>
                      <div className="w-full bg-workspace-panel rounded-full overflow-hidden">
                        <div 
                          className="h-2 bg-status-processing transition-all duration-500"
                          style={{ 
                            width: `${batch.files.reduce((sum, f) => sum + f.progress, 0) / batch.files.length}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(batch.status)}
                        <span className={`text-sm capitalize ${getStatusColor(batch.status)}`}>
                          {batch.status}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}