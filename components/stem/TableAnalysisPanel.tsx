/**
 * Phase 3.7-B: Table Analysis Panel Component
 * 
 * Interactive component for viewing and editing detected table structures
 * Features cell editing, formula visualization, and layout preservation controls
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Table2,
  Edit,
  Eye,
  Download,
  Grid,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Calculator,
  Hash,
  Type,
  MoreHorizontal,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface TableAnalysisData {
  id: string
  confidence: number
  structure: {
    totalRows: number
    totalCols: number
    hasHeaders: boolean
    hasFooters: boolean
    hasMergedCells: boolean
  }
  content: {
    headers: string[]
    data: string[][]
    formulas: Array<{
      row: number
      col: number
      latex: string
      mathml: string
    }>
  }
  preservedLayout: {
    borderStyle: 'none' | 'simple' | 'grid' | 'custom'
    cellPadding: number
    rowHeight: number[]
    colWidth: number[]
    alignment: 'left' | 'center' | 'right'
  }
  columns: Array<{
    id: string
    index: number
    header: string
    width: number
    alignment: 'left' | 'center' | 'right'
    dataType: 'text' | 'numeric' | 'formula' | 'mixed'
  }>
}

interface TableAnalysisPanelProps {
  tableData: TableAnalysisData | null
  isLoading: boolean
  onEditCell?: (row: number, col: number, value: string) => void
  onEditFormula?: (row: number, col: number) => void
  onExportTable?: (format: 'csv' | 'xlsx' | 'latex') => void
  onUpdateLayout?: (layout: any) => void
}

export function TableAnalysisPanel({
  tableData,
  isLoading,
  onEditCell,
  onEditFormula,
  onExportTable,
  onUpdateLayout
}: TableAnalysisPanelProps) {
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null)
  const [editValue, setEditValue] = useState('')
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'formulas'>('table')

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({row, col})
    const cellValue = getCellValue(row, col)
    setEditValue(cellValue)
  }

  const handleCellDoubleClick = (row: number, col: number) => {
    setEditingCell({row, col})
    setEditValue(getCellValue(row, col))
  }

  const handleCellEdit = (row: number, col: number, value: string) => {
    onEditCell?.(row, col, value)
    setEditingCell(null)
  }

  const getCellValue = (row: number, col: number): string => {
    if (!tableData) return ''
    
    if (row === 0 && tableData.structure.hasHeaders) {
      return tableData.content.headers[col] || ''
    }
    
    const dataRow = tableData.structure.hasHeaders ? row - 1 : row
    return tableData.content.data[dataRow]?.[col] || ''
  }

  const getCellType = (row: number, col: number): 'text' | 'number' | 'formula' | 'header' => {
    if (!tableData) return 'text'
    
    if (row === 0 && tableData.structure.hasHeaders) {
      return 'header'
    }
    
    const formula = tableData.content.formulas.find(f => f.row === row && f.col === col)
    if (formula) return 'formula'
    
    const value = getCellValue(row, col)
    if (/^\d+(\.\d+)?$/.test(value.trim())) return 'number'
    
    return 'text'
  }

  const getCellAlignment = (col: number): 'left' | 'center' | 'right' => {
    return tableData?.columns[col]?.alignment || 'left'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-status-success'
    if (confidence >= 0.6) return 'text-status-processing' 
    return 'text-status-warning'
  }

  const renderTableView = () => {
    if (!tableData) return null

    const totalRows = tableData.structure.hasHeaders ? 
      tableData.structure.totalRows : tableData.structure.totalRows
    
    return (
      <div className="overflow-auto max-h-96 border border-workspace-divider rounded-lg">
        <table className="w-full border-collapse">
          <tbody>
            {Array.from({length: totalRows}, (_, row) => (
              <tr key={row} className={row === 0 && tableData.structure.hasHeaders ? 'bg-workspace-canvas' : ''}>
                {Array.from({length: tableData.structure.totalCols}, (_, col) => {
                  const cellValue = getCellValue(row, col)
                  const cellType = getCellType(row, col)
                  const alignment = getCellAlignment(col)
                  const isSelected = selectedCell?.row === row && selectedCell?.col === col
                  const isEditing = editingCell?.row === row && editingCell?.col === col
                  const formula = tableData.content.formulas.find(f => f.row === row && f.col === col)

                  return (
                    <td
                      key={col}
                      className={`
                        border border-workspace-divider p-2 cursor-pointer transition-colors
                        ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-workspace-hover'}
                        ${cellType === 'header' ? 'font-semibold bg-workspace-canvas' : ''}
                        text-${alignment}
                      `}
                      onClick={() => handleCellClick(row, col)}
                      onDoubleClick={() => handleCellDoubleClick(row, col)}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellEdit(row, col, editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCellEdit(row, col, editValue)
                            } else if (e.key === 'Escape') {
                              setEditingCell(null)
                            }
                          }}
                          className="w-full bg-transparent border-none outline-none"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className={`
                            ${cellType === 'number' ? 'font-mono' : ''}
                            ${cellType === 'formula' ? 'text-status-processing' : ''}
                          `}>
                            {cellValue || '-'}
                          </span>
                          {formula && (
                            <Calculator className="h-3 w-3 text-status-processing" />
                          )}
                          {cellType === 'number' && (
                            <Hash className="h-3 w-3 text-muted" />
                          )}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderFormulasList = () => {
    if (!tableData || tableData.content.formulas.length === 0) {
      return (
        <div className="text-center py-8">
          <Calculator className="h-8 w-8 text-muted mx-auto mb-3" />
          <p className="text-secondary">No formulas detected in table</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {tableData.content.formulas.map((formula, index) => (
          <div key={index} className="bg-workspace-canvas rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-status-processing" />
                <span className="text-sm font-medium">
                  Cell {String.fromCharCode(65 + formula.col)}{formula.row + 1}
                </span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => onEditFormula?.(formula.row, formula.col)}>
                <Edit className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-primary">LaTeX:</span>
                <code className="block bg-workspace-panel p-2 rounded text-sm mt-1 overflow-x-auto">
                  {formula.latex}
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderLayoutControls = () => (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-primary mb-2">Border Style</h4>
        <div className="flex space-x-2">
          {['none', 'simple', 'grid', 'custom'].map(style => (
            <Button
              key={style}
              size="sm"
              variant={tableData?.preservedLayout.borderStyle === style ? 'default' : 'outline'}
              onClick={() => onUpdateLayout?.({borderStyle: style})}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-primary mb-2">Alignment</h4>
        <div className="flex space-x-2">
          {[
            {value: 'left', icon: AlignLeft},
            {value: 'center', icon: AlignCenter}, 
            {value: 'right', icon: AlignRight}
          ].map(({value, icon: Icon}) => (
            <Button
              key={value}
              size="sm"
              variant={tableData?.preservedLayout.alignment === value ? 'default' : 'outline'}
              onClick={() => onUpdateLayout?.({alignment: value})}
            >
              <Icon className="h-3 w-3" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="workspace-panel p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-status-processing rounded-lg flex items-center justify-center">
            <Table2 className="h-4 w-4 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">Table Analysis</h2>
            <p className="text-sm text-secondary">Analyzing table structures...</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="animate-pulse bg-workspace-canvas rounded-lg h-32"></div>
          <div className="animate-pulse bg-workspace-canvas rounded-lg h-20"></div>
        </div>
      </div>
    )
  }

  if (!tableData) {
    return (
      <div className="workspace-panel p-6">
        <div className="text-center py-8">
          <Table2 className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No Tables Detected</h3>
          <p className="text-secondary">Upload a document with table structures to see analysis results.</p>
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
              <Table2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">Table Analysis</h2>
              <p className="text-sm text-secondary">
                {tableData.structure.totalRows}×{tableData.structure.totalCols} table
                <span className={`ml-2 ${getConfidenceColor(tableData.confidence)}`}>
                  ({Math.round(tableData.confidence * 100)}% confidence)
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={() => onExportTable?.('csv')}>
              <Download className="h-3 w-3 mr-2" />
              CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExportTable?.('xlsx')}>
              <Download className="h-3 w-3 mr-2" />
              Excel
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExportTable?.('latex')}>
              <Download className="h-3 w-3 mr-2" />
              LaTeX
            </Button>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="border-b border-workspace-divider">
        <div className="flex">
          {[
            {id: 'table', label: 'Table View', icon: Grid},
            {id: 'formulas', label: 'Formulas', icon: Calculator, badge: tableData.content.formulas.length},
            {id: 'layout', label: 'Layout', icon: Type}
          ].map(({id, label, icon: Icon, badge}) => (
            <button
              key={id}
              onClick={() => setViewMode(id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                viewMode === id
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
        {viewMode === 'table' && renderTableView()}
        {viewMode === 'formulas' && renderFormulasList()}
        {viewMode === 'layout' && renderLayoutControls()}
      </div>

      {/* Selected Cell Info */}
      {selectedCell && (
        <div className="border-t border-workspace-divider p-4 bg-workspace-canvas">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">
                Selected: {String.fromCharCode(65 + selectedCell.col)}{selectedCell.row + 1}
              </span>
              <span className="text-sm text-secondary">
                Type: {getCellType(selectedCell.row, selectedCell.col)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" onClick={() => handleCellDoubleClick(selectedCell.row, selectedCell.col)}>
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              {getCellType(selectedCell.row, selectedCell.col) === 'formula' && (
                <Button size="sm" variant="ghost" onClick={() => onEditFormula?.(selectedCell.row, selectedCell.col)}>
                  <Calculator className="h-3 w-3 mr-1" />
                  Formula
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}