/**
 * PRISMY VOICE CONTROL
 * Advanced voice interface for autonomous agent management
 * Supports Vietnamese and English with natural language processing
 */

import { Agent, Document, TaskResult } from '@/components/workspace/types'
import { aiProviderManager } from '../../ai/providers/ai-provider-manager'

export interface VoiceCommand {
  id: string
  transcript: string
  language: 'vi' | 'en'
  confidence: number
  intent: VoiceIntent
  entities: VoiceEntity[]
  timestamp: Date
  userId: string
  status: 'processing' | 'executed' | 'failed' | 'cancelled'
  response?: VoiceResponse
}

export interface VoiceIntent {
  name: string
  confidence: number
  category: 'agent_management' | 'document_processing' | 'query' | 'system_control' | 'learning'
  action: string
  parameters: Record<string, any>
}

export interface VoiceEntity {
  type: 'agent_name' | 'document_name' | 'task_type' | 'time' | 'location' | 'number' | 'specialty'
  value: string
  confidence: number
  position: {
    start: number
    end: number
  }
}

export interface VoiceResponse {
  text: string
  language: 'vi' | 'en'
  audioUrl?: string
  actionResults?: any[]
  suggestedFollowUps?: string[]
  executionTime: number
}

export interface VoiceProfile {
  userId: string
  preferredLanguage: 'vi' | 'en' | 'auto'
  voiceSettings: {
    speed: number
    pitch: number
    volume: number
    voice: string
  }
  commandHistory: VoiceCommand[]
  customCommands: CustomVoiceCommand[]
  shortcuts: VoiceShortcut[]
  preferences: {
    confirmationRequired: boolean
    verboseResponses: boolean
    enableContinuousListening: boolean
    wakeWord: string
  }
}

export interface CustomVoiceCommand {
  id: string
  trigger: string[]
  description: string
  action: string
  parameters: Record<string, any>
  language: 'vi' | 'en' | 'both'
  createdAt: Date
  usage: {
    count: number
    lastUsed: Date
    successRate: number
  }
}

export interface VoiceShortcut {
  id: string
  phrase: string
  expansion: string
  context: string[]
  language: 'vi' | 'en' | 'both'
}

export interface SpeechRecognitionConfig {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  grammars?: string[]
}

export interface TextToSpeechConfig {
  voice: string
  rate: number
  pitch: number
  volume: number
  language: string
}

export class VoiceControlService {
  private recognition: any = null
  private synthesis: SpeechSynthesis | null = null
  private isListening: boolean = false
  private voiceProfile: VoiceProfile | null = null
  private commandQueue: VoiceCommand[] = []
  private activeCommand: VoiceCommand | null = null

  constructor(
    private userId: string,
    private onCommandExecuted?: (command: VoiceCommand) => void,
    private onAgentAction?: (action: string, params: any) => Promise<any>
  ) {
    this.initializeVoiceControl()
  }

  /**
   * Initialize voice control system
   */
  private async initializeVoiceControl(): Promise<void> {
    try {
      console.log(`[Voice Control] Initializing for user ${this.userId}`)
      
      // Check browser support
      if (!this.checkBrowserSupport()) {
        throw new Error('Browser does not support voice control features')
      }

      // Load user voice profile
      await this.loadVoiceProfile()
      
      // Initialize speech recognition
      await this.initializeSpeechRecognition()
      
      // Initialize text-to-speech
      this.initializeTextToSpeech()
      
      console.log('[Voice Control] Initialization completed')

    } catch (error) {
      console.error('[Voice Control] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Start voice recognition
   */
  async startListening(): Promise<void> {
    try {
      if (!this.recognition) {
        throw new Error('Speech recognition not initialized')
      }

      if (this.isListening) {
        console.warn('[Voice Control] Already listening')
        return
      }

      this.isListening = true
      this.recognition.start()
      
      console.log('[Voice Control] Started listening')

    } catch (error) {
      console.error('[Voice Control] Failed to start listening:', error)
      this.isListening = false
      throw error
    }
  }

  /**
   * Stop voice recognition
   */
  stopListening(): void {
    try {
      if (this.recognition && this.isListening) {
        this.recognition.stop()
        this.isListening = false
        console.log('[Voice Control] Stopped listening')
      }
    } catch (error) {
      console.error('[Voice Control] Failed to stop listening:', error)
    }
  }

  /**
   * Process voice command
   */
  async processVoiceCommand(transcript: string, confidence: number = 1.0): Promise<VoiceCommand> {
    try {
      const command: VoiceCommand = {
        id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        transcript: transcript.trim(),
        language: this.detectLanguage(transcript),
        confidence,
        intent: await this.extractIntent(transcript),
        entities: await this.extractEntities(transcript),
        timestamp: new Date(),
        userId: this.userId,
        status: 'processing'
      }

      this.commandQueue.push(command)
      this.activeCommand = command

      // Execute command
      const response = await this.executeCommand(command)
      command.response = response
      command.status = 'executed'

      // Add to history
      this.addToHistory(command)

      // Notify listeners
      this.onCommandExecuted?.(command)

      console.log(`[Voice Control] Processed command: ${transcript}`)
      return command

    } catch (error) {
      console.error('[Voice Control] Command processing failed:', error)
      throw error
    }
  }

  /**
   * Execute voice command
   */
  private async executeCommand(command: VoiceCommand): Promise<VoiceResponse> {
    const startTime = Date.now()
    
    try {
      let actionResults: any[] = []
      let responseText = ''

      switch (command.intent.category) {
        case 'agent_management':
          actionResults = await this.executeAgentManagementCommand(command)
          responseText = this.generateAgentManagementResponse(command, actionResults)
          break

        case 'document_processing':
          actionResults = await this.executeDocumentProcessingCommand(command)
          responseText = this.generateDocumentProcessingResponse(command, actionResults)
          break

        case 'query':
          actionResults = await this.executeQueryCommand(command)
          responseText = this.generateQueryResponse(command, actionResults)
          break

        case 'system_control':
          actionResults = await this.executeSystemControlCommand(command)
          responseText = this.generateSystemControlResponse(command, actionResults)
          break

        case 'learning':
          actionResults = await this.executeLearningCommand(command)
          responseText = this.generateLearningResponse(command, actionResults)
          break

        default:
          responseText = command.language === 'vi' 
            ? 'Xin lỗi, tôi chưa hiểu lệnh này. Bạn có thể thử lại không?'
            : 'Sorry, I didn\'t understand that command. Could you try again?'
      }

      const response: VoiceResponse = {
        text: responseText,
        language: command.language,
        actionResults,
        suggestedFollowUps: this.generateFollowUpSuggestions(command),
        executionTime: Date.now() - startTime
      }

      // Generate audio response if enabled
      if (this.voiceProfile?.preferences.verboseResponses) {
        response.audioUrl = await this.generateAudioResponse(responseText, command.language)
      }

      return response

    } catch (error) {
      console.error('[Voice Control] Command execution failed:', error)
      
      return {
        text: command.language === 'vi' 
          ? 'Đã xảy ra lỗi khi thực hiện lệnh. Vui lòng thử lại.'
          : 'An error occurred while executing the command. Please try again.',
        language: command.language,
        actionResults: [],
        suggestedFollowUps: [],
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Execute agent management commands
   */
  private async executeAgentManagementCommand(command: VoiceCommand): Promise<any[]> {
    const { action, parameters } = command.intent
    const results: any[] = []

    switch (action) {
      case 'create_agent':
        if (this.onAgentAction) {
          const result = await this.onAgentAction('create_agent', parameters)
          results.push(result)
        }
        break

      case 'pause_agent':
        if (this.onAgentAction) {
          const result = await this.onAgentAction('pause_agent', parameters)
          results.push(result)
        }
        break

      case 'resume_agent':
        if (this.onAgentAction) {
          const result = await this.onAgentAction('resume_agent', parameters)
          results.push(result)
        }
        break

      case 'list_agents':
        if (this.onAgentAction) {
          const result = await this.onAgentAction('list_agents', {})
          results.push(result)
        }
        break

      case 'agent_status':
        if (this.onAgentAction) {
          const result = await this.onAgentAction('get_agent_status', parameters)
          results.push(result)
        }
        break

      default:
        console.warn(`[Voice Control] Unknown agent management action: ${action}`)
    }

    return results
  }

  /**
   * Execute document processing commands
   */
  private async executeDocumentProcessingCommand(command: VoiceCommand): Promise<any[]> {
    const { action, parameters } = command.intent
    const results: any[] = []

    switch (action) {
      case 'upload_document':
        // Handle document upload voice command
        break

      case 'analyze_document':
        if (this.onAgentAction) {
          const result = await this.onAgentAction('analyze_document', parameters)
          results.push(result)
        }
        break

      case 'search_documents':
        if (this.onAgentAction) {
          const result = await this.onAgentAction('search_documents', parameters)
          results.push(result)
        }
        break

      default:
        console.warn(`[Voice Control] Unknown document processing action: ${action}`)
    }

    return results
  }

  /**
   * Execute query commands
   */
  private async executeQueryCommand(command: VoiceCommand): Promise<any[]> {
    const { action, parameters } = command.intent
    const results: any[] = []

    if (action === 'ask_question' && this.onAgentAction) {
      const result = await this.onAgentAction('query_swarm', {
        query: parameters.question,
        timeout: 30000
      })
      results.push(result)
    }

    return results
  }

  /**
   * Execute system control commands
   */
  private async executeSystemControlCommand(command: VoiceCommand): Promise<any[]> {
    const { action, parameters } = command.intent
    const results: any[] = []

    switch (action) {
      case 'get_system_status':
        if (this.onAgentAction) {
          const result = await this.onAgentAction('get_swarm_insights', {})
          results.push(result)
        }
        break

      case 'backup_system':
        if (this.onAgentAction) {
          const result = await this.onAgentAction('create_backup', {})
          results.push(result)
        }
        break

      default:
        console.warn(`[Voice Control] Unknown system control action: ${action}`)
    }

    return results
  }

  /**
   * Execute learning commands
   */
  private async executeLearningCommand(command: VoiceCommand): Promise<any[]> {
    const { action, parameters } = command.intent
    const results: any[] = []

    switch (action) {
      case 'start_learning_session':
        // Handle learning session initiation
        break

      case 'get_recommendations':
        // Handle learning recommendations
        break

      default:
        console.warn(`[Voice Control] Unknown learning action: ${action}`)
    }

    return results
  }

  /**
   * Extract intent from voice command using AI
   */
  private async extractIntent(transcript: string): Promise<VoiceIntent> {
    try {
      // Use AI to analyze voice command intent
      const analysisRequest = {
        documentContent: `Voice Command Analysis: "${transcript}"`,
        documentType: 'voice_command',
        focus: 'daily_insights' as const,
        personality: 'general',
        language: this.detectLanguage(transcript) as 'vi' | 'en',
        culturalContext: 'Vietnam' as const
      }

      const analysis = await aiProviderManager.analyzeDocument(analysisRequest)
      
      // Parse AI response to extract intent
      return this.parseAIIntentResponse(analysis.insights, transcript)

    } catch (error) {
      console.error('[Voice Control] Intent extraction failed:', error)
      
      // Fallback to basic pattern matching
      return this.extractIntentFallback(transcript)
    }
  }

  /**
   * Extract entities from voice command
   */
  private async extractEntities(transcript: string): Promise<VoiceEntity[]> {
    const entities: VoiceEntity[] = []
    
    // Simple entity extraction patterns
    const patterns = {
      agent_name: /agent\s+(\w+)/gi,
      document_name: /document\s+["']([^"']+)["']/gi,
      task_type: /(analyze|upload|create|pause|resume|start|stop)/gi,
      number: /\b(\d+)\b/g
    }

    for (const [type, pattern] of Object.entries(patterns)) {
      let match
      while ((match = pattern.exec(transcript)) !== null) {
        entities.push({
          type: type as VoiceEntity['type'],
          value: match[1] || match[0],
          confidence: 0.8,
          position: {
            start: match.index,
            end: match.index + match[0].length
          }
        })
      }
    }

    return entities
  }

  /**
   * Generate response text based on command and results
   */
  private generateAgentManagementResponse(command: VoiceCommand, results: any[]): string {
    const { action } = command.intent
    const isVietnamese = command.language === 'vi'

    switch (action) {
      case 'create_agent':
        return isVietnamese 
          ? `Đã tạo agent thành công cho tài liệu.`
          : `Agent created successfully for the document.`

      case 'pause_agent':
        return isVietnamese 
          ? `Đã tạm dừng agent.`
          : `Agent paused successfully.`

      case 'resume_agent':
        return isVietnamese 
          ? `Đã khởi động lại agent.`
          : `Agent resumed successfully.`

      case 'list_agents':
        const agentCount = results[0]?.agents?.length || 0
        return isVietnamese 
          ? `Hiện có ${agentCount} agents đang hoạt động.`
          : `Currently ${agentCount} agents are active.`

      default:
        return isVietnamese 
          ? `Đã thực hiện lệnh quản lý agent.`
          : `Agent management command executed.`
    }
  }

  private generateDocumentProcessingResponse(command: VoiceCommand, results: any[]): string {
    const isVietnamese = command.language === 'vi'
    return isVietnamese 
      ? `Đã thực hiện xử lý tài liệu.`
      : `Document processing completed.`
  }

  private generateQueryResponse(command: VoiceCommand, results: any[]): string {
    const isVietnamese = command.language === 'vi'
    const answer = results[0]?.answer || 'No answer found'
    
    return isVietnamese 
      ? `Đây là câu trả lời: ${answer}`
      : `Here's the answer: ${answer}`
  }

  private generateSystemControlResponse(command: VoiceCommand, results: any[]): string {
    const isVietnamese = command.language === 'vi'
    return isVietnamese 
      ? `Đã thực hiện lệnh hệ thống.`
      : `System command executed.`
  }

  private generateLearningResponse(command: VoiceCommand, results: any[]): string {
    const isVietnamese = command.language === 'vi'
    return isVietnamese 
      ? `Đã thực hiện lệnh học tập.`
      : `Learning command executed.`
  }

  /**
   * Helper methods
   */
  private checkBrowserSupport(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }

  private async loadVoiceProfile(): Promise<void> {
    // Load user voice profile from storage or create default
    this.voiceProfile = {
      userId: this.userId,
      preferredLanguage: 'vi',
      voiceSettings: {
        speed: 1.0,
        pitch: 1.0,
        volume: 0.8,
        voice: 'default'
      },
      commandHistory: [],
      customCommands: [],
      shortcuts: [],
      preferences: {
        confirmationRequired: false,
        verboseResponses: true,
        enableContinuousListening: false,
        wakeWord: 'prismy'
      }
    }
  }

  private async initializeSpeechRecognition(): Promise<void> {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported')
    }

    this.recognition = new SpeechRecognition()
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = this.voiceProfile?.preferredLanguage === 'vi' ? 'vi-VN' : 'en-US'

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      if (result.isFinal) {
        const transcript = result[0].transcript
        const confidence = result[0].confidence
        this.processVoiceCommand(transcript, confidence)
      }
    }

    this.recognition.onerror = (event: any) => {
      console.error('[Voice Control] Speech recognition error:', event.error)
      this.isListening = false
    }

    this.recognition.onend = () => {
      this.isListening = false
    }
  }

  private initializeTextToSpeech(): void {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
    }
  }

  private detectLanguage(text: string): 'vi' | 'en' {
    // Simple language detection based on Vietnamese characters
    const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i
    return vietnamesePattern.test(text) ? 'vi' : 'en'
  }

  private parseAIIntentResponse(aiResponse: string, transcript: string): VoiceIntent {
    // Parse AI response to extract structured intent
    // This is a simplified implementation
    
    const intent: VoiceIntent = {
      name: 'unknown',
      confidence: 0.5,
      category: 'query',
      action: 'ask_question',
      parameters: { question: transcript }
    }

    // Basic intent classification
    if (transcript.toLowerCase().includes('tạo agent') || transcript.toLowerCase().includes('create agent')) {
      intent.category = 'agent_management'
      intent.action = 'create_agent'
      intent.name = 'create_agent'
      intent.confidence = 0.8
    } else if (transcript.toLowerCase().includes('dừng agent') || transcript.toLowerCase().includes('pause agent')) {
      intent.category = 'agent_management'
      intent.action = 'pause_agent'
      intent.name = 'pause_agent'
      intent.confidence = 0.8
    }

    return intent
  }

  private extractIntentFallback(transcript: string): VoiceIntent {
    // Basic fallback intent extraction
    return {
      name: 'general_query',
      confidence: 0.6,
      category: 'query',
      action: 'ask_question',
      parameters: { question: transcript }
    }
  }

  private generateFollowUpSuggestions(command: VoiceCommand): string[] {
    const isVietnamese = command.language === 'vi'
    
    const suggestions = isVietnamese ? [
      'Bạn có muốn xem trạng thái agents không?',
      'Tôi có thể giúp gì khác?',
      'Bạn có muốn phân tích tài liệu khác không?'
    ] : [
      'Would you like to check agent status?',
      'How else can I help?',
      'Would you like to analyze another document?'
    ]

    return suggestions.slice(0, 2)
  }

  private async generateAudioResponse(text: string, language: 'vi' | 'en'): Promise<string | undefined> {
    if (!this.synthesis) return undefined

    try {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language === 'vi' ? 'vi-VN' : 'en-US'
      utterance.rate = this.voiceProfile?.voiceSettings.speed || 1.0
      utterance.pitch = this.voiceProfile?.voiceSettings.pitch || 1.0
      utterance.volume = this.voiceProfile?.voiceSettings.volume || 0.8

      this.synthesis.speak(utterance)
      
      // Return a placeholder URL (in real implementation, would generate actual audio file)
      return `data:audio/wav;base64,${btoa(text)}`
      
    } catch (error) {
      console.error('[Voice Control] Audio generation failed:', error)
      return undefined
    }
  }

  private addToHistory(command: VoiceCommand): void {
    if (this.voiceProfile) {
      this.voiceProfile.commandHistory.unshift(command)
      
      // Keep only last 100 commands
      if (this.voiceProfile.commandHistory.length > 100) {
        this.voiceProfile.commandHistory = this.voiceProfile.commandHistory.slice(0, 100)
      }
    }
  }

  /**
   * Public API methods
   */
  public async speak(text: string, language?: 'vi' | 'en'): Promise<void> {
    const lang = language || this.voiceProfile?.preferredLanguage || 'vi'
    await this.generateAudioResponse(text, lang)
  }

  public getCommandHistory(): VoiceCommand[] {
    return this.voiceProfile?.commandHistory || []
  }

  public updateVoiceSettings(settings: Partial<VoiceProfile['voiceSettings']>): void {
    if (this.voiceProfile) {
      this.voiceProfile.voiceSettings = { ...this.voiceProfile.voiceSettings, ...settings }
    }
  }

  public addCustomCommand(command: Omit<CustomVoiceCommand, 'id' | 'createdAt' | 'usage'>): void {
    if (this.voiceProfile) {
      const customCommand: CustomVoiceCommand = {
        ...command,
        id: `custom-${Date.now()}`,
        createdAt: new Date(),
        usage: {
          count: 0,
          lastUsed: new Date(),
          successRate: 0
        }
      }
      this.voiceProfile.customCommands.push(customCommand)
    }
  }

  public getVoiceProfile(): VoiceProfile | null {
    return this.voiceProfile
  }

  public destroy(): void {
    this.stopListening()
    this.commandQueue = []
    this.activeCommand = null
    console.log(`[Voice Control] Destroyed for user ${this.userId}`)
  }
}

export default VoiceControlService