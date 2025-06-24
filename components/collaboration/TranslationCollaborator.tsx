'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Clock,
  Target,
  Award
} from 'lucide-react'

interface TranslationCollaboratorProps {
  sessionId: string
  userId: string
  userName: string
  className?: string
  onTranslationComplete?: (finalTranslation: string) => void
}

interface TranslationSection {
  id: string
  text: string
  status: 'pending' | 'in_progress' | 'completed' | 'under_review'
  assignedTo?: string
  proposals: TranslationProposal[]
}

interface TranslationProposal {
  id: string
  sectionId: string
  translatedText: string
  userId: string
  userName: string
  confidence: number
  timestamp: Date
  votes: TranslationVote[]
  comments: TranslationComment[]
  status: 'proposed' | 'accepted' | 'rejected' | 'needs_revision'
  aiAssisted: boolean
  alternatives: string[]
}

interface TranslationVote {
  userId: string
  userName: string
  type: 'approve' | 'reject' | 'suggest_revision'
  comment?: string
  timestamp: Date
}

interface TranslationComment {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: Date
  replyTo?: string
}

interface Collaborator {
  userId: string
  userName: string
  role: 'lead' | 'translator' | 'reviewer' | 'observer'
  status: 'active' | 'idle' | 'offline'
  color: string
  contributionStats: {
    proposalsSubmitted: number
    proposalsAccepted: number
    reviewsCompleted: number
    wordsTranslated: number
  }
}

export default function TranslationCollaborator({
  sessionId,
  userId,
  userName,
  className = '',
  onTranslationComplete
}: TranslationCollaboratorProps) {
  const [session, setSession] = useState<any>(null)
  const [sections, setSections] = useState<TranslationSection[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [currentSection, setCurrentSection] = useState<string | null>(null)
  const [translationText, setTranslationText] = useState('')
  const [confidence, setConfidence] = useState(80)
  const [showComments, setShowComments] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState({
    totalSections: 0,
    completedSections: 0,
    percentComplete: 0
  })

  const translationInputRef = useRef<HTMLTextAreaElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Join session on mount
  useEffect(() => {
    joinSession()
  }, [sessionId, userId])

  // WebSocket connection
  useEffect(() => {
    // In a real implementation, connect to WebSocket for real-time updates
    // For now, simulate with periodic updates
    const interval = setInterval(() => {
      fetchSessionData()
    }, 5000)

    return () => clearInterval(interval)
  }, [sessionId])

  const joinSession = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/collaboration/translation?id=${sessionId}&action=join&userName=${encodeURIComponent(userName)}`)
      
      if (!response.ok) {
        throw new Error('Failed to join translation session')
      }

      const data = await response.json()
      if (data.success) {
        setSession(data.session)
        setCollaborators(data.session.collaborators || [])
        processSections(data.session)
        fetchProgress()
      }
    } catch (error) {
      console.error('Failed to join translation session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSessionData = async () => {
    try {
      const response = await fetch(`/api/collaboration/translation?id=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSession(data.session)
          setCollaborators(data.session.collaborators || [])
          processSections(data.session)
        }
      }
    } catch (error) {
      console.error('Failed to fetch session data:', error)
    }
  }

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/collaboration/translation?id=${sessionId}&action=progress`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProgress(data.progress)
        }
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    }
  }

  const processSections = (sessionData: any) => {
    if (!sessionData.sourceText) return

    // Split source text into sentences for collaborative translation
    const sentences = sessionData.sourceText.match(/[^\.!?]+[\.!?]+/g) || [sessionData.sourceText]
    const processedSections: TranslationSection[] = sentences.map((sentence, index) => {
      const sectionId = `section_${index}`
      const proposals = sessionData.translations?.filter((t: any) => t.sectionId === sectionId) || []
      
      return {
        id: sectionId,
        text: sentence.trim(),
        status: proposals.some((p: any) => p.status === 'accepted') ? 'completed' : 'pending',
        proposals: proposals.map((p: any) => ({
          ...p,
          timestamp: new Date(p.timestamp)
        }))
      }
    })

    setSections(processedSections)
  }

  const submitTranslation = async () => {
    if (!currentSection || !translationText.trim()) return

    try {
      const response = await fetch('/api/collaboration/translation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          action: 'submit_proposal',
          sectionId: currentSection,
          translatedText: translationText,
          confidence: confidence / 100,
          aiAssisted: false,
          alternatives: []
        })
      })

      if (response.ok) {
        setTranslationText('')
        setCurrentSection(null)
        await fetchSessionData()
        await fetchProgress()
      }
    } catch (error) {
      console.error('Failed to submit translation:', error)
    }
  }

  const voteOnProposal = async (proposalId: string, voteType: 'approve' | 'reject' | 'suggest_revision', comment?: string) => {
    try {
      const response = await fetch('/api/collaboration/translation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          action: 'vote_proposal',
          proposalId,
          voteType,
          comment
        })
      })

      if (response.ok) {
        await fetchSessionData()
        await fetchProgress()
      }
    } catch (error) {
      console.error('Failed to vote on proposal:', error)
    }
  }

  const addComment = async (proposalId: string) => {
    if (!commentText.trim()) return

    try {
      const response = await fetch('/api/collaboration/translation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          action: 'add_comment',
          proposalId,
          content: commentText
        })
      })

      if (response.ok) {
        setCommentText('')
        await fetchSessionData()
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const getVoteIcon = (voteType: string) => {
    switch (voteType) {
      case 'approve': return <ThumbsUp className="w-4 h-4 text-green-600" />
      case 'reject': return <ThumbsDown className="w-4 h-4 text-red-600" />
      case 'suggest_revision': return <Edit3 className="w-4 h-4 text-yellow-600" />
      default: return null
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-600" />
      case 'under_review': return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default: return <Target className="w-5 h-5 text-gray-400" />
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collaboration session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Translation Collaboration</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {session?.sourceLanguage} → {session?.targetLanguage}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Progress */}
          <div className="flex items-center space-x-2">
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentComplete}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">
              {Math.round(progress.percentComplete)}%
            </span>
          </div>

          {/* Collaborators */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <div className="flex -space-x-2">
              {collaborators.slice(0, 5).map(collaborator => (
                <div
                  key={collaborator.userId}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-sm font-medium text-white"
                  style={{ backgroundColor: collaborator.color }}
                  title={`${collaborator.userName} (${collaborator.role})`}
                >
                  {collaborator.userName.charAt(0).toUpperCase()}
                </div>
              ))}
              {collaborators.length > 5 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-sm font-medium text-white">
                  +{collaborators.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-96">
        {/* Sections List */}
        <div className="w-1/2 border-r border-gray-200 p-4 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Text Sections</h4>
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div key={section.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(section.status)}
                    <span className="text-sm font-medium text-gray-900">
                      Section {index + 1}
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentSection(section.id)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Translate
                  </button>
                </div>
                
                <p className="text-sm text-gray-700 mb-3">{section.text}</p>
                
                {/* Proposals */}
                {section.proposals.length > 0 && (
                  <div className="space-y-2">
                    {section.proposals.map(proposal => (
                      <div key={proposal.id} className="bg-gray-50 rounded p-2">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-900">
                              {proposal.userName}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {proposal.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {proposal.userId !== userId && proposal.status === 'proposed' && (
                              <>
                                <button
                                  onClick={() => voteOnProposal(proposal.id, 'approve')}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                                  title="Approve"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => voteOnProposal(proposal.id, 'reject')}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                  title="Reject"
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setShowComments(proposal.id)}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                  title="Comment"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-800 mb-2">{proposal.translatedText}</p>
                        
                        {/* Votes */}
                        {proposal.votes.length > 0 && (
                          <div className="flex items-center space-x-2 mb-2">
                            {proposal.votes.map((vote, voteIndex) => (
                              <div key={voteIndex} className="flex items-center space-x-1">
                                {getVoteIcon(vote.type)}
                                <span className="text-xs text-gray-600">{vote.userName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Comments */}
                        {proposal.comments.length > 0 && (
                          <div className="space-y-1">
                            {proposal.comments.map(comment => (
                              <div key={comment.id} className="text-xs">
                                <span className="font-medium">{comment.userName}:</span>{' '}
                                <span className="text-gray-700">{comment.content}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Comment Input */}
                        {showComments === proposal.id && (
                          <div className="mt-2 flex space-x-2">
                            <input
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Add a comment..."
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addComment(proposal.id)
                                  setShowComments(null)
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                addComment(proposal.id)
                                setShowComments(null)
                              }}
                              className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Post
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Translation Interface */}
        <div className="w-1/2 p-4">
          {currentSection ? (
            <div className="h-full flex flex-col">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Translate Section: {sections.findIndex(s => s.id === currentSection) + 1}
              </h4>
              
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-700">
                  {sections.find(s => s.id === currentSection)?.text}
                </p>
              </div>
              
              <textarea
                ref={translationInputRef}
                value={translationText}
                onChange={(e) => setTranslationText(e.target.value)}
                placeholder="Enter your translation..."
                className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <label className="text-sm text-gray-700">Confidence:</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={confidence}
                    onChange={(e) => setConfidence(parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">{confidence}%</span>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentSection(null)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitTranslation}
                    disabled={!translationText.trim()}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Translation
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Select a section to translate</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-6">
            <span>Total Sections: {sections.length}</span>
            <span>Completed: {progress.completedSections}</span>
            <span>Remaining: {sections.length - progress.completedSections}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {collaborators.find(c => c.userId === userId) && (
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span>
                  Your contributions: {collaborators.find(c => c.userId === userId)?.contributionStats.proposalsSubmitted || 0} proposals
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}