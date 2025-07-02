import crypto from 'crypto'

// VNPay Configuration
const VNPAY_CONFIG = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || '',
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || '',
  vnp_Url:
    process.env.VNPAY_URL ||
    'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl:
    process.env.VNPAY_RETURN_URL ||
    'http://localhost:3000/payment/vnpay/return',
  vnp_IpnUrl:
    process.env.VNPAY_IPN_URL || 'http://localhost:3000/api/payments/vnpay/ipn',
}

// VNPay subscription plans in VND
export const VNPAY_SUBSCRIPTION_PLANS = {
  standard: {
    name: 'Gói Tiêu chuẩn',
    price: 239000, // ~$9.99 USD = 239,000 VND
    priceId: 'vnpay_standard',
    period: 'monthly',
    features: [
      '50 lượt dịch mỗi tháng',
      'Chất lượng dịch thuật nâng cao',
      'Dịch tài liệu',
      'Hỗ trợ qua email',
      'Lịch sử dịch thuật',
    ],
    limits: {
      translations: 50,
      documents: 10,
      characters: 50000,
    },
  },
  premium: {
    name: 'Gói Cao cấp',
    price: 719000, // ~$29.99 USD = 719,000 VND
    priceId: 'vnpay_premium',
    period: 'monthly',
    features: [
      '200 lượt dịch mỗi tháng',
      'Chất lượng chuyên nghiệp',
      'Không giới hạn tài liệu',
      'Hỗ trợ ưu tiên',
      'Phân tích nâng cao',
      'Cộng tác nhóm',
    ],
    limits: {
      translations: 200,
      documents: -1, // unlimited
      characters: 200000,
    },
  },
  enterprise: {
    name: 'Gói Doanh nghiệp',
    price: 2399000, // ~$99.99 USD = 2,399,000 VND
    priceId: 'vnpay_enterprise',
    period: 'monthly',
    features: [
      '1000 lượt dịch mỗi tháng',
      'Độ chính xác tối đa',
      'Không giới hạn mọi thứ',
      'Hỗ trợ chuyên biệt',
      'Tích hợp tùy chỉnh',
      'Đảm bảo SLA',
    ],
    limits: {
      translations: 1000,
      documents: -1, // unlimited
      characters: 1000000,
    },
  },
} as const

export type VNPaySubscriptionPlan = keyof typeof VNPAY_SUBSCRIPTION_PLANS

// Helper function to format VND price
export const formatVND = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}

// Helper function to sort parameters for VNPay
function sortObject(obj: Record<string, any>): Record<string, any> {
  const sorted: Record<string, any> = {}
  const keys = Object.keys(obj).sort()

  keys.forEach(key => {
    sorted[key] = obj[key]
  })

  return sorted
}

// Create VNPay payment URL
export function createVNPayPaymentUrl(
  orderId: string,
  amount: number,
  orderInfo: string,
  ipAddr: string,
  userId: string,
  planKey: string
): string {
  const date = new Date()
  const createDate = date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, '')
    .replace('T', '')

  let vnp_Params: Record<string, any> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: VNPAY_CONFIG.vnp_TmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: amount * 100, // VNPay expects amount in xu (1/100 VND)
    vnp_ReturnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
    vnp_IpnUrl: VNPAY_CONFIG.vnp_IpnUrl,
    vnp_CreateDate: createDate,
    vnp_BankCode: '', // Let user choose payment method
    vnp_ExpireDate: '', // Optional
  }

  // Add custom fields for our application
  vnp_Params = {
    ...vnp_Params,
    vnp_Bill_Mobile: '',
    vnp_Bill_Email: '',
    vnp_Bill_FirstName: '',
    vnp_Bill_LastName: '',
    vnp_Bill_Address: '',
    vnp_Bill_City: '',
    vnp_Bill_Country: 'VN',
    vnp_Inv_Phone: '',
    vnp_Inv_Email: '',
    vnp_Inv_Customer: '',
    vnp_Inv_Address: '',
    vnp_Inv_Company: '',
    vnp_Inv_Taxcode: '',
    vnp_Inv_Type: '',
  }

  // Sort parameters
  vnp_Params = sortObject(vnp_Params)

  // Create query string
  const signData = new URLSearchParams(vnp_Params).toString()

  // Create secure hash
  const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret)
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

  vnp_Params.vnp_SecureHash = signed

  // Build final URL
  const paymentUrl =
    VNPAY_CONFIG.vnp_Url + '?' + new URLSearchParams(vnp_Params).toString()

  return paymentUrl
}

// Verify VNPay callback
export function verifyVNPayCallback(vnp_Params: Record<string, any>): {
  isValid: boolean
  responseCode: string
  transactionId: string
  orderId: string
  amount: number
} {
  const secureHash = vnp_Params.vnp_SecureHash
  delete vnp_Params.vnp_SecureHash
  delete vnp_Params.vnp_SecureHashType

  // Sort parameters
  const sortedParams = sortObject(vnp_Params)
  const signData = new URLSearchParams(sortedParams).toString()

  // Verify signature
  const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret)
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

  const isValid = signed === secureHash

  return {
    isValid,
    responseCode: vnp_Params.vnp_ResponseCode,
    transactionId: vnp_Params.vnp_TransactionNo,
    orderId: vnp_Params.vnp_TxnRef,
    amount: parseInt(vnp_Params.vnp_Amount) / 100, // Convert from xu to VND
  }
}

// Generate unique order ID
export function generateOrderId(userId: string, planKey: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `PRISMY_${userId.substring(0, 8)}_${planKey}_${timestamp}_${random}`.toUpperCase()
}

// Get plan by price ID
export const getVNPayPlanByPriceId = (
  priceId: string
): VNPaySubscriptionPlan | null => {
  for (const [key, plan] of Object.entries(VNPAY_SUBSCRIPTION_PLANS)) {
    if (plan.priceId === priceId) {
      return key as VNPaySubscriptionPlan
    }
  }
  return null
}
