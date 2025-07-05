'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useCollaboration } from '@/hooks/use-collaboration'
import { CollaborativeCursor } from './presence-indicators'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Save, FileText, Users, Circle } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

interface CollaborativeEditorProps {
  documentId: string
  initialContent?: string
  onSave?: (content: string) => Promise<void>
  readOnly?: boolean
}

interface RemoteCursor {
  userId: string
  position: { x: number; y: number }
  color: string
  name?: string
}

export function CollaborativeEditor({
  documentId,
  initialContent = '',
  onSave,
  readOnly = false
}: CollaborativeEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map())
  const [remoteSelections, setRemoteSelections] = useState<Map<string, { start: number; end: number }>>(new Map())
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedContent = useDebounce(content, 1000)

  const {
    activeUsers,
    isConnected,
    updateCursor,
    updateSelection,
    broadcastEdit,
    updateStatus
  } = useCollaboration({
    documentId,
    onCursorMove: (userId, cursor) => {
      const user = activeUsers.find(u => u.userId === userId)
      if (user) {
        setRemoteCursors(prev => {
          const next = new Map(prev)
          next.set(userId, {
            userId,
            position: cursor,
            color: user.color,
            name: user.displayName || user.email
          })
          return next
        })
      }
    },
    onSelectionChange: (userId, selection) => {
      setRemoteSelections(prev => {
        const next = new Map(prev)
        next.set(userId, selection)
        return next
      })
    },
    onEdit: (userId, edit) => {
      // Apply remote edits to the content
      setContent(prev => {
        const editType = edit.type as string
        const position = edit.position as number
        const content = edit.content as string | undefined
        
        if (editType === 'insert' && content) {
          return prev.slice(0, position) + content + prev.slice(position)
        } else if (editType === 'delete') {
          const deleteLength = content?.length || 1
          return prev.slice(0, position) + prev.slice(position + deleteLength)
        }
        return prev
      })
    },
    onUsersChange: (users) => {
      // Remove cursors for users who left
      setRemoteCursors(prev => {
        const next = new Map(prev)
        const activeUserIds = new Set(users.map(u => u.userId))
        for (const [userId] of next) {
          if (!activeUserIds.has(userId)) {
            next.delete(userId)
          }
        }
        return next
      })
    }
  })

  // Track cursor movement
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || !isConnected) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      updateCursor({ x, y })
    },
    [isConnected, updateCursor]
  )

  // Track selection changes
  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current || !isConnected) return

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd

    if (start !== end) {
      updateSelection({ start, end })
    }
  }, [isConnected, updateSelection])

  // Handle content changes
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value
      const oldContent = content

      // Detect the type of change
      if (newContent.length > oldContent.length) {
        // Insert operation
        const position = e.target.selectionStart - (newContent.length - oldContent.length)
        const insertedContent = newContent.slice(position, e.target.selectionStart)
        broadcastEdit({
          type: 'insert',
          position,
          content: insertedContent
        })
      } else if (newContent.length < oldContent.length) {
        // Delete operation
        const position = e.target.selectionStart
        const deletedContent = oldContent.slice(position, position + (oldContent.length - newContent.length))
        broadcastEdit({
          type: 'delete',
          position,
          content: deletedContent
        })
      }

      setContent(newContent)
    },
    [content, broadcastEdit]
  )

  // Auto-save functionality
  useEffect(() => {
    if (debouncedContent !== initialContent && onSave && !readOnly) {
      const save = async () => {
        setIsSaving(true)
        try {
          await onSave(debouncedContent)
          setLastSaved(new Date())
        } catch (error) {
          console.error('Failed to save:', error)
        } finally {
          setIsSaving(false)
        }
      }
      save()
    }
  }, [debouncedContent, initialContent, onSave, readOnly])

  // Update status based on activity
  useEffect(() => {
    let idleTimer: NodeJS.Timeout

    const setIdle = () => {
      updateStatus('idle')
    }

    const setActive = () => {
      updateStatus('online')
      clearTimeout(idleTimer)
      idleTimer = setTimeout(setIdle, 30000) // 30 seconds of inactivity
    }

    // Set initial status
    setActive()

    // Track activity
    window.addEventListener('mousemove', setActive)
    window.addEventListener('keydown', setActive)

    return () => {
      clearTimeout(idleTimer)
      window.removeEventListener('mousemove', setActive)
      window.removeEventListener('keydown', setActive)
      updateStatus('offline')
    }
  }, [updateStatus])

  const handleManualSave = async () => {
    if (!onSave || readOnly) return
    setIsSaving(true)
    try {
      await onSave(content)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Collaborative Document
          </CardTitle>
          <div className="flex items-center gap-4">
            {/* Connection status */}
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              <Circle 
                className={cn(
                  "h-2 w-2 mr-1",
                  isConnected ? "text-green-500" : "text-gray-500"
                )} 
                fill="currentColor"
              />
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>

            {/* Active users count */}
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {activeUsers.length + 1} {activeUsers.length === 0 ? 'user' : 'users'}
            </Badge>

            {/* Save button */}
            {!readOnly && (
              <Button
                size="sm"
                onClick={handleManualSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>
        {lastSaved && (
          <p className="text-sm text-muted-foreground mt-1">
            Last saved: {lastSaved.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="relative"
          onMouseMove={handleMouseMove}
        >
          {/* Remote cursors */}
          {Array.from(remoteCursors.values()).map(cursor => (
            <CollaborativeCursor
              key={cursor.userId}
              userId={cursor.userId}
              position={cursor.position}
              color={cursor.color}
              name={cursor.name}
            />
          ))}

          {/* Editor textarea */}
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onSelect={handleSelectionChange}
            placeholder="Start typing to collaborate..."
            className="min-h-[400px] font-mono resize-none"
            readOnly={readOnly}
          />

          {/* Remote selections overlay */}
          {Array.from(remoteSelections.entries()).map(([userId, selection]) => {
            const user = activeUsers.find(u => u.userId === userId)
            if (!user || !textareaRef.current) return null

            // Calculate selection position (simplified)
            const text = textareaRef.current.value
            const beforeSelection = text.slice(0, selection.start)
            const lines = beforeSelection.split('\n')
            const top = (lines.length - 1) * 20 // Approximate line height
            const left = lines[lines.length - 1].length * 8 // Approximate char width

            return (
              <div
                key={userId}
                className="absolute pointer-events-none"
                style={{
                  top: `${top}px`,
                  left: `${left}px`,
                  backgroundColor: user.color,
                  opacity: 0.3,
                  height: '20px',
                  width: `${(selection.end - selection.start) * 8}px`
                }}
              />
            )
          })}
        </div>

        {/* Collaboration info */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Real-time collaboration enabled.</strong> Multiple users can edit this document simultaneously.
            Changes are synchronized instantly and auto-saved every second.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}