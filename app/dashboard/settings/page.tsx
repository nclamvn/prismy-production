'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import UniversalDropdown from '@/components/ui/UniversalDropdown'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'
import { Globe } from 'lucide-react'

function SettingsPage() {
  const [language, setLanguage] = useState<'vi' | 'en'>('en')
  const [activeTab, setActiveTab] = useState('profile')
  const { user } = useAuth()

  const content = {
    vi: {
      title: 'Cài đặt',
      subtitle: 'Quản lý hồ sơ và tùy chọn tài khoản của bạn',
      tabs: {
        profile: 'Hồ sơ',
        account: 'Tài khoản',
        preferences: 'Tùy chọn',
        billing: 'Thanh toán',
        security: 'Bảo mật',
      },
      profile: {
        personalInfo: 'Thông tin cá nhân',
        fullName: 'Họ và tên',
        email: 'Email',
        phone: 'Số điện thoại',
        company: 'Công ty',
        jobTitle: 'Chức vụ',
        bio: 'Giới thiệu',
        avatar: 'Ảnh đại diện',
        changeAvatar: 'Thay đổi ảnh',
        save: 'Lưu thay đổi',
      },
      preferences: {
        language: 'Ngôn ngữ giao diện',
        defaultSourceLang: 'Ngôn ngữ nguồn mặc định',
        defaultTargetLang: 'Ngôn ngữ đích mặc định',
        notifications: 'Thông báo',
        emailNotifications: 'Thông báo email',
        autoSave: 'Tự động lưu',
        qualityLevel: 'Mức chất lượng mặc định',
      },
      account: {
        subscription: 'Gói đăng ký',
        currentPlan: 'Gói hiện tại',
        usage: 'Sử dụng tháng này',
        upgrade: 'Nâng cấp',
        billingCycle: 'Chu kỳ thanh toán',
        nextBilling: 'Thanh toán tiếp theo',
      },
      security: {
        password: 'Mật khẩu',
        changePassword: 'Đổi mật khẩu',
        currentPassword: 'Mật khẩu hiện tại',
        newPassword: 'Mật khẩu mới',
        confirmPassword: 'Xác nhận mật khẩu',
        twoFactor: 'Xác thực hai yếu tố',
        apiKeys: 'API Keys',
        sessions: 'Phiên đăng nhập',
      },
    },
    en: {
      title: 'Settings',
      subtitle: 'Manage your profile and account preferences',
      tabs: {
        profile: 'Profile',
        account: 'Account',
        preferences: 'Preferences',
        billing: 'Billing',
        security: 'Security',
      },
      profile: {
        personalInfo: 'Personal Information',
        fullName: 'Full Name',
        email: 'Email',
        phone: 'Phone Number',
        company: 'Company',
        jobTitle: 'Job Title',
        bio: 'Bio',
        avatar: 'Avatar',
        changeAvatar: 'Change Avatar',
        save: 'Save Changes',
      },
      preferences: {
        language: 'Interface Language',
        defaultSourceLang: 'Default Source Language',
        defaultTargetLang: 'Default Target Language',
        notifications: 'Notifications',
        emailNotifications: 'Email Notifications',
        autoSave: 'Auto Save',
        qualityLevel: 'Default Quality Level',
      },
      account: {
        subscription: 'Subscription',
        currentPlan: 'Current Plan',
        usage: 'This Month Usage',
        upgrade: 'Upgrade',
        billingCycle: 'Billing Cycle',
        nextBilling: 'Next Billing',
      },
      security: {
        password: 'Password',
        changePassword: 'Change Password',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        twoFactor: 'Two-Factor Authentication',
        apiKeys: 'API Keys',
        sessions: 'Active Sessions',
      },
    },
  }

  const tabs = [
    { id: 'profile', name: content[language].tabs.profile, icon: UserIcon },
    {
      id: 'account',
      name: content[language].tabs.account,
      icon: CreditCardIcon,
    },
    {
      id: 'preferences',
      name: content[language].tabs.preferences,
      icon: CogIcon,
    },
    { id: 'security', name: content[language].tabs.security, icon: ShieldIcon },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab content={content[language]} user={user} />
      case 'account':
        return <AccountTab content={content[language]} />
      case 'preferences':
        return (
          <PreferencesTab
            content={content[language]}
            language={language}
            setLanguage={setLanguage}
          />
        )
      case 'security':
        return <SecurityTab content={content[language]} />
      default:
        return null
    }
  }

  return (
    <DashboardLayout language={language}>
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="mb-8" variants={motionSafe(slideUp)}>
          <h1 className="heading-2 text-gray-900 mb-2">
            {content[language].title}
          </h1>
          <p className="body-base text-gray-600">
            {content[language].subtitle}
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <motion.div className="lg:w-64" variants={motionSafe(slideUp)}>
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-3" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </motion.div>

          {/* Content */}
          <motion.div className="flex-1" variants={motionSafe(slideUp)}>
            {renderTabContent()}
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  )
}

// Profile Tab Component
function ProfileTab({ content, user }: { content: any; user: any }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="heading-4 text-gray-900 mb-6">
        {content.profile.personalInfo}
      </h3>

      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-2xl text-gray-600 font-medium">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <button className="btn-secondary">
            {content.profile.changeAvatar}
          </button>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {content.profile.fullName}
            </label>
            <input
              type="text"
              className="input-base"
              defaultValue={user?.user_metadata?.full_name || ''}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {content.profile.email}
            </label>
            <input
              type="email"
              className="input-base"
              defaultValue={user?.email || ''}
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {content.profile.phone}
            </label>
            <input type="tel" className="input-base" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {content.profile.company}
            </label>
            <input type="text" className="input-base" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {content.profile.bio}
          </label>
          <textarea className="input-base" rows={4} />
        </div>

        <button className="btn-primary">{content.profile.save}</button>
      </div>
    </div>
  )
}

// Preferences Tab Component
function PreferencesTab({
  content,
  language,
  setLanguage,
}: {
  content: any
  language: string
  setLanguage: (lang: 'vi' | 'en') => void
}) {
  return (
    <div className="space-y-6">
      {/* Language Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="heading-4 text-gray-900 mb-4">
          {content.preferences.language}
        </h3>
        <div className="max-w-xs">
          <UniversalDropdown
            value={language}
            onChange={value => setLanguage(value as 'vi' | 'en')}
            size="md"
            options={[
              {
                value: 'en',
                label: 'English',
                icon: <Globe size={16} strokeWidth={1.5} />,
              },
              {
                value: 'vi',
                label: 'Tiếng Việt',
                icon: <Globe size={16} strokeWidth={1.5} />,
              },
            ]}
          />
        </div>
      </div>

      {/* Translation Defaults */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="heading-4 text-gray-900 mb-4">Translation Defaults</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {content.preferences.defaultSourceLang}
            </label>
            <UniversalDropdown
              value="auto"
              onChange={value => console.log('Source language changed:', value)}
              size="md"
              options={[
                { value: 'auto', label: 'Auto-detect' },
                { value: 'en', label: 'English' },
                { value: 'vi', label: 'Vietnamese' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {content.preferences.defaultTargetLang}
            </label>
            <UniversalDropdown
              value="vi"
              onChange={value => console.log('Target language changed:', value)}
              size="md"
              options={[
                { value: 'vi', label: 'Vietnamese' },
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="heading-4 text-gray-900 mb-4">
          {content.preferences.notifications}
        </h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              defaultChecked
            />
            <span className="ml-3 text-sm text-gray-700">
              {content.preferences.emailNotifications}
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              defaultChecked
            />
            <span className="ml-3 text-sm text-gray-700">
              {content.preferences.autoSave}
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}

// Account Tab Component
function AccountTab({ content }: { content: any }) {
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="heading-4 text-gray-900 mb-4">
          {content.account.subscription}
        </h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-gray-900">Premium Plan</p>
            <p className="text-sm text-gray-600">200 translations/month</p>
          </div>
          <button className="btn-primary">{content.account.upgrade}</button>
        </div>

        {/* Usage Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{content.account.usage}</span>
            <span>89 / 200</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: '45%' }}
            />
          </div>
        </div>
      </div>

      {/* Billing Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="heading-4 text-gray-900 mb-4">Billing Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">
              {content.account.billingCycle}
            </span>
            <span className="text-gray-900">Monthly</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{content.account.nextBilling}</span>
            <span className="text-gray-900">February 15, 2024</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Security Tab Component
function SecurityTab({ content }: { content: any }) {
  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="heading-4 text-gray-900 mb-4">
          {content.security.changePassword}
        </h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {content.security.currentPassword}
            </label>
            <input type="password" className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {content.security.newPassword}
            </label>
            <input type="password" className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {content.security.confirmPassword}
            </label>
            <input type="password" className="input-base" />
          </div>
          <button className="btn-primary">Update Password</button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="heading-4 text-gray-900 mb-4">
          {content.security.twoFactor}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-900">
              Two-factor authentication is disabled
            </p>
            <p className="text-sm text-gray-600">
              Add an extra layer of security to your account
            </p>
          </div>
          <button className="btn-secondary">Enable</button>
        </div>
      </div>
    </div>
  )
}

// Icon Components
function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  )
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  )
}

function CogIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  )
}

export default function Settings() {
  return <SettingsPage />
}
