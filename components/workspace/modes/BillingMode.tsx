'use client'

import { motion } from 'framer-motion'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'
import {
  CreditCard,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Plus,
  Eye,
} from 'lucide-react'

interface BillingModeProps {
  language: 'vi' | 'en'
}

export default function BillingMode({ language }: BillingModeProps) {
  const content = {
    vi: {
      title: 'Thanh toán & Sử dụng',
      subtitle: 'Quản lý thanh toán và theo dõi sử dụng dịch vụ',
      currentPlan: {
        title: 'Gói hiện tại',
        name: 'Professional',
        price: '299,000 VNĐ/tháng',
        nextBilling: 'Thanh toán tiếp theo: 15/02/2024',
        change: 'Đổi gói',
        cancel: 'Hủy gói',
      },
      usage: {
        title: 'Sử dụng tháng này',
        documents: 'Tài liệu đã xử lý',
        words: 'Từ đã dịch',
        api: 'Lượt gọi API',
        storage: 'Dung lượng sử dụng',
      },
      paymentMethod: {
        title: 'Phương thức thanh toán',
        add: 'Thêm thẻ',
        default: 'Mặc định',
      },
      invoices: {
        title: 'Hóa đơn',
        download: 'Tải xuống',
        view: 'Xem',
      },
    },
    en: {
      title: 'Billing & Usage',
      subtitle: 'Manage payments and track service usage',
      currentPlan: {
        title: 'Current Plan',
        name: 'Professional',
        price: '$12.99/month',
        nextBilling: 'Next billing: Feb 15, 2024',
        change: 'Change Plan',
        cancel: 'Cancel Plan',
      },
      usage: {
        title: 'This Month Usage',
        documents: 'Documents Processed',
        words: 'Words Translated',
        api: 'API Calls',
        storage: 'Storage Used',
      },
      paymentMethod: {
        title: 'Payment Methods',
        add: 'Add Card',
        default: 'Default',
      },
      invoices: {
        title: 'Invoices',
        download: 'Download',
        view: 'View',
      },
    },
  }

  const usageData = [
    {
      label: content[language].usage.documents,
      used: 2847,
      limit: 5000,
      unit: '',
      icon: Download,
    },
    {
      label: content[language].usage.words,
      used: 890000,
      limit: 1000000,
      unit: '',
      icon: TrendingUp,
    },
    {
      label: content[language].usage.api,
      used: 12450,
      limit: 50000,
      unit: '',
      icon: RefreshCw,
    },
    {
      label: content[language].usage.storage,
      used: 15.6,
      limit: 100,
      unit: 'GB',
      icon: DollarSign,
    },
  ]

  const invoices = [
    {
      id: 'INV-2024-001',
      date: '2024-01-15',
      amount: language === 'vi' ? '299,000 VNĐ' : '$12.99',
      status: 'paid',
      description: 'Professional Plan - January 2024',
    },
    {
      id: 'INV-2023-012',
      date: '2023-12-15',
      amount: language === 'vi' ? '299,000 VNĐ' : '$12.99',
      status: 'paid',
      description: 'Professional Plan - December 2023',
    },
    {
      id: 'INV-2023-011',
      date: '2023-11-15',
      amount: language === 'vi' ? '299,000 VNĐ' : '$12.99',
      status: 'paid',
      description: 'Professional Plan - November 2023',
    },
  ]

  return (
    <div className="h-full p-6">
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div variants={motionSafe(slideUp)}>
          <h2 className="heading-2 text-gray-900 mb-4">
            {content[language].title}
          </h2>
          <p className="body-lg text-gray-600">{content[language].subtitle}</p>
        </motion.div>

        {/* Current Plan & Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Plan */}
          <motion.div
            variants={motionSafe(slideUp)}
            className="bg-white rounded-3xl border border-border-subtle p-6"
          >
            <h3 className="heading-4 text-gray-900 mb-6">
              {content[language].currentPlan.title}
            </h3>
            <div className="text-center mb-6">
              <div className="heading-2 text-gray-900 mb-2">
                {content[language].currentPlan.name}
              </div>
              <div className="body-lg text-blue-600 font-medium mb-4">
                {content[language].currentPlan.price}
              </div>
              <div className="body-sm text-gray-500">
                {content[language].currentPlan.nextBilling}
              </div>
            </div>
            <div className="space-y-3">
              <button className="w-full btn-secondary btn-pill-compact-md">
                {content[language].currentPlan.change}
              </button>
              <button className="w-full border border-red-200 text-red-600 hover:bg-red-50 rounded-full py-2 px-4 body-sm transition-colors">
                {content[language].currentPlan.cancel}
              </button>
            </div>
          </motion.div>

          {/* Usage Statistics */}
          <motion.div
            variants={motionSafe(slideUp)}
            className="lg:col-span-2 bg-white rounded-3xl border border-border-subtle p-6"
          >
            <h3 className="heading-4 text-gray-900 mb-6">
              {content[language].usage.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {usageData.map((item, index) => {
                const IconComponent = item.icon
                const percentage = (item.used / item.limit) * 100

                return (
                  <div
                    key={index}
                    className="p-4 border border-border-subtle rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <IconComponent size={20} className="text-gray-600" />
                      <span className="body-xs text-gray-500">
                        {item.used.toLocaleString()}
                        {item.unit} / {item.limit.toLocaleString()}
                        {item.unit}
                      </span>
                    </div>
                    <div className="body-sm font-medium text-gray-900 mb-2">
                      {item.label}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percentage > 80
                            ? 'bg-red-500'
                            : percentage > 60
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="body-xs text-gray-500 mt-1">
                      {percentage.toFixed(1)}%{' '}
                      {language === 'vi' ? 'đã sử dụng' : 'used'}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Payment Methods & Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Methods */}
          <motion.div
            variants={motionSafe(slideUp)}
            className="bg-white rounded-3xl border border-border-subtle p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="heading-4 text-gray-900">
                {content[language].paymentMethod.title}
              </h3>
              <button className="btn-secondary btn-pill-compact-md">
                <Plus size={16} className="mr-2" />
                {content[language].paymentMethod.add}
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center p-4 border border-border-subtle rounded-2xl">
                <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center mr-4">
                  <CreditCard size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="body-sm font-medium text-gray-900">
                    •••• 4242
                  </div>
                  <div className="body-xs text-gray-500">Expires 12/26</div>
                </div>
                <div className="flex items-center">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full body-xs mr-3">
                    {content[language].paymentMethod.default}
                  </span>
                  <CheckCircle size={16} className="text-green-500" />
                </div>
              </div>

              <div className="flex items-center p-4 border border-border-subtle rounded-2xl opacity-50">
                <div className="w-12 h-8 bg-gray-400 rounded flex items-center justify-center mr-4">
                  <CreditCard size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="body-sm font-medium text-gray-600">
                    •••• 8888
                  </div>
                  <div className="body-xs text-gray-400">Expires 09/25</div>
                </div>
                <AlertCircle size={16} className="text-gray-400" />
              </div>
            </div>
          </motion.div>

          {/* Recent Invoices */}
          <motion.div
            variants={motionSafe(slideUp)}
            className="bg-white rounded-3xl border border-border-subtle p-6"
          >
            <h3 className="heading-4 text-gray-900 mb-6">
              {content[language].invoices.title}
            </h3>

            <div className="space-y-4">
              {invoices.map((invoice, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border-subtle rounded-2xl"
                >
                  <div className="flex-1">
                    <div className="body-sm font-medium text-gray-900">
                      {invoice.id}
                    </div>
                    <div className="body-xs text-gray-500">
                      {invoice.description}
                    </div>
                    <div className="body-xs text-gray-400">{invoice.date}</div>
                  </div>
                  <div className="text-right mr-4">
                    <div className="body-sm font-medium text-gray-900">
                      {invoice.amount}
                    </div>
                    <div className="flex items-center justify-end mt-1">
                      <CheckCircle size={14} className="text-green-500 mr-1" />
                      <span className="body-xs text-green-600">
                        {language === 'vi' ? 'Đã thanh toán' : 'Paid'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Eye size={16} className="text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Download size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 p-3 border border-border-subtle rounded-2xl hover:bg-gray-50 transition-colors body-sm text-gray-600">
              {language === 'vi' ? 'Xem tất cả hóa đơn' : 'View all invoices'}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
