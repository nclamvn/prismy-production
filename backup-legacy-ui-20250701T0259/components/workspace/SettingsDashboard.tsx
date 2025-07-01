'use client'

import React, { useState } from 'react'
import {
  Bell,
  Shield,
  Palette,
  Download,
  Upload,
  Key,
  Save,
  RefreshCw,
  CheckCircle,
  Clock,
  Languages,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/components/theme/ThemeProvider'
import { useWorkspaceIntelligence } from '@/contexts/WorkspaceIntelligenceContext'
import PersonalizedRecommendations from './PersonalizedRecommendations'

interface UserPreferences {
  language: 'en' | 'vi'
  theme: 'light' | 'dark' | 'system'
  timezone: string
  dateFormat: string
  numberFormat: string
  autoSave: boolean
  soundEnabled: boolean
  animationsEnabled: boolean
  compactMode: boolean
}

interface NotificationSettings {
  email: {
    weeklyReports: boolean
    securityAlerts: boolean
    productUpdates: boolean
    teamActivity: boolean
  }
  push: {
    translationComplete: boolean
    collaborationInvites: boolean
    systemAlerts: boolean
  }
  frequency: 'immediate' | 'daily' | 'weekly' | 'never'
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: number
  allowedDevices: string[]
  lastPasswordChange: string
}

interface SettingsDashboardProps {
  className?: string
}

export default function SettingsDashboard({
  className = '',
}: SettingsDashboardProps) {
  const { language, setLanguage } = useSSRSafeLanguage()
  const { user } = useAuth()
  // const { theme, setTheme } = useTheme() // TODO: Implement theme switching
  const { 
    state, 
    getRecentActivities, 
    getUserPatterns, 
    getWorkflowEfficiency,
    trackActivity,
    addSuggestion 
  } = useWorkspaceIntelligence()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'security' | 'data' | 'analytics'>('profile')
  const [userProfile, setUserProfile] = useState({
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
    email: user?.email || '',
    bio: '',
    company: '',
    role: '',
    website: '',
  })
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: language as 'en' | 'vi',
    theme: 'system',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'en-US',
    autoSave: true,
    soundEnabled: true,
    animationsEnabled: true,
    compactMode: false,
  })
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: {
      weeklyReports: true,
      securityAlerts: true,
      productUpdates: false,
      teamActivity: true,
    },
    push: {
      translationComplete: true,
      collaborationInvites: true,
      systemAlerts: true,
    },
    frequency: 'daily',
  })
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 60,
    allowedDevices: [],
    lastPasswordChange: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  })
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccessfully, setSavedSuccessfully] = useState(false)

  const content = {
    vi: {
      title: 'Cài đặt',
      subtitle: 'Quản lý tài khoản và tùy chọn cá nhân',
      tabs: {
        profile: 'Hồ sơ',
        preferences: 'Tùy chọn',
        notifications: 'Thông báo',
        security: 'Bảo mật',
        data: 'Dữ liệu',
        analytics: 'Phân tích sử dụng',
      },
      profile: {
        personalInfo: 'Thông tin cá nhân',
        name: 'Họ và tên',
        email: 'Email',
        bio: 'Giới thiệu',
        company: 'Công ty',
        role: 'Vai trò',
        website: 'Website',
        avatarUpload: 'Tải ảnh đại diện',
        changePassword: 'Thay đổi mật khẩu',
      },
      preferences: {
        language: 'Ngôn ngữ',
        theme: 'Giao diện',
        timezone: 'Múi giờ',
        dateFormat: 'Định dạng ngày',
        numberFormat: 'Định dạng số',
        autoSave: 'Tự động lưu',
        soundEnabled: 'Âm thanh',
        animationsEnabled: 'Hiệu ứng',
        compactMode: 'Chế độ gọn',
      },
      notifications: {
        emailNotifications: 'Thông báo email',
        pushNotifications: 'Thông báo đẩy',
        frequency: 'Tần suất',
        weeklyReports: 'Báo cáo hàng tuần',
        securityAlerts: 'Cảnh báo bảo mật',
        productUpdates: 'Cập nhật sản phẩm',
        teamActivity: 'Hoạt động nhóm',
        translationComplete: 'Dịch hoàn thành',
        collaborationInvites: 'Lời mời cộng tác',
        systemAlerts: 'Cảnh báo hệ thống',
      },
      security: {
        twoFactor: 'Xác thực hai yếu tố',
        sessionTimeout: 'Hết hạn phiên (phút)',
        passwordChange: 'Thay đổi mật khẩu',
        activeDevices: 'Thiết bị đang hoạt động',
        loginHistory: 'Lịch sử đăng nhập',
        revokeDevice: 'Thu hồi thiết bị',
      },
      data: {
        exportData: 'Xuất dữ liệu',
        importData: 'Nhập dữ liệu',
        clearCache: 'Xóa bộ nhớ đệm',
        deleteAccount: 'Xóa tài khoản',
        dataPortability: 'Chuyển dữ liệu',
        storageUsed: 'Dung lượng đã sử dụng',
      },
      themes: {
        light: 'Sáng',
        dark: 'Tối',
        system: 'Theo hệ thống',
      },
      frequencies: {
        immediate: 'Ngay lập tức',
        daily: 'Hàng ngày',
        weekly: 'Hàng tuần',
        never: 'Không bao giờ',
      },
      actions: {
        save: 'Lưu thay đổi',
        saving: 'Đang lưu...',
        saved: 'Đã lưu',
        cancel: 'Hủy',
        enable: 'Bật',
        disable: 'Tắt',
        download: 'Tải xuống',
        upload: 'Tải lên',
      },
    },
    en: {
      title: 'Settings',
      subtitle: 'Manage your account and personal preferences',
      tabs: {
        profile: 'Profile',
        preferences: 'Preferences',
        notifications: 'Notifications',
        security: 'Security',
        data: 'Data',
        analytics: 'Usage Analytics',
      },
      profile: {
        personalInfo: 'Personal Information',
        name: 'Full Name',
        email: 'Email',
        bio: 'Bio',
        company: 'Company',
        role: 'Role',
        website: 'Website',
        avatarUpload: 'Upload Avatar',
        changePassword: 'Change Password',
      },
      preferences: {
        language: 'Language',
        theme: 'Theme',
        timezone: 'Timezone',
        dateFormat: 'Date Format',
        numberFormat: 'Number Format',
        autoSave: 'Auto Save',
        soundEnabled: 'Sound',
        animationsEnabled: 'Animations',
        compactMode: 'Compact Mode',
      },
      notifications: {
        emailNotifications: 'Email Notifications',
        pushNotifications: 'Push Notifications',
        frequency: 'Frequency',
        weeklyReports: 'Weekly Reports',
        securityAlerts: 'Security Alerts',
        productUpdates: 'Product Updates',
        teamActivity: 'Team Activity',
        translationComplete: 'Translation Complete',
        collaborationInvites: 'Collaboration Invites',
        systemAlerts: 'System Alerts',
      },
      security: {
        twoFactor: 'Two-Factor Authentication',
        sessionTimeout: 'Session Timeout (minutes)',
        passwordChange: 'Change Password',
        activeDevices: 'Active Devices',
        loginHistory: 'Login History',
        revokeDevice: 'Revoke Device',
      },
      data: {
        exportData: 'Export Data',
        importData: 'Import Data',
        clearCache: 'Clear Cache',
        deleteAccount: 'Delete Account',
        dataPortability: 'Data Portability',
        storageUsed: 'Storage Used',
      },
      themes: {
        light: 'Light',
        dark: 'Dark',
        system: 'System',
      },
      frequencies: {
        immediate: 'Immediate',
        daily: 'Daily',
        weekly: 'Weekly',
        never: 'Never',
      },
      actions: {
        save: 'Save Changes',
        saving: 'Saving...',
        saved: 'Saved',
        cancel: 'Cancel',
        enable: 'Enable',
        disable: 'Disable',
        download: 'Download',
        upload: 'Upload',
      },
      analytics: {
        title: 'Phân tích sử dụng',
        subtitle: 'Thống kê hoạt động và hiệu suất làm việc',
        workflowEfficiency: 'Hiệu suất làm việc',
        recentActivity: 'Hoạt động gần đây',
        usagePatterns: 'Thói quen sử dụng',
        recommendations: 'Gợi ý cải thiện',
        totalActivities: 'Tổng hoạt động',
        successRate: 'Tỷ lệ thành công',
        avgSessionTime: 'Thời gian phiên trung bình',
        mostUsedFeature: 'Tính năng hay dùng nhất',
        timeSpent: 'Thời gian sử dụng',
        featureUsage: 'Sử dụng tính năng',
        noData: 'Chưa có dữ liệu phân tích',
        generateReport: 'Tạo báo cáo'
      },
    },
    en: {
      title: 'Settings',
      subtitle: 'Manage your account and personal preferences',
      tabs: {
        profile: 'Profile',
        preferences: 'Preferences',
        notifications: 'Notifications',
        security: 'Security',
        data: 'Data',
        analytics: 'Usage Analytics',
      },
      profile: {
        personalInfo: 'Personal Information',
        name: 'Full Name',
        email: 'Email',
        bio: 'Bio',
        company: 'Company',
        role: 'Role',
        website: 'Website',
        avatarUpload: 'Upload Avatar',
        changePassword: 'Change Password',
      },
      preferences: {
        language: 'Language',
        theme: 'Theme',
        timezone: 'Timezone',
        dateFormat: 'Date Format',
        numberFormat: 'Number Format',
        autoSave: 'Auto Save',
        soundEnabled: 'Sound',
        animationsEnabled: 'Animations',
        compactMode: 'Compact Mode',
      },
      notifications: {
        emailNotifications: 'Email Notifications',
        pushNotifications: 'Push Notifications',
        frequency: 'Frequency',
        weeklyReports: 'Weekly Reports',
        securityAlerts: 'Security Alerts',
        productUpdates: 'Product Updates',
        teamActivity: 'Team Activity',
        translationComplete: 'Translation Complete',
        collaborationInvites: 'Collaboration Invites',
        systemAlerts: 'System Alerts',
      },
      security: {
        twoFactor: 'Two-Factor Authentication',
        sessionTimeout: 'Session Timeout (minutes)',
        passwordChange: 'Change Password',
        activeDevices: 'Active Devices',
        loginHistory: 'Login History',
        revokeDevice: 'Revoke Device',
      },
      data: {
        exportData: 'Export Data',
        importData: 'Import Data',
        clearCache: 'Clear Cache',
        deleteAccount: 'Delete Account',
        dataPortability: 'Data Portability',
        storageUsed: 'Storage Used',
      },
      themes: {
        light: 'Light',
        dark: 'Dark',
        system: 'System',
      },
      frequencies: {
        immediate: 'Immediate',
        daily: 'Daily',
        weekly: 'Weekly',
        never: 'Never',
      },
      actions: {
        save: 'Save Changes',
        saving: 'Saving...',
        saved: 'Saved',
        cancel: 'Cancel',
        enable: 'Enable',
        disable: 'Disable',
        download: 'Download',
        upload: 'Upload',
      },
      analytics: {
        title: 'Usage Analytics',
        subtitle: 'Activity statistics and workflow performance',
        workflowEfficiency: 'Workflow Efficiency',
        recentActivity: 'Recent Activity',
        usagePatterns: 'Usage Patterns',
        recommendations: 'Recommendations',
        totalActivities: 'Total Activities',
        successRate: 'Success Rate',
        avgSessionTime: 'Avg Session Time',
        mostUsedFeature: 'Most Used Feature',
        timeSpent: 'Time Spent',
        featureUsage: 'Feature Usage',
        noData: 'No analytics data yet',
        generateReport: 'Generate Report'
      },
    },
  }

  const currentContent = content[language]

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update language if changed
      if (preferences.language !== language) {
        setLanguage(preferences.language)
      }
      
      // Track settings change activity
      trackActivity({
        type: 'settings_change',
        mode: 'settings',
        data: {
          changedSettings: Object.keys(preferences),
          language: preferences.language,
          theme: preferences.theme
        },
        success: true
      })
      
      setSavedSuccessfully(true)
      setTimeout(() => setSavedSuccessfully(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const renderSettingRow = (
    label: string,
    description: string,
    control: React.ReactNode,
    icon?: React.ReactNode
  ) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center">
        {icon && <div className="mr-3 text-gray-500">{icon}</div>}
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  )

  // Render profile tab
  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{currentContent.profile.personalInfo}</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentContent.profile.name}
              </label>
              <input
                type="text"
                value={userProfile.name}
                onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentContent.profile.email}
              </label>
              <input
                type="email"
                value={userProfile.email}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentContent.profile.bio}
            </label>
            <textarea
              value={userProfile.bio}
              onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentContent.profile.company}
              </label>
              <input
                type="text"
                value={userProfile.company}
                onChange={(e) => setUserProfile({...userProfile, company: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentContent.profile.role}
              </label>
              <input
                type="text"
                value={userProfile.role}
                onChange={(e) => setUserProfile({...userProfile, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentContent.profile.website}
            </label>
            <input
              type="url"
              value={userProfile.website}
              onChange={(e) => setUserProfile({...userProfile, website: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>
        </div>
      </div>
    </div>
  )

  // Render preferences tab
  const renderPreferences = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Interface Preferences</h3>
        
        <div className="space-y-1">
          {renderSettingRow(
            currentContent.preferences.language,
            'Select your preferred language',
            <select
              value={preferences.language}
              onChange={(e) => setPreferences({...preferences, language: e.target.value as 'en' | 'vi'})}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="vi">Tiếng Việt</option>
            </select>,
            <Languages className="w-5 h-5" />
          )}

          {renderSettingRow(
            currentContent.preferences.theme,
            'Choose your preferred theme',
            <select
              value={preferences.theme}
              onChange={(e) => setPreferences({...preferences, theme: e.target.value as any})}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">{currentContent.themes.light}</option>
              <option value="dark">{currentContent.themes.dark}</option>
              <option value="system">{currentContent.themes.system}</option>
            </select>,
            <Palette className="w-5 h-5" />
          )}

          {renderSettingRow(
            currentContent.preferences.autoSave,
            'Automatically save your work',
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.autoSave}
                onChange={(e) => setPreferences({...preferences, autoSave: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                preferences.autoSave ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  preferences.autoSave ? 'translate-x-5' : 'translate-x-0.5'
                } mt-0.5`}></div>
              </div>
            </label>,
            <Save className="w-5 h-5" />
          )}

          {renderSettingRow(
            currentContent.preferences.soundEnabled,
            'Enable sound effects',
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.soundEnabled}
                onChange={(e) => setPreferences({...preferences, soundEnabled: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                preferences.soundEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  preferences.soundEnabled ? 'translate-x-5' : 'translate-x-0.5'
                } mt-0.5`}></div>
              </div>
            </label>,
            preferences.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />
          )}

          {renderSettingRow(
            currentContent.preferences.animationsEnabled,
            'Enable UI animations',
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.animationsEnabled}
                onChange={(e) => setPreferences({...preferences, animationsEnabled: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                preferences.animationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  preferences.animationsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                } mt-0.5`}></div>
              </div>
            </label>,
            <RefreshCw className="w-5 h-5" />
          )}
        </div>
      </div>
    </div>
  )

  // Render notifications tab
  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{currentContent.notifications.emailNotifications}</h3>
        
        <div className="space-y-1">
          {Object.entries(currentContent.notifications).filter(([key]) => 
            ['weeklyReports', 'securityAlerts', 'productUpdates', 'teamActivity'].includes(key)
          ).map(([key, label]) => (
            renderSettingRow(
              label,
              `Receive ${label.toLowerCase()} via email`,
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.email[key as keyof typeof notifications.email]}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    email: {...notifications.email, [key]: e.target.checked}
                  })}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  notifications.email[key as keyof typeof notifications.email] ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    notifications.email[key as keyof typeof notifications.email] ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`}></div>
                </div>
              </label>,
              <Bell className="w-5 h-5" />
            )
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{currentContent.notifications.frequency}</h3>
        
        <div className="space-y-3">
          {Object.entries(currentContent.frequencies).map(([value, label]) => (
            <label key={value} className="flex items-center">
              <input
                type="radio"
                name="frequency"
                value={value}
                checked={notifications.frequency === value}
                onChange={(e) => setNotifications({...notifications, frequency: e.target.value as any})}
                className="mr-3 text-blue-600"
              />
              <span className="text-gray-900">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  // Render security tab
  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
        
        <div className="space-y-1">
          {renderSettingRow(
            currentContent.security.twoFactor,
            'Add an extra layer of security to your account',
            <button
              onClick={() => setSecurity({...security, twoFactorEnabled: !security.twoFactorEnabled})}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                security.twoFactorEnabled
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {security.twoFactorEnabled ? currentContent.actions.disable : currentContent.actions.enable}
            </button>,
            <Shield className="w-5 h-5" />
          )}

          {renderSettingRow(
            currentContent.security.sessionTimeout,
            'Automatically log out after period of inactivity',
            <select
              value={security.sessionTimeout}
              onChange={(e) => setSecurity({...security, sessionTimeout: Number(e.target.value)})}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
            </select>,
            <Clock className="w-5 h-5" />
          )}

          {renderSettingRow(
            currentContent.security.passwordChange,
            `Last changed ${new Date(security.lastPasswordChange).toLocaleDateString()}`,
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Change Password
            </button>,
            <Key className="w-5 h-5" />
          )}
        </div>
      </div>
    </div>
  )

  // Render data tab
  const renderData = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{currentContent.data.dataPortability}</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <Download className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">{currentContent.data.exportData}</p>
                <p className="text-sm text-gray-600">Download all your data in JSON format</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              {currentContent.actions.download}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <Upload className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">{currentContent.data.importData}</p>
                <p className="text-sm text-gray-600">Import data from a previous export</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              {currentContent.actions.upload}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <RefreshCw className="w-5 h-5 text-orange-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">{currentContent.data.clearCache}</p>
                <p className="text-sm text-gray-600">Clear stored cache and temporary data</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-red-900">{currentContent.data.deleteAccount}</p>
            <p className="text-sm text-red-700">Permanently delete your account and all data</p>
          </div>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`settings-dashboard ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{currentContent.title}</h2>
          <p className="text-gray-600">{currentContent.subtitle}</p>
        </div>
        
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            savedSuccessfully
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50`}
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              {currentContent.actions.saving}
            </>
          ) : savedSuccessfully ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {currentContent.actions.saved}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {currentContent.actions.save}
            </>
          )}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-6 mb-8 border-b border-gray-200">
        {(['profile', 'preferences', 'notifications', 'security', 'data', 'analytics'] as const).map((tab) => (
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
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'preferences' && renderPreferences()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'security' && renderSecurity()}
        {activeTab === 'data' && renderData()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  )

  // Render analytics tab
  const renderAnalytics = () => {
    const recentActivities = getRecentActivities(10)
    const userPatterns = getUserPatterns()
    const workflowEfficiency = getWorkflowEfficiency()
    
    return (
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{currentContent.analytics.totalActivities}</p>
                <p className="text-2xl font-bold text-gray-900">{state.activities.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{currentContent.analytics.successRate}</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(workflowEfficiency)}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{currentContent.analytics.avgSessionTime}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(Object.values(userPatterns.usageTime).reduce((a, b) => a + b, 0) / 60)}m
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{currentContent.analytics.mostUsedFeature}</p>
                <p className="text-lg font-bold text-gray-900">
                  {Object.entries(userPatterns.featureUsage).sort(([,a], [,b]) => b - a)[0]?.[0]?.replace('_', ' ') || 'N/A'}
                </p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Charts and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentContent.analytics.recentActivity}</h3>
            
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>{currentContent.analytics.noData}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        activity.success ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-600">
                          {activity.mode} • {activity.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    {activity.duration && (
                      <span className="text-xs text-gray-500">
                        {Math.round(activity.duration / 1000)}s
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Usage Patterns */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentContent.analytics.usagePatterns}</h3>
            
            <div className="space-y-4">
              {/* Feature Usage */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">{currentContent.analytics.featureUsage}</h4>
                <div className="space-y-2">
                  {Object.entries(userPatterns.featureUsage).slice(0, 5).map(([feature, count]) => {
                    const maxCount = Math.max(...Object.values(userPatterns.featureUsage))
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                    
                    return (
                      <div key={feature} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">
                          {feature.replace('_', ' ')}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Time Spent */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">{currentContent.analytics.timeSpent}</h4>
                <div className="space-y-2">
                  {Object.entries(userPatterns.usageTime).slice(0, 5).map(([mode, time]) => {
                    const maxTime = Math.max(...Object.values(userPatterns.usageTime))
                    const percentage = maxTime > 0 ? (time / maxTime) * 100 : 0
                    
                    return (
                      <div key={mode} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">
                          {mode}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-600 transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">
                            {Math.round(time / 60)}m
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Efficiency */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{currentContent.analytics.workflowEfficiency}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-600">{Math.round(workflowEfficiency)}%</span>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                workflowEfficiency > 80 ? 'bg-green-100 text-green-800' :
                workflowEfficiency > 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {workflowEfficiency > 80 ? 'Excellent' : workflowEfficiency > 60 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${workflowEfficiency}%`,
                backgroundColor: workflowEfficiency > 80 ? '#10B981' : workflowEfficiency > 60 ? '#F59E0B' : '#EF4444'
              }}
            />
          </div>
          
          <p className="text-sm text-gray-600">
            Based on {state.activities.length} activities with {state.activities.filter(a => a.success).length} successful completions
          </p>
        </div>

        {/* Personalized Recommendations */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <PersonalizedRecommendations className="max-h-96 overflow-y-auto" />
        </div>

        {/* Generate Report */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{currentContent.analytics.generateReport}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Export detailed analytics and usage patterns
              </p>
            </div>
            <button
              onClick={() => {
                // Generate and download analytics report
                const report = {
                  user: user?.email,
                  generatedAt: new Date().toISOString(),
                  totalActivities: state.activities.length,
                  workflowEfficiency: workflowEfficiency,
                  featureUsage: userPatterns.featureUsage,
                  usageTime: userPatterns.usageTime,
                  recentActivities: recentActivities.slice(0, 20)
                }
                
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `prismy-analytics-${new Date().toISOString().split('T')[0]}.json`
                a.style.display = 'none'
                
                // Use React-safe download approach
                a.click()
                URL.revokeObjectURL(url)

                // Track report generation
                trackActivity({
                  type: 'settings_change',
                  mode: 'settings',
                  data: { action: 'analytics_report_generated' },
                  success: true
                })
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              {currentContent.analytics.generateReport}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`settings-dashboard ${className}`}>
      {/* Content will be rendered by above conditions */}
    </div>
  )
}