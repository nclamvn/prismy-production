import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { WebSocketClient } from '@/lib/websocket/ws-client'

// Types for workspace entities - updated to match API contract
export interface Document {
  id: string
  name: string
  type: string
  size: number
  pages: number
  status: 'queued' | 'translating' | 'translated' | 'failed'
  uploadedAt: Date
  downloadUrl?: string
  errorMessage?: string
  progress: number
}

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  documentId?: string
  isStreaming?: boolean
}

export interface WorkspaceState {
  // Document management
  documents: Document[]
  activeDocumentId: string | null

  // Chat state
  messages: ChatMessage[]
  chatPanelOpen: boolean
  isTyping: boolean

  // Credits tracking
  credits: number
  tier: 'free' | 'basic' | 'premium' | 'enterprise'

  // UI state
  sidebarCollapsed: boolean
  uploadDropzoneVisible: boolean

  // WebSocket state
  wsClient: WebSocketClient | null
  wsConnected: boolean

  // Actions
  upload: (files: File[]) => Promise<void>
  translate: (
    docId: string,
    sourceLang?: string,
    targetLang?: string
  ) => Promise<void>
  ask: (docId: string, message: string) => AsyncGenerator<any, void, unknown>
  setActiveDocument: (docId: string | null) => void
  setChatPanelOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  updateDocumentFromAPI: (docId: string) => Promise<void>
  removeDocument: (docId: string) => void
  reset: () => void
  connectWebSocket: () => Promise<void>
  disconnectWebSocket: () => void
}

// Initial state
const initialState = {
  documents: [],
  activeDocumentId: null,
  messages: [],
  chatPanelOpen: false,
  isTyping: false,
  credits: 20,
  tier: 'free' as const,
  sidebarCollapsed: false,
  uploadDropzoneVisible: false,
  wsClient: null,
  wsConnected: false,
}

export const useWorkspaceStore = create<WorkspaceState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Document upload action - real API implementation with comprehensive tracing
        upload: async (files: File[]) => {
          console.group('🔍 [CLIENT] Upload Pipeline Start')
          console.log(
            '[CLIENT] Upload initiated with files:',
            files.map(f => ({
              name: f.name,
              size: f.size,
              type: f.type,
              lastModified: f.lastModified,
            }))
          )

          const { tier } = get()
          console.log('[CLIENT] User tier:', tier)

          // Free tier validation (client-side check)
          if (tier === 'free') {
            const oversizedFiles = files.filter(f => f.size > 50_000_000) // 50MB
            if (oversizedFiles.length > 0) {
              console.error(
                '[CLIENT] Oversized files detected:',
                oversizedFiles.map(f => f.name)
              )
              throw new Error(`File too large. Maximum size is 50MB.`)
            }
          }

          // Upload files one by one
          for (let i = 0; i < files.length; i++) {
            const file = files[i]
            console.group(
              `🔍 [CLIENT] Processing file ${i + 1}/${files.length}: ${file.name}`
            )

            try {
              // Detailed file analysis
              console.log('[CLIENT] File properties:', {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: new Date(file.lastModified).toISOString(),
                sizeInMB: (file.size / (1024 * 1024)).toFixed(2),
                extension: file.name.split('.').pop(),
              })

              // Create FormData for upload
              console.log('[CLIENT] Creating FormData...')
              const formData = new FormData()
              formData.append('file', file)

              // Log FormData details
              console.log('[CLIENT] FormData created with entries:')
              for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                  console.log(
                    `  ${key}: File(${value.name}, ${value.size} bytes)`
                  )
                } else {
                  console.log(`  ${key}: ${value}`)
                }
              }

              // Capture request details
              const requestUrl = '/api/upload'
              const requestStartTime = performance.now()
              console.log('[CLIENT] Sending request to:', requestUrl)
              console.log('[CLIENT] Request headers will include:', {
                'Content-Type': 'multipart/form-data (auto-set by browser)',
                cookies: document.cookie ? 'Present' : 'None',
              })

              // Call upload API
              console.log('[CLIENT] Executing fetch request...')
              const response = await fetch(requestUrl, {
                method: 'POST',
                body: formData,
              })

              const requestEndTime = performance.now()
              const requestDuration = requestEndTime - requestStartTime

              // Log response details
              console.log('[CLIENT] Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                duration: `${requestDuration.toFixed(2)}ms`,
                headers: Object.fromEntries(response.headers.entries()),
                url: response.url,
              })

              if (!response.ok) {
                console.error('[CLIENT] Upload request failed:', {
                  status: response.status,
                  statusText: response.statusText,
                  url: response.url,
                })

                try {
                  const errorData = await response.json()
                  console.error('[CLIENT] Server error response:', errorData)
                  throw new Error(errorData.error || 'Upload failed')
                } catch (parseError) {
                  console.error(
                    '[CLIENT] Failed to parse error response:',
                    parseError
                  )
                  // Don't try to read response.text() after response.json() fails
                  // The body stream is already consumed
                  throw new Error(
                    `Upload failed with status ${response.status}: ${response.statusText}`
                  )
                }
              }

              console.log('[CLIENT] Parsing successful response...')
              const responseData = await response.json()
              console.log('[CLIENT] Response data:', responseData)

              const { jobId } = responseData
              console.log('[CLIENT] Job ID received:', jobId)

              // Add document to store with optimistic UI
              const newDocument: Document = {
                id: jobId,
                name: file.name,
                type: file.type,
                size: file.size,
                pages: Math.max(1, Math.ceil(file.size / (1024 * 2))), // Estimate
                status: 'queued',
                uploadedAt: new Date(),
                progress: 0,
              }

              console.log('[CLIENT] Adding document to store:', newDocument)
              set(state => ({
                documents: [...state.documents, newDocument],
                activeDocumentId: jobId,
              }))

              console.log(
                '[CLIENT] Document added successfully, setting up auto-translation...'
              )

              // Auto-start translation for uploaded document
              setTimeout(async () => {
                try {
                  console.log('[CLIENT] Starting auto-translation for:', jobId)
                  await get().translate(jobId)
                } catch (error) {
                  console.error('[CLIENT] Auto-translation failed:', error)
                }
              }, 1000)

              // Connect to WebSocket and subscribe to job progress
              console.log('[CLIENT] Setting up WebSocket subscription for:', jobId)
              await get().connectWebSocket()
              
              const { wsClient } = get()
              if (wsClient) {
                wsClient.subscribeToJob(jobId, (progress) => {
                  console.log('[WS] Job progress update:', progress)
                  
                  // Update document status in store
                  set(state => ({
                    documents: state.documents.map(d =>
                      d.id === jobId
                        ? {
                            ...d,
                            status: progress.status as Document['status'],
                            progress: progress.progress,
                            errorMessage: progress.error,
                          }
                        : d
                    ),
                  }))

                  // Add welcome message when translation completes
                  if (progress.status === 'translated') {
                    const document = get().documents.find(d => d.id === jobId)
                    if (document && !get().messages.some(m => m.documentId === jobId)) {
                      get().addMessage({
                        role: 'assistant',
                        content: `Document "${document.name}" has been translated! You can now ask me questions about its content.`,
                        documentId: jobId,
                      })
                    }
                  }
                })
              } else {
                // Fallback to polling if WebSocket fails
                console.log('[CLIENT] WebSocket not available, falling back to polling')
                get().pollJobStatus(jobId)
              }

              console.groupEnd() // End file processing group
            } catch (error) {
              console.error('[CLIENT] Upload error for file:', file.name, error)
              console.error('[CLIENT] Error details:', {
                message:
                  error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                file: {
                  name: file.name,
                  size: file.size,
                  type: file.type,
                },
              })
              console.groupEnd() // End file processing group
              throw error
            }
          }

          console.log('[CLIENT] All files processed successfully')
          console.groupEnd() // End upload pipeline group
        },

        // Translation action - real API implementation
        translate: async (
          docId: string,
          sourceLang = 'auto',
          targetLang = 'en'
        ) => {
          try {
            // Call translate API
            const response = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobId: docId, sourceLang, targetLang }),
            })

            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.error || 'Translation failed')
            }

            // Translation started successfully - set up WebSocket monitoring
            await get().connectWebSocket()
            
            const { wsClient } = get()
            if (wsClient) {
              wsClient.subscribeToJob(docId, (progress) => {
                console.log('[WS] Translation progress update:', progress)
                
                // Update document status in store
                set(state => ({
                  documents: state.documents.map(d =>
                    d.id === docId
                      ? {
                          ...d,
                          status: progress.status as Document['status'],
                          progress: progress.progress,
                          errorMessage: progress.error,
                        }
                      : d
                  ),
                }))

                // Add welcome message when translation completes
                if (progress.status === 'translated') {
                  const document = get().documents.find(d => d.id === docId)
                  if (document && !get().messages.some(m => m.documentId === docId)) {
                    get().addMessage({
                      role: 'assistant',
                      content: `Document "${document.name}" has been translated! You can now ask me questions about its content.`,
                      documentId: docId,
                    })
                  }
                }
              })
            }
          } catch (error) {
            // Update document status to failed
            set(state => ({
              documents: state.documents.map(d =>
                d.id === docId
                  ? {
                      ...d,
                      status: 'failed',
                      errorMessage:
                        error instanceof Error
                          ? error.message
                          : 'Translation failed',
                    }
                  : d
              ),
            }))
            throw error
          }
        },

        // Chat action - SSE streaming implementation
        ask: async function* (docId: string, message: string) {
          const document = get().documents.find(d => d.id === docId)
          if (!document) throw new Error('Document not found')

          // Add user message
          get().addMessage({
            role: 'user',
            content: message,
            documentId: docId,
          })

          set({ isTyping: true })

          try {
            // Call streaming chat API
            const response = await fetch('/api/llm-chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobId: docId, prompt: message }),
            })

            if (!response.ok) {
              const error = await response.json()
              if (response.status === 402) {
                // No credits remaining
                set({ credits: 0 })
                throw new Error(
                  'No credits remaining. Please upgrade to continue.'
                )
              }
              throw new Error(error.error || 'Chat failed')
            }

            // Setup SSE reader
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let assistantMessage = ''

            if (!reader) throw new Error('No response stream')

            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(line.slice(6))

                      if (data.type === 'content') {
                        assistantMessage += data.content
                        yield { type: 'content', content: data.content }
                      } else if (data.type === 'done') {
                        // Update credits
                        set({ credits: data.credits.remaining })

                        // Save final assistant message
                        get().addMessage({
                          role: 'assistant',
                          content: assistantMessage,
                          documentId: docId,
                        })

                        yield { type: 'done', credits: data.credits }
                        return
                      } else if (data.type === 'error') {
                        throw new Error(data.error)
                      }
                    } catch (parseError) {
                      // Skip malformed JSON
                      continue
                    }
                  }
                }
              }
            } finally {
              reader.releaseLock()
            }
          } catch (error) {
            get().addMessage({
              role: 'assistant',
              content:
                'Sorry, I encountered an error processing your question. Please try again.',
              documentId: docId,
            })
            throw error
          } finally {
            set({ isTyping: false })
          }
        },

        // State management actions
        setActiveDocument: docId => set({ activeDocumentId: docId }),
        setChatPanelOpen: open => set({ chatPanelOpen: open }),
        setSidebarCollapsed: collapsed => set({ sidebarCollapsed: collapsed }),
        setTier: tier => set({ tier }),

        addMessage: message =>
          set(state => ({
            messages: [
              ...state.messages,
              {
                ...message,
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date(),
              },
            ],
          })),

        // Update document from API response
        updateDocumentFromAPI: async (docId: string) => {
          try {
            const response = await fetch(`/api/jobs/${docId}`)
            if (!response.ok) return

            const jobData = await response.json()

            set(state => ({
              documents: state.documents.map(d =>
                d.id === docId
                  ? {
                      ...d,
                      status: jobData.status,
                      progress: jobData.progress,
                      downloadUrl: jobData.downloadUrl,
                      errorMessage: jobData.errorMessage,
                      pages: jobData.pages,
                    }
                  : d
              ),
              credits: jobData.credits?.left || state.credits,
            }))

            // Add welcome message when translation completes
            if (
              jobData.status === 'translated' &&
              !state.messages.some(m => m.documentId === docId)
            ) {
              get().addMessage({
                role: 'assistant',
                content: `Document "${jobData.filename}" has been translated! You can now ask me questions about its content.`,
                documentId: docId,
              })
            }
          } catch (error) {
            console.error('Failed to update document status:', error)
          }
        },

        // Poll job status (called after upload/translate)
        pollJobStatus: (docId: string) => {
          const poll = async () => {
            const document = get().documents.find(d => d.id === docId)
            if (
              !document ||
              document.status === 'translated' ||
              document.status === 'failed'
            ) {
              return // Stop polling
            }

            await get().updateDocumentFromAPI(docId)

            // Continue polling if still processing
            const updatedDoc = get().documents.find(d => d.id === docId)
            if (
              updatedDoc &&
              (updatedDoc.status === 'queued' ||
                updatedDoc.status === 'translating')
            ) {
              setTimeout(poll, 3000) // Poll every 3 seconds
            }
          }

          // Start polling after a short delay
          setTimeout(poll, 1000)
        },

        removeDocument: docId =>
          set(state => ({
            documents: state.documents.filter(d => d.id !== docId),
            activeDocumentId:
              state.activeDocumentId === docId ? null : state.activeDocumentId,
            messages: state.messages.filter(m => m.documentId !== docId),
          })),

        reset: () => set(initialState),

        // WebSocket connection management
        connectWebSocket: async () => {
          const { wsClient } = get()
          if (wsClient && wsClient.isReady()) {
            return // Already connected
          }

          try {
            // Get WebSocket token
            const tokenResponse = await fetch('/api/ws/token')
            if (!tokenResponse.ok) {
              throw new Error('Failed to get WebSocket token')
            }
            const { token } = await tokenResponse.json()

            // Create and connect WebSocket client
            const client = new WebSocketClient()
            await client.connect(token)

            set({ wsClient: client, wsConnected: true })

            console.log('[WS] WebSocket connected successfully')
          } catch (error) {
            console.error('[WS] Failed to connect WebSocket:', error)
            set({ wsConnected: false })
          }
        },

        disconnectWebSocket: () => {
          const { wsClient } = get()
          if (wsClient) {
            wsClient.disconnect()
            set({ wsClient: null, wsConnected: false })
            console.log('[WS] WebSocket disconnected')
          }
        },
      }),
      {
        name: 'prismy-workspace',
        // Persist only essential state, not temporary UI state
        partialize: state => ({
          documents: state.documents,
          activeDocumentId: state.activeDocumentId,
          tier: state.tier,
          credits: state.credits,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'workspace-store' }
  )
)
