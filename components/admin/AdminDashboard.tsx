'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { 
  Users, 
  CreditCard, 
  Activity, 
  TrendingUp,
  Search,
  RefreshCw,
  Download,
  Mail,
  Gift
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface UserStats {
  totalUsers: number
  activeUsers: number
  trialUsers: number
  paidUsers: number
}

interface CreditStats {
  totalCreditsIssued: number
  totalCreditsUsed: number
  averageUsagePerUser: number
}

interface User {
  id: string
  email: string
  role: 'admin' | 'trial' | 'paid'
  trial_credits: number
  current_balance: number
  created_at: string
  last_seen: string
}

export default function AdminDashboard() {
  const toast = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    trialUsers: 0,
    paidUsers: 0
  })
  const [creditStats, setCreditStats] = useState<CreditStats>({
    totalCreditsIssued: 0,
    totalCreditsUsed: 0,
    averageUsagePerUser: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [creditAmount, setCreditAmount] = useState(15000)

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Fetch users with credit balance
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          credits!credits_user_id_fkey (
            change,
            created_at
          )
        `)
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // Calculate current balance for each user
      const usersWithBalance = usersData?.map(user => {
        const balance = user.credits?.reduce((sum: number, credit: any) => sum + credit.change, 0) || 0
        return {
          ...user,
          current_balance: balance
        }
      }) || []

      setUsers(usersWithBalance)

      // Calculate stats
      const stats: UserStats = {
        totalUsers: usersWithBalance.length,
        activeUsers: usersWithBalance.filter(u => u.last_seen && new Date(u.last_seen) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
        trialUsers: usersWithBalance.filter(u => u.role === 'trial').length,
        paidUsers: usersWithBalance.filter(u => u.role === 'paid').length
      }
      setUserStats(stats)

      // Calculate credit stats
      const totalIssued = usersWithBalance.reduce((sum, user) => {
        const issued = user.credits?.filter((c: any) => c.change > 0).reduce((s: number, c: any) => s + c.change, 0) || 0
        return sum + issued
      }, 0)

      const totalUsed = usersWithBalance.reduce((sum, user) => {
        const used = user.credits?.filter((c: any) => c.change < 0).reduce((s: number, c: any) => s + Math.abs(c.change), 0) || 0
        return sum + used
      }, 0)

      setCreditStats({
        totalCreditsIssued: totalIssued,
        totalCreditsUsed: totalUsed,
        averageUsagePerUser: usersWithBalance.length > 0 ? Math.round(totalUsed / usersWithBalance.length) : 0
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const generateInviteCode = async () => {
    try {
      const code = `PRISMY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          code,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          max_uses: 10,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .select()
        .single()

      if (error) throw error

      setInviteCode(code)
      toast.success('Invite code generated successfully!')
    } catch (error) {
      console.error('Error generating invite code:', error)
      toast.error('Failed to generate invite code')
    }
  }

  const addCreditsToUser = async (userId: string, amount: number) => {
    try {
      const { error } = await supabase
        .from('credits')
        .insert({
          user_id: userId,
          change: amount,
          reason: 'Admin credit grant',
          created_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success(`Added ${amount} credits successfully!`)
      fetchDashboardData() // Refresh data
    } catch (error) {
      console.error('Error adding credits:', error)
      toast.error('Failed to add credits')
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users (7d)</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.activeUsers}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Credits Issued</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('vi-VN').format(creditStats.totalCreditsIssued)}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Credits Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('vi-VN').format(creditStats.totalCreditsUsed)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Invite Code Generator */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Generate Invite Code</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={generateInviteCode}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Gift className="w-4 h-4" />
              Generate Code
            </button>
            {inviteCode && (
              <div className="flex items-center gap-2">
                <code className="px-4 py-2 bg-gray-100 rounded-md font-mono">{inviteCode}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteCode)
                    toast.success('Copied to clipboard!')
                  }}
                  className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Users</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={fetchDashboardData}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'paid' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Intl.NumberFormat('vi-VN').format(user.current_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          const amount = prompt('Enter credit amount to add:')
                          if (amount && !isNaN(Number(amount))) {
                            addCreditsToUser(user.id, Number(amount))
                          }
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Add Credits
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}