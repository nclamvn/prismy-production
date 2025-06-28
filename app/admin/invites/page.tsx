'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import UnifiedLayoutSimple from '@/components/layouts/UnifiedLayoutSimple'
import { Copy, Download, Plus, Check } from 'lucide-react'

interface InviteCode {
  id: string
  code: string
  credits: number
  isUsed: boolean
  usedBy?: string
  usedAt?: string
  expiresAt: string
  createdAt: string
}

export default function AdminInvitesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [invites, setInvites] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  
  // Generation form state
  const [count, setCount] = useState(10)
  const [credits, setCredits] = useState(500)
  const [showGenerated, setShowGenerated] = useState(false)

  useEffect(() => {
    checkAdminAndLoadInvites()
  }, [])

  const checkAdminAndLoadInvites = async () => {
    try {
      // Check if user is admin
      const adminRes = await fetch('/api/admin/check')
      if (!adminRes.ok) {
        router.push('/dashboard')
        return
      }

      // Load existing invites
      const invitesRes = await fetch('/api/admin/invites')
      const data = await invitesRes.json()
      
      if (data.success) {
        setInvites(data.invites)
      }
    } catch (error) {
      console.error('Error loading invites:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateInvites = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/invites/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, credits })
      })

      const data = await res.json()
      
      if (data.success) {
        setGeneratedCodes(data.codes)
        setShowGenerated(true)
        // Reload invites list
        checkAdminAndLoadInvites()
      }
    } catch (error) {
      console.error('Error generating invites:', error)
    } finally {
      setGenerating(false)
    }
  }

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const downloadCodes = () => {
    const content = generatedCodes.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prismy-invites-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <UnifiedLayoutSimple
      config={{
        variant: 'admin',
        showUserMenu: true,
        title: 'Invite Code Management',
        subtitle: 'Generate and manage invitation codes'
      }}
    >
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4">

        {/* Generation Form */}
        <div className="card-base p-8 mb-8">
          <h2 className="heading-2 mb-6">Generate New Invite Codes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="label-md3">Number of Codes</label>
              <input
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="input-base"
              />
            </div>
            
            <div>
              <label className="label-md3">Credits per Code</label>
              <input
                type="number"
                min="10"
                max="10000"
                step="10"
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className="input-base"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={generateInvites}
                disabled={generating}
                className="btn-md3-filled w-full"
              >
                {generating ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Codes
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Generated Codes Display */}
          {showGenerated && generatedCodes.length > 0 && (
            <div className="mt-8 p-6 rounded-xl" style={{ backgroundColor: 'var(--surface-panel)' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="heading-3">Generated Codes</h3>
                <button
                  onClick={downloadCodes}
                  className="btn-md3-outlined-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {generatedCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--surface-elevated)' }}
                  >
                    <code className="font-mono text-sm">{code}</code>
                    <button
                      onClick={() => copyCode(code, index)}
                      className="btn-md3-text-sm"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Existing Invites List */}
        <div className="card-base p-8">
          <h2 className="heading-2 mb-6">Existing Invite Codes</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--surface-outline)' }}>
                  <th className="text-left py-3 px-4">Code Preview</th>
                  <th className="text-left py-3 px-4">Credits</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Used By</th>
                  <th className="text-left py-3 px-4">Created</th>
                  <th className="text-left py-3 px-4">Expires</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr 
                    key={invite.id}
                    className="border-b hover:bg-gray-50"
                    style={{ borderColor: 'var(--surface-outline)' }}
                  >
                    <td className="py-3 px-4">
                      <code className="font-mono text-sm">{invite.code}</code>
                    </td>
                    <td className="py-3 px-4">{invite.credits}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invite.isUsed
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {invite.isUsed ? 'Used' : 'Available'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {invite.usedBy || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(invite.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </UnifiedLayoutSimple>
  )
}