/**
 * Phase 3.7-D: LaTeX & MathML Preview Panel Component
 * 
 * Interactive component for viewing generated LaTeX/MathML documents
 * Features syntax highlighting, live preview, and export capabilities
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  Code,
  Eye,
  Download,
  Copy,
  Check,
  Settings,
  Layers,
  BookOpen,
  Hash,
  Grid,
  Image as ImageIcon,
  Zap,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface LaTeXPreviewData {
  latex: {
    source: string
    filePath: string
    structure: {
      sections: Array<{
        level: number
        title: string
        label: string
      }>
      equations: Array<{
        id: string
        label: string
        number: number
        type: string
      }>
      tables: Array<{
        id: string
        label: string
        number: number
        caption: string
      }>
      figures: Array<{
        id: string
        label: string
        number: number
        caption: string
      }>
    }
    crossReferences: Array<{
      id: string
      type: string
      label: string
    }>
  }
  mathml: {
    document: string
    filePath: string
    formulas: Array<{
      id: string
      presentationML: string
      contentML?: string
      semanticAnnotations: Array<{
        type: string
        symbol: string
        meaning: string
      }>
    }>
  }
  metadata: {
    generationTime: number
    formulaCount: number
    tableCount: number
    figureCount: number
    pageEstimate: number
    complexity: 'simple' | 'medium' | 'complex'
  }
}

interface LaTeXPreviewPanelProps {
  previewData: LaTeXPreviewData | null
  isLoading: boolean
  onRegenerateLatex?: (options: any) => void
  onExportDocument?: (format: 'tex' | 'pdf' | 'mathml' | 'html') => void
  onCopyToClipboard?: (content: string, type: 'latex' | 'mathml') => void
}

export function LaTeXPreviewPanel({
  previewData,
  isLoading,
  onRegenerateLatex,
  onExportDocument,
  onCopyToClipboard
}: LaTeXPreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<'latex' | 'mathml' | 'structure' | 'settings'>('latex')
  const [viewMode, setViewMode] = useState<'source' | 'preview'>('source')
  const [copiedContent, setCopiedContent] = useState<string | null>(null)
  const [latexSettings, setLatexSettings] = useState({
    documentClass: 'article',
    packages: ['amsmath', 'amsfonts', 'amssymb'],
    includeFormulas: true,
    includeTables: true,
    includeFigures: true,
    quality: 'final'
  })

  const copyToClipboard = async (content: string, type: 'latex' | 'mathml') => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedContent(type)
      onCopyToClipboard?.(content, type)
      setTimeout(() => setCopiedContent(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
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

  const renderLatexView = () => {
    if (!previewData) return null

    return (
      <div className="space-y-4">
        {/* Source/Preview Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={viewMode === 'source' ? 'default' : 'outline'}
              onClick={() => setViewMode('source')}
            >
              <Code className="h-3 w-3 mr-2" />
              Source
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'preview' ? 'default' : 'outline'}
              onClick={() => setViewMode('preview')}
            >
              <Eye className="h-3 w-3 mr-2" />
              Preview
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(previewData.latex.source, 'latex')}
            >
              {copiedContent === 'latex' ? (
                <Check className="h-3 w-3 text-status-success" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExportDocument?.('tex')}>
              <Download className="h-3 w-3 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'source' ? (
          <div className="bg-workspace-panel rounded-lg p-4">
            <pre className="text-sm overflow-x-auto whitespace-pre-wrap font-mono">
              <code>{previewData.latex.source}</code>
            </pre>
          </div>
        ) : (
          <div className="bg-workspace-panel rounded-lg p-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-muted mb-4">
                LaTeX Preview (rendered representation would appear here in production)
              </p>
              <div className="border-2 border-dashed border-workspace-divider rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-muted mx-auto mb-4" />
                <p className="text-secondary">
                  LaTeX compilation and preview would be rendered here
                </p>
                <p className="text-xs text-muted mt-2">
                  Document: {previewData.metadata.pageEstimate} estimated pages
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderMathMLView = () => {
    if (!previewData) return null

    return (
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {previewData.mathml.formulas.length} MathML formulas
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(previewData.mathml.document, 'mathml')}
            >
              {copiedContent === 'mathml' ? (
                <Check className="h-3 w-3 text-status-success" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExportDocument?.('mathml')}>
              <Download className="h-3 w-3 mr-2" />
              Export XML
            </Button>
          </div>
        </div>

        {/* MathML Content */}
        <div className="space-y-3">
          {previewData.mathml.formulas.map((formula, index) => (
            <div key={formula.id} className="bg-workspace-canvas rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Formula {index + 1}</span>
                <Button size="sm" variant="ghost">
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Presentation MathML */}
              <div className="mb-3">
                <h5 className="text-sm font-medium text-primary mb-2">Presentation MathML</h5>
                <div className="bg-workspace-panel rounded p-3">
                  <pre className="text-xs overflow-x-auto">
                    <code>{formula.presentationML}</code>
                  </pre>
                </div>
              </div>
              
              {/* Content MathML */}
              {formula.contentML && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-primary mb-2">Content MathML</h5>
                  <div className="bg-workspace-panel rounded p-3">
                    <pre className="text-xs overflow-x-auto">
                      <code>{formula.contentML}</code>
                    </pre>
                  </div>
                </div>
              )}
              
              {/* Semantic Annotations */}
              {formula.semanticAnnotations.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-primary mb-2">Semantic Annotations</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {formula.semanticAnnotations.map((annotation, idx) => (
                      <div key={idx} className="bg-workspace-panel rounded p-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono bg-primary/10 px-2 py-1 rounded">
                            {annotation.symbol}
                          </span>
                          <span className="text-xs text-secondary">{annotation.type}</span>
                        </div>
                        <p className="text-xs text-muted mt-1">{annotation.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderStructureView = () => {
    if (!previewData) return null

    const { structure } = previewData.latex

    return (
      <div className="space-y-6">
        {/* Document Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-workspace-canvas rounded-lg p-4 text-center">
            <Hash className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-semibold">{structure.equations.length}</div>
            <div className="text-sm text-secondary">Equations</div>
          </div>
          
          <div className="bg-workspace-canvas rounded-lg p-4 text-center">
            <Grid className="h-6 w-6 text-status-success mx-auto mb-2" />
            <div className="text-2xl font-semibold">{structure.tables.length}</div>
            <div className="text-sm text-secondary">Tables</div>
          </div>
          
          <div className="bg-workspace-canvas rounded-lg p-4 text-center">
            <ImageIcon className="h-6 w-6 text-status-warning mx-auto mb-2" />
            <div className="text-2xl font-semibold">{structure.figures.length}</div>
            <div className="text-sm text-secondary">Figures</div>
          </div>
          
          <div className="bg-workspace-canvas rounded-lg p-4 text-center">
            <BookOpen className="h-6 w-6 text-status-processing mx-auto mb-2" />
            <div className="text-2xl font-semibold">{structure.sections.length}</div>
            <div className="text-sm text-secondary">Sections</div>
          </div>
        </div>

        {/* Document Structure */}
        <div className="bg-workspace-canvas rounded-lg p-4">
          <h4 className="font-semibold text-primary mb-3">Document Structure</h4>
          <div className="space-y-2">
            {structure.sections.map((section, index) => (
              <div key={index} className="flex items-center space-x-3 py-2">
                <div className="text-xs text-muted w-8">
                  {section.level === 1 ? '§' : section.level === 2 ? '§§' : '§§§'}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium">{section.title}</span>
                  <span className="text-xs text-muted ml-2">({section.label})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cross References */}
        {previewData.latex.crossReferences.length > 0 && (
          <div className="bg-workspace-canvas rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-3">Cross References</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {previewData.latex.crossReferences.map((ref, index) => (
                <div key={index} className="bg-workspace-panel rounded p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">{ref.label}</span>
                    <span className="text-xs px-2 py-1 bg-primary/10 rounded capitalize">
                      {ref.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderSettingsView = () => (
    <div className="space-y-6">
      <div className="bg-workspace-canvas rounded-lg p-4">
        <h4 className="font-semibold text-primary mb-3">LaTeX Generation Settings</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Document Class</label>
            <select
              value={latexSettings.documentClass}
              onChange={(e) => setLatexSettings({...latexSettings, documentClass: e.target.value})}
              className="w-full p-2 border border-workspace-divider rounded bg-workspace-panel"
            >
              <option value="article">Article</option>
              <option value="report">Report</option>
              <option value="book">Book</option>
              <option value="beamer">Beamer (Presentation)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Quality</label>
            <div className="flex space-x-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="draft"
                  checked={latexSettings.quality === 'draft'}
                  onChange={(e) => setLatexSettings({...latexSettings, quality: e.target.value as any})}
                  className="mr-2"
                />
                Draft
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="final"
                  checked={latexSettings.quality === 'final'}
                  onChange={(e) => setLatexSettings({...latexSettings, quality: e.target.value as any})}
                  className="mr-2"
                />
                Final
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Include Content</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={latexSettings.includeFormulas}
                  onChange={(e) => setLatexSettings({...latexSettings, includeFormulas: e.target.checked})}
                  className="mr-2"
                />
                Mathematical Formulas
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={latexSettings.includeTables}
                  onChange={(e) => setLatexSettings({...latexSettings, includeTables: e.target.checked})}
                  className="mr-2"
                />
                Tables
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={latexSettings.includeFigures}
                  onChange={(e) => setLatexSettings({...latexSettings, includeFigures: e.target.checked})}
                  className="mr-2"
                />
                Figures
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <Button
            onClick={() => onRegenerateLatex?.(latexSettings)}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Document
          </Button>
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="workspace-panel p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-status-processing rounded-lg flex items-center justify-center">
            <FileText className="h-4 w-4 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">LaTeX & MathML Generation</h2>
            <p className="text-sm text-secondary">Generating document formats...</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="animate-pulse bg-workspace-canvas rounded-lg h-64"></div>
          <div className="animate-pulse bg-workspace-canvas rounded-lg h-32"></div>
        </div>
      </div>
    )
  }

  if (!previewData) {
    return (
      <div className="workspace-panel p-6">
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No Document Generated</h3>
          <p className="text-secondary">Process a STEM document to generate LaTeX and MathML output.</p>
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
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">LaTeX & MathML</h2>
              <p className="text-sm text-secondary">
                Generated in {previewData.metadata.generationTime}ms
                <span className={`ml-2 ${getComplexityColor(previewData.metadata.complexity)}`}>
                  ({previewData.metadata.complexity} complexity)
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={() => onExportDocument?.('pdf')}>
              <Download className="h-3 w-3 mr-2" />
              PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExportDocument?.('html')}>
              <Download className="h-3 w-3 mr-2" />
              HTML
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-workspace-divider">
        <div className="flex">
          {[
            { id: 'latex', label: 'LaTeX', icon: FileText },
            { id: 'mathml', label: 'MathML', icon: Zap, badge: previewData.mathml.formulas.length },
            { id: 'structure', label: 'Structure', icon: Layers },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(({ id, label, icon: Icon, badge }) => (
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
              {badge !== undefined && badge > 0 && (
                <span className="bg-status-processing text-white text-xs px-2 py-1 rounded-full">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'latex' && renderLatexView()}
        {activeTab === 'mathml' && renderMathMLView()}
        {activeTab === 'structure' && renderStructureView()}
        {activeTab === 'settings' && renderSettingsView()}
      </div>
    </div>
  )
}