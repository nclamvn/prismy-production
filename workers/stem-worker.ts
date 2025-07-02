/**
 * Phase 3.7-A: STEM Processing Worker
 * 
 * Specialized worker for processing STEM documents with:
 * - Mathematical formula recognition and LaTeX conversion
 * - Table structure preservation
 * - Scientific diagram analysis
 * - Layout-aware document reconstruction
 */

import { Job } from 'pg-boss'
import { mathFormulaDetector, STEMDocument, MathFormula } from '../lib/stem/math-formula-detector'
import { supabase } from '../lib/supabase'
import fs from 'fs'
import path from 'path'
import { PDFDocument } from 'pdf-lib'
import mammoth from 'mammoth'

export interface STEMJobData {
  jobId: string
  fileId: string
  filePath: string
  fileName: string
  fileType: string
  userId: string
  options: {
    preserveFormulas: boolean
    generateLatex: boolean
    detectTables: boolean
    analyzeDiagrams: boolean
    outputFormat: 'pdf' | 'docx' | 'latex' | 'mathml'
  }
}

export interface STEMJobResult {
  success: boolean
  stemDocument: STEMDocument
  outputFiles: {
    original: string
    processed: string
    latex?: string
    mathml?: string
  }
  metrics: {
    formulasDetected: number
    tablesDetected: number
    diagramsDetected: number
    processingTime: number
    confidence: number
  }
  error?: string
}

export class STEMWorker {
  private isInitialized = false
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    console.log('🔬 Initializing STEM Processing Worker...')
    
    try {
      await mathFormulaDetector.initialize()
      this.isInitialized = true
      console.log('✅ STEM Worker initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize STEM Worker:', error)
      throw error
    }
  }
  
  async processSTEMDocument(job: Job<STEMJobData>): Promise<STEMJobResult> {
    const startTime = Date.now()
    const { jobId, filePath, fileName, fileType, options } = job.data
    
    console.log(`🔬 Starting STEM processing for job ${jobId}`)
    console.log(`📄 File: ${fileName} (${fileType})`)
    
    try {
      // Update job progress
      await this.updateJobProgress(jobId, 10, 'Initializing STEM analysis')
      
      if (!this.isInitialized) {
        await this.initialize()
      }
      
      // Convert document to images for analysis
      await this.updateJobProgress(jobId, 20, 'Converting document to images')
      const imageBuffers = await this.convertToImages(filePath, fileType)
      
      // Process each page with STEM analysis
      await this.updateJobProgress(jobId, 30, 'Analyzing mathematical content')
      const stemDocument = await this.analyzeSTEMContent(imageBuffers)
      
      // Enhanced figure analysis integration
      await this.updateJobProgress(jobId, 50, 'Analyzing scientific figures')
      stemDocument.diagrams = await this.enhanceFigureAnalysis(stemDocument.diagrams, imageBuffers[0])
      
      // Semantic intelligence analysis
      await this.updateJobProgress(jobId, 55, 'Generating semantic insights')
      const semanticAnalysis = await this.generateSemanticInsights(stemDocument)
      
      // Generate enhanced output formats
      await this.updateJobProgress(jobId, 60, 'Generating enhanced formats')
      const outputFiles = await this.generateOutputs(stemDocument, fileName, options)
      
      // Calculate metrics
      const metrics = this.calculateMetrics(stemDocument, Date.now() - startTime)
      
      await this.updateJobProgress(jobId, 90, 'Finalizing STEM processing')
      
      // Store results in database
      await this.storeSTEMResults(jobId, stemDocument, outputFiles, metrics)
      
      await this.updateJobProgress(jobId, 100, 'STEM processing completed')
      
      console.log(`✅ STEM processing completed for job ${jobId}`)
      console.log(`📊 Results: ${metrics.formulasDetected} formulas, ${metrics.tablesDetected} tables, ${metrics.diagramsDetected} diagrams`)
      
      return {
        success: true,
        stemDocument,
        outputFiles,
        metrics,
        semanticAnalysis
      }
      
    } catch (error) {
      console.error(`❌ STEM processing failed for job ${jobId}:`, error)
      
      await this.updateJobProgress(jobId, -1, `STEM processing failed: ${error.message}`)
      
      return {
        success: false,
        stemDocument: null as any,
        outputFiles: null as any,
        metrics: null as any,
        semanticAnalysis: null as any,
        error: error.message
      }
    }
  }
  
  private async convertToImages(filePath: string, fileType: string): Promise<Buffer[]> {
    const images: Buffer[] = []
    
    if (fileType === 'application/pdf') {
      // Convert PDF pages to images
      const pdfBuffer = fs.readFileSync(filePath)
      const pdf = await PDFDocument.load(pdfBuffer)
      
      console.log(`📄 Processing ${pdf.getPageCount()} PDF pages`)
      
      // For simplicity, we'll use the first page
      // In production, you'd convert all pages to images using pdf2pic or similar
      images.push(pdfBuffer)
      
    } else if (fileType.includes('image/')) {
      // Direct image processing
      const imageBuffer = fs.readFileSync(filePath)
      images.push(imageBuffer)
      
    } else {
      throw new Error(`Unsupported file type for STEM analysis: ${fileType}`)
    }
    
    return images
  }
  
  private async analyzeSTEMContent(imageBuffers: Buffer[]): Promise<STEMDocument> {
    console.log(`🔍 Analyzing ${imageBuffers.length} images for STEM content`)
    
    let combinedSTEM: STEMDocument = {
      id: `stem_${Date.now()}`,
      formulas: [],
      tables: [],
      diagrams: [],
      textBlocks: [],
      layout: {
        columns: 1,
        pageWidth: 1000,
        pageHeight: 1000,
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        sections: []
      }
    }
    
    for (let i = 0; i < imageBuffers.length; i++) {
      console.log(`📊 Analyzing page ${i + 1}/${imageBuffers.length}`)
      
      const pageSTEM = await mathFormulaDetector.detectFormulas(imageBuffers[i])
      
      // Combine results from all pages
      combinedSTEM.formulas.push(...pageSTEM.formulas)
      combinedSTEM.tables.push(...pageSTEM.tables)
      combinedSTEM.diagrams.push(...pageSTEM.diagrams)
      combinedSTEM.textBlocks.push(...pageSTEM.textBlocks)
    }
    
    // Post-process and enhance detected content
    combinedSTEM = await this.enhanceSTEMDetection(combinedSTEM)
    
    return combinedSTEM
  }
  
  private async enhanceSTEMDetection(stemDoc: STEMDocument): Promise<STEMDocument> {
    console.log('🧠 Enhancing STEM detection with advanced analysis')
    
    // Enhance formula detection with context analysis
    for (const formula of stemDoc.formulas) {
      // Improve LaTeX conversion with context
      formula.latex = await this.enhanceLatexConversion(formula)
      
      // Add semantic analysis
      formula.mathml = await this.generateSemanticMathML(formula)
    }
    
    // Detect mathematical relationships between formulas
    stemDoc = await this.detectMathematicalRelationships(stemDoc)
    
    // Enhance table detection and structure
    stemDoc.tables = await this.enhanceTableDetection(stemDoc)
    
    return stemDoc
  }
  
  private async enhanceLatexConversion(formula: MathFormula): Promise<string> {
    // Enhanced LaTeX conversion with context awareness
    let latex = formula.latex
    
    // Advanced pattern recognition for complex formulas
    // This would typically use ML models trained on mathematical notation
    
    // Detect function notation
    latex = latex.replace(/(\w+)\s*\(\s*(\w+)\s*\)/g, '$1($2)')
    
    // Detect matrix notation
    if (formula.rawText.includes('[') && formula.rawText.includes(']')) {
      // Convert to LaTeX matrix format
      latex = `\\begin{bmatrix} ${latex.replace(/[\[\]]/g, '')} \\end{bmatrix}`
    }
    
    // Detect integral notation
    if (formula.rawText.includes('∫') || formula.rawText.includes('integral')) {
      latex = latex.replace(/integral\s*(\w+)\s*d(\w+)/g, '\\int $1 \\, d$2')
    }
    
    // Detect summation notation
    if (formula.rawText.includes('∑') || formula.rawText.includes('sum')) {
      latex = latex.replace(/sum\s*(\w+)\s*=\s*(\w+)\s*to\s*(\w+)/g, '\\sum_{$1=$2}^{$3}')
    }
    
    return latex
  }
  
  private async generateSemanticMathML(formula: MathFormula): Promise<string> {
    // Generate semantic MathML with meaning annotations
    const mathml = `
      <math xmlns="http://www.w3.org/1998/Math/MathML">
        <semantics>
          <mrow>
            <!-- Content would be generated based on formula structure -->
            <mtext>${formula.rawText}</mtext>
          </mrow>
          <annotation encoding="application/x-tex">${formula.latex}</annotation>
          <annotation encoding="text/plain">${formula.rawText}</annotation>
        </semantics>
      </math>
    `.trim()
    
    return mathml
  }
  
  private async detectMathematicalRelationships(stemDoc: STEMDocument): Promise<STEMDocument> {
    console.log('🔗 Detecting mathematical relationships')
    
    // Analyze formulas for mathematical relationships
    for (let i = 0; i < stemDoc.formulas.length; i++) {
      const formula1 = stemDoc.formulas[i]
      
      for (let j = i + 1; j < stemDoc.formulas.length; j++) {
        const formula2 = stemDoc.formulas[j]
        
        // Check for shared variables
        const sharedVars = formula1.variables.filter(v => formula2.variables.includes(v))
        
        if (sharedVars.length > 0) {
          console.log(`🔗 Found relationship: ${formula1.rawText} ↔ ${formula2.rawText} (shared: ${sharedVars.join(', ')})`)
        }
      }
    }
    
    return stemDoc
  }
  
  private async enhanceTableDetection(stemDoc: STEMDocument): Promise<any[]> {
    console.log('📊 Enhancing table detection with advanced analysis')
    
    // Enhanced table processing with the advanced table detector
    const enhancedTables = []
    
    for (const table of stemDoc.tables) {
      // Apply advanced analysis to each detected table
      const enhancedTable = {
        ...table,
        // Add formula integration
        formulaIntegration: this.integrateFormulasWithTable(table, stemDoc.formulas),
        // Add layout preservation
        layoutPreservation: this.preserveTableLayout(table),
        // Add semantic analysis
        semanticStructure: this.analyzeTableSemantics(table)
      }
      
      enhancedTables.push(enhancedTable)
    }
    
    console.log(`✅ Enhanced ${enhancedTables.length} tables with advanced analysis`)
    return enhancedTables
  }
  
  private integrateFormulasWithTable(table: any, formulas: any[]): any {
    // Find formulas that belong to table cells
    const tableFormulas = []
    
    for (const formula of formulas) {
      if (this.isFormulaInTable(formula, table)) {
        const cellPosition = this.findCellPosition(formula, table)
        tableFormulas.push({
          ...formula,
          cellRow: cellPosition.row,
          cellCol: cellPosition.col
        })
      }
    }
    
    return {
      totalFormulas: tableFormulas.length,
      formulas: tableFormulas,
      hasCalculatedFields: tableFormulas.length > 0
    }
  }
  
  private preserveTableLayout(table: any): any {
    return {
      originalStructure: {
        rows: table.rows,
        cols: table.cols,
        headers: table.headers
      },
      formatting: {
        borderStyle: 'grid',
        cellPadding: 8,
        alignment: 'left'
      },
      responsive: true
    }
  }
  
  private analyzeTableSemantics(table: any): any {
    const dataTypes = this.analyzeColumnTypes(table.data)
    const relationships = this.findColumnRelationships(table.data)
    
    return {
      columnTypes: dataTypes,
      relationships,
      dataQuality: this.assessDataQuality(table.data),
      semanticLabels: this.generateSemanticLabels(table.headers, dataTypes)
    }
  }
  
  private isFormulaInTable(formula: any, table: any): boolean {
    // Check if formula bounds overlap with table bounds
    return formula.bounds.x >= table.bounds.x &&
           formula.bounds.y >= table.bounds.y &&
           formula.bounds.x + formula.bounds.width <= table.bounds.x + table.bounds.width &&
           formula.bounds.y + formula.bounds.height <= table.bounds.y + table.bounds.height
  }
  
  private findCellPosition(formula: any, table: any): {row: number, col: number} {
    // Estimate cell position based on formula bounds relative to table
    const relativeX = (formula.bounds.x - table.bounds.x) / table.bounds.width
    const relativeY = (formula.bounds.y - table.bounds.y) / table.bounds.height
    
    const col = Math.floor(relativeX * table.cols)
    const row = Math.floor(relativeY * table.rows)
    
    return {
      row: Math.max(0, Math.min(row, table.rows - 1)),
      col: Math.max(0, Math.min(col, table.cols - 1))
    }
  }
  
  private analyzeColumnTypes(data: string[][]): string[] {
    if (!data || data.length === 0) return []
    
    const columnCount = data[0].length
    const types = []
    
    for (let col = 0; col < columnCount; col++) {
      const columnData = data.map(row => row[col]).filter(cell => cell && cell.trim())
      
      const numericCount = columnData.filter(cell => /^\d+(\.\d+)?$/.test(cell.trim())).length
      const formulaCount = columnData.filter(cell => /[+\-×÷=]/.test(cell)).length
      
      if (formulaCount > 0) {
        types.push('formula')
      } else if (numericCount / columnData.length > 0.7) {
        types.push('numeric')
      } else {
        types.push('text')
      }
    }
    
    return types
  }
  
  private findColumnRelationships(data: string[][]): any[] {
    // Basic relationship detection - would be enhanced with ML
    const relationships = []
    
    // Look for sum relationships, correlations, etc.
    // This is a simplified version
    
    return relationships
  }
  
  private assessDataQuality(data: string[][]): any {
    const totalCells = data.length * (data[0]?.length || 0)
    const emptyCells = data.flat().filter(cell => !cell || !cell.trim()).length
    const completeness = 1 - (emptyCells / totalCells)
    
    return {
      completeness,
      consistency: 0.8, // Would be calculated based on data patterns
      accuracy: 0.9     // Would be estimated based on validation rules
    }
  }
  
  private generateSemanticLabels(headers: string[], types: string[]): string[] {
    return headers.map((header, index) => {
      const type = types[index] || 'unknown'
      
      // Basic semantic labeling - would be enhanced with NLP
      if (type === 'numeric' && header.toLowerCase().includes('amount')) {
        return 'monetary_value'
      } else if (type === 'numeric' && header.toLowerCase().includes('date')) {
        return 'date_value'
      } else if (type === 'formula') {
        return 'calculated_field'
      }
      
      return 'text_field'
    })
  }
  
  private async enhanceFigureAnalysis(diagrams: any[], imageBuffer: Buffer): Promise<any[]> {
    console.log('📊 Enhancing figure analysis with advanced scientific detection')
    
    try {
      // Use the scientific figure detector for enhanced analysis
      const { scientificFigureDetector } = await import('../lib/stem/figure-detector')
      const figureResult = await scientificFigureDetector.detectFigures(imageBuffer)
      
      // Merge detected figures with existing diagrams
      const enhancedDiagrams = [...diagrams]
      
      for (const figure of figureResult.figures) {
        // Convert figure to diagram format
        const enhancedDiagram = {
          id: figure.id,
          type: figure.type,
          bounds: figure.bounds,
          description: figure.caption?.text || `${figure.type} figure`,
          confidence: figure.confidence,
          // Enhanced metadata
          enhancement: {
            hasVector: figure.metadata.hasVector,
            complexity: figure.metadata.complexity,
            elements: figure.metadata.elements,
            chartAnalysis: figure.analysis,
            captionLinked: !!figure.caption,
            svgAvailable: !!figure.outputs.vectorSvg
          }
        }
        
        enhancedDiagrams.push(enhancedDiagram)
      }
      
      console.log(`✅ Enhanced ${enhancedDiagrams.length} figures with scientific analysis`)
      return enhancedDiagrams
      
    } catch (error) {
      console.error('❌ Figure enhancement failed:', error)
      return diagrams // Return original diagrams if enhancement fails
    }
  }
  
  private async generateSemanticInsights(stemDocument: STEMDocument): Promise<any> {
    console.log('🧠 Generating semantic insights and intelligent analysis')
    
    try {
      // Use the semantic intelligence engine for enhanced analysis
      const { semanticIntelligenceEngine } = await import('../lib/intelligence/semantic-engine')
      const semanticAnalysis = await semanticIntelligenceEngine.analyzeDocument(stemDocument)
      
      console.log(`✅ Semantic analysis completed: ${semanticAnalysis.insights.length} insights, ${semanticAnalysis.recommendations.length} recommendations`)
      console.log(`🧠 Identified ${semanticAnalysis.knowledgeDomains.length} knowledge domains with ${Math.round(semanticAnalysis.confidence * 100)}% confidence`)
      
      return semanticAnalysis
      
    } catch (error) {
      console.error('❌ Semantic analysis failed:', error)
      
      // Return minimal semantic analysis on failure
      return {
        id: `semantic_fallback_${Date.now()}`,
        documentContext: {
          domain: 'general',
          academicLevel: 'undergraduate',
          contentType: 'document',
          complexity: 'intermediate',
          keywords: [],
          abstractTopics: []
        },
        knowledgeDomains: [],
        conceptMap: {
          nodes: [],
          edges: [],
          clusters: []
        },
        relationships: [],
        insights: [],
        recommendations: [],
        confidence: 0.3,
        processingTime: 0
      }
    }
  }
  
  private async generateOutputs(stemDoc: STEMDocument, fileName: string, options: any): Promise<any> {
    console.log('📝 Generating enhanced output formats with advanced LaTeX/MathML')
    
    const baseName = path.parse(fileName).name
    const outputDir = path.join(process.cwd(), 'temp', 'stem_outputs')
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    const outputs: any = {
      original: fileName,
      processed: path.join(outputDir, `${baseName}_processed.pdf`)
    }
    
    // Enhanced LaTeX/MathML generation using advanced generator
    try {
      const { advancedLaTeXGenerator } = await import('../lib/stem/latex-generator')
      
      const latexOptions = {
        documentClass: 'article' as const,
        packages: ['amsmath', 'amsfonts', 'amssymb', 'graphicx'],
        includeFormulas: true,
        includeTables: true,
        includeFigures: true,
        bibliography: false,
        crossReferences: true,
        outputFormat: 'tex' as const,
        quality: 'final' as const
      }
      
      const generatedDoc = await advancedLaTeXGenerator.generateDocument(stemDoc, latexOptions)
      
      outputs.latex = generatedDoc.latex.filePath
      outputs.mathml = generatedDoc.mathml.filePath
      outputs.structure = generatedDoc.latex.structure
      outputs.crossReferences = generatedDoc.latex.crossReferences
      outputs.metadata = generatedDoc.metadata
      
      console.log(`📄 Generated advanced LaTeX: ${outputs.latex}`)
      console.log(`🔣 Generated semantic MathML: ${outputs.mathml}`)
      console.log(`📊 Document complexity: ${generatedDoc.metadata.complexity}`)
      
    } catch (error) {
      console.error('❌ Advanced LaTeX/MathML generation failed, falling back to basic:', error)
      
      // Fallback to basic generation
      if (options.generateLatex) {
        const latexContent = await this.generateLatexDocument(stemDoc)
        const latexPath = path.join(outputDir, `${baseName}.tex`)
        fs.writeFileSync(latexPath, latexContent)
        outputs.latex = latexPath
      }
      
      if (options.outputFormat === 'mathml') {
        const mathmlContent = await this.generateMathMLDocument(stemDoc)
        const mathmlPath = path.join(outputDir, `${baseName}.xml`)
        fs.writeFileSync(mathmlPath, mathmlContent)
        outputs.mathml = mathmlPath
      }
    }
    
    return outputs
  }
  
  private async generateLatexDocument(stemDoc: STEMDocument): Promise<string> {
    console.log('📄 Generating LaTeX document')
    
    let latex = `
\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{amsfonts}
\\usepackage{amssymb}
\\usepackage{graphicx}

\\title{Processed STEM Document}
\\author{Prismy STEM Engine}
\\date{\\today}

\\begin{document}
\\maketitle

`
    
    // Add detected formulas
    if (stemDoc.formulas.length > 0) {
      latex += `\\section{Mathematical Formulas}\n\n`
      
      for (const formula of stemDoc.formulas) {
        if (formula.type === 'equation') {
          latex += `\\begin{equation}\n${formula.latex}\n\\end{equation}\n\n`
        } else {
          latex += `$${formula.latex}$\n\n`
        }
      }
    }
    
    // Add text blocks
    if (stemDoc.textBlocks.length > 0) {
      latex += `\\section{Text Content}\n\n`
      
      for (const block of stemDoc.textBlocks) {
        if (block.type === 'heading') {
          latex += `\\subsection{${block.text}}\n\n`
        } else {
          latex += `${block.text}\n\n`
        }
      }
    }
    
    latex += `\\end{document}`
    
    return latex
  }
  
  private async generateMathMLDocument(stemDoc: STEMDocument): Promise<string> {
    console.log('📄 Generating MathML document')
    
    let mathml = `<?xml version="1.0" encoding="UTF-8"?>
<document xmlns="http://www.w3.org/1998/Math/MathML">
  <head>
    <title>STEM Document - MathML Output</title>
  </head>
  <body>
`
    
    // Add formulas as MathML
    for (const formula of stemDoc.formulas) {
      mathml += `    <div class="formula">
      ${formula.mathml}
    </div>
`
    }
    
    mathml += `  </body>
</document>`
    
    return mathml
  }
  
  private calculateMetrics(stemDoc: STEMDocument, processingTime: number): any {
    const totalFormulas = stemDoc.formulas.length
    const totalTables = stemDoc.tables.length
    const totalDiagrams = stemDoc.diagrams.length
    
    // Calculate average confidence
    const avgConfidence = totalFormulas > 0
      ? stemDoc.formulas.reduce((sum, f) => sum + f.confidence, 0) / totalFormulas
      : 0
    
    return {
      formulasDetected: totalFormulas,
      tablesDetected: totalTables,
      diagramsDetected: totalDiagrams,
      processingTime,
      confidence: avgConfidence
    }
  }
  
  private async updateJobProgress(jobId: string, progress: number, status: string): Promise<void> {
    try {
      await supabase
        .from('jobs')
        .update({
          progress,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        
      console.log(`📊 Job ${jobId}: ${progress}% - ${status}`)
    } catch (error) {
      console.error('Failed to update job progress:', error)
    }
  }
  
  private async storeSTEMResults(jobId: string, stemDoc: STEMDocument, outputFiles: any, metrics: any): Promise<void> {
    try {
      // Store STEM analysis results
      await supabase
        .from('stem_analysis')
        .insert({
          job_id: jobId,
          formulas_detected: metrics.formulasDetected,
          tables_detected: metrics.tablesDetected,
          diagrams_detected: metrics.diagramsDetected,
          confidence: metrics.confidence,
          processing_time: metrics.processingTime,
          output_files: outputFiles,
          analysis_data: stemDoc,
          created_at: new Date().toISOString()
        })
        
      console.log(`💾 Stored STEM results for job ${jobId}`)
    } catch (error) {
      console.error('Failed to store STEM results:', error)
    }
  }
  
  async cleanup(): Promise<void> {
    await mathFormulaDetector.cleanup()
    console.log('🧹 STEM Worker cleaned up')
  }
}

// Export singleton instance
export const stemWorker = new STEMWorker()

// Worker function for job queue
export async function processSTEMJob(job: Job<STEMJobData>): Promise<STEMJobResult> {
  return await stemWorker.processSTEMDocument(job)
}