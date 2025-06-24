'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  FileText, 
  Plus, 
  Settings,
  Activity,
  Share2,
  Archive,
  Edit3,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Upload
} from 'lucide-react'

interface SharedWorkspaceProps {
  workspaceId: string
  userId: string
  userName: string
  className?: string
  onDocumentSelect?: (documentId: string) => void
}

interface WorkspaceMember {
  userId: string
  userName: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  status: 'active' | 'idle' | 'offline'
  color: string
  currentActivity?: {
    type: 'editing' | 'translating' | 'reviewing' | 'commenting'
    documentId: string
    location: string
  }
  lastActiveAt: Date
}

interface WorkspaceDocument {
  id: string
  name: string
  type: 'text' | 'translation' | 'collaborative_doc' | 'uploaded_file'
  status: 'draft' | 'in_progress' | 'review' | 'completed' | 'archived'
  createdBy: string
  createdAt: Date
  updatedAt: Date
  version: number
  assignedTo?: string[]
  metadata: {
    language?: string
    targetLanguage?: string
    tags: string[]
    priority: 'low' | 'medium' | 'high' | 'urgent'
  }
}

interface WorkspaceActivity {
  id: string
  type: string
  userId: string
  userName: string
  description: string
  timestamp: Date
  metadata: Record<string, any>
}

export default function SharedWorkspace({
  workspaceId,
  userId,
  userName,
  className = '',
  onDocumentSelect
}: SharedWorkspaceProps) {
  const [workspace, setWorkspace] = useState<any>(null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([])
  const [activities, setActivities] = useState<WorkspaceActivity[]>([])
  const [selectedTab, setSelectedTab] = useState<'documents' | 'members' | 'activity'>('documents')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'text' | 'translation' | 'collaborative_doc'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDocument, setShowCreateDocument] = useState(false)
  const [showInviteMember, setShowInviteMember] = useState(false)
  const [newDocumentName, setNewDocumentName] = useState('')
  const [newDocumentType, setNewDocumentType] = useState<WorkspaceDocument['type']>('text')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<WorkspaceMember['role']>('editor')

  const wsRef = useRef<WebSocket | null>(null)

  // Join workspace on mount
  useEffect(() => {
    joinWorkspace()
    setupWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [workspaceId, userId])

  // Fetch activities periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActivities()
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [workspaceId])

  const setupWebSocket = () => {
    // In a real implementation, connect to WebSocket for real-time updates
    // For now, simulate with periodic polling
    const interval = setInterval(() => {
      fetchWorkspaceData()
    }, 5000)

    return () => clearInterval(interval)
  }

  const joinWorkspace = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/collaboration/workspaces?id=${workspaceId}&action=join&userName=${encodeURIComponent(userName)}`)
      
      if (!response.ok) {
        throw new Error('Failed to join workspace')
      }

      const data = await response.json()
      if (data.success) {
        setWorkspace(data.workspace)
        setMembers(data.workspace.members || [])
        setDocuments(data.workspace.documents || [])
        await fetchActivities()
      }
    } catch (error) {
      console.error('Failed to join workspace:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWorkspaceData = async () => {
    try {
      const response = await fetch(`/api/collaboration/workspaces?id=${workspaceId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setWorkspace(data.workspace)
          setMembers(data.workspace.members || [])
          setDocuments(data.workspace.documents || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch workspace data:', error)
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/collaboration/workspaces?id=${workspaceId}&action=activities&limit=20`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setActivities(data.activities.map((a: any) => ({
            ...a,
            timestamp: new Date(a.timestamp)
          })))
        }
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    }
  }

  const createDocument = async () => {
    if (!newDocumentName.trim()) return

    try {
      const response = await fetch('/api/collaboration/workspaces', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId,
          action: 'create_document',
          name: newDocumentName,
          type: newDocumentType,
          content: '',
          metadata: {
            tags: [],
            priority: 'medium'
          }
        })
      })

      if (response.ok) {
        setNewDocumentName('')
        setShowCreateDocument(false)
        await fetchWorkspaceData()
        await fetchActivities()
      }
    } catch (error) {
      console.error('Failed to create document:', error)
    }
  }

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return

    try {
      const response = await fetch('/api/collaboration/workspaces', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId,
          action: 'invite_member',
          email: inviteEmail,
          role: inviteRole
        })
      })

      if (response.ok) {
        setInviteEmail('')
        setShowInviteMember(false)
        alert('Invitation sent successfully!')
      }
    } catch (error) {
      console.error('Failed to invite member:', error)
    }
  }

  const updateActivity = async (activity: WorkspaceMember['currentActivity']) => {
    try {
      await fetch('/api/collaboration/workspaces', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId,
          action: 'update_activity',
          activity
        })
      })
    } catch (error) {
      console.error('Failed to update activity:', error)
    }
  }

  const getStatusIcon = (status: WorkspaceDocument['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />
      case 'review': return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'draft': return <Edit3 className="w-4 h-4 text-gray-600" />
      default: return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  const getTypeIcon = (type: WorkspaceDocument['type']) => {
    switch (type) {
      case 'translation': return '🌍'
      case 'collaborative_doc': return '📝'
      case 'uploaded_file': return '📎'
      default: return '📄'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document_created': return <Plus className="w-4 h-4 text-green-600" />
      case 'document_updated': return <Edit3 className="w-4 h-4 text-blue-600" />
      case 'member_joined': return <Users className="w-4 h-4 text-purple-600" />
      case 'comment_added': return <MessageSquare className="w-4 h-4 text-yellow-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = filterType === 'all' || doc.type === filterType
    return matchesSearch && matchesType
  })

  const currentUser = members.find(m => m.userId === userId)

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">{workspace?.name}</h3>
          <span className="text-sm text-gray-600">{workspace?.type} workspace</span>
          {workspace?.description && (
            <span className="text-sm text-gray-500">• {workspace.description}</span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Active Members */}
          <div className="flex -space-x-2">
            {members.filter(m => m.status === 'active').slice(0, 5).map(member => (
              <div
                key={member.userId}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-sm font-medium text-white relative"
                style={{ backgroundColor: member.color }}
                title={`${member.userName} (${member.role})`}
              >
                {member.userName.charAt(0).toUpperCase()}
                {member.currentActivity && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                )}
              </div>
            ))}
            {members.filter(m => m.status === 'active').length > 5 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-sm font-medium text-white">
                +{members.filter(m => m.status === 'active').length - 5}
              </div>
            )}
          </div>

          {/* Actions */}
          {currentUser?.role && ['owner', 'admin', 'editor'].includes(currentUser.role) && (
            <button
              onClick={() => setShowCreateDocument(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>New Document</span>
            </button>
          )}

          {currentUser?.role && ['owner', 'admin'].includes(currentUser.role) && (
            <button
              onClick={() => setShowInviteMember(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Share2 className="w-4 h-4" />
              <span>Invite</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4">
          {[
            { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
            { id: 'members', label: 'Members', icon: Users, count: members.length },
            { id: 'activity', label: 'Activity', icon: Activity, count: activities.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4">
        {/* Documents Tab */}
        {selectedTab === 'documents' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="text">Text</option>
                <option value="translation">Translation</option>
                <option value="collaborative_doc">Collaborative</option>
                <option value="uploaded_file">Uploaded</option>
              </select>
            </div>

            {/* Documents List */}
            <div className="space-y-3">
              {filteredDocuments.map(document => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer"
                  onClick={() => {
                    if (onDocumentSelect) {
                      onDocumentSelect(document.id)
                    }
                    updateActivity({
                      type: 'editing',
                      documentId: document.id,
                      location: document.name
                    })
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{getTypeIcon(document.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{document.name}</h4>
                          {getStatusIcon(document.status)}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            document.metadata.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            document.metadata.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            document.metadata.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {document.metadata.priority}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mt-1">
                          <span>v{document.version}</span>
                          <span className="mx-2">•</span>
                          <span>Updated {document.updatedAt.toLocaleDateString()}</span>
                          {document.metadata.language && (
                            <>
                              <span className="mx-2">•</span>
                              <span>{document.metadata.language}</span>
                              {document.metadata.targetLanguage && (
                                <span> → {document.metadata.targetLanguage}</span>
                              )}
                            </>
                          )}
                        </div>

                        {document.metadata.tags.length > 0 && (
                          <div className="flex items-center space-x-1 mt-2">
                            {document.metadata.tags.map(tag => (
                              <span
                                key={tag}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {document.assignedTo && document.assignedTo.length > 0 && (
                        <div className="flex -space-x-1">
                          {document.assignedTo.slice(0, 3).map(assigneeId => {
                            const member = members.find(m => m.userId === assigneeId)
                            return member ? (
                              <div
                                key={assigneeId}
                                className="w-6 h-6 rounded-full border border-white flex items-center justify-center text-xs font-medium text-white"
                                style={{ backgroundColor: member.color }}
                                title={member.userName}
                              >
                                {member.userName.charAt(0).toUpperCase()}
                              </div>
                            ) : null
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {filteredDocuments.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    {searchQuery || filterType !== 'all' 
                      ? 'No documents match your search criteria'
                      : 'No documents yet. Create your first document to get started!'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members Tab */}
        {selectedTab === 'members' && (
          <div className="space-y-4">
            {members.map(member => (
              <div key={member.userId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium text-white relative"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.userName.charAt(0).toUpperCase()}
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      member.status === 'active' ? 'bg-green-500' :
                      member.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{member.userName}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                        member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        member.role === 'editor' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                    
                    {member.currentActivity && (
                      <p className="text-sm text-gray-600">
                        {member.currentActivity.type} in {member.currentActivity.location}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      Last active: {member.lastActiveAt.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-sm ${
                  member.status === 'active' ? 'bg-green-100 text-green-800' :
                  member.status === 'idle' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {member.status}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Activity Tab */}
        {selectedTab === 'activity' && (
          <div className="space-y-3">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-600">{activity.userName}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-600">
                      {activity.timestamp.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {activities.length === 0 && (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No recent activity</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Document Modal */}
      <AnimatePresence>
        {showCreateDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCreateDocument(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-96 max-w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Document</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Name
                  </label>
                  <input
                    type="text"
                    value={newDocumentName}
                    onChange={(e) => setNewDocumentName(e.target.value)}
                    placeholder="Enter document name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type
                  </label>
                  <select
                    value={newDocumentType}
                    onChange={(e) => setNewDocumentType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="text">Text Document</option>
                    <option value="translation">Translation Project</option>
                    <option value="collaborative_doc">Collaborative Document</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateDocument(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createDocument}
                  disabled={!newDocumentName.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Document
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowInviteMember(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-96 max-w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Member</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowInviteMember(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={inviteMember}
                  disabled={!inviteEmail.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Invitation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}