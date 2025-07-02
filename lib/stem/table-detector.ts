/**
 * Phase 3.7-B: Advanced Table Detection Engine
 * 
 * Specialized engine for detecting and preserving table structures in STEM documents
 * Features intelligent row/column detection, formula recognition within cells, and layout preservation
 */

import { createWorker, Worker } from 'tesseract.js'

export interface TableCell {
  id: string
  row: number
  col: number
  content: string
  bounds: BoundingBox
  type: 'text' | 'number' | 'formula' | 'empty'
  formula?: {
    latex: string
    mathml: string
    variables: string[]
  }
  alignment: 'left' | 'center' | 'right'
  merged?: {
    rowspan: number
    colspan: number
  }
}

export interface TableRow {
  id: string
  index: number
  cells: TableCell[]
  bounds: BoundingBox
  type: 'header' | 'data' | 'footer'
  height: number
}

export interface TableColumn {
  id: string
  index: number
  header: string
  width: number
  alignment: 'left' | 'center' | 'right'
  dataType: 'text' | 'numeric' | 'formula' | 'mixed'
}

export interface DetectedTable {
  id: string
  bounds: BoundingBox
  rows: TableRow[]
  columns: TableColumn[]
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
  confidence: number
  preservedLayout: {
    borderStyle: 'none' | 'simple' | 'grid' | 'custom'
    cellPadding: number
    rowHeight: number[]
    colWidth: number[]
    alignment: 'left' | 'center' | 'right'
  }
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export class AdvancedTableDetector {
  private ocrWorker: Worker | null = null
  private isInitialized = false
  
  constructor() {}
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    console.log('📊 Initializing Advanced Table Detection Engine...')
    
    try {
      this.ocrWorker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`📊 Table OCR Progress: ${(m.progress * 100).toFixed(1)}%`)
          }
        }
      })
      
      // Configure for table detection
      await this.ocrWorker.setParameters({
        tessedit_pageseg_mode: '6', // Uniform block of text
        preserve_interword_spaces: '1',
        tessedit_create_hocr: '1', // Generate hOCR for layout information
        tessedit_create_tsv: '1'   // Generate TSV for table structure
      })
      
      this.isInitialized = true
      console.log('✅ Advanced Table Detection Engine initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize Table Detection Engine:', error)
      throw error
    }
  }
  
  async detectTables(imageBuffer: Buffer): Promise<DetectedTable[]> {
    if (!this.isInitialized) {
      await this.initialize()
    }
    
    console.log('🔍 Analyzing image for table structures...')
    
    try {
      // Perform OCR with table-specific configuration
      const ocrResult = await this.ocrWorker!.recognize(imageBuffer)
      
      // Extract potential table regions
      const tableRegions = await this.identifyTableRegions(ocrResult.data)
      
      // Analyze each region for table structure
      const detectedTables: DetectedTable[] = []
      
      for (const region of tableRegions) {
        console.log(`📊 Analyzing table region ${region.id}`)
        
        const table = await this.analyzeTableStructure(region, ocrResult.data)
        if (table && table.confidence > 0.4) { // Minimum confidence threshold
          detectedTables.push(table)
        }
      }
      
      console.log(`✅ Detected ${detectedTables.length} tables`)
      return detectedTables
      
    } catch (error) {
      console.error('❌ Table detection failed:', error)
      throw new Error(`Table detection failed: ${error.message}`)
    }
  }
  
  private async identifyTableRegions(ocrData: any): Promise<Array<{id: string, bounds: BoundingBox, elements: any[]}>> {
    const regions: Array<{id: string, bounds: BoundingBox, elements: any[]}> = []
    
    // Group text elements by their spatial layout
    const lines = this.extractTextLines(ocrData)
    const alignedGroups = this.findAlignedTextGroups(lines)
    
    // Identify rectangular regions with consistent alignment
    for (let i = 0; i < alignedGroups.length; i++) {
      const group = alignedGroups[i]
      
      if (this.looksLikeTable(group)) {
        const bounds = this.calculateRegionBounds(group)
        
        regions.push({
          id: `table_region_${i}`,
          bounds,
          elements: group
        })
      }
    }
    
    return regions
  }
  
  private extractTextLines(ocrData: any): any[] {
    const lines = []
    
    for (const paragraph of ocrData.paragraphs || []) {
      for (const line of paragraph.lines || []) {
        if (line.text && line.text.trim().length > 0) {
          lines.push({
            text: line.text.trim(),
            bounds: line.bbox,
            words: line.words || [],
            confidence: line.confidence
          })
        }
      }
    }
    
    return lines.sort((a, b) => a.bounds.y0 - b.bounds.y0) // Sort by Y position
  }
  
  private findAlignedTextGroups(lines: any[]): any[][] {
    const groups: any[][] = []
    const processed = new Set<number>()
    
    for (let i = 0; i < lines.length; i++) {
      if (processed.has(i)) continue
      
      const currentLine = lines[i]
      const group = [currentLine]
      processed.add(i)
      
      // Find lines with similar X positions (potential columns)
      for (let j = i + 1; j < lines.length; j++) {
        if (processed.has(j)) continue
        
        const otherLine = lines[j]
        
        // Check if lines are vertically close and have similar alignment patterns
        if (this.linesAreAligned(currentLine, otherLine, group)) {
          group.push(otherLine)
          processed.add(j)
        }
      }
      
      groups.push(group)
    }
    
    return groups.filter(group => group.length >= 2) // At least 2 rows for a table
  }
  
  private linesAreAligned(line1: any, line2: any, existingGroup: any[]): boolean {
    const verticalDistance = Math.abs(line2.bounds.y0 - line1.bounds.y1)
    const maxVerticalGap = 100 // Maximum gap between potential table rows
    
    if (verticalDistance > maxVerticalGap) return false
    
    // Check for column alignment patterns
    const line1Words = line1.words.map((w: any) => w.bbox.x0)
    const line2Words = line2.words.map((w: any) => w.bbox.x0)
    
    return this.hasColumnAlignment(line1Words, line2Words, existingGroup)
  }
  
  private hasColumnAlignment(words1: number[], words2: number[], group: any[]): boolean {
    const tolerance = 20 // Pixel tolerance for alignment
    
    // Check if word positions align (indicating columns)
    for (const x1 of words1) {
      for (const x2 of words2) {
        if (Math.abs(x1 - x2) <= tolerance) {
          return true
        }
      }
    }
    
    // Check alignment with existing group
    if (group.length >= 2) {
      const groupWordPositions = group.flatMap(line => 
        line.words.map((w: any) => w.bbox.x0)
      )
      
      for (const x2 of words2) {
        for (const groupX of groupWordPositions) {
          if (Math.abs(x2 - groupX) <= tolerance) {
            return true
          }
        }
      }
    }
    
    return false
  }
  
  private looksLikeTable(group: any[]): boolean {
    if (group.length < 2) return false
    
    // Check for consistent word counts (indicating columns)
    const wordCounts = group.map(line => line.words.length)
    const avgWordCount = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length
    const variance = wordCounts.reduce((sum, count) => sum + Math.pow(count - avgWordCount, 2), 0) / wordCounts.length
    
    // Low variance in word count suggests structured data (table)
    const hasConsistentColumns = variance < 2
    
    // Check for numeric data (common in tables)
    const hasNumericData = group.some(line => 
      /\d+/.test(line.text) && line.text.split(/\s+/).length > 1
    )
    
    // Check for alignment patterns
    const hasAlignment = this.detectAlignmentPatterns(group)
    
    return hasConsistentColumns || (hasNumericData && hasAlignment)
  }
  
  private detectAlignmentPatterns(group: any[]): boolean {
    const wordPositions = group.map(line => 
      line.words.map((w: any) => w.bbox.x0)
    )
    
    // Find common column positions
    const allPositions = wordPositions.flat()
    const positionClusters = this.clusterPositions(allPositions, 20)
    
    // Tables typically have at least 2 column positions
    return positionClusters.length >= 2
  }
  
  private clusterPositions(positions: number[], tolerance: number): number[][] {
    const clusters: number[][] = []
    const sorted = [...positions].sort((a, b) => a - b)
    
    for (const pos of sorted) {
      let addedToCluster = false
      
      for (const cluster of clusters) {
        if (cluster.some(clusterPos => Math.abs(pos - clusterPos) <= tolerance)) {
          cluster.push(pos)
          addedToCluster = true
          break
        }
      }
      
      if (!addedToCluster) {
        clusters.push([pos])
      }
    }
    
    return clusters.filter(cluster => cluster.length >= 2)
  }
  
  private calculateRegionBounds(group: any[]): BoundingBox {
    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity
    
    for (const line of group) {
      minX = Math.min(minX, line.bounds.x0)
      minY = Math.min(minY, line.bounds.y0)
      maxX = Math.max(maxX, line.bounds.x1)
      maxY = Math.max(maxY, line.bounds.y1)
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }
  
  private async analyzeTableStructure(region: any, ocrData: any): Promise<DetectedTable | null> {
    console.log(`🔍 Analyzing table structure for region ${region.id}`)
    
    // Extract and organize text elements within the region
    const tableElements = this.extractTableElements(region, ocrData)
    
    // Detect grid structure
    const gridStructure = this.detectGridStructure(tableElements)
    
    if (!gridStructure || gridStructure.rows < 2 || gridStructure.cols < 2) {
      return null // Not a valid table
    }
    
    // Build table structure
    const table = await this.buildTableStructure(region, tableElements, gridStructure)
    
    return table
  }
  
  private extractTableElements(region: any, ocrData: any): any[] {
    const elements = []
    
    // Extract all text elements within the table region
    for (const paragraph of ocrData.paragraphs || []) {
      for (const line of paragraph.lines || []) {
        for (const word of line.words || []) {
          if (this.isWithinRegion(word.bbox, region.bounds)) {
            elements.push({
              text: word.text,
              bounds: word.bbox,
              confidence: word.confidence
            })
          }
        }
      }
    }
    
    return elements.sort((a, b) => {
      // Sort by Y position first, then X position
      if (Math.abs(a.bounds.y0 - b.bounds.y0) > 10) {
        return a.bounds.y0 - b.bounds.y0
      }
      return a.bounds.x0 - b.bounds.x0
    })
  }
  
  private isWithinRegion(bounds: any, region: BoundingBox): boolean {
    return bounds.x0 >= region.x &&
           bounds.y0 >= region.y &&
           bounds.x1 <= region.x + region.width &&
           bounds.y1 <= region.y + region.height
  }
  
  private detectGridStructure(elements: any[]): {rows: number, cols: number, rowPositions: number[], colPositions: number[]} | null {
    if (elements.length < 4) return null // Need at least 2x2 grid
    
    // Group elements by Y position (rows)
    const rowPositions = this.findRowPositions(elements)
    
    // Group elements by X position (columns)
    const colPositions = this.findColumnPositions(elements)
    
    if (rowPositions.length < 2 || colPositions.length < 2) {
      return null
    }
    
    return {
      rows: rowPositions.length,
      cols: colPositions.length,
      rowPositions,
      colPositions
    }
  }
  
  private findRowPositions(elements: any[]): number[] {
    const yPositions = elements.map(el => el.bounds.y0)
    const clusters = this.clusterPositions(yPositions, 15) // 15px tolerance for row alignment
    
    return clusters.map(cluster => 
      cluster.reduce((sum, pos) => sum + pos, 0) / cluster.length
    ).sort((a, b) => a - b)
  }
  
  private findColumnPositions(elements: any[]): number[] {
    const xPositions = elements.map(el => el.bounds.x0)
    const clusters = this.clusterPositions(xPositions, 20) // 20px tolerance for column alignment
    
    return clusters.map(cluster => 
      cluster.reduce((sum, pos) => sum + pos, 0) / cluster.length
    ).sort((a, b) => a - b)
  }
  
  private async buildTableStructure(region: any, elements: any[], gridStructure: any): Promise<DetectedTable> {
    const { rows: numRows, cols: numCols, rowPositions, colPositions } = gridStructure
    
    // Create cell grid
    const cellGrid: TableCell[][] = []
    
    for (let row = 0; row < numRows; row++) {
      cellGrid[row] = []
      
      for (let col = 0; col < numCols; col++) {
        const cellBounds = this.calculateCellBounds(row, col, rowPositions, colPositions)
        const cellElements = this.findElementsInCell(elements, cellBounds)
        const cellContent = cellElements.map(el => el.text).join(' ').trim()
        
        const cell: TableCell = {
          id: `cell_${row}_${col}`,
          row,
          col,
          content: cellContent,
          bounds: cellBounds,
          type: this.determineCellType(cellContent),
          alignment: this.determineCellAlignment(cellElements, cellBounds)
        }
        
        // Check for mathematical formulas in cell
        if (this.containsMathFormula(cellContent)) {
          cell.formula = await this.extractCellFormula(cellContent)
        }
        
        cellGrid[row][col] = cell
      }
    }
    
    // Build table rows
    const tableRows: TableRow[] = []
    for (let i = 0; i < numRows; i++) {
      const rowCells = cellGrid[i]
      const rowBounds = this.calculateRowBounds(rowCells)
      
      tableRows.push({
        id: `row_${i}`,
        index: i,
        cells: rowCells,
        bounds: rowBounds,
        type: i === 0 ? 'header' : 'data',
        height: rowBounds.height
      })
    }
    
    // Build table columns
    const tableColumns: TableColumn[] = []
    for (let j = 0; j < numCols; j++) {
      const colCells = cellGrid.map(row => row[j])
      const colContent = colCells.map(cell => cell.content).filter(c => c.length > 0)
      
      tableColumns.push({
        id: `col_${j}`,
        index: j,
        header: colContent[0] || `Column ${j + 1}`,
        width: colPositions[j + 1] ? colPositions[j + 1] - colPositions[j] : 100,
        alignment: this.determineColumnAlignment(colCells),
        dataType: this.determineColumnDataType(colContent)
      })
    }
    
    // Calculate confidence based on structure consistency
    const confidence = this.calculateTableConfidence(cellGrid, tableRows, tableColumns)
    
    return {
      id: region.id,
      bounds: region.bounds,
      rows: tableRows,
      columns: tableColumns,
      structure: {
        totalRows: numRows,
        totalCols: numCols,
        hasHeaders: tableRows.length > 0 && tableRows[0].type === 'header',
        hasFooters: false,
        hasMergedCells: false // Would be detected in advanced implementation
      },
      content: {
        headers: tableColumns.map(col => col.header),
        data: cellGrid.slice(1).map(row => row.map(cell => cell.content)),
        formulas: cellGrid.flat()
          .filter(cell => cell.formula)
          .map(cell => ({
            row: cell.row,
            col: cell.col,
            latex: cell.formula!.latex,
            mathml: cell.formula!.mathml
          }))
      },
      confidence,
      preservedLayout: {
        borderStyle: 'grid',
        cellPadding: 8,
        rowHeight: tableRows.map(row => row.height),
        colWidth: tableColumns.map(col => col.width),
        alignment: 'left'
      }
    }
  }
  
  private calculateCellBounds(row: number, col: number, rowPositions: number[], colPositions: number[]): BoundingBox {
    const x = colPositions[col]
    const y = rowPositions[row]
    const width = colPositions[col + 1] ? colPositions[col + 1] - x : 100
    const height = rowPositions[row + 1] ? rowPositions[row + 1] - y : 25
    
    return { x, y, width, height }
  }
  
  private findElementsInCell(elements: any[], cellBounds: BoundingBox): any[] {
    return elements.filter(el => {
      const centerX = (el.bounds.x0 + el.bounds.x1) / 2
      const centerY = (el.bounds.y0 + el.bounds.y1) / 2
      
      return centerX >= cellBounds.x &&
             centerX <= cellBounds.x + cellBounds.width &&
             centerY >= cellBounds.y &&
             centerY <= cellBounds.y + cellBounds.height
    })
  }
  
  private determineCellType(content: string): 'text' | 'number' | 'formula' | 'empty' {
    if (!content || content.trim().length === 0) return 'empty'
    if (this.containsMathFormula(content)) return 'formula'
    if (/^\d+(\.\d+)?$/.test(content.trim())) return 'number'
    return 'text'
  }
  
  private containsMathFormula(content: string): boolean {
    const mathIndicators = [
      /[+\-×÷=≠≤≥]/,
      /\d+\.\d+/,
      /\w+\^\w+/,
      /\w+_\w+/,
      /√\w+/,
      /[αβγδεζηθικλμνξοπρστυφχψω]/
    ]
    
    return mathIndicators.some(pattern => pattern.test(content))
  }
  
  private async extractCellFormula(content: string): Promise<{latex: string, mathml: string, variables: string[]}> {
    // Basic formula extraction - would be enhanced with the math formula detector
    let latex = content
    
    // Basic conversions
    latex = latex.replace(/×/g, '\\times')
    latex = latex.replace(/÷/g, '\\div')
    latex = latex.replace(/≠/g, '\\neq')
    latex = latex.replace(/≤/g, '\\leq')
    latex = latex.replace(/≥/g, '\\geq')
    
    const variables = content.match(/[a-zA-Z]/g) || []
    
    const mathml = `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mrow><mtext>${content}</mtext></mrow>
    </math>`
    
    return { latex, mathml, variables }
  }
  
  private determineCellAlignment(elements: any[], cellBounds: BoundingBox): 'left' | 'center' | 'right' {
    if (elements.length === 0) return 'left'
    
    const avgX = elements.reduce((sum, el) => sum + el.bounds.x0, 0) / elements.length
    const cellCenter = cellBounds.x + cellBounds.width / 2
    const leftThreshold = cellBounds.x + cellBounds.width * 0.2
    const rightThreshold = cellBounds.x + cellBounds.width * 0.8
    
    if (avgX < leftThreshold) return 'left'
    if (avgX > rightThreshold) return 'right'
    return 'center'
  }
  
  private calculateRowBounds(cells: TableCell[]): BoundingBox {
    const minX = Math.min(...cells.map(c => c.bounds.x))
    const minY = Math.min(...cells.map(c => c.bounds.y))
    const maxX = Math.max(...cells.map(c => c.bounds.x + c.bounds.width))
    const maxY = Math.max(...cells.map(c => c.bounds.y + c.bounds.height))
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }
  
  private determineColumnAlignment(cells: TableCell[]): 'left' | 'center' | 'right' {
    const alignments = cells.map(cell => cell.alignment)
    const leftCount = alignments.filter(a => a === 'left').length
    const centerCount = alignments.filter(a => a === 'center').length
    const rightCount = alignments.filter(a => a === 'right').length
    
    if (leftCount >= centerCount && leftCount >= rightCount) return 'left'
    if (rightCount >= centerCount) return 'right'
    return 'center'
  }
  
  private determineColumnDataType(content: string[]): 'text' | 'numeric' | 'formula' | 'mixed' {
    const types = content.map(c => {
      if (this.containsMathFormula(c)) return 'formula'
      if (/^\d+(\.\d+)?$/.test(c.trim())) return 'numeric'
      return 'text'
    })
    
    const uniqueTypes = [...new Set(types)]
    if (uniqueTypes.length === 1) return uniqueTypes[0] as any
    return 'mixed'
  }
  
  private calculateTableConfidence(cellGrid: TableCell[][], rows: TableRow[], columns: TableColumn[]): number {
    let confidence = 0.5 // Base confidence
    
    // Increase confidence for consistent structure
    if (rows.length >= 3 && columns.length >= 2) confidence += 0.2
    
    // Increase confidence for numeric data
    const numericCells = cellGrid.flat().filter(cell => cell.type === 'number').length
    const totalCells = cellGrid.flat().length
    if (numericCells / totalCells > 0.3) confidence += 0.15
    
    // Increase confidence for formulas
    const formulaCells = cellGrid.flat().filter(cell => cell.type === 'formula').length
    if (formulaCells > 0) confidence += 0.1
    
    // Increase confidence for headers
    if (rows[0]?.type === 'header') confidence += 0.05
    
    return Math.min(confidence, 1.0)
  }
  
  async cleanup(): Promise<void> {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate()
      this.ocrWorker = null
      console.log('🧹 Advanced Table Detection Engine cleaned up')
    }
  }
}

// Export singleton instance
export const advancedTableDetector = new AdvancedTableDetector()