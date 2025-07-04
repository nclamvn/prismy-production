'use client'

import { useEffect, useState, useCallback } from 'react'
import { CollaborationManager, UserPresence, CollaborationEvent } from '@/lib/realtime/collaboration-manager'
import { useSupabase } from '@/hooks/use-supabase'

export interface UseCollaborationOptions {
  documentId: string
  onCursorMove?: (userId: string, cursor: { x: number; y: number }) => void
  onSelectionChange?: (userId: string, selection: { start: number; end: number }) => void
  onEdit?: (userId: string, edit: Record<string, unknown>) => void
  onUsersChange?: (users: UserPresence[]) => void
}

export function useCollaboration(options: UseCollaborationOptions) {
  const { documentId, onCursorMove, onSelectionChange, onEdit, onUsersChange } = options
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useSupabase()
  const collaboration = CollaborationManager.getInstance()

  useEffect(() => {
    if (!user || !documentId) return

    let cleanup: (() => void) | undefined

    const setupCollaboration = async () => {
      try {
        // Join the document collaboration session
        await collaboration.joinDocument(
          documentId,
          user.id,
          user.email!,
          user.user_metadata?.display_name
        )

        setIsConnected(true)

        // Set up event listeners
        cleanup = collaboration.onCollaborationEvent(documentId, (event: CollaborationEvent) => {
          switch (event.type) {
            case 'cursor':
              if (event.userId !== user.id && onCursorMove) {
                const cursor = event.data.cursor as { x: number; y: number }
                onCursorMove(event.userId, cursor)
              }
              break

            case 'selection':
              if (event.userId !== user.id && onSelectionChange) {
                const selection = event.data.selection as { start: number; end: number }
                onSelectionChange(event.userId, selection)
              }
              break

            case 'edit':
              if (event.userId !== user.id && onEdit) {
                onEdit(event.userId, event.data)
              }
              break

            case 'status':
              const users = event.data.users as UserPresence[]
              setActiveUsers(users.filter(u => u.userId !== user.id))
              if (onUsersChange) {
                onUsersChange(users)
              }
              break
          }
        })

        // Get initial active users
        const users = collaboration.getActiveUsers(documentId)
        setActiveUsers(users.filter(u => u.userId !== user.id))
      } catch (error) {
        console.error('Failed to setup collaboration:', error)
        setIsConnected(false)
      }
    }

    setupCollaboration()

    // Cleanup on unmount
    return () => {
      if (cleanup) cleanup()
      collaboration.leaveDocument(documentId).catch(console.error)
      setIsConnected(false)
    }
  }, [user, documentId, onCursorMove, onSelectionChange, onEdit, onUsersChange])

  const updateCursor = useCallback(
    async (cursor: { x: number; y: number }) => {
      if (!user || !isConnected) return
      await collaboration.updateCursor(documentId, user.id, cursor)
    },
    [user, documentId, isConnected]
  )

  const updateSelection = useCallback(
    async (selection: { start: number; end: number }) => {
      if (!user || !isConnected) return
      await collaboration.updateSelection(documentId, user.id, selection)
    },
    [user, documentId, isConnected]
  )

  const broadcastEdit = useCallback(
    async (edit: { type: 'insert' | 'delete'; position: number; content?: string }) => {
      if (!user || !isConnected) return
      await collaboration.broadcastEdit(documentId, user.id, edit)
    },
    [user, documentId, isConnected]
  )

  const updateStatus = useCallback(
    async (status: 'online' | 'idle' | 'offline') => {
      if (!user || !isConnected) return
      await collaboration.updateUserStatus(documentId, user.id, status)
    },
    [user, documentId, isConnected]
  )

  return {
    activeUsers,
    isConnected,
    updateCursor,
    updateSelection,
    broadcastEdit,
    updateStatus,
  }
}