'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  Building2,
  Shield,
  Settings,
  Plus,
  UserPlus,
  Crown,
  Mail,
  Phone,
  Globe,
  Activity,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  Download,
  Upload,
  Zap,
  Target,
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useAuth } from '@/contexts/AuthContext'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'member' | 'viewer'
  department: string
  avatar?: string
  joinedAt: string
  lastActive: string
  status: 'active' | 'inactive' | 'pending'
  permissions: string[]
  usageStats: {
    totalTranslations: number
    wordsTranslated: number
    timeSpent: number
  }
}

interface Organization {
  id: string
  name: string
  plan: 'enterprise' | 'business' | 'pro'
  memberCount: number
  maxMembers: number
  usageQuota: {
    used: number
    total: number
    period: 'monthly' | 'annual'
  }
  features: string[]
  billing: {
    status: 'active' | 'past_due' | 'canceled'
    nextBilling: string
    amount: number
    currency: string
  }
}

interface EnterpriseDashboardProps {
  className?: string
}

export default function EnterpriseDashboard({
  className = '',
}: EnterpriseDashboardProps) {
  const { language } = useSSRSafeLanguage()
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'permissions' | 'billing' | 'settings'>('overview')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('member')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  const content = {
    vi: {
      title: 'Doanh nghiệp',
      subtitle: 'Quản lý nhóm và tài nguyên doanh nghiệp',
      tabs: {
        overview: 'Tổng quan',
        team: 'Quản lý nhóm',
        permissions: 'Quyền hạn',
        billing: 'Thanh toán',
        settings: 'Cài đặt',
      },
      overview: {
        organizationHealth: 'Tình trạng tổ chức',
        teamSize: 'Quy mô nhóm',
        usageQuota: 'Hạn mức sử dụng',
        activeUsers: 'Người dùng hoạt động',
        monthlyUsage: 'Sử dụng hàng tháng',
        teamActivity: 'Hoạt động nhóm',
        quickActions: 'Hành động nhanh',
        inviteMembers: 'Mời thành viên',
        manageRoles: 'Quản lý vai trò',
        viewBilling: 'Xem thanh toán',
      },
      team: {
        inviteMember: 'Mời thành viên',
        searchMembers: 'Tìm kiếm thành viên',
        filterByRole: 'Lọc theo vai trò',
        allRoles: 'Tất cả vai trò',
        role: 'Vai trò',
        department: 'Phòng ban',
        lastActive: 'Hoạt động cuối',
        joinedAt: 'Ngày tham gia',
        status: 'Trạng thái',
        actions: 'Thao tác',
        memberDetails: 'Chi tiết thành viên',
        usageStats: 'Thống kê sử dụng',
      },
      roles: {
        admin: 'Quản trị viên',
        manager: 'Quản lý',
        member: 'Thành viên',
        viewer: 'Người xem',
      },
      status: {
        active: 'Hoạt động',
        inactive: 'Không hoạt động',
        pending: 'Chờ xác nhận',
      },
      permissions: {
        manageTeam: 'Quản lý nhóm',
        manageProjects: 'Quản lý dự án',
        viewAnalytics: 'Xem phân tích',
        manageBilling: 'Quản lý thanh toán',
        systemSettings: 'Cài đặt hệ thống',
      },
      billing: {
        currentPlan: 'Gói hiện tại',
        nextBilling: 'Thanh toán tiếp theo',
        usageThisPeriod: 'Sử dụng kỳ này',
        teamMembers: 'Thành viên nhóm',
        upgradeNow: 'Nâng cấp ngay',
        changePlan: 'Thay đổi gói',
      },
      invite: {
        title: 'Mời thành viên mới',
        emailLabel: 'Địa chỉ email',
        emailPlaceholder: 'nhom@congty.com',
        roleLabel: 'Vai trò',
        departmentLabel: 'Phòng ban',
        sendInvite: 'Gửi lời mời',
        cancel: 'Hủy',
      },
    },
    en: {
      title: 'Enterprise',
      subtitle: 'Manage team and enterprise resources',
      tabs: {
        overview: 'Overview',
        team: 'Team Management',
        permissions: 'Permissions',
        billing: 'Billing',
        settings: 'Settings',
      },
      overview: {
        organizationHealth: 'Organization Health',
        teamSize: 'Team Size',
        usageQuota: 'Usage Quota',
        activeUsers: 'Active Users',
        monthlyUsage: 'Monthly Usage',
        teamActivity: 'Team Activity',
        quickActions: 'Quick Actions',
        inviteMembers: 'Invite Members',
        manageRoles: 'Manage Roles',
        viewBilling: 'View Billing',
      },
      team: {
        inviteMember: 'Invite Member',
        searchMembers: 'Search members',
        filterByRole: 'Filter by role',
        allRoles: 'All roles',
        role: 'Role',
        department: 'Department',
        lastActive: 'Last Active',
        joinedAt: 'Joined',
        status: 'Status',
        actions: 'Actions',
        memberDetails: 'Member Details',
        usageStats: 'Usage Statistics',
      },
      roles: {
        admin: 'Admin',
        manager: 'Manager',
        member: 'Member',
        viewer: 'Viewer',
      },
      status: {
        active: 'Active',
        inactive: 'Inactive',
        pending: 'Pending',
      },
      permissions: {
        manageTeam: 'Manage Team',
        manageProjects: 'Manage Projects',
        viewAnalytics: 'View Analytics',
        manageBilling: 'Manage Billing',
        systemSettings: 'System Settings',
      },
      billing: {
        currentPlan: 'Current Plan',
        nextBilling: 'Next Billing',
        usageThisPeriod: 'Usage This Period',
        teamMembers: 'Team Members',
        upgradeNow: 'Upgrade Now',
        changePlan: 'Change Plan',
      },
      invite: {
        title: 'Invite New Member',
        emailLabel: 'Email Address',
        emailPlaceholder: 'team@company.com',
        roleLabel: 'Role',
        departmentLabel: 'Department',
        sendInvite: 'Send Invite',
        cancel: 'Cancel',
      },
    },
  }

  const currentContent = content[language]

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadOrganizationData()
      loadTeamMembers()
    }
  }, [user])

  const loadOrganizationData = async () => {
    try {
      // Mock organization data
      const mockOrg: Organization = {
        id: '1',
        name: 'Acme Corporation',
        plan: 'enterprise',
        memberCount: 45,
        maxMembers: 100,
        usageQuota: {
          used: 750000,
          total: 1000000,
          period: 'monthly',
        },
        features: ['unlimited_translations', 'priority_support', 'sso', 'advanced_analytics'],
        billing: {
          status: 'active',
          nextBilling: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 2999,
          currency: 'USD',
        },
      }
      
      setOrganization(mockOrg)
    } catch (error) {
      console.error('Failed to load organization data:', error)
    }
  }

  const loadTeamMembers = async () => {
    try {
      // Mock team members data
      const mockMembers: TeamMember[] = [
        {
          id: '1',
          name: 'John Smith',
          email: 'john@acme.com',
          role: 'admin',
          department: 'Engineering',
          joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          permissions: ['manageTeam', 'manageProjects', 'viewAnalytics', 'manageBilling', 'systemSettings'],
          usageStats: {
            totalTranslations: 12540,
            wordsTranslated: 450000,
            timeSpent: 1440,
          },
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@acme.com',
          role: 'manager',
          department: 'Marketing',
          joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'active',
          permissions: ['manageProjects', 'viewAnalytics'],
          usageStats: {
            totalTranslations: 8420,
            wordsTranslated: 320000,
            timeSpent: 960,
          },
        },
        {
          id: '3',
          name: 'Mike Chen',
          email: 'mike@acme.com',
          role: 'member',
          department: 'Sales',
          joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          lastActive: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          permissions: ['viewAnalytics'],
          usageStats: {
            totalTranslations: 3240,
            wordsTranslated: 120000,
            timeSpent: 480,
          },
        },
        {
          id: '4',
          name: 'Lisa Wang',
          email: 'lisa@acme.com',
          role: 'viewer',
          department: 'HR',
          joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastActive: null,
          status: 'pending',
          permissions: [],
          usageStats: {
            totalTranslations: 0,
            wordsTranslated: 0,
            timeSpent: 0,
          },
        },
      ]
      
      setTeamMembers(mockMembers)
    } catch (error) {
      console.error('Failed to load team members:', error)
    }
  }

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return
    
    setIsLoading(true)
    try {
      // Mock invite creation
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        department: 'Unassigned',
        joinedAt: new Date().toISOString(),
        lastActive: null,
        status: 'pending',
        permissions: [],
        usageStats: {
          totalTranslations: 0,
          wordsTranslated: 0,
          timeSpent: 0,
        },
      }
      
      setTeamMembers(prev => [...prev, newMember])
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('member')
    } catch (error) {
      console.error('Failed to invite member:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'member': return 'bg-green-100 text-green-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Render overview tab
  const renderOverview = () => (
    <div className="space-y-8">
      {/* Organization Stats */}
      {organization && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">{currentContent.overview.teamSize}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {organization.memberCount}/{organization.maxMembers}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">{currentContent.overview.usageQuota}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((organization.usageQuota.used / organization.usageQuota.total) * 100)}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">{currentContent.overview.activeUsers}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamMembers.filter(m => m.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">{currentContent.billing.currentPlan}</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{organization.plan}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{currentContent.overview.quickActions}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserPlus className="w-6 h-6 text-blue-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">{currentContent.overview.inviteMembers}</p>
              <p className="text-sm text-gray-600">Add new team members</p>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('permissions')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Shield className="w-6 h-6 text-green-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">{currentContent.overview.manageRoles}</p>
              <p className="text-sm text-gray-600">Configure permissions</p>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('billing')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-6 h-6 text-purple-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">{currentContent.overview.viewBilling}</p>
              <p className="text-sm text-gray-600">Manage subscription</p>
            </div>
          </button>
        </div>
      </div>

      {/* Team Activity Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{currentContent.overview.teamActivity}</h3>
        <div className="space-y-4">
          {teamMembers.slice(0, 5).map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.department}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {member.usageStats.totalTranslations.toLocaleString()} translations
                </p>
                <p className="text-xs text-gray-500">
                  {member.lastActive 
                    ? new Date(member.lastActive).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Render team management tab
  const renderTeamManagement = () => (
    <div className="space-y-6">
      {/* Header with search and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder={currentContent.team.searchMembers}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{currentContent.team.allRoles}</option>
            {Object.entries(currentContent.roles).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {currentContent.team.inviteMember}
        </button>
      </div>

      {/* Team members table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentContent.team.role}
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentContent.team.department}
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentContent.team.status}
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentContent.team.lastActive}
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentContent.team.actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-semibold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {currentContent.roles[member.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                      {currentContent.status[member.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {member.lastActive 
                      ? new Date(member.lastActive).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentContent.invite.title}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentContent.invite.emailLabel}
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={currentContent.invite.emailPlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentContent.invite.roleLabel}
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamMember['role'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(currentContent.roles).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={inviteMember}
                disabled={!inviteEmail.trim() || isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : currentContent.invite.sendInvite}
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {currentContent.invite.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Render permissions tab
  const renderPermissions = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Role Permissions</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-sm font-medium text-gray-700">Permission</th>
                <th className="text-center py-3 text-sm font-medium text-gray-700">Admin</th>
                <th className="text-center py-3 text-sm font-medium text-gray-700">Manager</th>
                <th className="text-center py-3 text-sm font-medium text-gray-700">Member</th>
                <th className="text-center py-3 text-sm font-medium text-gray-700">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(currentContent.permissions).map(([key, label]) => (
                <tr key={key}>
                  <td className="py-3 text-sm text-gray-900">{label}</td>
                  <td className="text-center py-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                  </td>
                  <td className="text-center py-3">
                    {['manageProjects', 'viewAnalytics'].includes(key) ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="text-center py-3">
                    {key === 'viewAnalytics' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="text-center py-3">
                    <span className="text-gray-400">—</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // Render billing tab
  const renderBilling = () => (
    <div className="space-y-6">
      {organization && (
        <>
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">{currentContent.billing.currentPlan}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-purple-100 text-sm">{currentContent.billing.currentPlan}</p>
                <p className="text-2xl font-bold capitalize">{organization.plan}</p>
              </div>
              <div>
                <p className="text-purple-100 text-sm">{currentContent.billing.nextBilling}</p>
                <p className="text-lg font-semibold">
                  {new Date(organization.billing.nextBilling).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-purple-100 text-sm">Monthly Cost</p>
                <p className="text-2xl font-bold">
                  ${organization.billing.amount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">{currentContent.billing.usageThisPeriod}</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Translations</span>
                    <span>{Math.round((organization.usageQuota.used / organization.usageQuota.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(organization.usageQuota.used / organization.usageQuota.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {organization.usageQuota.used.toLocaleString()} / {organization.usageQuota.total.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">{currentContent.billing.teamMembers}</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Members</span>
                  <span className="font-medium">{organization.memberCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Seats</span>
                  <span className="font-medium">{organization.maxMembers - organization.memberCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost per Seat</span>
                  <span className="font-medium">$67/month</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className={`enterprise-dashboard ${className}`}>
      {/* Tab Navigation */}
      <div className="flex space-x-6 mb-8 border-b border-gray-200">
        {(['overview', 'team', 'permissions', 'billing', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {currentContent.tabs[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'team' && renderTeamManagement()}
        {activeTab === 'permissions' && renderPermissions()}
        {activeTab === 'billing' && renderBilling()}
        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Enterprise settings coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}