'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Copy, 
  Trash2, 
  Clock, 
  Users, 
  Gift,
  Download,
  Loader2,
  Check,
  AlertCircle,
  Calendar,
  CreditCard,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react'

interface Invite {
  id: string
  code: string
  credits: number
  isUsed: boolean
  usedBy?: string
  usedAt?: string
  expiresAt: string
  metadata?: any
  createdAt: string
}

interface InviteStats {
  total: number
  used: number
  expired: number
  active: number
  totalCreditsIssued: number
  averageRedemptionTime: number
}

interface CreateInviteForm {
  credits: number
  expiryDays: number
  purpose: string
  batchSize: number
}

export default function InviteManagementDashboard() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [stats, setStats] = useState<InviteStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedInvites, setSelectedInvites] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unused' | 'used' | 'expired'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurentPage] = useState(1)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState<CreateInviteForm>({
    credits: 500,
    expiryDays: 30,
    purpose: '',
    batchSize: 1
  })

  // Fetch invites and stats
  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [invitesResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/invites?showUsed=true&limit=50'),
        fetch('/api/admin/invites/stats')
      ])

      if (invitesResponse.ok) {
        const invitesData = await invitesResponse.json()
        setInvites(invitesData.invites || [])
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Create new invites
  const handleCreateInvites = async () => {
    try {
      setCreating(true)
      
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Created invites:', data.invites)
        
        // Refresh data
        await fetchData()
        
        // Reset form and close modal
        setCreateForm({
          credits: 500,
          expiryDays: 30,
          purpose: '',
          batchSize: 1
        })
        setShowCreateModal(false)
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to create invites'}`)
      }
    } catch (error) {
      console.error('Create invites error:', error)
      alert('Failed to create invites')
    } finally {
      setCreating(false)
    }
  }

  // Copy invite code to clipboard
  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  // Revoke selected invites
  const revokeSelected = async () => {
    if (selectedInvites.size === 0) return

    const confirmed = confirm(`Are you sure you want to revoke ${selectedInvites.size} invite(s)?`)
    if (!confirmed) return

    try {
      const response = await fetch('/api/admin/invites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteIds: Array.from(selectedInvites)
        })
      })

      if (response.ok) {
        await fetchData()
        setSelectedInvites(new Set())
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to revoke invites'}`)
      }
    } catch (error) {
      console.error('Revoke error:', error)
      alert('Failed to revoke invites')
    }
  }

  // Filter invites
  const filteredInvites = invites.filter(invite => {
    // Filter by status
    const now = new Date()
    const isExpired = new Date(invite.expiresAt) < now
    
    if (filter === 'used' && !invite.isUsed) return false
    if (filter === 'unused' && invite.isUsed) return false
    if (filter === 'expired' && !isExpired) return false

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        invite.code.toLowerCase().includes(term) ||
        invite.usedBy?.toLowerCase().includes(term) ||
        invite.metadata?.purpose?.toLowerCase().includes(term)
      )
    }

    return true
  })

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status badge
  const getStatusBadge = (invite: Invite) => {
    const now = new Date()
    const isExpired = new Date(invite.expiresAt) < now

    if (invite.isUsed) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Used</span>
    }
    if (isExpired) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Expired</span>
    }
    return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Active</span>
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Management</h1>
        <p className="text-gray-600">Manage invite codes for private beta access</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Gift className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Invites</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Redeemed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.used}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Credits Issued</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCreditsIssued.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search codes, users..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All invites</option>
              <option value="unused">Unused</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="flex space-x-3">
            {/* Refresh */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Revoke Selected */}
            {selectedInvites.size > 0 && (
              <button
                onClick={revokeSelected}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Revoke ({selectedInvites.size})
              </button>
            )}

            {/* Create New */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Invites
            </button>
          </div>
        </div>
      </div>

      {/* Invites Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedInvites.size === filteredInvites.length && filteredInvites.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvites(new Set(filteredInvites.map(inv => inv.id)))
                      } else {
                        setSelectedInvites(new Set())
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Used By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : filteredInvites.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No invites found
                  </td>
                </tr>
              ) : (
                filteredInvites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedInvites.has(invite.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedInvites)
                          if (e.target.checked) {
                            newSelected.add(invite.id)
                          } else {
                            newSelected.delete(invite.id)
                          }
                          setSelectedInvites(newSelected)
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {invite.code}
                        </code>
                        <button
                          onClick={() => copyCode(invite.code)}
                          className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          {copiedCode === invite.code ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invite.credits.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invite)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invite.usedBy ? (
                        <div>
                          <div>{invite.usedBy}</div>
                          {invite.usedAt && (
                            <div className="text-xs text-gray-500">
                              {formatDate(invite.usedAt)}
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invite.expiresAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => copyCode(invite.code)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invite Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !creating && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Invites</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credits per invite
                    </label>
                    <input
                      type="number"
                      value={createForm.credits}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, credits: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max="10000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry (days)
                    </label>
                    <input
                      type="number"
                      value={createForm.expiryDays}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, expiryDays: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max="365"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of invites
                    </label>
                    <input
                      type="number"
                      value={createForm.batchSize}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 1 }))}
                      min="1"
                      max="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose (optional)
                    </label>
                    <input
                      type="text"
                      value={createForm.purpose}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, purpose: e.target.value }))}
                      placeholder="e.g., Beta testers batch 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    disabled={creating}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateInvites}
                    disabled={creating}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create {createForm.batchSize} Invite{createForm.batchSize > 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}