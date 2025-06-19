import { Suspense } from 'react'
import { createServerComponentClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { verifyVNPayCallback } from '@/lib/payments/vnpay'
import PaymentResult from '@/components/payment/PaymentResult'

async function VNPayReturnContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createServerComponentClient({ cookies })
  const resolvedSearchParams = await searchParams
  
  // Convert searchParams to the format expected by verifyVNPayCallback
  const params: Record<string, any> = {}
  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    params[key] = Array.isArray(value) ? value[0] : value
  })

  const verification = verifyVNPayCallback(params)
  
  let transaction = null
  if (verification.orderId) {
    const { data } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', verification.orderId)
      .single()
    
    transaction = data
  }

  const isSuccess = verification.isValid && verification.responseCode === '00'
  
  return (
    <PaymentResult
      success={isSuccess}
      paymentMethod="vnpay"
      transaction={transaction}
      language="vi"
    />
  )
}

export default function VNPayReturn({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <Suspense fallback={<div>Đang xử lý kết quả thanh toán...</div>}>
      <VNPayReturnContent searchParams={searchParams} />
    </Suspense>
  )
}

export const metadata = {
  title: 'Kết quả thanh toán VNPay - Prismy',
  description: 'Kết quả thanh toán qua VNPay cho dịch vụ Prismy.',
}