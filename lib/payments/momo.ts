import crypto from 'crypto'

// MoMo Configuration
const MOMO_CONFIG = {
  partnerCode: process.env.MOMO_PARTNER_CODE || '',
  accessKey: process.env.MOMO_ACCESS_KEY || '',
  secretKey: process.env.MOMO_SECRET_KEY || '',
  endpoint:
    process.env.MOMO_ENDPOINT ||
    'https://test-payment.momo.vn/v2/gateway/api/create',
  redirectUrl:
    process.env.MOMO_REDIRECT_URL ||
    'http://localhost:3000/payment/momo/return',
  ipnUrl:
    process.env.MOMO_IPN_URL || 'http://localhost:3000/api/payments/momo/ipn',
}

// MoMo subscription plans in VND (same as VNPay)
export const MOMO_SUBSCRIPTION_PLANS = {
  standard: {
    name: 'Gói Tiêu chuẩn',
    price: 239000, // ~$9.99 USD = 239,000 VND
    priceId: 'momo_standard',
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
    priceId: 'momo_premium',
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
    priceId: 'momo_enterprise',
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

export type MoMoSubscriptionPlan = keyof typeof MOMO_SUBSCRIPTION_PLANS

// Create MoMo payment request
export async function createMoMoPayment(
  orderId: string,
  amount: number,
  orderInfo: string,
  userId: string,
  planKey: string
): Promise<{
  success: boolean
  payUrl?: string
  error?: string
  qrCodeUrl?: string
  deeplink?: string
}> {
  try {
    const requestId = orderId
    const extraData = JSON.stringify({ userId, planKey })
    const orderGroupId = ''
    const autoCapture = true
    const lang = 'vi'

    // Create raw signature
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${MOMO_CONFIG.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${MOMO_CONFIG.redirectUrl}&requestId=${requestId}&requestType=payWithMethod`

    // Create signature
    const signature = crypto
      .createHmac('sha256', MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest('hex')

    const requestBody = {
      partnerCode: MOMO_CONFIG.partnerCode,
      partnerName: 'Prismy',
      storeId: 'MomoTestStore',
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: MOMO_CONFIG.redirectUrl,
      ipnUrl: MOMO_CONFIG.ipnUrl,
      lang: lang,
      requestType: 'payWithMethod',
      autoCapture: autoCapture,
      extraData: extraData,
      orderGroupId: orderGroupId,
      signature: signature,
    }

    const response = await fetch(MOMO_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const result = await response.json()

    if (result.resultCode === 0) {
      return {
        success: true,
        payUrl: result.payUrl,
        qrCodeUrl: result.qrCodeUrl,
        deeplink: result.deeplink,
      }
    } else {
      return {
        success: false,
        error: result.message || 'Tạo thanh toán MoMo thất bại',
      }
    }
  } catch (error) {
    console.error('MoMo payment creation error:', error)
    return {
      success: false,
      error: 'Lỗi kết nối với MoMo',
    }
  }
}

// Verify MoMo callback
export function verifyMoMoCallback(body: any): {
  isValid: boolean
  resultCode: number
  orderId: string
  amount: number
  transId: string
  extraData: any
} {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = body

    // Create raw signature for verification
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest('hex')

    const isValid = signature === expectedSignature

    let parsedExtraData = {}
    try {
      parsedExtraData = JSON.parse(extraData || '{}')
    } catch (e) {
      // Ignore JSON parse errors
    }

    return {
      isValid,
      resultCode: parseInt(resultCode),
      orderId,
      amount: parseInt(amount),
      transId,
      extraData: parsedExtraData,
    }
  } catch (error) {
    console.error('MoMo callback verification error:', error)
    return {
      isValid: false,
      resultCode: -1,
      orderId: '',
      amount: 0,
      transId: '',
      extraData: {},
    }
  }
}

// Generate unique order ID for MoMo
export function generateMoMoOrderId(userId: string, planKey: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 6)
  return `MM${timestamp}${random}`.toUpperCase()
}

// Get plan by price ID
export const getMoMoPlanByPriceId = (
  priceId: string
): MoMoSubscriptionPlan | null => {
  for (const [key, plan] of Object.entries(MOMO_SUBSCRIPTION_PLANS)) {
    if (plan.priceId === priceId) {
      return key as MoMoSubscriptionPlan
    }
  }
  return null
}

// Helper function to format VND price (same as VNPay)
export const formatVND = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}
