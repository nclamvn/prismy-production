/**
 * Phase 3.7-A: Mathematical Formula Detection Engine
 * 
 * Advanced OCR and pattern recognition for mathematical formulas
 * Supports LaTeX generation and MathML conversion
 */

import { createWorker, Worker } from 'tesseract.js'

export interface MathFormula {
  id: string
  type: 'inline' | 'display' | 'equation'
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
  rawText: string
  latex: string
  mathml: string
  variables: string[]
  operators: string[]
}

export interface STEMDocument {
  id: string
  formulas: MathFormula[]
  tables: TableStructure[]
  diagrams: DiagramElement[]
  textBlocks: TextBlock[]
  layout: DocumentLayout
}

export interface TableStructure {
  id: string
  bounds: BoundingBox
  rows: number
  cols: number
  headers: string[]
  data: string[][]
  type: 'data' | 'formula' | 'mixed'
}

export interface DiagramElement {
  id: string
  type: 'chart' | 'graph' | 'flowchart' | 'diagram'
  bounds: BoundingBox
  description: string
  elements: DiagramComponent[]
}

export interface TextBlock {
  id: string
  text: string
  bounds: BoundingBox
  type: 'paragraph' | 'heading' | 'caption' | 'footnote'
  mathContent: boolean
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface DocumentLayout {
  columns: number
  pageWidth: number
  pageHeight: number
  margins: {
    top: number
    bottom: number
    left: number
    right: number
  }
  sections: LayoutSection[]
}

export interface LayoutSection {
  id: string
  type: 'text' | 'formula' | 'table' | 'figure' | 'header' | 'footer'
  bounds: BoundingBox
  content: string[]
  relationships: string[] // IDs of related elements
}

export interface DiagramComponent {
  id: string
  type: 'node' | 'edge' | 'label' | 'axis' | 'data-point'
  bounds: BoundingBox
  properties: Record<string, any>
}

export class MathFormulaDetector {
  private ocrWorker: Worker | null = null
  private mathPatterns: RegExp[]
  private operators: string[]
  private greekLetters: string[]
  
  constructor() {
    this.mathPatterns = [
      // Fractions
      /\d+\/\d+/g,
      /\w+\/\w+/g,
      
      // Exponents and subscripts  
      /\w+\^\w+/g,
      /\w+_\w+/g,
      
      // Square roots
      /√\w+/g,
      /sqrt\(\w+\)/g,
      
      // Integrals
      /∫.*?d\w/g,
      /integral.*?d\w/g,
      
      // Summations
      /∑.*?=/g,
      /sum.*?=/g,
      
      // Greek letters
      /[αβγδεζηθικλμνξοπρστυφχψω]/g,
      
      // Mathematical operators
      /[±×÷≠≤≥≈∞∂∇∆]/g,
      
      // Function notation
      /\w+\(\w+\)/g,
      
      // Matrix notation
      /\[.*?\]/g,
      /\|.*?\|/g,
      
      // Equations
      /.*?=.*?/g
    ]
    
    this.operators = ['+', '-', '×', '÷', '=', '≠', '≤', '≥', '≈', '∞', '∂', '∇', '∆', '±']
    this.greekLetters = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω']
  }
  
  async initialize(): Promise<void> {
    console.log('🔢 Initializing STEM Formula Detection Engine...')
    
    this.ocrWorker = await createWorker('eng+equ', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`📊 STEM OCR Progress: ${(m.progress * 100).toFixed(1)}%`)
        }
      }
    })
    
    // Configure for mathematical content
    await this.ocrWorker.setParameters({
      tessedit_char_whitelist: '0123456789+-×÷=≠≤≥≈∞∂∇∆±()[]{}|αβγδεζηθικλμνξοπρστυφχψωABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,;:!? ',
      tessedit_pageseg_mode: '6', // Uniform block of text
      preserve_interword_spaces: '1'
    })
    
    console.log('✅ STEM Formula Detection Engine initialized')
  }
  
  async detectFormulas(imageBuffer: Buffer): Promise<STEMDocument> {
    if (!this.ocrWorker) {
      throw new Error('STEM engine not initialized')
    }
    
    console.log('🔍 Analyzing document for STEM content...')
    
    try {
      // Perform OCR with math support
      const ocrResult = await this.ocrWorker.recognize(imageBuffer)
      
      // Extract layout information
      const layout = this.extractDocumentLayout(ocrResult.data)
      
      // Detect mathematical formulas
      const formulas = await this.extractMathFormulas(ocrResult.data)
      
      // Detect tables
      const tables = await this.detectTables(ocrResult.data, imageBuffer)
      
      // Detect diagrams and charts
      const diagrams = await this.detectDiagrams(imageBuffer, ocrResult.data)
      
      // Extract text blocks
      const textBlocks = this.extractTextBlocks(ocrResult.data)
      
      const stemDoc: STEMDocument = {
        id: `stem_${Date.now()}`,
        formulas,
        tables,
        diagrams,
        textBlocks,
        layout
      }
      
      console.log(`📊 STEM Analysis Complete:`)
      console.log(`   Formulas: ${formulas.length}`)
      console.log(`   Tables: ${tables.length}`)
      console.log(`   Diagrams: ${diagrams.length}`)
      console.log(`   Text Blocks: ${textBlocks.length}`)
      
      return stemDoc
      
    } catch (error) {
      console.error('❌ STEM analysis failed:', error)
      throw new Error(`STEM analysis failed: ${error.message}`)
    }
  }
  
  private async extractMathFormulas(ocrData: any): Promise<MathFormula[]> {
    const formulas: MathFormula[] = []
    
    for (const paragraph of ocrData.paragraphs || []) {
      for (const line of paragraph.lines || []) {
        for (const word of line.words || []) {
          const text = word.text
          const bounds = word.bbox
          
          // Check if this looks like a mathematical expression
          const mathScore = this.calculateMathScore(text)
          
          if (mathScore > 0.3) { // Threshold for math content
            const formula: MathFormula = {
              id: `formula_${formulas.length}`,
              type: this.determineFormulaType(text, bounds),
              bounds: {
                x: bounds.x0,
                y: bounds.y0,
                width: bounds.x1 - bounds.x0,
                height: bounds.y1 - bounds.y0
              },
              confidence: mathScore,
              rawText: text,
              latex: await this.convertToLatex(text),
              mathml: await this.convertToMathML(text),
              variables: this.extractVariables(text),
              operators: this.extractOperators(text)
            }
            
            formulas.push(formula)
          }
        }
      }
    }
    
    // Merge nearby formulas that might be parts of larger expressions
    return this.mergeRelatedFormulas(formulas)
  }
  
  private calculateMathScore(text: string): number {
    let score = 0
    
    // Check for mathematical patterns
    for (const pattern of this.mathPatterns) {
      const matches = text.match(pattern)
      if (matches) {
        score += matches.length * 0.2
      }
    }
    
    // Check for operators
    for (const operator of this.operators) {
      if (text.includes(operator)) {
        score += 0.15
      }
    }
    
    // Check for Greek letters
    for (const letter of this.greekLetters) {
      if (text.includes(letter)) {
        score += 0.1
      }
    }
    
    // Check for numbers
    const numberCount = (text.match(/\d/g) || []).length
    score += numberCount * 0.05
    
    // Normalize score
    return Math.min(score, 1.0)
  }
  
  private determineFormulaType(text: string, bounds: any): 'inline' | 'display' | 'equation' {
    // Display formulas are typically larger and centered
    if (bounds.height > 20 && text.includes('=')) {
      return 'equation'
    }
    
    // Display formulas are larger than inline
    if (bounds.height > 15) {
      return 'display'
    }
    
    return 'inline'
  }
  
  private async convertToLatex(text: string): Promise<string> {
    // Simple conversion rules - can be enhanced with ML models
    let latex = text
    
    // Convert common symbols
    latex = latex.replace(/×/g, '\\times')
    latex = latex.replace(/÷/g, '\\div')
    latex = latex.replace(/±/g, '\\pm')
    latex = latex.replace(/≠/g, '\\neq')
    latex = latex.replace(/≤/g, '\\leq')
    latex = latex.replace(/≥/g, '\\geq')
    latex = latex.replace(/≈/g, '\\approx')
    latex = latex.replace(/∞/g, '\\infty')
    latex = latex.replace(/∂/g, '\\partial')
    latex = latex.replace(/∇/g, '\\nabla')
    latex = latex.replace(/∆/g, '\\Delta')
    latex = latex.replace(/√/g, '\\sqrt')
    latex = latex.replace(/∫/g, '\\int')
    latex = latex.replace(/∑/g, '\\sum')
    
    // Convert Greek letters
    this.greekLetters.forEach(letter => {
      const latinName = this.getGreekLatinName(letter)
      if (latinName) {
        latex = latex.replace(new RegExp(letter, 'g'), `\\${latinName}`)
      }
    })
    
    // Handle fractions (simple detection)
    latex = latex.replace(/(\w+)\/(\w+)/g, '\\frac{$1}{$2}')
    
    // Handle exponents
    latex = latex.replace(/(\w+)\^(\w+)/g, '$1^{$2}')
    
    // Handle subscripts
    latex = latex.replace(/(\w+)_(\w+)/g, '$1_{$2}')
    
    return latex
  }
  
  private async convertToMathML(text: string): Promise<string> {
    // Basic MathML conversion
    const latex = await this.convertToLatex(text)
    
    // This would typically use a LaTeX to MathML converter
    // For now, return a basic MathML structure
    return `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mtext>${text}</mtext>
    </math>`
  }
  
  private extractVariables(text: string): string[] {
    const variables: string[] = []
    
    // Extract single letters that might be variables
    const matches = text.match(/[a-zA-Z]/g) || []
    
    // Filter out common words and keep mathematical variables
    const commonWords = ['and', 'or', 'the', 'is', 'in', 'of', 'to', 'for']
    
    for (const match of matches) {
      if (match.length === 1 && !commonWords.includes(match.toLowerCase())) {
        if (!variables.includes(match)) {
          variables.push(match)
        }
      }
    }
    
    return variables
  }
  
  private extractOperators(text: string): string[] {
    const operators: string[] = []
    
    for (const operator of this.operators) {
      if (text.includes(operator) && !operators.includes(operator)) {
        operators.push(operator)
      }
    }
    
    return operators
  }
  
  private mergeRelatedFormulas(formulas: MathFormula[]): MathFormula[] {
    // Group formulas that are close to each other
    const merged: MathFormula[] = []
    const processed = new Set<number>()
    
    for (let i = 0; i < formulas.length; i++) {
      if (processed.has(i)) continue
      
      const current = formulas[i]
      const group = [current]
      processed.add(i)
      
      // Find nearby formulas
      for (let j = i + 1; j < formulas.length; j++) {
        if (processed.has(j)) continue
        
        const other = formulas[j]
        const distance = this.calculateDistance(current.bounds, other.bounds)
        
        if (distance < 50) { // Threshold for grouping
          group.push(other)
          processed.add(j)
        }
      }
      
      if (group.length === 1) {
        merged.push(current)
      } else {
        // Merge the group into a single formula
        const mergedFormula = this.mergeFormulaGroup(group)
        merged.push(mergedFormula)
      }
    }
    
    return merged
  }
  
  private calculateDistance(bounds1: BoundingBox, bounds2: BoundingBox): number {
    const centerX1 = bounds1.x + bounds1.width / 2
    const centerY1 = bounds1.y + bounds1.height / 2
    const centerX2 = bounds2.x + bounds2.width / 2
    const centerY2 = bounds2.y + bounds2.height / 2
    
    return Math.sqrt(Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2))
  }
  
  private mergeFormulaGroup(group: MathFormula[]): MathFormula {
    const first = group[0]
    
    // Calculate combined bounds
    let minX = first.bounds.x
    let minY = first.bounds.y
    let maxX = first.bounds.x + first.bounds.width
    let maxY = first.bounds.y + first.bounds.height
    
    for (const formula of group.slice(1)) {
      minX = Math.min(minX, formula.bounds.x)
      minY = Math.min(minY, formula.bounds.y)
      maxX = Math.max(maxX, formula.bounds.x + formula.bounds.width)
      maxY = Math.max(maxY, formula.bounds.y + formula.bounds.height)
    }
    
    // Combine text and properties
    const combinedText = group.map(f => f.rawText).join(' ')
    const allVariables = [...new Set(group.flatMap(f => f.variables))]
    const allOperators = [...new Set(group.flatMap(f => f.operators))]
    
    return {
      id: `merged_${first.id}`,
      type: 'display',
      bounds: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      },
      confidence: group.reduce((sum, f) => sum + f.confidence, 0) / group.length,
      rawText: combinedText,
      latex: group.map(f => f.latex).join(' '),
      mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow>${group.map(f => f.mathml).join('')}</mrow></math>`,
      variables: allVariables,
      operators: allOperators
    }
  }
  
  private async detectTables(ocrData: any, imageBuffer: Buffer): Promise<TableStructure[]> {
    // Enhanced table detection using the advanced table detector
    const { advancedTableDetector } = await import('./table-detector')
    
    try {
      const detectedTables = await advancedTableDetector.detectTables(imageBuffer)
      
      // Convert to our TableStructure format
      return detectedTables.map(table => ({
        id: table.id,
        bounds: table.bounds,
        rows: table.structure.totalRows,
        cols: table.structure.totalCols,
        headers: table.content.headers,
        data: table.content.data,
        type: table.content.formulas.length > 0 ? 'formula' : 
              table.columns.some(col => col.dataType === 'numeric') ? 'data' : 'mixed'
      }))
    } catch (error) {
      console.error('❌ Advanced table detection failed:', error)
      return []
    }
  }
  
  private async detectDiagrams(imageBuffer: Buffer, ocrData: any): Promise<DiagramElement[]> {
    // Enhanced diagram detection using the scientific figure detector
    const { scientificFigureDetector } = await import('./figure-detector')
    
    try {
      const figureResult = await scientificFigureDetector.detectFigures(imageBuffer)
      
      // Convert to our DiagramElement format
      return figureResult.figures.map(figure => ({
        id: figure.id,
        type: figure.type as 'chart' | 'graph' | 'flowchart' | 'diagram',
        bounds: figure.bounds,
        description: figure.caption?.text || `${figure.type} figure`,
        confidence: figure.confidence
      }))
    } catch (error) {
      console.error('❌ Advanced figure detection failed:', error)
      return []
    }
  }
  
  private extractTextBlocks(ocrData: any): TextBlock[] {
    const textBlocks: TextBlock[] = []
    
    for (const paragraph of ocrData.paragraphs || []) {
      const text = paragraph.text
      const bounds = paragraph.bbox
      
      if (text && text.trim().length > 0) {
        textBlocks.push({
          id: `text_${textBlocks.length}`,
          text: text.trim(),
          bounds: {
            x: bounds.x0,
            y: bounds.y0,
            width: bounds.x1 - bounds.x0,
            height: bounds.y1 - bounds.y0
          },
          type: this.determineTextType(text),
          mathContent: this.calculateMathScore(text) > 0.1
        })
      }
    }
    
    return textBlocks
  }
  
  private determineTextType(text: string): 'paragraph' | 'heading' | 'caption' | 'footnote' {
    if (text.toLowerCase().includes('figure') || text.toLowerCase().includes('table')) {
      return 'caption'
    }
    
    if (text.length < 100 && text.split(' ').length < 10) {
      return 'heading'
    }
    
    if (text.match(/^\d+\./)) {
      return 'footnote'
    }
    
    return 'paragraph'
  }
  
  private extractDocumentLayout(ocrData: any): DocumentLayout {
    // Extract document layout information
    const pageWidth = ocrData.width || 1000
    const pageHeight = ocrData.height || 1000
    
    return {
      columns: 1, // Basic detection - would be enhanced
      pageWidth,
      pageHeight,
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      },
      sections: []
    }
  }
  
  private getGreekLatinName(greekLetter: string): string | null {
    const greekMap: Record<string, string> = {
      'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta',
      'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta',
      'ι': 'iota', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu',
      'ν': 'nu', 'ξ': 'xi', 'ο': 'omicron', 'π': 'pi',
      'ρ': 'rho', 'σ': 'sigma', 'τ': 'tau', 'υ': 'upsilon',
      'φ': 'phi', 'χ': 'chi', 'ψ': 'psi', 'ω': 'omega'
    }
    
    return greekMap[greekLetter] || null
  }
  
  async cleanup(): Promise<void> {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate()
      this.ocrWorker = null
      console.log('🧹 STEM Formula Detection Engine cleaned up')
    }
  }
}

// Export singleton instance
export const mathFormulaDetector = new MathFormulaDetector()