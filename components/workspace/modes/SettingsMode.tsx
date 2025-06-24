'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'
import {
  User,
  Mail,
  Bell,
  Shield,
  Globe,
  Moon,
  Sun,
  Key,
  Trash2,
  Save,
  Edit3,
  Camera,
  Lock,
  Smartphone,
  AlertTriangle,
  Gift,
  CreditCard,
} from 'lucide-react'

interface SettingsModeProps {
  language: 'vi' | 'en'
  user?: any
}

export default function SettingsMode({ language, user }: SettingsModeProps) {
  const [activeTab, setActiveTab] = useState('profile')
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: true,
  })

  const content = {
    vi: {
      title: 'Cài đặt tài khoản',
      subtitle: 'Quản lý thông tin cá nhân và tùy chỉnh trải nghiệm',
      tabs: {
        profile: 'Hồ sơ',
        security: 'Bảo mật',
        notifications: 'Thông báo',
        preferences: 'Tùy chọn',
        danger: 'Vùng nguy hiểm',
        invites: 'Quản lý mã mời',
        credits: 'Theo dõi credits',
      },
      profile: {
        title: 'Thông tin cá nhân',
        avatar: 'Ảnh đại diện',
        changeAvatar: 'Đổi ảnh',
        name: 'Họ tên',
        email: 'Email',
        phone: 'Số điện thoại',
        company: 'Công ty',
        role: 'Vai trò',
        save: 'Lưu thay đổi',
      },
      security: {
        title: 'Bảo mật tài khoản',
        password: 'Mật khẩu',
        changePassword: 'Đổi mật khẩu',
        twoFactor: 'Xác thực 2 yếu tố',
        enable2FA: 'Bật 2FA',
        disable2FA: 'Tắt 2FA',
        sessions: 'Phiên đăng nhập',
        apiKeys: 'API Keys',
      },
      notifications: {
        title: 'Cài đặt thông báo',
        email: 'Thông báo email',
        emailDesc: 'Nhận email về hoạt động tài khoản',
        push: 'Thông báo đẩy',
        pushDesc: 'Thông báo trực tiếp trên thiết bị',
        marketing: 'Email marketing',
        marketingDesc: 'Nhận thông tin sản phẩm và ưu đãi',
      },
      preferences: {
        title: 'Tùy chọn',
        language: 'Ngôn ngữ',
        theme: 'Giao diện',
        lightMode: 'Sáng',
        darkMode: 'Tối',
        timezone: 'Múi giờ',
        dateFormat: 'Định dạng ngày',
      },
      danger: {
        title: 'Vùng nguy hiểm',
        deleteAccount: 'Xóa tài khoản',
        deleteWarning: 'Hành động này không thể hoàn tác',
        deleteDesc: 'Xóa vĩnh viễn tài khoản và tất cả dữ liệu',
        confirmDelete: 'Tôi hiểu hậu quả',
      },
      invites: {
        title: 'Quản lý mã mời',
        description: 'Tạo và quản lý mã mời cho beta testers',
        goToAdmin: 'Mở trang quản lý',
      },
      credits: {
        title: 'Theo dõi Credits',
        description: 'Xem thống kê sử dụng credits của người dùng',
        totalIssued: 'Tổng credits phát hành',
        totalUsed: 'Tổng credits đã dùng',
        activeUsers: 'Người dùng hoạt động',
      },
    },
    en: {
      title: 'Account Settings',
      subtitle:
        'Manage your personal information and customize your experience',
      tabs: {
        profile: 'Profile',
        security: 'Security',
        notifications: 'Notifications',
        preferences: 'Preferences',
        danger: 'Danger Zone',
        invites: 'Invite Management',
        credits: 'Credit Monitor',
      },
      profile: {
        title: 'Personal Information',
        avatar: 'Avatar',
        changeAvatar: 'Change Avatar',
        name: 'Full Name',
        email: 'Email',
        phone: 'Phone Number',
        company: 'Company',
        role: 'Role',
        save: 'Save Changes',
      },
      security: {
        title: 'Account Security',
        password: 'Password',
        changePassword: 'Change Password',
        twoFactor: 'Two-Factor Authentication',
        enable2FA: 'Enable 2FA',
        disable2FA: 'Disable 2FA',
        sessions: 'Login Sessions',
        apiKeys: 'API Keys',
      },
      notifications: {
        title: 'Notification Settings',
        email: 'Email Notifications',
        emailDesc: 'Receive emails about account activity',
        push: 'Push Notifications',
        pushDesc: 'Direct notifications on your device',
        marketing: 'Marketing Emails',
        marketingDesc: 'Receive product updates and offers',
      },
      preferences: {
        title: 'Preferences',
        language: 'Language',
        theme: 'Theme',
        lightMode: 'Light',
        darkMode: 'Dark',
        timezone: 'Timezone',
        dateFormat: 'Date Format',
      },
      danger: {
        title: 'Danger Zone',
        deleteAccount: 'Delete Account',
        deleteWarning: 'This action cannot be undone',
        deleteDesc: 'Permanently delete your account and all data',
        confirmDelete: 'I understand the consequences',
      },
      invites: {
        title: 'Invite Management',
        description: 'Create and manage invite codes for beta testers',
        goToAdmin: 'Open Admin Panel',
      },
      credits: {
        title: 'Credit Monitor',
        description: 'View credit usage statistics for all users',
        totalIssued: 'Total Credits Issued',
        totalUsed: 'Total Credits Used',
        activeUsers: 'Active Users',
      },
    },
  }

  // Check if user is admin
  const isAdmin = user?.subscription_tier === 'enterprise'

  const tabs = [
    { id: 'profile', label: content[language].tabs.profile, icon: User },
    { id: 'security', label: content[language].tabs.security, icon: Shield },
    {
      id: 'notifications',
      label: content[language].tabs.notifications,
      icon: Bell,
    },
    {
      id: 'preferences',
      label: content[language].tabs.preferences,
      icon: Globe,
    },
    { id: 'danger', label: content[language].tabs.danger, icon: AlertTriangle },
    // Admin-only tabs
    ...(isAdmin ? [
      { id: 'invites', label: content[language].tabs.invites, icon: Gift },
      { id: 'credits', label: content[language].tabs.credits, icon: CreditCard },
    ] : []),
  ]

  return (
    <div className="h-full p-6">
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={motionSafe(slideUp)} className="mb-8">
          <h2 className="heading-2 text-gray-900 mb-4">
            {content[language].title}
          </h2>
          <p className="body-lg text-gray-600">{content[language].subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div variants={motionSafe(slideUp)} className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-border-subtle p-4">
              <nav className="space-y-2">
                {tabs.map(tab => {
                  const IconComponent = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center p-3 rounded-2xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <IconComponent size={18} className="mr-3" />
                      <span className="body-sm font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div variants={motionSafe(slideUp)} className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-border-subtle p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h3 className="heading-3 text-gray-900 mb-6">
                    {content[language].profile.title}
                  </h3>

                  {/* Avatar */}
                  <div className="flex items-center mb-8">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                      <User size={32} className="text-gray-500" />
                    </div>
                    <div>
                      <button className="btn-secondary btn-pill-compact-md mb-2">
                        <Camera size={16} className="mr-2" />
                        {content[language].profile.changeAvatar}
                      </button>
                      <p className="body-xs text-gray-500">
                        JPG, PNG up to 2MB
                      </p>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block body-sm font-medium text-gray-700 mb-2">
                        {content[language].profile.name}
                      </label>
                      <input
                        type="text"
                        defaultValue="John Doe"
                        className="w-full p-3 border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block body-sm font-medium text-gray-700 mb-2">
                        {content[language].profile.email}
                      </label>
                      <input
                        type="email"
                        defaultValue="john@example.com"
                        className="w-full p-3 border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block body-sm font-medium text-gray-700 mb-2">
                        {content[language].profile.phone}
                      </label>
                      <input
                        type="tel"
                        defaultValue="+84 123 456 789"
                        className="w-full p-3 border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block body-sm font-medium text-gray-700 mb-2">
                        {content[language].profile.company}
                      </label>
                      <input
                        type="text"
                        defaultValue="Acme Corp"
                        className="w-full p-3 border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button className="btn-primary btn-pill-lg mt-8">
                    <Save size={16} className="mr-2" />
                    {content[language].profile.save}
                  </button>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h3 className="heading-3 text-gray-900 mb-6">
                    {content[language].security.title}
                  </h3>

                  <div className="space-y-6">
                    {/* Password */}
                    <div className="p-6 border border-border-subtle rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="body-sm font-medium text-gray-900 mb-1">
                            {content[language].security.password}
                          </h4>
                          <p className="body-xs text-gray-500">
                            Last changed 3 months ago
                          </p>
                        </div>
                        <button className="btn-secondary btn-pill-compact-md">
                          <Edit3 size={16} className="mr-2" />
                          {content[language].security.changePassword}
                        </button>
                      </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="p-6 border border-border-subtle rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="body-sm font-medium text-gray-900 mb-1">
                            {content[language].security.twoFactor}
                          </h4>
                          <p className="body-xs text-gray-500">
                            Add an extra layer of security
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className="body-xs text-red-600 mr-3">
                            Disabled
                          </span>
                          <button className="btn-primary btn-pill-compact-md">
                            <Smartphone size={16} className="mr-2" />
                            {content[language].security.enable2FA}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    <div className="p-6 border border-border-subtle rounded-2xl">
                      <h4 className="body-sm font-medium text-gray-900 mb-4">
                        {content[language].security.sessions}
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <div className="body-sm font-medium text-gray-900">
                              MacBook Pro - Chrome
                            </div>
                            <div className="body-xs text-gray-500">
                              Ho Chi Minh City, Vietnam • Current session
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <div className="body-sm font-medium text-gray-900">
                              iPhone - Safari
                            </div>
                            <div className="body-xs text-gray-500">
                              Ho Chi Minh City, Vietnam • 2 hours ago
                            </div>
                          </div>
                          <button className="body-xs text-red-600 hover:underline">
                            Revoke
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h3 className="heading-3 text-gray-900 mb-6">
                    {content[language].notifications.title}
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border border-border-subtle rounded-2xl">
                      <div>
                        <div className="body-sm font-medium text-gray-900 mb-1">
                          {content[language].notifications.email}
                        </div>
                        <div className="body-xs text-gray-500">
                          {content[language].notifications.emailDesc}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.email}
                          onChange={e =>
                            setNotifications({
                              ...notifications,
                              email: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border-subtle rounded-2xl">
                      <div>
                        <div className="body-sm font-medium text-gray-900 mb-1">
                          {content[language].notifications.push}
                        </div>
                        <div className="body-xs text-gray-500">
                          {content[language].notifications.pushDesc}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.push}
                          onChange={e =>
                            setNotifications({
                              ...notifications,
                              push: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border-subtle rounded-2xl">
                      <div>
                        <div className="body-sm font-medium text-gray-900 mb-1">
                          {content[language].notifications.marketing}
                        </div>
                        <div className="body-xs text-gray-500">
                          {content[language].notifications.marketingDesc}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.marketing}
                          onChange={e =>
                            setNotifications({
                              ...notifications,
                              marketing: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div>
                  <h3 className="heading-3 text-gray-900 mb-6">
                    {content[language].preferences.title}
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block body-sm font-medium text-gray-700 mb-2">
                        {content[language].preferences.language}
                      </label>
                      <select className="w-full p-3 border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block body-sm font-medium text-gray-700 mb-4">
                        {content[language].preferences.theme}
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setDarkMode(false)}
                          className={`flex items-center p-4 border rounded-2xl transition-all ${
                            !darkMode
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-border-subtle hover:bg-gray-50'
                          }`}
                        >
                          <Sun size={20} className="mr-3" />
                          <span className="body-sm font-medium">
                            {content[language].preferences.lightMode}
                          </span>
                        </button>
                        <button
                          onClick={() => setDarkMode(true)}
                          className={`flex items-center p-4 border rounded-2xl transition-all ${
                            darkMode
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-border-subtle hover:bg-gray-50'
                          }`}
                        >
                          <Moon size={20} className="mr-3" />
                          <span className="body-sm font-medium">
                            {content[language].preferences.darkMode}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block body-sm font-medium text-gray-700 mb-2">
                        {content[language].preferences.timezone}
                      </label>
                      <select className="w-full p-3 border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="Asia/Ho_Chi_Minh">
                          (GMT+7) Ho Chi Minh
                        </option>
                        <option value="Asia/Bangkok">(GMT+7) Bangkok</option>
                        <option value="Asia/Singapore">
                          (GMT+8) Singapore
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Danger Zone Tab */}
              {activeTab === 'danger' && (
                <div>
                  <h3 className="heading-3 text-gray-900 mb-6">
                    {content[language].danger.title}
                  </h3>

                  <div className="border border-red-200 rounded-2xl p-6 bg-red-50">
                    <div className="flex items-start">
                      <AlertTriangle
                        size={24}
                        className="text-red-500 mr-4 mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="body-sm font-medium text-red-900 mb-2">
                          {content[language].danger.deleteAccount}
                        </h4>
                        <p className="body-sm text-red-700 mb-1">
                          {content[language].danger.deleteWarning}
                        </p>
                        <p className="body-xs text-red-600 mb-4">
                          {content[language].danger.deleteDesc}
                        </p>

                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input type="checkbox" className="mr-2" />
                            <span className="body-xs text-red-700">
                              {content[language].danger.confirmDelete}
                            </span>
                          </label>
                          <button className="btn-secondary border-red-300 text-red-700 hover:bg-red-100 btn-pill-compact-md">
                            <Trash2 size={16} className="mr-2" />
                            {content[language].danger.deleteAccount}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Invite Management Tab (Admin Only) */}
              {activeTab === 'invites' && isAdmin && (
                <div>
                  <h3 className="heading-3 text-gray-900 mb-6">
                    {content[language].invites.title}
                  </h3>
                  <p className="body-lg text-gray-600 mb-8">
                    {content[language].invites.description}
                  </p>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
                    <Gift size={48} className="text-blue-600 mx-auto mb-4" />
                    <h4 className="heading-4 text-gray-900 mb-4">
                      {language === 'vi' ? 'Trang quản lý mã mời' : 'Invite Management Dashboard'}
                    </h4>
                    <p className="body-base text-gray-600 mb-6">
                      {language === 'vi' 
                        ? 'Tạo mã mời, theo dõi sử dụng và quản lý beta testers'
                        : 'Create invite codes, track usage, and manage beta testers'}
                    </p>
                    <a
                      href="/admin/invites"
                      className="inline-flex items-center btn-primary btn-pill-lg"
                    >
                      <Gift size={20} className="mr-2" />
                      {content[language].invites.goToAdmin}
                    </a>
                  </div>
                </div>
              )}

              {/* Credit Monitor Tab (Admin Only) */}
              {activeTab === 'credits' && isAdmin && (
                <div>
                  <h3 className="heading-3 text-gray-900 mb-6">
                    {content[language].credits.title}
                  </h3>
                  <p className="body-lg text-gray-600 mb-8">
                    {content[language].credits.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 rounded-2xl p-6 text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
                      <div className="body-sm text-gray-700">
                        {content[language].credits.totalIssued}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-6 text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">0</div>
                      <div className="body-sm text-gray-700">
                        {content[language].credits.totalUsed}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-2xl p-6 text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
                      <div className="body-sm text-gray-700">
                        {content[language].credits.activeUsers}
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <a
                      href="/admin/invites"
                      className="inline-flex items-center btn-secondary btn-pill-lg"
                    >
                      <CreditCard size={20} className="mr-2" />
                      {language === 'vi' ? 'Xem chi tiết' : 'View Details'}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
