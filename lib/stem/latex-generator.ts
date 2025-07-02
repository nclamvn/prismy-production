/**
 * Phase 3.7-D: Advanced LaTeX & MathML Generation Engine
 * 
 * Comprehensive document generation with mathematical formulas, tables, and figures
 * Supports semantic MathML, publication-quality LaTeX, and structured output
 */

import { STEMDocument, MathFormula, TableStructure, DiagramElement, TextBlock } from './math-formula-detector'
import fs from 'fs'
import path from 'path'

export interface LaTeXGenerationOptions {
  documentClass: 'article' | 'report' | 'book' | 'beamer'
  packages: string[]
  includeFormulas: boolean
  includeTables: boolean
  includeFigures: boolean
  bibliography: boolean
  crossReferences: boolean
  outputFormat: 'tex' | 'pdf' | 'both'
  quality: 'draft' | 'final'
}

export interface MathMLGenerationOptions {
  semanticAnnotations: boolean
  contentMathML: boolean
  presentationMathML: boolean
  xmlFormatting: 'compact' | 'pretty'
  includeAlternatives: boolean
}

export interface GeneratedDocument {
  latex: {
    source: string
    filePath: string
    structure: DocumentStructure
    crossReferences: CrossReference[]
  }
  mathml: {
    document: string
    filePath: string
    formulas: MathMLFormula[]
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

export interface DocumentStructure {
  sections: Section[]
  equations: EquationReference[]
  tables: TableReference[]
  figures: FigureReference[]
  bibliography: BibliographyEntry[]
}

export interface Section {
  level: number
  title: string
  label: string
  content: ContentBlock[]
}

export interface ContentBlock {
  type: 'text' | 'formula' | 'table' | 'figure' | 'list'
  content: string
  label?: string
  caption?: string
}

export interface CrossReference {
  id: string
  type: 'equation' | 'table' | 'figure' | 'section'
  label: string
  pageNumber?: number
}

export interface MathMLFormula {
  id: string
  presentationML: string
  contentML?: string
  semanticAnnotations: SemanticAnnotation[]
}

export interface SemanticAnnotation {
  type: 'variable' | 'operator' | 'function' | 'constant'
  symbol: string
  meaning: string
  context: string
}

export interface EquationReference {
  id: string
  label: string
  number: number
  type: 'inline' | 'display' | 'equation'
}

export interface TableReference {
  id: string
  label: string
  number: number
  caption: string
  pageRef?: string
}

export interface FigureReference {
  id: string
  label: string
  number: number
  caption: string
  pageRef?: string
}

export interface BibliographyEntry {
  id: string
  type: 'article' | 'book' | 'inproceedings' | 'misc'
  fields: Record<string, string>
}

export class AdvancedLaTeXGenerator {
  private outputDir: string
  private counter: {
    equations: number
    tables: number
    figures: number
    sections: number
  }
  
  constructor() {
    this.outputDir = path.join(process.cwd(), 'temp', 'latex_output')
    this.ensureOutputDir()
    this.resetCounters()
  }
  
  async generateDocument(
    stemDocument: STEMDocument,
    options: LaTeXGenerationOptions
  ): Promise<GeneratedDocument> {
    console.log('📝 Starting advanced LaTeX document generation...')
    const startTime = Date.now()
    
    try {
      this.resetCounters()
      
      // Generate document structure
      const structure = await this.buildDocumentStructure(stemDocument, options)
      
      // Generate LaTeX source
      const latexSource = await this.generateLaTeXSource(stemDocument, structure, options)
      
      // Generate MathML
      const mathmlOptions: MathMLGenerationOptions = {
        semanticAnnotations: true,
        contentMathML: true,
        presentationMathML: true,
        xmlFormatting: 'pretty',
        includeAlternatives: true
      }
      const mathmlDocument = await this.generateMathMLDocument(stemDocument, mathmlOptions)
      
      // Write files
      const latexPath = await this.writeLatexFile(latexSource, options)
      const mathmlPath = await this.writeMathMLFile(mathmlDocument.document)
      
      // Generate cross-references
      const crossReferences = this.generateCrossReferences(structure)
      
      // Calculate metadata
      const metadata = this.calculateMetadata(stemDocument, Date.now() - startTime)
      
      const result: GeneratedDocument = {
        latex: {
          source: latexSource,
          filePath: latexPath,
          structure,
          crossReferences
        },
        mathml: {
          document: mathmlDocument.document,
          filePath: mathmlPath,
          formulas: mathmlDocument.formulas
        },
        metadata
      }
      
      console.log(`✅ LaTeX/MathML generation completed in ${metadata.generationTime}ms`)
      console.log(`📊 Generated: ${metadata.formulaCount} formulas, ${metadata.tableCount} tables, ${metadata.figureCount} figures`)
      
      return result
      
    } catch (error) {
      console.error('❌ LaTeX/MathML generation failed:', error)
      throw new Error(`Document generation failed: ${error.message}`)
    }
  }
  
  private async buildDocumentStructure(
    stemDocument: STEMDocument,
    options: LaTeXGenerationOptions
  ): Promise<DocumentStructure> {
    console.log('🔨 Building document structure...')
    
    const sections: Section[] = []
    const equations: EquationReference[] = []
    const tables: TableReference[] = []
    const figures: FigureReference[] = []
    
    // Create main sections based on content
    if (stemDocument.formulas.length > 0) {
      sections.push(this.createFormulaSection(stemDocument.formulas, equations))
    }
    
    if (stemDocument.tables.length > 0) {
      sections.push(this.createTableSection(stemDocument.tables, tables))
    }
    
    if (stemDocument.diagrams.length > 0) {
      sections.push(this.createFigureSection(stemDocument.diagrams, figures))
    }
    
    if (stemDocument.textBlocks.length > 0) {
      sections.push(this.createTextSection(stemDocument.textBlocks))
    }
    
    return {
      sections,
      equations,
      tables,
      figures,
      bibliography: [] // Would be populated if references exist
    }
  }
  
  private createFormulaSection(formulas: MathFormula[], equations: EquationReference[]): Section {
    const contentBlocks: ContentBlock[] = []
    
    contentBlocks.push({
      type: 'text',
      content: 'This section presents the mathematical formulas detected in the document.'
    })
    
    for (const formula of formulas) {
      if (formula.type === 'equation') {
        this.counter.equations++
        const label = `eq:formula${this.counter.equations}`
        
        equations.push({
          id: formula.id,
          label,
          number: this.counter.equations,
          type: formula.type
        })
        
        contentBlocks.push({
          type: 'formula',
          content: formula.latex,
          label,
          caption: `Mathematical expression: ${formula.rawText}`
        })
      } else {
        contentBlocks.push({
          type: 'formula',
          content: formula.latex
        })
      }
      
      // Add explanation if variables are detected
      if (formula.variables.length > 0) {
        contentBlocks.push({
          type: 'text',
          content: `Variables: ${formula.variables.join(', ')}`
        })
      }
    }
    
    return {
      level: 1,
      title: 'Mathematical Formulas',
      label: 'sec:formulas',
      content: contentBlocks
    }
  }
  
  private createTableSection(tables: TableStructure[], tableRefs: TableReference[]): Section {
    const contentBlocks: ContentBlock[] = []
    
    contentBlocks.push({
      type: 'text',
      content: 'This section presents the tables detected and analyzed in the document.'
    })
    
    for (const table of tables) {
      this.counter.tables++
      const label = `tab:table${this.counter.tables}`
      
      tableRefs.push({
        id: table.id,
        label,
        number: this.counter.tables,
        caption: `Table ${this.counter.tables}: ${table.headers.join(', ')}`
      })
      
      const tableLatex = this.generateTableLatex(table)
      
      contentBlocks.push({
        type: 'table',
        content: tableLatex,
        label,
        caption: `Detected table with ${table.rows}×${table.cols} structure`
      })
    }
    
    return {
      level: 1,
      title: 'Tables and Data',
      label: 'sec:tables',
      content: contentBlocks
    }
  }
  
  private createFigureSection(diagrams: DiagramElement[], figureRefs: FigureReference[]): Section {
    const contentBlocks: ContentBlock[] = []
    
    contentBlocks.push({
      type: 'text',
      content: 'This section presents the figures and diagrams detected in the document.'
    })
    
    for (const diagram of diagrams) {
      this.counter.figures++
      const label = `fig:figure${this.counter.figures}`
      
      figureRefs.push({
        id: diagram.id,
        label,
        number: this.counter.figures,
        caption: diagram.description
      })
      
      contentBlocks.push({
        type: 'figure',
        content: `% Figure placeholder for ${diagram.type}\n\\rule{\\textwidth}{200pt}`,
        label,
        caption: diagram.description
      })
    }
    
    return {
      level: 1,
      title: 'Figures and Diagrams',
      label: 'sec:figures',
      content: contentBlocks
    }
  }
  
  private createTextSection(textBlocks: TextBlock[]): Section {
    const contentBlocks: ContentBlock[] = []
    
    // Group text blocks by type
    const headings = textBlocks.filter(block => block.type === 'heading')
    const paragraphs = textBlocks.filter(block => block.type === 'paragraph')
    const captions = textBlocks.filter(block => block.type === 'caption')
    
    if (headings.length > 0) {
      contentBlocks.push({
        type: 'text',
        content: '\\subsection{Detected Headings}'
      })
      
      for (const heading of headings) {
        contentBlocks.push({
          type: 'text',
          content: `\\paragraph{${this.escapeLatex(heading.text)}}`
        })
      }
    }
    
    if (paragraphs.length > 0) {
      contentBlocks.push({
        type: 'text',
        content: '\\subsection{Text Content}'
      })
      
      for (const paragraph of paragraphs.slice(0, 5)) { // Limit to first 5 paragraphs
        contentBlocks.push({
          type: 'text',
          content: this.escapeLatex(paragraph.text)
        })
      }
    }
    
    return {
      level: 1,
      title: 'Text Content',
      label: 'sec:text',
      content: contentBlocks
    }
  }
  
  private generateTableLatex(table: TableStructure): string {
    const colSpec = 'c'.repeat(table.cols)
    let latex = `\\begin{tabular}{${colSpec}}\n\\hline\n`
    
    // Add headers if available
    if (table.headers.length > 0) {
      latex += table.headers.map(h => this.escapeLatex(h)).join(' & ') + ' \\\\\n\\hline\n'
    }
    
    // Add data rows (limit to first 10 rows for readability)
    const maxRows = Math.min(table.data.length, 10)
    for (let i = 0; i < maxRows; i++) {
      const row = table.data[i]
      if (row) {
        latex += row.slice(0, table.cols).map(cell => this.escapeLatex(cell || '')).join(' & ') + ' \\\\\n'
      }
    }
    
    if (table.data.length > 10) {
      latex += `\\multicolumn{${table.cols}}{c}{\\textit{... ${table.data.length - 10} more rows}} \\\\\n`
    }
    
    latex += '\\hline\n\\end{tabular}'
    
    return latex
  }
  
  private async generateLaTeXSource(
    stemDocument: STEMDocument,
    structure: DocumentStructure,
    options: LaTeXGenerationOptions
  ): Promise<string> {
    console.log('📝 Generating LaTeX source...')
    
    let latex = this.generateDocumentPreamble(options)
    
    // Document metadata
    latex += `\\title{STEM Document Analysis Results}\n`
    latex += `\\author{Prismy STEM Engine}\n`
    latex += `\\date{\\today}\n\n`
    
    latex += `\\begin{document}\n\n`
    latex += `\\maketitle\n\n`
    
    // Abstract
    latex += `\\begin{abstract}\n`
    latex += `This document presents the results of automated STEM content analysis, including ${structure.equations.length} mathematical formulas, ${structure.tables.length} tables, and ${structure.figures.length} figures detected and processed.\n`
    latex += `\\end{abstract}\n\n`
    
    // Table of contents
    latex += `\\tableofcontents\n\\newpage\n\n`
    
    // Generate sections
    for (const section of structure.sections) {
      latex += this.generateSectionLatex(section, options)
    }
    
    // Bibliography (if needed)
    if (structure.bibliography.length > 0) {
      latex += `\\bibliography{references}\n`
      latex += `\\bibliographystyle{plain}\n\n`
    }
    
    latex += `\\end{document}\n`
    
    return latex
  }
  
  private generateDocumentPreamble(options: LaTeXGenerationOptions): string {
    let preamble = `\\documentclass[11pt,a4paper]{${options.documentClass}}\n\n`
    
    // Essential packages
    const packages = [
      'amsmath',
      'amsfonts', 
      'amssymb',
      'graphicx',
      'booktabs',
      'array',
      'longtable',
      'float',
      'caption',
      'subcaption',
      'hyperref',
      ...options.packages
    ]
    
    for (const pkg of [...new Set(packages)]) {
      preamble += `\\usepackage{${pkg}}\n`
    }
    
    preamble += '\n'
    
    // Custom commands
    preamble += `% Custom commands for STEM content\n`
    preamble += `\\newcommand{\\stemformula}[1]{\\begin{equation}#1\\end{equation}}\n`
    preamble += `\\newcommand{\\stemsection}[1]{\\section{#1}}\n`
    preamble += `\\newcommand{\\stemcaption}[1]{\\caption{#1}}\n\n`
    
    // Document settings
    if (options.quality === 'final') {
      preamble += `\\setlength{\\parindent}{0pt}\n`
      preamble += `\\setlength{\\parskip}{6pt plus 2pt minus 1pt}\n`
    }
    
    preamble += '\n'
    
    return preamble
  }
  
  private generateSectionLatex(section: Section, options: LaTeXGenerationOptions): string {
    const sectionCommand = section.level === 1 ? 'section' : 
                          section.level === 2 ? 'subsection' : 'subsubsection'
    
    let latex = `\\${sectionCommand}{${section.title}}\\label{${section.label}}\n\n`
    
    for (const block of section.content) {
      latex += this.generateContentBlockLatex(block, options)
    }
    
    latex += '\n'
    return latex
  }
  
  private generateContentBlockLatex(block: ContentBlock, options: LaTeXGenerationOptions): string {
    switch (block.type) {
      case 'text':
        return `${block.content}\n\n`
        
      case 'formula':
        if (block.label) {
          return `\\begin{equation}\\label{${block.label}}\n${block.content}\n\\end{equation}\n\n`
        } else {
          return `\\[${block.content}\\]\n\n`
        }
        
      case 'table':
        let tableLatex = `\\begin{table}[H]\n\\centering\n`
        if (block.caption) {
          tableLatex += `\\caption{${block.caption}}`
          if (block.label) {
            tableLatex += `\\label{${block.label}}`
          }
          tableLatex += '\n'
        }
        tableLatex += `${block.content}\n`
        tableLatex += `\\end{table}\n\n`
        return tableLatex
        
      case 'figure':
        let figureLatex = `\\begin{figure}[H]\n\\centering\n`
        figureLatex += `${block.content}\n`
        if (block.caption) {
          figureLatex += `\\caption{${block.caption}}`
          if (block.label) {
            figureLatex += `\\label{${block.label}}`
          }
          figureLatex += '\n'
        }
        figureLatex += `\\end{figure}\n\n`
        return figureLatex
        
      default:
        return `${block.content}\n\n`
    }
  }
  
  private async generateMathMLDocument(
    stemDocument: STEMDocument,
    options: MathMLGenerationOptions
  ): Promise<{document: string, formulas: MathMLFormula[]}> {
    console.log('🔣 Generating MathML document...')
    
    const formulas: MathMLFormula[] = []
    let mathmlDoc = `<?xml version="1.0" encoding="UTF-8"?>\n`
    mathmlDoc += `<document xmlns="http://www.w3.org/1998/Math/MathML"\n`
    mathmlDoc += `           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n`
    mathmlDoc += `  <head>\n`
    mathmlDoc += `    <title>STEM Document - MathML Representation</title>\n`
    mathmlDoc += `    <meta name="generator" content="Prismy STEM Engine" />\n`
    mathmlDoc += `    <meta name="created" content="${new Date().toISOString()}" />\n`
    mathmlDoc += `  </head>\n`
    mathmlDoc += `  <body>\n`
    
    // Process each formula
    for (const formula of stemDocument.formulas) {
      const mathmlFormula = await this.generateFormulaMathML(formula, options)
      formulas.push(mathmlFormula)
      
      mathmlDoc += `    <div class="formula" id="${formula.id}">\n`
      mathmlDoc += `      ${mathmlFormula.presentationML}\n`
      
      if (mathmlFormula.contentML && options.contentMathML) {
        mathmlDoc += `      ${mathmlFormula.contentML}\n`
      }
      
      mathmlDoc += `    </div>\n`
    }
    
    mathmlDoc += `  </body>\n`
    mathmlDoc += `</document>\n`
    
    return { document: mathmlDoc, formulas }
  }
  
  private async generateFormulaMathML(
    formula: MathFormula,
    options: MathMLGenerationOptions
  ): Promise<MathMLFormula> {
    // Generate presentation MathML
    const presentationML = this.generatePresentationMathML(formula, options)
    
    // Generate content MathML if requested
    const contentML = options.contentMathML ? 
      this.generateContentMathML(formula) : undefined
    
    // Generate semantic annotations
    const semanticAnnotations = options.semanticAnnotations ?
      this.generateSemanticAnnotations(formula) : []
    
    return {
      id: formula.id,
      presentationML,
      contentML,
      semanticAnnotations
    }
  }
  
  private generatePresentationMathML(formula: MathFormula, options: MathMLGenerationOptions): string {
    const indent = options.xmlFormatting === 'pretty' ? '      ' : ''
    const newline = options.xmlFormatting === 'pretty' ? '\n' : ''
    
    let mathml = `<math xmlns="http://www.w3.org/1998/Math/MathML">${newline}`
    mathml += `${indent}<semantics>${newline}`
    mathml += `${indent}  <mrow>${newline}`
    
    // Convert LaTeX-like content to MathML presentation
    const tokens = this.parseFormulaTokens(formula.latex)
    
    for (const token of tokens) {
      mathml += `${indent}    ${this.tokenToMathML(token)}${newline}`
    }
    
    mathml += `${indent}  </mrow>${newline}`
    
    // Add annotations
    mathml += `${indent}  <annotation encoding="application/x-tex">${formula.latex}</annotation>${newline}`
    mathml += `${indent}  <annotation encoding="text/plain">${formula.rawText}</annotation>${newline}`
    
    mathml += `${indent}</semantics>${newline}`
    mathml += `</math>`
    
    return mathml
  }
  
  private generateContentMathML(formula: MathFormula): string {
    // Simplified content MathML generation
    let contentML = `<math xmlns="http://www.w3.org/1998/Math/MathML">\n`
    contentML += `  <apply>\n`
    
    // Detect if this is an equation
    if (formula.latex.includes('=')) {
      contentML += `    <eq/>\n`
      const parts = formula.latex.split('=')
      for (const part of parts) {
        contentML += `    <ci>${part.trim()}</ci>\n`
      }
    } else {
      // Simple expression
      contentML += `    <ci>${formula.latex}</ci>\n`
    }
    
    contentML += `  </apply>\n`
    contentML += `</math>`
    
    return contentML
  }
  
  private generateSemanticAnnotations(formula: MathFormula): SemanticAnnotation[] {
    const annotations: SemanticAnnotation[] = []
    
    // Analyze variables
    for (const variable of formula.variables) {
      annotations.push({
        type: 'variable',
        symbol: variable,
        meaning: `Mathematical variable ${variable}`,
        context: formula.rawText
      })
    }
    
    // Analyze operators
    for (const operator of formula.operators) {
      annotations.push({
        type: 'operator',
        symbol: operator,
        meaning: this.getOperatorMeaning(operator),
        context: formula.rawText
      })
    }
    
    return annotations
  }
  
  private parseFormulaTokens(latex: string): Array<{type: string, value: string}> {
    const tokens = []
    const cleanLatex = latex.replace(/\\/g, '') // Remove backslashes for simplification
    
    // Simple tokenization (would be enhanced with proper LaTeX parser)
    const parts = cleanLatex.split(/([+\-=×÷(){}[\]])/)
    
    for (const part of parts) {
      if (part.trim()) {
        if (/[+\-=×÷()]/.test(part)) {
          tokens.push({ type: 'operator', value: part })
        } else if (/\d+/.test(part)) {
          tokens.push({ type: 'number', value: part })
        } else {
          tokens.push({ type: 'identifier', value: part })
        }
      }
    }
    
    return tokens
  }
  
  private tokenToMathML(token: {type: string, value: string}): string {
    switch (token.type) {
      case 'operator':
        return `<mo>${this.escapeXml(token.value)}</mo>`
      case 'number':
        return `<mn>${token.value}</mn>`
      case 'identifier':
        return `<mi>${this.escapeXml(token.value)}</mi>`
      default:
        return `<mtext>${this.escapeXml(token.value)}</mtext>`
    }
  }
  
  private getOperatorMeaning(operator: string): string {
    const meanings: Record<string, string> = {
      '+': 'Addition operator',
      '-': 'Subtraction operator',
      '×': 'Multiplication operator',
      '÷': 'Division operator',
      '=': 'Equality operator',
      '≠': 'Inequality operator',
      '≤': 'Less than or equal operator',
      '≥': 'Greater than or equal operator'
    }
    
    return meanings[operator] || `Mathematical operator: ${operator}`
  }
  
  private generateCrossReferences(structure: DocumentStructure): CrossReference[] {
    const crossRefs: CrossReference[] = []
    
    for (const eq of structure.equations) {
      crossRefs.push({
        id: eq.id,
        type: 'equation',
        label: eq.label
      })
    }
    
    for (const table of structure.tables) {
      crossRefs.push({
        id: table.id,
        type: 'table',
        label: table.label
      })
    }
    
    for (const figure of structure.figures) {
      crossRefs.push({
        id: figure.id,
        type: 'figure',
        label: figure.label
      })
    }
    
    return crossRefs
  }
  
  private calculateMetadata(stemDocument: STEMDocument, generationTime: number): {
    generationTime: number,
    formulaCount: number,
    tableCount: number,
    figureCount: number,
    pageEstimate: number,
    complexity: 'simple' | 'medium' | 'complex'
  } {
    const formulaCount = stemDocument.formulas.length
    const tableCount = stemDocument.tables.length
    const figureCount = stemDocument.diagrams.length
    
    // Estimate page count based on content
    const textPages = Math.ceil(stemDocument.textBlocks.length / 50)
    const formulaPages = Math.ceil(formulaCount / 10)
    const tablePages = tableCount
    const figurePages = figureCount
    const pageEstimate = Math.max(1, textPages + formulaPages + tablePages + figurePages)
    
    // Determine complexity
    let complexity: 'simple' | 'medium' | 'complex' = 'simple'
    const totalElements = formulaCount + tableCount + figureCount
    
    if (totalElements > 20 || formulaCount > 10) {
      complexity = 'complex'
    } else if (totalElements > 5 || formulaCount > 3) {
      complexity = 'medium'
    }
    
    return {
      generationTime,
      formulaCount,
      tableCount,
      figureCount,
      pageEstimate,
      complexity
    }
  }
  
  private async writeLatexFile(source: string, options: LaTeXGenerationOptions): Promise<string> {
    const filename = `stem_document_${Date.now()}.tex`
    const filePath = path.join(this.outputDir, filename)
    
    fs.writeFileSync(filePath, source, 'utf8')
    console.log(`📄 LaTeX file written: ${filePath}`)
    
    return filePath
  }
  
  private async writeMathMLFile(source: string): Promise<string> {
    const filename = `stem_document_${Date.now()}.xml`
    const filePath = path.join(this.outputDir, filename)
    
    fs.writeFileSync(filePath, source, 'utf8')
    console.log(`🔣 MathML file written: ${filePath}`)
    
    return filePath
  }
  
  private escapeLatex(text: string): string {
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\$/g, '\\$')
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/#/g, '\\#')
      .replace(/\^/g, '\\textasciicircum{}')
      .replace(/_/g, '\\_')
      .replace(/~/g, '\\textasciitilde{}')
  }
  
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
  
  private resetCounters(): void {
    this.counter = {
      equations: 0,
      tables: 0,
      figures: 0,
      sections: 0
    }
  }
  
  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
  }
  
  async cleanup(): Promise<void> {
    console.log('🧹 LaTeX Generator cleaned up')
  }
}

// Export singleton instance
export const advancedLaTeXGenerator = new AdvancedLaTeXGenerator()