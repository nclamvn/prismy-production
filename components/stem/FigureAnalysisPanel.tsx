/**
 * Phase 3.7-C: Figure Analysis Panel Component
 * 
 * Interactive component for viewing and managing detected scientific figures
 * Features figure preview, metadata editing, and export capabilities
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  Image,
  Eye,
  Download,
  Edit,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileImage,
  Vector,
  Palette,
  Tag,
  MapPin,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface FigureAnalysisData {
  id: string
  type: 'chart' | 'graph' | 'flowchart' | 'diagram' | 'illustration' | 'photo'
  confidence: number
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  caption?: {
    text: string
    confidence: number
  }
  metadata: {
    hasVector: boolean
    colorDepth: number
    complexity: 'simple' | 'medium' | 'complex'
    elements: Array<{
      type: 'axis' | 'data-series' | 'label' | 'legend' | 'annotation' | 'grid'
      count: number
    }>
  }
  outputs: {
    originalImage: string
    vectorSvg?: string
    processedImage?: string
  }
  analysis?: {
    chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'other'
    dataPoints?: number
    axes?: Array<{
      type: 'x' | 'y' | 'z'
      label?: string
      scale: 'linear' | 'logarithmic' | 'categorical'
    }>
    legend?: {
      position: 'top' | 'bottom' | 'left' | 'right' | 'center'
      items: Array<{
        label: string
        color?: string
      }>
    }
  }
}

interface FigureAnalysisPanelProps {
  figuresData: FigureAnalysisData[] | null
  isLoading: boolean
  onEditFigure?: (figureId: string) => void
  onExportFigure?: (figureId: string, format: 'svg' | 'png' | 'pdf') => void
  onUpdateMetadata?: (figureId: string, metadata: any) => void
}

export function FigureAnalysisPanel({
  figuresData,
  isLoading,
  onEditFigure,
  onExportFigure,
  onUpdateMetadata
}: FigureAnalysisPanelProps) {
  const [selectedFigure, setSelectedFigure] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid')
  const [filterType, setFilterType] = useState<string>('all')

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-status-success'
    if (confidence >= 0.6) return 'text-status-processing'
    return 'text-status-warning'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chart':
      case 'graph':
        return BarChart3
      case 'flowchart':
        return Activity
      case 'diagram':
        return MapPin
      default:
        return Image
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-status-success'
      case 'medium': return 'text-status-processing'
      case 'complex': return 'text-status-warning'
      default: return 'text-muted'
    }
  }

  const filteredFigures = figuresData?.filter(figure => 
    filterType === 'all' || figure.type === filterType
  ) || []

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredFigures.map((figure) => {
        const TypeIcon = getTypeIcon(figure.type)
        
        return (
          <div 
            key={figure.id} 
            className={`
              bg-workspace-canvas rounded-lg p-4 cursor-pointer transition-all border-2
              ${selectedFigure === figure.id ? 'border-primary bg-primary/5' : 'border-transparent hover:border-workspace-divider'}
            `}
            onClick={() => setSelectedFigure(figure.id)}
          >
            {/* Figure Preview */}
            <div className="aspect-video bg-workspace-panel rounded-lg mb-3 flex items-center justify-center">
              <TypeIcon className="h-8 w-8 text-muted" />
            </div>
            
            {/* Figure Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{figure.type}</span>
                <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(figure.confidence)}`}>
                  {Math.round(figure.confidence * 100)}%
                </span>
              </div>
              
              {figure.caption && (
                <p className="text-xs text-secondary line-clamp-2">
                  {figure.caption.text}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{figure.bounds.width}×{figure.bounds.height}</span>
                <div className="flex items-center space-x-1">
                  {figure.metadata.hasVector && (
                    <Vector className="h-3 w-3" />
                  )}
                  <span className={getComplexityColor(figure.metadata.complexity)}>
                    {figure.metadata.complexity}
                  </span>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center space-x-1 pt-2">
                <Button size="sm" variant="ghost" onClick={(e) => {
                  e.stopPropagation()
                  onEditFigure?.(figure.id)
                }}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={(e) => {
                  e.stopPropagation()
                  setViewMode('detail')
                  setSelectedFigure(figure.id)
                }}>
                  <Eye className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={(e) => {
                  e.stopPropagation()
                  onExportFigure?.(figure.id, 'svg')
                }}>
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderDetailView = () => {
    const figure = filteredFigures.find(f => f.id === selectedFigure)
    if (!figure) return null

    const TypeIcon = getTypeIcon(figure.type)

    return (
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => setViewMode('grid')}>
          ← Back to Grid
        </Button>
        
        {/* Figure Preview */}
        <div className="bg-workspace-canvas rounded-lg p-6">
          <div className="aspect-video bg-workspace-panel rounded-lg flex items-center justify-center mb-4">
            <TypeIcon className="h-16 w-16 text-muted" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold capitalize">{figure.type}</h3>
              <p className="text-sm text-secondary">
                {figure.bounds.width}×{figure.bounds.height} pixels
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline">
                <ZoomIn className="h-3 w-3 mr-2" />
                Zoom
              </Button>
              <Button size="sm" variant="outline" onClick={() => onExportFigure?.(figure.id, 'svg')}>
                <Download className="h-3 w-3 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
        
        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General Info */}
          <div className="bg-workspace-canvas rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-3">General Information</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary">Type:</span>
                <span className="capitalize">{figure.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Confidence:</span>
                <span className={getConfidenceColor(figure.confidence)}>
                  {Math.round(figure.confidence * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Complexity:</span>
                <span className={getComplexityColor(figure.metadata.complexity)}>
                  {figure.metadata.complexity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Vector:</span>
                <span className={figure.metadata.hasVector ? 'text-status-success' : 'text-muted'}>
                  {figure.metadata.hasVector ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Color Depth:</span>
                <span>{figure.metadata.colorDepth}-bit</span>
              </div>
            </div>
          </div>
          
          {/* Chart Analysis */}
          {figure.analysis && (
            <div className="bg-workspace-canvas rounded-lg p-4">
              <h4 className="font-semibold text-primary mb-3">Chart Analysis</h4>
              <div className="space-y-3">
                {figure.analysis.chartType && (
                  <div className="flex justify-between">
                    <span className="text-secondary">Chart Type:</span>
                    <span className="capitalize">{figure.analysis.chartType}</span>
                  </div>
                )}
                {figure.analysis.dataPoints && (
                  <div className="flex justify-between">
                    <span className="text-secondary">Data Points:</span>
                    <span>{figure.analysis.dataPoints}</span>
                  </div>
                )}
                {figure.analysis.axes && (
                  <div className="flex justify-between">
                    <span className="text-secondary">Axes:</span>
                    <span>{figure.analysis.axes.map(axis => axis.type.toUpperCase()).join(', ')}</span>
                  </div>
                )}
                {figure.analysis.legend && (
                  <div className="flex justify-between">
                    <span className="text-secondary">Legend:</span>
                    <span>{figure.analysis.legend.items.length} items</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Caption */}
        {figure.caption && (
          <div className="bg-workspace-canvas rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-3">Caption</h4>
            <p className="text-secondary">{figure.caption.text}</p>
            <p className="text-xs text-muted mt-2">
              Confidence: {Math.round(figure.caption.confidence * 100)}%
            </p>
          </div>
        )}
        
        {/* Elements */}
        {figure.metadata.elements.length > 0 && (
          <div className="bg-workspace-canvas rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-3">Detected Elements</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {figure.metadata.elements.map((element, index) => (
                <div key={index} className="text-center p-3 bg-workspace-panel rounded">
                  <div className="text-sm font-medium capitalize">{element.type}</div>
                  <div className="text-xs text-muted">{element.count}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="workspace-panel p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-status-processing rounded-lg flex items-center justify-center">
            <Image className="h-4 w-4 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">Figure Analysis</h2>
            <p className="text-sm text-secondary">Analyzing scientific figures...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="animate-pulse bg-workspace-canvas rounded-lg h-48"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!figuresData || figuresData.length === 0) {
    return (
      <div className="workspace-panel p-6">
        <div className="text-center py-8">
          <Image className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No Figures Detected</h3>
          <p className="text-secondary">Upload a document with scientific figures to see analysis results.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="workspace-panel">
      {/* Header */}
      <div className="p-6 border-b border-workspace-divider">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-status-success rounded-lg flex items-center justify-center">
              <Image className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">Figure Analysis</h2>
              <p className="text-sm text-secondary">
                {filteredFigures.length} figure{filteredFigures.length !== 1 ? 's' : ''} detected
              </p>
            </div>
          </div>
          
          {/* View Controls */}
          <div className="flex items-center space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border border-workspace-divider rounded px-3 py-1 bg-workspace-canvas"
            >
              <option value="all">All Types</option>
              <option value="chart">Charts</option>
              <option value="graph">Graphs</option>
              <option value="diagram">Diagrams</option>
              <option value="flowchart">Flowcharts</option>
              <option value="illustration">Illustrations</option>
            </select>
            
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'grid' ? renderGridView() : renderDetailView()}
      </div>
    </div>
  )
}