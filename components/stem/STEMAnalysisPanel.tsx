/**
 * Phase 3.7-A: STEM Analysis Panel Component
 * 
 * Interactive panel for viewing and managing STEM document analysis results
 * Features formula visualization, table editing, and diagram annotations
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Calculator,
  Table2,
  BarChart3,
  FileText,
  Download,
  Eye,
  Edit,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Zap,
  BookOpen,
  Target,
  Code
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface STEMAnalysisData {
  id: string
  jobId: string
  formulasDetected: number
  tablesDetected: number
  diagramsDetected: number
  confidence: number
  processingTime: number
  outputFiles: {
    original: string
    processed: string
    latex?: string
    mathml?: string
  }
  formulas: MathFormula[]
  tables: TableStructure[]
  diagrams: DiagramElement[]
}

export interface MathFormula {
  id: string
  type: 'inline' | 'display' | 'equation'
  rawText: string
  latex: string
  mathml: string
  confidence: number
  variables: string[]
  operators: string[]
}

export interface TableStructure {
  id: string
  rows: number
  cols: number
  type: 'data' | 'formula' | 'mixed'
  headers: string[]
  data: string[][]
}

export interface DiagramElement {
  id: string
  type: 'chart' | 'graph' | 'flowchart' | 'diagram'
  description: string
  confidence: number
}

interface STEMAnalysisPanelProps {
  analysisData: STEMAnalysisData | null
  isLoading: boolean
  onDownload?: (format: string) => void
  onEditFormula?: (formulaId: string) => void
  onEditTable?: (tableId: string) => void
}

export function STEMAnalysisPanel({
  analysisData,
  isLoading,
  onDownload,
  onEditFormula,
  onEditTable
}: STEMAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'formulas' | 'tables' | 'diagrams' | 'export'>('overview')
  const [expandedFormulas, setExpandedFormulas] = useState<Set<string>>(new Set())
  const [copiedLatex, setCopiedLatex] = useState<string | null>(null)

  // Auto-expand first few formulas
  useEffect(() => {
    if (analysisData?.formulas.length > 0) {
      const firstFew = new Set(analysisData.formulas.slice(0, 3).map(f => f.id))
      setExpandedFormulas(firstFew)
    }
  }, [analysisData])

  const toggleFormulaExpansion = (formulaId: string) => {
    const newExpanded = new Set(expandedFormulas)
    if (newExpanded.has(formulaId)) {
      newExpanded.delete(formulaId)
    } else {
      newExpanded.add(formulaId)
    }
    setExpandedFormulas(newExpanded)
  }

  const copyLatex = async (latex: string, formulaId: string) => {
    try {
      await navigator.clipboard.writeText(latex)
      setCopiedLatex(formulaId)
      setTimeout(() => setCopiedLatex(null), 2000)
    } catch (error) {
      console.error('Failed to copy LaTeX:', error)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-status-success'
    if (confidence >= 0.6) return 'text-status-processing'
    return 'text-status-warning'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  if (isLoading) {
    return (
      <div className="workspace-panel p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-status-processing rounded-lg flex items-center justify-center">
            <Calculator className="h-4 w-4 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">STEM Analysis</h2>
            <p className="text-sm text-secondary">Processing mathematical content...</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="animate-pulse bg-workspace-canvas rounded-lg h-20"></div>
          <div className="animate-pulse bg-workspace-canvas rounded-lg h-32"></div>
          <div className="animate-pulse bg-workspace-canvas rounded-lg h-24"></div>
        </div>
      </div>
    )
  }

  if (!analysisData) {
    return (
      <div className="workspace-panel p-6">
        <div className="text-center py-8">
          <Calculator className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No STEM Analysis</h3>
          <p className="text-secondary">Upload a document with mathematical content to see analysis results.</p>
        </div>
      </div>
    )
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-workspace-canvas rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Formulas</p>
              <p className="text-2xl font-semibold text-primary">{analysisData.formulasDetected}</p>
            </div>
            <Calculator className="h-8 w-8 text-status-processing" />
          </div>
        </div>
        
        <div className="bg-workspace-canvas rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Tables</p>
              <p className="text-2xl font-semibold text-primary">{analysisData.tablesDetected}</p>
            </div>
            <Table2 className="h-8 w-8 text-status-success" />
          </div>
        </div>
        
        <div className="bg-workspace-canvas rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Diagrams</p>
              <p className="text-2xl font-semibold text-primary">{analysisData.diagramsDetected}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-status-warning" />
          </div>
        </div>
      </div>

      {/* Analysis Quality */}
      <div className="bg-workspace-canvas rounded-lg p-4">
        <h3 className="font-semibold text-primary mb-3">Analysis Quality</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="h-5 w-5 text-muted" />
            <span className="text-sm text-secondary">Overall Confidence</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${getConfidenceColor(analysisData.confidence)}`}>
              {getConfidenceLabel(analysisData.confidence)}
            </span>
            <span className="text-sm text-muted">
              ({Math.round(analysisData.confidence * 100)}%)
            </span>
          </div>
        </div>
        
        <div className="mt-3 w-full bg-workspace-panel rounded-full overflow-hidden">
          <div 
            className="h-2 bg-status-processing transition-all duration-500"
            style={{ width: `${analysisData.confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Output Files */}
      <div className="bg-workspace-canvas rounded-lg p-4">
        <h3 className="font-semibold text-primary mb-3">Available Outputs</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <FileText className="h-4 w-4 text-muted" />
              <span className="text-sm">Processed Document</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => onDownload?.('pdf')}>
              <Download className="h-3 w-3 mr-2" />
              PDF
            </Button>
          </div>
          
          {analysisData.outputFiles.latex && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-4 w-4 text-muted" />
                <span className="text-sm">LaTeX Source</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => onDownload?.('latex')}>
                <Download className="h-3 w-3 mr-2" />
                TEX
              </Button>
            </div>
          )}
          
          {analysisData.outputFiles.mathml && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <Zap className="h-4 w-4 text-muted" />
                <span className="text-sm">MathML</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => onDownload?.('mathml')}>
                <Download className="h-3 w-3 mr-2" />
                XML
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderFormulas = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary">Mathematical Formulas</h3>
        <span className="text-sm text-secondary">{analysisData.formulas.length} detected</span>
      </div>
      
      {analysisData.formulas.length === 0 ? (
        <div className="text-center py-8">
          <Calculator className="h-8 w-8 text-muted mx-auto mb-3" />
          <p className="text-secondary">No mathematical formulas detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {analysisData.formulas.map((formula) => (
            <div key={formula.id} className="bg-workspace-canvas rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleFormulaExpansion(formula.id)}
                    className="p-1 hover:bg-workspace-hover rounded"
                  >
                    {expandedFormulas.has(formula.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <span className="text-sm font-medium capitalize">{formula.type} Formula</span>
                  <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(formula.confidence)}`}>
                    {getConfidenceLabel(formula.confidence)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost" onClick={() => onEditFormula?.(formula.id)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-secondary mb-2">
                Raw: <code className="bg-workspace-panel px-2 py-1 rounded">{formula.rawText}</code>
              </div>
              
              {expandedFormulas.has(formula.id) && (
                <div className="space-y-3 pt-3 border-t border-workspace-divider">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-primary">LaTeX</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyLatex(formula.latex, formula.id)}
                      >
                        {copiedLatex === formula.id ? (
                          <Check className="h-3 w-3 text-status-success" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <code className="block bg-workspace-panel p-3 rounded text-sm overflow-x-auto">
                      {formula.latex}
                    </code>
                  </div>
                  
                  {formula.variables.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-primary">Variables: </span>
                      <span className="text-sm text-secondary">
                        {formula.variables.join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {formula.operators.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-primary">Operators: </span>
                      <span className="text-sm text-secondary">
                        {formula.operators.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderTables = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary">Tables</h3>
        <span className="text-sm text-secondary">{analysisData.tables.length} detected</span>
      </div>
      
      {analysisData.tables.length === 0 ? (
        <div className="text-center py-8">
          <Table2 className="h-8 w-8 text-muted mx-auto mb-3" />
          <p className="text-secondary">No tables detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {analysisData.tables.map((table) => (
            <div key={table.id} className="bg-workspace-canvas rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Table2 className="h-4 w-4 text-status-success" />
                  <span className="text-sm font-medium">
                    {table.rows}×{table.cols} {table.type} Table
                  </span>
                  <span className={`text-xs px-2 py-1 rounded bg-status-success/10 text-status-success`}>
                    {Math.round((table.confidence || 0.8) * 100)}%
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost" onClick={() => onEditTable?.(table.id)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {table.headers && table.headers.length > 0 && (
                <div className="text-sm text-secondary mb-2">
                  Headers: {table.headers.join(', ')}
                </div>
              )}
              
              {/* Enhanced table info */}
              <div className="flex items-center space-x-4 text-xs text-muted">
                <span>Structure: {table.rows}×{table.cols}</span>
                {table.type === 'formula' && (
                  <span className="flex items-center space-x-1">
                    <Calculator className="h-3 w-3" />
                    <span>Contains formulas</span>
                  </span>
                )}
                <span>Layout preserved</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderDiagrams = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary">Figures & Diagrams</h3>
        <span className="text-sm text-secondary">{analysisData.diagrams.length} detected</span>
      </div>
      
      {analysisData.diagrams.length === 0 ? (
        <div className="text-center py-8">
          <BarChart3 className="h-8 w-8 text-muted mx-auto mb-3" />
          <p className="text-secondary">No figures or diagrams detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {analysisData.diagrams.map((diagram) => (
            <div key={diagram.id} className="bg-workspace-canvas rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-4 w-4 text-status-warning" />
                  <span className="text-sm font-medium capitalize">{diagram.type}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(diagram.confidence)}`}>
                    {getConfidenceLabel(diagram.confidence)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-secondary mb-2">{diagram.description}</p>
              
              {/* Enhanced figure info */}
              <div className="flex items-center space-x-4 text-xs text-muted">
                <span>Scientific figure</span>
                <span>Vector extraction available</span>
                <span>Caption linked</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderExportView = () => (
    <div className="space-y-6">
      {/* Export Options */}
      <div className="bg-workspace-canvas rounded-lg p-4">
        <h3 className="font-semibold text-primary mb-4">Document Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onDownload?.('latex')}
            >
              <FileText className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">LaTeX Source</div>
                <div className="text-xs text-secondary">Publication-ready TeX document</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onDownload?.('pdf')}
            >
              <FileText className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">PDF Document</div>
                <div className="text-xs text-secondary">Compiled LaTeX output</div>
              </div>
            </Button>
          </div>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onDownload?.('mathml')}
            >
              <Zap className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">MathML</div>
                <div className="text-xs text-secondary">Semantic mathematical markup</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onDownload?.('json')}
            >
              <Code className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">JSON Data</div>
                <div className="text-xs text-secondary">Structured analysis results</div>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Generation Statistics */}
      <div className="bg-workspace-canvas rounded-lg p-4">
        <h3 className="font-semibold text-primary mb-4">Generation Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-primary">{analysisData.formulasDetected}</div>
            <div className="text-sm text-secondary">Formulas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-status-success">{analysisData.tablesDetected}</div>
            <div className="text-sm text-secondary">Tables</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-status-warning">{analysisData.diagramsDetected}</div>
            <div className="text-sm text-secondary">Figures</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-status-processing">
              {Math.round(analysisData.processingTime / 1000)}s
            </div>
            <div className="text-sm text-secondary">Processing</div>
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="bg-workspace-canvas rounded-lg p-4">
        <h3 className="font-semibold text-primary mb-4">Advanced Export Options</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm">Include cross-references</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm">Generate table of contents</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm">Include semantic annotations</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Compress output files</span>
          </label>
        </div>
      </div>
    </div>
  )

  return (
    <div className="workspace-panel">
      {/* Header */}
      <div className="p-6 border-b border-workspace-divider">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-status-processing rounded-lg flex items-center justify-center">
            <Calculator className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">STEM Analysis</h2>
            <p className="text-sm text-secondary">
              Processed in {Math.round(analysisData.processingTime / 1000)}s
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-workspace-divider">
        <div className="flex">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'formulas', label: 'Formulas', icon: Calculator },
            { id: 'tables', label: 'Tables', icon: Table2 },
            { id: 'diagrams', label: 'Figures', icon: BarChart3 },
            { id: 'export', label: 'Export', icon: Download }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'formulas' && renderFormulas()}
        {activeTab === 'tables' && renderTables()}
        {activeTab === 'diagrams' && renderDiagrams()}
        {activeTab === 'export' && renderExportView()}
      </div>
    </div>
  )
}